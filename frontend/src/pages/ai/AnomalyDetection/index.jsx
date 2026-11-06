import { useEffect, useState } from 'react';
import { Typography, Table, Tag, DatePicker, Button, Space, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchAnomalies } from '../../../api/aiClient';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// AI-03 Anomaly Detection (ai-services/anomaly-detection, port 8003) - phat hien bien dong bat
// thuong trong nhap/xuat/dieu chinh ton kho bang thong ke IQR tu xay dung tren Data Warehouse.
const TYPE_LABEL = { IN: 'Nhập kho', OUT: 'Xuất kho', ADJUST: 'Điều chỉnh kiểm kê' };
const TYPE_COLOR = { IN: 'blue', OUT: 'purple', ADJUST: 'orange' };
const SEVERITY_COLOR = { HIGH: 'red', MEDIUM: 'gold' };
const SEVERITY_LABEL = { HIGH: 'Bất thường mạnh', MEDIUM: 'Bất thường nhẹ' };

export default function AnomalyDetectionPage() {
  const [range, setRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadAnomalies() {
    if (!range || range.length !== 2) return;
    setLoading(true);
    fetchAnomalies(range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD'))
      .then((data) => setRows(data))
      .catch((err) => message.error(err.response?.data?.detail?.[0]?.msg || 'Không tải được dữ liệu - kiểm tra service Anomaly Detection (port 8003) đã chạy chưa'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAnomalies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { title: 'Ngày', dataIndex: 'date', key: 'date', sorter: (a, b) => a.date.localeCompare(b.date), defaultSortOrder: 'descend' },
    { title: 'Mã sản phẩm (ID)', dataIndex: 'productId', key: 'productId' },
    {
      title: 'Loại giao dịch', dataIndex: 'type', key: 'type',
      render: (v) => <Tag color={TYPE_COLOR[v] || 'default'}>{TYPE_LABEL[v] || v}</Tag>,
      filters: Object.keys(TYPE_LABEL).map((v) => ({ text: TYPE_LABEL[v], value: v })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Số lượng thực tế', dataIndex: 'quantity', key: 'quantity', align: 'right',
      render: (v) => <Text strong>{Number(v).toLocaleString('vi-VN')}</Text>,
    },
    {
      title: 'Khoảng bình thường', dataIndex: 'expectedRange', key: 'expectedRange',
      render: (v) => `${Number(v[0]).toLocaleString('vi-VN')} – ${Number(v[1]).toLocaleString('vi-VN')}`,
    },
    {
      title: 'Mức độ', dataIndex: 'severity', key: 'severity',
      render: (v) => <Tag color={SEVERITY_COLOR[v] || 'default'}>{SEVERITY_LABEL[v] || v}</Tag>,
      filters: Object.keys(SEVERITY_LABEL).map((v) => ({ text: SEVERITY_LABEL[v], value: v })),
      onFilter: (value, record) => record.severity === value,
    },
  ];

  return (
    <div>
      <Title level={3}>Phát hiện bất thường (AI)</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        So sánh biến động nhập/xuất/điều chỉnh tồn kho mỗi ngày với khoảng "bình thường" tính từ
        lịch sử (thống kê tứ phân vị IQR) - xem ai-services/anomaly-detection.
      </Text>

      <Space style={{ marginBottom: 16 }}>
        <RangePicker value={range} onChange={setRange} allowClear={false} />
        <Button type="primary" icon={<ReloadOutlined />} onClick={loadAnomalies}>Kiểm tra</Button>
      </Space>

      <Table
        rowKey={(r) => `${r.date}-${r.productId}-${r.type}`}
        columns={columns}
        dataSource={rows}
        loading={loading}
        locale={{ emptyText: 'Không phát hiện bất thường nào trong khoảng ngày đã chọn' }}
      />
    </div>
  );
}
