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

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa/xac nhan
// phieu nhap, SALES_STAFF chi duoc xem (GET).
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Trang nay da noi API that (khong con mock) - xem backend/.../inbound/controller/GoodsReceiptController.java.
// Luu y: unit_price/amount van nhap tay o dong chi tiet (khong tu dong lay gia san pham) vi
// backend khong tra gia mac dinh cho GoodsReceiptDto.
export default function GoodsReceiptPage() {
  const [receipts, setReceipts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}`, price: p.price }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/goods-receipts'),
      axiosClient.get('/suppliers'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ])
      .then(([receiptsRes, suppliersRes, warehousesRes, productsRes]) => {
        setReceipts(receiptsRes.data.data);
        setSuppliers(suppliersRes.data.data);
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
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.docNumber.toLowerCase().includes(keyword) || (r.supplier?.name || '').toLowerCase().includes(keyword);
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
      supplierId: record.supplier?.id,
      warehouseId: record.warehouse?.id,
      remarks: record.remarks,
    });
    setDetailRows(record.details.map((d) => ({ id: d.id, productId: d.product.id, quantity: d.quantity, unitPrice: d.unitPrice })));
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/goods-receipts/${record.id}`)
      .then(() => {
        message.success('Đã xóa phiếu nhập');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleConfirmReceipt(record) {
    axiosClient
      .post(`/goods-receipts/${record.id}/confirm`)
      .then(() => {
        message.success('Đã xác nhận phiếu nhập - cộng vào tồn kho');
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
        message.error('Phiếu nhập phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        details: detailRows.map((d) => ({ productId: d.productId, quantity: d.quantity, unitPrice: d.unitPrice })),
      };
      const request = editingReceipt
        ? axiosClient.put(`/goods-receipts/${editingReceipt.id}`, payload)
        : axiosClient.post('/goods-receipts', payload);
      request
        .then(() => {
          message.success(editingReceipt ? 'Cập nhật thành công' : 'Tạo phiếu nhập thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  const totalAmount = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0) * Number(d.unitPrice || 0), 0);

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Ngày ghi sổ', dataIndex: 'postingDate', key: 'postingDate' },
    { title: 'Nhà cung cấp', key: 'supplier', render: (_, r) => r.supplier?.name },
    { title: 'Kho', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status === 'CLOSED' ? <Tag color="green">Đã đóng</Tag> : <Tag color="gold">Nháp</Tag>),
    },
    { title: 'Ghi chú', dataIndex: 'remarks', key: 'remarks' },
    ...(canWrite
      ? [
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
        ]
      : []),
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => v?.toLocaleString('vi-VN') + ' đ' },
    {
      title: 'Thành tiền',
      key: 'amount',
      render: (_, d) => (d.quantity * d.unitPrice).toLocaleString('vi-VN') + ' đ',
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
      <Title level={3}>Quản lý nhập hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu hoặc nhà cung cấp..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm phiếu nhập"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredReceipts} loading={loading} />

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
              <Form.Item label="Nhà cung cấp" name="supplierId" rules={[{ required: true, message: 'Nhà cung cấp không được để trống' }]}>
                <Select options={supplierOptions} placeholder="Chọn nhà cung cấp" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kho" name="warehouseId" rules={[{ required: true, message: 'Kho không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho" />
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
            name="productId"
            rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}
          >
            <Select
              options={productOptions}
              placeholder="Chọn sản phẩm"
              onChange={(value) => detailForm.setFieldsValue({ unitPrice: productOptions.find((p) => p.value === value)?.price })}
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
