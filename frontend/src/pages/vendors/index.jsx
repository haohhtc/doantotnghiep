import { useState } from 'react';
import {
  Typography, Input, Button, Table, Space, Modal, Form, Checkbox, Row, Col, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';

const { Title, Text } = Typography;

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

// Du lieu mau (100% mock, khong goi API that) - theo dung cau truc bang Vendors trong ui-reference/01-danh-muc.
const INITIAL_VENDORS = [
  {
    id: 1,
    code: 'NCC001',
    name: 'Công ty TNHH Thực Phẩm A',
    foreignName: 'A Food Co., Ltd',
    phone: '02812345678',
    email: 'lienhe@ncca.example.com',
    address: '12 Nguyễn Trãi, Quận 1, TP.HCM',
    active: true,
    details: [{ id: 1, branch: 'Chi nhánh Tân Bình', company: 'Công ty A', vendorWarehouse: 'Kho A - Tân Bình', effectiveDate: '2025-01-01', endDate: '' }],
  },
  {
    id: 2,
    code: 'NCC002',
    name: 'Công ty CP Đồ Uống B',
    foreignName: 'B Beverage JSC',
    phone: '02898765432',
    email: 'lienhe@nccb.example.com',
    address: '45 Lê Lợi, Quận 3, TP.HCM',
    active: true,
    details: [],
  },
  {
    id: 3,
    code: 'NCC003',
    name: 'Nhà cung cấp C',
    foreignName: '',
    phone: '0912345678',
    email: '',
    address: '',
    active: false,
    details: [],
  },
];

// TODO: day la trang UI mau (mock 100%), chua co VendorController/VendorService o backend de noi API that.
export default function VendorsPage() {
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

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
    setDetailRows([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingVendor(record);
    form.setFieldsValue(record);
    setDetailRows(record.details || []);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setVendors((prev) => prev.filter((v) => v.id !== record.id));
    message.success('Đã xóa nhà cung cấp');
  }

  function handleAddDetailRow() {
    detailForm.resetFields();
    setDetailModalOpen(true);
  }

  function handleSubmitDetailRow() {
    detailForm.validateFields().then((values) => {
      setDetailRows((prev) => [...prev, { id: Date.now(), ...values }]);
      setDetailModalOpen(false);
    });
  }

  function handleRemoveDetailRow(id) {
    setDetailRows((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingVendor) {
        setVendors((prev) =>
          prev.map((v) => (v.id === editingVendor.id ? { ...v, ...values, details: detailRows } : v))
        );
        message.success('Cập nhật thành công');
      } else {
        const newVendor = { id: Date.now(), ...values, details: detailRows };
        setVendors((prev) => [newVendor, ...prev]);
        message.success('Tạo nhà cung cấp thành công');
      }
      setModalOpen(false);
    });
  }

  const columns = [
    { title: 'Mã NCC', dataIndex: 'code', key: 'code' },
    { title: 'Tên nhà cung cấp', dataIndex: 'name', key: 'name' },
    { title: 'Tên nước ngoài', dataIndex: 'foreignName', key: 'foreignName' },
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
          <Popconfirm title="Xóa nhà cung cấp này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const detailColumns = [
    { title: 'Chi nhánh', dataIndex: 'branch', key: 'branch' },
    { title: 'Công ty', dataIndex: 'company', key: 'company' },
    { title: 'Kho của NCC', dataIndex: 'vendorWarehouse', key: 'vendorWarehouse' },
    { title: 'Ngày hiệu lực', dataIndex: 'effectiveDate', key: 'effectiveDate' },
    { title: 'Ngày kết thúc', dataIndex: 'endDate', key: 'endDate' },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleRemoveDetailRow(record.id)} />
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý nhà cung cấp</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={openCreateModal}
        addTooltip="Thêm nhà cung cấp"
        onReload={() => {
          setVendors(INITIAL_VENDORS);
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredVendors} />

      <Modal
        title={editingVendor ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={760}
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
              <Form.Item label="Điện thoại" name="phone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Địa chỉ" name="address">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Kích hoạt</Checkbox>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Chi tiết</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddDetailRow}>
            Thêm dòng
          </Button>
        </div>
        <Table
          rowKey="id"
          size="small"
          columns={detailColumns}
          dataSource={detailRows}
          pagination={false}
          locale={{ emptyText: 'Không có dữ liệu' }}
        />
      </Modal>

      <Modal
        title="Thêm dòng chi tiết"
        open={detailModalOpen}
        onOk={handleSubmitDetailRow}
        onCancel={() => setDetailModalOpen(false)}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={detailForm} layout="vertical">
          <Form.Item label="Chi nhánh" name="branch" rules={[{ required: true, message: 'Chi nhánh không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Công ty" name="company">
            <Input />
          </Form.Item>
          <Form.Item label="Kho của NCC" name="vendorWarehouse">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày hiệu lực" name="effectiveDate">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày kết thúc" name="endDate">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
