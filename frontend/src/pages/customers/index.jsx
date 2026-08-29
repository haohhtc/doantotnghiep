import { useState } from 'react';
import {
  Typography, Input, Button, Table, Space, Modal, Form, Checkbox, Row, Col, Tabs, Popconfirm, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';

const { Title, Text } = Typography;

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

// Du lieu mau (100% mock, khong goi API that, khong lay ten/dia chi khach hang that tu ui-reference/).
const INITIAL_CUSTOMERS = [
  {
    id: 1,
    code: 'KH00001',
    name: 'Cửa Hàng Tạp Hóa Minh Anh',
    contactPerson: 'Nguyễn Văn A',
    parentCode: '',
    taxCode: '0301234567',
    phone: '0901234567',
    email: 'minhanh@example.com',
    active: true,
    shipTos: [{ id: 1, shipToCode: 'ST001', shipToName: 'Kho chính', address: '123 Lê Lợi, Quận 1, TP.HCM' }],
  },
  {
    id: 2,
    code: 'KH00002',
    name: 'Siêu Thị Mini Thành Phát',
    contactPerson: 'Trần Thị B',
    parentCode: '',
    taxCode: '0309876543',
    phone: '0912345678',
    email: 'thanhphat@example.com',
    active: true,
    shipTos: [],
  },
  {
    id: 3,
    code: 'KH00003',
    name: 'Chi Nhánh Thành Phát 2',
    contactPerson: 'Lê Văn C',
    parentCode: 'KH00002',
    taxCode: '',
    phone: '0987654321',
    email: '',
    active: false,
    shipTos: [],
  },
];

// TODO: day la trang UI mau (mock 100%), chua co CustomerController/CustomerService o backend de noi API that.
export default function CustomersPage() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [shipTos, setShipTos] = useState([]);
  const [shipToModalOpen, setShipToModalOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();
  const [shipToForm] = Form.useForm();

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
    setShipTos([]);
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingCustomer(record);
    form.setFieldsValue(record);
    setShipTos(record.shipTos || []);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setCustomers((prev) => prev.filter((c) => c.id !== record.id));
    message.success('Đã xóa khách hàng');
  }

  function handleAddShipTo() {
    shipToForm.resetFields();
    setShipToModalOpen(true);
  }

  function handleSubmitShipTo() {
    shipToForm.validateFields().then((values) => {
      setShipTos((prev) => [...prev, { id: Date.now(), ...values }]);
      setShipToModalOpen(false);
    });
  }

  function handleRemoveShipTo(id) {
    setShipTos((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingCustomer) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...values, shipTos } : c))
        );
        message.success('Cập nhật thành công');
      } else {
        const newCustomer = { id: Date.now(), ...values, shipTos };
        setCustomers((prev) => [newCustomer, ...prev]);
        message.success('Tạo khách hàng thành công');
      }
      setModalOpen(false);
    });
  }

  const columns = [
    { title: 'Mã khách hàng', dataIndex: 'code', key: 'code' },
    { title: 'Tên khách hàng', dataIndex: 'name', key: 'name' },
    { title: 'Người liên hệ', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: 'Mã khách hàng cha', dataIndex: 'parentCode', key: 'parentCode' },
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
          <Popconfirm title="Xóa khách hàng này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const shipToColumns = [
    { title: 'Mã địa chỉ giao', dataIndex: 'shipToCode', key: 'shipToCode' },
    { title: 'Tên địa chỉ giao', dataIndex: 'shipToName', key: 'shipToName' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Button size="small" icon={<DeleteOutlined />} danger onClick={() => handleRemoveShipTo(record.id)} />
      ),
    },
  ];

  const generalInfoTab = (
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
          <Form.Item label="Mã số thuế" name="taxCode">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Người liên hệ" name="contactPerson">
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
        <Col span={12}>
          <Form.Item label="Mã khách hàng cha" name="parentCode">
            <Input placeholder="Để trống nếu là khách hàng gốc" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="active" valuePropName="checked">
        <Checkbox>Kích hoạt</Checkbox>
      </Form.Item>
    </Form>
  );

  const shipToTab = (
    <div>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="secondary">Danh sách địa chỉ giao hàng của khách hàng</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={handleAddShipTo}>
          Thêm địa chỉ
        </Button>
      </div>
      <Table
        rowKey="id"
        size="small"
        columns={shipToColumns}
        dataSource={shipTos}
        pagination={false}
        locale={{ emptyText: 'Không có dữ liệu' }}
      />
    </div>
  );

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
          setCustomers(INITIAL_CUSTOMERS);
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredCustomers} />

      <Modal
        title={editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={720}
        destroyOnHidden
      >
        <Tabs
          items={[
            { key: 'general', label: 'Thông tin chung', children: generalInfoTab },
            { key: 'shipto', label: 'Địa chỉ giao hàng', children: shipToTab },
          ]}
        />
      </Modal>

      <Modal
        title="Thêm địa chỉ giao hàng"
        open={shipToModalOpen}
        onOk={handleSubmitShipTo}
        onCancel={() => setShipToModalOpen(false)}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={shipToForm} layout="vertical">
          <Form.Item
            label="Mã địa chỉ giao"
            name="shipToCode"
            rules={[{ required: true, message: 'Mã địa chỉ giao không được để trống' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Tên địa chỉ giao" name="shipToName">
            <Input />
          </Form.Item>
          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
