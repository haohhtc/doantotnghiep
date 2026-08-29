import { useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';

const { Title } = Typography;

// Du lieu mau (100% mock, khong goi API that) - theo dung cau truc bang Item Groups trong ui-reference/01-danh-muc.
// Backend da co san ProductCategoryController/Service that (category/productcategory/), co the noi API sau.
const INITIAL_CATEGORIES = [
  { id: 1, code: 'DOUONG', name: 'Đồ uống', parentId: null },
  { id: 2, code: 'THUCPHAM', name: 'Thực phẩm', parentId: null },
  { id: 3, code: 'NUOCNGOT', name: 'Nước ngọt', parentId: 1 },
  { id: 4, code: 'NUOCSUOI', name: 'Nước suối', parentId: 1 },
  { id: 5, code: 'DOHOP', name: 'Đồ hộp', parentId: 2 },
  { id: 6, code: 'BANHKEO', name: 'Bánh kẹo', parentId: 2 },
];

// TODO: day la trang UI mau (mock 100%). Backend co san ProductCategoryController/Service that
// (xem backend/.../category/productcategory/) - noi qua axiosClient khi can du lieu that.
export default function ProductCategoryPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  function parentName(parentId) {
    return categories.find((c) => c.id === parentId)?.name || '';
  }

  const parentFilterOptions = [
    { value: 'root', label: '(Chỉ danh mục gốc)' },
    ...categories.filter((c) => !c.parentId).map((c) => ({ value: String(c.id), label: c.name })),
  ];

  const filteredCategories = categories.filter((c) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !c.code.toLowerCase().includes(keyword) && !c.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.parentId === 'root' && c.parentId) return false;
    if (filterValues.parentId && filterValues.parentId !== 'root' && String(c.parentId) !== filterValues.parentId) {
      return false;
    }
    return true;
  });

  function openCreateModal() {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingCategory(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    setCategories((prev) => prev.filter((c) => c.id !== record.id));
    message.success('Đã xóa danh mục');
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingCategory) {
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? { ...c, ...values } : c)));
        message.success('Cập nhật thành công');
      } else {
        const newCategory = { id: Date.now(), ...values };
        setCategories((prev) => [newCategory, ...prev]);
        message.success('Tạo danh mục thành công');
      }
      setModalOpen(false);
    });
  }

  const columns = [
    { title: 'Mã danh mục', dataIndex: 'code', key: 'code' },
    { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
    { title: 'Danh mục cha', key: 'parent', render: (_, record) => parentName(record.parentId) || '-' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm title="Xóa danh mục này?" onConfirm={() => handleDelete(record)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý danh mục sản phẩm</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={openCreateModal}
        addTooltip="Thêm danh mục"
        onReload={() => {
          setCategories(INITIAL_CATEGORIES);
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'parentId', label: 'Danh mục cha', options: parentFilterOptions }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredCategories} />

      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã danh mục" name="code" rules={[{ required: true, message: 'Mã danh mục không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên danh mục" name="name" rules={[{ required: true, message: 'Tên danh mục không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Danh mục cha" name="parentId">
            <Select
              allowClear
              placeholder="Để trống nếu là danh mục gốc"
              options={categories
                .filter((c) => !editingCategory || c.id !== editingCategory.id)
                .map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
