import { useEffect, useState } from 'react';
import { Card, List, Tag, Spin, Alert, Typography, Space } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { fetchStockRisk } from '../api/aiClient';

const { Text } = Typography;

// Widget tom tat AI-02 Stock Risk tren trang chu - goi thang ai-services/stock-risk (:8002).
// Chi hien Top 5 san pham nguy co cao nhat (HIGH truoc, roi toi MEDIUM) - xem chi tiet day du +
// loc theo kho o trang /ai/stock-risk (nut "Xem tat ca").
const RISK_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, UNKNOWN: 3 };
const RISK_COLOR = { HIGH: 'red', MEDIUM: 'gold', LOW: 'green', UNKNOWN: 'default' };
const RISK_LABEL = { HIGH: 'Nguy cơ cao', MEDIUM: 'Cần theo dõi', LOW: 'Ổn định', UNKNOWN: 'Chưa rõ' };

export default function StockRiskWidget() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceDown, setServiceDown] = useState(false);

  useEffect(() => {
    fetchStockRisk()
      .then((data) => {
        setServiceDown(false);
        setRows(data);
      })
      .catch(() => setServiceDown(true))
      .finally(() => setLoading(false));
  }, []);

  const top = [...rows]
    .sort((a, b) => (RISK_ORDER[a.riskLevel] ?? 3) - (RISK_ORDER[b.riskLevel] ?? 3) || b.suggestedReorderQty - a.suggestedReorderQty)
    .slice(0, 5);
  const highCount = rows.filter((r) => r.riskLevel === 'HIGH').length;

  return (
    <Card
      title={<Space><WarningOutlined /> Cảnh báo tồn kho (AI)</Space>}
      extra={<Link to="/ai/stock-risk">Xem tất cả</Link>}
    >
      {serviceDown && (
        <Alert type="warning" showIcon message="Không kết nối được dịch vụ Stock Risk (cổng 8002)." style={{ marginBottom: 12 }} />
      )}
      {loading ? (
        <Spin />
      ) : (
        <>
          {highCount > 0 && (
            <Alert
              type="error"
              showIcon
              message={`${highCount} sản phẩm đang ở mức nguy cơ hết hàng cao - cần nhập thêm sớm`}
              style={{ marginBottom: 12 }}
            />
          )}
          <List
            size="small"
            dataSource={top}
            locale={{ emptyText: 'Chưa có dữ liệu tồn kho' }}
            renderItem={(r) => (
              <List.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8 }}>
                  <Text ellipsis style={{ maxWidth: 220 }} title={r.productName}>
                    {r.productCode} - {r.productName}
                  </Text>
                  <Tag color={RISK_COLOR[r.riskLevel]}>{RISK_LABEL[r.riskLevel] || r.riskLevel}</Tag>
                </div>
              </List.Item>
            )}
          />
        </>
      )}
    </Card>
  );
}
