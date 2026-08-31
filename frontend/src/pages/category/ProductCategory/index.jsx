import { useEffect, useState } from 'react';
import { Typography, Button, Table, Space, Modal, Form, Select, Input, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa danh muc,
// SALES_STAFF chi duoc xem (GET).
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Trang nay da noi API that (khong con mock) - xem backend/.../category/productcategory/
// ProductCategoryController (GET/POST/PUT/DELETE /api/product-categories).
export default function ProductCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/product-categories')
      .then(({ data }) => setCategories(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh mục'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const parentFilterOptions = [
    { value: 'root', label: '(Chỉ danh mục gốc)' },
    ...categories.filter((c) => !c.parent).map((c) => ({ value: String(c.id), label: c.name })),
  ];

  const filteredCategories = categories.filter((c) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !c.code.toLowerCase().includes(keyword) && !c.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.parentId === 'root' && c.parent) return false;
    if (filterValues.parentId && filterValues.parentId !== 'root' && String(c.parent?.id) !== filterValues.parentId) {
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
    form.setFieldsValue({ code: record.code, name: record.name, parentId: record.parent?.id });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/product-categories/${record.id}`)
      .then(() => {
        message.success('Đã xóa danh mục');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingCategory
        ? axiosClient.put(`/product-categories/${editingCategory.id}`, values)
        : axiosClient.post('/product-categories', values);
      request
        .then(() => {
          message.success(editingCategory ? 'Cập nhật thành công' : 'Tạo danh mục thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã danh mục', dataIndex: 'code', key: 'code' },
    { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
    { title: 'Danh mục cha', key: 'parent', render: (_, record) => record.parent?.name || '-' },
    ...(canWrite
      ? [
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
        ]
      : []),
  ];

  return (
    <div>
      <Title level={3}>Quản lý danh mục sản phẩm</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm danh mục"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'parentId', label: 'Danh mục cha', options: parentFilterOptions }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredCategories} loading={loading} />

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
