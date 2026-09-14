import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';

const { Title, Text } = Typography;
const { TextArea } = Input;

const REASON_OPTIONS = [
  { value: 'SALE', label: 'Xuất bán' },
  { value: 'DAMAGE', label: 'Xuất hủy / hàng hỏng' },
  { value: 'INTERNAL', label: 'Xuất dùng nội bộ' },
  { value: 'ADJUST', label: 'Điều chỉnh giảm sau kiểm kê' },
];

function reasonLabel(code) {
  return REASON_OPTIONS.find((o) => o.value === code)?.label || code;
}

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa/xac nhan
// phieu xuat, SALES_STAFF chi duoc xem (GET).
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Trang nay da noi API that (khong con mock) - xem backend/.../inventory/controller/GoodsIssueController.java.
// Man hinh doc lap thuc su (giong DMS that), KHONG gop vao Sales Order - xem tonghop.md muc Inventory.
export default function GoodsIssuePage() {
  const [issues, setIssues] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
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
    Promise.all([
      axiosClient.get('/goods-issues'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ])
      .then(([issuesRes, warehousesRes, productsRes]) => {
        setIssues(issuesRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setProducts(productsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu phiếu xuất'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredIssues = issues.filter((i) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return i.docNumber.toLowerCase().includes(keyword) || (i.warehouse?.name || '').toLowerCase().includes(keyword);
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
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      postingDate: record.postingDate,
      warehouseId: record.warehouse?.id,
      reason: record.reason,
      remarks: record.remarks,
    });
    setDetailRows(record.items.map((d) => ({ id: d.id, productId: d.product.id, quantity: d.quantity, batch: d.batch, note: d.note })));
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/goods-issues/${record.id}`)
      .then(() => {
        message.success('Đã xóa phiếu xuất kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleConfirmIssue(record) {
    axiosClient
      .post(`/goods-issues/${record.id}/confirm`)
      .then(() => {
        message.success('Đã xác nhận phiếu xuất kho - trừ tồn kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'));
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
      if (detailRows.length === 0) {
        message.error('Phiếu xuất phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({ productId: d.productId, quantity: d.quantity, batch: d.batch, note: d.note })),
      };
      const request = editingIssue
        ? axiosClient.put(`/goods-issues/${editingIssue.id}`, payload)
        : axiosClient.post('/goods-issues', payload);
      request
        .then(() => {
          message.success(editingIssue ? 'Cập nhật thành công' : 'Tạo phiếu xuất kho thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Ngày ghi sổ', dataIndex: 'postingDate', key: 'postingDate' },
    { title: 'Kho xuất', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    { title: 'Lý do xuất', key: 'reason', render: (_, r) => reasonLabel(r.reason) },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'CLOSED' ? <Tag color="green">Đã xuất</Tag> : <Tag color="gold">Nháp</Tag>),
    },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} disabled={record.status === 'CLOSED'} onClick={() => openEditModal(record)} />
                {record.status === 'DRAFT' && (
                  <Popconfirm
                    title="Xác nhận phiếu xuất này?"
                    description="Sau khi xác nhận sẽ trừ tồn kho và không thể sửa/xoá."
                    onConfirm={() => handleConfirmIssue(record)}
                  >
                    <Button icon={<CheckOutlined />} type="primary" ghost />
                  </Popconfirm>
                )}
                <Popconfirm title="Xóa phiếu này?" disabled={record.status === 'CLOSED'} onConfirm={() => handleDelete(record)}>
                  <Button icon={<DeleteOutlined />} danger disabled={record.status === 'CLOSED'} />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
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
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm phiếu xuất kho"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
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
              <Form.Item label="Kho xuất" name="warehouseId" rules={[{ required: true, message: 'Kho xuất không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho" />
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
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={productOptions} placeholder="Chọn sản phẩm" />
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
