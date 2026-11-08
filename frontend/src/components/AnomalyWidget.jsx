import { useEffect, useState } from 'react';
import { Card, List, Tag, Spin, Alert, Typography, Space } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchAnomalies } from '../api/aiClient';

const { Text } = Typography;

// Widget tom tat AI-03 Anomaly Detection tren trang chu - goi thang
// ai-services/anomaly-detection (:8003), quet 7 ngay gan nhat. Xem chi tiet day du + tu chon
// khoang ngay o trang /ai/anomalies (nut "Xem tat ca").
const TYPE_LABEL = { IN: 'Nhập', OUT: 'Xuất', ADJUST: 'Điều chỉnh' };
const TYPE_COLOR = { IN: 'blue', OUT: 'purple', ADJUST: 'orange' };
const SEVERITY_COLOR = { HIGH: 'red', MEDIUM: 'gold' };
const SEVERITY_LABEL = { HIGH: 'Mạnh', MEDIUM: 'Nhẹ' };

export default function AnomalyWidget() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceDown, setServiceDown] = useState(false);

  useEffect(() => {
    const to = dayjs();
    const from = to.subtract(7, 'day');
    fetchAnomalies(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'))
      .then((data) => {
        setServiceDown(false);
        setRows(data);
      })
      .catch(() => setServiceDown(true))
      .finally(() => setLoading(false));
  }, []);

  const top = [...rows]
    .sort((a, b) => (a.severity === b.severity ? b.date.localeCompare(a.date) : a.severity === 'HIGH' ? -1 : 1))
    .slice(0, 5);

  return (
    <Card
      title={<Space><AlertOutlined /> Bất thường gần đây - 7 ngày (AI)</Space>}
      extra={<Link to="/ai/anomalies">Xem tất cả</Link>}
    >
      {serviceDown && (
        <Alert type="warning" showIcon message="Không kết nối được dịch vụ Anomaly Detection (cổng 8003)." style={{ marginBottom: 12 }} />
      )}
      {loading ? (
        <Spin />
      ) : (
        <List
          size="small"
          dataSource={top}
          locale={{ emptyText: 'Không phát hiện bất thường nào trong 7 ngày qua' }}
          renderItem={(r) => (
            <List.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8 }}>
                <Text>{r.date} · SP #{r.productId}</Text>
                <Space size={4}>
                  <Tag color={TYPE_COLOR[r.type]}>{TYPE_LABEL[r.type] || r.type}</Tag>
                  <Tag color={SEVERITY_COLOR[r.severity]}>{SEVERITY_LABEL[r.severity] || r.severity}</Tag>
                </Space>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
