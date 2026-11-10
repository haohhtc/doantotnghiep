import { useState, useCallback, useMemo } from 'react';
import { Button, Input, Select, Typography, Tag, Spin, Alert, Table } from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, FilterOutlined,
  FileExcelOutlined, SearchOutlined,
  BarChartOutlined, ShopOutlined, TeamOutlined,
  UserOutlined, InboxOutlined, AppstoreOutlined, TableOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
const REPORTS_URL = import.meta.env.VITE_REPORTS_API_URL || 'http://localhost:8005';

const fmtDate = v => (!v ? '' : String(v).slice(0, 10));
const fmtNum  = v => (v == null || v === '' ? '' : Number(v).toLocaleString('vi-VN'));
const fmtCur  = v => (v == null || v === '' ? '' : Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 0 }));
const fmtPct  = v => (v == null || v === '' ? '' : `${v}%`);

const DASHBOARD_IDS = new Set(['dashboard', 'dashboard_npp', 'dashboard_giam_sat']);

// Column + slicer definitions from BC_BANHANG_FULL.pbit tableEx/slicer visuals
const CARD_CONFIGS = {
  chi_tiet_bh: {
    columns: [
      { dataIndex: 'so_order_number', title: 'Số HĐ', width: 130, ellipsis: true },
      { dataIndex: 'so_order_date', title: 'Ngày tạo ĐH', width: 110, render: fmtDate },
      { dataIndex: 'sos_order_type_vn', title: 'Loại ĐH', width: 100, ellipsis: true },
      { dataIndex: 'so_order_status_vn', title: 'Trạng thái', width: 120, ellipsis: true },
      { dataIndex: 'branch_name', title: 'NPP', width: 160, ellipsis: true },
      { dataIndex: 'region_name', title: 'Vùng', width: 100, ellipsis: true },
      { dataIndex: 'selling_zone_name', title: 'Zone', width: 100, ellipsis: true },
      { dataIndex: 'route_code', title: 'Mã tuyến', width: 90, ellipsis: true },
      { dataIndex: 'salesperson_name', title: 'NVBH', width: 140, ellipsis: true },
      { dataIndex: 'customer_code', title: 'Mã KH', width: 100, ellipsis: true },
      { dataIndex: 'customer_name', title: 'Tên KH', width: 180, ellipsis: true },
      { dataIndex: 'product_code', title: 'Mã SP', width: 100, ellipsis: true },
      { dataIndex: 'product_name', title: 'Tên SP', width: 200, ellipsis: true },
      { dataIndex: 'product_uom_code', title: 'ĐVT', width: 65, ellipsis: true },
      { dataIndex: 'quantity', title: 'Số lượng', width: 90, align: 'right', render: fmtNum },
      { dataIndex: 'unit_price', title: 'Đơn giá', width: 110, align: 'right', render: fmtCur },
      { dataIndex: 'line_amount_before_discount', title: 'Tiền trước CK', width: 135, align: 'right', render: fmtCur },
      { dataIndex: 'discount_amount', title: 'Chiết khấu', width: 110, align: 'right', render: fmtCur },
      { dataIndex: 'line_amount', title: 'Tiền hàng', width: 115, align: 'right', render: fmtCur },
      { dataIndex: 'tax_rate', title: 'Thuế %', width: 75, align: 'right', render: fmtPct },
      { dataIndex: 'tax_amount', title: 'Tiền thuế', width: 110, align: 'right', render: fmtCur },
      { dataIndex: 'line_amount_after_tax', title: 'Thành tiền', width: 120, align: 'right', render: fmtCur },
      { dataIndex: 'so_link_number', title: 'Số liên kết', width: 120, ellipsis: true },
    ],
    slicers: [
      { key: 'salesperson_name', label: 'Nhân viên BH' },
      { key: 'branch_name', label: 'NPP' },
      { key: 'so_order_status_vn', label: 'Trạng thái' },
      { key: 'so_order_year', label: 'Năm' },
      { key: 'so_order_month', label: 'Tháng' },
      { key: 'customer_name', label: 'Khách hàng' },
      { key: 'product_name', label: 'Sản phẩm' },
      { key: 'sos_order_type_vn', label: 'Loại ĐH' },
    ],
  },
  ds_theo_kh: {
    columns: [
      { dataIndex: 'so_order_number', title: 'Số HĐ', width: 130, ellipsis: true },
      { dataIndex: 'so_order_date', title: 'Ngày tạo ĐH', width: 110, render: fmtDate },
      { dataIndex: 'customer_code', title: 'Mã KH', width: 100, ellipsis: true },
      { dataIndex: 'customer_name', title: 'Tên KH', width: 180, ellipsis: true },
      { dataIndex: 'customer_channel_name', title: 'Kênh', width: 120, ellipsis: true },
      { dataIndex: 'customer_province', title: 'Tỉnh/TP', width: 120, ellipsis: true },
      { dataIndex: 'customer_district', title: 'Quận/Huyện', width: 120, ellipsis: true },
      { dataIndex: 'customer_ward', title: 'Phường/Xã', width: 120, ellipsis: true },
      { dataIndex: 'branch_name', title: 'NPP phụ trách', width: 160, ellipsis: true },
      { dataIndex: 'region_name', title: 'Vùng', width: 100, ellipsis: true },
      { dataIndex: 'selling_zone_name', title: 'Zone', width: 100, ellipsis: true },
      { dataIndex: 'route_code', title: 'Mã tuyến', width: 90, ellipsis: true },
      { dataIndex: 'salesperson_name', title: 'NVBH phụ trách', width: 155, ellipsis: true },
      { dataIndex: 'supervisor_name', title: 'Giám sát', width: 140, ellipsis: true },
      { dataIndex: 'quantity', title: 'Tổng SL', width: 90, align: 'right', render: fmtNum },
      { dataIndex: 'line_amount_before_discount', title: 'Tiền trước CK', width: 135, align: 'right', render: fmtCur },
      { dataIndex: 'discount_amount', title: 'Chiết khấu', width: 110, align: 'right', render: fmtCur },
      { dataIndex: 'line_amount_after_tax', title: 'Doanh thu (sau thuế)', width: 170, align: 'right', render: fmtCur },
    ],
    slicers: [
      { key: 'customer_province', label: 'Tỉnh/TP' },
      { key: 'salesperson_name', label: 'Nhân viên BH' },
      { key: 'supervisor_name', label: 'Giám sát' },
      { key: 'so_order_year', label: 'Năm' },
      { key: 'branch_name', label: 'NPP' },
      { key: 'customer_channel_name', label: 'Kênh KH' },
      { key: 'so_order_month', label: 'Tháng' },
    ],
  },
  chi_tiet_don: {
    columns: [
      { dataIndex: 'so_order_number', title: 'Số HĐ', width: 130, ellipsis: true },
      { dataIndex: 'so_order_date', title: 'Ngày tạo ĐH', width: 110, render: fmtDate },
      { dataIndex: 'sos_order_type_vn', title: 'Loại ĐH', width: 100, ellipsis: true },
      { dataIndex: 'so_order_status_vn', title: 'Trạng thái', width: 120, ellipsis: true },
      { dataIndex: 'branch_name', title: 'NPP', width: 160, ellipsis: true },
      { dataIndex: 'region_name', title: 'Vùng', width: 100, ellipsis: true },
      { dataIndex: 'selling_zone_name', title: 'Zone', width: 100, ellipsis: true },
      { dataIndex: 'route_code', title: 'Mã tuyến', width: 90, ellipsis: true },
      { dataIndex: 'salesperson_name', title: 'NVBH', width: 140, ellipsis: true },
      { dataIndex: 'customer_code', title: 'Mã KH', width: 100, ellipsis: true },
      { dataIndex: 'customer_name', title: 'Tên KH', width: 180, ellipsis: true },
      { dataIndex: 'product_code', title: 'Mã SP', width: 100, ellipsis: true },
      { dataIndex: 'product_name', title: 'Tên SP', width: 200, ellipsis: true },
      { dataIndex: 'product_uom_code', title: 'ĐVT', width: 65, ellipsis: true },
      { dataIndex: 'quantity', title: 'Số lượng', width: 90, align: 'right', render: fmtNum },
      { dataIndex: 'unit_price', title: 'Đơn giá', width: 110, align: 'right', render: fmtCur },
      { dataIndex: 'line_amount_before_discount', title: 'Tiền trước CK', width: 135, align: 'right', render: fmtCur },
      { dataIndex: 'discount_amount', title: 'Chiết khấu', width: 110, align: 'right', render: fmtCur },
      { dataIndex: 'line_amount', title: 'Tiền hàng', width: 115, align: 'right', render: fmtCur },
      { dataIndex: 'tax_rate', title: 'Thuế %', width: 75, align: 'right', render: fmtPct },
      { dataIndex: 'tax_amount', title: 'Tiền thuế', width: 110, align: 'right', render: fmtCur },
      { dataIndex: 'line_amount_after_tax', title: 'Thành tiền', width: 120, align: 'right', render: fmtCur },
      { dataIndex: 'so_link_number', title: 'Số liên kết', width: 120, ellipsis: true },
    ],
    slicers: [
      { key: 'so_order_year', label: 'Năm' },
      { key: 'so_order_status_vn', label: 'Trạng thái' },
      { key: 'salesperson_name', label: 'Nhân viên BH' },
      { key: 'sos_order_type_vn', label: 'Loại ĐH' },
      { key: 'so_order_month', label: 'Tháng' },
      { key: 'customer_name', label: 'Khách hàng' },
      { key: 'branch_name', label: 'NPP' },
    ],
  },
  theo_doi_sl: {
    columns: [
      { dataIndex: 'branch_name', title: 'NPP', width: 160, ellipsis: true },
      { dataIndex: 'region_name', title: 'Vùng', width: 100, ellipsis: true },
      { dataIndex: 'selling_zone_name', title: 'Zone', width: 100, ellipsis: true },
      { dataIndex: 'route_code', title: 'Mã tuyến', width: 90, ellipsis: true },
      { dataIndex: 'product_code', title: 'Mã SP', width: 100, ellipsis: true },
      { dataIndex: 'product_name', title: 'Tên SP', width: 200, ellipsis: true },
      { dataIndex: 'parent_category_name', title: 'Ngành hàng', width: 130, ellipsis: true },
      { dataIndex: 'category_name', title: 'Danh mục', width: 130, ellipsis: true },
      { dataIndex: 'product_uom_code', title: 'ĐVT', width: 65, ellipsis: true },
      { dataIndex: 'quantity', title: 'Sản lượng', width: 100, align: 'right', render: fmtNum },
      { dataIndex: 'line_amount_after_tax', title: 'Doanh thu', width: 120, align: 'right', render: fmtCur },
    ],
    slicers: [
      { key: 'product_name', label: 'Sản phẩm' },
      { key: 'branch_name', label: 'NPP' },
      { key: 'category_name', label: 'Danh mục SP' },
      { key: 'parent_category_name', label: 'Ngành hàng' },
      { key: 'so_order_year', label: 'Năm' },
      { key: 'so_order_month', label: 'Tháng' },
    ],
  },
  sl_theo_npp: {
    columns: [
      { dataIndex: 'branch_code', title: 'Mã NPP', width: 100, ellipsis: true },
      { dataIndex: 'branch_name', title: 'Tên NPP', width: 160, ellipsis: true },
      { dataIndex: 'region_name', title: 'Vùng', width: 100, ellipsis: true },
      { dataIndex: 'selling_zone_name', title: 'Zone', width: 100, ellipsis: true },
      { dataIndex: 'route_code', title: 'Mã tuyến', width: 90, ellipsis: true },
      { dataIndex: 'product_code', title: 'Mã SP', width: 100, ellipsis: true },
      { dataIndex: 'product_name', title: 'Sản phẩm', width: 200, ellipsis: true },
      { dataIndex: 'category_name', title: 'Danh mục', width: 130, ellipsis: true },
      { dataIndex: 'product_uom_code', title: 'ĐVT', width: 65, ellipsis: true },
      { dataIndex: 'quantity', title: 'Sản lượng', width: 100, align: 'right', render: fmtNum },
      { dataIndex: 'line_amount_after_tax', title: 'Doanh thu', width: 120, align: 'right', render: fmtCur },
    ],
    slicers: [
      { key: 'region_name', label: 'Vùng' },
      { key: 'selling_zone_name', label: 'Zone' },
      { key: 'category_name', label: 'Danh mục' },
      { key: 'branch_name', label: 'NPP' },
      { key: 'so_order_month', label: 'Tháng' },
      { key: 'so_order_year', label: 'Năm' },
      { key: 'product_name', label: 'Sản phẩm' },
      { key: 'parent_category_name', label: 'Ngành hàng' },
    ],
  },
  sl_theo_nv: {
    columns: [
      { dataIndex: 'salesperson_code', title: 'Mã NV', width: 90, ellipsis: true },
      { dataIndex: 'salesperson_name', title: 'Tên NV', width: 140, ellipsis: true },
      { dataIndex: 'supervisor_name', title: 'Giám sát', width: 140, ellipsis: true },
      { dataIndex: 'branch_name', title: 'NPP', width: 160, ellipsis: true },
      { dataIndex: 'region_name', title: 'Vùng', width: 100, ellipsis: true },
      { dataIndex: 'selling_zone_name', title: 'Zone', width: 100, ellipsis: true },
      { dataIndex: 'route_code', title: 'Mã tuyến', width: 90, ellipsis: true },
      { dataIndex: 'route_name', title: 'Tuyến BH', width: 140, ellipsis: true },
      { dataIndex: 'customer_code', title: 'Mã KH', width: 100, ellipsis: true },
      { dataIndex: 'customer_name', title: 'Khách hàng', width: 180, ellipsis: true },
      { dataIndex: 'product_name', title: 'Sản phẩm', width: 200, ellipsis: true },
      { dataIndex: 'product_uom_code', title: 'ĐVT', width: 65, ellipsis: true },
      { dataIndex: 'quantity', title: 'Sản lượng', width: 100, align: 'right', render: fmtNum },
      { dataIndex: 'line_amount_after_tax', title: 'Doanh thu', width: 120, align: 'right', render: fmtCur },
    ],
    slicers: [
      { key: 'branch_name', label: 'NPP' },
      { key: 'route_name', label: 'Tuyến BH' },
      { key: 'supervisor_name', label: 'Giám sát' },
      { key: 'so_order_month', label: 'Tháng' },
      { key: 'so_order_year', label: 'Năm' },
      { key: 'salesperson_name', label: 'Nhân viên BH' },
      { key: 'region_name', label: 'Vùng' },
    ],
  },
  sl_theo_kh: {
    columns: [
      { dataIndex: 'customer_code', title: 'Mã KH', width: 100, ellipsis: true },
      { dataIndex: 'customer_name', title: 'Tên KH', width: 180, ellipsis: true },
      { dataIndex: 'customer_province', title: 'Tỉnh/TP', width: 120, ellipsis: true },
      { dataIndex: 'customer_district', title: 'Quận/Huyện', width: 120, ellipsis: true },
      { dataIndex: 'customer_ward', title: 'Phường/Xã', width: 120, ellipsis: true },
      { dataIndex: 'customer_channel_name', title: 'Kênh', width: 120, ellipsis: true },
      { dataIndex: 'branch_name', title: 'NPP', width: 160, ellipsis: true },
      { dataIndex: 'region_name', title: 'Vùng', width: 100, ellipsis: true },
      { dataIndex: 'selling_zone_name', title: 'Zone', width: 100, ellipsis: true },
      { dataIndex: 'route_code', title: 'Mã tuyến', width: 90, ellipsis: true },
      { dataIndex: 'salesperson_name', title: 'NVBH', width: 140, ellipsis: true },
      { dataIndex: 'product_name', title: 'Sản phẩm', width: 200, ellipsis: true },
      { dataIndex: 'product_uom_code', title: 'ĐVT', width: 65, ellipsis: true },
      { dataIndex: 'quantity', title: 'Sản lượng', width: 100, align: 'right', render: fmtNum },
      { dataIndex: 'line_amount_after_tax', title: 'Doanh thu', width: 120, align: 'right', render: fmtCur },
    ],
    slicers: [
      { key: 'so_order_year', label: 'Năm' },
      { key: 'branch_name', label: 'NPP' },
      { key: 'so_order_month', label: 'Tháng' },
      { key: 'customer_name', label: 'Khách hàng' },
      { key: 'customer_channel_name', label: 'Kênh KH' },
      { key: 'customer_province', label: 'Tỉnh/TP' },
    ],
  },
};

