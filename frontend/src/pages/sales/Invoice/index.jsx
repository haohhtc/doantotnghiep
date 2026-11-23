import { useEffect, useState } from 'react';
import { Typography, Table, Tag, Space, Button, Modal, Input, Popconfirm, message, Row, Col } from 'antd';
import { EyeOutlined, RollbackOutlined, StopOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Khop y het nhan cua ORDER_TYPE_OPTIONS ben Don hang ban/Don giao hang (xem
// pages/sales/SalesOrder/index.jsx, pages/sales/DeliveryOrder/index.jsx).
function orderTypeLabel(type) {
  if (type === 'PRE_ORDER') return 'Pre-order (đặt trước giao sau)';
  if (type === 'SAMPLE') return 'Đơn hàng mẫu (miễn phí)';
  return 'Đơn Van-Sales';
}

// Tag mau - dung dung mau/nhan voi orderTypeTag ben Don hang ban/Don giao hang de 3 trang hien
// thi dong nhat, giup phan biet nhanh ngay tren luoi.
function orderTypeTag(type) {
  if (type === 'PRE_ORDER') return <Tag color="blue">Pre-order</Tag>;
  if (type === 'SAMPLE') return <Tag color="purple">Hàng mẫu</Tag>;
  return <Tag>Đơn Van-Sales</Tag>;
}

// Danh sach Hoa don - xuat tu 1 Sales Order da CONFIRMED (nut "Xuat hoa don" nam tren trang Sales
// Order, khong phai o day - xem tonghop.md). Hoa don van co the Huy (V44) - KHONG sua/xoa duoc noi
// dung, chi doi status - xem backend/.../sales/controller/InvoiceController.java.
export default function InvoicePage() {
  const { selectedBranchId } = useBranch();
  const [invoices, setInvoices] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [returningInvoice, setReturningInvoice] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  // Du lieu tham chieu nho (kho + 24 phieu tra hang) - tai 1 lan luc vao trang.
  function loadReference() {
    Promise.all([axiosClient.get('/warehouses'), axiosClient.get('/sales-returns')])
      .then(([warehousesRes, returnsRes]) => {
        setWarehouses(warehousesRes.data.data);
        setSalesReturns(returnsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu tham chiếu'));
  }

  // Luoi chinh - phan trang + loc server-side (gan 5000 hoa don, khong the load het 1 lan).
  function loadInvoices(opts = {}) {
    setLoading(true);
    const page = opts.resetToFirstPage ? 1 : opts.page ?? pagination.current;
    const pageSize = opts.pageSize ?? pagination.pageSize;
    const search = opts.search !== undefined ? opts.search : debouncedSearch;
    const branchId = opts.branchId !== undefined ? opts.branchId : selectedBranchId;
    axiosClient
      .get('/invoices/search', {
        params: { page: page - 1, size: pageSize, branchId: branchId || undefined, search: search || undefined },
      })
      .then(({ data }) => {
        setInvoices(data.data.content);
        setPagination({ current: page, pageSize, total: data.data.totalElements });
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách hóa đơn'))
      .finally(() => setLoading(false));
  }

  // Trang thai hien thi: Da huy (that, status=CANCELLED) > Tra hang (co phieu Tra hang DANG hieu
  // luc - CLOSED, chua bi huy - gan voi DUNG hoa don nay qua r.invoice.id, V50) > Da duyet (mac dinh).
  // Phieu tra rat cu (truoc V50) khong co invoice.id rieng - fallback so theo salesOrder.id nhu
  // cu, chi dung khi phieu khong co invoice (r.invoice == null).
  function invoiceStatusTag(invoice) {
    if (invoice.status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
    const hasActiveReturn = salesReturns.some(
      (r) =>
        r.status === 'CLOSED' &&
        (r.invoice ? r.invoice.id === invoice.id : r.salesOrder?.id === invoice.salesOrder?.id)
    );
    if (hasActiveReturn) return <Tag color="purple">Trả hàng</Tag>;
    return <Tag color="green">Đã duyệt</Tag>;
  }

  // Huy hoa don - hoan tra Kho xe tai, mo lai Don giao hang ve "Cho giao". Backend tu chan neu
  // khach da tra hang dua tren hoa don nay (phai Huy phieu Tra hang truoc).
  function handleCancelInvoice(record) {
    axiosClient
      .post(`/invoices/${record.id}/cancel`)
      .then(() => {
        message.success('Đã hủy hóa đơn - đã mở lại Đơn giao hàng về "Chờ giao"');
        loadInvoices();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Hủy thất bại'));
  }

  useEffect(() => {
    loadReference();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    loadInvoices({ resetToFirstPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, debouncedSearch]);

  function openReturnModal(record) {
    if (record.status === 'CANCELLED') {
      message.error('Hóa đơn này đã bị hủy - không thể tạo phiếu trả hàng.');
      return;
    }
    if (!record.salesOrder?.salesman) {
      message.error(
        'Đơn hàng gốc của hóa đơn này chưa có NVBH (đơn cũ, tạo trước khi có tính năng gán NVBH) - không tự tạo được phiếu trả hàng. Vui lòng dùng "+Thêm phiếu trả hàng" ở trang Trả hàng để tự chọn NVBH.'
      );
      return;
    }
    const mainWarehouse = warehouses.find(
      (w) => w.branch?.id === record.salesOrder.warehouse?.branch?.id && w.warehouseType === 'MAIN'
    );
    if (!mainWarehouse) {
      message.error('Chi nhánh này chưa có Kho chính (Main) - vui lòng cấu hình kho trước');
      return;
    }
    setReturningInvoice(record);
    setReturnReason('');
  }

  // Tao phieu Tra hang (DRAFT) tu nguyen hoa don - khong tu Duyet (van phai qua trang Tra hang de
  // kiem tra lai truoc khi cong that vao ton kho, giong quy trinh DRAFT->CLOSED san co). Tai dung
  // nguyen API POST /sales-returns, khong sua backend.
  function handleConfirmReturn() {
    if (!returnReason.trim()) {
      message.warning('Nhập lý do trả hàng');
      return;
    }
    const mainWarehouse = warehouses.find(
      (w) => w.branch?.id === returningInvoice.salesOrder.warehouse?.branch?.id && w.warehouseType === 'MAIN'
    );
    const payload = {
      docDate: new Date().toISOString().slice(0, 10),
      salesmanId: returningInvoice.salesOrder.salesman.id,
      warehouseId: mainWarehouse.id,
      reason: returnReason,
      remarks: `Trả hàng từ hóa đơn ${returningInvoice.invoiceNumber}`,
      items: returningInvoice.items.map((i) => ({
        productId: i.product.id,
        uomId: i.uom?.id,
        quantity: i.quantity,
        note: `Trả từ hóa đơn ${returningInvoice.invoiceNumber}`,
      })),
    };
    setReturnSubmitting(true);
    axiosClient
      .post('/sales-returns', payload)
      .then(({ data }) => {
        message.success(`Đã tạo phiếu trả hàng ${data.data.docNumber} (ở dạng Nháp) - vào trang "Trả hàng" để Duyệt, cộng lại vào Kho chính`);
        setReturningInvoice(null);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Tạo phiếu trả hàng thất bại'))
      .finally(() => setReturnSubmitting(false));
  }

  const columns = [
    { title: 'Số hóa đơn', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    { title: 'Ngày xuất', dataIndex: 'invoiceDate', key: 'invoiceDate' },
    { title: 'Đơn hàng gốc', key: 'salesOrder', render: (_, r) => r.salesOrder?.docNumber },
    { title: 'Khách hàng', key: 'customer', render: (_, r) => r.salesOrder?.customer?.name },
    { title: 'Loại đơn', key: 'orderType', render: (_, r) => orderTypeTag(r.salesOrder?.orderType) },
    { title: 'Tiền hàng', dataIndex: 'subtotalAmount', key: 'subtotalAmount', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    { title: 'Tiền thuế', dataIndex: 'taxAmount', key: 'taxAmount', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    { title: 'Trạng thái', key: 'status', render: (_, record) => invoiceStatusTag(record) },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<RollbackOutlined />}
            title="Trả hàng"
            disabled={record.status === 'CANCELLED'}
            onClick={() => openReturnModal(record)}
          />
          <Button icon={<EyeOutlined />} onClick={() => setDetailInvoice(record)} />
          <Popconfirm
            title="Hủy hóa đơn này?"
            description='Sẽ hoàn trả lại Kho xe tải và mở lại Đơn giao hàng về "Chờ giao".'
            disabled={record.status === 'CANCELLED'}
            onConfirm={() => handleCancelInvoice(record)}
          >
            <Button icon={<StopOutlined />} danger disabled={record.status === 'CANCELLED'} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Hóa đơn</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số hóa đơn hoặc số đơn hàng..."
        onReload={() => {
          setSearchText('');
          setDebouncedSearch('');
          loadInvoices({ resetToFirstPage: true, search: '' });
        }}
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={invoices}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} hóa đơn`,
          onChange: (page, pageSize) => loadInvoices({ page, pageSize }),
        }}
      />

      {/* Dong bo 100% khung voi modal Don giao hang/Don hang ban: tieu de "Xem ... {so}", nut OK
          duy nhat "Dong" (an nut Huy) thay vi footer=null, bang chi tiet dang Table (khong phai
          List) + dong tong cuoi giong het layout flex cua Don giao hang. Hoa don von bat bien
          (khong sua duoc) nen luon o che do chi xem, khong can co isReadOnly nhu 2 trang kia. */}
      <Modal
        title={detailInvoice ? `Xem hóa đơn ${detailInvoice.invoiceNumber}` : ''}
        open={!!detailInvoice}
        onOk={() => setDetailInvoice(null)}
        onCancel={() => setDetailInvoice(null)}
        okText="Đóng"
        cancelButtonProps={{ style: { display: 'none' } }}
        width={1000}
        destroyOnHidden
      >
        {detailInvoice && (
          <>
            <Text type="warning" style={{ display: 'block', marginBottom: 12 }}>
              Hóa đơn đã xuất không thể sửa nội dung - chỉ xem.
            </Text>
            <Row gutter={16}>
              <Col span={8}><Text>Số hóa đơn: {detailInvoice.invoiceNumber}</Text></Col>
              <Col span={8}><Text>Ngày xuất: {detailInvoice.invoiceDate}</Text></Col>
              <Col span={8}><Text>Trạng thái: </Text>{invoiceStatusTag(detailInvoice)}</Col>
              <Col span={8}><Text>Người tạo: {detailInvoice.createdBy?.fullName || detailInvoice.createdBy?.username || '-'}</Text></Col>
              <Col span={8}><Text>Đơn hàng bán gốc: {detailInvoice.salesOrder?.docNumber || '-'}</Text></Col>
              <Col span={8}><Text>Đơn giao hàng gốc: {detailInvoice.deliveryOrder?.docNumber || '-'}</Text></Col>
              <Col span={8}><Text>Khách hàng: {detailInvoice.salesOrder?.customer?.name || '-'}</Text></Col>
              <Col span={8}><Text>Kho xuất: {detailInvoice.salesOrder?.warehouse?.name || '-'}</Text></Col>
              <Col span={8}><Text>Tuyến: {detailInvoice.salesOrder?.routeMaster?.name || '-'}</Text></Col>
              <Col span={8}><Text>NV bán hàng: {detailInvoice.salesOrder?.salesman?.fullName || '-'}</Text></Col>
              <Col span={8}><Text>Loại đơn: {orderTypeLabel(detailInvoice.salesOrder?.orderType)}</Text></Col>
            </Row>

            <Text strong style={{ display: 'block', marginTop: 16 }}>Chi tiết hàng hóa</Text>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              style={{ marginTop: 8 }}
              dataSource={detailInvoice.items}
              columns={[
                { title: 'Sản phẩm', key: 'product', render: (_, i) => `${i.product.code} - ${i.product.name}` },
                { title: 'ĐVT', key: 'uom', render: (_, i) => i.uom?.name || '-' },
                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') },
                { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
                { title: 'Thuế', dataIndex: 'taxRate', key: 'taxRate', align: 'right', render: (v) => `${Number(v)}%` },
                { title: 'Thành tiền', dataIndex: 'lineTotal', key: 'lineTotal', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
              ]}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 12 }}>
              <Text>
                Tổng số lượng:{' '}
                <Text strong>
                  {detailInvoice.items.reduce((sum, i) => sum + Number(i.quantity || 0), 0).toLocaleString('vi-VN')}
                </Text>
              </Text>
              <Text>Tiền hàng: <Text strong>{Number(detailInvoice.subtotalAmount).toLocaleString('vi-VN')} đ</Text></Text>
              <Text>Tiền thuế: <Text strong>{Number(detailInvoice.taxAmount).toLocaleString('vi-VN')} đ</Text></Text>
              <Text>Tổng cộng: <Text strong>{Number(detailInvoice.totalAmount).toLocaleString('vi-VN')} đ</Text></Text>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title={returningInvoice ? `Trả hàng - Hóa đơn ${returningInvoice.invoiceNumber}` : 'Trả hàng'}
        open={!!returningInvoice}
        onOk={handleConfirmReturn}
        onCancel={() => setReturningInvoice(null)}
        okText="OK"
        cancelText="Hủy"
        confirmLoading={returnSubmitting}
        destroyOnHidden
      >
        {returningInvoice && (
          <>
            <Text>
              Tạo phiếu trả hàng (ở dạng Nháp) cho toàn bộ {returningInvoice.items.length} dòng sản phẩm trong hóa đơn này - cộng lại vào{' '}
              <Text strong>Kho chính</Text> khi được Duyệt ở trang "Trả hàng".
            </Text>
            <div style={{ marginTop: 12 }}>
              <Text strong>Lý do trả hàng</Text>
              <TextArea
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="VD: Hàng lỗi, khách đổi ý, giao sai sản phẩm..."
                style={{ marginTop: 4 }}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
