import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, UserOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;

function statusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã giao (đã xuất kho)</Tag>;
  return <Tag color="gold">Chờ giao</Tag>;
}

// Khop y het nhan cua ORDER_TYPE_OPTIONS ben Don hang ban (xem pages/sales/SalesOrder/index.jsx).
function orderTypeLabel(type) {
  if (type === 'PRE_ORDER') return 'Pre-order (đặt trước giao sau)';
  if (type === 'SAMPLE') return 'Đơn hàng mẫu (miễn phí)';
  return 'Đơn Van-Sales';
}

// Don giao hang (DO) - tach rieng khoi Don hang ban (SO) theo dung chuoi DMS goc SO -> DO -> Xac
// nhan DO. Trang nay gop ca tao/sua/xoa lenh giao (chi khi con DRAFT) LAN Xac nhan giao hang (tru
// kho that, DRAFT -> CLOSED) - truoc day la 2 trang rieng, da gop lam 1 theo yeu cau nguoi dung -
// xem backend/.../sales/service/DeliveryOrderService.java.
export default function DeliveryOrderPage() {
  const { selectedBranchId } = useBranch();
  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmedByModalOpen, setConfirmedByModalOpen] = useState(false);
  const [form] = Form.useForm();

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  // Chi cho tao DO tu don da duyet (CONFIRMED) va chua co DO nao - danh sach nay tu dong loai bo
  // dan cac don da co DO khi bam Them.
  const usedSalesOrderIds = new Set(deliveryOrders.map((d) => d.salesOrder.id));
  const availableSalesOrders = salesOrders.filter((o) => o.status === 'CONFIRMED' && !usedSalesOrderIds.has(o.id));
  // Khi sua DO da co, Don hang ban cua no bi loai khoi availableSalesOrders (vi da "used") nen
  // phai them rieng option cua chinh no vao, khong thi Select khong tra duoc label va hien thang ID so.
  const editingSalesOrderOption = editingOrder
    ? { value: editingOrder.salesOrder.id, label: `${editingOrder.salesOrder.docNumber} - ${editingOrder.salesOrder.customer?.name || ''}` }
    : null;
  const salesOrderOptions = [
    ...availableSalesOrders.map((o) => ({ value: o.id, label: `${o.docNumber} - ${o.customer?.name || ''}` })),
    ...(editingSalesOrderOption ? [editingSalesOrderOption] : []),
  ];
  // Don hang ban dang duoc chon (tao moi: theo dung Select dang chon; sua don cu: luon la don goc
  // cua chinh no) - dung de hien lai cac truong tham khao (Loai don, Ngay dat, Ngay giao, Khach
  // hang, Tuyen, NVBH...) y het ben Don hang ban, KHONG luu/gui lai len server - chi la man anh
  // cua du lieu da chot san tren Don hang ban goc.
  const watchedSalesOrderId = Form.useWatch('salesOrderId', form);
  const selectedSalesOrder = editingOrder?.salesOrder || salesOrders.find((o) => o.id === watchedSalesOrderId) || null;

  function optionLabel(options, id) {
    return options.find((o) => o.value === id)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/delivery-orders'),
      axiosClient.get('/sales-orders'),
      axiosClient.get('/warehouses'),
      axiosClient.get('/products'),
    ])
      .then(([doRes, soRes, whRes, prodRes]) => {
        setDeliveryOrders(doRes.data.data);
        setSalesOrders(soRes.data.data);
        setWarehouses(whRes.data.data);
        setProducts(prodRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu đơn giao hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = deliveryOrders.filter((d) => {
    if (selectedBranchId && d.warehouse?.branch?.id !== selectedBranchId) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return d.docNumber.toLowerCase().includes(keyword) || d.salesOrder.docNumber.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({ docDate: new Date().toISOString().slice(0, 10) });
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingOrder(record);
    form.setFieldsValue({
      docNumber: record.docNumber,
      docDate: record.docDate,
      salesOrderId: record.salesOrder.id,
      warehouseId: record.warehouse.id,
      remarks: record.remarks,
    });
    // Don gia chi de XEM (khong luu o DeliveryOrderItem) - lay lai tu dung dong trong Don hang ban
    // goc theo San pham+DVT, giong cach handleSalesOrderSelect lam.
    setDetailRows(
      record.items.map((d) => {
        const soLine = record.salesOrder.details?.find(
          (sd) => sd.product.id === d.product.id && (sd.uom?.id || null) === (d.uom?.id || null)
        );
        return {
          id: d.id,
          productId: d.product.id,
          uomId: d.uom?.id,
          uomName: d.uom?.name,
          quantity: d.quantity,
          orderedQty: d.quantity,
          unitPrice: soLine?.unitPrice,
          note: d.note,
        };
      })
    );
    setModalOpen(true);
  }

  // Chon Don hang ban goc -> tu dong dien San pham + kho xuat + so luong DA DAT + Don gia (chi de
  // xem, giong bang Chi tiet don hang cua Don hang ban), cho sua lai so luong truoc khi Luu de
  // phan anh so luong giao thuc te (VD giao thieu do het hang).
  function handleSalesOrderSelect(salesOrderId) {
    const order = salesOrders.find((o) => o.id === salesOrderId);
    if (!order) return;
    form.setFieldsValue({ warehouseId: order.warehouse?.id });
    setDetailRows(
      order.details.map((d) => ({
        id: d.id,
        productId: d.product.id,
        uomId: d.uom?.id,
        uomName: d.uom?.name,
        quantity: d.quantity,
        orderedQty: d.quantity,
        unitPrice: d.unitPrice,
      }))
    );
  }

  function handleQuantityChange(id, value) {
    setDetailRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity: value } : r)));
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/delivery-orders/${record.id}`)
      .then(() => {
        message.success('Đã xóa đơn giao hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  // Xac nhan giao hang (DRAFT -> CLOSED) - gop tu trang "Xac nhan giao hang" cu theo yeu cau nguoi
  // dung, dung lai nguyen API /delivery-orders/{id}/confirm da co san.
  function handleConfirm(record) {
    setConfirmingId(record.id);
    axiosClient
      .post(`/delivery-orders/${record.id}/confirm`)
      .then(() => {
        message.success('Đã xác nhận giao hàng - hàng đã chuyển sang Kho xe tải');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'))
      .finally(() => setConfirmingId(null));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (detailRows.length === 0) {
        message.error('Đơn giao hàng phải có ít nhất 1 dòng sản phẩm');
        return;
      }
      const payload = {
        ...values,
        items: detailRows.map((d) => ({ productId: d.productId, uomId: d.uomId, quantity: d.quantity })),
      };
      const request = editingOrder
        ? axiosClient.put(`/delivery-orders/${editingOrder.id}`, payload)
        : axiosClient.post('/delivery-orders', payload);
      request
        .then(() => {
          message.success(editingOrder ? 'Cập nhật thành công' : 'Tạo đơn giao hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Số đơn giao', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày lập', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Đơn hàng bán', key: 'salesOrder', render: (_, r) => r.salesOrder?.docNumber },
    { title: 'Khách hàng', key: 'customer', render: (_, r) => r.salesOrder?.customer?.name },
    { title: 'Kho xuất', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const isDraft = record.status === 'DRAFT';
        return (
          <Space>
            {isDraft && (
              <Popconfirm
                title="Xác nhận đã giao hàng này?"
                description="Hàng chuyển từ Kho chính sang Kho xe tải của chi nhánh (Kho chính giảm, Kho xe tải tăng) đúng số lượng khai báo, không thể sửa/hủy. Tồn thực tế chỉ giảm hẳn khi xuất hóa đơn."
                onConfirm={() => handleConfirm(record)}
              >
                <Button icon={<CheckOutlined />} type="primary" ghost loading={confirmingId === record.id} />
              </Popconfirm>
            )}
            <Button icon={<EditOutlined />} disabled={!isDraft} onClick={() => openEditModal(record)} />
            <Popconfirm title="Xóa đơn giao hàng này?" disabled={!isDraft} onConfirm={() => handleDelete(record)}>
              <Button icon={<DeleteOutlined />} danger disabled={!isDraft} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // Uoc tinh thue o Frontend - chi de xem truoc, KHONG luu gi xuong DB, giong y het Don hang ban
  // (tonghop.md muc 5) - so lieu thue chinh thuc chi chot that luc "Xuat hoa don".
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

  const detailColumns = [
    { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
    { title: 'ĐVT', dataIndex: 'uomName', key: 'uomName', render: (v) => v || '-' },
    { title: 'Số lượng đặt', dataIndex: 'orderedQty', key: 'orderedQty', align: 'right' },
    {
      title: 'Số lượng giao thực tế',
      key: 'quantity',
      render: (_, d) => (
        <InputNumber
          min={0}
          max={d.orderedQty}
          value={d.quantity}
          onChange={(v) => handleQuantityChange(d.id, v)}
          style={{ width: '100%' }}
        />
      ),
    },
    { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => v?.toLocaleString('vi-VN') + ' đ' },
    {
      title: 'Thành tiền',
      key: 'amount',
      render: (_, d) => (Number(d.quantity || 0) * Number(d.unitPrice || 0)).toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Thuế (ước tính)',
      key: 'tax',
      render: (_, d) => `${taxRateOf(d.productId)}%`,
    },
  ];

  return (
    <div>
      <Title level={3}>Đơn giao hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số đơn giao hoặc số đơn bán..."
        onAdd={openCreateModal}
        addTooltip="Tạo đơn giao hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
        betweenReloadExport={
          <Tooltip title="Người xác nhận giao hàng">
            <Button icon={<UserOutlined />} onClick={() => setConfirmedByModalOpen(true)} />
          </Tooltip>
        }
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingOrder ? `Sửa đơn giao hàng ${editingOrder.docNumber}` : 'Tạo đơn giao hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số đơn giao" name="docNumber" extra={editingOrder ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingOrder} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày lập" name="docDate" rules={[{ required: true, message: 'Ngày lập không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đơn hàng bán" name="salesOrderId" rules={[{ required: true, message: 'Chọn đơn hàng bán không được để trống' }]}>
                <Select
                  options={salesOrderOptions}
                  placeholder="Chọn đơn hàng đã duyệt"
                  disabled={!!editingOrder}
                  showSearch
                  optionFilterProp="label"
                  onChange={handleSalesOrderSelect}
                />
              </Form.Item>
            </Col>
            {/* Cac truong duoi day chi hien THAM KHAO, lay nguyen tu Don hang ban goc da chon o
                tren - khong dang ky name nen khong gui len server, giong het cac truong tren man
                Don hang ban (xem pages/sales/SalesOrder/index.jsx). */}
            <Col span={12}>
              <Form.Item label="Loại đơn" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder ? orderTypeLabel(selectedSalesOrder.orderType) : ''} placeholder="Chọn Đơn hàng bán trước" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày đặt hàng" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.docDate || ''} placeholder="Chọn Đơn hàng bán trước" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày giao hàng" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.deliveryDate || ''} placeholder="Không có (đơn Van-Sales/Hàng mẫu)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Khách hàng" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.customer?.name || ''} placeholder="Chọn Đơn hàng bán trước" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Kho xuất"
                name="warehouseId"
                rules={[{ required: true, message: 'Kho xuất không được để trống' }]}
                extra="Luôn lấy đúng kho của Đơn hàng bán gốc - không chọn kho khác được"
              >
                <Select options={warehouseOptions} placeholder="Chọn Đơn hàng bán trước" disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tuyến" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.routeMaster?.name || ''} placeholder="Khách hàng chưa gán tuyến" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="NV bán hàng" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.salesman?.fullName || ''} placeholder="Tuyến chưa có NVBH tại ngày đặt hàng" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="remarks">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Text strong>Số lượng giao (mặc định lấy theo số lượng đặt - sửa lại nếu giao thiếu)</Text>
        <Table
          rowKey="id"
          size="small"
          columns={detailColumns}
          dataSource={detailRows}
          pagination={false}
          style={{ marginTop: 8 }}
          locale={{ emptyText: 'Chọn đơn hàng bán ở trên để hiện danh sách sản phẩm' }}
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
          * Số liệu thuế chỉ là ước tính hiển thị trước, không lưu gì xuống DB - chốt chính thức khi bấm "Xuất hóa đơn" sau khi đơn đã xác nhận.
        </Text>
      </Modal>

      <Modal
        title="Người xác nhận giao hàng"
        open={confirmedByModalOpen}
        onCancel={() => setConfirmedByModalOpen(false)}
        footer={<Button onClick={() => setConfirmedByModalOpen(false)}>Đóng</Button>}
        width={640}
        destroyOnHidden
      >
        <Table
          rowKey="id"
          size="small"
          dataSource={deliveryOrders}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Số đơn giao', dataIndex: 'docNumber', key: 'docNumber' },
            { title: 'Đơn hàng bán', key: 'salesOrder', render: (_, r) => r.salesOrder?.docNumber },
            {
              title: 'Trạng thái',
              key: 'status',
              render: (_, r) => (r.status === 'CLOSED' ? <Tag color="green">Đã xác nhận</Tag> : <Tag color="gold">Chờ xác nhận</Tag>),
            },
            {
              title: 'Người xác nhận',
              key: 'confirmedBy',
              render: (_, r) => r.confirmedBy?.fullName || r.confirmedBy?.username || '-',
            },
          ]}
        />
      </Modal>
    </div>
  );
}
