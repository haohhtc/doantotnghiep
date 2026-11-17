import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Typography, Table, Tag, Select, Button, Space, Row, Col, Form, Input, message, Card,
} from 'antd';
import { FilterOutlined, ReloadOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;

// "Phieu in nhanh" (Sales Order / Picking List / Delivery Note Printing) - man hinh loc + chon
// chung tu de in Phieu giao hang (tung Don giao hang, 1 don = 1 trang) hoac Phieu xuat kho tong
// hop (gop so luong theo san pham cua TAT CA chung tu dang chon thanh 1 trang duy nhat cho thu kho).
//
// Document Type quyet dinh NGUON DU LIEU cua luoi: DELIVERY_NOTE -> Don giao hang (GET
// /delivery-orders/print-search), STOCK_ISSUE -> Phieu xuat kho (GET /goods-issues/print-search,
// cung man hinh voi /inventory/goods-issue). Ca 2 endpoint deu loc THAT o server theo ngay/trang
// thai in - KHONG duoc goi GET /delivery-orders hay GET /goods-issues (khong loc/phan trang) nhu
// cac trang CRUD khac hay lam, vi ca 2 bang nay deu long rat nhieu quan he EAGER va co the len toi
// vai nghin dong, tra ve JSON hang chuc MB neu khong loc (da gap that voi delivery_order).
//
// Trang thai in (Print Status) dua tren bang printed_note (xem backend package `printing`) - 1
// dong = 1 lan bam "Tai phieu in xuong" THAT SU (khong phai chi bam In/xem truoc). Khi loc "Da in",
// From/To Date ap dung len NGAY TAI (khong phai ngay chung tu) - xem DeliveryOrderRepository/
// GoodsIssueRepository.searchForPrint o backend de biet chi tiet logic nay.
//
// 2 nut rieng biet, CHI "Tai xuong" moi ghi vao printed_note:
// - "In": goi window.print() thuan tuy, mo hop thoai in cua trinh duyet. KHONG ghi nhan gi ca -
//   vi trinh duyet KHONG BAO GIO cho JS biet nguoi dung da thuc su in/luu hay bam Huy/X (gioi han
//   nen tang, khong rieng nut nao), ghi nhan o day se sai bat ke dung nut gi goi window.print().
// - "Tai xuong": dung html2canvas chup tung .print-page thanh anh, ghep vao 1 file PDF that bang
//   jsPDF roi pdf.save() - day la 1 download THAT qua trinh duyet (khong qua hop thoai In, khong
//   the bi "Huy"), nen chi can doan code chay xong khong loi la biet chac da tai thanh cong, luc
//   do moi POST /printed-notes.
const DOC_TYPE_OPTIONS = [
  { value: 'DELIVERY_NOTE', label: 'Phiếu giao hàng' },
  { value: 'STOCK_ISSUE', label: 'Phiếu xuất kho tổng hợp' },
];
const PAPER_KIND_OPTIONS = [
  { value: 'A4_PORTRAIT', label: 'A4 Dọc' },
  { value: 'A4_LANDSCAPE', label: 'A4 Ngang' },
  { value: 'A5_PORTRAIT', label: 'A5 Dọc' },
  { value: 'A5_LANDSCAPE', label: 'A5 Ngang' },
];
// margin: 0 o @page - KHONG phai de sat le, ma la de "danh lua" trinh duyet khong con cho de
// tu in Header/Footer mac dinh cua no (ten trang + URL o tren, ngay gio + so trang o duoi - phan
// khoanh do nguoi dung chi ra, trinh duyet in phan nay VAO DUNG vung margin cua @page nen margin
// > 0 la con thay). Bu lai khoang cach le trang bang padding tren .print-page (noi dung that).
const PAPER_KIND_PAGE_RULE = {
  A4_PORTRAIT: { page: 'size: A4 portrait; margin: 0;', padding: '12mm' },
  A4_LANDSCAPE: { page: 'size: A4 landscape; margin: 0;', padding: '12mm' },
  A5_PORTRAIT: { page: 'size: A5 portrait; margin: 0;', padding: '8mm' },
  A5_LANDSCAPE: { page: 'size: A5 landscape; margin: 0;', padding: '8mm' },
};
// Dung cho jsPDF khi bam "Tai xuong" - khop voi PAPER_KIND_PAGE_RULE ben tren (format/orientation
// cua jsPDF, khong lien quan @page CSS dung cho window.print()).
const PAPER_KIND_JSPDF = {
  A4_PORTRAIT: { format: 'a4', orientation: 'portrait' },
  A4_LANDSCAPE: { format: 'a4', orientation: 'landscape' },
  A5_PORTRAIT: { format: 'a5', orientation: 'portrait' },
  A5_LANDSCAPE: { format: 'a5', orientation: 'landscape' },
};
// Be rong (px, ~96dpi) ep tam cho #print-area khi chup html2canvas de ty le gan dung voi kho
// giay that, tranh anh bi meo ty le do container co rong theo kieu "co lai vua noi dung".
const PAPER_KIND_PX_WIDTH = {
  A4_PORTRAIT: 794,
  A4_LANDSCAPE: 1123,
  A5_PORTRAIT: 559,
  A5_LANDSCAPE: 794,
};
const PRINT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'NOT_PRINTED', label: 'Chưa in' },
  { value: 'PRINTED', label: 'Đã in' },
];
// Khop dung nhan ORDER_TYPE_OPTIONS/orderTypeLabel o SalesOrder, DeliveryOrder - chi doi ten ngan
// hon cho vua o bo loc. STANDARD = Van-Sales (xem SalesOrder/index.jsx). Dung khi Document Type =
// Phieu giao hang.
const ORDER_TYPE_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PRE_ORDER', label: 'Pre-order' },
  { value: 'STANDARD', label: 'Van-Sales' },
  { value: 'SAMPLE', label: 'Hàng mẫu' },
];
// Khop dung REASON_OPTIONS cua trang /inventory/goods-issue (GoodsIssue.reason la free-text, xem
// migration V17). Dung khi Document Type = Phieu xuat kho tong hop.
const REASON_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SALE', label: 'Xuất bán' },
  { value: 'DAMAGE', label: 'Xuất hủy / hàng hỏng' },
  { value: 'INTERNAL', label: 'Xuất dùng nội bộ' },
  { value: 'ADJUST', label: 'Điều chỉnh giảm sau kiểm kê' },
];

