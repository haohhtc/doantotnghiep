import { useEffect, useState } from 'react';
import { Typography, Table, Tag, Select, Button, Space, Modal, Radio, Empty, message } from 'antd';
import { ReloadOutlined, LineChartOutlined } from '@ant-design/icons';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import axiosClient from '../../../api/axiosClient';
import { fetchStockRisk, fetchForecast } from '../../../api/aiClient';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;

// AI-02 Stock Risk (ai-services/stock-risk, port 8002) - ket hop ton kho that trong DW voi du
// bao AI-01 (ai-services/forecasting, port 8001) de xep loai nguy co het hang. Xem trang nay la
// giao dien cho 2 service AI tu xay dung, khong phai mock - xem AI-SERVICES-README.
const RISK_COLOR = { HIGH: 'red', MEDIUM: 'gold', LOW: 'green', UNKNOWN: 'default' };
const RISK_LABEL = { HIGH: 'Nguy cơ cao', MEDIUM: 'Cần theo dõi', LOW: 'Ổn định', UNKNOWN: 'Chưa rõ' };
// Gia tri rieng cho lua chon "toan he thong" trong dropdown kho - tach biet voi trang thai
// chua-xac-dinh (undefined) dung truoc khi co mac dinh theo chi nhanh, tranh nham lan giua
// "chua chon gi (dang cho default)" va "nguoi dung CHU DONG chon xem toan he thong".
const ALL_SYSTEM = '__ALL__';
const HORIZON_OPTIONS = [
  { label: '7 ngày', value: 7 },
  { label: '14 ngày', value: 14 },
  { label: '30 ngày', value: 30 },
];