// 10 cards matching tabs in BC_BANHANG_FULL.pbit
const REPORT_CARDS = [
  {
    id: 'dashboard', title: 'DASHBOARD', tag: 'Dashboard', icon: 'bar',
    desc: 'Tổng quan doanh số bán hàng: biểu đồ doanh số, sản lượng, trạng thái đơn hàng theo tháng',
  },
  {
    id: 'dashboard_npp', title: 'DASHBOARD NPP', tag: 'Dashboard', icon: 'shop',
    desc: 'Tổng quan doanh số và sản lượng theo chi nhánh NPP, so sánh theo thời gian',
  },
  {
    id: 'dashboard_giam_sat', title: 'DASHBOARD GIÁM SÁT', tag: 'Dashboard', icon: 'appstore',
    desc: 'Dashboard giám sát hiệu suất bán hàng theo kênh phân phối và nhân viên',
  },
  {
    id: 'chi_tiet_bh', title: '5.1.1 CHI TIẾT BÁN HÀNG', tag: 'Chi tiết', icon: 'table',
    desc: 'Bảng chi tiết toàn bộ dòng bán hàng: sản phẩm, NPP, NVBH, số lượng, doanh số',
  },
  {
    id: 'ds_theo_kh', title: '5.1.2 DOANH SỐ THEO KHÁCH HÀNG', tag: 'Chi tiết', icon: 'user',
    desc: 'Doanh số bán hàng phân tích theo từng khách hàng: địa chỉ, kênh, NPP phụ trách',
  },
  {
    id: 'chi_tiet_don', title: '5.1.3 CHI TIẾT ĐƠN HÀNG', tag: 'Chi tiết', icon: 'inbox',
    desc: 'Chi tiết từng đơn hàng: trạng thái, sản phẩm, số lượng và doanh số',
  },
  {
    id: 'theo_doi_sl', title: '5.1.5 THEO DÕI SẢN LƯỢNG BH', tag: 'Sản lượng', icon: 'bar',
    desc: 'Theo dõi sản lượng bán hàng tổng hợp theo NPP, tuyến, danh mục sản phẩm',
  },
  {
    id: 'sl_theo_npp', title: '5.1.5 SẢN LƯỢNG THEO NPP', tag: 'Sản lượng', icon: 'shop',
    desc: 'Sản lượng bán hàng phân tích theo từng chi nhánh NPP, vùng và danh mục',
  },
  {
    id: 'sl_theo_nv', title: '5.1.5 SẢN LƯỢNG THEO NV', tag: 'Sản lượng', icon: 'team',
    desc: 'Sản lượng bán hàng phân tích theo từng nhân viên bán hàng và tuyến',
  },
  {
    id: 'sl_theo_kh', title: '5.1.5 SẢN LƯỢNG THEO KH', tag: 'Sản lượng', icon: 'user',
    desc: 'Sản lượng bán hàng phân tích theo từng khách hàng, kênh và địa bàn',
  },
];

