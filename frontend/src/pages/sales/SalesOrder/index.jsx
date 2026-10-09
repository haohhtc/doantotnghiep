import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TruckOutlined, StopOutlined, FileTextOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';
import { fetchUomOptions, defaultUomId } from '../../../utils/uom';

const { Title, Text } = Typography;

// Pre-order dua len dau vi la loai chinh dung tren web. Van-Sales (STANDARD, dat-giao ngay) bi
// disable tren web - se lam qua App Van-Sales rieng (chua lam), chi con hien de xem/sua don cu.
const ORDER_TYPE_OPTIONS = [
  { value: 'PRE_ORDER', label: 'Pre-order (đặt trước giao sau)' },
  { value: 'STANDARD', label: 'Đơn Van-Sales', disabled: true },
  { value: 'SAMPLE', label: 'Đơn hàng mẫu (miễn phí)' },
];

function orderTypeTag(type) {
  if (type === 'PRE_ORDER') return <Tag color="blue">Pre-order</Tag>;
  if (type === 'SAMPLE') return <Tag color="purple">Hàng mẫu</Tag>;
  return <Tag>Đơn Van-Sales</Tag>;
}

function statusTag(status) {
  if (status === 'CONFIRMED') return <Tag color="green">Đã duyệt</Tag>;
  if (status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
  return <Tag color="gold">Chờ xác nhận</Tag>;
}

// Tra "Loai ghe tham" (Dung tuyen/Trai tuyen) tu lich route_master_outlet cua khach hang doi
// chieu voi ngay dat hang - Thu + Tuan cu the trong nam (ISO week, tu reset moi nam moi, xem
// V40__route_outlet_visit_weeks.sql) - xem tonghop.md Nhom 6.
const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
function computeVisitType(routeInfo, dateStr) {
  if (!routeInfo || !routeInfo.branchId || !dateStr) return null;
  const date = new Date(dateStr);
  const weekdayKey = WEEKDAY_KEYS[date.getDay()];
  const weekNum = isoWeekNumber(date);
  const visitWeeks = (routeInfo.visitWeeks || '').split(',').map((s) => Number(s.trim())).filter(Boolean);
  return routeInfo[weekdayKey] && visitWeeks.includes(weekNum) ? 'ON_ROUTE' : 'OFF_ROUTE';
}

// Trang nay da noi API that (khong con mock) - xem backend/.../sales/controller/SalesOrderController.java.
// SALE-05: xac nhan (CONFIRMED) tu dong tao luon Don giao hang DRAFT, nhung CHUA tru kho - phai
// qua nut "Xac nhan giao hang" ngay tren trang "Don giao hang" (/sales/delivery-orders, da gop
// chung 1 trang) moi thuc su xuat kho, dung chuoi DMS goc SO -> DO -> Xac nhan DO (xem V33 +
// DeliveryOrderService).
// Nhom 6 (tonghop.md): validate Khach hang phai thuoc dung Chi nhanh dang chon o Header (suy ra
// tu tuyen cua khach, GET /api/customers/{id}/route-info) + tu dong tinh "Loai ghe tham".
export default function SalesOrderPage() {
  const { selectedBranch, selectedBranchId } = useBranch();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [customerRouteInfo, setCustomerRouteInfo] = useState(null);
  const [invoicedOrderIds, setInvoicedOrderIds] = useState(new Set());
  const [deliveredOrderIds, setDeliveredOrderIds] = useState(new Set());
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [massConfirming, setMassConfirming] = useState(false);
  const [requesterModalOpen, setRequesterModalOpen] = useState(false);
  const [uomOptions, setUomOptions] = useState([]);
  const [branchProducts, setBranchProducts] = useState([]);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  // Giu rieng khach hang/dong SP cua don dang sua du no khac chi nhanh dang loc, tranh lap lai
  // bug mat label o Select (giong warehouseOptions ben duoi).
  const customerOptions = customers
    .filter((c) => c.id === editingOrder?.customer?.id || !selectedBranchId || c.branch?.id === selectedBranchId)
    .map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
  const orderType = Form.useWatch('orderType', form);
  // Kho xuat gio tu suy tu Khach hang (xem autoFillWarehouse) nen field bi khoa - options o day
  // chi can du de Select hien dung label cho gia tri da duoc gan (tu dong hoac cua don dang sua).
  const warehouseOptions = warehouses
    .filter((w) => w.id === editingOrder?.warehouse?.id || !selectedBranchId || w.branch?.id === selectedBranchId)
    .map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  // Chi hien SP da duoc "Phan bo theo chi nhanh" (Item-Branch Assignment) cho dung chi nhanh dang
  // chon - giu rieng cac dong SP da co san trong don (du khac chi nhanh) de khong mat label.
  const branchProductIds = new Set(branchProducts.map((ib) => ib.product.id));
  const productOptions = products
    .filter((p) => !selectedBranchId || branchProductIds.has(p.id) || detailRows.some((d) => d.productId === p.id))
    .map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
  const visitType = computeVisitType(customerRouteInfo, Form.useWatch('docDate', form));
  const branchMismatch = customerRouteInfo?.branchId && selectedBranchId && customerRouteInfo.branchId !== selectedBranchId;

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function handleCustomerSelect(customerId) {
    setCustomerRouteInfo(null);
    if (!customerId) return;
    axiosClient
      .get(`/customers/${customerId}/route-info`)
      .then(({ data }) => setCustomerRouteInfo(data.data))
      .catch(() => setCustomerRouteInfo(null));
  }

  // Kho xuat khong con cho chon tay - tu suy tu Khach hang: khach thuoc chi nhanh nao thi xuat tu
  // Kho Main cua dung chi nhanh do. Chi goi khi NGUOI DUNG tu doi Khach hang (onChange cua Select),
  // KHONG goi khi mo lai don cu de sua (giu dung kho da luu cua don do, xem openEditModal).
  function autoFillWarehouse(customerId) {
    if (!customerId) {
      form.setFieldsValue({ warehouseId: undefined });
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    const mainWarehouse = customer?.branch?.id
      ? warehouses.find((w) => w.branch?.id === customer.branch.id && w.warehouseType === 'MAIN')
      : null;
    if (!mainWarehouse) {
      message.error('Khách hàng này thuộc chi nhánh chưa có Kho chính (Main) - vui lòng cấu hình kho trước');
      form.setFieldsValue({ warehouseId: undefined });
      return;
    }
    form.setFieldsValue({ warehouseId: mainWarehouse.id });
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/sales-orders'),
      axiosClient.get('/customers'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
      axiosClient.get('/invoices'),
      axiosClient.get('/delivery-orders'),
    ])
      .then(([ordersRes, customersRes, warehousesRes, productsRes, invoicesRes, deliveryOrdersRes]) => {
        setOrders(ordersRes.data.data);
        setCustomers(customersRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setProducts(productsRes.data.data);
        setInvoicedOrderIds(new Set(invoicesRes.data.data.map((i) => i.salesOrder.id)));
        setDeliveredOrderIds(
          new Set(deliveryOrdersRes.data.data.filter((d) => d.status === 'CLOSED').map((d) => d.salesOrder.id))
        );
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu đơn hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedBranchId) { setBranchProducts([]); return; }
    axiosClient
      .get(`/branches/${selectedBranchId}/products`)
      .then(({ data }) => setBranchProducts(data.data))
      .catch(() => setBranchProducts([]));
  }, [selectedBranchId]);

  const filteredOrders = orders.filter((o) => {
    if (selectedBranchId && o.warehouse?.branch?.id !== selectedBranchId) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return o.docNumber.toLowerCase().includes(keyword) || (o.customer?.name || '').toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingOrder(null);
    form.resetFields();
    // Van-Sales (STANDARD) bi disable tren web nen mac dinh la Pre-order - xem ORDER_TYPE_OPTIONS.
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10), orderType: 'PRE_ORDER' });
    setDetailRows([]);
    setCustomerRouteInfo(null);
    setModalOpen(true);
  }

  // Don mau: don gia luon = 0 (mien phi) - ep lai cac dong da them khi doi sang SAMPLE. Kho xuat gio
  // luon la Kho Main (tu suy tu khach hang - xem autoFillWarehouse) nen khong can xu ly rieng cho
  // Pre-order nua.
  function handleOrderTypeChange(type) {
    if (type === 'SAMPLE') {
      setDetailRows((prev) => prev.map((d) => ({ ...d, unitPrice: 0 })));
    }
  }

  function openEditModal(record) {
    setEditingOrder(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      customerId: record.customer?.id,
      warehouseId: record.warehouse?.id,
      orderType: record.orderType || 'STANDARD',
      deliveryDate: record.deliveryDate,
    });
    setDetailRows(record.details.map((d) => ({ id: d.id, productId: d.product.id, uomId: d.uom?.id, uomName: d.uom?.name, quantity: d.quantity, unitPrice: d.unitPrice })));
    handleCustomerSelect(record.customer?.id);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/sales-orders/${record.id}`)
      .then(() => {
        message.success('Đã xóa đơn hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleConfirmOrder(record) {
    axiosClient
      .post(`/sales-orders/${record.id}/confirm`)
      .then(() => {
        message.success('Đã xác nhận đơn hàng và tự động tạo Đơn giao hàng - vào "Xác nhận giao hàng" để xuất kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'));
  }

  function handleCancelOrder(record) {
    axiosClient
      .post(`/sales-orders/${record.id}/cancel`)
      .then(() => {
        message.success('Đã hủy đơn hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Hủy thất bại'));
  }

  function handleCreateInvoice(record) {
    axiosClient
      .post('/invoices', null, { params: { salesOrderId: record.id } })
      .then(() => {
        message.success('Đã xuất hóa đơn');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xuất hóa đơn thất bại'));
  }

  // Mass Process Delivery: duyet hang loat cac don PENDING da chon (chi doi trang thai, khong
  // dung kho nua - xem V33) - goi lap lai API confirm cho tung don, bao loi rieng don nao that
  // bai ma khong chan cac don con lai.
  function handleMassConfirm() {
    setMassConfirming(true);
    const ids = [...selectedOrderIds];
    let successCount = 0;
    const failed = [];
    Promise.allSettled(ids.map((id) => axiosClient.post(`/sales-orders/${id}/confirm`)))
      .then((results) => {
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') {
            successCount += 1;
          } else {
            const order = orders.find((o) => o.id === ids[idx]);
            failed.push(`${order?.docNumber || ids[idx]}: ${r.reason?.response?.data?.message || 'Lỗi không xác định'}`);
          }
        });
        if (successCount > 0) message.success(`Đã xác nhận thành công ${successCount}/${ids.length} đơn hàng`);
        if (failed.length > 0) {
          Modal.error({ title: 'Một số đơn hàng xác nhận thất bại', content: <div>{failed.map((f) => <div key={f}>{f}</div>)}</div> });
        }
        setSelectedOrderIds([]);
        loadData();
      })
      .finally(() => setMassConfirming(false));
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setUomOptions([]);
    setDetailModalOpen(true);
  }

  // Tra gia tu dong theo Bang gia loai SALE + DVT dang chon: customer.price_list_id -> branch.price_list_id
  // (qua kho xuat). Bang gia chi co gia 1 DVT thi backend tu quy doi sang DVT khac theo he so. Don mau
  // (SAMPLE) luon = 0. O gia bi khoa, khong tra duoc gia thi bao loi va khong them duoc dong.
  function lookupPrice(productId, uomId) {
    if (form.getFieldValue('orderType') === 'SAMPLE') {
      detailForm.setFieldsValue({ unitPrice: 0 });
      return;
    }
    detailForm.setFieldsValue({ unitPrice: undefined });
    const customerId = form.getFieldValue('customerId');
    const warehouseId = form.getFieldValue('warehouseId');
    const date = form.getFieldValue('docDate');
    axiosClient
      .get('/price-lists/lookup', { params: { productId, customerId, warehouseId, purpose: 'SALE', uomId, date } })
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
        message.error('Đơn hàng phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      if (branchMismatch) {
        message.error(
          `Khách hàng này thuộc chi nhánh "${customerRouteInfo.branchName}" - không thuộc chi nhánh "${selectedBranch?.name}" đang chọn ở Header`
        );
        return;
      }
      const payload = {
        ...values,
        deliveryDate: values.deliveryDate || null,
        details: detailRows.map((d) => ({ productId: d.productId, uomId: d.uomId, quantity: d.quantity, unitPrice: d.unitPrice })),
      };
      const request = editingOrder
        ? axiosClient.put(`/sales-orders/${editingOrder.id}`, payload)
        : axiosClient.post('/sales-orders', payload);
      request
        .then(() => {
          message.success(editingOrder ? 'Cập nhật thành công' : 'Tạo đơn hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  // Uoc tinh thue o Frontend (Nhom "Invoices" - tonghop.md muc 5): chi de xem truoc, KHONG luu gi
  // xuong DB - so lieu thue chinh thuc chi chot va luu that trong invoice_item luc "Xuat hoa don".
  function taxRateOf(productId) {
    const product = products.find((p) => p.id === productId);
    return product?.saleTaxGroup ? Number(product.saleTaxGroup.ratePercent) : 0;
  }

  const totalQty = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0), 0);
  const subtotalAmount = detailRows.reduce((sum, d) => sum + Number(d.quantity || 0) * Number(d.unitPrice || 0), 0);
  const estimatedTax = detailRows.reduce(
    (sum, d) => sum + (Number(d.quantity || 0) * Number(d.unitPrice || 0) * taxRateOf(d.productId)) / 100,
    0
  );
  const totalAmount = subtotalAmount + estimatedTax;

  const columns = [
    { title: 'Số đơn', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày đặt hàng', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Khách hàng', key: 'customer', render: (_, o) => o.customer?.name },
    { title: 'Loại đơn', dataIndex: 'orderType', key: 'orderType', render: (t) => orderTypeTag(t) },
    { title: 'Yêu cầu gốc', key: 'salesRequest', render: (_, o) => o.salesRequest?.docNumber || '-' },
    { title: 'Kho xuất', key: 'warehouse', render: (_, o) => o.warehouse?.name },
    { title: 'Ngày giao', dataIndex: 'deliveryDate', key: 'deliveryDate', render: (v) => v || '-' },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => Number(v)?.toLocaleString('vi-VN') + ' đ',
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        const isDelivered = deliveredOrderIds.has(record.id);
        const hasInvoice = invoicedOrderIds.has(record.id);
        return (
          <Space>
            <Button icon={<EditOutlined />} disabled={!isPending} onClick={() => openEditModal(record)} />
            {isPending && (
              <>
                <Popconfirm
                  title="Xác nhận tạo đơn giao hàng?"
                  description="Đơn sẽ được duyệt (không thể sửa/hủy) và tự động tạo sẵn 1 Đơn giao hàng - chưa xuất kho ngay, vào trang Xác nhận giao hàng để xuất kho."
                  onConfirm={() => handleConfirmOrder(record)}
                >
                  <Button icon={<TruckOutlined />} type="primary" ghost title="Xác nhận tạo đơn giao hàng" />
                </Popconfirm>
                <Popconfirm title="Hủy đơn hàng này?" onConfirm={() => handleCancelOrder(record)}>
                  <Button icon={<StopOutlined />} />
                </Popconfirm>
              </>
            )}
            {isDelivered && !hasInvoice && (
              <Popconfirm title="Xuất hóa đơn cho đơn hàng này?" description="Sẽ trừ tồn thực tế ở Kho xe tải theo số lượng đã giao." onConfirm={() => handleCreateInvoice(record)}>
                <Button icon={<FileTextOutlined />} title="Xuất hóa đơn" />
              </Popconfirm>
            )}
            <Popconfirm title="Xóa đơn hàng này?" disabled={!isPending} onConfirm={() => handleDelete(record)}>
              <Button icon={<DeleteOutlined />} danger disabled={!isPending} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Mass Process Delivery: chi cho chon cac don PENDING (khong the xac nhan hang loat don da
  // xong/da huy) - xem tonghop.md.
  const rowSelection = {
    selectedRowKeys: selectedOrderIds,
    onChange: setSelectedOrderIds,
    getCheckboxProps: (record) => ({ disabled: record.status !== 'PENDING' }),
  };

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'ĐVT', dataIndex: 'uomName', key: 'uomName', render: (v) => v || '-' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => v?.toLocaleString('vi-VN') + ' đ' },
    {
      title: 'Thành tiền',
      key: 'amount',
      render: (_, d) => (d.quantity * d.unitPrice).toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Thuế (ước tính)',
      key: 'tax',
      render: (_, d) => `${taxRateOf(d.productId)}%`,
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
      <Title level={3}>Quản lý bán hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số đơn hoặc khách hàng..."
        onAdd={openCreateModal}
        addTooltip="Thêm đơn hàng"
        onReload={() => {
          loadData();
          setSearchText('');
          setSelectedOrderIds([]);
        }}
        betweenReloadExport={
          <Tooltip title="Người yêu cầu / tạo đơn">
            <Button icon={<UserOutlined />} onClick={() => setRequesterModalOpen(true)} />
          </Tooltip>
        }
        beforeFilter={
          selectedOrderIds.length > 0 && (
            <Popconfirm
              title={`Xác nhận hàng loạt ${selectedOrderIds.length} đơn hàng đã chọn?`}
              description="Chỉ duyệt đơn, chưa xuất kho - đơn nào lỗi sẽ báo riêng, không chặn các đơn còn lại."
              onConfirm={handleMassConfirm}
            >
              <Button type="primary" icon={<ThunderboltOutlined />} loading={massConfirming}>
                Xác nhận hàng loạt ({selectedOrderIds.length})
              </Button>
            </Popconfirm>
          )
        }
      />

      <Table rowKey="id" rowSelection={rowSelection} columns={columns} dataSource={filteredOrders} loading={loading} />

      <Modal
        title={editingOrder ? `Sửa đơn hàng ${editingOrder.docNumber}` : 'Thêm đơn hàng'}
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
              <Form.Item label="Số đơn" name="docNumber" extra={editingOrder ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingOrder} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày đặt hàng" name="docDate" rules={[{ required: true, message: 'Ngày đặt hàng không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Loại đơn"
                name="orderType"
                rules={[{ required: true, message: 'Chọn loại đơn' }]}
                extra={orderType === 'STANDARD' ? 'Đơn Van-Sales (giao ngay) - tạo mới sẽ qua App Van-Sales (đang phát triển)' : undefined}
              >
                <Select options={ORDER_TYPE_OPTIONS} onChange={handleOrderTypeChange} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Ngày giao hàng"
                name="deliveryDate"
                rules={[{ required: orderType === 'PRE_ORDER', message: 'Đơn Pre-order bắt buộc chọn Ngày giao hàng' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Khách hàng" name="customerId" rules={[{ required: true, message: 'Khách hàng không được để trống' }]}>
                <Select
                  options={customerOptions}
                  placeholder="Chọn khách hàng"
                  onChange={(customerId) => { handleCustomerSelect(customerId); autoFillWarehouse(customerId); }}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Kho xuất"
                name="warehouseId"
                rules={[{ required: true, message: 'Chọn khách hàng để tự xác định kho xuất' }]}
                extra="Tự động theo chi nhánh của khách hàng (Kho chính)"
              >
                <Select options={warehouseOptions} placeholder="Tự động khi chọn khách hàng" disabled />
              </Form.Item>
            </Col>
          </Row>
          {(visitType || branchMismatch) && (
            <Space style={{ marginBottom: 16 }}>
              {visitType === 'ON_ROUTE' && <Tag color="green">Đúng tuyến</Tag>}
              {visitType === 'OFF_ROUTE' && <Tag color="orange">Trái tuyến</Tag>}
              {branchMismatch && (
                <Tag color="red">
                  Khách hàng thuộc chi nhánh "{customerRouteInfo.branchName}" - khác chi nhánh đang chọn "{selectedBranch?.name}"
                </Tag>
              )}
            </Space>
          )}
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Chi tiết đơn hàng</Text>
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
          <Text>Tiền hàng: <Text strong>{subtotalAmount.toLocaleString('vi-VN')} đ</Text></Text>
          <Text>Thuế ước tính: <Text strong>{estimatedTax.toLocaleString('vi-VN')} đ</Text></Text>
          <Text>
            Tổng cộng ước tính: <Text strong>{totalAmount.toLocaleString('vi-VN')} đ</Text>
          </Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          * Số liệu thuế chỉ là ước tính hiển thị trước, chốt chính thức khi bấm "Xuất hóa đơn" sau khi đơn đã xác nhận.
        </Text>
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
          <Form.Item
            label="Sản phẩm"
            name="productId"
            rules={[{ required: true, message: 'Sản phẩm không được để trống' }]}
          >
            <Select
              options={productOptions}
              placeholder="Chọn sản phẩm"
              onChange={handleProductSelect}
            />
          </Form.Item>
          <Form.Item
            label="Đơn vị tính"
            name="uomId"
            extra={uomOptions.length === 0 ? 'Sản phẩm chưa có nhóm quy đổi - tính theo đơn vị cơ sở' : undefined}
          >
            <Select options={uomOptions} placeholder="Chọn đơn vị tính" disabled={uomOptions.length === 0} onChange={handleUomChange} />
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
        title="Người yêu cầu / tạo đơn"
        open={requesterModalOpen}
        onCancel={() => setRequesterModalOpen(false)}
        footer={<Button onClick={() => setRequesterModalOpen(false)}>Đóng</Button>}
        width={640}
        destroyOnHidden
      >
        <Table
          rowKey="id"
          size="small"
          dataSource={orders}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Số đơn', dataIndex: 'docNumber', key: 'docNumber' },
            { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
            {
              title: 'Người yêu cầu',
              key: 'createdBy',
              render: (_, o) => o.createdBy?.fullName || o.createdBy?.username || '-',
            },
          ]}
        />
      </Modal>
    </div>
  );
}
