import { useEffect, useState } from 'react';
import { Typography, Table, Button, Modal, Form, Input, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

// Noi duy nhat sinh so phieu cho moi loai chung tu - chi cho sua PREFIX, KHONG cho sua
// current_sequence truc tiep (tranh nhay so/trung so) - xem
// backend/.../system/controller/NumberingConfigController.java (V29).
export default function NumberingConfigsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/numbering-configs')
      .then(({ data }) => setConfigs(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được cấu hình đánh số'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  function openEditModal(record) {
    setEditing(record);
    form.setFieldsValue({ prefix: record.prefix });
    setModalOpen(true);
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      axiosClient
        .put(`/numbering-configs/${editing.id}`, values)
        .then(() => {
          message.success('Cập nhật tiền tố thành công');
          setModalOpen(false);
          loadData();
        })
        .catch((err) => message.error(err.response?.data?.message || 'Cập nhật thất bại'));
    });
  }

  const columns = [
    { title: 'Loại chứng từ', dataIndex: 'docType', key: 'docType' },
    { title: 'Tiền tố', dataIndex: 'prefix', key: 'prefix' },
    { title: 'Số hiện tại', dataIndex: 'currentSequence', key: 'currentSequence' },
    {
      title: 'Số tiếp theo (dự kiến)',
      key: 'next',
      render: (_, r) => `${r.prefix}${String(r.currentSequence + 1).padStart(4, '0')}`,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />,
    },
  ];

  return (
    <div>
      <Title level={3}>Cấu hình đánh số chứng từ</Title>
      <TableToolbar onReload={loadData} />
      <Table rowKey="id" columns={columns} dataSource={configs} loading={loading} pagination={false} />

      <Modal
        title={editing ? `Sửa tiền tố - ${editing.docType}` : 'Sửa tiền tố'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Tiền tố" name="prefix" rules={[{ required: true, message: 'Tiền tố không được để trống' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