const TABS = ['Tất cả', 'Dashboard', 'Chi tiết', 'Sản lượng'];

function ReportIcon({ type, size = 22, color = '#1a3877' }) {
  const s = { fontSize: size, color };
  if (type === 'bar') return <BarChartOutlined style={s} />;
  if (type === 'shop') return <ShopOutlined style={s} />;
  if (type === 'team') return <TeamOutlined style={s} />;
  if (type === 'user') return <UserOutlined style={s} />;
  if (type === 'inbox') return <InboxOutlined style={s} />;
  if (type === 'table') return <TableOutlined style={s} />;
  return <AppstoreOutlined style={s} />;
}

function ReportCard({ card, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? '#1a3877' : '#e8e8e8'}`,
        borderRadius: 8, padding: 20, cursor: 'pointer', background: '#fff',
        transition: 'all 0.15s',
        boxShadow: hovered ? '0 4px 16px rgba(26,56,119,0.12)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: hovered ? '#1a3877' : '#e8f0fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.15s',
        }}>
          <ReportIcon type={card.icon} size={22} color={hovered ? '#fff' : '#1a3877'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <Tag style={{ fontSize: 10, background: '#e8f0fe', color: '#1a3877', border: 'none' }}>
              {card.tag}
            </Tag>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 6, color: '#222' }}>
            {card.title}
          </div>
          <div style={{ fontSize: 12, color: '#777', lineHeight: 1.5 }}>
            {card.desc}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesReportPage() {
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [searchText, setSearchText] = useState('');
  const [filterOpen, setFilterOpen] = useState(true);

  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  // filters: { fieldKey: selectedValues[] }
  const [filters, setFilters] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${REPORTS_URL}/reports/sellout`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAllData(json.rows || []);
      setFetchedAt(new Date());
      setLoaded(true);
    } catch (e) {
      setError('Không lấy được dữ liệu: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Options for each slicer dropdown, derived from raw data
  const slicerOpts = useMemo(() => {
    const result = {};
    const allKeys = new Set(
      Object.values(CARD_CONFIGS).flatMap(c => c.slicers.map(s => s.key))
    );
    for (const key of allKeys) {
      const vals = [...new Set(allData.map(r => r[key]).filter(v => v != null))];
      // Sort numerically for year/month, alphabetically for others
      if (key === 'so_order_year' || key === 'so_order_month') {
        vals.sort((a, b) => a - b);
      } else {
        vals.sort((a, b) => String(a).localeCompare(String(b), 'vi'));
      }
      result[key] = vals.map(v => ({ label: String(v), value: v }));
    }
    return result;
  }, [allData]);

  const cardConfig = selected ? CARD_CONFIGS[selected.id] : null;

  const filteredData = useMemo(() => {
    if (!cardConfig) return [];
    return allData.filter(row => {
      for (const { key } of cardConfig.slicers) {
        const sel = filters[key];
        if (sel && sel.length > 0 && !sel.includes(row[key])) return false;
      }
      return true;
    });
  }, [allData, cardConfig, filters]);

  const activeFilterCount = useMemo(() =>
    Object.values(filters).reduce((n, v) => n + (v?.length || 0), 0),
  [filters]);

  const exportCSV = () => {
    if (!filteredData.length || !cardConfig) return;
    const cols = cardConfig.columns.map(c => c.dataIndex);
    const headers = cardConfig.columns.map(c => c.title);
    const csv = [
      headers.join(','),
      ...filteredData.map(r => cols.map(k => JSON.stringify(r[k] ?? '')).join(',')),
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openReport = (card) => {
    setSelected(card);
    setFilters({});
    setView('detail');
  };

  const visibleCards = useMemo(() => REPORT_CARDS.filter(c => {
    if (activeTab !== 'Tất cả' && c.tag !== activeTab) return false;
    const q = searchText.toLowerCase();
    if (q && !c.title.toLowerCase().includes(q) && !c.desc.toLowerCase().includes(q)) return false;
    return true;
  }), [activeTab, searchText]);

  /* ─── LIST VIEW ─── */
  if (view === 'list') {
    return (
      <div style={{ background: '#fff', minHeight: 'calc(100vh - 130px)' }}>
        <div style={{ padding: '16px 24px 0', borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ color: '#1a3877', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>
            BC BÁN HÀNG
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>
            SELECT REPORT
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                border: 'none', background: 'none', cursor: 'pointer',
                padding: '8px 0', fontSize: 13,
                borderBottom: activeTab === t ? '2px solid #1a3877' : '2px solid transparent',
                fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? '#1a3877' : '#666',
              }}>{t}</button>
            ))}
            <div style={{ flex: 1 }} />
            <Input
              placeholder="Search reports..."
              prefix={<SearchOutlined style={{ color: '#aaa' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 240 }}
              size="small"
            />
          </div>
        </div>

        <div style={{
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {visibleCards.map(card => (
            <ReportCard key={card.id} card={card} onClick={() => openReport(card)} />
          ))}
        </div>
      </div>
    );
  }

  /* ─── DETAIL VIEW ─── */
  const isDashboard = selected && DASHBOARD_IDS.has(selected.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', background: '#fff' }}>
      {/* Top action bar */}
      <div style={{ borderBottom: '1px solid #e8e8e8', padding: '8px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button
            type="text" size="small" icon={<ArrowLeftOutlined />}
            onClick={() => setView('list')}
            style={{ color: '#1a3877', paddingLeft: 0, fontWeight: 500 }}
          >
            Back to report list
          </Button>
          <span style={{ color: '#ddd' }}>|</span>
          <div>
            <div style={{ fontSize: 10, color: '#1a3877', fontWeight: 700, letterSpacing: 1.5, lineHeight: 1 }}>REPORT</div>
            <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.5, lineHeight: 1.4, marginTop: 2 }}>
              {selected?.title}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {!isDashboard && (
            <>
              <Button
                type="primary" icon={<ReloadOutlined />}
                onClick={fetchData} loading={loading}
                style={{ background: '#1a3877', borderColor: '#1a3877' }}
              >
                {loaded ? 'Làm mới' : 'Tải báo cáo'}
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportCSV}
                disabled={!loaded}
                style={loaded ? { background: '#217346', borderColor: '#217346', color: '#fff' } : {}}
              >
                Export CSV
              </Button>
              {fetchedAt && (
                <Text style={{ fontSize: 11, color: '#999' }}>
                  {fetchedAt.toLocaleTimeString('vi-VN')}
                </Text>
              )}
              {loaded && (
                <Tag color="blue" style={{ fontSize: 11 }}>
                  {filteredData.length.toLocaleString()} / {allData.length.toLocaleString()} dòng
                </Tag>
              )}
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Filter panel - only for data cards */}
        {!isDashboard && filterOpen && cardConfig && (
          <div style={{
            width: 230, flexShrink: 0, borderRight: '1px solid #e8e8e8',
            overflowY: 'auto', padding: '14px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FilterOutlined />
                Filters
                {activeFilterCount > 0 && (
                  <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: '0 5px' }}>{activeFilterCount}</Tag>
                )}
              </span>
              {activeFilterCount > 0 && (
                <Button
                  type="link" size="small"
                  onClick={() => setFilters({})}
                  style={{ padding: 0, fontSize: 11, color: '#1a3877' }}
                >
                  Clear all
                </Button>
              )}
            </div>

            {cardConfig.slicers.map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 0.6, marginBottom: 5, textTransform: 'uppercase' }}>
                  {label}
                </div>
                <Select
                  mode="multiple"
                  size="small"
                  allowClear
                  placeholder="-- Tất cả --"
                  style={{ width: '100%' }}
                  options={slicerOpts[key] || []}
                  value={filters[key] || []}
                  maxTagCount={1}
                  onChange={v => setFilters(f => ({ ...f, [key]: v }))}
                />
              </div>
            ))}
          </div>
        )}

        {/* Filter toggle - only for data cards */}
        {!isDashboard && (
          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              width: 18, flexShrink: 0, background: '#f5f5f5',
              border: 'none', borderRight: '1px solid #e8e8e8',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#888', fontSize: 13,
            }}
          >
            {filterOpen ? '‹' : '›'}
          </button>
        )}

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'auto', padding: isDashboard ? 32 : 16, background: '#fafafa' }}>
          {/* Dashboard placeholder */}
          {isDashboard && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '70%', gap: 16,
            }}>
              <BarChartOutlined style={{ fontSize: 72, color: '#1a3877', opacity: 0.12 }} />
              <div style={{ fontWeight: 700, fontSize: 16, color: '#333' }}>{selected.title}</div>
              <div style={{ fontSize: 14, color: '#888', textAlign: 'center', maxWidth: 420 }}>
                Biểu đồ Dashboard đang được phát triển.
                <br />
                Dữ liệu sẽ hiển thị dạng biểu đồ trực quan trong phiên bản tiếp theo.
              </div>
            </div>
          )}

          {/* Data table */}
          {!isDashboard && (
            <>
              {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}

              {!loaded && !loading && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '70%', gap: 16,
                }}>
                  <BarChartOutlined style={{ fontSize: 60, color: '#1a3877', opacity: 0.15 }} />
                  <Text style={{ fontSize: 15, color: '#666' }}>
                    Nhấn <b style={{ color: '#1a3877' }}>"Tải báo cáo"</b> để xem dữ liệu
                  </Text>
                  <Button type="primary" icon={<ReloadOutlined />} onClick={fetchData}
                    style={{ background: '#1a3877', borderColor: '#1a3877' }}>
                    Tải báo cáo ngay
                  </Button>
                </div>
              )}

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50%' }}>
                  <Spin size="large" tip="Đang tải dữ liệu từ DWH..." />
                </div>
              )}

              {!loading && loaded && cardConfig && (
                <Table
                  dataSource={filteredData}
                  columns={cardConfig.columns}
                  rowKey={(_, i) => i}
                  size="small"
                  scroll={{ x: 'max-content', y: 'calc(100vh - 290px)' }}
                  pagination={{
                    pageSize: 100,
                    showSizeChanger: true,
                    pageSizeOptions: [50, 100, 200, 500],
                    showTotal: (total, [from, to]) => `${from.toLocaleString()}–${to.toLocaleString()} / ${total.toLocaleString()} dòng`,
                  }}
                  style={{ background: '#fff' }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
