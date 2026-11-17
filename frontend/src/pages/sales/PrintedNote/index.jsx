import { useEffect, useMemo, useState } from 'react';
import {
  Typography, Table, Tag, Select, Button, Space, Row, Col, Form, Input, message, Card,
} from 'antd';
import { FilterOutlined, ReloadOutlined, PrinterOutlined } from '@ant-design/icons';
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
const PAPER_KIND_PAGE_RULE = {
  A4_PORTRAIT: '@page { size: A4 portrait; margin: 12mm; }',
  A4_LANDSCAPE: '@page { size: A4 landscape; margin: 12mm; }',
  A5_PORTRAIT: '@page { size: A5 portrait; margin: 8mm; }',
  A5_LANDSCAPE: '@page { size: A5 landscape; margin: 8mm; }',
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
    styleTag.textContent = PAPER_KIND_PAGE_RULE[kind] || PAPER_KIND_PAGE_RULE.A4_PORTRAIT;
  }

  function handlePrint() {
    if (selectedOrders.length === 0) {
      message.warning('Chưa chọn chứng từ nào để in');
      return;
    }
    applyPageStyle(paperKind);
    setPrinting(true);
    // Doi 1 nhip de React render xong vung in (#print-area) truoc khi goi window.print().
    setTimeout(() => {
      window.print();
      setPrinting(false);
      const docNumbers = selectedOrders.map((o) => o.docNumber);
      axiosClient.post('/printed-notes', { docType: documentType, docNumbers })
        .then(() => {
          message.success(`Đã in ${docNumbers.length} phiếu`);
          setSelectedRowKeys([]);
          loadOrders(); // Tai lai theo dung bo loc dang ap dung - chung tu vua in co the khong con
                        // khop loc "Chua in" nua nen se tu bien khoi luoi, khong can tu vá state.
        })
        .catch(() => message.error('In xong nhưng không ghi nhận được số lần in - thử Làm mới lại trang'));
    }, 50);
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
              type="primary"
              icon={<PrinterOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handlePrint}
            >
              In {DOC_TYPE_OPTIONS.find((o) => o.value === documentType)?.label}
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

      {/* Vung chi hien khi in (@media print - xem index.css) - khong render gi khi dang xem binh
          thuong tren man hinh de tranh anh huong layout trang. */}
      <div id="print-area">
        {printing && documentType === 'DELIVERY_NOTE' && selectedOrders.map((order) => (
          <div className="print-page" key={order.id}>
            <PrintHeader title="PHIẾU GIAO HÀNG" order={order} />
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>STT</th>
                  <th>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: 80 }}>ĐVT</th>
                  <th style={{ width: 100 }}>Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>{item.product.code}</td>
                    <td>{item.product.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.uom?.name || ''}</td>
                    <td style={{ textAlign: 'right' }}>{Number(item.quantity).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PrintSignatures left="Người giao hàng" right="Người nhận hàng" />
          </div>
        ))}

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
            <PrintSignatures left="Người lập phiếu" right="Thủ kho" />
          </div>
        )}
      </div>
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

function PrintSignatures({ left, right }) {
  return (
    <div className="print-signatures">
      <div>
        <div>{left}</div>
        <div className="print-sign-hint">(Ký, ghi rõ họ tên)</div>
      </div>
      <div>
        <div>{right}</div>
        <div className="print-sign-hint">(Ký, ghi rõ họ tên)</div>
      </div>
    </div>
  );
}
