import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { fetchUomOptions, defaultUomId } from '../../../utils/uom';

const { Title, Text } = Typography;

function statusTag(status) {
  if (status === 'CONVERTED') return <Tag color="green">Đã chuyển thành đơn hàng</Tag>;
  return <Tag color="gold">Nháp</Tag>;
}

// Yeu cau ban hang (SR) - buoc ghi tam TRUOC Don hang ban (SO), dung theo dung chuoi DMS goc
// SR -> SO -> DO -> Xac nhan DO (xem backend/.../sales/service/SalesRequestService.java). Khong
// co kho xuat (chua chot luc ghi tam), khong dung gi den ton kho. Chuyen thanh Don hang ban qua
// nut "Chuyen thanh don hang" (chon kho xuat luc chuyen), sau do thao tac tiep o trang Don hang
// ban nhu binh thuong.
export default function SalesRequestPage() {
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [uomOptions, setUomOptions] = useState([]);
  const [convertModalRequest, setConvertModalRequest] = useState(null);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();
  const [convertForm] = Form.useForm();

  const customerOptions = customers.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/sales-requests'),
      axiosClient.get('/customers'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ])
      .then(([reqRes, custRes, whRes, prodRes]) => {
        setRequests(reqRes.data.data);
        setCustomers(custRes.data.data);
        setWarehouses(whRes.data.data);
        setProducts(prodRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu yêu cầu bán hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = requests.filter((r) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.docNumber.toLowerCase().includes(keyword) || (r.customer?.name || '').toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingRequest(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRequest(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      customerId: record.customer?.id,
      remarks: record.remarks,
    });
    setDetailRows(record.items.map((d) => ({ id: d.id, productId: d.product.id, uomId: d.uom?.id, uomName: d.uom?.name, quantity: d.quantity, unitPrice: d.unitPrice })));
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/sales-requests/${record.id}`)
      .then(() => {
        message.success('Đã xóa yêu cầu bán hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setUomOptions([]);
    setDetailModalOpen(true);
  }

  // Tra gia tu dong theo Bang gia loai SALE cua khach hang + DVT dang chon - giong pattern o trang Don hang
  // ban. SR chua co kho xuat nen KHONG truyen warehouseId - chi xet duoc nhanh customer.price_list_id, du
  // dung vi day la nhanh uu tien dau trong PriceListService. Bang gia thieu DVT thi backend tu quy doi.
  function lookupPrice(productId, uomId) {
    detailForm.setFieldsValue({ unitPrice: undefined });
    const customerId = form.getFieldValue('customerId');
    axiosClient
      .get('/price-lists/lookup', { params: { productId, customerId, purpose: 'SALE', uomId } })
      .then(({ data }) => {
        if (data.data != null) detailForm.setFieldsValue({ unitPrice: data.data });
      })
      .catch((err) => {
        message.error(err.response?.data?.message || 'Không tra được giá bán cho sản phẩm này - vui lòng cấu hình bảng giá');
      });
  }

  async function handleProductSelect(productId) {
    const product = products.find((p) => p.id === productId);
    const options = await fetchUomOptions(product);
    setUomOptions(options);
    const uomId = defaultUomId(product, options);
    detailForm.setFieldsValue({ uomId });
    lookupPrice(productId, uomId);
  }

  function handleUomChange(uomId) {
    lookupPrice(detailForm.getFieldValue('productId'), uomId);
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
        message.error('Yêu cầu bán hàng phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({ productId: d.productId, uomId: d.uomId, quantity: d.quantity, unitPrice: d.unitPrice })),
      };
      const request = editingRequest
        ? axiosClient.put(`/sales-requests/${editingRequest.id}`, payload)
        : axiosClient.post('/sales-requests', payload);
      request
        .then(() => {
          message.success(editingRequest ? 'Cập nhật thành công' : 'Tạo yêu cầu bán hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  function openConvertModal(record) {
    convertForm.resetFields();
    setConvertModalRequest(record);
  }

  function handleConvert() {
    convertForm.validateFields().then(({ warehouseId }) => {
      axiosClient
        .post(`/sales-requests/${convertModalRequest.id}/convert`, null, { params: { warehouseId } })
        .then(({ data }) => {
          message.success(`Đã chuyển thành đơn hàng bán ${data.data.docNumber}`);
          setConvertModalRequest(null);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Chuyển đổi thất bại'));
    });
  }

  const columns = [
    { title: 'Số yêu cầu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày lập', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Khách hàng', key: 'customer', render: (_, r) => r.customer?.name },
    {
      title: 'Tổng tiền (dự kiến)',
      key: 'total',
      align: 'right',
      render: (_, r) => r.items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0).toLocaleString('vi-VN') + ' đ',
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const isDraft = record.status === 'DRAFT';
        return (
          <Space>
            <Button icon={<EditOutlined />} disabled={!isDraft} onClick={() => openEditModal(record)} />
            {isDraft && (
              <Button icon={<SwapOutlined />} type="primary" ghost onClick={() => openConvertModal(record)}>
                Chuyển thành đơn hàng
              </Button>
            )}
            <Popconfirm title="Xóa yêu cầu bán hàng này?" disabled={!isDraft} onConfirm={() => handleDelete(record)}>
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
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => v?.toLocaleString('vi-VN') + ' đ' },
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
      <Title level={3}>Yêu cầu bán hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số yêu cầu hoặc khách hàng..."
        onAdd={openCreateModal}
        addTooltip="Thêm yêu cầu bán hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingRequest ? `Sửa yêu cầu ${editingRequest.docNumber}` : 'Thêm yêu cầu bán hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={760}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Số yêu cầu" name="docNumber" extra={editingRequest ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingRequest} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày lập" name="docDate" rules={[{ required: true, message: 'Ngày lập không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Khách hàng" name="customerId" rules={[{ required: true, message: 'Khách hàng không được để trống' }]}>
                <Select options={customerOptions} placeholder="Chọn khách hàng" showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="remarks">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Chi tiết yêu cầu</Text>
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
          <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}>
            <Select options={productOptions} placeholder="Chọn sản phẩm" showSearch optionFilterProp="label" onChange={handleProductSelect} />
          </Form.Item>
          <Form.Item label="Đơn vị tính" name="uomId" extra={uomOptions.length === 0 ? 'Sản phẩm chưa có nhóm quy đổi - tính theo đơn vị cơ sở' : undefined}>
            <Select options={uomOptions} placeholder="Chọn đơn vị tính" disabled={uomOptions.length === 0} onChange={handleUomChange} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Số lượng không được để trống' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Đơn giá"
                name="unitPrice"
                rules={[{ required: true, message: 'Chọn sản phẩm để tự lấy đơn giá theo bảng giá' }]}
                extra="Tự lấy theo bảng giá của khách hàng - không sửa tay được"
              >
                <InputNumber disabled min={0} step={1000} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={`Chuyển "${convertModalRequest?.docNumber}" thành đơn hàng bán`}
        open={!!convertModalRequest}
        onOk={handleConvert}
        onCancel={() => setConvertModalRequest(null)}
        okText="Chuyển đổi"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={convertForm} layout="vertical">
          <Form.Item label="Kho xuất" name="warehouseId" rules={[{ required: true, message: 'Chọn kho xuất không được để trống' }]} extra="Yêu cầu bán hàng chưa có kho xuất - chọn kho lúc chuyển thành đơn hàng chính thức.">
            <Select options={warehouseOptions} placeholder="Chọn kho" showSearch optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