export default function StockRiskPage() {
  const { selectedBranch, loading: branchLoading } = useBranch();
  const [rows, setRows] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState(undefined);
  const [defaulted, setDefaulted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [forecastOpen, setForecastOpen] = useState(false);
  const [forecastProduct, setForecastProduct] = useState(null);
  const [forecastHorizon, setForecastHorizon] = useState(14);
  const [forecastData, setForecastData] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  function loadRisk() {
    setLoading(true);
    fetchStockRisk(warehouseId === ALL_SYSTEM ? undefined : warehouseId)
      .then((data) => setRows(data))
      .catch((err) => message.error(err.response?.data?.detail || 'Không tải được dữ liệu cảnh báo tồn kho - kiểm tra service Stock Risk (port 8002) đã chạy chưa'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    axiosClient.get('/warehouses').then(({ data }) => setWarehouses(data.data)).catch(() => setWarehouses([]));
  }, []);

  // Mac dinh chon kho CHINH (MAIN) cua chi nhanh dang duoc chon o BranchSelector (header) - khop
  // voi widget o trang chu, thay vi mac dinh cong don TOAN HE THONG lam loang tin hieu rui ro. Chi
  // chay 1 LAN khi da co du ca danh sach kho lan chi nhanh (tranh goi API 2 lan - 1 lan "tat ca
  // kho" truoc khi co context, 1 lan dung kho mac dinh). Nguoi dung van co the tu doi kho khac.
  useEffect(() => {
    if (!defaulted && !branchLoading && warehouses.length) {
      const mainWarehouse = selectedBranch
        ? warehouses.find((w) => w.branch?.code === selectedBranch.code && w.warehouseType === 'MAIN')
        : null;
      setWarehouseId(mainWarehouse ? mainWarehouse.id : ALL_SYSTEM);
      setDefaulted(true);
    }
  }, [defaulted, branchLoading, selectedBranch, warehouses]);

  useEffect(() => {
    if (defaulted) loadRisk();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, defaulted]);

  function openForecast(record, horizon = forecastHorizon) {
    setForecastProduct(record);
    setForecastOpen(true);
    setForecastLoading(true);
    fetchForecast(record.productId, horizon)
      .then((data) => setForecastData(data.predictions.map((p) => ({ date: p.date.slice(5), quantity: p.quantity }))))
      .catch(() => message.error('Không tải được dự báo - kiểm tra service Forecasting (port 8001) đã chạy chưa'))
      .finally(() => setForecastLoading(false));
  }

  function handleHorizonChange(value) {
    setForecastHorizon(value);
    if (forecastProduct) openForecast(forecastProduct, value);
  }

  const warehouseOptions = [
    { value: ALL_SYSTEM, label: 'Tất cả kho (toàn hệ thống)' },
    ...warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` })),
  ];

  const columns = [
    { title: 'Mã SP', dataIndex: 'productCode', key: 'productCode' },
    { title: 'Tên sản phẩm', dataIndex: 'productName', key: 'productName' },
    {
      title: 'Tồn hiện tại', dataIndex: 'currentStock', key: 'currentStock', align: 'right',
      render: (v) => Number(v).toLocaleString('vi-VN'),
    },
    {
      title: 'Dự báo nhu cầu (14 ngày)', dataIndex: 'forecastDemand', key: 'forecastDemand', align: 'right',
      render: (v) => (v == null ? '-' : Number(v).toLocaleString('vi-VN')),
    },
    {
      title: 'Mức nguy cơ', dataIndex: 'riskLevel', key: 'riskLevel',
      render: (v) => <Tag color={RISK_COLOR[v] || 'default'}>{RISK_LABEL[v] || v}</Tag>,
      filters: ['HIGH', 'MEDIUM', 'LOW'].map((v) => ({ text: RISK_LABEL[v], value: v })),
      onFilter: (value, record) => record.riskLevel === value,
    },
    {
      title: 'Đề xuất nhập thêm', dataIndex: 'suggestedReorderQty', key: 'suggestedReorderQty', align: 'right',
      render: (v) => (v > 0 ? <Text strong type="danger">{Number(v).toLocaleString('vi-VN')}</Text> : '-'),
      sorter: (a, b) => a.suggestedReorderQty - b.suggestedReorderQty,
      defaultSortOrder: 'descend',
    },
    {
      title: '', key: 'actions',
      render: (_, record) => (
        <Button size="small" icon={<LineChartOutlined />} onClick={() => openForecast(record)}>
          Xem dự báo
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Cảnh báo tồn kho (AI)</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Kết hợp tồn kho thực tế với dự báo nhu cầu (AI-01 Forecasting) để xếp loại nguy cơ thiếu
        hàng và đề xuất số lượng cần nhập - xem ai-services/stock-risk.
      </Text>

      <Space style={{ marginBottom: 16 }}>
        <Select
          options={warehouseOptions}
          value={warehouseId}
          onChange={setWarehouseId}
          style={{ width: 280 }}
        />
        <Button icon={<ReloadOutlined />} onClick={loadRisk}>Tải lại</Button>
      </Space>

      <Table rowKey="productId" columns={columns} dataSource={rows} loading={loading} />

      <Modal
        title={forecastProduct ? `Dự báo nhu cầu - ${forecastProduct.productCode} ${forecastProduct.productName}` : ''}
        open={forecastOpen}
        onCancel={() => setForecastOpen(false)}
        footer={<Button onClick={() => setForecastOpen(false)}>Đóng</Button>}
        width={700}
        destroyOnHidden
      >
        <Radio.Group
          options={HORIZON_OPTIONS}
          optionType="button"
          value={forecastHorizon}
          onChange={(e) => handleHorizonChange(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        {forecastData.length === 0 ? (
          <Empty description={forecastLoading ? 'Đang tải dự báo...' : 'Chưa có dữ liệu'} />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => Number(v).toLocaleString('vi-VN')} />
              <Line type="monotone" dataKey="quantity" name="SL dự báo" stroke="#1a3877" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        <Text type="secondary" style={{ fontSize: 12 }}>
          * Dự báo bằng Holt-Winters (tự xây dựng, thống kê mùa vụ theo thứ-trong-tuần) trên lịch
          sử bán hàng thật trong Data Warehouse - xem ai-services/forecasting/main.py.
        </Text>
      </Modal>
    </div>
  );
}
