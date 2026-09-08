import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';

const { Title, Text } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa/duyet
// dot kiem ke, SALES_STAFF chi duoc xem (GET).
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Trang nay da noi API that (khong con mock) - xem backend/.../inventory/controller/StockTakeController.java.
// Luu y: khong con can nhap tay "Ton he thong" - backend tu tinh tu bang stock hien tai
// ngay luc tao dong chi tiet (xem StockTakeService.applyDto).
export default function StockCountingPage() {
  const [counts, setCounts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCount, setEditingCount] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/stock-takes'), axiosClient.get('/warehouses'), axiosClient.get('/products')])
      .then(([countsRes, warehousesRes, productsRes]) => {
        setCounts(countsRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setProducts(productsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu kiểm kê'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredCounts = counts.filter((c) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return c.code.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingCount(null);
    form.resetFields();
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingCount(record);
    form.setFieldsValue({ code: record.code, warehouseId: record.warehouse?.id });
    setDetailRows(
      record.details.map((d) => ({
        id: d.id,
        productId: d.product.id,
        systemQuantity: d.systemQuantity,
        actualQuantity: d.actualQuantity,
      }))
    );
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/stock-takes/${record.id}`)
      .then(() => {
        message.success('Đã xóa đợt kiểm kê');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleApprove(record) {
    axiosClient
      .post(`/stock-takes/${record.id}/approve`)
      .then(() => {
        message.success('Đã duyệt đợt kiểm kê - ghi nhận chênh lệch vào tồn kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Duyệt thất bại'));
  }

  function handleAddDetailRow() {
    if (!form.getFieldValue('warehouseId')) {
      message.warning('Chọn kho kiểm kê trước khi thêm sản phẩm');
      return;
    }
    detailForm.resetFields();
    setDetailModalOpen(true);
  }

  function handleSubmitDetailRow() {
    detailForm.validateFields().then((values) => {
      setDetailRows((prev) => [...prev, { id: Date.now(), ...values }]);
      setDetailModalOpen(false);
    });
  }

  function handleRemoveDetailRow(id) {
    setDetailRows((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (detailRows.length === 0) {
        message.error('Đợt kiểm kê phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        details: detailRows.map((d) => ({ productId: d.productId, actualQuantity: d.actualQuantity })),
      };
      const request = editingCount
        ? axiosClient.put(`/stock-takes/${editingCount.id}`, payload)
        : axiosClient.post('/stock-takes', payload);
      request
        .then(() => {
          message.success(editingCount ? 'Cập nhật thành công' : 'Tạo đợt kiểm kê thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã đợt kiểm kê', dataIndex: 'code', key: 'code' },
    { title: 'Kho', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    { title: 'Số dòng sản phẩm', key: 'lineCount', render: (_, r) => (r.details || []).length },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'APPROVED' ? <Tag color="green">Đã duyệt</Tag> : <Tag color="gold">Nháp</Tag>),
    },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => {
              const isDraft = record.status === 'DRAFT';
              return (
                <Space>
                  <Button icon={<EditOutlined />} disabled={!isDraft} onClick={() => openEditModal(record)} />
                  {isDraft && (
                    <Popconfirm
                      title="Duyệt đợt kiểm kê này?"
                      description="Sau khi duyệt sẽ ghi nhận chênh lệch vào tồn kho và không thể sửa/xoá."
                      onConfirm={() => handleApprove(record)}
                    >
                      <Button icon={<CheckOutlined />} type="primary" ghost />
                    </Popconfirm>
                  )}
                  <Popconfirm title="Xóa đợt kiểm kê này?" disabled={!isDraft} onConfirm={() => handleDelete(record)}>
                    <Button icon={<DeleteOutlined />} danger disabled={!isDraft} />
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]
      : []),
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'Tồn hệ thống', dataIndex: 'systemQuantity', key: 'systemQuantity', align: 'right' },
    { title: 'Tồn thực tế', dataIndex: 'actualQuantity', key: 'actualQuantity', align: 'right' },
    {
      title: 'Chênh lệch',
      key: 'difference',
      align: 'right',
      render: (_, d) => {
        const diff = Number(d.actualQuantity) - Number(d.systemQuantity);
        return <Text type={diff === 0 ? undefined : diff > 0 ? 'success' : 'danger'}>{diff > 0 ? `+${diff}` : diff}</Text>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleRemoveDetailRow(record.id)} />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Kiểm kê kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã đợt kiểm kê..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm đợt kiểm kê"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredCounts} loading={loading} />

      <Modal
        title={editingCount ? `Sửa đợt kiểm kê ${editingCount.code}` : 'Thêm đợt kiểm kê'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã đợt kiểm kê" name="code" extra={editingCount ? undefined : 'Để trống để tự sinh mã'}>
            <Input disabled={!!editingCount} placeholder="Tự sinh nếu để trống" />
          </Form.Item>
          <Form.Item label="Kho kiểm kê" name="warehouseId" rules={[{ required: true, message: 'Kho kiểm kê không được để trống' }]}>
            <Select options={warehouseOptions} placeholder="Chọn kho" disabled={!!editingCount} />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Danh sách sản phẩm kiểm kê</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddDetailRow}>
            Thêm sản phẩm
          </Button>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Tồn hệ thống sẽ tự động lấy theo tồn kho hiện tại lúc lưu, không cần nhập tay.
        </Text>
        <Table
          rowKey="id"
          size="small"
          columns={detailColumns}
          dataSource={detailRows}
          pagination={false}
          locale={{ emptyText: 'Không có dữ liệu' }}
          style={{ marginTop: 8 }}
        />
      </Modal>

      <Modal
        title="Thêm sản phẩm kiểm kê"
        open={detailModalOpen}
        onOk={handleSubmitDetailRow}
        onCancel={() => setDetailModalOpen(false)}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={productOptions} placeholder="Chọn sản phẩm" />
          </Form.Item>
          <Form.Item
            label="Tồn thực tế đếm được"
            name="actualQuantity"
            rules={[{ required: true, message: 'Tồn thực tế không được để trống' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
