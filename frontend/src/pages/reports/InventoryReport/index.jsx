import { useState, useMemo, useCallback } from 'react';
import {
  Button, Select, Typography, Tag, Spin, Alert, Table, Space, Badge, Divider,
} from 'antd';
import {
  ArrowLeftOutlined, ReloadOutlined, FilterOutlined, AppstoreOutlined,
  InboxOutlined, SwapOutlined, DownloadOutlined, BarChartOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const REPORTS_URL = import.meta.env.VITE_REPORTS_URL || 'http://localhost:8005';

const fmtDate = (v) => (v ? String(v).slice(0, 10) : '—');
const fmtNum  = (v) => (v == null ? '—' : Number(v).toLocaleString('vi-VN'));
const fmtCur  = (v) => (v == null ? '—' : Number(v).toLocaleString('vi-VN', { minimumFractionDigits: 0 }));

// ─── card configs ──────────────────────────────────────────────────────────
const CARD_CONFIGS = {
  ton_kho_hien_tai: {
    endpoint: '/reports/tonkho',
    columns: [
      { dataIndex: 'snapshot_date',      title: 'Ngày snapshot',  width: 115, render: fmtDate },
      { dataIndex: 'product_code',       title: 'Mã SP',          width: 90,  ellipsis: true },
      { dataIndex: 'product_name',       title: 'Tên SP',         width: 220, ellipsis: true },
      { dataIndex: 'category_name',      title: 'Danh mục',       width: 130, ellipsis: true },
      { dataIndex: 'parent_category_name', title: 'Ngành hàng',   width: 130, ellipsis: true },
      { dataIndex: 'warehouse_code',     title: 'Mã kho',         width: 90,  ellipsis: true },
      { dataIndex: 'warehouse_name',     title: 'Tên kho',        width: 180, ellipsis: true },
      { dataIndex: 'warehouse_type',     title: 'Loại kho',       width: 90,  ellipsis: true },
      { dataIndex: 'branch_name',        title: 'Chi nhánh',      width: 160, ellipsis: true },
      { dataIndex: 'quantity_on_hand',   title: 'Tồn kho (SL)',   width: 115, align: 'right', render: fmtNum },
      { dataIndex: 'avg_unit_price',     title: 'Đơn giá TB',     width: 120, align: 'right', render: fmtCur },
      { dataIndex: 'inventory_value',    title: 'Giá trị tồn',    width: 140, align: 'right', render: fmtCur },
      { dataIndex: 'stock_status',       title: 'Trạng thái',     width: 110, ellipsis: true },
    ],
    slicers: [
      { key: 'category_name',    label: 'Danh mục SP' },
      { key: 'stock_status',     label: 'Trạng thái tồn' },
      { key: 'warehouse_name',   label: 'Kho' },
      { key: 'warehouse_type',   label: 'Loại kho' },
    ],
  },
  bien_dong_kho: {
    endpoint: '/reports/tonkho-movement',
    columns: [
      { dataIndex: 'txn_date',          title: 'Ngày GD',       width: 100, render: fmtDate },
      { dataIndex: 'txn_type_vn',       title: 'Loại GD',       width: 110, ellipsis: true },
      { dataIndex: 'reference_type_vn', title: 'Loại chứng từ', width: 160, ellipsis: true },
      { dataIndex: 'product_code',      title: 'Mã SP',         width: 90,  ellipsis: true },
      { dataIndex: 'product_name',      title: 'Tên SP',        width: 220, ellipsis: true },
      { dataIndex: 'category_name',     title: 'Danh mục',      width: 130, ellipsis: true },
      { dataIndex: 'warehouse_code',    title: 'Mã kho',        width: 90,  ellipsis: true },
      { dataIndex: 'warehouse_name',    title: 'Tên kho',       width: 180, ellipsis: true },
      { dataIndex: 'warehouse_type',    title: 'Loại kho',      width: 90,  ellipsis: true },
      { dataIndex: 'quantity',          title: 'Số lượng',      width: 110, align: 'right', render: fmtNum },
    ],
    slicers: [
      { key: 'reference_type_vn', label: 'Loại chứng từ' },
      { key: 'txn_type_vn',       label: 'Loại giao dịch' },
      { key: 'warehouse_name',    label: 'Kho' },
    ],
  },
  nhap_kho: {
    endpoint: '/reports/tonkho-movement',
    preFilter: (r) => {
      const t = (r.txn_type_vn || '').toLowerCase();
      return t.includes('nhap') || t.includes('nhập');
    },
    columns: [
      { dataIndex: 'txn_date',          title: 'Ngày nhập',     width: 100, render: fmtDate },
      { dataIndex: 'reference_type_vn', title: 'Loại chứng từ', width: 160, ellipsis: true },
      { dataIndex: 'product_code',      title: 'Mã SP',         width: 90,  ellipsis: true },
      { dataIndex: 'product_name',      title: 'Tên SP',        width: 220, ellipsis: true },
      { dataIndex: 'category_name',     title: 'Danh mục',      width: 130, ellipsis: true },
      { dataIndex: 'warehouse_code',    title: 'Mã kho',        width: 90,  ellipsis: true },
      { dataIndex: 'warehouse_name',    title: 'Tên kho',       width: 180, ellipsis: true },
      { dataIndex: 'quantity',          title: 'Số lượng',      width: 110, align: 'right', render: fmtNum },
    ],
    slicers: [
      { key: 'product_name',      label: 'Sản phẩm' },
      { key: 'warehouse_name',    label: 'Kho' },
      { key: 'reference_type_vn', label: 'Loại chứng từ' },
    ],
  },
};

const DASHBOARD_IDS = new Set(['dashboard_tonkho']);

const REPORT_CARDS = [
  {
    id: 'dashboard_tonkho',
    title: 'DASHBOARD TỒN KHO',
    tag: 'Dashboard',
    icon: <BarChartOutlined style={{ fontSize: 28 }} />,
    color: '#1677ff',
    desc: 'Tổng quan tình hình tồn kho: giá trị, số lượng, trạng thái theo kho và danh mục',
  },
  {
    id: 'ton_kho_hien_tai',
    title: '5.2.1 TỒN KHO HIỆN TẠI',
    tag: 'Tồn kho',
    icon: <InboxOutlined style={{ fontSize: 28 }} />,
    color: '#52c41a',
    desc: 'Tồn kho hiện tại theo sản phẩm, kho, danh mục và trạng thái tồn',
  },
  {
    id: 'bien_dong_kho',
    title: '5.2.2 BIẾN ĐỘNG KHO',
    tag: 'Biến động',
    icon: <SwapOutlined style={{ fontSize: 28 }} />,
    color: '#fa8c16',
    desc: 'Lịch sử nhập / xuất / chuyển kho theo sản phẩm và loại giao dịch',
  },
  {
    id: 'nhap_kho',
    title: '5.2.3 NHẬP KHO',
    tag: 'Biến động',
    icon: <DownloadOutlined style={{ fontSize: 28 }} />,
    color: '#13c2c2',
    desc: 'Chi tiết các phiếu nhập kho theo sản phẩm, kho và loại chứng từ',
  },
];

// ─── main component ────────────────────────────────────────────────────────
export default function InventoryReportPage() {
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [filterOpen, setFilterOpen] = useState(true);

  // Data cache: keyed by endpoint to avoid re-fetching when switching cards
  // that share the same endpoint (bien_dong_kho and nhap_kho both use tonkho-movement)
  const [dataCache, setDataCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  const [filters, setFilters] = useState({});

  const cardConfig = selected ? CARD_CONFIGS[selected.id] : null;

  const fetchData = useCallback(async (endpoint) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${REPORTS_URL}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setDataCache((prev) => ({ ...prev, [endpoint]: json.rows || [] }));
      setFetchedAt(new Date());
      setLoaded(true);
    } catch (e) {
      setError('Không lấy được dữ liệu: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openReport = (card) => {
    setSelected(card);
    setFilters({});
    setError(null);
    const cfg = CARD_CONFIGS[card.id];
    if (cfg) {
      const cached = dataCache[cfg.endpoint];
      setLoaded(!!cached);
    } else {
      setLoaded(false);
    }
    setView('detail');
  };

  const handleLoad = () => {
    if (!cardConfig) return;
    fetchData(cardConfig.endpoint);
  };

  const handleRefresh = () => {
    if (!cardConfig) return;
    setDataCache((prev) => {
      const next = { ...prev };
      delete next[cardConfig.endpoint];
      return next;
    });
    setLoaded(false);
    fetchData(cardConfig.endpoint);
  };

  const rawData = cardConfig ? (dataCache[cardConfig.endpoint] || []) : [];

  // Apply preFilter (nhap_kho: only Nhap kho rows)
  const baseData = useMemo(() => {
    if (!cardConfig?.preFilter) return rawData;
    return rawData.filter(cardConfig.preFilter);
  }, [rawData, cardConfig]);

  // Apply user-selected filters
  const filteredData = useMemo(() => {
    if (!cardConfig) return [];
    return baseData.filter((row) => {
      for (const { key } of cardConfig.slicers) {
        const sel = filters[key];
        if (sel && sel.length > 0 && !sel.includes(row[key])) return false;
      }
      return true;
    });
  }, [baseData, cardConfig, filters]);

  // Build slicer options from baseData
  const slicerOpts = useMemo(() => {
    if (!cardConfig) return {};
    const result = {};
    for (const { key } of cardConfig.slicers) {
      const vals = [...new Set(baseData.map((r) => r[key]).filter((v) => v != null))].sort((a, b) =>
        String(a).localeCompare(String(b), 'vi')
      );
      result[key] = vals.map((v) => ({ label: String(v), value: v }));
    }
    return result;
  }, [baseData, cardConfig]);

  const activeFiltersCount = Object.values(filters).filter((v) => v && v.length > 0).length;

  // ── list view ─────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div style={{ padding: '24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>Báo cáo Tồn kho</Title>
          <Text type="secondary">Chọn báo cáo để xem chi tiết</Text>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {REPORT_CARDS.map((card) => (
            <div
              key={card.id}
              onClick={() => openReport(card)}
              style={{
                background: '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                padding: '24px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.12)`;
                e.currentTarget.style.borderColor = card.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ color: card.color, marginBottom: 12 }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.4 }}>
                {card.title}
              </div>
              <Tag color={card.color} style={{ marginBottom: 10, fontSize: 11 }}>
                {card.tag}
              </Tag>
              <div style={{ color: '#666', fontSize: 12, lineHeight: 1.6 }}>{card.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── detail view ───────────────────────────────────────────────────────────
  const isDashboard = selected && DASHBOARD_IDS.has(selected.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* header bar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff', flexShrink: 0,
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={() => setView('list')} size="small">
          Danh sách BC
        </Button>
        <Divider type="vertical" />
        <div style={{ color: selected?.color, fontSize: 16 }}>{selected?.icon}</div>
        <Title level={5} style={{ margin: 0, flex: 1 }}>{selected?.title}</Title>
        {loaded && (
          <>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {filteredData.length.toLocaleString('vi-VN')} / {baseData.length.toLocaleString('vi-VN')} dòng
              {fetchedAt && ` · ${fetchedAt.toLocaleTimeString('vi-VN')}`}
            </Text>
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={handleRefresh}
              loading={loading}
            >
              Làm mới
            </Button>
          </>
        )}
        {!isDashboard && (
          <Button
            icon={<FilterOutlined />}
            size="small"
            onClick={() => setFilterOpen((p) => !p)}
            type={filterOpen ? 'primary' : 'default'}
          >
            Bộ lọc{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
          </Button>
        )}
      </div>

      {/* body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* filter panel */}
        {!isDashboard && filterOpen && (
          <div
            style={{
              width: 220, flexShrink: 0,
              borderRight: '1px solid #f0f0f0',
              padding: '16px 14px',
              overflowY: 'auto',
              background: '#fafafa',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ fontSize: 12 }}>BỘ LỌC</Text>
              {activeFiltersCount > 0 && (
                <Button
                  size="small"
                  type="link"
                  style={{ padding: 0, fontSize: 11 }}
                  onClick={() => setFilters({})}
                >
                  Xóa tất cả
                </Button>
              )}
            </div>

            {!loaded ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tải dữ liệu trước để dùng bộ lọc
              </Text>
            ) : (
              cardConfig?.slicers.map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                    {label}
                    {filters[key]?.length > 0 && (
                      <Badge count={filters[key].length} style={{ marginLeft: 6, fontSize: 10 }} />
                    )}
                  </div>
                  <Select
                    mode="multiple"
                    allowClear
                    size="small"
                    placeholder="Tất cả"
                    style={{ width: '100%' }}
                    options={slicerOpts[key] || []}
                    value={filters[key] || []}
                    onChange={(val) => setFilters((prev) => ({ ...prev, [key]: val }))}
                    maxTagCount={1}
                    showSearch
                    filterOption={(input, opt) =>
                      (opt?.label || '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* data area */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
          {error && (
            <Alert
              type="error"
              message={error}
              action={<Button size="small" onClick={handleLoad}>Thử lại</Button>}
              style={{ marginBottom: 12 }}
              showIcon
            />
          )}

          {isDashboard ? (
            <div
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f5f5f5', borderRadius: 8, color: '#999',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <BarChartOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 600 }}>Biểu đồ Dashboard đang được phát triển</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  Dashboard tổng quan tồn kho sẽ hiển thị ở đây
                </div>
              </div>
            </div>
          ) : !loaded ? (
            <div
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
              }}
            >
              {loading ? (
                <Spin tip="Đang tải dữ liệu..." />
              ) : (
                <>
                  <AppstoreOutlined style={{ fontSize: 40, color: '#bbb' }} />
                  <Text type="secondary">Nhấn để tải dữ liệu báo cáo</Text>
                  <Button type="primary" onClick={handleLoad} loading={loading}>
                    Tải báo cáo
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Table
              dataSource={filteredData}
              columns={cardConfig?.columns || []}
              rowKey={(r, i) => i}
              size="small"
              scroll={{ x: 'max-content', y: 'calc(100vh - 290px)' }}
              pagination={{ pageSize: 100, showSizeChanger: true, pageSizeOptions: [50, 100, 200], showTotal: (t) => `Tổng ${t.toLocaleString('vi-VN')} dòng` }}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
