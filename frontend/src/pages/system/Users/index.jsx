import { useEffect, useState } from 'react';
import { Typography, Button, Table, Tag, Space, Modal, Form, Select, Input, Popconfirm, message } from 'antd';
import { EditOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import ActiveStatus from '../../../components/ActiveStatus';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

// Khop voi Role.code that trong DB (xem V1__init_schema.sql + V7__seed_roles_and_test_users.sql).
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Quản trị viên' },
  { value: 'WAREHOUSE_MANAGER', label: 'Quản lý kho' },
  { value: 'SALES_STAFF', label: 'Nhân viên bán hàng' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'LOCKED', label: 'Đã khóa' },
];

function roleLabel(roleCode) {
  return ROLE_OPTIONS.find((r) => r.value === roleCode)?.label || roleCode;
}

// Trang nay da noi API that (khong con mock) - xem backend/.../user/controller/UserController.java.
// Luu y: DELETE /api/users/{id} = khoa tai khoan (khong xoa han); khong co API rieng cho
// "mo khoa" - phai goi PUT voi status=ACTIVE.
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [positions, setPositions] = useState([]);
  const [salesmanTypes, setSalesmanTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  const branchOptions = branches.map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));
  const positionOptions = positions.map((p) => ({ value: p.id, label: p.name }));
  const salesmanTypeOptions = salesmanTypes.map((t) => ({ value: t.id, label: t.name }));

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/users'),
      axiosClient.get('/branches'),
      axiosClient.get('/employee-positions'),
      axiosClient.get('/salesman-types'),
    ])
      .then(([usersRes, branchesRes, positionsRes, salesmanTypesRes]) => {
        setUsers(usersRes.data.data);
        setBranches(branchesRes.data.data);
        setPositions(positionsRes.data.data);
        setSalesmanTypes(salesmanTypesRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách người dùng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) => {
    const keyword = searchText.trim().toLowerCase();
    if (
      keyword &&
      !u.username.toLowerCase().includes(keyword) &&
      !(u.fullName || '').toLowerCase().includes(keyword) &&
      !(u.email || '').toLowerCase().includes(keyword)
    ) {
      return false;
    }
    if (filterValues.roleCode && u.role?.code !== filterValues.roleCode) return false;
    if (filterValues.status && u.status !== filterValues.status) return false;
    return true;
  });

  function openCreateModal() {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      fullName: record.fullName,
      email: record.email,
      roleCode: record.role?.code,
      branchId: record.branch?.id,
      positionId: record.position?.id,
      salesmanTypeId: record.salesmanType?.id,
    });
    setModalOpen(true);
  }

  function handleToggleLock(record) {
    // Giu nguyen branchId/positionId/salesmanTypeId khi khoa/mo khoa - UserService.update ghi de
    // toan bo field tu DTO, khong truyen se bi xoa mat du lieu da gan truoc do.
    const request =
      record.status === 'ACTIVE'
        ? axiosClient.delete(`/users/${record.id}`)
        : axiosClient.put(`/users/${record.id}`, {
            username: record.username,
            fullName: record.fullName,
            email: record.email,
            roleCode: record.role?.code,
            branchId: record.branch?.id,
            positionId: record.position?.id,
            salesmanTypeId: record.salesmanType?.id,
            status: 'ACTIVE',
          });
    request
      .then(() => {
        message.success(record.status === 'ACTIVE' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingUser
        ? axiosClient.put(`/users/${editingUser.id}`, values)
        : axiosClient.post('/users', values);
      request
        .then(() => {
          message.success(editingUser ? 'Cập nhật thành công' : 'Tạo người dùng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Vai trò',
      key: 'roleCode',
      render: (_, u) => <Tag>{roleLabel(u.role?.code)}</Tag>,
    },
    { title: 'Chi nhánh', key: 'branch', render: (_, u) => u.branch?.name || '-' },
    { title: 'Chức vụ', key: 'position', render: (_, u) => u.position?.name || '-' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <ActiveStatus active={status === 'ACTIVE'} />,
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
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo tên đăng nhập, họ tên hoặc email..."
        onAdd={openCreateModal}
        addTooltip="Thêm người dùng"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[
          { name: 'roleCode', label: 'Vai trò', options: ROLE_OPTIONS },
          { name: 'status', label: 'Trạng thái', options: STATUS_FILTER_OPTIONS },
        ]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredUsers} loading={loading} />

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
          <Form.Item label="Chi nhánh" name="branchId">
            <Select options={branchOptions} placeholder="Chọn chi nhánh" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item label="Chức vụ" name="positionId">
            <Select options={positionOptions} placeholder="Chọn chức vụ" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item label="Loại nhân viên bán hàng" name="salesmanTypeId">
            <Select options={salesmanTypeOptions} placeholder="Chọn loại nhân viên bán hàng" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
