import { useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Space, Modal, Form, Select, Checkbox, Popconfirm, message,
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import ActiveStatus from '../../../components/ActiveStatus';

const { Title } = Typography;
const { TextArea } = Input;

// Khop voi danh muc mock trong pages/category/ProductCategory va don vi tinh mock trong pages/uoms.
const CATEGORY_OPTIONS = [
  { value: 'NUOCNGOT', label: 'Nước ngọt' },
  { value: 'NUOCSUOI', label: 'Nước suối' },
  { value: 'DOHOP', label: 'Đồ hộp' },
  { value: 'BANHKEO', label: 'Bánh kẹo' },
];

const UNIT_OPTIONS = [
  { value: 'GOI', label: 'GÓI' },
  { value: 'HOP', label: 'HỘP' },
  { value: 'THUNG', label: 'THÙNG' },
  { value: 'TUI', label: 'TÚI' },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

// Du lieu mau (100% mock, khong goi API that) - theo dung cau truc bang Items trong ui-reference/01-danh-muc.
// Backend da co san ProductController/Service that (category/product/), co the noi API sau.
const INITIAL_PRODUCTS = [
  { id: 1, code: 'SP001', name: 'Nước ngọt Cola lon 330ml', foreignName: 'Cola Soft Drink 330ml', category: 'NUOCNGOT', unit: 'THUNG', price: 180000, description: '1 thùng 24 lon', active: true },
  { id: 2, code: 'SP002', name: 'Nước suối 500ml', foreignName: 'Mineral Water 500ml', category: 'NUOCSUOI', unit: 'THUNG', price: 90000, description: '1 thùng 24 chai', active: true },
  { id: 3, code: 'SP003', name: 'Cá hộp sốt cà', foreignName: 'Canned Fish in Tomato Sauce', category: 'DOHOP', unit: 'HOP', price: 25000, description: '', active: true },
  { id: 4, code: 'SP004', name: 'Bánh quy bơ', foreignName: 'Butter Cookies', category: 'BANHKEO', unit: 'GOI', price: 15000, description: '', active: true },
  { id: 5, code: 'SP005', name: 'Kẹo dẻo trái cây', foreignName: 'Fruit Jelly Candy', category: 'BANHKEO', unit: 'TUI', price: 32000, description: '', active: false },
];

// TODO: day la trang UI mau (mock 100%). Backend co san ProductController/Service that
// (xem backend/.../category/product/) - noi qua axiosClient khi can du lieu that.
export default function ProductPage() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  function categoryLabel(code) {
    return CATEGORY_OPTIONS.find((c) => c.value === code)?.label || code;
  }

  const filteredProducts = products.filter((p) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !p.code.toLowerCase().includes(keyword) && !p.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.category && p.category !== filterValues.category) return false;
    if (filterValues.active && String(p.active) !== filterValues.active) return false;
    return true;
  });

  function openCreateModal() {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ active: true, price: 0 });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setProducts((prev) => prev.filter((p) => p.id !== record.id));
    message.success('Đã xóa sản phẩm');
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingProduct) {
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...values } : p)));
        message.success('Cập nhật thành công');
      } else {
        const newProduct = { id: Date.now(), ...values };
        setProducts((prev) => [newProduct, ...prev]);
        message.success('Tạo sản phẩm thành công');
      }
      setModalOpen(false);
    });
  }

  const columns = [
    { title: 'Mã sản phẩm', dataIndex: 'code', key: 'code' },
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Tên nước ngoài', dataIndex: 'foreignName', key: 'foreignName' },
    { title: 'Danh mục', dataIndex: 'category', key: 'category', render: (v) => categoryLabel(v) },
    { title: 'Đơn vị tính', dataIndex: 'unit', key: 'unit' },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (v) => v?.toLocaleString('vi-VN') + ' đ',
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
          <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý sản phẩm</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={openCreateModal}
        addTooltip="Thêm sản phẩm"
        onReload={() => {
          setProducts(INITIAL_PRODUCTS);
          setSearchText('');
          setFilterValues({});
        }}
        filters={[
          { name: 'category', label: 'Danh mục', options: CATEGORY_OPTIONS },
          { name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS },
        ]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredProducts} />

      <Modal
        title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã sản phẩm" name="code" rules={[{ required: true, message: 'Mã sản phẩm không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true, message: 'Tên sản phẩm không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên nước ngoài" name="foreignName">
            <Input />
          </Form.Item>
          <Form.Item label="Danh mục" name="category" rules={[{ required: true, message: 'Danh mục không được để trống' }]}>
            <Select options={CATEGORY_OPTIONS} placeholder="Chọn danh mục" />
          </Form.Item>
          <Form.Item label="Đơn vị tính" name="unit" rules={[{ required: true, message: 'Đơn vị tính không được để trống' }]}>
            <Select options={UNIT_OPTIONS} placeholder="Chọn đơn vị tính" />
          </Form.Item>
          <Form.Item label="Giá" name="price" rules={[{ required: true, message: 'Giá không được để trống' }]}>
            <InputNumber min={0} step={1000} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Kích hoạt</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
