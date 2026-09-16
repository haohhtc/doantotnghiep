import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message, List, Empty } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa nhom khach hang.

// MDM "Customer Group" - chi la du lieu mo ta/phan loai, khong co logic tinh toan nao khac - xem
// backend/.../category/customergroup/. Da chuyen sang M:N (customer_group_member) - quan ly khach
// hang trong nhom tai day (Master-Detail, giong pattern /product-groups), khong con o form Khach
// hang - xem V21__employee_route_customer_group_mn.sql.
// canWrite tinh trong component (khong o module scope) - xem ghi chu o pages/branches/index.jsx.
export default function CustomerGroupsPage() {
  const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');
  const [groups, setGroups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberGroup, setMemberGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState(null);

  const customerOptions = customers.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/customer-groups'), axiosClient.get('/customers')])
      .then(([groupsRes, customersRes]) => {
        setGroups(groupsRes.data.data);
        setCustomers(customersRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách nhóm khách hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = groups.filter((g) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return g.code.toLowerCase().includes(keyword) || g.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingGroup(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingGroup(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/customer-groups/${record.id}`)
      .then(() => {
        message.success('Đã xóa nhóm khách hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingGroup
        ? axiosClient.put(`/customer-groups/${editingGroup.id}`, values)
        : axiosClient.post('/customer-groups', values);
      request
        .then(() => {
          message.success(editingGroup ? 'Cập nhật thành công' : 'Tạo nhóm khách hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  function openMemberModal(record) {
    setMemberGroup(record);
    setNewCustomerId(null);
    setMemberModalOpen(true);
    loadMembers(record.id);
  }

  function loadMembers(groupId) {
    setMembersLoading(true);
    axiosClient
      .get(`/customer-groups/${groupId}/members`)
      .then(({ data }) => setMembers(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách khách hàng'))
      .finally(() => setMembersLoading(false));
  }

  function handleAddMember() {
    if (!newCustomerId) {
      message.warning('Chọn khách hàng trước khi thêm');
      return;
    }
    axiosClient
      .post(`/customer-groups/${memberGroup.id}/members`, { customerId: newCustomerId })
      .then(() => {
        message.success('Đã thêm khách hàng vào nhóm');
        setNewCustomerId(null);
        loadMembers(memberGroup.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
  }

  function handleRemoveMember(memberId) {
    axiosClient
      .delete(`/customer-groups/${memberGroup.id}/members/${memberId}`)
      .then(() => {
        message.success('Đã gỡ khách hàng khỏi nhóm');
        loadMembers(memberGroup.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Gỡ thất bại'));
  }

  const assignedCustomerIds = members.map((m) => m.customer.id);
  const availableCustomerOptions = customerOptions.filter((c) => !assignedCustomerIds.includes(c.value));

  const columns = [
    { title: 'Mã nhóm', dataIndex: 'code', key: 'code' },
    { title: 'Tên nhóm', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openMemberModal(record)}>
            Khách hàng
          </Button>
          {canWrite && (
            <>
              <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
              <Popconfirm title="Xóa vĩnh viễn nhóm khách hàng này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý nhóm khách hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm nhóm khách hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingGroup ? 'Sửa nhóm khách hàng' : 'Thêm nhóm khách hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã nhóm" name="code" rules={[{ required: true, message: 'Mã nhóm không được để trống' }]}>
            <Input placeholder="VD: DAILY-C1" />
          </Form.Item>
          <Form.Item label="Tên nhóm" name="name" rules={[{ required: true, message: 'Tên nhóm không được để trống' }]}>
            <Input placeholder="VD: Đại lý cấp 1" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={memberGroup ? `Khách hàng trong nhóm - ${memberGroup.code}` : 'Khách hàng trong nhóm'}
        open={memberModalOpen}
        onCancel={() => setMemberModalOpen(false)}
        footer={null}
        width={560}
        destroyOnHidden
      >
        {canWrite && (
          <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn khách hàng để thêm"
              options={availableCustomerOptions}
              value={newCustomerId}
              onChange={setNewCustomerId}
              showSearch
              optionFilterProp="label"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMember}>
              Thêm
            </Button>
          </Space.Compact>
        )}
        <List
          loading={membersLoading}
          dataSource={members}
          locale={{ emptyText: <Empty description="Nhóm chưa có khách hàng nào" /> }}
          renderItem={(m) => (
            <List.Item
              actions={
                canWrite
                  ? [
                      <Popconfirm key="remove" title="Gỡ khách hàng này khỏi nhóm?" onConfirm={() => handleRemoveMember(m.id)}>
                        <Button size="small" icon={<DeleteOutlined />} danger />
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              <Text>{m.customer.code} - {m.customer.name}</Text>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