function orderTypeTag(type) {
  if (type === 'PRE_ORDER') return <Tag color="blue">Pre-order</Tag>;
  if (type === 'SAMPLE') return <Tag color="purple">Hàng mẫu</Tag>;
  return <Tag color="geekblue">Van-Sales</Tag>;
}

function deliveryStatusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã giao</Tag>;
  if (status === 'CANCELLED') return <Tag color="red">Đã hủy</Tag>;
  return <Tag color="gold">Chờ giao</Tag>;
}

function reasonTag(reason) {
  const label = REASON_FILTER_OPTIONS.find((o) => o.value === reason)?.label || reason;
  const color = { SALE: 'blue', DAMAGE: 'red', INTERNAL: 'orange', ADJUST: 'purple' }[reason] || 'default';
  return <Tag color={color}>{label}</Tag>;
}

function goodsIssueStatusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã xuất</Tag>;
  return <Tag color="gold">Nháp</Tag>;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(v) {
  return v == null ? '-' : Number(v).toLocaleString('vi-VN');
}

function formatDateTime(v) {
  if (!v) return '-';
  return new Date(v).toLocaleString('vi-VN');
}

// Lay Don gia tu dong Don hang ban (SalesOrderDetail.unitPrice) khop theo san pham - Don giao
// hang (DeliveryOrderItem) KHONG co don gia/thanh tien rieng (chi la phieu bao nhieu giao thuc
// te), nen phai doi chieu qua don hang ban goc de co Don gia/Thanh tien tren "Phieu giao nhan
// thanh toan". Mau phieu goc con co %CK/VAT/Khuyen mai/tra thuong/chiet khau NPP - he thong CHUA
// co du lieu cho nhung muc nay nen da bo (thong nhat voi quyet dinh bo cot VAT/TT40 truoc do).
function findUnitPrice(order, productId) {
  const detail = (order.salesOrder?.details || []).find((d) => d.product?.id === productId);
  return detail ? Number(detail.unitPrice) : 0;
}

