import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Khop voi du lieu mock o pages/warehouses, pages/category/Product de dong bo giua cac module.
const WAREHOUSE_OPTIONS = [
  { value: 'Q1MWH01', label: 'Q1MWH01 - Kho chính Quận 1' },
  { value: 'Q1VWH01', label: 'Q1VWH01 - Kho xe tải Quận 1' },
  { value: 'TBDWH01', label: 'TBDWH01 - Kho hàng lỗi Tân Bình' },
  { value: 'TBCWH01', label: 'TBCWH01 - Kho ký gửi Tân Bình' },
];

const PRODUCT_OPTIONS = [
  { value: 'SP001', label: 'SP001 - Nước ngọt Cola lon 330ml', unit: 'THUNG', price: 180000 },
  { value: 'SP002', label: 'SP002 - Nước suối 500ml', unit: 'THUNG', price: 90000 },
  { value: 'SP003', label: 'SP003 - Cá hộp sốt cà', unit: 'HOP', price: 25000 },
  { value: 'SP004', label: 'SP004 - Bánh quy bơ', unit: 'GOI', price: 15000 },
  { value: 'SP005', label: 'SP005 - Kẹo dẻo trái cây', unit: 'TUI', price: 32000 },
];

const REASON_OPTIONS = [
  { value: 'SALE', label: 'Xuất bán' },
  { value: 'DAMAGE', label: 'Xuất hủy / hàng hỏng' },
  { value: 'INTERNAL', label: 'Xuất dùng nội bộ' },
  { value: 'ADJUST', label: 'Điều chỉnh giảm sau kiểm kê' },
];

function optionLabel(options, code) {
  return options.find((o) => o.value === code)?.label || code;
}

function productOf(code) {
  return PRODUCT_OPTIONS.find((o) => o.value === code) || {};
}

// Du lieu mau (100% mock). Backend chua co bang/Controller rieng cho "Goods Issue" - chi co
// stock_transaction chung (type OUT) trong V5__inventory.sql, khong phai chung tu doc lap.
const INITIAL_ISSUES = [
  {
    id: 1,
    docNumber: 'PX0001',
    docDate: '2026-08-21',
    postingDate: '2026-08-21',
    warehouseCode: 'Q1MWH01',
    reason: 'SALE',
    remarks: '',
    status: 'CONFIRMED',
    details: [{ id: 1, productCode: 'SP001', quantity: 20, batch: '', note: '' }],
  },
  {
    id: 2,
    docNumber: 'PX0002',
    docDate: '2026-08-26',
    postingDate: '',
    warehouseCode: 'TBDWH01',
    reason: 'DAMAGE',
    remarks: 'Hàng bị móp trong quá trình vận chuyển',
    status: 'DRAFT',
    details: [{ id: 1, productCode: 'SP003', quantity: 15, batch: 'B240801', note: '' }],
  },
];

export default function GoodsIssuePage() {
  const [issues, setIssues] = useState(INITIAL_ISSUES);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  function reload() {
    setLoading(true);
    setIssues(INITIAL_ISSUES);
    setSearchText('');
    setTimeout(() => setLoading(false), 400);
  }

  const filteredIssues = issues.filter((i) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return i.docNumber.toLowerCase().includes(keyword) || optionLabel(WAREHOUSE_OPTIONS, i.warehouseCode).toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingIssue(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingIssue(record);
    form.setFieldsValue(record);
    setDetailRows(record.details || []);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setIssues((prev) => prev.filter((i) => i.id !== record.id));
    message.success('Đã xóa phiếu xuất kho');
  }

  function handleConfirmIssue(record) {
    setIssues((prev) => prev.map((i) => (i.id === record.id ? { ...i, status: 'CONFIRMED' } : i)));
    message.success('Đã xác nhận phiếu xuất kho - trừ tồn kho');
  }

  function handleAddDetailRow() {
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
      if (editingIssue) {
        setIssues((prev) => prev.map((i) => (i.id === editingIssue.id ? { ...i, ...values, details: detailRows } : i)));
        message.success('Cập nhật thành công');
      } else {
        const newIssue = {
          id: Date.now(),
          docNumber: values.docNumber || `PX${String(issues.length + 1).padStart(4, '0')}`,
          status: 'DRAFT',
          ...values,
          details: detailRows,
        };
        setIssues((prev) => [newIssue, ...prev]);
        message.success('Tạo phiếu xuất kho thành công');
      }
      setModalOpen(false);
    });
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  const totalAmount = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0) * productOf(d.productCode).price, 0);

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Ngày ghi sổ', dataIndex: 'postingDate', key: 'postingDate' },
    { title: 'Kho xuất', key: 'warehouse', render: (_, r) => optionLabel(WAREHOUSE_OPTIONS, r.warehouseCode) },
    { title: 'Lý do xuất', key: 'reason', render: (_, r) => optionLabel(REASON_OPTIONS, r.reason) },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'CONFIRMED' ? <Tag color="green">Đã xuất</Tag> : <Tag color="gold">Nháp</Tag>),
    },
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
                title="Xác nhận phiếu xuất này?"
                description="Sau khi xác nhận sẽ trừ tồn kho và không thể sửa/xoá."
                onConfirm={() => handleConfirmIssue(record)}
              >
                <Button icon={<CheckOutlined />} type="primary" ghost />
              </Popconfirm>
            )}
            <Popconfirm title="Xóa phiếu này?" disabled={!isDraft} onConfirm={() => handleDelete(record)}>
              <Button icon={<DeleteOutlined />} danger disabled={!isDraft} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(PRODUCT_OPTIONS, d.productCode) },
    { title: 'ĐVT', key: 'unit', render: (_, d) => productOf(d.productCode).unit },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Số lô', dataIndex: 'batch', key: 'batch' },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
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
      <Title level={3}>Phiếu xuất kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu hoặc kho..."
        onAdd={openCreateModal}
        addTooltip="Thêm phiếu xuất kho"
        onReload={reload}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredIssues} loading={loading} />

      <Modal
        title={editingIssue ? `Sửa phiếu xuất ${editingIssue.docNumber}` : 'Thêm phiếu xuất kho'}
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
              <Form.Item label="Số phiếu" name="docNumber" extra={editingIssue ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingIssue} placeholder="Tự sinh nếu để trống" />
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
              <Form.Item label="Kho xuất" name="warehouseCode" rules={[{ required: true, message: 'Kho xuất không được để trống' }]}>
                <Select options={WAREHOUSE_OPTIONS} placeholder="Chọn kho" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lý do xuất" name="reason" rules={[{ required: true, message: 'Lý do xuất không được để trống' }]}>
                <Select options={REASON_OPTIONS} placeholder="Chọn lý do" />
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
          <Text strong>Danh sách hàng xuất</Text>
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
        title="Thêm dòng hàng xuất"
        open={detailModalOpen}
        onOk={handleSubmitDetailRow}
        onCancel={() => setDetailModalOpen(false)}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item label="Sản phẩm" name="productCode" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={PRODUCT_OPTIONS} placeholder="Chọn sản phẩm" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Số lượng không được để trống' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số lô" name="batch">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Ghi chú" name="note">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
