import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message, List, Empty } from 'antd';
import { EditOutlined, DeleteOutlined, TeamOutlined, PlusOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title, Text } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa khung tuyen
// va gan/go khach hang.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Module "Tuyen ban hang" (theo yeu cau TV2) - xem backend/.../category/routemaster/controller/RouteMasterController.java.
export default function RouteMastersPage() {
  const [routes, setRoutes] = useState([]);
  const [sellingZones, setSellingZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form] = Form.useForm();

  // Modal quan ly "List Of Outlet" (khach hang trong tuyen)
  const [outletModalOpen, setOutletModalOpen] = useState(false);
  const [outletRoute, setOutletRoute] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [outletLoading, setOutletLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [newCustomerId, setNewCustomerId] = useState(null);

  const zoneOptions = sellingZones.map((z) => ({ value: z.id, label: `${z.code} - ${z.name}` }));
  const branchOptions = branches.map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));
  const userOptions = users.map((u) => ({ value: u.id, label: u.fullName || u.username }));

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/route-masters'),
      axiosClient.get('/selling-zones'),
      axiosClient.get('/branches'),
      axiosClient.get('/users'),
    ])
      .then(([routesRes, zonesRes, branchesRes, usersRes]) => {
        setRoutes(routesRes.data.data);
        setSellingZones(zonesRes.data.data);
        setBranches(branchesRes.data.data);
        setUsers(usersRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách khung tuyến'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    if (canWrite) {
      axiosClient
        .get('/customers')
        .then(({ data }) => setCustomers(data.data))
        .catch(() => setCustomers([]));
    }
  }, []);

  const filteredRoutes = routes.filter((r) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.code.toLowerCase().includes(keyword) || r.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingRoute(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRoute(record);
    form.setFieldsValue({
      ...record,
      sellingZoneId: record.sellingZone?.id,
      branchId: record.branch?.id,
      manageById: record.manageBy?.id,
      salesmanId: record.salesman?.id,
    });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/route-masters/${record.id}`)
      .then(() => {
        message.success('Đã xóa khung tuyến');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
        effectiveDate: values.effectiveDate,
        endDate: values.endDate || null,
      };
      const request = editingRoute
        ? axiosClient.put(`/route-masters/${editingRoute.id}`, payload)
        : axiosClient.post('/route-masters', payload);
      request
        .then(() => {
          message.success(editingRoute ? 'Cập nhật thành công' : 'Tạo khung tuyến thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  function openOutletModal(record) {
    setOutletRoute(record);
    setNewCustomerId(null);
    setOutletModalOpen(true);
    loadOutlets(record.id);
  }

  function loadOutlets(routeId) {
    setOutletLoading(true);
    axiosClient
      .get(`/route-masters/${routeId}/outlets`)
      .then(({ data }) => setOutlets(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách khách hàng'))
      .finally(() => setOutletLoading(false));
  }

  function handleAddOutlet() {
    if (!newCustomerId) {
      message.warning('Chọn khách hàng trước khi thêm');
      return;
    }
    axiosClient
      .post(`/route-masters/${outletRoute.id}/outlets`, { customerId: newCustomerId })
      .then(() => {
        message.success('Đã thêm khách hàng vào khung tuyến');
        setNewCustomerId(null);
        loadOutlets(outletRoute.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
  }

  function handleRemoveOutlet(outletId) {
    axiosClient
      .delete(`/route-masters/${outletRoute.id}/outlets/${outletId}`)
      .then(() => {
        message.success('Đã gỡ khách hàng khỏi khung tuyến');
        loadOutlets(outletRoute.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Gỡ thất bại'));
  }

  const assignedCustomerIds = outlets.map((o) => o.customer.id);
  const availableCustomerOptions = customers
    .filter((c) => !assignedCustomerIds.includes(c.id))
    .map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  const columns = [
    { title: 'Mã tuyến', dataIndex: 'code', key: 'code' },
    { title: 'Tên khung tuyến', dataIndex: 'name', key: 'name' },
    { title: 'Loại', dataIndex: 'type', key: 'type' },
    { title: 'Kênh', dataIndex: 'channel', key: 'channel' },
    { title: 'Vùng bán hàng', key: 'sellingZone', render: (_, r) => r.sellingZone?.name },
    { title: 'Chi nhánh', key: 'branch', render: (_, r) => r.branch?.name },
    { title: 'Ngày hiệu lực', dataIndex: 'effectiveDate', key: 'effectiveDate' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<TeamOutlined />} onClick={() => openOutletModal(record)}>
            Khách hàng
          </Button>
          {canWrite && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
              <Popconfirm title="Xóa khung tuyến này?" onConfirm={() => handleDelete(record)}>
                <Button size="small" icon={<DeleteOutlined />} danger />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý khung tuyến</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm khung tuyến"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredRoutes} loading={loading} />

      <Modal
        title={editingRoute ? `Sửa khung tuyến ${editingRoute.code}` : 'Thêm khung tuyến'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã khung tuyến" name="code" rules={[{ required: true, message: 'Mã khung tuyến không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên khung tuyến" name="name" rules={[{ required: true, message: 'Tên khung tuyến không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Loại" name="type">
            <Input placeholder="VD: MT (Modern Trade), GT (General Trade)" />
          </Form.Item>
          <Form.Item label="Kênh" name="channel">
            <Input placeholder="VD: Supermarket, Convenience Store" />
          </Form.Item>
          <Form.Item label="Danh mục bán hàng" name="sellingCategory">
            <Input />
          </Form.Item>
          <Form.Item label="Vùng bán hàng" name="sellingZoneId" rules={[{ required: true, message: 'Vùng bán hàng không được để trống' }]}>
            <Select options={zoneOptions} placeholder="Chọn vùng bán hàng" />
          </Form.Item>
          <Form.Item label="Chi nhánh" name="branchId" rules={[{ required: true, message: 'Chi nhánh không được để trống' }]}>
            <Select options={branchOptions} placeholder="Chọn chi nhánh" />
          </Form.Item>
          <Form.Item label="Người quản lý mặc định" name="manageById">
            <Select options={userOptions} placeholder="Chọn người quản lý" allowClear />
          </Form.Item>
          <Form.Item label="Nhân viên bán hàng mặc định" name="salesmanId">
            <Select options={userOptions} placeholder="Chọn nhân viên bán hàng" allowClear />
          </Form.Item>
          <Form.Item label="Ngày hiệu lực" name="effectiveDate" rules={[{ required: true, message: 'Ngày hiệu lực không được để trống' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Ngày kết thúc" name="endDate">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={outletRoute ? `Khách hàng trong tuyến ${outletRoute.code}` : 'Khách hàng trong tuyến'}
        open={outletModalOpen}
        onCancel={() => setOutletModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {canWrite && (
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn khách hàng để thêm vào tuyến"
              options={availableCustomerOptions}
              value={newCustomerId}
              onChange={setNewCustomerId}
              showSearch
              optionFilterProp="label"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOutlet}>
              Thêm
            </Button>
          </Space.Compact>
        )}
        <List
          loading={outletLoading}
          dataSource={outlets}
          locale={{ emptyText: <Empty description="Chưa có khách hàng nào trong tuyến" /> }}
          renderItem={(o) => (
            <List.Item
              actions={
                canWrite
                  ? [
                      <Popconfirm key="remove" title="Gỡ khách hàng này khỏi tuyến?" onConfirm={() => handleRemoveOutlet(o.id)}>
                        <Button size="small" icon={<DeleteOutlined />} danger />
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              <Text>{o.customer.code} - {o.customer.name}</Text>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
