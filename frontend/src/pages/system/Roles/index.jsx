import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;
const { TextArea } = Input;

// Trang nay da noi API that (khong con mock) - xem backend/.../user/controller/RoleController.java.
export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/roles')
      .then(({ data }) => setRoles(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách vai trò'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRoles = roles.filter((r) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.code.toLowerCase().includes(keyword) || r.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingRole(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRole(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/roles/${record.id}`)
      .then(() => {
        message.success('Đã xóa vai trò');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingRole
        ? axiosClient.put(`/roles/${editingRole.id}`, values)
        : axiosClient.post('/roles', values);
      request
        .then(() => {
          message.success(editingRole ? 'Cập nhật thành công' : 'Tạo vai trò thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã vai trò', dataIndex: 'code', key: 'code' },
    { title: 'Tên vai trò', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xóa vai trò này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Phân quyền người dùng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên vai trò..."
        onAdd={openCreateModal}
        addTooltip="Vai trò mới"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredRoles} loading={loading} />

      <Modal
        title={editingRole ? 'Sửa vai trò' : 'Vai trò mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Mã vai trò"
            name="code"
            rules={[{ required: true, message: 'Mã vai trò không được để trống' }]}
          >
            <Input disabled={!!editingRole} placeholder="VD: ADMIN" />
          </Form.Item>
          <Form.Item
            label="Tên vai trò"
            name="name"
            rules={[{ required: true, message: 'Tên vai trò không được để trống' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
