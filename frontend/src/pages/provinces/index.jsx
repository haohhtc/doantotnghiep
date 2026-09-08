import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa tinh/thanh pho.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Tinh/Thanh pho - xem backend/.../category/province/controller/ProvinceController.java.
export default function ProvincesPage() {
  const [provinces, setProvinces] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvince, setEditingProvince] = useState(null);
  const [form] = Form.useForm();

  const regionOptions = regions.map((r) => ({ value: r.id, label: r.name }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/provinces'), axiosClient.get('/regions')])
      .then(([provincesRes, regionsRes]) => {
        setProvinces(provincesRes.data.data);
        setRegions(regionsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách tỉnh/thành phố'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProvinces = provinces.filter((p) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !p.code.toLowerCase().includes(keyword) && !p.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.regionId && p.region?.id !== filterValues.regionId) return false;
    return true;
  });

  function openCreateModal() {
    setEditingProvince(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingProvince(record);
    form.setFieldsValue({ code: record.code, name: record.name, regionId: record.region?.id });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/provinces/${record.id}`)
      .then(() => {
        message.success('Đã xóa tỉnh/thành phố');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingProvince
        ? axiosClient.put(`/provinces/${editingProvince.id}`, values)
        : axiosClient.post('/provinces', values);
      request
        .then(() => {
          message.success(editingProvince ? 'Cập nhật thành công' : 'Tạo tỉnh/thành phố thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã tỉnh/thành phố', dataIndex: 'code', key: 'code' },
    { title: 'Tên tỉnh/thành phố', dataIndex: 'name', key: 'name' },
    { title: 'Thuộc vùng', key: 'region', render: (_, r) => r.region?.name },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn tỉnh/thành phố này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý tỉnh/thành phố</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm tỉnh/thành phố"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'regionId', label: 'Vùng', options: regionOptions }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />
      <Table rowKey="id" columns={columns} dataSource={filteredProvinces} loading={loading} />

      <Modal
        title={editingProvince ? 'Sửa tỉnh/thành phố' : 'Thêm tỉnh/thành phố'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã tỉnh/thành phố" name="code" rules={[{ required: true, message: 'Mã không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên tỉnh/thành phố" name="name" rules={[{ required: true, message: 'Tên không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Thuộc vùng" name="regionId" rules={[{ required: true, message: 'Vùng không được để trống' }]}>
            <Select options={regionOptions} placeholder="Chọn vùng" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
