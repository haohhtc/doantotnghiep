import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Checkbox, Row, Col, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';
import AddressCascadeFields from '../../components/AddressCascadeFields';
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
  const [groups, setGroups] = useState([]);
  const [channels, setChannels] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name }));
  const channelOptions = channels.map((c) => ({ value: c.id, label: c.name }));
  const priceListOptions = priceLists.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/customers'),
      axiosClient.get('/customer-groups'),
      axiosClient.get('/customer-channels'),
      axiosClient.get('/price-lists'),
    ])
      .then(([customersRes, groupsRes, channelsRes, priceListsRes]) => {
        setCustomers(customersRes.data.data);
        setGroups(groupsRes.data.data);
        setChannels(channelsRes.data.data);
        setPriceLists(priceListsRes.data.data);
      })
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
    form.setFieldsValue({
      ...record,
      groupId: record.group?.id,
      channelId: record.channel?.id,
      priceListId: record.priceList?.id,
      regionId: record.region?.id,
      provinceId: record.province?.id,
      districtId: record.district?.id,
      wardId: record.ward?.id,
    });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/customers/${record.id}`)
      .then(() => {
        message.success('Đã xóa khách hàng');
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
      title: 'Vùng địa lý',
      key: 'geography',
      render: (_, r) => (r.ward ? `${r.ward.name}, ${r.district?.name}, ${r.province?.name}` : '-'),
    },
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
          <Popconfirm title="Xóa vĩnh viễn khách hàng này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Nhóm khách hàng" name="groupId">
                <Select
                  options={groupOptions}
                  placeholder="Chọn nhóm"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kênh bán hàng" name="channelId">
                <Select
                  options={channelOptions}
                  placeholder="Chọn kênh"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Bảng giá" name="priceListId">
                <Select
                  options={priceListOptions}
                  placeholder="Chọn bảng giá"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  popupMatchSelectWidth={false}
                />
              </Form.Item>
            </Col>
          </Row>
          <AddressCascadeFields form={form} />
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Kích hoạt</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