const DIGIT_WORDS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const SCALE_WORDS = ['', ' ngàn', ' triệu', ' tỷ'];

// Doc 1 nhom 3 chu so (0-999) thanh chu - forcePad: co doc "khong tram..." khi tram=0 hay khong
// (dung cho cac nhom KHONG phai nhom dau tien, vd 1.005.000 -> "mot trieu khong tram le nam ngan").
function readGroupVi(n, forcePad) {
  const hundred = Math.floor(n / 100);
  const tenUnit = n % 100;
  const ten = Math.floor(tenUnit / 10);
  const unit = tenUnit % 10;
  const parts = [];

  if (hundred > 0) parts.push(DIGIT_WORDS[hundred], 'trăm');
  else if (forcePad) parts.push('không', 'trăm');

  if (ten === 0) {
    if (unit > 0) {
      if (hundred > 0 || forcePad) parts.push('lẻ');
      parts.push(unit === 1 ? 'một' : DIGIT_WORDS[unit]);
    }
  } else if (ten === 1) {
    parts.push('mười');
    if (unit > 0) parts.push(unit === 5 ? 'lăm' : (unit === 1 ? 'mốt' : DIGIT_WORDS[unit]));
  } else {
    parts.push(DIGIT_WORDS[ten], 'mươi');
    if (unit > 0) parts.push(unit === 1 ? 'mốt' : (unit === 5 ? 'lăm' : DIGIT_WORDS[unit]));
  }
  return parts.join(' ');
}

// "Số tiền bằng chữ" cuối Phiếu giao nhận thanh toán - vd 3895 -> "Ba ngàn tám trăm chín mươi
// lăm đồng."
function soTienBangChu(amount) {
  let n = Math.round(Math.abs(Number(amount) || 0));
  if (n === 0) return 'Không đồng.';
  const groups = [];
  while (n > 0) {
    groups.unshift(n % 1000);
    n = Math.floor(n / 1000);
  }
  const total = groups.length;
  const words = groups
    .map((g, idx) => {
      if (g === 0) return '';
      const text = readGroupVi(g, idx > 0);
      return text + (SCALE_WORDS[total - 1 - idx] || '');
    })
    .filter(Boolean)
    .join(' ');
  const sentence = words.charAt(0).toUpperCase() + words.slice(1) + ' đồng.';
  return Number(amount) < 0 ? 'Âm ' + sentence.charAt(0).toLowerCase() + sentence.slice(1) : sentence;
}

