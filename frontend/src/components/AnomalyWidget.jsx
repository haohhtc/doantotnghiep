import { useEffect, useState } from 'react';
import { Card, List, Tag, Spin, Alert, Typography, Space, Badge } from 'antd';
import { AlertOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchAnomalies } from '../api/aiClient';
import { useBranch } from '../contexts/BranchContext';

const { Text } = Typography;

// Widget tom tat AI-03 Anomaly Detection tren trang chu - goi thang
// ai-services/anomaly-detection (:8003), quet 7 ngay gan nhat, LOC THEO CHI NHANH dang chon o
// BranchSelector (khop voi Stock Risk widget canh ben va voi nhung gi nguoi dung dang xem o
// cac trang khac). Xem chi tiet day du + tu chon khoang ngay o trang /ai/anomalies.
const TYPE_LABEL = { IN: 'Nhập', OUT: 'Xuất', ADJUST: 'Điều chỉnh' };
const TYPE_COLOR = { IN: 'blue', OUT: 'purple', ADJUST: 'orange' };
const SEVERITY_COLOR = { HIGH: 'red', MEDIUM: 'gold' };
const SEVERITY_LABEL = { HIGH: 'Mạnh', MEDIUM: 'Nhẹ' };

export default function AnomalyWidget() {
  const { selectedBranch } = useBranch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceDown, setServiceDown] = useState(false);

  useEffect(() => {
    setLoading(true);
    const to = dayjs();
    const from = to.subtract(7, 'day');
    fetchAnomalies(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'), selectedBranch?.code)
      .then((data) => {
        setServiceDown(false);
        setRows(data);
      })
      .catch(() => setServiceDown(true))
      .finally(() => setLoading(false));
  }, [selectedBranch?.code]);

  const top = [...rows]
    .sort((a, b) => (a.severity === b.severity ? b.date.localeCompare(a.date) : a.severity === 'HIGH' ? -1 : 1))
    .slice(0, 5);
  const highCount = rows.filter((r) => r.severity === 'HIGH').length;

  return (
    <Card
      title={
        <Space>
          <AlertOutlined /> Bất thường gần đây - 7 ngày (AI)
          {highCount > 0 && <Badge count={highCount} />}
        </Space>
      }
      extra={<Link to="/ai/anomalies">Xem tất cả</Link>}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        {selectedBranch ? `${selectedBranch.code} - ${selectedBranch.name}` : 'Tất cả chi nhánh'}
      </Text>
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
                <Text ellipsis style={{ maxWidth: 200 }} title={r.productName}>
                  {r.date.slice(5)} · <b>{r.productCode || `SP #${r.productId}`}</b>
                </Text>
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
