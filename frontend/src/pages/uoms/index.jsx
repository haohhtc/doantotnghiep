import { useState } from 'react';
import { Typography, Input, Button, Table, Space, Modal, Form, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TableToolbar from '../../components/TableToolbar';
import { hasAnyRole } from '../../utils/auth';

const { Title } = Typography;

// Trang nay 100% mock (khong co backend that de goi API kiem tra quyen), nhung van an nut theo
// dung yeu cau phan quyen: SALES_STAFF chi duoc xem.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Du lieu mau (100% mock, khong goi API that) - theo dung cau truc bang Uoms trong ui-reference/01-danh-muc.
const INITIAL_UOMS = [
  { id: 1, code: 'GOI', name: 'GÓI' },
  { id: 2, code: 'THUNG', name: 'THÙNG 200mlx16l' },
  { id: 3, code: 'HOP', name: 'HỘP' },
  { id: 4, code: 'TUI', name: 'TÚI' },
  { id: 5, code: 'T30GOI', name: '1 THÙNG 30 GÓI' },
  { id: 6, code: 'T32GOI', name: '1 THÙNG 32 GÓI' },
  { id: 7, code: 'T12HOP', name: '1 THÙNG 12 HỘP' },
  { id: 8, code: 'T24HOP', name: '1 THÙNG 24 HỘP' },
];

// TODO: day la trang UI mau (mock 100%), chua co UomController/UomService o backend de noi API that.
export default function UomsPage() {
  const [uoms, setUoms] = useState(INITIAL_UOMS);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState(null);
  const [form] = Form.useForm();

  const filteredUoms = uoms.filter((u) => {
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
    setUoms((prev) => prev.filter((u) => u.id !== record.id));
    message.success('Đã xóa đơn vị tính');
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      if (editingUom) {
        setUoms((prev) => prev.map((u) => (u.id === editingUom.id ? { ...u, ...values } : u)));
        message.success('Cập nhật thành công');
      } else {
        const newUom = { id: Date.now(), ...values };
        setUoms((prev) => [newUom, ...prev]);
        message.success('Tạo đơn vị tính thành công');
      }
      setModalOpen(false);
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
                <Popconfirm title="Xóa đơn vị tính này?" onConfirm={() => handleDelete(record)}>
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
      <Title level={3}>Đơn vị tính (UOMs)</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên..."
        onAdd={canWrite ? openCreateModal : undefined}
        addTooltip="Thêm đơn vị tính"
        onReload={() => {
          setUoms(INITIAL_UOMS);
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredUoms} />

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
            <Input placeholder="VD: GÓI" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
