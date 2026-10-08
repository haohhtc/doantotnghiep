import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Checkbox, Row, Col, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';
import { useBranch } from '../../contexts/BranchContext';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa kho.

// Khop voi warehouse_type that trong DB (xem V2__master_data.sql).
const WHSE_TYPE_OPTIONS = [
  { value: 'MAIN', label: 'Kho chính' },
  { value: 'VAN', label: 'Kho xe tải' },
  { value: 'DAMAGE', label: 'Kho hàng lỗi' },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

function whseTypeLabel(value) {
  return WHSE_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;
}

// Trang nay da noi API that (khong con mock) - xem backend/.../category/warehouse/
// WarehouseController (GET/POST/PUT/DELETE /api/warehouses).
// Loc theo Chi nhanh dang chon o Header (BranchSelector) - dong nhat UX voi trang Ton kho, thay
// cho bo loc Chi nhanh rieng cu (theo yeu cau nguoi dung). Form Them/Sua: bo o nhap Dia chi (di
// theo Chi nhanh), bo o nhap Nguoi quan ly, bo loai kho "Ky gui" (khong dung toi), khoa cung
// "Chi nhanh quan ly" theo dung Chi nhanh dang chon o Header - khong cho chon chi nhanh khac.
// canWrite tinh trong component (khong o module scope) - xem ghi chu o pages/branches/index.jsx.
export default function WarehousesPage() {
  const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');
  const { selectedBranchId, loading: branchLoading } = useBranch();
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  // Khoa cung o dung chi nhanh dang chon o Header khi tao moi - giu rieng chi nhanh cua kho dang
  // sua du no khac chi nhanh dang chon, tranh mat label (giong pattern o Don giao hang).
  const branchOptions = branches
    .filter((b) => b.id === editingWarehouse?.branch?.id || b.id === selectedBranchId)
    .map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));

  function loadData() {
    if (!selectedBranchId) return;
    setLoading(true);
    Promise.all([
      axiosClient.get('/warehouses', { params: { branchId: selectedBranchId } }),
      axiosClient.get('/branches'),
    ])
      .then(([warehousesRes, branchesRes]) => {
        setWarehouses(warehousesRes.data.data);
        setBranches(branchesRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách kho'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [selectedBranchId]);

  const filteredWarehouses = warehouses.filter((w) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !w.code.toLowerCase().includes(keyword) && !w.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.warehouseType && w.warehouseType !== filterValues.warehouseType) return false;
    if (filterValues.active && String(w.active) !== filterValues.active) return false;
    return true;
  });

  function openCreateModal() {
    setEditingWarehouse(null);
    form.resetFields();
    form.setFieldsValue({ active: true, warehouseType: 'MAIN', branchId: selectedBranchId });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingWarehouse(record);
    form.setFieldsValue({ ...record, branchId: record.branch?.id });
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
          { name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS },
        ]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredWarehouses} loading={loading || branchLoading} />

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
            </Col>
            <Col span={8}>
              <Form.Item label="Loại kho" name="warehouseType" rules={[{ required: true, message: 'Loại kho không được để trống' }]}>
                <Select options={WHSE_TYPE_OPTIONS} />
              </Form.Item>
              <Form.Item
                label="Chi nhánh quản lý"
                name="branchId"
                rules={[{ required: true, message: 'Chi nhánh không được để trống' }]}
                extra="Luôn lấy đúng chi nhánh đang chọn ở Header - không chọn chi nhánh khác được"
              >
                <Select options={branchOptions} disabled />
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
