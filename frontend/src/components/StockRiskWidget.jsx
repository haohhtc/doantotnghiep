import { useEffect, useState } from 'react';
import { Card, List, Tag, Spin, Alert, Typography, Space, Statistic, Row, Col } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { fetchStockRisk } from '../api/aiClient';
import { useBranch } from '../contexts/BranchContext';

const { Text } = Typography;

// Widget tom tat AI-02 Stock Risk tren trang chu - goi thang ai-services/stock-risk (:8002),
// LOC THEO CHI NHANH dang chon o BranchSelector (header) de khop voi nhung gi nguoi dung dang
// xem o cac trang khac - tranh tinh trang cong don TOAN HE THONG lam loang mat tin hieu rui ro
// that cua rieng chi nhanh do. Xem chi tiet day du + tu chon kho khac o trang /ai/stock-risk.
const RISK_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, UNKNOWN: 3 };
const RISK_COLOR = { HIGH: 'red', MEDIUM: 'gold', LOW: 'green', UNKNOWN: 'default' };
const RISK_LABEL = { HIGH: 'Nguy cơ cao', MEDIUM: 'Cần theo dõi', LOW: 'Ổn định', UNKNOWN: 'Chưa rõ' };

export default function StockRiskWidget() {
  const { selectedBranch } = useBranch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceDown, setServiceDown] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchStockRisk(undefined, selectedBranch?.code)
      .then((data) => {
        setServiceDown(false);
        setRows(data);
      })
      .catch(() => setServiceDown(true))
      .finally(() => setLoading(false));
  }, [selectedBranch?.code]);

  const top = [...rows]
    .filter((r) => r.riskLevel === 'HIGH' || r.riskLevel === 'MEDIUM')
    .sort((a, b) => (RISK_ORDER[a.riskLevel] ?? 3) - (RISK_ORDER[b.riskLevel] ?? 3) || b.suggestedReorderQty - a.suggestedReorderQty)
    .slice(0, 5);
  const highCount = rows.filter((r) => r.riskLevel === 'HIGH').length;
  const mediumCount = rows.filter((r) => r.riskLevel === 'MEDIUM').length;
  const lowCount = rows.filter((r) => r.riskLevel === 'LOW').length;

  return (
    <Card
      title={<Space><WarningOutlined /> Cảnh báo tồn kho (AI)</Space>}
      extra={<Link to="/ai/stock-risk">Xem tất cả</Link>}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
        Kho chính - {selectedBranch ? `${selectedBranch.code} ${selectedBranch.name}` : 'tất cả chi nhánh'}
      </Text>
      {serviceDown && (
        <Alert type="warning" showIcon message="Không kết nối được dịch vụ Stock Risk (cổng 8002)." style={{ marginBottom: 12 }} />
      )}
      {loading ? (
        <Spin />
      ) : (
        <>
          <Row gutter={8} style={{ marginBottom: 12 }}>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', background: '#fff1f0', borderColor: '#ffccc7' }}>
                <Statistic value={highCount} valueStyle={{ color: '#cf1322', fontSize: 24 }} />
                <Text style={{ fontSize: 11 }} type="secondary">Nguy cơ cao</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', background: '#fffbe6', borderColor: '#ffe58f' }}>
                <Statistic value={mediumCount} valueStyle={{ color: '#ad6800', fontSize: 24 }} />
                <Text style={{ fontSize: 11 }} type="secondary">Cần theo dõi</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" style={{ textAlign: 'center', background: '#f6ffed', borderColor: '#b7eb8f' }}>
                <Statistic value={lowCount} valueStyle={{ color: '#389e0d', fontSize: 24 }} />
                <Text style={{ fontSize: 11 }} type="secondary">Ổn định</Text>
              </Card>
            </Col>
          </Row>

          {highCount === 0 && mediumCount === 0 ? (
            <Alert type="success" showIcon message="Tất cả sản phẩm đang ở mức tồn kho ổn định" />
          ) : (
            <List
              size="small"
              dataSource={top}
              locale={{ emptyText: 'Chưa có dữ liệu tồn kho' }}
              renderItem={(r) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8 }}>
                    <Text ellipsis style={{ maxWidth: 200 }} title={r.productName}>
                      <b>{r.productCode}</b> - {r.productName}
                    </Text>
                    <Tag color={RISK_COLOR[r.riskLevel]}>{RISK_LABEL[r.riskLevel] || r.riskLevel}</Tag>
                  </div>
                </List.Item>
              )}
            />
          )}
        </>
      )}
    </Card>
  );
}
