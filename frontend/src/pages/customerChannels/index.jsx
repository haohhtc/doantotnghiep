import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;
const { TextArea } = Input;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa kenh ban hang.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// MDM "Account/Channel Definition" - chi la du lieu mo ta/phan loai hien thi tren form Khach
// hang, khong tu lien ket voi Price List (xem tonghop.md) - xem backend/.../category/customerchannel/.
export default function CustomerChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/customer-channels')
      .then(({ data }) => setChannels(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách kênh bán hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = channels.filter((c) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return c.code.toLowerCase().includes(keyword) || c.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingChannel(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingChannel(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/customer-channels/${record.id}`)
      .then(() => {
        message.success('Đã xóa kênh bán hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingChannel
        ? axiosClient.put(`/customer-channels/${editingChannel.id}`, values)
        : axiosClient.post('/customer-channels', values);
      request
        .then(() => {
          message.success(editingChannel ? 'Cập nhật thành công' : 'Tạo kênh bán hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã kênh', dataIndex: 'code', key: 'code' },
    { title: 'Tên kênh', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn kênh bán hàng này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý kênh bán hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm kênh bán hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingChannel ? 'Sửa kênh bán hàng' : 'Thêm kênh bán hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã kênh" name="code" rules={[{ required: true, message: 'Mã kênh không được để trống' }]}>
            <Input placeholder="VD: GT" />
          </Form.Item>
          <Form.Item label="Tên kênh" name="name" rules={[{ required: true, message: 'Tên kênh không được để trống' }]}>
            <Input placeholder="VD: Kênh đại lý truyền thống" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
