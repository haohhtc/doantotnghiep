import { useEffect, useState } from 'react';
import { Typography, Table, Tag, Space, Button, Modal, List, Input, Popconfirm, message } from 'antd';
import { EyeOutlined, RollbackOutlined, StopOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

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
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [returningInvoice, setReturningInvoice] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/invoices'), axiosClient.get('/warehouses'), axiosClient.get('/sales-returns')])
      .then(([invoicesRes, warehousesRes, returnsRes]) => {
        setInvoices(invoicesRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setSalesReturns(returnsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách hóa đơn'))
      .finally(() => setLoading(false));
  }

  // Trang thai hien thi: Da huy (that, status=CANCELLED) > Tra hang (co phieu Tra hang DANG hieu
  // luc - CLOSED, chua bi huy - gan voi dung Don hang goc cua hoa don nay) > Da duyet (mac dinh).
  function invoiceStatusTag(invoice) {
    if (invoice.status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
    const hasActiveReturn = salesReturns.some(
      (r) => r.status === 'CLOSED' && r.salesOrder?.id === invoice.salesOrder?.id
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
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Hủy thất bại'));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = invoices.filter((i) => {
    if (selectedBranchId && i.salesOrder?.warehouse?.branch?.id !== selectedBranchId) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return i.invoiceNumber.toLowerCase().includes(keyword) || (i.salesOrder?.docNumber || '').toLowerCase().includes(keyword);
  });

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
        onReload={loadData}
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={detailInvoice ? `Chi tiết hóa đơn ${detailInvoice.invoiceNumber}` : ''}
        open={!!detailInvoice}
        onCancel={() => setDetailInvoice(null)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        {detailInvoice && (
          <>
            <List
              dataSource={detailInvoice.items}
              renderItem={(item) => (
                <List.Item>
                  <Text>
                    {item.product.code} - {item.product.name}: {Number(item.quantity).toLocaleString('vi-VN')} {item.uom?.name || ''} x{' '}
                    {Number(item.unitPrice).toLocaleString('vi-VN')} đ (thuế {Number(item.taxRate)}%) ={' '}
                    <Text strong>{Number(item.lineTotal).toLocaleString('vi-VN')} đ</Text>
                  </Text>
                </List.Item>
              )}
            />
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <Text>Tiền hàng: {Number(detailInvoice.subtotalAmount).toLocaleString('vi-VN')} đ</Text><br />
              <Text>Tiền thuế: {Number(detailInvoice.taxAmount).toLocaleString('vi-VN')} đ</Text><br />
              <Text strong>Tổng cộng: {Number(detailInvoice.totalAmount).toLocaleString('vi-VN')} đ</Text>
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
