import { useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';

const { Title, Text } = Typography;

// Khop voi du lieu mock o pages/customers, pages/warehouses, pages/category/Product de dong bo giua cac module.
const CUSTOMER_OPTIONS = [
  { value: 'KH00001', label: 'KH00001 - Cửa Hàng Tạp Hóa Minh Anh' },
  { value: 'KH00002', label: 'KH00002 - Siêu Thị Mini Thành Phát' },
  { value: 'KH00003', label: 'KH00003 - Chi Nhánh Thành Phát 2' },
];

const WAREHOUSE_OPTIONS = [
  { value: 'Q1MWH01', label: 'Q1MWH01 - Kho chính Quận 1' },
  { value: 'Q1VWH01', label: 'Q1VWH01 - Kho xe tải Quận 1' },
  { value: 'TBDWH01', label: 'TBDWH01 - Kho hàng lỗi Tân Bình' },
  { value: 'TBCWH01', label: 'TBCWH01 - Kho ký gửi Tân Bình' },
];

const PRODUCT_OPTIONS = [
  { value: 'SP001', label: 'SP001 - Nước ngọt Cola lon 330ml', price: 180000 },
  { value: 'SP002', label: 'SP002 - Nước suối 500ml', price: 90000 },
  { value: 'SP003', label: 'SP003 - Cá hộp sốt cà', price: 25000 },
  { value: 'SP004', label: 'SP004 - Bánh quy bơ', price: 15000 },
  { value: 'SP005', label: 'SP005 - Kẹo dẻo trái cây', price: 32000 },
];

function optionLabel(options, code) {
  return options.find((o) => o.value === code)?.label || code;
}

function productPrice(code) {
  return PRODUCT_OPTIONS.find((o) => o.value === code)?.price || 0;
}

function statusTag(status) {
  if (status === 'CONFIRMED') return <Tag color="green">Đã xuất kho</Tag>;
  if (status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
  return <Tag color="gold">Chờ xác nhận</Tag>;
}

// Du lieu mau (100% mock, khong goi API that, khong lay ten/dia chi khach hang that tu ui-reference/) -
// field khop dung schema that trong backend/.../db/migration/V4__sales.sql (doc_number, doc_date,
// customer_id, warehouse_id, status PENDING/CONFIRMED/CANCELLED, total_amount). Backend chua co
// SalesOrderController/Service (chi co bang trong SQL), se noi API sau.
const INITIAL_ORDERS = [
  {
    id: 1,
    docNumber: 'SO0001',
    docDate: '2026-08-22',
    customerCode: 'KH00001',
    warehouseCode: 'Q1MWH01',
    status: 'CONFIRMED',
    details: [
      { id: 1, productCode: 'SP001', quantity: 20, unitPrice: 180000, amount: 3600000 },
      { id: 2, productCode: 'SP004', quantity: 30, unitPrice: 15000, amount: 450000 },
    ],
  },
  {
    id: 2,
    docNumber: 'SO0002',
    docDate: '2026-08-26',
    customerCode: 'KH00002',
    warehouseCode: 'Q1MWH01',
    status: 'PENDING',
    details: [{ id: 1, productCode: 'SP002', quantity: 40, unitPrice: 90000, amount: 3600000 }],
  },
  {
    id: 3,
    docNumber: 'SO0003',
    docDate: '2026-08-24',
    customerCode: 'KH00003',
    warehouseCode: 'TBDWH01',
    status: 'CANCELLED',
    details: [{ id: 1, productCode: 'SP005', quantity: 10, unitPrice: 32000, amount: 320000 }],
  },
];

function totalAmountOf(order) {
  return (order.details || []).reduce((sum, d) => sum + Number(d.amount || 0), 0);
}

export default function SalesOrderPage() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const filteredOrders = orders.filter((o) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return (
      o.docNumber.toLowerCase().includes(keyword) ||
      optionLabel(CUSTOMER_OPTIONS, o.customerCode).toLowerCase().includes(keyword)
    );
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
    form.setFieldsValue(record);
    setDetailRows(record.details || []);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setOrders((prev) => prev.filter((o) => o.id !== record.id));
    message.success('Đã xóa đơn hàng');
  }

  function handleConfirmOrder(record) {
    setOrders((prev) => prev.map((o) => (o.id === record.id ? { ...o, status: 'CONFIRMED' } : o)));
    message.success('Đã xác nhận đơn hàng - xuất kho');
  }

  function handleCancelOrder(record) {
    setOrders((prev) => prev.map((o) => (o.id === record.id ? { ...o, status: 'CANCELLED' } : o)));
    message.success('Đã hủy đơn hàng');
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setDetailModalOpen(true);
  }

  function handleSubmitDetailRow() {
    detailForm.validateFields().then((values) => {
      const amount = (values.quantity || 0) * (values.unitPrice || 0);
      setDetailRows((prev) => [...prev, { id: Date.now(), ...values, amount }]);
      setDetailModalOpen(false);
    });
  }

  function handleRemoveDetailRow(id) {
    setDetailRows((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingOrder) {
        setOrders((prev) =>
          prev.map((o) => (o.id === editingOrder.id ? { ...o, ...values, details: detailRows } : o))
        );
        message.success('Cập nhật thành công');
      } else {
        const newOrder = {
          id: Date.now(),
          docNumber: values.docNumber || `SO${String(orders.length + 1).padStart(4, '0')}`,
          status: 'PENDING',
          ...values,
          details: detailRows,
        };
        setOrders((prev) => [newOrder, ...prev]);
        message.success('Tạo đơn hàng thành công');
      }
      setModalOpen(false);
    });
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  const totalAmount = detailRows.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const columns = [
    { title: 'Số đơn', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày đặt hàng', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Khách hàng', key: 'customer', render: (_, o) => optionLabel(CUSTOMER_OPTIONS, o.customerCode) },
    { title: 'Kho xuất', key: 'warehouse', render: (_, o) => optionLabel(WAREHOUSE_OPTIONS, o.warehouseCode) },
    {
      title: 'Tổng tiền',
      key: 'totalAmount',
      render: (_, o) => totalAmountOf(o).toLocaleString('vi-VN') + ' đ',
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        return (
          <Space>
            <Button icon={<EditOutlined />} disabled={!isPending} onClick={() => openEditModal(record)} />
            {isPending && (
              <>
                <Popconfirm
                  title="Xác nhận đơn hàng này?"
                  description="Sau khi xác nhận sẽ xuất kho và không thể sửa/hủy."
                  onConfirm={() => handleConfirmOrder(record)}
                >
                  <Button icon={<CheckOutlined />} type="primary" ghost />
                </Popconfirm>
                <Popconfirm title="Hủy đơn hàng này?" onConfirm={() => handleCancelOrder(record)}>
                  <Button icon={<StopOutlined />} />
                </Popconfirm>
              </>
            )}
            <Popconfirm title="Xóa đơn hàng này?" disabled={!isPending} onConfirm={() => handleDelete(record)}>
              <Button icon={<DeleteOutlined />} danger disabled={!isPending} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(PRODUCT_OPTIONS, d.productCode) },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => v?.toLocaleString('vi-VN') + ' đ' },
    { title: 'Thành tiền', dataIndex: 'amount', key: 'amount', render: (v) => v?.toLocaleString('vi-VN') + ' đ' },
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
      <Title level={3}>Quản lý bán hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số đơn hoặc khách hàng..."
        onAdd={openCreateModal}
        addTooltip="Thêm đơn hàng"
        onReload={() => {
          setOrders(INITIAL_ORDERS);
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredOrders} />

      <Modal
        title={editingOrder ? `Sửa đơn hàng ${editingOrder.docNumber}` : 'Thêm đơn hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Số đơn" name="docNumber" extra={editingOrder ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingOrder} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày đặt hàng" name="docDate" rules={[{ required: true, message: 'Ngày đặt hàng không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kho xuất" name="warehouseCode" rules={[{ required: true, message: 'Kho xuất không được để trống' }]}>
                <Select options={WAREHOUSE_OPTIONS} placeholder="Chọn kho" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Khách hàng" name="customerCode" rules={[{ required: true, message: 'Khách hàng không được để trống' }]}>
                <Select options={CUSTOMER_OPTIONS} placeholder="Chọn khách hàng" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Chi tiết đơn hàng</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddDetailRow}>
            Thêm dòng
          </Button>
        </div>
        <Table
          rowKey="id"
          size="small"
          columns={detailColumns}
          dataSource={detailRows}
          pagination={false}
          locale={{ emptyText: 'Không có dữ liệu' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 12 }}>
          <Text>
            Tổng số lượng: <Text strong>{totalQty.toLocaleString('vi-VN')}</Text>
          </Text>
          <Text>
            Tổng tiền: <Text strong>{totalAmount.toLocaleString('vi-VN')} đ</Text>
          </Text>
        </div>
      </Modal>

      <Modal
        title="Thêm dòng sản phẩm"
        open={detailModalOpen}
        onOk={handleSubmitDetailRow}
        onCancel={() => setDetailModalOpen(false)}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item
            label="Sản phẩm"
            name="productCode"
            rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}
          >
            <Select
              options={PRODUCT_OPTIONS}
              placeholder="Chọn sản phẩm"
              onChange={(value) => detailForm.setFieldsValue({ unitPrice: productPrice(value) })}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số lượng"
                name="quantity"
                rules={[{ required: true, message: 'Số lượng không được để trống' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Đơn giá"
                name="unitPrice"
                rules={[{ required: true, message: 'Đơn giá không được để trống' }]}
              >
                <InputNumber min={0} step={1000} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
