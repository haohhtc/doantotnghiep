import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;
const { TextArea } = Input;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa loai NVBH.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// MDM "Employees > Salesman Type" - xem backend/.../category/salesmantype/.
export default function SalesmanTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/salesman-types')
      .then(({ data }) => setTypes(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách loại nhân viên bán hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = types.filter((t) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return t.code.toLowerCase().includes(keyword) || t.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingType(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingType(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/salesman-types/${record.id}`)
      .then(() => {
        message.success('Đã xóa loại nhân viên bán hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingType
        ? axiosClient.put(`/salesman-types/${editingType.id}`, values)
        : axiosClient.post('/salesman-types', values);
      request
        .then(() => {
          message.success(editingType ? 'Cập nhật thành công' : 'Tạo loại nhân viên bán hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã loại', dataIndex: 'code', key: 'code' },
    { title: 'Tên loại', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn loại nhân viên bán hàng này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý loại nhân viên bán hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm loại nhân viên bán hàng"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingType ? 'Sửa loại nhân viên bán hàng' : 'Thêm loại nhân viên bán hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã loại" name="code" rules={[{ required: true, message: 'Mã loại không được để trống' }]}>
            <Input placeholder="VD: PRESELL" />
          </Form.Item>
          <Form.Item label="Tên loại" name="name" rules={[{ required: true, message: 'Tên loại không được để trống' }]}>
            <Input placeholder="VD: Presell" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
