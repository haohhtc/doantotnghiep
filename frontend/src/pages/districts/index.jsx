import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa quan/huyen.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Quan/Huyen/TP thuoc tinh - xem backend/.../category/district/controller/DistrictController.java.
export default function DistrictsPage() {
  const [districts, setDistricts] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [form] = Form.useForm();

  const provinceOptions = provinces.map((p) => ({ value: p.id, label: p.name }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/districts'), axiosClient.get('/provinces')])
      .then(([districtsRes, provincesRes]) => {
        setDistricts(districtsRes.data.data);
        setProvinces(provincesRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách quận/huyện'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredDistricts = districts.filter((d) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !d.code.toLowerCase().includes(keyword) && !d.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.provinceId && d.province?.id !== filterValues.provinceId) return false;
    return true;
  });

  function openCreateModal() {
    setEditingDistrict(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingDistrict(record);
    form.setFieldsValue({ code: record.code, name: record.name, provinceId: record.province?.id });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/districts/${record.id}`)
      .then(() => {
        message.success('Đã xóa quận/huyện');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingDistrict
        ? axiosClient.put(`/districts/${editingDistrict.id}`, values)
        : axiosClient.post('/districts', values);
      request
        .then(() => {
          message.success(editingDistrict ? 'Cập nhật thành công' : 'Tạo quận/huyện thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã quận/huyện', dataIndex: 'code', key: 'code' },
    { title: 'Tên quận/huyện', dataIndex: 'name', key: 'name' },
    { title: 'Thuộc tỉnh/thành phố', key: 'province', render: (_, r) => r.province?.name },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn quận/huyện này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý quận/huyện</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm quận/huyện"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'provinceId', label: 'Tỉnh/Thành phố', options: provinceOptions }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />
      <Table rowKey="id" columns={columns} dataSource={filteredDistricts} loading={loading} />

      <Modal
        title={editingDistrict ? 'Sửa quận/huyện' : 'Thêm quận/huyện'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã quận/huyện" name="code" rules={[{ required: true, message: 'Mã không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên quận/huyện" name="name" rules={[{ required: true, message: 'Tên không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Thuộc tỉnh/thành phố" name="provinceId" rules={[{ required: true, message: 'Tỉnh/Thành phố không được để trống' }]}>
            <Select options={provinceOptions} placeholder="Chọn tỉnh/thành phố" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
