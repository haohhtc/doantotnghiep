import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Checkbox, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import ActiveStatus from '../../components/ActiveStatus';
import AddressCascadeFields from '../../components/AddressCascadeFields';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

const ACTIVE_FILTER_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa chi nhanh.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Module "Tuyen ban hang" (theo yeu cau TV2) - xem backend/.../category/branch/controller/BranchController.java.
export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [company, setCompany] = useState(null);
  const [priceLists, setPriceLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  // Chi co dung 1 Cong ty (singleton) - van dung Select de dong nhat UI voi cac form khac.
  const companyOptions = company ? [{ value: company.id, label: company.name }] : [];
  const priceListOptions = priceLists.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/branches'), axiosClient.get('/company'), axiosClient.get('/price-lists')])
      .then(([branchesRes, companyRes, priceListsRes]) => {
        setBranches(branchesRes.data.data);
        setCompany(companyRes.data.data);
        setPriceLists(priceListsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách chi nhánh'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredBranches = branches.filter((b) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !b.code.toLowerCase().includes(keyword) && !b.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.active && String(b.active) !== filterValues.active) return false;
    return true;
  });

  function openCreateModal() {
    setEditingBranch(null);
    form.resetFields();
    form.setFieldsValue({ active: true, companyId: company?.id });
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingBranch(record);
    form.setFieldsValue({
      ...record,
      companyId: record.company?.id,
      priceListId: record.priceList?.id,
      regionId: record.region?.id,
      provinceId: record.province?.id,
      districtId: record.district?.id,
      wardId: record.ward?.id,
    });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/branches/${record.id}`)
      .then(() => {
        message.success('Đã xóa chi nhánh');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingBranch
        ? axiosClient.put(`/branches/${editingBranch.id}`, values)
        : axiosClient.post('/branches', values);
      request
        .then(() => {
          message.success(editingBranch ? 'Cập nhật thành công' : 'Tạo chi nhánh thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã chi nhánh', dataIndex: 'code', key: 'code' },
    { title: 'Tên chi nhánh', dataIndex: 'name', key: 'name' },
    { title: 'Công ty', key: 'company', render: (_, r) => r.company?.name || '-' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    {
      title: 'Vùng địa lý',
      key: 'geography',
      render: (_, r) => (r.ward ? `${r.ward.name}, ${r.district?.name}, ${r.province?.name}` : '-'),
    },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone' },
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
                <Popconfirm title="Xóa vĩnh viễn chi nhánh này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý chi nhánh</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm chi nhánh"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'active', label: 'Trạng thái', options: ACTIVE_FILTER_OPTIONS }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredBranches} loading={loading} />

      <Modal
        title={editingBranch ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã chi nhánh" name="code" rules={[{ required: true, message: 'Mã chi nhánh không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên chi nhánh" name="name" rules={[{ required: true, message: 'Tên chi nhánh không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Công ty" name="companyId" rules={[{ required: true, message: 'Công ty không được để trống' }]}>
            <Select options={companyOptions} placeholder="Chọn công ty" />
          </Form.Item>
          <Form.Item label="Bảng giá" name="priceListId">
            <Select options={priceListOptions} placeholder="Chọn bảng giá áp dụng" allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item label="Địa chỉ" name="address">
            <Input />
          </Form.Item>
          <Form.Item label="Điện thoại" name="phone">
            <Input />
          </Form.Item>
          <AddressCascadeFields form={form} />
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Kích hoạt</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
