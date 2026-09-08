import { useEffect, useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Select, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa phuong/xa.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Phuong/Xa - xem backend/.../category/ward/controller/WardController.java.
export default function WardsPage() {
  const [wards, setWards] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [form] = Form.useForm();

  const districtOptions = districts.map((d) => ({ value: d.id, label: d.name }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/wards'), axiosClient.get('/districts')])
      .then(([wardsRes, districtsRes]) => {
        setWards(wardsRes.data.data);
        setDistricts(districtsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách phường/xã'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredWards = wards.filter((w) => {
    const keyword = searchText.trim().toLowerCase();
    if (keyword && !w.code.toLowerCase().includes(keyword) && !w.name.toLowerCase().includes(keyword)) {
      return false;
    }
    if (filterValues.districtId && w.district?.id !== filterValues.districtId) return false;
    return true;
  });

  function openCreateModal() {
    setEditingWard(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingWard(record);
    form.setFieldsValue({ code: record.code, name: record.name, districtId: record.district?.id });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/wards/${record.id}`)
      .then(() => {
        message.success('Đã xóa phường/xã');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingWard
        ? axiosClient.put(`/wards/${editingWard.id}`, values)
        : axiosClient.post('/wards', values);
      request
        .then(() => {
          message.success(editingWard ? 'Cập nhật thành công' : 'Tạo phường/xã thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã phường/xã', dataIndex: 'code', key: 'code' },
    { title: 'Tên phường/xã', dataIndex: 'name', key: 'name' },
    { title: 'Thuộc quận/huyện', key: 'district', render: (_, r) => r.district?.name },
    { title: 'Thuộc tỉnh/thành phố', key: 'province', render: (_, r) => r.district?.province?.name },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn phường/xã này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý phường/xã</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm phường/xã"
        onReload={() => {
          loadData();
          setSearchText('');
          setFilterValues({});
        }}
        filters={[{ name: 'districtId', label: 'Quận/Huyện', options: districtOptions }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />
      <Table rowKey="id" columns={columns} dataSource={filteredWards} loading={loading} />

      <Modal
        title={editingWard ? 'Sửa phường/xã' : 'Thêm phường/xã'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã phường/xã" name="code" rules={[{ required: true, message: 'Mã không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên phường/xã" name="name" rules={[{ required: true, message: 'Tên không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Thuộc quận/huyện" name="districtId" rules={[{ required: true, message: 'Quận/Huyện không được để trống' }]}>
            <Select options={districtOptions} placeholder="Chọn quận/huyện" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
