import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa vung.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Vung dia ly cap cao nhat - xem backend/.../category/region/controller/RegionController.java.
export default function RegionsPage() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/regions')
      .then(({ data }) => setRegions(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách vùng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRegions = regions.filter((r) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.code.toLowerCase().includes(keyword) || r.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingRegion(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRegion(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/regions/${record.id}`)
      .then(() => {
        message.success('Đã xóa vùng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingRegion
        ? axiosClient.put(`/regions/${editingRegion.id}`, values)
        : axiosClient.post('/regions', values);
      request
        .then(() => {
          message.success(editingRegion ? 'Cập nhật thành công' : 'Tạo vùng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã vùng', dataIndex: 'code', key: 'code' },
    { title: 'Tên vùng', dataIndex: 'name', key: 'name' },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn vùng này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý vùng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm vùng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filteredRegions} loading={loading} />

      <Modal
        title={editingRegion ? 'Sửa vùng' : 'Thêm vùng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã vùng" name="code" rules={[{ required: true, message: 'Mã vùng không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên vùng" name="name" rules={[{ required: true, message: 'Tên vùng không được để trống' }]}>
            <Input placeholder="VD: Miền Nam" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
