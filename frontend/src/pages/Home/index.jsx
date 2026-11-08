import { Row, Col, Typography, Alert } from 'antd';
import { getCurrentUser, hasAnyRole } from '../../utils/auth';
import AiChatWidget from '../../components/AiChatWidget';
import StockRiskWidget from '../../components/StockRiskWidget';
import AnomalyWidget from '../../components/AnomalyWidget';

const { Title, Paragraph } = Typography;

// Trang chu - gom ca 3 tinh nang AI (Chatbot hoi-dap, Canh bao ton kho AI-02, Phat hien bat
// thuong AI-03) de NPP/quan ly dung ngay khi vao trang, khong phai di tim trong menu. Chi danh
// cho ADMIN/WAREHOUSE_MANAGER, khong hien cho NVBH (SALES_STAFF) theo dung yeu cau nghiep vu.
//
// Bo cuc: 2 widget canh bao (du lieu quan trong, can thay NGAY khi vao trang) dat o HANG TREN
// CUNG, canh nhau de de so sanh; Chatbot (cong cu tuong tac, nguoi dung chu dong hoi khi can)
// dat hang duoi, rong het chieu ngang - tranh bi "chim" ben canh chatbot nhu bo cuc cu.
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
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              <StockRiskWidget />
            </Col>
            <Col xs={24} lg={12}>
              <AnomalyWidget />
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <AiChatWidget />
            </Col>
          </Row>
        </>
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
