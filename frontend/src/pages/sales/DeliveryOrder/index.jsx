import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;

function statusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã giao (đã xuất kho)</Tag>;
  return <Tag color="gold">Chờ giao</Tag>;
}

// Don giao hang (DO) - tach rieng khoi Don hang ban (SO) theo dung chuoi DMS goc SO -> DO -> Xac
// nhan DO. Trang nay: tao/sua/xoa lenh giao (chi khi con DRAFT) - viec Xac nhan (tru kho that) lam
// o trang rieng "Xac nhan giao hang" (/sales/delivery-confirm), giong pattern 2 man hinh khac vai
// cua Goods Receipt PO Confirmation trong DMS that - xem backend/.../sales/service/DeliveryOrderService.java.
export default function DeliveryOrderPage() {
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [form] = Form.useForm();

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  // Chi cho tao DO tu don da duyet (CONFIRMED) va chua co DO nao - danh sach nay tu dong loai bo
  // dan cac don da co DO khi bam Them.
  const usedSalesOrderIds = new Set(deliveryOrders.map((d) => d.salesOrder.id));
  const availableSalesOrders = salesOrders.filter((o) => o.status === 'CONFIRMED' && !usedSalesOrderIds.has(o.id));
  // Khi sua DO da co, Don hang ban cua no bi loai khoi availableSalesOrders (vi da "used") nen
  // phai them rieng option cua chinh no vao, khong thi Select khong tra duoc label va hien thang ID so.
  const editingSalesOrderOption = editingOrder
    ? { value: editingOrder.salesOrder.id, label: `${editingOrder.salesOrder.docNumber} - ${editingOrder.salesOrder.customer?.name || ''}` }
    : null;
  const salesOrderOptions = [
    ...availableSalesOrders.map((o) => ({ value: o.id, label: `${o.docNumber} - ${o.customer?.name || ''}` })),
    ...(editingSalesOrderOption ? [editingSalesOrderOption] : []),
  ];

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/delivery-orders'),
      axiosClient.get('/sales-orders'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ])
      .then(([doRes, soRes, whRes, prodRes]) => {
        setDeliveryOrders(doRes.data.data);
        setSalesOrders(soRes.data.data);
        setWarehouses(whRes.data.data);
        setProducts(prodRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu đơn giao hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = deliveryOrders.filter((d) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return d.docNumber.toLowerCase().includes(keyword) || d.salesOrder.docNumber.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingOrder(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      salesOrderId: record.salesOrder.id,
      warehouseId: record.warehouse.id,
      remarks: record.remarks,
    });
    setDetailRows(record.items.map((d) => ({ id: d.id, productId: d.product.id, uomId: d.uom?.id, uomName: d.uom?.name, quantity: d.quantity, orderedQty: d.quantity, note: d.note })));
    setModalOpen(true);
  }

  // Chon Don hang ban goc -> tu dong dien San pham + kho xuat + so luong DA DAT, cho sua lai
  // truoc khi Luu de phan anh so luong giao thuc te (VD giao thieu do het hang).
  function handleSalesOrderSelect(salesOrderId) {
    const order = salesOrders.find((o) => o.id === salesOrderId);
    if (!order) return;
    form.setFieldsValue({ warehouseId: order.warehouse?.id });
    setDetailRows(
      order.details.map((d) => ({
        id: d.id,
        productId: d.product.id,
        uomId: d.uom?.id,
        uomName: d.uom?.name,
        quantity: d.quantity,
        orderedQty: d.quantity,
      }))
    );
  }

  function handleQuantityChange(id, value) {
    setDetailRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity: value } : r)));
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/delivery-orders/${record.id}`)
      .then(() => {
        message.success('Đã xóa đơn giao hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (detailRows.length === 0) {
        message.error('Đơn giao hàng phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({ productId: d.productId, uomId: d.uomId, quantity: d.quantity })),
      };
      const request = editingOrder
        ? axiosClient.put(`/delivery-orders/${editingOrder.id}`, payload)
        : axiosClient.post('/delivery-orders', payload);
      request
        .then(() => {
          message.success(editingOrder ? 'Cập nhật thành công' : 'Tạo đơn giao hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Số đơn giao', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày lập', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Đơn hàng bán', key: 'salesOrder', render: (_, r) => r.salesOrder?.docNumber },
    { title: 'Khách hàng', key: 'customer', render: (_, r) => r.salesOrder?.customer?.name },
    { title: 'Kho xuất', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const isDraft = record.status === 'DRAFT';
        return (
          <Space>
            <Button icon={<EditOutlined />} disabled={!isDraft} onClick={() => openEditModal(record)} />
            <Popconfirm title="Xóa đơn giao hàng này?" disabled={!isDraft} onConfirm={() => handleDelete(record)}>
              <Button icon={<DeleteOutlined />} danger disabled={!isDraft} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'ĐVT', dataIndex: 'uomName', key: 'uomName', render: (v) => v || '-' },
    { title: 'Số lượng đặt', dataIndex: 'orderedQty', key: 'orderedQty', align: 'right' },
    {
      title: 'Số lượng giao thực tế',
      key: 'quantity',
      render: (_, d) => (
        <InputNumber
          min={0}
          max={d.orderedQty}
          value={d.quantity}
          onChange={(v) => handleQuantityChange(d.id, v)}
          style={{ width: '100%' }}
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Đơn giao hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số đơn giao hoặc số đơn bán..."
        onAdd={openCreateModal}
        addTooltip="Tạo đơn giao hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingOrder ? `Sửa đơn giao hàng ${editingOrder.docNumber}` : 'Tạo đơn giao hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số đơn giao" name="docNumber" extra={editingOrder ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingOrder} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày lập" name="docDate" rules={[{ required: true, message: 'Ngày lập không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đơn hàng bán" name="salesOrderId" rules={[{ required: true, message: 'Chọn đơn hàng bán không được để trống' }]}>
                <Select
                  options={salesOrderOptions}
                  placeholder="Chọn đơn hàng đã duyệt"
                  disabled={!!editingOrder}
                  showSearch
                  optionFilterProp="label"
                  onChange={handleSalesOrderSelect}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Kho xuất"
                name="warehouseId"
                rules={[{ required: true, message: 'Kho xuất không được để trống' }]}
                extra="Luôn lấy đúng kho của Đơn hàng bán gốc - không chọn kho khác được"
              >
                <Select options={warehouseOptions} placeholder="Chọn Đơn hàng bán trước" disabled />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="remarks">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Text strong>Số lượng giao (mặc định lấy theo số lượng đặt - sửa lại nếu giao thiếu)</Text>
        <Table
          rowKey="id"
          size="small"
          columns={detailColumns}
          dataSource={detailRows}
          pagination={false}
          style={{ marginTop: 8 }}
          locale={{ emptyText: 'Chọn đơn hàng bán ở trên để hiện danh sách sản phẩm' }}
        />
      </Modal>
    </div>
  );
}
