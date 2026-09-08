import { useEffect, useState } from 'react';
import { Typography, Button, Table, Tag, Space, Modal, Form, Select, InputNumber, Popconfirm, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';

const { Title, Text } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua nguong va
// danh dau xu ly, SALES_STAFF chi duoc xem (GET).
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// INV-05: canh bao san pham sap het hang - xem backend/.../inventory/controller/StockAlertController.java.
// "Ton hien tai" khong nam trong entity StockAlert (chi luu nguong min_quantity) - lay song song
// tu GET /api/stock roi ghep theo product+warehouse, giong cach tinh "Da dat hang" o trang Bao cao ton kho.
export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [form] = Form.useForm();

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/stock-alerts'),
      axiosClient.get('/stock'),
      axiosClient.get('/products'),
      axiosClient.get('/warehouses'),
    ])
      .then(([alertsRes, stockRes, productsRes, warehousesRes]) => {
        setAlerts(alertsRes.data.data);
        setStockRows(stockRes.data.data);
        setProducts(productsRes.data.data);
        setWarehouses(warehousesRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu cảnh báo tồn kho'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  function currentQuantityOf(productId, warehouseId) {
    const row = stockRows.find((s) => s.product.id === productId && s.warehouse.id === warehouseId);
    return row ? Number(row.quantity) : 0;
  }

  const filteredAlerts = alerts.filter((a) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return a.product.code.toLowerCase().includes(keyword) || a.product.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingAlert(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingAlert(record);
    form.setFieldsValue({
      productId: record.product.id,
      warehouseId: record.warehouse.id,
      minQuantity: record.minQuantity,
    });
    setModalOpen(true);
  }

  function handleResolve(record) {
    axiosClient
      .put(`/stock-alerts/${record.id}/resolve`)
      .then(() => {
        message.success(`Đã xử lý cảnh báo cho ${record.product.code} - ${record.product.name} tại ${record.warehouse.name}`);
        loadData();
        window.dispatchEvent(new Event('stock-alert-changed'));
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingAlert
        ? axiosClient.put(`/stock-alerts/${editingAlert.id}`, values)
        : axiosClient.post('/stock-alerts', values);
      request
        .then(() => {
          message.success(editingAlert ? 'Cập nhật ngưỡng thành công' : 'Tạo ngưỡng cảnh báo thành công');
          setModalOpen(false);
          loadData();
          window.dispatchEvent(new Event('stock-alert-changed'));
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã SP', dataIndex: ['product', 'code'], key: 'productCode' },
    { title: 'Tên SP', dataIndex: ['product', 'name'], key: 'productName' },
    { title: 'Kho', dataIndex: ['warehouse', 'name'], key: 'warehouse' },
    {
      title: 'Tồn hiện tại',
      key: 'currentQuantity',
      align: 'right',
      render: (_, r) => currentQuantityOf(r.product.id, r.warehouse.id).toLocaleString('vi-VN'),
    },
    {
      title: 'Ngưỡng tối thiểu',
      dataIndex: 'minQuantity',
      key: 'minQuantity',
      align: 'right',
      render: (v) => Number(v).toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, r) => {
        if (r.status !== 'ACTIVE') return <Tag color="green">Đã xử lý</Tag>;
        const qty = currentQuantityOf(r.product.id, r.warehouse.id);
        return qty <= 0 ? <Tag color="red">Hết hàng</Tag> : <Tag color="orange">Sắp hết hàng</Tag>;
      },
    },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button size="small" onClick={() => openEditModal(record)}>
                  Sửa ngưỡng
                </Button>
                {record.status === 'ACTIVE' && (
                  <Popconfirm
                    title="Đánh dấu đã xử lý cảnh báo?"
                    description={`Sản phẩm ${record.product.code} - ${record.product.name} tại ${record.warehouse.name}`}
                    onConfirm={() => handleResolve(record)}
                  >
                    <Button size="small" icon={<CheckOutlined />} type="primary" ghost>
                      Đã xử lý
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Title level={3}>Cảnh báo tồn kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm ngưỡng cảnh báo"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredAlerts} loading={loading} />

      <Modal
        title={editingAlert ? 'Sửa ngưỡng cảnh báo' : 'Thêm ngưỡng cảnh báo'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Text type="secondary">
          Khi tồn kho của sản phẩm tại kho này giảm xuống bằng hoặc dưới ngưỡng, hệ thống tự động cảnh báo.
        </Text>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={productOptions} placeholder="Chọn sản phẩm" disabled={!!editingAlert} />
          </Form.Item>
          <Form.Item label="Kho" name="warehouseId" rules={[{ required: true, message: 'Kho không được để trống' }]}>
            <Select options={warehouseOptions} placeholder="Chọn kho" disabled={!!editingAlert} />
          </Form.Item>
          <Form.Item
            label="Ngưỡng tối thiểu"
            name="minQuantity"
            rules={[{ required: true, message: 'Ngưỡng tối thiểu không được để trống' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