// Cot cho Document Type = Phieu giao hang (nguon: DeliveryOrder).
const DELIVERY_NOTE_COLUMNS = [
  { title: 'Doc Number', dataIndex: 'docNumber', key: 'docNumber', fixed: 'left', width: 140 },
  {
    title: 'Doc Type', dataIndex: ['salesOrder', 'orderType'], key: 'orderType', width: 110,
    render: (v) => orderTypeTag(v),
  },
  { title: 'Base Type', key: 'baseType', width: 110, render: () => 'Đơn hàng bán' },
  { title: 'Base Doc Number', dataIndex: ['salesOrder', 'docNumber'], key: 'baseDocNumber', width: 140 },
  { title: 'Customer Code', dataIndex: ['salesOrder', 'customer', 'code'], key: 'customerCode', width: 110 },
  { title: 'Customer Name', dataIndex: ['salesOrder', 'customer', 'name'], key: 'customerName', width: 180 },
  // Khong co Ship To rieng trong du lieu goc (chi 1 dia chi Customer.address) - dung lai
  // Customer Code/Name lam Ship To, xem ghi chu trong bao cao khao sat.
  { title: 'Ship To Code', dataIndex: ['salesOrder', 'customer', 'code'], key: 'shipToCode', width: 110 },
  { title: 'Ship To Name', dataIndex: ['salesOrder', 'customer', 'name'], key: 'shipToName', width: 180 },
  { title: 'Posting Date', dataIndex: 'docDate', key: 'docDate', width: 110 },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (v) => deliveryStatusTag(v) },
  { title: 'Salesman Code', dataIndex: ['salesOrder', 'salesman', 'code'], key: 'salesmanCode', width: 110 },
  { title: 'Salesman Name', dataIndex: ['salesOrder', 'salesman', 'fullName'], key: 'salesmanName', width: 160 },
  { title: 'Address', dataIndex: ['salesOrder', 'customer', 'address'], key: 'address', width: 220, ellipsis: true },
  {
    title: 'Doc Total', dataIndex: ['salesOrder', 'totalAmount'], key: 'docTotal', width: 130, align: 'right',
    render: (v) => formatMoney(v),
  },
  { title: 'Number Of Prints', dataIndex: 'printCount', key: 'printCount', width: 110, align: 'center' },
  {
    title: 'Last Printing Time', dataIndex: 'lastPrintedAt', key: 'lastPrintedAt', width: 160,
    render: (v) => formatDateTime(v),
  },
];

// Cot cho Document Type = Phieu xuat kho tong hop (nguon: GoodsIssue - man hinh doc lap, khong
// lien ket Don hang ban/Don giao hang nen khong co cot khach hang/nhan vien ban hang).
const STOCK_ISSUE_COLUMNS = [
  { title: 'Doc Number', dataIndex: 'docNumber', key: 'docNumber', fixed: 'left', width: 140 },
  { title: 'Doc Date', dataIndex: 'docDate', key: 'docDate', width: 110 },
  { title: 'Posting Date', dataIndex: 'postingDate', key: 'postingDate', width: 110 },
  { title: 'Warehouse', dataIndex: ['warehouse', 'name'], key: 'warehouse', width: 180 },
  { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 170, render: (v) => reasonTag(v) },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (v) => goodsIssueStatusTag(v) },
  { title: 'Number Of Prints', dataIndex: 'printCount', key: 'printCount', width: 120, align: 'center' },
  {
    title: 'Last Printing Time', dataIndex: 'lastPrintedAt', key: 'lastPrintedAt', width: 160,
    render: (v) => formatDateTime(v),
  },
];

