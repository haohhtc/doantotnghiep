import { useState } from 'react';
import {
  Typography, Input, Button, Table, Space, Modal, Form, Select, Checkbox, Row, Col, Popconfirm, message,
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';

const { Title } = Typography;

// Khop voi Whse Type quan sat trong ui-reference/01-danh-muc/kho-warehouse.png (Main/Van/Damage/Consignment).
const WHSE_TYPE_OPTIONS = [
  { value: 'Main', label: 'Kho chính' },
  { value: 'Van', label: 'Kho xe tải' },
  { value: 'Damage', label: 'Kho hàng lỗi' },
  { value: 'Consignment', label: 'Kho ký gửi' },
];

function whseTypeLabel(value) {
  return WHSE_TYPE_OPTIONS.find((o) => o.value === value)?.label || value;
}

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

// Du lieu mau (100% mock, khong goi API that) - theo dung cau truc bang Warehouse trong ui-reference/01-danh-muc.
const INITIAL_WAREHOUSES = [
  { id: 1, code: 'Q1MWH01', name: 'Kho chính Quận 1', branchName: 'Chi nhánh Quận 1', region: 'Miền Nam', province: 'TP.HCM', district: 'Quận 1', ward: 'Phường Bến Nghé', whseType: 'Main', active: true },
  { id: 2, code: 'Q1VWH01', name: 'Kho xe tải Quận 1', branchName: 'Chi nhánh Quận 1', region: 'Miền Nam', province: 'TP.HCM', district: 'Quận 1', ward: 'Phường Bến Nghé', whseType: 'Van', active: true },
  { id: 3, code: 'TBDWH01', name: 'Kho hàng lỗi Tân Bình', branchName: 'Chi nhánh Tân Bình', region: 'Miền Nam', province: 'TP.HCM', district: 'Tân Bình', ward: 'Phường 4', whseType: 'Damage', active: true },
  { id: 4, code: 'TBCWH01', name: 'Kho ký gửi Tân Bình', branchName: 'Chi nhánh Tân Bình', region: 'Miền Nam', province: 'TP.HCM', district: 'Tân Bình', ward: 'Phường 4', whseType: 'Consignment', active: false },
];

// TODO: day la trang UI mau (mock 100%), backend hien tai chua co WarehouseController de noi API that.
export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  const filteredWarehouses = warehouses.filter((w) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !w.code.toLowerCase().includes(keyword) && !w.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.whseType && w.whseType !== filterValues.whseType) return false;
    if (filterValues.active && String(w.active) !== filterValues.active) return false;
    return true;
  });

  function openCreateModal() {
    setEditingWarehouse(null);
    form.resetFields();
    form.setFieldsValue({ active: true, whseType: 'Main' });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingWarehouse(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setWarehouses((prev) => prev.filter((w) => w.id !== record.id));
    message.success('Đã xóa kho');
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingWarehouse) {
        setWarehouses((prev) => prev.map((w) => (w.id === editingWarehouse.id ? { ...w, ...values } : w)));
        message.success('Cập nhật thành công');
      } else {
        const newWarehouse = { id: Date.now(), ...values };
        setWarehouses((prev) => [newWarehouse, ...prev]);
        message.success('Tạo kho thành công');
      }
      setModalOpen(false);
    });
  }

  const columns = [
    { title: '#', key: 'index', width: 50, render: (_, __, index) => index + 1 },
    { title: 'Mã kho', dataIndex: 'code', key: 'code' },
    { title: 'Tên kho', dataIndex: 'name', key: 'name' },
    { title: 'Tên chi nhánh', dataIndex: 'branchName', key: 'branchName' },
    { title: 'Loại kho', dataIndex: 'whseType', key: 'whseType', render: (v) => whseTypeLabel(v) },
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
          <Popconfirm title="Xóa kho này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={openCreateModal}
        addTooltip="Thêm kho"
        onReload={() => {
          setWarehouses(INITIAL_WAREHOUSES);
          setSearchText('');
          setFilterValues({});
        }}
        filters={[
          { name: 'whseType', label: 'Loại kho', options: WHSE_TYPE_OPTIONS },
          { name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS },
        ]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredWarehouses} />

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
              <Form.Item label="Chi nhánh" name="branchName" rules={[{ required: true, message: 'Chi nhánh không được để trống' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Vùng" name="region">
                <Input />
              </Form.Item>
              <Form.Item label="Tỉnh/Thành phố" name="province">
                <Input />
              </Form.Item>
              <Form.Item label="Quận/Huyện" name="district">
                <Input />
              </Form.Item>
              <Form.Item label="Phường/Xã" name="ward">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Loại kho" name="whseType" rules={[{ required: true, message: 'Loại kho không được để trống' }]}>
                <Select options={WHSE_TYPE_OPTIONS} />
              </Form.Item>
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
