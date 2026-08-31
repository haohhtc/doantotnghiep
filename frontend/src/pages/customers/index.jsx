import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Checkbox, Row, Col, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';
import axiosClient from '../../api/axiosClient';

const { Title } = Typography;

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

// Trang nay da noi API that (khong con mock) - xem backend/.../category/customer/
// CustomerController (GET/POST/PUT/DELETE /api/customers, DELETE = ngung hop tac chu khong xoa han).
// Luu y: bang customer that (V4__sales.sql) khong co contactPerson/parentCode/shipTos -
// nhung field/tab do da bo khi noi API that, chi giu dung field co trong schema.
export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/customers')
      .then(({ data }) => setCustomers(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách khách hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !c.code.toLowerCase().includes(keyword) && !c.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.active && String(c.active) !== filterValues.active) return false;
    return true;
  });

  function openCreateModal() {
    setEditingCustomer(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/customers/${record.id}`)
      .then(() => {
        message.success('Đã ngừng hợp tác khách hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingCustomer
        ? axiosClient.put(`/customers/${editingCustomer.id}`, values)
        : axiosClient.post('/customers', values);
      request
        .then(() => {
          message.success(editingCustomer ? 'Cập nhật thành công' : 'Tạo khách hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã khách hàng', dataIndex: 'code', key: 'code' },
    { title: 'Tên khách hàng', dataIndex: 'name', key: 'name' },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => <ActiveStatus active={active} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Ngừng hợp tác khách hàng này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý khách hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={openCreateModal}
        addTooltip="Thêm khách hàng"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredCustomers} loading={loading} />

      <Modal
        title={editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã khách hàng" name="code" rules={[{ required: true, message: 'Mã khách hàng không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tên khách hàng" name="name" rules={[{ required: true, message: 'Tên khách hàng không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Điện thoại" name="phone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
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
