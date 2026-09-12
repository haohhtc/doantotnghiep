import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;
const { TextArea } = Input;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa nhom khach hang.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// MDM "Customer Group" - chi la du lieu mo ta/phan loai hien thi tren form Khach hang, khong co
// logic tinh toan nao khac - xem backend/.../category/customergroup/.
export default function CustomerGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/customer-groups')
      .then(({ data }) => setGroups(data.data))
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

  const columns = [
    { title: 'Mã nhóm', dataIndex: 'code', key: 'code' },
    { title: 'Tên nhóm', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn nhóm khách hàng này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
    </div>
  );
}
