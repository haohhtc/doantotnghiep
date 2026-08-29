import { useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

// Du lieu mau (khong lay tu du lieu that trong ui-reference/) - se thay bang goi API that
// khi backend co RoleController/RoleService (hien chi co Role entity + RoleRepository).
const INITIAL_ROLES = [
  { id: 1, code: 'ADMIN', name: 'Quản trị viên', description: 'Toàn quyền quản trị hệ thống' },
  { id: 2, code: 'WAREHOUSE_MANAGER', name: 'Quản lý kho', description: 'Quản lý nhập/xuất/tồn kho' },
  { id: 3, code: 'SALES_STAFF', name: 'Nhân viên bán hàng', description: 'Tạo và xử lý đơn hàng bán' },
];

// TODO: thay INITIAL_ROLES + cac ham xu ly bang goi API that qua axiosClient khi co RoleController.
export default function RolesPage() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

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
    setRoles((prev) => prev.filter((r) => r.id !== record.id));
    message.success('Đã xóa vai trò');
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingRole) {
        setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? { ...r, ...values } : r)));
        message.success('Cập nhật thành công');
      } else {
        const newRole = { id: Date.now(), ...values };
        setRoles((prev) => [newRole, ...prev]);
        message.success('Tạo vai trò thành công');
      }
      setModalOpen(false);
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
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Input.Search
          placeholder="Tìm theo mã hoặc tên vai trò"
          allowClear
          style={{ width: 320 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Vai trò mới
        </Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={filteredRoles} />

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
