import { Row, Col, Typography, Card, Alert } from 'antd';
import { getCurrentUser, hasAnyRole } from '../../utils/auth';
import AiChatWidget from '../../components/AiChatWidget';

const { Title, Paragraph } = Typography;

// Trang chu - widget AI hoi-dap (AI-04 Chatbot) chi danh cho NPP/quan ly (ADMIN,
// WAREHOUSE_MANAGER), khong hien cho NVBH (SALES_STAFF) theo dung yeu cau nghiep vu.
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
        <Row gutter={16}>
          <Col xs={24} lg={14}>
            <AiChatWidget />
          </Col>
          <Col xs={24} lg={10}>
            <Card title="Gợi ý sử dụng" style={{ marginBottom: 16 }}>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                <li>Hỏi trực tiếp bằng tiếng Việt tự nhiên, không cần đúng cú pháp.</li>
                <li>Mọi số liệu trả lời đều lấy trực tiếp từ Data Warehouse, cập nhật theo dữ liệu ETL gần nhất.</li>
                <li>Chatbot chỉ trả lời các câu hỏi nghiệp vụ: doanh thu, sản phẩm, tồn kho, nhập hàng, nhà cung cấp.</li>
              </ul>
            </Card>
          </Col>
        </Row>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Tính năng hỏi đáp AI dành cho Quản lý/Nhà phân phối"
          description="Tài khoản của bạn hiện chưa được cấp quyền sử dụng trợ lý AI trên trang chủ."
        />
      )}
    </div>
  );
}
