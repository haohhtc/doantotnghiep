import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, StopOutlined, FileTextOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;

function statusTag(status) {
  if (status === 'CONFIRMED') return <Tag color="green">Đã duyệt</Tag>;
  if (status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
  return <Tag color="gold">Chờ xác nhận</Tag>;
}

// Tra "Loai ghe tham" (Dung tuyen/Trai tuyen) tu lich route_master_outlet cua khach hang doi
// chieu voi ngay dat hang - Thu + Tuan trong thang (Math.ceil(ngay/7)) - xem tonghop.md Nhom 6.
const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function computeVisitType(routeInfo, dateStr) {
  if (!routeInfo || !routeInfo.branchId || !dateStr) return null;
  const date = new Date(dateStr);
  const weekdayKey = WEEKDAY_KEYS[date.getDay()];
  const weekKey = `week${Math.ceil(date.getDate() / 7)}`;
  return routeInfo[weekdayKey] && routeInfo[weekKey] ? 'ON_ROUTE' : 'OFF_ROUTE';
}

// Trang nay da noi API that (khong con mock) - xem backend/.../sales/controller/SalesOrderController.java.
// SALE-05: xac nhan (CONFIRMED) CHI duyet don, KHONG tru kho nua - phai qua trang "Don giao hang"
// (/sales/delivery-orders) roi "Xac nhan giao hang" (/sales/delivery-confirm) moi thuc su xuat
// kho, dung chuoi DMS goc SO -> DO -> Xac nhan DO (xem V33 + DeliveryOrderService).
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
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const customerOptions = customers.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));
  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
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

  const filteredOrders = orders.filter((o) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return o.docNumber.toLowerCase().includes(keyword) || (o.customer?.name || '').toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setCustomerRouteInfo(null);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingOrder(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      customerId: record.customer?.id,
      warehouseId: record.warehouse?.id,
    });
    setDetailRows(record.details.map((d) => ({ id: d.id, productId: d.product.id, quantity: d.quantity, unitPrice: d.unitPrice })));
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
        message.success('Đã xác nhận đơn hàng - tiếp theo vào "Đơn giao hàng" để tạo lệnh giao');
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
    setDetailModalOpen(true);
  }

  // Tra gia tu dong theo Bang gia loai SALE: customer.price_list_id -> branch.price_list_id (qua
  // kho xuat). KHONG con fallback ve product.price (da bi xoa cot) - neu khong tim duoc gia hop
  // le, backend nem loi ro rang va o day hien thi loi cho nguoi dung, khong tu dien gia nao ca.
  // Van cho sua tay unitPrice sau khi dien tu dong (khong disable field), khop hanh vi truoc day.
  function handleProductSelect(productId) {
    detailForm.setFieldsValue({ unitPrice: undefined });

    const customerId = form.getFieldValue('customerId');
    const warehouseId = form.getFieldValue('warehouseId');
    axiosClient
      .get('/price-lists/lookup', { params: { productId, customerId, warehouseId, purpose: 'SALE' } })
      .then(({ data }) => {
        if (data.data != null) {
          detailForm.setFieldsValue({ unitPrice: data.data });
        }
      })
      .catch((err) => {
        message.error(err.response?.data?.message || 'Không tra được giá bán cho sản phẩm này - vui lòng nhập tay hoặc cấu hình bảng giá');
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
        details: detailRows.map((d) => ({ productId: d.productId, quantity: d.quantity, unitPrice: d.unitPrice })),
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
    { title: 'Kho xuất', key: 'warehouse', render: (_, o) => o.warehouse?.name },
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
                  title="Xác nhận đơn hàng này?"
                  description="Sau khi xác nhận sẽ duyệt đơn (không thể sửa/hủy) - chưa xuất kho ngay, cần tạo Đơn giao hàng và Xác nhận giao hàng mới xuất kho."
                  onConfirm={() => handleConfirmOrder(record)}
                >
                  <Button icon={<CheckOutlined />} type="primary" ghost />
                </Popconfirm>
                <Popconfirm title="Hủy đơn hàng này?" onConfirm={() => handleCancelOrder(record)}>
                  <Button icon={<StopOutlined />} />
                </Popconfirm>
              </>
            )}
            {isDelivered && !hasInvoice && (
              <Popconfirm title="Xuất hóa đơn cho đơn hàng này?" onConfirm={() => handleCreateInvoice(record)}>
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
              <Form.Item label="Kho xuất" name="warehouseId" rules={[{ required: true, message: 'Kho xuất không được để trống' }]}>
                <Select options={warehouseOptions} placeholder="Chọn kho" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Khách hàng" name="customerId" rules={[{ required: true, message: 'Khách hàng không được để trống' }]}>
                <Select options={customerOptions} placeholder="Chọn khách hàng" onChange={handleCustomerSelect} showSearch optionFilterProp="label" />
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
