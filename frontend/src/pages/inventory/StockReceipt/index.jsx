import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';
import { useBranch } from '../../../contexts/BranchContext';
import { fetchUomOptions, defaultUomId } from '../../../utils/uom';

const { Title, Text } = Typography;
const { TextArea } = Input;

const REASON_OPTIONS = [
  { value: 'ADJUST', label: 'Điều chỉnh tăng sau kiểm kê' },
  { value: 'FOUND', label: 'Phát hiện thừa / thu hồi' },
  { value: 'INTERNAL', label: 'Nhập nội bộ (không qua mua hàng)' },
  { value: 'OTHER', label: 'Khác' },
];

function reasonLabel(code) {
  return REASON_OPTIONS.find((o) => o.value === code)?.label || code;
}

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa/xac nhan
// phieu nhap, SALES_STAFF chi duoc xem (GET).

// Phieu nhap kho - man hinh doc lap, KHONG qua Nha cung cap (khac "Nhap hang"/GoodsReceipt da co,
// bat buoc Nha cung cap) - xem backend/.../inventory/controller/StockReceiptController.java.
// Doi xung voi Phieu xuat kho (GoodsIssue) nhung co them DVT + Don gia tren tung dong, giong
// Don hang ban (UomConversionService). canWrite tinh trong component - xem ghi chu o pages/branches/index.jsx.
export default function StockReceiptPage() {
  const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');
  const { selectedBranchId } = useBranch();
  const [receipts, setReceipts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [uomOptions, setUomOptions] = useState([]);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const warehouseOptions = warehouses
    .filter((w) => !selectedBranchId || w.branch?.id === selectedBranchId || w.id === editingReceipt?.warehouse?.id)
    .map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/stock-receipts'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ])
      .then(([receiptsRes, warehousesRes, productsRes]) => {
        setReceipts(receiptsRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setProducts(productsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu phiếu nhập'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredReceipts = receipts.filter((r) => {
    if (selectedBranchId && r.warehouse?.branch?.id !== selectedBranchId) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.docNumber.toLowerCase().includes(keyword) || (r.warehouse?.name || '').toLowerCase().includes(keyword);
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
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      postingDate: record.postingDate,
      warehouseId: record.warehouse?.id,
      reason: record.reason,
      remarks: record.remarks,
    });
    setDetailRows(
      record.items.map((d) => ({
        id: d.id, productId: d.product.id, uomId: d.uom?.id, uomName: d.uom?.name, quantity: d.quantity, unitPrice: d.unitPrice,
      }))
    );
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/stock-receipts/${record.id}`)
      .then(() => {
        message.success('Đã xóa phiếu nhập kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleConfirmReceipt(record) {
    axiosClient
      .post(`/stock-receipts/${record.id}/confirm`)
      .then(() => {
        message.success('Đã xác nhận phiếu nhập kho - cộng tồn kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'));
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setUomOptions([]);
    setDetailModalOpen(true);
  }

  async function handleProductSelect(productId) {
    const product = products.find((p) => p.id === productId);
    const options = await fetchUomOptions(product);
    setUomOptions(options);
    detailForm.setFieldsValue({ uomId: defaultUomId(product, options) });
  }

  function handleSubmitDetailRow() {
    detailForm.validateFields().then((values) => {
      const uomName = uomOptions.find((o) => o.value === values.uomId)?.label;
      setDetailRows((prev) => [...prev, { id: Date.now(), ...values, uomName }]);
      setDetailModalOpen(false);
    });
  }

  function handleRemoveDetailRow(id) {
    setDetailRows((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (detailRows.length === 0) {
        message.error('Phiếu nhập phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({ productId: d.productId, uomId: d.uomId, quantity: d.quantity, unitPrice: d.unitPrice })),
      };
      const request = editingReceipt
        ? axiosClient.put(`/stock-receipts/${editingReceipt.id}`, payload)
        : axiosClient.post('/stock-receipts', payload);
      request
        .then(() => {
          message.success(editingReceipt ? 'Cập nhật thành công' : 'Tạo phiếu nhập kho thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const totalAmount = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0) * Number(d.unitPrice || 0), 0);

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Ngày ghi sổ', dataIndex: 'postingDate', key: 'postingDate' },
    { title: 'Kho nhận', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    { title: 'Lý do nhập', key: 'reason', render: (_, r) => reasonLabel(r.reason) },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'CLOSED' ? <Tag color="green">Đã nhập</Tag> : <Tag color="gold">Nháp</Tag>),
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
                    title="Xác nhận phiếu nhập này?"
                    description="Sau khi xác nhận sẽ cộng tồn kho và không thể sửa/xoá."
                    onConfirm={() => handleConfirmReceipt(record)}
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
    { title: 'ĐVT', key: 'uom', render: (_, d) => d.uomName || '' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    {
      title: 'Thành tiền',
      key: 'amount',
      render: (_, d) => (Number(d.quantity) * Number(d.unitPrice)).toLocaleString('vi-VN') + ' đ',
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
      <Title level={3}>Phiếu nhập kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu hoặc kho..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm phiếu nhập kho"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredReceipts} loading={loading} />

      <Modal
        title={editingReceipt ? `Sửa phiếu nhập ${editingReceipt.docNumber}` : 'Thêm phiếu nhập kho'}
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
              <Form.Item label="Kho nhận" name="warehouseId" rules={[{ required: true, message: 'Kho nhận không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lý do nhập" name="reason" rules={[{ required: true, message: 'Lý do nhập không được để trống' }]}>
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
          <Text strong>Danh sách hàng nhập</Text>
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
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={productOptions} placeholder="Chọn sản phẩm" showSearch optionFilterProp="label" onChange={handleProductSelect} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="ĐVT" name="uomId">
                <Select options={uomOptions} placeholder="Chọn ĐVT" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Số lượng không được để trống' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Đơn giá" name="unitPrice" rules={[{ required: true, message: 'Đơn giá không được để trống' }]}>
                <InputNumber min={0} step={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
