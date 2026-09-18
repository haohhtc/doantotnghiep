import { useEffect, useState } from 'react';
import { Typography, Alert, Input, InputNumber, Button, Table, Form, Row, Col, message } from 'antd';
import { SendOutlined, SaveOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;

// Cau hinh SMTP (singleton) + gui email GIA LAP (khong goi SMTP that, chi ghi email_log) - xem
// backend/.../system/controller/EmailConfigController.java (V28).
export default function EmailConfigPage() {
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [form] = Form.useForm();
  const [sendForm] = Form.useForm();

  function loadConfig() {
    axiosClient
      .get('/email-config')
      .then(({ data }) => form.setFieldsValue(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được cấu hình email'));
  }

  function loadLogs() {
    setLogsLoading(true);
    axiosClient
      .get('/email-logs')
      .then(({ data }) => setLogs(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được nhật ký email'))
      .finally(() => setLogsLoading(false));
  }

  useEffect(() => {
    loadConfig();
    loadLogs();
  }, []);

  function handleSaveConfig() {
    form.validateFields().then((values) => {
      axiosClient
        .put('/email-config', values)
        .then(() => message.success('Đã lưu cấu hình email'))
        .catch((err) => message.error(err.response?.data?.message || 'Lưu thất bại'));
    });
  }

  function handleSendTest() {
    sendForm.validateFields().then((values) => {
      axiosClient
        .post('/email-logs/send', values)
        .then(() => {
          message.success('Đã "gửi" email (giả lập - chỉ ghi log, không gọi SMTP thật)');
          sendForm.resetFields();
          loadLogs();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Gửi thất bại'));
    });
  }

  const logColumns = [
    { title: 'Người nhận', dataIndex: 'recipient', key: 'recipient' },
    { title: 'Tiêu đề', dataIndex: 'subject', key: 'subject' },
    { title: 'Nội dung', dataIndex: 'body', key: 'body', ellipsis: true },
    { title: 'Thời gian', dataIndex: 'sentAt', key: 'sentAt', render: (v) => v?.replace('T', ' ') },
  ];

  return (
    <div>
      <Title level={3}>Cấu hình Email</Title>
      <Alert
        style={{ marginBottom: 16 }}
        type="warning"
        showIcon
        message="Không gửi email thật - mọi lượt gửi chỉ được ghi vào Nhật ký email bên dưới, không gọi SMTP thật (tránh rủi ro lúc demo và rò rỉ thông tin đăng nhập email)."
      />

      <Title level={5}>Cấu hình SMTP</Title>
      <Form form={form} layout="vertical" style={{ maxWidth: 480, marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item label="SMTP Host" name="smtpHost">
              <Input placeholder="smtp.gmail.com" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Port" name="smtpPort">
              <InputNumber style={{ width: '100%' }} placeholder="587" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Username" name="smtpUsername">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Password" name="smtpPassword">
              <Input.Password placeholder="Để trống nếu không đổi" />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveConfig}>
          Lưu cấu hình
        </Button>
      </Form>

      <Title level={5}>Gửi thử (giả lập)</Title>
      <Form form={sendForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="recipient" rules={[{ required: true, message: 'Người nhận không được để trống' }]}>
          <Input placeholder="Người nhận (email)" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="subject">
          <Input placeholder="Tiêu đề" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="body">
          <Input placeholder="Nội dung" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" icon={<SendOutlined />} onClick={handleSendTest}>
            Gửi thử
          </Button>
        </Form.Item>
      </Form>

      <Title level={5}>Nhật ký email</Title>
      <TableToolbar onReload={loadLogs} />
      <Table rowKey="id" columns={logColumns} dataSource={logs} loading={logsLoading} />
    </div>
  );
}
