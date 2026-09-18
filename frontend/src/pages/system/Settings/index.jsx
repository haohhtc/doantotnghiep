import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;
const { TextArea } = Input;

// Cau hinh chung (key-value) - du lieu luu tru/hien thi, tuong tu Nhom khach hang/Chuc vu truoc
// day - xem backend/.../system/controller/SystemSettingController.java (V26).
export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/settings')
      .then(({ data }) => setSettings(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách cài đặt'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = settings.filter((s) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return s.settingKey.toLowerCase().includes(keyword);
  });

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
      .delete(`/settings/${record.id}`)
      .then(() => {
        message.success('Đã xóa cài đặt');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editing
        ? axiosClient.put(`/settings/${editing.id}`, values)
        : axiosClient.post('/settings', values);
      request
        .then(() => {
          message.success(editing ? 'Cập nhật thành công' : 'Tạo cài đặt thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Khóa cấu hình', dataIndex: 'settingKey', key: 'settingKey' },
    { title: 'Giá trị', dataIndex: 'settingValue', key: 'settingValue' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Xóa cài đặt này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Cài đặt hệ thống</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo khóa cấu hình..."
        onAdd={openCreateModal}
        addTooltip="Thêm cài đặt"
        onReload={loadData}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editing ? 'Sửa cài đặt' : 'Thêm cài đặt'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Khóa cấu hình" name="settingKey" rules={[{ required: true, message: 'Khóa cấu hình không được để trống' }]}>
            <Input disabled={!!editing} placeholder="VD: COMPANY_TAX_CODE" />
          </Form.Item>
          <Form.Item label="Giá trị" name="settingValue">
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
