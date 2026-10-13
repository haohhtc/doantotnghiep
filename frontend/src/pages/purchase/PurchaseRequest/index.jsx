import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, SwapOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole, getCurrentUser } from '../../../utils/auth';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

function statusTag(status) {
  if (status === 'PENDING_APPROVAL') return <Tag color="blue">Chờ duyệt</Tag>;
  if (status === 'CLOSED') return <Tag color="green">Đã đóng</Tag>;
  return <Tag color="gold">Mở</Tag>;
}

// Yeu cau mua hang (Purchase Request) - buoc ghi truoc Phieu nhap hang, dung theo dung pattern cua
// Yeu cau ban hang (SalesRequest) ben Sales: Mo (sua duoc) -> Gui duyet -> Cho duyet (khoa sua) ->
// Tao phieu nhap hang -> Da dong (da sinh 1 Phieu nhap hang DRAFT that o trang Nhap hang). Chua dung
// gi den ton kho o day. Chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa/gui duyet/tao phieu nhap
// (xem backend/.../config/SecurityConfig.java), nhan vien ban hang chi xem.
export default function PurchaseRequestPage() {
  const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');
  const { selectedBranchId, selectedBranch } = useBranch();
  const [requests, setRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const currentUser = getCurrentUser();
  const currentBranchName = selectedBranch?.name || '';

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }));
  const warehouseOptions = warehouses
    .filter((w) => !selectedBranchId || w.branch?.id === selectedBranchId || w.id === editingRequest?.warehouse?.id)
    .map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function taxRateOf(productId) {
    const product = products.find((p) => p.id === productId);
    return product?.purchaseTaxGroup ? Number(product.purchaseTaxGroup.ratePercent) : 0;
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/purchase-requests'),
      axiosClient.get('/suppliers'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ])
      .then(([reqRes, supRes, whRes, prodRes]) => {
        setRequests(reqRes.data.data);
        setSuppliers(supRes.data.data);
        setWarehouses(whRes.data.data);
        setProducts(prodRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu yêu cầu mua hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (selectedBranchId && r.warehouse?.branch?.id !== selectedBranchId) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.docNumber.toLowerCase().includes(keyword) || (r.supplier?.name || '').toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingRequest(null);
    form.resetFields();
    const today = new Date().toISOString().slice(0, 10);
    form.setFieldsValue({ docDate: today, requestDate: today });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRequest(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      requestDate: record.requestDate,
      postingDate: record.postingDate,
      supplierId: record.supplier?.id,
      warehouseId: record.warehouse?.id,
      reason: record.reason,
      remarks: record.remarks,
    });
    setDetailRows(
      record.items.map((d) => ({
        id: d.id,
        productId: d.product.id,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        discountPercent: d.discountPercent,
        note: d.note,
      }))
    );
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/purchase-requests/${record.id}`)
      .then(() => {
        message.success('Đã xóa yêu cầu mua hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmitRequest(record) {
    axiosClient
      .post(`/purchase-requests/${record.id}/submit`)
      .then(() => {
        message.success('Đã gửi duyệt yêu cầu mua hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Gửi duyệt thất bại'));
  }

  function handleConvert(record) {
    axiosClient
      .post(`/purchase-requests/${record.id}/convert-to-goods-receipt`)
      .then(({ data }) => {
        message.success(`Đã tạo phiếu nhập hàng ${data.data.docNumber} (ở dạng Nháp) - vào trang "Nhập hàng" để tiếp tục`);
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Tạo phiếu nhập hàng thất bại'));
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    detailForm.setFieldsValue({ discountPercent: 0 });
    setDetailModalOpen(true);
  }

  // Tra gia mua goc tu dong theo Bang gia loai PURCHASE - giong het trang Nhap hang.
  function handleProductSelect(productId) {
    detailForm.setFieldsValue({ unitPrice: undefined });
    const warehouseId = form.getFieldValue('warehouseId');
    const date = form.getFieldValue('docDate');
    axiosClient
      .get('/price-lists/lookup', { params: { productId, warehouseId, purpose: 'PURCHASE', date } })
      .then(({ data }) => {
        if (data.data != null) detailForm.setFieldsValue({ unitPrice: data.data });
      })
      .catch((err) => {
        message.error(err.response?.data?.message || 'Không tra được giá mua cho sản phẩm này - vui lòng nhập tay hoặc cấu hình bảng giá');
      });
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
        message.error('Yêu cầu mua hàng phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({
          productId: d.productId,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          discountPercent: d.discountPercent,
          note: d.note,
        })),
      };
      const request = editingRequest
        ? axiosClient.put(`/purchase-requests/${editingRequest.id}`, payload)
        : axiosClient.post('/purchase-requests', payload);
      request
        .then(() => {
          message.success(editingRequest ? 'Cập nhật thành công' : 'Tạo yêu cầu mua hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  // Tinh toan Chiet khau + VAT o Frontend chi de xem truoc (khop y het cach lam o Don giao
  // hang/Hoa don) - so lieu chinh thuc chot lai o backend luc Luu.
  function lineValuesOf(d) {
    const gross = Number(d.quantity || 0) * Number(d.unitPrice || 0);
    const discountAmount = (gross * Number(d.discountPercent || 0)) / 100;
    const lineSubtotal = gross - discountAmount;
    const taxRate = taxRateOf(d.productId);
    const taxAmount = (lineSubtotal * taxRate) / 100;
    const lineTotal = lineSubtotal + taxAmount;
    return { discountAmount, lineSubtotal, taxRate, taxAmount, lineTotal };
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  const subtotalAmount = detailRows.reduce((sum, d) => sum + lineValuesOf(d).lineSubtotal, 0);
  const totalTax = detailRows.reduce((sum, d) => sum + lineValuesOf(d).taxAmount, 0);
  const totalAmount = subtotalAmount + totalTax;

  const columns = [
    { title: 'Số chứng từ', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày yêu cầu', dataIndex: 'requestDate', key: 'requestDate' },
    { title: 'Nhà cung cấp', key: 'supplier', render: (_, r) => r.supplier?.name },
    { title: 'Kho', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => {
              const isOpen = record.status === 'OPEN';
              const isPending = record.status === 'PENDING_APPROVAL';
              return (
                <Space>
                  <Button icon={<EditOutlined />} disabled={!isOpen} onClick={() => openEditModal(record)} />
                  {isOpen && (
                    <Popconfirm title="Gửi duyệt yêu cầu mua hàng này?" description="Sau khi gửi duyệt sẽ không sửa/xóa được nữa." onConfirm={() => handleSubmitRequest(record)}>
                      <Button icon={<SendOutlined />} type="primary" ghost />
                    </Popconfirm>
                  )}
                  {isPending && (
                    <Popconfirm title="Tạo phiếu nhập hàng từ yêu cầu này?" description="Sẽ sinh 1 Phiếu nhập hàng (Nháp) ở trang Nhập hàng và đóng yêu cầu này lại." onConfirm={() => handleConvert(record)}>
                      <Button icon={<SwapOutlined />} type="primary" ghost>
                        Tạo phiếu nhập hàng
                      </Button>
                    </Popconfirm>
                  )}
                  <Popconfirm title="Xóa yêu cầu mua hàng này?" disabled={!isOpen} onConfirm={() => handleDelete(record)}>
                    <Button icon={<DeleteOutlined />} danger disabled={!isOpen} />
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
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'right' },
    { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    { title: '% CK', dataIndex: 'discountPercent', key: 'discountPercent', align: 'right', render: (v) => `${v || 0}%` },
    { title: 'Tiền CK', key: 'discountAmount', align: 'right', render: (_, d) => lineValuesOf(d).discountAmount.toLocaleString('vi-VN') + ' đ' },
    { title: 'Thuế VAT', key: 'taxRate', align: 'right', render: (_, d) => `${lineValuesOf(d).taxRate}%` },
    {
      title: 'Thành tiền (sau thuế)',
      key: 'lineTotal',
      align: 'right',
      render: (_, d) => <Text strong>{lineValuesOf(d).lineTotal.toLocaleString('vi-VN')} đ</Text>,
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
      <Title level={3}>Yêu cầu mua hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số chứng từ hoặc nhà cung cấp..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm yêu cầu mua hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredRequests} loading={loading} />

      <Modal
        title={editingRequest ? `Sửa yêu cầu mua hàng ${editingRequest.docNumber}` : 'Thêm yêu cầu mua hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={900}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số chứng từ" name="docNumber" extra={editingRequest ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingRequest} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày tạo" name="docDate" rules={[{ required: true, message: 'Ngày tạo không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Nhà cung cấp" name="supplierId" rules={[{ required: true, message: 'Nhà cung cấp không được để trống' }]}>
                <Select options={supplierOptions} placeholder="Chọn nhà cung cấp" showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày yêu cầu" name="requestDate" rules={[{ required: true, message: 'Ngày yêu cầu không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kho nhà phân phối" name="warehouseId" rules={[{ required: true, message: 'Kho nhà phân phối không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho" showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày đăng" name="postingDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Người yêu cầu" extra="Tự lấy theo tài khoản đang đăng nhập">
                <Input disabled value={currentUser?.fullName || currentUser?.username || ''} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chi nhánh" extra="Tự lấy theo Chi nhánh đang chọn ở Header">
                <Input disabled value={currentBranchName} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Lý do" name="reason">
                <Input placeholder="VD: Bổ sung tồn kho, hàng sắp hết..." />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Danh sách sản phẩm</Text>
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
            locale={{ emptyText: 'Chọn Kho nhà phân phối ở trên rồi thêm sản phẩm' }}
          />

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={14}>
              <Form.Item label="Diễn giải" name="remarks" style={{ marginBottom: 0 }}>
                <TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <div style={{ textAlign: 'right' }}>
                <Text>Tổng tiền trước thuế: <Text strong>{subtotalAmount.toLocaleString('vi-VN')} đ</Text></Text><br />
                <Text>VAT: <Text strong>{totalTax.toLocaleString('vi-VN')} đ</Text></Text><br />
                <Text>Tổng tiền: <Text strong>{totalAmount.toLocaleString('vi-VN')} đ</Text></Text><br />
                <Text>Tổng số lượng: <Text strong>{totalQty.toLocaleString('vi-VN')}</Text></Text>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Thêm sản phẩm"
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
            <Col span={12}>
              <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Số lượng không được để trống' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đơn giá mua gốc" name="unitPrice" rules={[{ required: true, message: 'Đơn giá không được để trống' }]}>
                <InputNumber min={0} step={1000} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="% Chiết khấu" name="discountPercent">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ghi chú" name="note">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
