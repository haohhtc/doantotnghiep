import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Checkbox, Row, Col, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa NCC.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Trang nay da noi API that (khong con mock) - xem backend/.../category/supplier/
// SupplierController (GET/POST/PUT/DELETE /api/suppliers, DELETE = ngung hop tac chu khong xoa han).
export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/suppliers')
      .then(({ data }) => setVendors(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách nhà cung cấp'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredVendors = vendors.filter((v) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !v.code.toLowerCase().includes(keyword) && !v.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.active && String(v.active) !== filterValues.active) return false;
    return true;
  });

  function openCreateModal() {
    setEditingVendor(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingVendor(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/suppliers/${record.id}`)
      .then(() => {
        message.success('Đã ngừng hợp tác nhà cung cấp');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingVendor
        ? axiosClient.put(`/suppliers/${editingVendor.id}`, values)
        : axiosClient.post('/suppliers', values);
      request
        .then(() => {
          message.success(editingVendor ? 'Cập nhật thành công' : 'Tạo nhà cung cấp thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã NCC', dataIndex: 'code', key: 'code' },
    { title: 'Tên nhà cung cấp', dataIndex: 'name', key: 'name' },
    { title: 'Tên nước ngoài', dataIndex: 'foreignName', key: 'foreignName' },
    { title: 'Người liên hệ', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
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
                <Popconfirm title="Ngừng hợp tác nhà cung cấp này?" onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý nhà cung cấp</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm nhà cung cấp"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredVendors} loading={loading} />

      <Modal
        title={editingVendor ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Mã NCC" name="code" rules={[{ required: true, message: 'Mã NCC không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Tên nhà cung cấp" name="name" rules={[{ required: true, message: 'Tên nhà cung cấp không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Tên nước ngoài" name="foreignName">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Người liên hệ" name="contactPerson">
                <Input />
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
          </Row>
          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Kích hoạt</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
