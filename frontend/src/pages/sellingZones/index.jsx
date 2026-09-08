import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import AddressCascadeFields from '../../components/AddressCascadeFields';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa vung ban hang.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Module "Tuyen ban hang" (theo yeu cau TV2) - xem backend/.../category/sellingzone/controller/SellingZoneController.java.
export default function SellingZonesPage() {
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [form] = Form.useForm();

  const branchOptions = branches.map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/selling-zones'), axiosClient.get('/branches')])
      .then(([zonesRes, branchesRes]) => {
        setZones(zonesRes.data.data);
        setBranches(branchesRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách vùng bán hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredZones = zones.filter((z) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return z.code.toLowerCase().includes(keyword) || z.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingZone(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingZone(record);
    form.setFieldsValue({
      ...record,
      branchId: record.branch?.id,
      regionId: record.regionRef?.id,
      provinceId: record.provinceRef?.id,
      districtId: record.districtRef?.id,
      wardId: record.wardRef?.id,
    });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/selling-zones/${record.id}`)
      .then(() => {
        message.success('Đã xóa vùng bán hàng');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingZone
        ? axiosClient.put(`/selling-zones/${editingZone.id}`, values)
        : axiosClient.post('/selling-zones', values);
      request
        .then(() => {
          message.success(editingZone ? 'Cập nhật thành công' : 'Tạo vùng bán hàng thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã vùng', dataIndex: 'code', key: 'code' },
    { title: 'Tên vùng bán hàng', dataIndex: 'name', key: 'name' },
    {
      title: 'Địa chỉ (Vùng địa lý)',
      key: 'geography',
      render: (_, r) =>
        r.wardRef
          ? `${r.wardRef.name}, ${r.districtRef?.name}, ${r.provinceRef?.name}`
          : [r.ward, r.province, r.region].filter(Boolean).join(', ') || '-',
    },
    { title: 'Chi nhánh', key: 'branch', render: (_, r) => r.branch?.name },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vùng bán hàng này?" onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý vùng bán hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm vùng bán hàng"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredZones} loading={loading} />

      <Modal
        title={editingZone ? 'Sửa vùng bán hàng' : 'Thêm vùng bán hàng'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã vùng" name="code" rules={[{ required: true, message: 'Mã vùng không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên vùng bán hàng" name="name" rules={[{ required: true, message: 'Tên vùng không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Chi nhánh" name="branchId" rules={[{ required: true, message: 'Chi nhánh không được để trống' }]}>
            <Select options={branchOptions} placeholder="Chọn chi nhánh" />
          </Form.Item>
          <AddressCascadeFields form={form} />
        </Form>
      </Modal>
    </div>
  );
}
