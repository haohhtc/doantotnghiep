import { useState } from 'react';
import { Typography, Input, Button, Table, Tag, Space, Modal, Form, Select, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const { Title } = Typography;

// Khop voi Role.code: ADMIN, WAREHOUSE_MANAGER, SALES_STAFF (xem backend/.../user/entity/Role.java)
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'WAREHOUSE_MANAGER', label: 'Quản lý kho' },
  { value: 'SALES_STAFF', label: 'Nhân viên bán hàng' },
];

function roleLabel(roleCode) {
  return ROLE_OPTIONS.find((r) => r.value === roleCode)?.label || roleCode;
}

// Du lieu mau (khong lay tu du lieu that trong ui-reference/) - se thay bang goi API /api/users that sau.
const INITIAL_USERS = [
  { id: 1, username: 'admin', fullName: 'Nguyen Van A', email: 'nguyenvana@example.com', roleCode: 'ADMIN', status: 'ACTIVE' },
  { id: 2, username: 'kho01', fullName: 'Tran Thi B', email: 'tranthib@example.com', roleCode: 'WAREHOUSE_MANAGER', status: 'ACTIVE' },
  { id: 3, username: 'kho02', fullName: 'Le Van C', email: 'levanc@example.com', roleCode: 'WAREHOUSE_MANAGER', status: 'LOCKED' },
  { id: 4, username: 'sale01', fullName: 'Pham Thi D', email: 'phamthid@example.com', roleCode: 'SALES_STAFF', status: 'ACTIVE' },
  { id: 5, username: 'sale02', fullName: 'Hoang Van E', email: 'hoangvane@example.com', roleCode: 'SALES_STAFF', status: 'ACTIVE' },
  { id: 6, username: 'sale03', fullName: 'Do Thi F', email: 'dothif@example.com', roleCode: 'SALES_STAFF', status: 'LOCKED' },
];

// TODO: thay INITIAL_USERS + cac ham xu ly bang goi API that qua axiosClient (GET/POST/PUT/DELETE /api/users).
export default function UsersPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const filteredUsers = users.filter((u) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return (
      u.username.toLowerCase().includes(keyword) ||
      u.fullName.toLowerCase().includes(keyword) ||
      u.email.toLowerCase().includes(keyword)
    );
  });

  function openCreateModal() {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE' });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleToggleLock(record) {
    const nextStatus = record.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setUsers((prev) => prev.map((u) => (u.id === record.id ? { ...u, status: nextStatus } : u)));
    message.success(nextStatus === 'LOCKED' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingUser) {
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u)));
        message.success('Cập nhật thành công');
      } else {
        const newUser = { id: Date.now(), status: 'ACTIVE', ...values };
        setUsers((prev) => [newUser, ...prev]);
        message.success('Tạo người dùng thành công');
      }
      setModalOpen(false);
    });
  }

  const columns = [
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Vai trò',
      dataIndex: 'roleCode',
      key: 'roleCode',
      render: (roleCode) => <Tag>{roleLabel(roleCode)}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title={record.status === 'ACTIVE' ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?'}
            onConfirm={() => handleToggleLock(record)}
          >
            <Button icon={record.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />} danger={record.status === 'ACTIVE'}>
              {record.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý người dùng</Title>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Input.Search
          placeholder="Tìm theo tên đăng nhập, họ tên hoặc email"
          allowClear
          style={{ width: 320 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Thêm người dùng
        </Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={filteredUsers} />

      <Modal
        title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: 'Tên đăng nhập không được để trống' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={editingUser ? [] : [{ required: true, message: 'Mật khẩu không được để trống' }]}
            extra={editingUser ? 'Để trống nếu không đổi mật khẩu' : undefined}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="Họ tên" name="fullName">
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Vai trò"
            name="roleCode"
            rules={[{ required: true, message: 'Vai trò không được để trống' }]}
          >
            <Select options={ROLE_OPTIONS} placeholder="Chọn vai trò" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
