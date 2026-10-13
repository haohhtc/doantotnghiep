import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Row, Col, Popconfirm, message, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, CheckOutlined, StopOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;

function statusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã giao (đã xuất kho)</Tag>;
  if (status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
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
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmedByModalOpen, setConfirmedByModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [invoicingOrder, setInvoicingOrder] = useState(null);
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [form] = Form.useForm();

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  // V49: 1 Don hang ban co the tao NHIEU Don giao hang (giao nhieu dot) - khong con loai bo don
  // "da co DGH" nhu truoc, thay bang tinh CON LAI chua giao theo tung san pham (xem
  // remainingBaseByProduct), chi loai don da giao HET (khong con gi de tao them).
  function remainingBaseByProduct(order, excludeDeliveryOrderId) {
    const orderedByProduct = {};
    order.details.forEach((d) => {
      orderedByProduct[d.product.id] = (orderedByProduct[d.product.id] || 0) + Number(d.baseQuantity);
    });
    const deliveredByProduct = {};
    deliveryOrders.forEach((d) => {
      if (d.salesOrder.id !== order.id || d.status === 'CANCELLED' || d.id === excludeDeliveryOrderId) return;
      d.items.forEach((item) => {
        deliveredByProduct[item.product.id] = (deliveredByProduct[item.product.id] || 0) + Number(item.baseQuantity);
      });
    });
    const remaining = {};
    Object.keys(orderedByProduct).forEach((pid) => {
      remaining[pid] = orderedByProduct[pid] - (deliveredByProduct[pid] || 0);
    });
    return remaining;
  }

  const availableSalesOrders = salesOrders.filter((o) => {
    if (o.status !== 'CONFIRMED') return false;
    if (selectedBranchId && o.warehouse?.branch?.id !== selectedBranchId) return false;
    const remaining = remainingBaseByProduct(o, null);
    return Object.values(remaining).some((v) => v > 0.0001);
  });
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
      axiosClient.get('/invoices'),
    ])
      .then(([doRes, soRes, whRes, prodRes, invRes]) => {
        setDeliveryOrders(doRes.data.data);
        setSalesOrders(soRes.data.data);
        setWarehouses(whRes.data.data);
        setProducts(prodRes.data.data);
        setInvoices(invRes.data.data);
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
    // goc theo San pham+DVT, giong cach handleSalesOrderSelect lam. "Con lai" tinh LOAI TRU chinh
    // DGH dang sua (excludeDeliveryOrderId) de khong tu tru nham voi chinh so luong cua no.
    const remaining = remainingBaseByProduct(record.salesOrder, record.id);
    setDetailRows(
      record.items.map((d) => {
        const soLine = record.salesOrder.details?.find(
          (sd) => sd.product.id === d.product.id && (sd.uom?.id || null) === (d.uom?.id || null)
        );
        const factor = soLine && Number(soLine.quantity) > 0 ? Number(soLine.baseQuantity) / Number(soLine.quantity) : 1;
        const remainingInUom = factor > 0 ? (remaining[d.product.id] || 0) / factor : (remaining[d.product.id] || 0);
        return {
          id: d.id,
          productId: d.product.id,
          uomId: d.uom?.id,
          uomName: d.uom?.name,
          quantity: d.quantity,
          remainingQty: Math.max(0, Math.round(remainingInUom * 1000) / 1000),
          unitPrice: soLine?.unitPrice,
          note: d.note,
        };
      })
    );
    setModalOpen(true);
  }

  // Xem thong tin don (chi doc) - dung duoc moi trang thai, luc Sua bi khoa (khong DRAFT) thi day
  // la cach duy nhat xem lai noi dung don.
  function openViewModal(record) {
    setViewingOrder(record);
  }

  // Con lai (don vi co so) CHUA xuat hoa don cua tung san pham trong 1 dot giao hang da Xac nhan -
  // V49: 1 dot giao co the tach thanh nhieu hoa don, nen phai tru di tong da xuat o cac hoa don
  // dang hoat dong (khong CANCELLED) cua CHINH dot giao do.
  function remainingToInvoiceBaseByProduct(deliveryOrder) {
    const deliveredByProduct = {};
    deliveryOrder.items.forEach((item) => {
      deliveredByProduct[item.product.id] = (deliveredByProduct[item.product.id] || 0) + Number(item.baseQuantity);
    });
    const invoicedByProduct = {};
    invoices.forEach((inv) => {
      if (inv.deliveryOrder?.id !== deliveryOrder.id || inv.status === 'CANCELLED') return;
      inv.items.forEach((item) => {
        invoicedByProduct[item.product.id] = (invoicedByProduct[item.product.id] || 0) + Number(item.baseQuantity ?? 0);
      });
    });
    const remaining = {};
    Object.keys(deliveredByProduct).forEach((pid) => {
      remaining[pid] = deliveredByProduct[pid] - (invoicedByProduct[pid] || 0);
    });
    return remaining;
  }

  function hasRemainingToInvoice(deliveryOrder) {
    return Object.values(remainingToInvoiceBaseByProduct(deliveryOrder)).some((v) => v > 0.0001);
  }

  // Mo modal Xuat hoa don cho DUNG dot giao hang nay - mac dinh dien san "con lai chua xuat hoa
  // don" (co the sua xuong neu chi muon xuat 1 phan - V49, cho phep tach nhieu hoa don cho cung
  // 1 dot giao).
  function openInvoiceModal(record) {
    const remaining = remainingToInvoiceBaseByProduct(record);
    const rows = record.items
      .map((item) => {
        const factor = Number(item.quantity) > 0 ? Number(item.baseQuantity) / Number(item.quantity) : 1;
        const remainingBase = remaining[item.product.id] || 0;
        const remainingInUom = factor > 0 ? remainingBase / factor : remainingBase;
        const qty = Math.max(0, Math.round(remainingInUom * 1000) / 1000);
        return {
          id: item.id,
          productId: item.product.id,
          uomId: item.uom?.id,
          uomName: item.uom?.name,
          quantity: qty,
          remainingQty: qty,
        };
      })
      .filter((r) => r.remainingQty > 0.0001);
    if (rows.length === 0) {
      message.info('Đợt giao hàng này đã xuất hóa đơn hết, không còn gì để xuất thêm.');
      return;
    }
    setInvoiceRows(rows);
    setInvoicingOrder(record);
  }

  function handleInvoiceRowQuantityChange(id, value) {
    setInvoiceRows((prev) => prev.map((r) => (r.id === id ? { ...r, quantity: value } : r)));
  }

  function handleConfirmInvoice() {
    const nonZeroRows = invoiceRows.filter((r) => Number(r.quantity) > 0);
    if (nonZeroRows.length === 0) {
      message.error('Chọn ít nhất 1 dòng sản phẩm với số lượng lớn hơn 0');
      return;
    }
    const payload = {
      deliveryOrderId: invoicingOrder.id,
      items: nonZeroRows.map((r) => ({ productId: r.productId, uomId: r.uomId, quantity: r.quantity })),
    };
    axiosClient
      .post('/invoices', payload)
      .then(({ data }) => {
        message.success(`Đã xuất hóa đơn ${data.data.invoiceNumber}`);
        setInvoicingOrder(null);
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xuất hóa đơn thất bại'));
  }

  function viewingItems() {
    if (!viewingOrder) return [];
    return viewingOrder.items.map((d) => {
      const soLine = viewingOrder.salesOrder.details?.find(
        (sd) => sd.product.id === d.product.id && (sd.uom?.id || null) === (d.uom?.id || null)
      );
      return {
        id: d.id,
        productId: d.product.id,
        productLabel: `${d.product.code} - ${d.product.name}`,
        uomName: d.uom?.name,
        quantity: d.quantity,
        unitPrice: soLine?.unitPrice,
      };
    });
  }

  // Chon Don hang ban goc -> tu dong dien San pham + kho xuat + so luong CON LAI chua giao (khong
  // phai nguyen so luong da dat nhu truoc - V49, vi don co the da giao 1 phan o cac dot truoc) +
  // Don gia (chi de xem), cho sua lai so luong truoc khi Luu neu dot nay giao it hon con lai.
  function handleSalesOrderSelect(salesOrderId) {
    const order = salesOrders.find((o) => o.id === salesOrderId);
    if (!order) return;
    form.setFieldsValue({ warehouseId: order.warehouse?.id });
    const remaining = remainingBaseByProduct(order, null);
    setDetailRows(
      order.details
        .map((d) => {
          const factor = Number(d.quantity) > 0 ? Number(d.baseQuantity) / Number(d.quantity) : 1;
          const remainingInUom = factor > 0 ? (remaining[d.product.id] || 0) / factor : (remaining[d.product.id] || 0);
          const qty = Math.max(0, Math.round(remainingInUom * 1000) / 1000);
          return {
            id: d.id,
            productId: d.product.id,
            uomId: d.uom?.id,
            uomName: d.uom?.name,
            quantity: qty,
            remainingQty: qty,
            unitPrice: d.unitPrice,
          };
        })
        .filter((d) => d.remainingQty > 0.0001)
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

  // Huy dot giao hang nay (V49: khong con dung gi den Don hang ban, don co the con cac dot giao
  // khac). Neu dang CLOSED thi backend se tu dao lai kho (Van giam, Main cong lai) truoc khi huy.
  // Bi chan neu CHINH dot giao nay da co Hoa don dang hieu luc.
  function handleCancel(record) {
    axiosClient
      .post(`/delivery-orders/${record.id}/cancel`)
      .then(() => {
        message.success('Đã hủy đợt giao hàng này - số lượng đã trở lại "còn lại chưa giao" của đơn hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Hủy thất bại'));
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
      const nonZeroRows = detailRows.filter((d) => Number(d.quantity) > 0);
      if (nonZeroRows.length === 0) {
        message.error('Đơn giao hàng phải có ít nhất 1 dòng sản phẩm với số lượng lớn hơn 0');
        return;
      }
      const payload = {
        ...values,
        items: nonZeroRows.map((d) => ({ productId: d.productId, uomId: d.uomId, quantity: d.quantity })),
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
            <Button icon={<EyeOutlined />} onClick={() => openViewModal(record)} />
            {record.status === 'CLOSED' && hasRemainingToInvoice(record) && (
              <Button icon={<FileTextOutlined />} title="Xuất hóa đơn" onClick={() => openInvoiceModal(record)} />
            )}
            <Button icon={<EditOutlined />} disabled={!isDraft} onClick={() => openEditModal(record)} />
            <Popconfirm title="Xóa đơn giao hàng này?" disabled={!isDraft} onConfirm={() => handleDelete(record)}>
              <Button icon={<DeleteOutlined />} danger disabled={!isDraft} />
            </Popconfirm>
            <Popconfirm
              title="Hủy đợt giao hàng này?"
              description={
                record.status === 'CLOSED'
                  ? 'Sẽ đảo lại kho (Kho xe tải giảm, Kho chính cộng lại). Số lượng đợt này quay lại "còn lại chưa giao" của đơn hàng.'
                  : 'Số lượng đợt này quay lại "còn lại chưa giao" của đơn hàng.'
              }
              disabled={record.status === 'CANCELLED'}
              onConfirm={() => handleCancel(record)}
            >
              <Button icon={<StopOutlined />} danger disabled={record.status === 'CANCELLED'} />
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
    { title: 'Còn lại chưa giao', dataIndex: 'remainingQty', key: 'remainingQty', align: 'right' },
    {
      title: 'Số lượng giao đợt này',
      key: 'quantity',
      render: (_, d) => (
        <InputNumber
          min={0}
          max={d.remainingQty}
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
        width={1000}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Số đơn giao" name="docNumber" extra={editingOrder ? undefined : 'Để trống để tự sinh số'}>
                <Input disabled={!!editingOrder} placeholder="Tự sinh nếu để trống" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày lập" name="docDate" rules={[{ required: true, message: 'Ngày lập không được để trống' }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
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
            <Col span={8}>
              <Form.Item label="Loại đơn" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder ? orderTypeLabel(selectedSalesOrder.orderType) : ''} placeholder="Chọn Đơn hàng bán trước" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày đặt hàng" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.docDate || ''} placeholder="Chọn Đơn hàng bán trước" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày giao hàng" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.deliveryDate || ''} placeholder="Không có (đơn Van-Sales/Hàng mẫu)" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Khách hàng" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.customer?.name || ''} placeholder="Chọn Đơn hàng bán trước" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Kho xuất"
                name="warehouseId"
                rules={[{ required: true, message: 'Kho xuất không được để trống' }]}
                extra="Luôn lấy đúng kho của Đơn hàng bán gốc - không chọn kho khác được"
              >
                <Select options={warehouseOptions} placeholder="Chọn Đơn hàng bán trước" disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Tuyến" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.routeMaster?.name || ''} placeholder="Khách hàng chưa gán tuyến" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="NV bán hàng" extra="Lấy từ Đơn hàng bán gốc">
                <Input disabled value={selectedSalesOrder?.salesman?.fullName || ''} placeholder="Tuyến chưa có NVBH tại ngày đặt hàng" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ghi chú" name="remarks">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Text strong>Số lượng giao (mặc định lấy theo số lượng CÒN LẠI chưa giao - sửa lại nếu đợt này giao ít hơn)</Text>
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
        title={viewingOrder ? `Xem đơn giao hàng ${viewingOrder.docNumber}` : ''}
        open={!!viewingOrder}
        onCancel={() => setViewingOrder(null)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        {viewingOrder && (
          <>
            <Row gutter={16}>
              <Col span={8}><Text>Ngày lập: {viewingOrder.docDate}</Text></Col>
              <Col span={8}><Text>Trạng thái: </Text>{statusTag(viewingOrder.status)}</Col>
              <Col span={8}><Text>Đơn hàng bán: {viewingOrder.salesOrder?.docNumber}</Text></Col>
              <Col span={8}><Text>Khách hàng: {viewingOrder.salesOrder?.customer?.name || '-'}</Text></Col>
              <Col span={8}><Text>Kho xuất: {viewingOrder.warehouse?.name}</Text></Col>
              <Col span={8}><Text>Tuyến: {viewingOrder.salesOrder?.routeMaster?.name || '-'}</Text></Col>
              <Col span={8}><Text>NV bán hàng: {viewingOrder.salesOrder?.salesman?.fullName || '-'}</Text></Col>
              <Col span={8}><Text>Loại đơn: {orderTypeLabel(viewingOrder.salesOrder?.orderType)}</Text></Col>
              <Col span={8}><Text>Người xác nhận: {viewingOrder.confirmedBy?.fullName || viewingOrder.confirmedBy?.username || '-'}</Text></Col>
            </Row>
            {viewingOrder.remarks && <div style={{ marginTop: 8 }}><Text>Ghi chú: {viewingOrder.remarks}</Text></div>}

            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <Text strong>Chi tiết hàng giao</Text>
            </div>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={viewingItems()}
              columns={[
                { title: 'Sản phẩm', dataIndex: 'productLabel', key: 'productLabel' },
                { title: 'ĐVT', dataIndex: 'uomName', key: 'uomName', render: (v) => v || '-' },
                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'right' },
                { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => (v != null ? Number(v).toLocaleString('vi-VN') + ' đ' : '-') },
                {
                  title: 'Thành tiền',
                  key: 'amount',
                  align: 'right',
                  render: (_, d) => (Number(d.quantity || 0) * Number(d.unitPrice || 0)).toLocaleString('vi-VN') + ' đ',
                },
              ]}
            />
          </>
        )}
      </Modal>

      <Modal
        title={invoicingOrder ? `Xuất hóa đơn - Đợt giao hàng ${invoicingOrder.docNumber}` : 'Xuất hóa đơn'}
        open={!!invoicingOrder}
        onOk={handleConfirmInvoice}
        onCancel={() => setInvoicingOrder(null)}
        okText="Xuất hóa đơn"
        cancelText="Hủy"
        width={700}
        destroyOnHidden
      >
        <Text type="secondary">
          Mặc định lấy toàn bộ số lượng còn lại chưa xuất hóa đơn của đợt giao này - sửa lại xuống nếu chỉ muốn xuất 1 phần (phần còn lại có thể xuất hóa đơn riêng sau).
        </Text>
        <Table
          rowKey="id"
          size="small"
          style={{ marginTop: 8 }}
          pagination={false}
          dataSource={invoiceRows}
          columns={[
            { title: 'Sản phẩm', key: 'product', render: (_, d) => optionLabel(productOptions, d.productId) },
            { title: 'ĐVT', dataIndex: 'uomName', key: 'uomName', render: (v) => v || '-' },
            { title: 'Còn lại chưa xuất HĐ', dataIndex: 'remainingQty', key: 'remainingQty', align: 'right' },
            {
              title: 'Số lượng xuất hóa đơn',
              key: 'quantity',
              render: (_, d) => (
                <InputNumber
                  min={0}
                  max={d.remainingQty}
                  value={d.quantity}
                  onChange={(v) => handleInvoiceRowQuantityChange(d.id, v)}
                  style={{ width: '100%' }}
                />
              ),
            },
          ]}
        />
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
