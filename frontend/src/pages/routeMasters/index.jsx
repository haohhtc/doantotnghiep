import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Checkbox, Row, Col,
  Popconfirm, message, List, Empty, Tabs,
} from 'antd';
import { EditOutlined, DeleteOutlined, TeamOutlined, PlusOutlined, UserSwitchOutlined, StopOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';
import { useBranch } from '../../contexts/BranchContext';

const { Title, Text } = Typography;

const WEEKDAY_FIELDS = [
  { name: 'monday', label: 'T2' }, { name: 'tuesday', label: 'T3' }, { name: 'wednesday', label: 'T4' },
  { name: 'thursday', label: 'T5' }, { name: 'friday', label: 'T6' }, { name: 'saturday', label: 'T7' },
  { name: 'sunday', label: 'CN' },
];
const WEEK_FIELDS = [
  { name: 'week1', label: 'Tuần 1' }, { name: 'week2', label: 'Tuần 2' },
  { name: 'week3', label: 'Tuần 3' }, { name: 'week4', label: 'Tuần 4' },
];

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa khung tuyen
// va gan/go khach hang.

// Module "Tuyen ban hang" (theo yeu cau TV2) - xem backend/.../category/routemaster/controller/RouteMasterController.java.
// Nhan su tuyen (Salesman/Manager) da chuyen sang 2 timeline doc lap route_salesman_assignment/
// route_manager_assignment (THAY THE han module RouteSetting cu) - xem tonghop.md Nhom 5.
// canWrite tinh trong component (khong o module scope) - xem ghi chu o pages/branches/index.jsx.
export default function RouteMastersPage() {
  const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');
  const { selectedBranchId } = useBranch();
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
  const [outletForm] = Form.useForm();

  // Modal "Nhan su tuyen" - 2 timeline doc lap Salesman/Manager.
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignRoute, setAssignRoute] = useState(null);
  const [assignTab, setAssignTab] = useState('salesman');
  const [salesmanAssignments, setSalesmanAssignments] = useState([]);
  const [managerAssignments, setManagerAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [assignForm] = Form.useForm();
  const [closingAssignment, setClosingAssignment] = useState(null);
  const [closeForm] = Form.useForm();

  const zoneOptions = sellingZones.map((z) => ({ value: z.id, label: `${z.code} - ${z.name}` }));
  const branchOptions = branches.map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));
  const userOptions = users.map((u) => ({ value: u.id, label: u.fullName || u.username }));
  const salesmanEmployeeOptions = employees
    .filter((e) => e.type === 'NVBH')
    .map((e) => ({ value: e.id, label: `${e.code} - ${e.fullName}` }));
  const managerEmployeeOptions = employees
    .filter((e) => e.type === 'NV')
    .map((e) => ({ value: e.id, label: `${e.code} - ${e.fullName}` }));

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
      axiosClient
        .get('/employees')
        .then(({ data }) => setEmployees(data.data))
        .catch(() => setEmployees([]));
    }
  }, []);

  const filteredRoutes = routes.filter((r) => {
    if (selectedBranchId && r.branch?.id !== selectedBranchId) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.code.toLowerCase().includes(keyword) || r.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingRoute(null);
    form.resetFields();
    setModalOpen(true);
  }

  // Chon Vung ban hang -> tu dong dien dung Chi nhanh cua vung do, khoa cung o Chi nhanh (giong
  // pattern Kho xuat o Don giao hang) - tranh lech du lieu Vung thuoc chi nhanh A nhung Khung
  // tuyen lai gan nham chi nhanh B.
  function handleZoneSelect(zoneId) {
    const zone = sellingZones.find((z) => z.id === zoneId);
    form.setFieldsValue({ branchId: zone?.branch?.id });
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
    outletForm.resetFields();
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
    outletForm.validateFields().then((values) => {
      axiosClient
        .post(`/route-masters/${outletRoute.id}/outlets`, values)
        .then(() => {
          message.success('Đã thêm khách hàng vào khung tuyến');
          outletForm.resetFields();
          loadOutlets(outletRoute.id);
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
    });
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

  // --- Nhan su tuyen (2 timeline doc lap Salesman/Manager) ---

  function openAssignModal(record) {
    setAssignRoute(record);
    setAssignTab('salesman');
    assignForm.resetFields();
    setAssignModalOpen(true);
    loadAssignments(record.id);
  }

  function loadAssignments(routeId) {
    setAssignLoading(true);
    Promise.all([
      axiosClient.get(`/route-masters/${routeId}/salesman-assignments`),
      axiosClient.get(`/route-masters/${routeId}/manager-assignments`),
    ])
      .then(([salesmanRes, managerRes]) => {
        setSalesmanAssignments(salesmanRes.data.data);
        setManagerAssignments(managerRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được nhân sự tuyến'))
      .finally(() => setAssignLoading(false));
  }

  function handleAddAssignment() {
    assignForm.validateFields().then((values) => {
      const path = assignTab === 'salesman' ? 'salesman-assignments' : 'manager-assignments';
      axiosClient
        .post(`/route-masters/${assignRoute.id}/${path}`, values)
        .then(() => {
          message.success('Đã thêm phân bổ');
          assignForm.resetFields();
          loadAssignments(assignRoute.id);
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
    });
  }

  function openCloseModal(assignment) {
    setClosingAssignment(assignment);
    closeForm.resetFields();
    closeForm.setFieldsValue({ endDate: new Date().toISOString().slice(0, 10) });
  }

  function handleCloseAssignment() {
    closeForm.validateFields().then((values) => {
      const path = assignTab === 'salesman' ? 'salesman-assignments' : 'manager-assignments';
      axiosClient
        .post(`/route-masters/${assignRoute.id}/${path}/${closingAssignment.id}/close`, values)
        .then(() => {
          message.success('Đã đóng dòng phân bổ');
          setClosingAssignment(null);
          loadAssignments(assignRoute.id);
        })
        .catch((err) => message.error(err.response?.data?.message || 'Đóng thất bại'));
    });
  }

  const currentAssignmentList = assignTab === 'salesman' ? salesmanAssignments : managerAssignments;
  const currentEmployeeOptions = assignTab === 'salesman' ? salesmanEmployeeOptions : managerEmployeeOptions;

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
          <Button size="small" icon={<UserSwitchOutlined />} onClick={() => openAssignModal(record)}>
            Nhân sự
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
            <Select options={zoneOptions} placeholder="Chọn vùng bán hàng" onChange={handleZoneSelect} />
          </Form.Item>
          <Form.Item
            label="Chi nhánh"
            name="branchId"
            rules={[{ required: true, message: 'Chi nhánh không được để trống' }]}
            extra="Luôn lấy đúng chi nhánh của Vùng bán hàng đã chọn - không chọn chi nhánh khác được"
          >
            <Select options={branchOptions} placeholder="Chọn Vùng bán hàng trước" disabled />
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
        width={640}
        destroyOnHidden
      >
        {canWrite && (
          <Form form={outletForm} layout="vertical" style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
            <Row gutter={12}>
              <Col span={16}>
                <Form.Item label="Khách hàng" name="customerId" rules={[{ required: true, message: 'Chọn khách hàng' }]} style={{ marginBottom: 8 }}>
                  <Select options={availableCustomerOptions} placeholder="Chọn khách hàng để thêm vào tuyến" showSearch optionFilterProp="label" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Thứ tự ghé thăm" name="visitOrder" style={{ marginBottom: 8 }}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Lịch ghé thăm - Thứ" style={{ marginBottom: 8 }}>
              <Space wrap>
                {WEEKDAY_FIELDS.map((d) => (
                  <Form.Item key={d.name} name={d.name} valuePropName="checked" noStyle>
                    <Checkbox>{d.label}</Checkbox>
                  </Form.Item>
                ))}
              </Space>
            </Form.Item>
            <Form.Item label="Lịch ghé thăm - Tuần trong tháng" style={{ marginBottom: 8 }}>
              <Space wrap>
                {WEEK_FIELDS.map((w) => (
                  <Form.Item key={w.name} name={w.name} valuePropName="checked" noStyle>
                    <Checkbox>{w.label}</Checkbox>
                  </Form.Item>
                ))}
              </Space>
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOutlet}>
              Thêm vào tuyến
            </Button>
          </Form>
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
              <Text>
                {o.visitOrder ? `#${o.visitOrder} - ` : ''}{o.customer.code} - {o.customer.name}
              </Text>
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title={assignRoute ? `Nhân sự tuyến ${assignRoute.code}` : 'Nhân sự tuyến'}
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        <Tabs
          activeKey={assignTab}
          onChange={setAssignTab}
          items={[
            { key: 'salesman', label: 'Nhân viên bán hàng' },
            { key: 'manager', label: 'Quản lý' },
          ]}
        />
        {canWrite && (
          <Form form={assignForm} layout="inline" style={{ marginBottom: 16 }}>
            <Form.Item name="employeeId" rules={[{ required: true, message: 'Chọn nhân viên' }]}>
              <Select
                options={currentEmployeeOptions}
                placeholder={assignTab === 'salesman' ? 'Chọn NVBH' : 'Chọn quản lý'}
                style={{ width: 220 }}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item name="effectiveDate" rules={[{ required: true, message: 'Ngày hiệu lực' }]}>
              <Input type="date" placeholder="Ngày hiệu lực" />
            </Form.Item>
            <Form.Item name="endDate" extra="Bỏ trống nếu khung tuyến chưa có ngày kết thúc">
              <Input type="date" placeholder="Ngày kết thúc (nếu có)" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAssignment}>
                Thêm
              </Button>
            </Form.Item>
          </Form>
        )}
        <List
          loading={assignLoading}
          dataSource={currentAssignmentList}
          locale={{ emptyText: <Empty description="Chưa có phân bổ nào" /> }}
          renderItem={(a) => {
            const isOpen = !a.endDate || new Date(a.endDate) >= new Date(new Date().toDateString());
            return (
              <List.Item
                actions={
                  canWrite && isOpen
                    ? [
                        <Button key="close" size="small" icon={<StopOutlined />} onClick={() => openCloseModal(a)}>
                          Đóng
                        </Button>,
                      ]
                    : []
                }
              >
                <Space>
                  <Text>{a.employee.code} - {a.employee.fullName}</Text>
                  <Text type="secondary">{a.effectiveDate} → {a.endDate || 'chưa kết thúc'}</Text>
                  {isOpen ? <Tag color="green">Đang hoạt động</Tag> : <Tag>Đã đóng</Tag>}
                </Space>
              </List.Item>
            );
          }}
        />
      </Modal>

      <Modal
        title="Đóng dòng phân bổ"
        open={!!closingAssignment}
        onOk={handleCloseAssignment}
        onCancel={() => setClosingAssignment(null)}
        okText="Xác nhận đóng"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item
            label="Ngày kết thúc"
            name="endDate"
            rules={[{ required: true, message: 'Ngày kết thúc không được để trống' }]}
            extra="Phải từ hôm nay trở đi, không được lùi về quá khứ."
          >
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
