import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Khop voi du lieu mock o pages/warehouses, pages/category/Product, pages/system/Users
// de dong bo giua cac module.
const WAREHOUSE_OPTIONS = [
  { value: 'Q1MWH01', label: 'Q1MWH01 - Kho chính Quận 1' },
  { value: 'Q1VWH01', label: 'Q1VWH01 - Kho xe tải Quận 1' },
  { value: 'TBDWH01', label: 'TBDWH01 - Kho hàng lỗi Tân Bình' },
  { value: 'TBCWH01', label: 'TBCWH01 - Kho ký gửi Tân Bình' },
];

const PRODUCT_OPTIONS = [
  { value: 'SP001', label: 'SP001 - Nước ngọt Cola lon 330ml', unit: 'THUNG' },
  { value: 'SP002', label: 'SP002 - Nước suối 500ml', unit: 'THUNG' },
  { value: 'SP003', label: 'SP003 - Cá hộp sốt cà', unit: 'HOP' },
  { value: 'SP004', label: 'SP004 - Bánh quy bơ', unit: 'GOI' },
  { value: 'SP005', label: 'SP005 - Kẹo dẻo trái cây', unit: 'TUI' },
];

const EMPLOYEE_OPTIONS = [
  { value: 'kho01', label: 'Trần Thị B (kho01)' },
  { value: 'kho02', label: 'Lê Văn C (kho02)' },
];

const REASON_OPTIONS = [
  { value: 'REBALANCE', label: 'Cân đối tồn kho giữa các kho' },
  { value: 'REQUEST', label: 'Theo yêu cầu chi nhánh' },
  { value: 'CONSIGNMENT', label: 'Chuyển hàng ký gửi' },
];

function optionLabel(options, code) {
  return options.find((o) => o.value === code)?.label || code;
}

function productOf(code) {
  return PRODUCT_OPTIONS.find((o) => o.value === code) || {};
}

// Du lieu mau (100% mock). Backend chua co bang/Controller rieng cho "Inventory Transfer" -
// ve nguyen tac se la 2 stock_transaction (OUT o kho di + IN o kho den) nhung schema hien
// chua co type TRANSFER rieng (V5__inventory.sql chi co IN/OUT/ADJUST).
const INITIAL_TRANSFERS = [
  {
    id: 1,
    docNumber: 'DC0001',
    docDate: '2026-08-23',
    postingDate: '2026-08-23',
    fromWarehouseCode: 'Q1MWH01',
    toWarehouseCode: 'TBDWH01',
    employeeCode: 'kho01',
    reason: 'REBALANCE',
    status: 'CONFIRMED',
    details: [{ id: 1, productCode: 'SP001', quantity: 30, batch: '', note: '' }],
  },
  {
    id: 2,
    docNumber: 'DC0002',
    docDate: '2026-08-27',
    postingDate: '',
    fromWarehouseCode: 'Q1MWH01',
    toWarehouseCode: 'Q1VWH01',
    employeeCode: 'kho02',
    reason: 'REQUEST',
    status: 'DRAFT',
    details: [{ id: 1, productCode: 'SP002', quantity: 10, batch: '', note: '' }],
  },
];

export default function TransferPage() {
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState(null);
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
    setTransfers(INITIAL_TRANSFERS);
    setSearchText('');
    setTimeout(() => setLoading(false), 400);
  }

  const filteredTransfers = transfers.filter((t) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return t.docNumber.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingTransfer(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingTransfer(record);
    form.setFieldsValue(record);
    setDetailRows(record.details || []);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setTransfers((prev) => prev.filter((t) => t.id !== record.id));
    message.success('Đã xóa phiếu điều chuyển');
  }

  function handleConfirmTransfer(record) {
    setTransfers((prev) => prev.map((t) => (t.id === record.id ? { ...t, status: 'CONFIRMED' } : t)));
    message.success('Đã xác nhận điều chuyển kho');
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
      if (values.fromWarehouseCode === values.toWarehouseCode) {
        message.error('Kho đi và kho đến không được trùng nhau');
        return;
      }
      if (editingTransfer) {
        setTransfers((prev) => prev.map((t) => (t.id === editingTransfer.id ? { ...t, ...values, details: detailRows } : t)));
        message.success('Cập nhật thành công');
      } else {
        const newTransfer = {
          id: Date.now(),
          docNumber: values.docNumber || `DC${String(transfers.length + 1).padStart(4, '0')}`,
          status: 'DRAFT',
          ...values,
          details: detailRows,
        };
        setTransfers((prev) => [newTransfer, ...prev]);
        message.success('Tạo phiếu điều chuyển thành công');
      }
      setModalOpen(false);
    });
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Kho đi', key: 'from', render: (_, r) => optionLabel(WAREHOUSE_OPTIONS, r.fromWarehouseCode) },
    { title: 'Kho đến', key: 'to', render: (_, r) => optionLabel(WAREHOUSE_OPTIONS, r.toWarehouseCode) },
    { title: 'Nhân viên phụ trách', key: 'employee', render: (_, r) => optionLabel(EMPLOYEE_OPTIONS, r.employeeCode) },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'CONFIRMED' ? <Tag color="green">Đã điều chuyển</Tag> : <Tag color="gold">Nháp</Tag>),
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
                title="Xác nhận điều chuyển kho này?"
                description="Sau khi xác nhận sẽ trừ tồn kho đi và cộng tồn kho đến, không thể sửa/xoá."
                onConfirm={() => handleConfirmTransfer(record)}
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
      <Title level={3}>Điều chuyển kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu..."
        onAdd={openCreateModal}
        addTooltip="Thêm phiếu điều chuyển"
        onReload={reload}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredTransfers} loading={loading} />

      <Modal
        title={editingTransfer ? `Sửa phiếu điều chuyển ${editingTransfer.docNumber}` : 'Thêm phiếu điều chuyển'}
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
              <Form.Item label="Số phiếu" name="docNumber" extra={editingTransfer ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingTransfer} placeholder="Tự sinh nếu để trống" />
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
              <Form.Item label="Kho đi" name="fromWarehouseCode" rules={[{ required: true, message: 'Kho đi không được để trống' }]}>
                <Select options={WAREHOUSE_OPTIONS} placeholder="Chọn kho đi" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kho đến" name="toWarehouseCode" rules={[{ required: true, message: 'Kho đến không được để trống' }]}>
                <Select options={WAREHOUSE_OPTIONS} placeholder="Chọn kho đến" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nhân viên phụ trách" name="employeeCode">
                <Select options={EMPLOYEE_OPTIONS} placeholder="Chọn nhân viên" allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lý do" name="reason" rules={[{ required: true, message: 'Lý do không được để trống' }]}>
                <Select options={REASON_OPTIONS} placeholder="Chọn lý do" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Danh sách hàng điều chuyển</Text>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Text>
            Tổng số lượng: <Text strong>{totalQty.toLocaleString('vi-VN')}</Text>
          </Text>
        </div>
      </Modal>

      <Modal
        title="Thêm dòng hàng điều chuyển"
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
