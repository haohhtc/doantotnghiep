import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined, CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { fetchUomOptions, defaultUomId } from '../../../utils/uom';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

function statusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã duyệt</Tag>;
  if (status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
  return <Tag color="gold">Nháp</Tag>;
}

// Phieu tra hang cua khach (gop Returns + Return Request thanh 1 buoc) - xem
// backend/.../sales/controller/SalesReturnController.java. Duyet (DRAFT -> CLOSED) se cong lai
// ton kho qua StockService, KHONG tru cong no (project chua co khai niem cong no khach hang).
// Quyen mo giong Sales Order (moi role deu thao tac duoc, khong rieng ADMIN+WAREHOUSE_MANAGER).
export default function SalesReturnPage() {
  const { selectedBranchId } = useBranch();
  const [returns, setReturns] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [uomOptions, setUomOptions] = useState([]);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const salesmanOptions = salesmen.filter((e) => e.type === 'NVBH').map((e) => ({ value: e.id, label: `${e.code} - ${e.fullName}` }));
  const warehouseOptions = warehouses
    .filter((w) => !selectedBranchId || w.branch?.id === selectedBranchId || w.id === editingReturn?.warehouse?.id)
    .map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
  // Hoa don goc chi de THAM KHAO + tu dien goi y dong hang (xem handleInvoiceSelect) - khong khoa
  // Kho/NVBH vi form nay chinh la loi thoat khi auto-dien o man Hoa don khong lam duoc (VD don
  // goc chua co NVBH). Giu rieng hoa don cua phieu dang sua de khong mat label.
  const invoiceOptions = invoices
    .filter((i) => i.id === editingReturn?._invoiceId || !selectedBranchId || i.salesOrder?.warehouse?.branch?.id === selectedBranchId)
    .map((i) => ({ value: i.id, label: `${i.invoiceNumber} - ${i.salesOrder?.customer?.name || ''}` }));

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/sales-returns'),
      axiosClient.get('/employees'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
      axiosClient.get('/invoices'),
    ])
      .then(([retRes, employeesRes, warehousesRes, productsRes, invoicesRes]) => {
        setReturns(retRes.data.data);
        setSalesmen(employeesRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setProducts(productsRes.data.data);
        setInvoices(invoicesRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu phiếu trả hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredReturns = returns.filter((r) => {
    if (selectedBranchId && r.warehouse?.branch?.id !== selectedBranchId) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.docNumber.toLowerCase().includes(keyword) || (r.salesman?.fullName || '').toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingReturn(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    // sales_order chi duoc gan lai qua invoiceId (khong co salesOrderId rieng trong DTO) - suy
    // nguoc lai hoa don tuong ung bang cach doi chieu salesOrder.id, de hien dung lua chon cu.
    const matchedInvoice = invoices.find((i) => i.salesOrder?.id === record.salesOrder?.id);
    setEditingReturn({ ...record, _invoiceId: matchedInvoice?.id });
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      invoiceId: matchedInvoice?.id,
      salesmanId: record.salesman?.id,
      warehouseId: record.warehouse?.id,
      reason: record.reason,
      remarks: record.remarks,
    });
    setDetailRows(record.items.map((d) => ({ id: d.id, productId: d.product.id, uomId: d.uom?.id, uomName: d.uom?.name, quantity: d.quantity, note: d.note })));
    setModalOpen(true);
  }

  // Chon Hoa don goc (tuy chon) -> goi y dien san Kho/NVBH/dong hang tu hoa don do, nguoi dung van
  // sua lai thoai mai (khong khoa) - dac biet huu ich khi don hang goc CHUA co NVBH, luc do chi
  // gan San pham/So luong con NVBH nguoi dung tu chon tay.
  function handleInvoiceSelect(invoiceId) {
    if (!invoiceId) return;
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;
    const mainWarehouse = warehouses.find(
      (w) => w.branch?.id === invoice.salesOrder?.warehouse?.branch?.id && w.warehouseType === 'MAIN'
    );
    form.setFieldsValue({
      warehouseId: mainWarehouse?.id,
      salesmanId: invoice.salesOrder?.salesman?.id,
      remarks: `Trả hàng từ hóa đơn ${invoice.invoiceNumber}`,
    });
    setDetailRows(
      invoice.items.map((i) => ({
        id: Date.now() + i.id,
        productId: i.product.id,
        uomId: i.uom?.id,
        uomName: i.uom?.name,
        quantity: i.quantity,
        note: `Trả từ hóa đơn ${invoice.invoiceNumber}`,
      }))
    );
  }

  // Huy phieu tra hang - thay cho Xoa cung (giu lai ban ghi). Hoat dong duoc ca khi da Duyet
  // (CLOSED) - luc do se tu dong tru lai dung so da cong vao kho.
  function handleCancel(record) {
    axiosClient
      .post(`/sales-returns/${record.id}/cancel`)
      .then(() => {
        message.success('Đã hủy phiếu trả hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Hủy thất bại'));
  }

  function handleConfirmReturn(record) {
    axiosClient
      .post(`/sales-returns/${record.id}/confirm`)
      .then(() => {
        message.success('Đã duyệt phiếu trả hàng - đã cộng vào tồn kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Duyệt thất bại'));
  }

  async function handleProductSelect(productId) {
    const product = products.find((p) => p.id === productId);
    const options = await fetchUomOptions(product);
    setUomOptions(options);
    detailForm.setFieldsValue({ uomId: defaultUomId(product, options) });
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setUomOptions([]);
    setDetailModalOpen(true);
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
        message.error('Phiếu trả hàng phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({ productId: d.productId, uomId: d.uomId, quantity: d.quantity, note: d.note })),
      };
      const request = editingReturn
        ? axiosClient.put(`/sales-returns/${editingReturn.id}`, payload)
        : axiosClient.post('/sales-returns', payload);
      request
        .then(() => {
          message.success(editingReturn ? 'Cập nhật thành công' : 'Tạo phiếu trả hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày chứng từ', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Nhân viên bán hàng', key: 'salesman', render: (_, r) => r.salesman?.fullName || '-' },
    { title: 'Kho', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} disabled={record.status !== 'DRAFT'} onClick={() => openEditModal(record)} />
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Duyệt phiếu trả hàng này?"
              description="Sau khi duyệt sẽ cộng vào tồn kho và không thể sửa/xóa."
              onConfirm={() => handleConfirmReturn(record)}
            >
              <Button icon={<CheckOutlined />} type="primary" ghost />
            </Popconfirm>
          )}
          <Popconfirm
            title="Hủy phiếu trả hàng này?"
            description={record.status === 'CLOSED' ? 'Sẽ trừ lại đúng số đã cộng vào tồn kho.' : undefined}
            disabled={record.status === 'CANCELLED'}
            onConfirm={() => handleCancel(record)}
          >
            <Button icon={<StopOutlined />} danger disabled={record.status === 'CANCELLED'} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'ĐVT', dataIndex: 'uomName', key: 'uomName', render: (v) => v || '-' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
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
      <Title level={3}>Phiếu trả hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu hoặc nhân viên..."
        onAdd={openCreateModal}
        addTooltip="Thêm phiếu trả hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredReturns} loading={loading} />

      <Modal
        title={editingReturn ? `Sửa phiếu trả hàng ${editingReturn.docNumber}` : 'Thêm phiếu trả hàng'}
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
              <Form.Item label="Số phiếu" name="docNumber" extra={editingReturn ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingReturn} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày chứng từ" name="docDate" rules={[{ required: true, message: 'Ngày chứng từ không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Hóa đơn gốc" name="invoiceId" extra="Chọn để tự gợi ý Kho/NVBH/dòng hàng từ hóa đơn (không bắt buộc)">
                <Select
                  options={invoiceOptions}
                  placeholder="Chọn hóa đơn (nếu có)"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={handleInvoiceSelect}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kho nhận trả" name="warehouseId" rules={[{ required: true, message: 'Kho không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nhân viên bán hàng" name="salesmanId" rules={[{ required: true, message: 'Nhân viên bán hàng không được để trống' }]}>
                <Select options={salesmanOptions} placeholder="Chọn nhân viên bán hàng" showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lý do trả" name="reason">
                <Input placeholder="VD: Hàng lỗi, giao nhầm..." />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Ghi chú" name="remarks">
            <TextArea rows={1} />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Chi tiết hàng trả</Text>
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
        title="Thêm dòng hàng trả"
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
          <Form.Item label="Đơn vị tính" name="uomId" extra={uomOptions.length === 0 ? 'Sản phẩm chưa có nhóm quy đổi - tính theo đơn vị cơ sở' : 'Tự động quy đổi về đơn vị cơ sở khi cộng lại kho'}>
            <Select options={uomOptions} placeholder="Chọn đơn vị tính" disabled={uomOptions.length === 0} />
          </Form.Item>
          <Form.Item label="Số lượng" name="quantity" rules={[{ required: true, message: 'Số lượng không được để trống' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
