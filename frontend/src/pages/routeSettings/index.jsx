import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa giao tuyen.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Module "Tuyen ban hang" (theo yeu cau TV2) - xem backend/.../category/routesetting/controller/RouteSettingController.java.
// 1 RouteMaster co the duoc nhieu RouteSetting tham chieu toi (doi sales person theo tung giai
// doan ma khong can tao lai khung tuyen) - xem ghi chu trong tuyen-ban-hang-overview.html.
export default function RouteSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [routeMasters, setRouteMasters] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [form] = Form.useForm();

  const routeMasterOptions = routeMasters.map((r) => ({ value: r.id, label: `${r.code} - ${r.name}` }));
  const userOptions = users.map((u) => ({ value: u.id, label: u.fullName || u.username }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/route-settings'), axiosClient.get('/route-masters'), axiosClient.get('/users')])
      .then(([settingsRes, routesRes, usersRes]) => {
        setSettings(settingsRes.data.data);
        setRouteMasters(routesRes.data.data);
        setUsers(usersRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách giao tuyến'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredSettings = settings.filter((s) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return s.code.toLowerCase().includes(keyword) || s.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingSetting(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingSetting(record);
    form.setFieldsValue({
      ...record,
      routeMasterId: record.routeMaster?.id,
      salesPersonId: record.salesPerson?.id,
      manageById: record.manageBy?.id,
    });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/route-settings/${record.id}`)
      .then(() => {
        message.success('Đã xóa giao tuyến');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const payload = { ...values, endDate: values.endDate || null };
      const request = editingSetting
        ? axiosClient.put(`/route-settings/${editingSetting.id}`, payload)
        : axiosClient.post('/route-settings', payload);
      request
        .then(() => {
          message.success(editingSetting ? 'Cập nhật thành công' : 'Tạo giao tuyến thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã giao tuyến', dataIndex: 'code', key: 'code' },
    { title: 'Tên giao tuyến', dataIndex: 'name', key: 'name' },
    { title: 'Khung tuyến', key: 'routeMaster', render: (_, r) => r.routeMaster?.name },
    { title: 'Người phụ trách', key: 'salesPerson', render: (_, r) => r.salesPerson?.fullName || r.salesPerson?.username },
    { title: 'Người quản lý', key: 'manageBy', render: (_, r) => r.manageBy?.fullName || r.manageBy?.username || '-' },
    { title: 'Ngày hiệu lực', dataIndex: 'effectiveDate', key: 'effectiveDate' },
    { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate', render: (v) => v || '-' },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa giao tuyến này?" onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý giao tuyến vận hành</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm giao tuyến"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredSettings} loading={loading} />

      <Modal
        title={editingSetting ? `Sửa giao tuyến ${editingSetting.code}` : 'Thêm giao tuyến'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã giao tuyến" name="code" rules={[{ required: true, message: 'Mã giao tuyến không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên giao tuyến" name="name" rules={[{ required: true, message: 'Tên giao tuyến không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Khung tuyến" name="routeMasterId" rules={[{ required: true, message: 'Khung tuyến không được để trống' }]}>
            <Select options={routeMasterOptions} placeholder="Chọn khung tuyến" />
          </Form.Item>
          <Form.Item label="Người phụ trách (Sales Person)" name="salesPersonId" rules={[{ required: true, message: 'Người phụ trách không được để trống' }]}>
            <Select options={userOptions} placeholder="Chọn nhân viên bán hàng" />
          </Form.Item>
          <Form.Item label="Người quản lý" name="manageById">
            <Select options={userOptions} placeholder="Chọn người quản lý" allowClear />
          </Form.Item>
          <Form.Item label="Ngày hiệu lực" name="effectiveDate" rules={[{ required: true, message: 'Ngày hiệu lực không được để trống' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Ngày kết thúc" name="endDate">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
