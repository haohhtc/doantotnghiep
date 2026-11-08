import { Row, Col, Typography, Space, Alert } from 'antd';
import { getCurrentUser, hasAnyRole } from '../../utils/auth';
import AiChatWidget from '../../components/AiChatWidget';
import StockRiskWidget from '../../components/StockRiskWidget';
import AnomalyWidget from '../../components/AnomalyWidget';

const { Title, Paragraph } = Typography;

// Trang chu - gom ca 3 tinh nang AI (Chatbot hoi-dap, Canh bao ton kho AI-02, Phat hien bat
// thuong AI-03) de NPP/quan ly dung ngay khi vao trang, khong phai di tim trong menu. Chi danh
// cho ADMIN/WAREHOUSE_MANAGER, khong hien cho NVBH (SALES_STAFF) theo dung yeu cau nghiep vu.
export default function Home() {
  const user = getCurrentUser();
  const canUseAi = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

  return (
    <div>
      <Title level={3}>Chào {user?.fullName || user?.username || 'bạn'} 👋</Title>
      <Paragraph type="secondary">
        Tổng quan hệ thống quản lý kho ERPQLKHO.
      </Paragraph>

      {canUseAi ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <AiChatWidget />
          </Col>
          <Col xs={24} lg={10}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <StockRiskWidget />
              <AnomalyWidget />
            </Space>
          </Col>
        </Row>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Tính năng AI dành cho Quản lý/Nhà phân phối"
          description="Tài khoản của bạn hiện chưa được cấp quyền sử dụng các tính năng AI trên trang chủ."
        />
      )}
    </div>
  );
}
