import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';

const { Title, Text } = Typography;

// Khop voi du lieu mock o pages/warehouses, pages/category/Product de dong bo giua cac module.
const WAREHOUSE_OPTIONS = [
  { value: 'Q1MWH01', label: 'Q1MWH01 - Kho chính Quận 1' },
  { value: 'Q1VWH01', label: 'Q1VWH01 - Kho xe tải Quận 1' },
  { value: 'TBDWH01', label: 'TBDWH01 - Kho hàng lỗi Tân Bình' },
  { value: 'TBCWH01', label: 'TBCWH01 - Kho ký gửi Tân Bình' },
];

// systemQty mo phong tồn hệ thống hiện co (khop tinh than voi pages/inventory/Inventories).
const PRODUCT_OPTIONS = [
  { value: 'SP001', label: 'SP001 - Nước ngọt Cola lon 330ml', systemQty: 500 },
  { value: 'SP002', label: 'SP002 - Nước suối 500ml', systemQty: 300 },
  { value: 'SP003', label: 'SP003 - Cá hộp sốt cà', systemQty: 150 },
  { value: 'SP004', label: 'SP004 - Bánh quy bơ', systemQty: 20 },
  { value: 'SP005', label: 'SP005 - Kẹo dẻo trái cây', systemQty: 60 },
];

function optionLabel(options, code) {
  return options.find((o) => o.value === code)?.label || code;
}

function productSystemQty(code) {
  return PRODUCT_OPTIONS.find((o) => o.value === code)?.systemQty ?? 0;
}

// Du lieu mau (100% mock) - field khop dung schema that trong
// backend/.../db/migration/V5__inventory.sql: stock_take (code, warehouse_id,
// status DRAFT/APPROVED) + stock_take_detail (system_quantity, actual_quantity, difference).
// Anh "Stock Counting Definition" trong ui-reference/04-ton-kho khong dung duoc lam mau vi
// bi loi luc chup (ABP remote HTTP request error) va thuc ra thuoc module Trade Marketing
// cua he thong goc, khong phai Inventory - nen trang nay bam theo dung schema that thay vi
// theo anh do.
const INITIAL_COUNTS = [
  {
    id: 1,
    code: 'KK0001',
    warehouseCode: 'Q1MWH01',
    status: 'APPROVED',
    details: [
      { id: 1, productCode: 'SP001', systemQuantity: 500, actualQuantity: 498 },
      { id: 2, productCode: 'SP004', systemQuantity: 20, actualQuantity: 20 },
    ],
  },
  {
    id: 2,
    code: 'KK0002',
    warehouseCode: 'TBDWH01',
    status: 'DRAFT',
    details: [{ id: 1, productCode: 'SP003', systemQuantity: 150, actualQuantity: 145 }],
  },
];

export default function StockCountingPage() {
  const [counts, setCounts] = useState(INITIAL_COUNTS);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCount, setEditingCount] = useState(null);
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
    setCounts(INITIAL_COUNTS);
    setSearchText('');
    setTimeout(() => setLoading(false), 400);
  }

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
    form.setFieldsValue(record);
    setDetailRows(record.details || []);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setCounts((prev) => prev.filter((c) => c.id !== record.id));
    message.success('Đã xóa đợt kiểm kê');
  }

  function handleApprove(record) {
    setCounts((prev) => prev.map((c) => (c.id === record.id ? { ...c, status: 'APPROVED' } : c)));
    message.success('Đã duyệt đợt kiểm kê - ghi nhận chênh lệch vào tồn kho');
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setDetailModalOpen(true);
  }

  function handleSubmitDetailRow() {
    detailForm.validateFields().then((values) => {
      const systemQuantity = productSystemQty(values.productCode);
      setDetailRows((prev) => [...prev, { id: Date.now(), ...values, systemQuantity }]);
      setDetailModalOpen(false);
    });
  }

  function handleRemoveDetailRow(id) {
    setDetailRows((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingCount) {
        setCounts((prev) => prev.map((c) => (c.id === editingCount.id ? { ...c, ...values, details: detailRows } : c)));
        message.success('Cập nhật thành công');
      } else {
        const newCount = {
          id: Date.now(),
          code: values.code || `KK${String(counts.length + 1).padStart(4, '0')}`,
          status: 'DRAFT',
          ...values,
          details: detailRows,
        };
        setCounts((prev) => [newCount, ...prev]);
        message.success('Tạo đợt kiểm kê thành công');
      }
      setModalOpen(false);
    });
  }

  const columns = [
    { title: 'Mã đợt kiểm kê', dataIndex: 'code', key: 'code' },
    { title: 'Kho', key: 'warehouse', render: (_, r) => optionLabel(WAREHOUSE_OPTIONS, r.warehouseCode) },
    { title: 'Số dòng sản phẩm', key: 'lineCount', render: (_, r) => (r.details || []).length },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'APPROVED' ? <Tag color="green">Đã duyệt</Tag> : <Tag color="gold">Nháp</Tag>),
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
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(PRODUCT_OPTIONS, d.productCode) },
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
        onAdd={openCreateModal}
        addTooltip="Thêm đợt kiểm kê"
        onReload={reload}
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
          <Form.Item label="Kho kiểm kê" name="warehouseCode" rules={[{ required: true, message: 'Kho kiểm kê không được để trống' }]}>
            <Select options={WAREHOUSE_OPTIONS} placeholder="Chọn kho" />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Danh sách sản phẩm kiểm kê</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddDetailRow}>
            Thêm sản phẩm
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
          <Form.Item label="Sản phẩm" name="productCode" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={PRODUCT_OPTIONS} placeholder="Chọn sản phẩm" />
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
