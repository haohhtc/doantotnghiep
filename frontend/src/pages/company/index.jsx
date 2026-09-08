import { useEffect, useState } from 'react';
import { Typography, Input, Button, Form, Card, message, Row, Col } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc sua thong tin cong ty.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Cap to chuc cao nhat (Company Setup) - chi 1 ban ghi duy nhat (singleton), khong tao/xoa duoc.
// Xem backend/.../category/company/controller/CompanyController.java (chi co GET/PUT).
export default function CompanyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/company')
      .then(({ data }) => form.setFieldsValue(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được thông tin công ty'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit() {
    form.validateFields().then((values) => {
      setSaving(true);
      axiosClient
        .put('/company', values)
        .then(({ data }) => {
          message.success('Cập nhật thông tin công ty thành công');
          form.setFieldsValue(data.data);
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'))
        .finally(() => setSaving(false));
    });
  }

  return (
    <div>
      <Title level={3}>Thông tin công ty</Title>
      <Card loading={loading} style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical" disabled={!canWrite}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã công ty" name="code" rules={[{ required: true, message: 'Mã công ty không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tên công ty" name="name" rules={[{ required: true, message: 'Tên công ty không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mã số thuế" name="taxCode">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Điện thoại" name="phone">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>
          {canWrite && (
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSubmit}>
              Lưu thay đổi
            </Button>
          )}
        </Form>
      </Card>
    </div>
  );
}
