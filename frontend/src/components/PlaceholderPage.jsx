import { Typography, Alert } from 'antd';

const { Title } = Typography;

// Trang tam thoi cho moi module - thay bang UI that (Table/Form Ant Design) khi code.
export default function PlaceholderPage({ title }) {
  return (
    <div>
      <Title level={3}>{title}</Title>
      <Alert type="info" showIcon message="Chưa code UI thật - xem ui-reference/ để làm theo giao diện tham khảo." />
    </div>
  );
}
