import { useEffect, useState } from 'react';
import { Typography, Alert, Input, Button, Table, Space, Modal, Form, Select, Checkbox, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'WAREHOUSE_MANAGER', label: 'WAREHOUSE_MANAGER' },
  { value: 'SALES_STAFF', label: 'SALES_STAFF' },
];

// Quy trinh duyet - CHI la cau hinh MO TA (loai chung tu nao can role gi duyet), CHUA thuc su
// chan/thay doi logic Service hien tai - xem backend/.../system/controller/ApprovalConfigController.java (V27).
export default function ApprovalProcessPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/approval-configs')
      .then(({ data }) => setConfigs(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được cấu hình duyệt'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreateModal() {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/approval-configs/${record.id}`)
      .then(() => {
        message.success('Đã xóa cấu hình');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editing
        ? axiosClient.put(`/approval-configs/${editing.id}`, values)
        : axiosClient.post('/approval-configs', values);
      request
        .then(() => {
          message.success(editing ? 'Cập nhật thành công' : 'Tạo cấu hình thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Loại chứng từ', dataIndex: 'docType', key: 'docType' },
    { title: 'Cần duyệt', dataIndex: 'requireApproval', key: 'requireApproval', render: (v) => (v ? 'Có' : 'Không') },
    { title: 'Role duyệt', dataIndex: 'approverRole', key: 'approverRole' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Xóa cấu hình này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quy trình duyệt</Title>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="Đây là màn hình cấu hình tham khảo - chưa thực sự chặn/thay đổi luồng duyệt hiện tại của các module, có thể mở rộng để thực sự áp dụng ở phiên bản sau."
      />
      <TableToolbar onAdd={openCreateModal} addTooltip="Thêm cấu hình" onReload={loadData} />
      <Table rowKey="id" columns={columns} dataSource={configs} loading={loading} pagination={false} />

      <Modal
        title={editing ? 'Sửa cấu hình duyệt' : 'Thêm cấu hình duyệt'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Loại chứng từ" name="docType" rules={[{ required: true, message: 'Loại chứng từ không được để trống' }]}>
            <Input placeholder="VD: SALES_ORDER" />
          </Form.Item>
          <Form.Item label="Role duyệt" name="approverRole">
            <Select options={ROLE_OPTIONS} placeholder="Chọn role duyệt" allowClear />
          </Form.Item>
          <Form.Item name="requireApproval" valuePropName="checked">
            <Checkbox>Cần duyệt</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
