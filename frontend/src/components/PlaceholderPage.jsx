import { Typography, Alert } from 'antd';

const { Title } = Typography;

// Trang tam thoi cho moi module - thay bang UI that (Table/Form Ant Design) khi code.
export default function PlaceholderPage({ title }) {
  return (
    <div>
      <Title level={3}>{title}</Title>
      <Alert type="info" showIcon message="Chua code UI that - xem ui-reference/ de lam theo giao dien tham khao." />
    </div>
  );
}
