import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Switch, Typography, message } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

const { Title, Text, Link } = Typography;

// Goi that POST /api/auth/login (backend/.../auth/controller/AuthController.java).
// Luu JWT that vao localStorage - axiosClient tu gan vao header cho moi request sau do.
export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function handleFinish(values) {
    setLoading(true);
    axiosClient
      .post('/auth/login', { username: values.username, password: values.password })
      .then(({ data }) => {
        const { token, username, fullName, role } = data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ username, fullName, role }));
        message.success('Đăng nhập thành công');
        navigate('/');
      })
      .catch((err) => {
        message.error(err.response?.data?.message || 'Đăng nhập thất bại - kiểm tra lại tài khoản/mật khẩu');
      })
      .finally(() => setLoading(false));
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 12% 78%, rgba(217, 70, 239, 0.55) 0%, transparent 42%),' +
          'radial-gradient(circle at 88% 18%, rgba(30, 27, 75, 0.75) 0%, transparent 48%),' +
          'radial-gradient(circle at 82% 85%, rgba(191, 219, 254, 0.65) 0%, transparent 55%),' +
          'linear-gradient(135deg, #4a0e2e 0%, #4c1d95 30%, #4338ca 55%, #3b82f6 75%, #dbeafe 100%)',
        padding: 16,
      }}
    >
      <Title
        level={2}
        style={{
          marginBottom: 24,
          letterSpacing: 2,
          fontWeight: 800,
          background: 'linear-gradient(90deg, #22d3ee, #6366f1, #d946ef)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        ERP QLKHO
      </Title>

      <div
        style={{
          width: 440,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 8,
          padding: '32px 32px 28px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Đăng nhập
        </Title>
        <div style={{ borderBottom: '1px solid #f0f0f0', margin: '16px 0 20px' }} />

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Chưa có tài khoản? </Text>
          <Link>Đăng ký</Link>
        </div>

        <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}>
            <Input size="large" variant="filled" placeholder="Tên đăng nhập hoặc email" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
            <Input.Password size="large" variant="filled" placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Switch size="small" />
                </Form.Item>
                <Text>Ghi nhớ đăng nhập</Text>
              </span>
              <Link>Quên mật khẩu?</Link>
            </div>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            icon={<LoginOutlined />}
            style={{ background: '#4750d6', borderColor: '#4750d6' }}
          >
            Đăng nhập
          </Button>
        </Form>
      </div>
    </div>
  );
}
