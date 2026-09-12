import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Tag, Space, Modal, Form, Select, Checkbox,
  Popconfirm, message, List, Empty,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title, Text } = Typography;

const TYPE_OPTIONS = [
  { value: 'STANDARD', label: 'Standard - Giá niêm yết' },
  { value: 'CHANNEL', label: 'Channel - Giá theo kênh' },
  { value: 'CONTRACT', label: 'Contract - Giá hợp đồng' },
];

function typeTag(type) {
  if (type === 'CONTRACT') return <Tag color="purple">Contract</Tag>;
  if (type === 'CHANNEL') return <Tag color="blue">Channel</Tag>;
  return <Tag color="default">Standard</Tag>;
}

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa bang gia.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// MDM "Price List" - xem backend/.../category/pricelist/. type chi la nhan mo ta, logic tra gia
// that (customer -> branch -> product.price) nam o PriceListService.lookupPrice, duoc goi tu
// trang Sales Order khi chon san pham.
export default function PriceListsPage() {
  const [priceLists, setPriceLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState(null);
  const [form] = Form.useForm();

  // Modal quan ly dong gia ben trong 1 bang gia
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemPriceList, setItemPriceList] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [newProductId, setNewProductId] = useState(null);
  const [newUomId, setNewUomId] = useState(null);
  const [newPrice, setNewPrice] = useState(null);

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));
  const uomOptions = uoms.map((u) => ({ value: u.id, label: `${u.code} - ${u.name}` }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/price-lists'), axiosClient.get('/products'), axiosClient.get('/uoms')])
      .then(([priceListsRes, productsRes, uomsRes]) => {
        setPriceLists(priceListsRes.data.data);
        setProducts(productsRes.data.data);
        setUoms(uomsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách bảng giá'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = priceLists.filter((p) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return p.code.toLowerCase().includes(keyword) || p.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingPriceList(null);
    form.resetFields();
    form.setFieldsValue({ type: 'STANDARD', active: true });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingPriceList(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/price-lists/${record.id}`)
      .then(() => {
        message.success('Đã xóa bảng giá');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingPriceList
        ? axiosClient.put(`/price-lists/${editingPriceList.id}`, values)
        : axiosClient.post('/price-lists', values);
      request
        .then(() => {
          message.success(editingPriceList ? 'Cập nhật thành công' : 'Tạo bảng giá thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  function openItemModal(record) {
    setItemPriceList(record);
    setNewProductId(null);
    setNewUomId(null);
    setNewPrice(null);
    setItemModalOpen(true);
    loadItems(record.id);
  }

  function loadItems(priceListId) {
    setItemsLoading(true);
    axiosClient
      .get(`/price-lists/${priceListId}/items`)
      .then(({ data }) => setItems(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách giá'))
      .finally(() => setItemsLoading(false));
  }

  function handleAddItem() {
    if (!newProductId || !newUomId || newPrice == null) {
      message.warning('Chọn sản phẩm, đơn vị tính và nhập giá');
      return;
    }
    axiosClient
      .post(`/price-lists/${itemPriceList.id}/items`, { productId: newProductId, uomId: newUomId, price: newPrice })
      .then(() => {
        message.success('Đã thêm giá sản phẩm');
        setNewProductId(null);
        setNewUomId(null);
        setNewPrice(null);
        loadItems(itemPriceList.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
  }

  function handleRemoveItem(itemId) {
    axiosClient
      .delete(`/price-lists/${itemPriceList.id}/items/${itemId}`)
      .then(() => {
        message.success('Đã xóa giá sản phẩm');
        loadItems(itemPriceList.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  const columns = [
    { title: 'Mã bảng giá', dataIndex: 'code', key: 'code' },
    { title: 'Tên bảng giá', dataIndex: 'name', key: 'name' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (v) => typeTag(v) },
    {
      title: 'Hiệu lực',
      key: 'effective',
      render: (_, r) => `${r.startDate || '?'} → ${r.endDate || '?'}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (active ? <Tag color="green">Đang áp dụng</Tag> : <Tag>Ngừng áp dụng</Tag>),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openItemModal(record)}>
            Giá sản phẩm
          </Button>
          {canWrite && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
              <Popconfirm title="Xóa vĩnh viễn bảng giá này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý bảng giá</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm bảng giá"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingPriceList ? 'Sửa bảng giá' : 'Thêm bảng giá'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã bảng giá" name="code" rules={[{ required: true, message: 'Mã bảng giá không được để trống' }]}>
            <Input placeholder="VD: BG-CHUAN-2026" />
          </Form.Item>
          <Form.Item label="Tên bảng giá" name="name" rules={[{ required: true, message: 'Tên bảng giá không được để trống' }]}>
            <Input placeholder="VD: Bảng giá niêm yết 2026" />
          </Form.Item>
          <Form.Item label="Loại" name="type">
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item label="Ngày hiệu lực" name="startDate">
            <Input type="date" />
          </Form.Item>
          <Form.Item label="Ngày hết hiệu lực" name="endDate">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Đang áp dụng</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={itemPriceList ? `Giá sản phẩm - ${itemPriceList.code}` : 'Giá sản phẩm'}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        {canWrite && (
          <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
            <Select
              style={{ width: '40%' }}
              placeholder="Chọn sản phẩm"
              options={productOptions}
              value={newProductId}
              onChange={setNewProductId}
              showSearch
              optionFilterProp="label"
            />
            <Select
              style={{ width: '25%' }}
              placeholder="Đơn vị"
              options={uomOptions}
              value={newUomId}
              onChange={setNewUomId}
            />
            <InputNumber
              style={{ width: '20%' }}
              placeholder="Giá"
              min={0}
              step={1000}
              value={newPrice}
              onChange={setNewPrice}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem} style={{ width: '15%' }}>
              Thêm
            </Button>
          </Space.Compact>
        )}
        <List
          loading={itemsLoading}
          dataSource={items}
          locale={{ emptyText: <Empty description="Bảng giá chưa có sản phẩm nào" /> }}
          renderItem={(item) => (
            <List.Item
              actions={
                canWrite
                  ? [
                      <Popconfirm key="remove" title="Xóa giá sản phẩm này?" onConfirm={() => handleRemoveItem(item.id)}>
                        <Button size="small" icon={<DeleteOutlined />} danger />
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              <Text>
                {item.product.code} - {item.product.name} ({item.uom.code}): {Number(item.price).toLocaleString('vi-VN')} đ
              </Text>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
