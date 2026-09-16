import { useEffect, useState } from 'react';
import {
  Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message, List, Empty,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa.

// "Nhom san pham" that (M:N) - xem backend/.../category/productgroup/ (V20__product_group.sql).
// Master-Detail don gian: chon 1 nhom, danh sach San pham thuoc nhom, nut them/go - khong co cot
// ty le quy doi/mac dinh (khac PriceListItem). canWrite tinh trong component - xem ghi chu o
// pages/branches/index.jsx.
export default function ProductGroupsPage() {
  const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');
  const [groups, setGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemGroup, setItemGroup] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [newProductId, setNewProductId] = useState(null);

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/product-groups'), axiosClient.get('/products')])
      .then(([groupsRes, productsRes]) => {
        setGroups(groupsRes.data.data);
        setProducts(productsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách nhóm sản phẩm'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = groups.filter((g) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return g.code.toLowerCase().includes(keyword) || g.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingGroup(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingGroup(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/product-groups/${record.id}`)
      .then(() => {
        message.success('Đã xóa nhóm sản phẩm');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingGroup
        ? axiosClient.put(`/product-groups/${editingGroup.id}`, values)
        : axiosClient.post('/product-groups', values);
      request
        .then(() => {
          message.success(editingGroup ? 'Cập nhật thành công' : 'Tạo nhóm sản phẩm thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  function openItemModal(record) {
    setItemGroup(record);
    setNewProductId(null);
    setItemModalOpen(true);
    loadItems(record.id);
  }

  function loadItems(groupId) {
    setItemsLoading(true);
    axiosClient
      .get(`/product-groups/${groupId}/items`)
      .then(({ data }) => setItems(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách sản phẩm'))
      .finally(() => setItemsLoading(false));
  }

  function handleAddItem() {
    if (!newProductId) {
      message.warning('Chọn sản phẩm trước khi thêm');
      return;
    }
    axiosClient
      .post(`/product-groups/${itemGroup.id}/items`, { productId: newProductId })
      .then(() => {
        message.success('Đã thêm sản phẩm vào nhóm');
        setNewProductId(null);
        loadItems(itemGroup.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
  }

  function handleRemoveItem(itemId) {
    axiosClient
      .delete(`/product-groups/${itemGroup.id}/items/${itemId}`)
      .then(() => {
        message.success('Đã gỡ sản phẩm khỏi nhóm');
        loadItems(itemGroup.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Gỡ thất bại'));
  }

  const assignedProductIds = items.map((i) => i.product.id);
  const availableProductOptions = productOptions.filter((p) => !assignedProductIds.includes(p.value));

  const columns = [
    { title: 'Mã nhóm', dataIndex: 'code', key: 'code' },
    { title: 'Tên nhóm', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openItemModal(record)}>
            Sản phẩm
          </Button>
          {canWrite && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
              <Popconfirm title="Xóa vĩnh viễn nhóm sản phẩm này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý nhóm sản phẩm</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm nhóm sản phẩm"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingGroup ? 'Sửa nhóm sản phẩm' : 'Thêm nhóm sản phẩm'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã nhóm" name="code" rules={[{ required: true, message: 'Mã nhóm không được để trống' }]}>
            <Input placeholder="VD: NHOM-BANHKEO-TET" />
          </Form.Item>
          <Form.Item label="Tên nhóm" name="name" rules={[{ required: true, message: 'Tên nhóm không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={itemGroup ? `Sản phẩm trong nhóm - ${itemGroup.code}` : 'Sản phẩm trong nhóm'}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        footer={null}
        width={560}
        destroyOnHidden
      >
        {canWrite && (
          <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn sản phẩm để thêm"
              options={availableProductOptions}
              value={newProductId}
              onChange={setNewProductId}
              showSearch
              optionFilterProp="label"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
              Thêm
            </Button>
          </Space.Compact>
        )}
        <List
          loading={itemsLoading}
          dataSource={items}
          locale={{ emptyText: <Empty description="Nhóm chưa có sản phẩm nào" /> }}
          renderItem={(item) => (
            <List.Item
              actions={
                canWrite
                  ? [
                      <Popconfirm key="remove" title="Gỡ sản phẩm này khỏi nhóm?" onConfirm={() => handleRemoveItem(item.id)}>
                        <Button size="small" icon={<DeleteOutlined />} danger />
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              <Text>{item.product.code} - {item.product.name}</Text>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
