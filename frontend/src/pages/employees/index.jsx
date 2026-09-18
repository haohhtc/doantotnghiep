import { useEffect, useState } from 'react';
import {
  Typography, Input, Button, Table, Space, Modal, Form, Select, Checkbox, Row, Col, Popconfirm, message, Tabs,
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
];

// Khop voi ma chuc vu seed trong V16 (SALESMAN/SS/ASM) - tab NVBH chi cho chon SALESMAN, tab NV
// chi cho chon SS/ASM, dung theo yeu cau tonghop.md Nhom 5.
const NVBH_POSITION_CODES = ['SALESMAN'];
const NV_POSITION_CODES = ['SS', 'ASM'];

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa nhan vien.

// Employee Master Data tach rieng khoi User (thay the thiet ke gop-vao-User cu cua V16) - xem
// backend/.../category/employee/ (V21__employee_route_customer_group_mn.sql). 1 bang chung cho ca
// 2 tab NVBH/NV, loc theo "type". canWrite tinh trong component - xem ghi chu o pages/branches/index.jsx.
export default function EmployeesPage() {
  const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('NVBH');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();

  const allowedPositionCodes = activeTab === 'NVBH' ? NVBH_POSITION_CODES : NV_POSITION_CODES;
  const positionOptions = positions
    .filter((p) => allowedPositionCodes.includes(p.code))
    .map((p) => ({ value: p.id, label: p.name }));
  const userOptions = users.map((u) => ({ value: u.id, label: `${u.username} - ${u.fullName || ''}` }));

  function loadData() {
    setLoading(true);
    // GET /api/users chi ADMIN + WAREHOUSE_MANAGER duoc doc - chi goi khi can, tranh 403 lam fail
    // ca Promise.all doi voi SALES_STAFF (chi xem), giong pattern pages/warehouses.
    const requests = [axiosClient.get('/employees'), axiosClient.get('/employee-positions')];
    if (canWrite) requests.push(axiosClient.get('/users'));

    Promise.all(requests)
      .then(([employeesRes, positionsRes, usersRes]) => {
        setEmployees(employeesRes.data.data);
        setPositions(positionsRes.data.data);
        if (usersRes) setUsers(usersRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách nhân viên'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredEmployees = employees.filter((e) => {
    if (e.type !== activeTab) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return e.code.toLowerCase().includes(keyword) || e.fullName.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingEmployee(null);
    form.resetFields();
    form.setFieldsValue({ type: activeTab, active: true, deliveryMan: false });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingEmployee(record);
    form.setFieldsValue({
      ...record,
      positionId: record.position?.id,
      userId: record.user?.id,
    });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/employees/${record.id}`)
      .then(() => {
        message.success('Đã xóa nhân viên');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingEmployee
        ? axiosClient.put(`/employees/${editingEmployee.id}`, values)
        : axiosClient.post('/employees', values);
      request
        .then(() => {
          message.success(editingEmployee ? 'Cập nhật thành công' : 'Tạo nhân viên thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã NV', dataIndex: 'code', key: 'code' },
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Chức vụ', key: 'position', render: (_, r) => r.position?.name || '-' },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    ...(activeTab === 'NVBH'
      ? [{ title: 'Giao hàng', key: 'deliveryMan', render: (_, r) => (r.deliveryMan ? 'Có' : 'Không') }]
      : []),
    { title: 'Tài khoản', key: 'user', render: (_, r) => r.user?.username || '-' },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => <ActiveStatus active={active} />,
    },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn nhân viên này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
                  <Button icon={<DeleteOutlined />} danger />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Title level={3}>Quản lý nhân viên</Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'NVBH', label: 'Nhân viên bán hàng' },
          { key: 'NV', label: 'Nhân viên quản lý' },
        ]}
      />
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc họ tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm nhân viên"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredEmployees} loading={loading} />

      <Modal
        title={editingEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Mã nhân viên" name="code" rules={[{ required: true, message: 'Mã nhân viên không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="Họ tên" name="fullName" rules={[{ required: true, message: 'Họ tên không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Chức vụ" name="positionId">
                <Select options={positionOptions} placeholder="Chọn chức vụ" allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Điện thoại" name="phone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Giới tính" name="gender">
                <Select options={GENDER_OPTIONS} placeholder="Chọn giới tính" allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày sinh" name="birthDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="CMND/CCCD" name="idCardNumber">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Mã số thuế" name="taxCode">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày vào làm" name="hireDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày nghỉ việc" name="resignDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Địa chỉ" name="address">
                <Input />
              </Form.Item>
            </Col>
            {canWrite && (
              <Col span={12}>
                <Form.Item label="Tự động gán tài khoản" name="userId" extra="Không bắt buộc - nhân viên không nhất thiết phải có tài khoản đăng nhập.">
                  <Select options={userOptions} placeholder="Chọn tài khoản đăng nhập" allowClear showSearch optionFilterProp="label" />
                </Form.Item>
              </Col>
            )}
            {activeTab === 'NVBH' && (
              <Col span={12} style={{ display: 'flex', alignItems: 'center' }}>
                <Form.Item name="deliveryMan" valuePropName="checked" style={{ marginTop: 28 }}>
                  <Checkbox>Kiêm giao hàng</Checkbox>
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item name="active" valuePropName="checked">
                <Checkbox>Đang làm việc</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
