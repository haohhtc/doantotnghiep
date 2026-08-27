import { Button, Card, Form, Input, Typography } from 'antd';

const { Title } = Typography;

// TODO: goi POST /api/auth/login qua axiosClient, luu JWT, redirect ve trang chu.
export default function Login() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 360 }}>
        <Title level={3} style={{ textAlign: 'center' }}>ERP Quan Ly Kho Thong Minh</Title>
        <Form layout="vertical">
          <Form.Item label="Ten dang nhap" name="username">
            <Input placeholder="admin" />
          </Form.Item>
          <Form.Item label="Mat khau" name="password">
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Dang nhap
          </Button>
        </Form>
      </Card>
    </div>
  );
}
