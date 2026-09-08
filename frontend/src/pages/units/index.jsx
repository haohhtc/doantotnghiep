import { useEffect, useState } from 'react';
import {
  Typography, Input, InputNumber, Button, Table, Space, Modal, Form, Select,
  Popconfirm, message, Tabs, List, Empty,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import axiosClient from '../../api/axiosClient';
import { hasAnyRole } from '../../utils/auth';

const { Title, Text } = Typography;

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc them/sua/xoa.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// MDM "Uoms & Uom Groups" - thay the han trang /uoms mock cu. Xem
// backend/.../category/uom/ va backend/.../category/uomgroup/ (co sub-resource /conversions).
export default function UnitsPage() {
  return (
    <div>
      <Title level={3}>Đơn vị tính</Title>
      <Tabs
        items={[
          { key: 'uom', label: 'Đơn vị tính', children: <UomTab /> },
          { key: 'uom-group', label: 'Nhóm quy đổi', children: <UomGroupTab /> },
        ]}
      />
    </div>
  );
}

// --- Tab 1: Don vi tinh co so ---
function UomTab() {
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/uoms')
      .then(({ data }) => setUoms(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách đơn vị tính'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = uoms.filter((u) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return u.code.toLowerCase().includes(keyword) || u.name.toLowerCase().includes(keyword);
  });

  function openCreateModal() {
    setEditingUom(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingUom(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/uoms/${record.id}`)
      .then(() => {
        message.success('Đã xóa đơn vị tính');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingUom
        ? axiosClient.put(`/uoms/${editingUom.id}`, values)
        : axiosClient.post('/uoms', values);
      request
        .then(() => {
          message.success(editingUom ? 'Cập nhật thành công' : 'Tạo đơn vị tính thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  const columns = [
    { title: 'Mã đơn vị', dataIndex: 'code', key: 'code' },
    { title: 'Tên đơn vị', dataIndex: 'name', key: 'name' },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            width: 160,
            render: (_, record) => (
              <Space>
                <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
                <Popconfirm title="Xóa vĩnh viễn đơn vị tính này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm đơn vị tính"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingUom ? 'Sửa đơn vị tính' : 'Thêm đơn vị tính'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã đơn vị" name="code" rules={[{ required: true, message: 'Mã đơn vị không được để trống' }]}>
            <Input placeholder="VD: GOI" />
          </Form.Item>
          <Form.Item label="Tên đơn vị" name="name" rules={[{ required: true, message: 'Tên đơn vị không được để trống' }]}>
            <Input placeholder="VD: Gói" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// --- Tab 2: Nhom quy doi (UomGroup + UomConversion) ---
function UomGroupTab() {
  const [groups, setGroups] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [form] = Form.useForm();

  // Modal quan ly quy doi ben trong 1 nhom
  const [convModalOpen, setConvModalOpen] = useState(false);
  const [convGroup, setConvGroup] = useState(null);
  const [conversions, setConversions] = useState([]);
  const [convLoading, setConvLoading] = useState(false);
  const [newUomId, setNewUomId] = useState(null);
  const [newFactor, setNewFactor] = useState(null);

  const uomOptions = uoms.map((u) => ({ value: u.id, label: `${u.code} - ${u.name}` }));

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/uom-groups'), axiosClient.get('/uoms')])
      .then(([groupsRes, uomsRes]) => {
        setGroups(groupsRes.data.data);
        setUoms(uomsRes.data.data);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách nhóm quy đổi'))
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
    form.setFieldsValue({ code: record.code, name: record.name, baseUomId: record.baseUom?.id });
    setModalOpen(true);
  }

  function handleDelete(record) {
    axiosClient
      .delete(`/uom-groups/${record.id}`)
      .then(() => {
        message.success('Đã xóa nhóm quy đổi');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xóa thất bại'));
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const request = editingGroup
        ? axiosClient.put(`/uom-groups/${editingGroup.id}`, values)
        : axiosClient.post('/uom-groups', values);
      request
        .then(() => {
          message.success(editingGroup ? 'Cập nhật thành công' : 'Tạo nhóm quy đổi thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
    });
  }

  function openConvModal(record) {
    setConvGroup(record);
    setNewUomId(null);
    setNewFactor(null);
    setConvModalOpen(true);
    loadConversions(record.id);
  }

  function loadConversions(groupId) {
    setConvLoading(true);
    axiosClient
      .get(`/uom-groups/${groupId}/conversions`)
      .then(({ data }) => setConversions(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách quy đổi'))
      .finally(() => setConvLoading(false));
  }

  function handleAddConversion() {
    if (!newUomId || newFactor == null) {
      message.warning('Chọn đơn vị và nhập hệ số quy đổi');
      return;
    }
    axiosClient
      .post(`/uom-groups/${convGroup.id}/conversions`, { uomId: newUomId, factor: newFactor })
      .then(() => {
        message.success('Đã thêm đơn vị vào nhóm quy đổi');
        setNewUomId(null);
        setNewFactor(null);
        loadConversions(convGroup.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thêm thất bại'));
  }

  function handleRemoveConversion(conversionId) {
    axiosClient
      .delete(`/uom-groups/${convGroup.id}/conversions/${conversionId}`)
      .then(() => {
        message.success('Đã gỡ đơn vị khỏi nhóm quy đổi');
        loadConversions(convGroup.id);
      })
      .catch((err) => message.error(err.response?.data?.message || 'Gỡ thất bại'));
  }

  const assignedUomIds = conversions.map((c) => c.uom.id);
  const availableUomOptions = uomOptions.filter((o) => !assignedUomIds.includes(o.value));

  const columns = [
    { title: 'Mã nhóm', dataIndex: 'code', key: 'code' },
    { title: 'Tên nhóm', dataIndex: 'name', key: 'name' },
    { title: 'Đơn vị gốc', key: 'baseUom', render: (_, r) => r.baseUom?.name },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openConvModal(record)}>
            Quy đổi
          </Button>
          {canWrite && (
            <>
              <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
              <Popconfirm title="Xóa vĩnh viễn nhóm quy đổi này? Không thể hoàn tác." onConfirm={() => handleDelete(record)}>
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
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm nhóm quy đổi"
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={editingGroup ? 'Sửa nhóm quy đổi' : 'Thêm nhóm quy đổi'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Mã nhóm" name="code" rules={[{ required: true, message: 'Mã nhóm không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tên nhóm" name="name" rules={[{ required: true, message: 'Tên nhóm không được để trống' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Đơn vị gốc"
            name="baseUomId"
            extra="Đơn vị nhỏ nhất, hệ số quy đổi luôn = 1"
            rules={[{ required: true, message: 'Đơn vị gốc không được để trống' }]}
          >
            <Select options={uomOptions} placeholder="Chọn đơn vị gốc" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={convGroup ? `Quy đổi đơn vị - Nhóm ${convGroup.code}` : 'Quy đổi đơn vị'}
        open={convModalOpen}
        onCancel={() => setConvModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Text type="secondary">
          Hệ số = số lượng đơn vị gốc ({convGroup?.baseUom?.name}) tương đương với 1 đơn vị này.
        </Text>
        {canWrite && (
          <Space.Compact style={{ width: '100%', marginTop: 12 }}>
            <Select
              style={{ width: '55%' }}
              placeholder="Chọn đơn vị"
              options={availableUomOptions}
              value={newUomId}
              onChange={setNewUomId}
            />
            <InputNumber
              style={{ width: '25%' }}
              placeholder="Hệ số"
              min={0}
              value={newFactor}
              onChange={setNewFactor}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddConversion} style={{ width: '20%' }}>
              Thêm
            </Button>
          </Space.Compact>
        )}
        <List
          style={{ marginTop: 12 }}
          loading={convLoading}
          dataSource={conversions}
          locale={{ emptyText: <Empty description="Chưa có đơn vị nào trong nhóm" /> }}
          renderItem={(c) => (
            <List.Item
              actions={
                canWrite
                  ? [
                      <Popconfirm key="remove" title="Gỡ đơn vị này khỏi nhóm?" onConfirm={() => handleRemoveConversion(c.id)}>
                        <Button size="small" icon={<DeleteOutlined />} danger />
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              <Text>
                {c.uom.name} — 1 {c.uom.code} = {Number(c.factor).toLocaleString('vi-VN')} {convGroup?.baseUom?.code}
              </Text>
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
