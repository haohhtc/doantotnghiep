import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;
const { TextArea } = Input;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa chuc vu.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// MDM "Employees > Position" - Employee Master Data don gian hoa, dung chung bang User (khong
// tach Employee rieng) - xem backend/.../category/employeeposition/.
export default function EmployeePositionsPage() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/employee-positions')
      .then(({ data }) => setPositions(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách chức vụ'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = positions.filter((p) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return p.code.toLowerCase().includes(keyword) || p.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingPosition(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingPosition(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/employee-positions/${record.id}`)
      .then(() => {
        message.success('Đã xóa chức vụ');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingPosition
        ? axiosClient.put(`/employee-positions/${editingPosition.id}`, values)
        : axiosClient.post('/employee-positions', values);
      request
        .then(() => {
          message.success(editingPosition ? 'Cập nhật thành công' : 'Tạo chức vụ thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã chức vụ', dataIndex: 'code', key: 'code' },
    { title: 'Tên chức vụ', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn chức vụ này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý chức vụ</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm chức vụ"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingPosition ? 'Sửa chức vụ' : 'Thêm chức vụ'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã chức vụ" name="code" rules={[{ required: true, message: 'Mã chức vụ không được để trống' }]}>
            <Input placeholder="VD: SALESMAN" />
          </Form.Item>
          <Form.Item label="Tên chức vụ" name="name" rules={[{ required: true, message: 'Tên chức vụ không được để trống' }]}>
            <Input placeholder="VD: Salesman" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
