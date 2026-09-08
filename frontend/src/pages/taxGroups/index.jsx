import { useEffect, useState } from 'react';
import { Typography, Input, InputNumber, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa nhom thue.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// MDM "Tax Group" - xem backend/.../category/taxgroup/controller/TaxGroupController.java.
export default function TaxGroupsPage() {
  const [taxGroups, setTaxGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaxGroup, setEditingTaxGroup] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/tax-groups')
      .then(({ data }) => setTaxGroups(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách nhóm thuế'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = taxGroups.filter((t) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return t.code.toLowerCase().includes(keyword) || t.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingTaxGroup(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingTaxGroup(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/tax-groups/${record.id}`)
      .then(() => {
        message.success('Đã xóa nhóm thuế');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingTaxGroup
        ? axiosClient.put(`/tax-groups/${editingTaxGroup.id}`, values)
        : axiosClient.post('/tax-groups', values);
      request
        .then(() => {
          message.success(editingTaxGroup ? 'Cập nhật thành công' : 'Tạo nhóm thuế thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã nhóm thuế', dataIndex: 'code', key: 'code' },
    { title: 'Tên nhóm thuế', dataIndex: 'name', key: 'name' },
    {
      title: 'Thuế suất',
      dataIndex: 'ratePercent',
      key: 'ratePercent',
      align: 'right',
      render: (v) => `${Number(v).toLocaleString('vi-VN')}%`,
    },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn nhóm thuế này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Quản lý nhóm thuế</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm nhóm thuế"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingTaxGroup ? 'Sửa nhóm thuế' : 'Thêm nhóm thuế'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã nhóm thuế" name="code" rules={[{ required: true, message: 'Mã nhóm thuế không được để trống' }]}>
            <Input placeholder="VD: VAT10" />
          </Form.Item>
          <Form.Item label="Tên nhóm thuế" name="name" rules={[{ required: true, message: 'Tên nhóm thuế không được để trống' }]}>
            <Input placeholder="VD: Thuế GTGT 10%" />
          </Form.Item>
          <Form.Item label="Thuế suất (%)" name="ratePercent" rules={[{ required: true, message: 'Thuế suất không được để trống' }]}>
            <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
