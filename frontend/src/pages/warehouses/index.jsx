import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Checkbox, Row, Col, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa kho.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Khop voi warehouse_type that trong DB (xem V2__master_data.sql).
const WHSE_TYPE_OPTIONS = [
  { value: 'MAIN', label: 'Kho chính' },
  { value: 'VAN', label: 'Kho xe tải' },
  { value: 'DAMAGE', label: 'Kho hàng lỗi' },
  { value: 'CONSIGNMENT', label: 'Kho ký gửi' },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

function whseTypeLabel(value) {
  return WHSE_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;
}

// Trang nay da noi API that (khong con mock) - xem backend/.../category/warehouse/
// WarehouseController (GET/POST/PUT/DELETE /api/warehouses) + GET /api/users (danh sach
// chon nguoi quan ly kho, chi doc).
export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  const managerOptions = users.map((u) => ({ value: u.id, label: u.fullName || u.username }));
  const branchOptions = branches.map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));

  function loadData() {
    setLoading(true);
    // GET /api/users chi ADMIN + WAREHOUSE_MANAGER duoc doc (xem SecurityConfig) - dung y het voi
    // canWrite nen chi goi khi can, tranh 403 lam fail ca Promise.all doi voi SALES_STAFF (chi xem).
    const requests = [axiosClient.get('/warehouses'), axiosClient.get('/branches')];
    if (canWrite) requests.push(axiosClient.get('/users'));

    Promise.all(requests)
      .then(([warehousesRes, branchesRes, usersRes]) => {
        setWarehouses(warehousesRes.data.data);
        setBranches(branchesRes.data.data);
        if (usersRes) setUsers(usersRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách kho'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredWarehouses = warehouses.filter((w) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !w.code.toLowerCase().includes(keyword) && !w.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.warehouseType && w.warehouseType !== filterValues.warehouseType) return false;
    if (filterValues.active && String(w.active) !== filterValues.active) return false;
    if (filterValues.branchId && w.branch?.id !== filterValues.branchId) return false;
    return true;
  });

  function openCreateModal() {
    setEditingWarehouse(null);
    form.resetFields();
    form.setFieldsValue({ active: true, warehouseType: 'MAIN' });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingWarehouse(record);
    form.setFieldsValue({ ...record, managerId: record.manager?.id, branchId: record.branch?.id });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/warehouses/${record.id}`)
      .then(() => {
        message.success('Đã xóa kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingWarehouse
        ? axiosClient.put(`/warehouses/${editingWarehouse.id}`, values)
        : axiosClient.post('/warehouses', values);
      request
        .then(() => {
          message.success(editingWarehouse ? 'Cập nhật thành công' : 'Tạo kho thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: '#', key: 'index', width: 50, render: (_, __, index) => index + 1 },
    { title: 'Mã kho', dataIndex: 'code', key: 'code' },
    { title: 'Tên kho', dataIndex: 'name', key: 'name' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    { title: 'Loại kho', dataIndex: 'warehouseType', key: 'warehouseType', render: (v) => whseTypeLabel(v) },
    { title: 'Chi nhánh', key: 'branch', render: (_, r) => r.branch?.name || '-' },
    { title: 'Người quản lý', key: 'manager', render: (_, r) => r.manager?.fullName || '-' },
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
                <Popconfirm title="Xóa vĩnh viễn kho này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm kho"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[
          { name: 'warehouseType', label: 'Loại kho', options: WHSE_TYPE_OPTIONS },
          { name: 'branchId', label: 'Chi nhánh', options: branchOptions },
          { name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS },
        ]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredWarehouses} loading={loading} />

      <Modal
        title={editingWarehouse ? 'Sửa kho' : 'Thêm kho'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={720}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Mã kho" name="code" rules={[{ required: true, message: 'Mã kho không được để trống' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Tên kho" name="name" rules={[{ required: true, message: 'Tên kho không được để trống' }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Địa chỉ" name="address">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Loại kho" name="warehouseType" rules={[{ required: true, message: 'Loại kho không được để trống' }]}>
                <Select options={WHSE_TYPE_OPTIONS} />
              </Form.Item>
              <Form.Item label="Người quản lý" name="managerId">
                <Select options={managerOptions} placeholder="Chọn người quản lý" allowClear />
              </Form.Item>
              <Form.Item label="Chi nhánh quản lý" name="branchId">
                <Select options={branchOptions} placeholder="Chọn chi nhánh" allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="active" valuePropName="checked">
                <Checkbox>Kích hoạt</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
