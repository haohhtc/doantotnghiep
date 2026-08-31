import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Space, Modal, Form, Select, Checkbox, Popconfirm, message,
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import ActiveStatus from '../../../components/ActiveStatus';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';

const { Title } = Typography;
const { TextArea } = Input;

// Don vi tinh van la danh sach tinh (mock) vi schema khong co bang UOM rieng -
// Product.unit chi la 1 field string tu do (xem V2__master_data.sql).
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

// Trang nay da noi API that (khong con mock) - xem backend/.../category/product/
// ProductController (GET/POST/PUT /api/products, DELETE = ngung kinh doanh chu khong xoa han)
// va ProductCategoryController (GET /api/product-categories, chi doc de lam danh sach chon).
// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa san pham,
// SALES_STAFF chi duoc xem (GET).
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.parent ? `${c.parent.name} > ${c.name}` : c.name,
  }));

  function categoryLabel(categoryId) {
    return categoryOptions.find((c) => c.value === categoryId)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/products'), axiosClient.get('/product-categories')])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.data.data);
        setCategories(categoriesRes.data.data);
      })
      .catch((err) => {
        message.error(err.response?.data?.message || 'Không tải được dữ liệu sản phẩm');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !p.code.toLowerCase().includes(keyword) && !p.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.category && p.category?.id !== filterValues.category) return false;
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
    form.setFieldsValue({ ...record, categoryId: record.category?.id });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/products/${record.id}`)
      .then(() => {
        message.success('Đã ngừng kinh doanh sản phẩm');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingProduct
        ? axiosClient.put(`/products/${editingProduct.id}`, values)
        : axiosClient.post('/products', values);
      request
        .then(() => {
          message.success(editingProduct ? 'Cập nhật thành công' : 'Tạo sản phẩm thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã sản phẩm', dataIndex: 'code', key: 'code' },
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    { title: 'Tên nước ngoài', dataIndex: 'foreignName', key: 'foreignName' },
    { title: 'Danh mục', key: 'category', render: (_, r) => r.category?.name },
    { title: 'Đơn vị tính', dataIndex: 'unit', key: 'unit' },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (v) => Number(v)?.toLocaleString('vi-VN') + ' đ',
    },
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
                <Popconfirm title="Ngừng kinh doanh sản phẩm này?" onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý sản phẩm</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm sản phẩm"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[
          { name: 'category', label: 'Danh mục', options: categoryOptions },
          { name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS },
        ]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredProducts} loading={loading} />

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
          <Form.Item label="Danh mục" name="categoryId" rules={[{ required: true, message: 'Danh mục không được để trống' }]}>
            <Select options={categoryOptions} placeholder="Chọn danh mục" />
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
