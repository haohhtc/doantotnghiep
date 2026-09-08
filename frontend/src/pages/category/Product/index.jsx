import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Space, Modal, Form, Select, Checkbox, Popconfirm, message,
  List, Empty, Tooltip,
} from 'antd';
import { EditOutlined, DeleteOutlined, ShopOutlined, PlusOutlined } from '@ant-design/icons';
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
  const [uoms, setUoms] = useState([]);
  const [uomGroups, setUomGroups] = useState([]);
  const [taxGroups, setTaxGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  // Modal "Chi nhanh ap dung" (Item-Branch Assignment)
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchModalProduct, setBranchModalProduct] = useState(null);
  const [assignedBranches, setAssignedBranches] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [newBranchId, setNewBranchId] = useState(null);

  // Modal "Phan bo theo chi nhanh" (chieu nguoc: chon 1 chi nhanh, xem/quan ly cac san pham
  // dang ap dung o chi nhanh do) - nut icon rieng tren toolbar, xem GET/POST/DELETE
  // /api/branches/{id}/products o backend/.../category/branch/.
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [reverseBranchId, setReverseBranchId] = useState(null);
  const [reverseAssignedProducts, setReverseAssignedProducts] = useState([]);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [newProductId, setNewProductId] = useState(null);

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.parent ? `${c.parent.name} > ${c.name}` : c.name,
  }));
  const uomOptions = uoms.map((u) => ({ value: u.id, label: `${u.code} - ${u.name}` }));
  const uomGroupOptions = uomGroups.map((g) => ({ value: g.id, label: g.name }));
  const taxGroupOptions = taxGroups.map((t) => ({ value: t.id, label: `${t.name} (${t.ratePercent}%)` }));

  function categoryLabel(categoryId) {
    return categoryOptions.find((c) => c.value === categoryId)?.label || '';
  }

  function loadData() {
    setLoading(true);
    Promise.all([
      axiosClient.get('/products'),
      axiosClient.get('/product-categories'),
      axiosClient.get('/uoms'),
      axiosClient.get('/uom-groups'),
      axiosClient.get('/tax-groups'),
      axiosClient.get('/branches'),
    ])
      .then(([productsRes, categoriesRes, uomsRes, uomGroupsRes, taxGroupsRes, branchesRes]) => {
        setProducts(productsRes.data.data);
        setCategories(categoriesRes.data.data);
        setUoms(uomsRes.data.data);
        setUomGroups(uomGroupsRes.data.data);
        setTaxGroups(taxGroupsRes.data.data);
        setBranches(branchesRes.data.data);
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
    form.setFieldsValue({
      ...record,
      categoryId: record.category?.id,
      uomId: record.uom?.id,
      uomGroupId: record.uomGroup?.id,
      taxGroupId: record.taxGroup?.id,
    });
    setModalOpen(true);
  }

  function openBranchModal(record) {
    setBranchModalProduct(record);
    setNewBranchId(null);
    setBranchModalOpen(true);
    loadAssignedBranches(record.id);
  }

  function loadAssignedBranches(productId) {
    setAssignedLoading(true);
    axiosClient
      .get(`/products/${productId}/branches`)
      .then(({ data }) => setAssignedBranches(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách chi nhánh'))
      .finally(() => setAssignedLoading(false));
  }

  function handleAssignBranch() {
    if (!newBranchId) {
      message.warning('Chọn chi nhánh trước khi thêm');
      return;
    }
    axiosClient
      .post(`/products/${branchModalProduct.id}/branches`, { branchId: newBranchId })
      .then(() => {
        message.success('Đã phân bổ sản phẩm cho chi nhánh');
        setNewBranchId(null);
        loadAssignedBranches(branchModalProduct.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
  }

  function handleUnassignBranch(itemBranchId) {
    axiosClient
      .delete(`/products/${branchModalProduct.id}/branches/${itemBranchId}`)
      .then(() => {
        message.success('Đã gỡ phân bổ chi nhánh');
        loadAssignedBranches(branchModalProduct.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Gỡ thất bại'));
  }

  function openReverseModal() {
    setReverseBranchId(null);
    setReverseAssignedProducts([]);
    setNewProductId(null);
    setReverseModalOpen(true);
  }

  function loadReverseProducts(branchId) {
    setReverseLoading(true);
    axiosClient
      .get(`/branches/${branchId}/products`)
      .then(({ data }) => setReverseAssignedProducts(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách sản phẩm'))
      .finally(() => setReverseLoading(false));
  }

  function handleReverseBranchChange(branchId) {
    setReverseBranchId(branchId);
    setNewProductId(null);
    setReverseAssignedProducts([]);
    if (branchId) loadReverseProducts(branchId);
  }

  function handleAssignProduct() {
    if (!newProductId) {
      message.warning('Chọn sản phẩm trước khi thêm');
      return;
    }
    axiosClient
      .post(`/branches/${reverseBranchId}/products`, { productId: newProductId })
      .then(() => {
        message.success('Đã phân bổ sản phẩm cho chi nhánh');
        setNewProductId(null);
        loadReverseProducts(reverseBranchId);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
  }

  function handleUnassignProduct(itemBranchId) {
    axiosClient
      .delete(`/branches/${reverseBranchId}/products/${itemBranchId}`)
      .then(() => {
        message.success('Đã gỡ phân bổ sản phẩm');
        loadReverseProducts(reverseBranchId);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Gỡ thất bại'));
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/products/${record.id}`)
      .then(() => {
        message.success('Đã xóa sản phẩm');
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
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<ShopOutlined />} onClick={() => openBranchModal(record)} title="Chi nhánh áp dụng" />
          {canWrite && (
            <>
              <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
              <Popconfirm title="Xóa vĩnh viễn sản phẩm này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const assignedBranchIds = assignedBranches.map((a) => a.branch.id);
  const availableBranchOptions = branches
    .filter((b) => !assignedBranchIds.includes(b.id))
    .map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));

  const branchSelectOptions = branches.map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));
  const reverseAssignedProductIds = reverseAssignedProducts.map((a) => a.product.id);
  const availableProductOptions = products
    .filter((p) => !reverseAssignedProductIds.includes(p.id))
    .map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

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
        beforeFilter={
          <Tooltip title="Phân bổ theo chi nhánh">
            <Button icon={<ShopOutlined />} onClick={openReverseModal} />
          </Tooltip>
        }
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
          <Form.Item label="Đơn vị tính (cũ)" name="unit" rules={[{ required: true, message: 'Đơn vị tính không được để trống' }]}>
            <Select options={UNIT_OPTIONS} placeholder="Chọn đơn vị tính" />
          </Form.Item>
          <Form.Item label="Đơn vị tính" name="uomId">
            <Select options={uomOptions} placeholder="Chọn đơn vị tính (MDM)" allowClear />
          </Form.Item>
          <Form.Item label="Nhóm quy đổi" name="uomGroupId">
            <Select options={uomGroupOptions} placeholder="Chọn nhóm quy đổi" allowClear />
          </Form.Item>
          <Form.Item label="Nhóm thuế" name="taxGroupId">
            <Select options={taxGroupOptions} placeholder="Chọn nhóm thuế" allowClear />
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

      <Modal
        title={branchModalProduct ? `Chi nhánh áp dụng - ${branchModalProduct.code}` : 'Chi nhánh áp dụng'}
        open={branchModalOpen}
        onCancel={() => setBranchModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {canWrite && (
          <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn chi nhánh để phân bổ"
              options={availableBranchOptions}
              value={newBranchId}
              onChange={setNewBranchId}
              showSearch
              optionFilterProp="label"
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAssignBranch}>
              Thêm
            </Button>
          </Space.Compact>
        )}
        <List
          loading={assignedLoading}
          dataSource={assignedBranches}
          locale={{ emptyText: <Empty description="Sản phẩm chưa được phân bổ cho chi nhánh nào" /> }}
          renderItem={(a) => (
            <List.Item
              actions={
                canWrite
                  ? [
                      <Popconfirm key="remove" title="Gỡ chi nhánh này khỏi sản phẩm?" onConfirm={() => handleUnassignBranch(a.id)}>
                        <Button size="small" icon={<DeleteOutlined />} danger />
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              {a.branch.code} - {a.branch.name}
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title="Phân bổ sản phẩm theo chi nhánh"
        open={reverseModalOpen}
        onCancel={() => setReverseModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Select
          style={{ width: '100%', marginBottom: 12 }}
          placeholder="Chọn chi nhánh để xem/quản lý sản phẩm"
          options={branchSelectOptions}
          value={reverseBranchId}
          onChange={handleReverseBranchChange}
          showSearch
          optionFilterProp="label"
        />
        {reverseBranchId && (
          <>
            {canWrite && (
              <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn sản phẩm để phân bổ"
                  options={availableProductOptions}
                  value={newProductId}
                  onChange={setNewProductId}
                  showSearch
                  optionFilterProp="label"
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAssignProduct}>
                  Thêm
                </Button>
              </Space.Compact>
            )}
            <List
              loading={reverseLoading}
              dataSource={reverseAssignedProducts}
              locale={{ emptyText: <Empty description="Chi nhánh chưa được phân bổ sản phẩm nào" /> }}
              renderItem={(a) => (
                <List.Item
                  actions={
                    canWrite
                      ? [
                          <Popconfirm key="remove" title="Gỡ sản phẩm này khỏi chi nhánh?" onConfirm={() => handleUnassignProduct(a.id)}>
                            <Button size="small" icon={<DeleteOutlined />} danger />
                          </Popconfirm>,
                        ]
                      : []
                  }
                >
                  {a.product.code} - {a.product.name}
                </List.Item>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