export default function PrintedNotePage() {
  const { selectedBranchId } = useBranch();
  const [filterForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printPortalEl, setPrintPortalEl] = useState(null);

  // #print-area PHAI la sibling cua #root (gan thang vao document.body qua Portal), KHONG duoc
  // la con chau cua #root nhu truoc - neu khong, khi in se phai dung ky thuat "visibility:hidden
  // cho ca body" de an sidebar/bang/filter, nhung toan bo cay DOM do VAN chiem cho (visibility
  // khac display:none) nen trinh duyet van phan trang theo chieu cao THAT cua ca trang dashboard,
  // sinh ra du trang trang (vd 1 don chi co 1 trang noi dung nhung preview hien toi 3 trang). Dua
  // #print-area ra ngoai #root -> chi can an nguyen #root (display:none that su, khong chiem cho)
  // luc in, #print-area tu nhien chi cao dung bang noi dung that cua no.
  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'print-area';
    document.body.appendChild(el);
    setPrintPortalEl(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  // documentTypeOverride: dung khi doi Document Type - gia tri moi chua chac da "ngam" vao form
  // luc ham nay chay (xem handleDocumentTypeChange), nen can truyen thang thay vi doc tu form.
  function loadOrders(documentTypeOverride) {
    const v = filterForm.getFieldsValue();
    const documentType = documentTypeOverride || v.documentType || 'DELIVERY_NOTE';
    const common = {
      branchId: selectedBranchId || undefined,
      fromDate: v.fromDate || undefined,
      toDate: v.toDate || undefined,
      printStatus: v.printStatus || 'ALL',
    };
    const subType = v.docSubType && v.docSubType !== 'ALL' ? v.docSubType : undefined;

    setLoading(true);
    const request = documentType === 'STOCK_ISSUE'
      ? axiosClient.get('/goods-issues/print-search', { skipCache: true, params: { ...common, reason: subType } })
      : axiosClient.get('/delivery-orders/print-search', { skipCache: true, params: { ...common, orderType: subType } });

    request
      .then(({ data }) => setRows(data.data?.content || []))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách chứng từ'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    filterForm.setFieldsValue({
      documentType: 'DELIVERY_NOTE',
      paperKind: 'A5_LANDSCAPE',
      fromDate: todayStr(),
      toDate: todayStr(),
      printStatus: 'NOT_PRINTED',
      docSubType: 'ALL',
    });
    loadOrders('DELIVERY_NOTE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  function handleFilter() {
    setSelectedRowKeys([]);
    loadOrders();
  }

  // Doi Document Type -> doi hoan toan nguon du lieu (DeliveryOrder/GoodsIssue co the trung id) nen
  // phai xoa luoi + lua chon cu va tai lai ngay, khong doi bam Filter - de lai luoi cu se hien sai
  // cot/du lieu cho toi khi bam Filter.
  function handleDocumentTypeChange(value) {
    filterForm.setFieldsValue({ docSubType: 'ALL' });
    setSelectedRowKeys([]);
    setRows([]);
    loadOrders(value);
  }

  const selectedOrders = rows.filter((r) => selectedRowKeys.includes(r.id));
  const documentType = Form.useWatch('documentType', filterForm) || 'DELIVERY_NOTE';
  const paperKind = Form.useWatch('paperKind', filterForm) || 'A5_LANDSCAPE';
  const subTypeOptions = documentType === 'STOCK_ISSUE' ? REASON_FILTER_OPTIONS : ORDER_TYPE_FILTER_OPTIONS;
  const columns = documentType === 'STOCK_ISSUE' ? STOCK_ISSUE_COLUMNS : DELIVERY_NOTE_COLUMNS;

  // Tung dong hang trong TAT CA chung tu dang chon, gop theo san pham - dung chung cho Phieu xuat
  // kho tong hop (chi can 1 lan duyet, khong quan tam chung tu nao).
  const aggregatedItems = useMemo(() => {
    const byProduct = new Map();
    selectedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.product.id;
        const row = byProduct.get(key) || { product: item.product, uom: item.uom, quantity: 0 };
        row.quantity += Number(item.quantity);
        byProduct.set(key, row);
      });
    });
    return Array.from(byProduct.values());
  }, [selectedOrders]);

  function applyPageStyle(kind) {
    let styleTag = document.getElementById('printed-note-page-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'printed-note-page-style';
      document.head.appendChild(styleTag);
    }
    const rule = PAPER_KIND_PAGE_RULE[kind] || PAPER_KIND_PAGE_RULE.A4_PORTRAIT;
    styleTag.textContent = `@page { ${rule.page} } .print-page { padding: ${rule.padding}; }`;
  }

  function handlePrint() {
    if (selectedOrders.length === 0) {
      message.warning('Chưa chọn chứng từ nào để in');
      return;
    }
    applyPageStyle(paperKind);
    setPrinting(true);
    // Doi 1 nhip de React render xong vung in (#print-area) truoc khi goi window.print(). CHI mo
    // hop thoai in cua trinh duyet - KHONG ghi nhan gi vao printed_note (xem ghi chu dau file:
    // window.print() khong bao gio cho biet nguoi dung da in that hay bam Huy/X).
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 50);
  }

  // "Tai xuong" - tao PDF THAT (html2canvas chup tung .print-page + jsPDF ghep trang) va pdf.save()
  // kich hoat download qua trinh duyet, KHONG qua hop thoai In nen khong co chuyen "bam Huy van
  // tinh la da tai". Chay xong khong loi -> chac chan da tai -> luc do moi ghi nhan.
  async function handleDownload() {
    if (selectedOrders.length === 0) {
      message.warning('Chưa chọn chứng từ nào để tải');
      return;
    }
    setDownloading(true);
    applyPageStyle(paperKind);
    setPrinting(true);
    // #print-area chi thuc su "display: block" trong @media print (xem index.css) - luc binh
    // thuong (khong phai dang in that) no la display:none nen co kich thuoc 0x0, html2canvas
    // chup se ra anh rong (loi "addImage ... UNKNOWN"). Can ep hien tam, dua ra ngoai man hinh
    // (khong anh huong giao dien) de html2canvas chup duoc dung noi dung, roi tra lai nhu cu.
    if (printPortalEl) {
      printPortalEl.style.display = 'block';
      printPortalEl.style.position = 'fixed';
      printPortalEl.style.top = '0';
      printPortalEl.style.left = '-10000px';
      printPortalEl.style.width = `${PAPER_KIND_PX_WIDTH[paperKind] || PAPER_KIND_PX_WIDTH.A4_PORTRAIT}px`;
      printPortalEl.style.background = '#fff';
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 100)); // doi #print-area render xong
      const pageEls = printPortalEl ? Array.from(printPortalEl.querySelectorAll('.print-page')) : [];
      if (pageEls.length === 0) {
        throw new Error('Không dựng được nội dung phiếu in');
      }
      const { format, orientation } = PAPER_KIND_JSPDF[paperKind] || PAPER_KIND_JSPDF.A4_PORTRAIT;
      const pdf = new jsPDF({ orientation, unit: 'mm', format });
      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await html2canvas(pageEls[i], { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage(format, orientation);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
        const w = imgProps.width * ratio;
        const h = imgProps.height * ratio;
        pdf.addImage(imgData, 'PNG', (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
      }
      const docLabel = DOC_TYPE_OPTIONS.find((o) => o.value === documentType)?.label || 'PhieuIn';
      pdf.save(`${docLabel.replace(/\s+/g, '_')}_${todayStr()}.pdf`);

      const docNumbers = selectedOrders.map((o) => o.docNumber);
      await axiosClient.post('/printed-notes', { docType: documentType, docNumbers });
      message.success(`Đã tải xuống và ghi nhận ${docNumbers.length} phiếu`);
      setSelectedRowKeys([]);
      loadOrders(); // Tai lai theo dung bo loc dang ap dung - chung tu vua tai co the khong con
                    // khop loc "Chua in" nua nen se tu bien khoi luoi, khong can tu vá state.
    } catch (err) {
      message.error('Tải phiếu in thất bại: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      if (printPortalEl) {
        printPortalEl.removeAttribute('style'); // tra lai CSS mac dinh (display:none luc khong in)
      }
      setPrinting(false);
      setDownloading(false);
    }
  }

  return (
    <div>
      <Title level={4} style={{ marginTop: -8, marginBottom: 0 }}>Phiếu in nhanh</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 13 }}>
        Lọc Đơn giao hàng/Phiếu xuất kho cần in, chọn dòng rồi in Phiếu giao hàng (từng đơn) hoặc
        Phiếu xuất kho tổng hợp (gộp số lượng theo sản phẩm của tất cả chứng từ đang chọn).
      </Text>

      <Card
        size="small"
        title={<Space><FilterOutlined /> Bộ lọc</Space>}
        style={{ marginBottom: 10 }}
        className="printed-note-filter-card"
      >
        <Form form={filterForm} layout="vertical" className="printed-note-filter-form">
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Document Type" name="documentType" required>
                <Select options={DOC_TYPE_OPTIONS} onChange={handleDocumentTypeChange} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Paper Kind" name="paperKind" required>
                <Select options={PAPER_KIND_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="From Date" name="fromDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="To Date" name="toDate">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Print Status" name="printStatus" required>
                <Select options={PRINT_STATUS_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Doc Type" name="docSubType">
                <Select options={subTypeOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" icon={<FilterOutlined />} onClick={handleFilter}>Filter</Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card
        size="small"
        title={`Danh sách chứng từ (${rows.length})`}
        extra={
          <Space>
            <Tag color={selectedRowKeys.length > 0 ? 'blue' : 'default'}>
              Đã chọn: {selectedRowKeys.length}
            </Tag>
            <Button icon={<ReloadOutlined />} onClick={() => loadOrders()}>Làm mới</Button>
            <Button
              icon={<PrinterOutlined />}
              disabled={selectedRowKeys.length === 0 || downloading}
              onClick={handlePrint}
            >
              In
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              disabled={selectedRowKeys.length === 0}
              loading={downloading}
              onClick={handleDownload}
            >
              Tải xuống {DOC_TYPE_OPTIONS.find((o) => o.value === documentType)?.label}
              {selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length})` : ''}
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          size="middle"
          bordered
          loading={loading}
          columns={columns}
          dataSource={rows}
          scroll={{ x: documentType === 'STOCK_ISSUE' ? 1100 : 1800 }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          locale={{ emptyText: 'No data' }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Tổng ${t} đơn` }}
        />
      </Card>

      {/* Render qua Portal thang vao document.body (sibling cua #root) - xem ghi chu o
          printPortalEl phia tren vi sao KHONG de #print-area nam trong cay DOM cua component nay
          nhu truoc (gay du trang trang khi in). Khi khong in (printing=false), #print-area ton
          tai nhung rong - CSS co san quy tac "#print-area { display: none }" cho man hinh binh
          thuong. */}
      {printPortalEl && createPortal(
        <>
          {printing && documentType === 'DELIVERY_NOTE' && selectedOrders.map((order) => {
          const branch = order.warehouse?.branch;
          const customer = order.salesOrder?.customer;
          const salesman = order.salesOrder?.salesman;
          const lineTotal = order.items.reduce(
            (sum, item) => sum + Number(item.quantity) * findUnitPrice(order, item.product.id), 0,
          );
          const totalQty = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);
          return (
            <div className="print-page" key={order.id}>
              <div className="print-header">
                <div className="print-header-company">
                  <div style={{ fontWeight: 700 }}>{branch?.name || order.warehouse?.name || ''}</div>
                  <div>{branch?.address || order.warehouse?.address || ''}</div>
                  {branch?.phone && <div>SĐT: {branch.phone}</div>}
                </div>
                <h2 className="print-title">PHIẾU GIAO NHẬN THANH TOÁN</h2>
                <div className="print-meta">
                  <span>Số phiếu: <b>{order.docNumber}</b></span>
                  <span>Ngày lập: <b>{formatDateTime(order.createdAt)}</b></span>
                  <span>Ngày đặt hàng: <b>{order.salesOrder?.docDate}</b></span>
                </div>
                <div className="print-meta">
                  <span>Khách hàng: <b>{customer ? `${customer.code} - ${customer.name}` : ''}</b></span>
                  <span>NVBH: <b>{salesman?.fullName || ''}</b></span>
                </div>
                <div className="print-meta">
                  <span>Địa chỉ: {customer?.address || ''}</span>
                  <span>Số điện thoại NVBH: {salesman?.phone || ''}</span>
                </div>
                <div className="print-meta">
                  <span>Số điện thoại KH: {customer?.phone || ''}</span>
                  <span>Ghi chú: {order.remarks || ''}</span>
                </div>
              </div>
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>STT</th>
                    <th>Mã hàng</th>
                    <th>Tên hàng</th>
                    <th style={{ width: 70 }}>ĐVT</th>
                    <th style={{ width: 80 }}>SL</th>
                    <th style={{ width: 110 }}>Đơn giá</th>
                    <th style={{ width: 130 }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const unitPrice = findUnitPrice(order, item.product.id);
                    return (
                      <tr key={item.id}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td>{item.product.code}</td>
                        <td>{item.product.name}</td>
                        <td style={{ textAlign: 'center' }}>{item.uom?.name || ''}</td>
                        <td style={{ textAlign: 'right' }}>{Number(item.quantity).toLocaleString('vi-VN')}</td>
                        <td style={{ textAlign: 'right' }}>{formatMoney(unitPrice)}</td>
                        <td style={{ textAlign: 'right' }}>{formatMoney(unitPrice * Number(item.quantity))}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right' }}>Tổng cộng:</td>
                    <td style={{ textAlign: 'right' }}>{totalQty.toLocaleString('vi-VN')}</td>
                    <td />
                    <td style={{ textAlign: 'right' }}>{formatMoney(lineTotal)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="print-totals">
                <span>Tổng giá trị đơn hàng: <b>{formatMoney(lineTotal)} đ</b></span>
                <span>Tiền phải thu: <b>{formatMoney(lineTotal)} đ</b></span>
              </div>
              <div className="print-words">Số tiền bằng chữ: {soTienBangChu(lineTotal)}</div>
              <PrintSignatures names={['Khách hàng', 'Nhân viên giao hàng', 'Kế toán']} />
            </div>
          );
        })}

        {printing && documentType === 'STOCK_ISSUE' && (
          <div className="print-page">
            <PrintHeader
              title="PHIẾU XUẤT KHO TỔNG HỢP"
              order={selectedOrders[0]}
              subtitle={`Gộp ${selectedOrders.length} chứng từ: ${selectedOrders.map((o) => o.docNumber).join(', ')}`}
            />
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>STT</th>
                  <th>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: 80 }}>ĐVT</th>
                  <th style={{ width: 120 }}>Tổng số lượng</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedItems.map((row, idx) => (
                  <tr key={row.product.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>{row.product.code}</td>
                    <td>{row.product.name}</td>
                    <td style={{ textAlign: 'center' }}>{row.uom?.name || ''}</td>
                    <td style={{ textAlign: 'right' }}>{row.quantity.toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PrintSignatures names={['Người lập phiếu', 'Thủ kho']} />
          </div>
        )}
        </>,
        printPortalEl,
      )}
    </div>
  );
}

function PrintHeader({ title, order, subtitle }) {
  const warehouse = order?.warehouse;
  const branch = warehouse?.branch;
  return (
    <div className="print-header">
      <div className="print-header-company">
        <div style={{ fontWeight: 700 }}>{branch?.name || warehouse?.name || ''}</div>
        <div>{warehouse?.address || branch?.address || ''}</div>
      </div>
      <h2 className="print-title">{title}</h2>
      {order && (
        <div className="print-meta">
          <span>Số phiếu: <b>{order.docNumber}</b></span>
          <span>Ngày: <b>{order.docDate}</b></span>
        </div>
      )}
      {order?.salesOrder?.customer && (
        <div className="print-meta">
          <span>Khách hàng: <b>{order.salesOrder.customer.code} - {order.salesOrder.customer.name}</b></span>
          <span>Địa chỉ: {order.salesOrder.customer.address || ''}</span>
        </div>
      )}
      {subtitle && <div className="print-subtitle">{subtitle}</div>}
    </div>
  );
}

function PrintSignatures({ names }) {
  return (
    <div className="print-signatures">
      {names.map((name) => (
        <div key={name}>
          <div>{name}</div>
          <div className="print-sign-hint">(Ký, ghi rõ họ tên)</div>
        </div>
      ))}
    </div>
  );
}
