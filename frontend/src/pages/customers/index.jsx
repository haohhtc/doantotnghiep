import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Checkbox, Row, Col, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';
import AddressCascadeFields from '../../components/AddressCascadeFields';
import axiosClient from '../../api/axiosClient';
import { useBranch } from '../../contexts/BranchContext';

const { Title } = Typography;

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

// Trang nay da noi API that (khong con mock) - xem backend/.../category/customer/
// CustomerController (GET/POST/PUT/DELETE /api/customers, DELETE = ngung hop tac chu khong xoa han).
// Luu y: bang customer that (V4__sales.sql) khong co contactPerson/parentCode/shipTos -
// nhung field/tab do da bo khi noi API that, chi giu dung field co trong schema.
// Nhom khach hang: da chuyen sang M:N (khong con o form nay) - quan ly tai trang /customer-groups
// (giong pattern Master-Detail cua /product-groups) - xem V21__employee_route_customer_group_mn.sql.
export default function CustomersPage() {
  const { selectedBranchId } = useBranch();
  const [customers, setCustomers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  const channelOptions = channels.map((c) => ({ value: c.id, label: c.name }));
  const priceListOptions = priceLists.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
  const branchOptions = branches.map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));

  function loadReference() {
    Promise.all([axiosClient.get('/customer-channels'), axiosClient.get('/price-lists'), axiosClient.get('/branches')])
      .then(([channelsRes, priceListsRes, branchesRes]) => {
        setChannels(channelsRes.data.data);
        setPriceLists(priceListsRes.data.data);
        setBranches(branchesRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu tham chiếu'));
  }

  function loadCustomers(opts = {}) {
    setLoading(true);
    const page = opts.resetToFirstPage ? 1 : opts.page ?? pagination.current;
    const pageSize = opts.pageSize ?? pagination.pageSize;
    const search = opts.search !== undefined ? opts.search : debouncedSearch;
    const branchId = opts.branchId !== undefined ? opts.branchId : selectedBranchId;
    const active = 'active' in opts ? opts.active : filterValues.active;
    axiosClient
      .get('/customers/search', {
        params: { page: page - 1, size: pageSize, branchId: branchId || undefined, active: active || undefined, search: search || undefined },
      })
      .then(({ data }) => {
        setCustomers(data.data.content);
        setPagination({ current: page, pageSize, total: data.data.totalElements });
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách khách hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadReference();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), 400);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    loadCustomers({ resetToFirstPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, debouncedSearch, filterValues.active]);

  function openCreateModal() {
    setEditingCustomer(null);
    form.resetFields();
    form.setFieldsValue({ active: true, branchId: selectedBranchId || undefined });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingCustomer(record);
    form.setFieldsValue({
      ...record,
      channelId: record.channel?.id,
      priceListId: record.priceList?.id,
      regionId: record.region?.id,
      provinceId: record.province?.id,
      districtId: record.district?.id,
      wardId: record.ward?.id,
      branchId: record.branch?.id,
    });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/customers/${record.id}`)
      .then(() => {
        message.success('Đã xóa khách hàng');
        loadCustomers();
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
          loadCustomers(editingCustomer ? {} : { resetToFirstPage: true });
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã khách hàng', dataIndex: 'code', key: 'code' },
    { title: 'Tên khách hàng', dataIndex: 'name', key: 'name' },
    { title: 'Chi nhánh', key: 'branch', render: (_, r) => r.branch?.name || '-' },
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
          setSearchText('');
          setDebouncedSearch('');
          setFilterValues({});
          loadCustomers({ resetToFirstPage: true, search: '', active: undefined });
        }}
        filters={[{ name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={customers}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} khách hàng`,
          onChange: (page, pageSize) => loadCustomers({ page, pageSize }),
        }}
      />

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
            <Col span={12}>
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
            <Col span={12}>
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
          <Form.Item
            label="Chi nhánh"
            name="branchId"
            rules={[{ required: true, message: 'Chi nhánh không được để trống' }]}
            extra="Luôn lấy đúng chi nhánh đang chọn ở Header - không chọn chi nhánh khác được"
          >
            <Select options={branchOptions} popupMatchSelectWidth={false} disabled />
          </Form.Item>
          <AddressCascadeFields form={form} />
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Kích hoạt</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
