import { useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Khop voi du lieu mock o pages/vendors, pages/warehouses, pages/category/Product de dong bo giua cac module.
const SUPPLIER_OPTIONS = [
  { value: 'NCC001', label: 'NCC001 - Công ty TNHH Thực Phẩm A' },
  { value: 'NCC002', label: 'NCC002 - Công ty CP Đồ Uống B' },
  { value: 'NCC003', label: 'NCC003 - Nhà cung cấp C' },
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

// Du lieu mau (100% mock, khong goi API that) - field khop dung schema that trong
// backend/.../db/migration/V3__inbound.sql (doc_number, doc_date, posting_date,
// supplier_id, warehouse_id, status DRAFT/CLOSED, remarks). Backend chua co
// GoodsReceiptController/Service (chi co bang trong SQL), se noi API sau.
const INITIAL_RECEIPTS = [
  {
    id: 1,
    docNumber: 'PN0001',
    docDate: '2026-08-20',
    postingDate: '2026-08-20',
    supplierCode: 'NCC001',
    warehouseCode: 'Q1MWH01',
    status: 'CLOSED',
    remarks: '',
    details: [
      { id: 1, productCode: 'SP001', quantity: 100, unitPrice: 180000, amount: 18000000 },
      { id: 2, productCode: 'SP002', quantity: 50, unitPrice: 90000, amount: 4500000 },
    ],
  },
  {
    id: 2,
    docNumber: 'PN0002',
    docDate: '2026-08-25',
    postingDate: '',
    supplierCode: 'NCC002',
    warehouseCode: 'TBDWH01',
    status: 'DRAFT',
    remarks: 'Chờ kiểm tra chất lượng trước khi đóng phiếu',
    details: [{ id: 1, productCode: 'SP003', quantity: 200, unitPrice: 25000, amount: 5000000 }],
  },
  {
    id: 3,
    docNumber: 'PN0003',
    docDate: '2026-08-27',
    postingDate: '2026-08-27',
    supplierCode: 'NCC001',
    warehouseCode: 'Q1MWH01',
    status: 'CLOSED',
    remarks: '',
    details: [],
  },
];

export default function GoodsReceiptPage() {
  const [receipts, setReceipts] = useState(INITIAL_RECEIPTS);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const filteredReceipts = receipts.filter((r) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return (
      r.docNumber.toLowerCase().includes(keyword) ||
      optionLabel(SUPPLIER_OPTIONS, r.supplierCode).toLowerCase().includes(keyword)
    );
  });

  function openCreateModal() {
    setEditingReceipt(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingReceipt(record);
    form.setFieldsValue(record);
    setDetailRows(record.details || []);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setReceipts((prev) => prev.filter((r) => r.id !== record.id));
    message.success('Đã xóa phiếu nhập');
  }

  function handleConfirmReceipt(record) {
    setReceipts((prev) => prev.map((r) => (r.id === record.id ? { ...r, status: 'CLOSED' } : r)));
    message.success('Đã xác nhận phiếu nhập - cộng vào tồn kho');
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
      if (editingReceipt) {
        setReceipts((prev) =>
          prev.map((r) => (r.id === editingReceipt.id ? { ...r, ...values, details: detailRows } : r))
        );
        message.success('Cập nhật thành công');
      } else {
        const newReceipt = {
          id: Date.now(),
          docNumber: values.docNumber || `PN${String(receipts.length + 1).padStart(4, '0')}`,
          status: 'DRAFT',
          ...values,
          details: detailRows,
        };
        setReceipts((prev) => [newReceipt, ...prev]);
        message.success('Tạo phiếu nhập thành công');
      }
      setModalOpen(false);
    });
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  const totalAmount = detailRows.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Ngày ghi sổ', dataIndex: 'postingDate', key: 'postingDate' },
    { title: 'Nhà cung cấp', key: 'supplier', render: (_, r) => optionLabel(SUPPLIER_OPTIONS, r.supplierCode) },
    { title: 'Kho', key: 'warehouse', render: (_, r) => optionLabel(WAREHOUSE_OPTIONS, r.warehouseCode) },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'CLOSED' ? <Tag color="green">Đã đóng</Tag> : <Tag color="gold">Nháp</Tag>),
    },
    { title: 'Ghi chú', dataIndex: 'remarks', key: 'remarks' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            disabled={record.status === 'CLOSED'}
            onClick={() => openEditModal(record)}
          />
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Xác nhận phiếu nhập này?"
              description="Sau khi xác nhận sẽ cộng vào tồn kho và không thể sửa/xoá."
              onConfirm={() => handleConfirmReceipt(record)}
            >
              <Button icon={<CheckOutlined />} type="primary" ghost />
            </Popconfirm>
          )}
          <Popconfirm
            title="Xóa phiếu nhập này?"
            disabled={record.status === 'CLOSED'}
            onConfirm={() => handleDelete(record)}
          >
            <Button icon={<DeleteOutlined />} danger disabled={record.status === 'CLOSED'} />
          </Popconfirm>
        </Space>
      ),
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
      <Title level={3}>Quản lý nhập hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu hoặc nhà cung cấp..."
        onAdd={openCreateModal}
        addTooltip="Thêm phiếu nhập"
        onReload={() => {
          setReceipts(INITIAL_RECEIPTS);
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredReceipts} />

      <Modal
        title={editingReceipt ? `Sửa phiếu nhập ${editingReceipt.docNumber}` : 'Thêm phiếu nhập'}
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
              <Form.Item label="Số phiếu" name="docNumber" extra={editingReceipt ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingReceipt} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày chứng từ" name="docDate" rules={[{ required: true, message: 'Ngày chứng từ không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày ghi sổ" name="postingDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nhà cung cấp" name="supplierCode" rules={[{ required: true, message: 'Nhà cung cấp không được để trống' }]}>
                <Select options={SUPPLIER_OPTIONS} placeholder="Chọn nhà cung cấp" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kho" name="warehouseCode" rules={[{ required: true, message: 'Kho không được để trống' }]}>
                <Select options={WAREHOUSE_OPTIONS} placeholder="Chọn kho" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ghi chú" name="remarks">
                <TextArea rows={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Chi tiết hàng nhập</Text>
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
        title="Thêm dòng hàng nhập"
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
