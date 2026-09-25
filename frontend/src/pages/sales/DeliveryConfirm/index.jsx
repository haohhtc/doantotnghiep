import { useEffect, useState } from 'react';
import { Typography, Table, Tag, Space, Button, Popconfirm, message, Tooltip, Modal } from 'antd';
import { CheckOutlined, UserOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

// Xac nhan giao hang - worklist rieng cho nhan vien kho: chi hien Don giao hang con DRAFT (chua
// xac nhan), bam Xac nhan moi that su tru ton kho (theo dung so luong giao thuc te da khai bao o
// trang "Don giao hang"). Tach rieng man hinh voi "Don giao hang" giong dung pattern Goods Receipt
// PO Confirmation trong DMS that: nguoi lap lenh va nguoi xac nhan xuat kho la 2 vai khac nhau.
export default function DeliveryConfirmPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmedByModalOpen, setConfirmedByModalOpen] = useState(false);

  const orders = allOrders.filter((o) => o.status === 'DRAFT');

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/delivery-orders')
      .then(({ data }) => setAllOrders(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách đơn giao hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = orders.filter((o) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return o.docNumber.toLowerCase().includes(keyword) || o.salesOrder.docNumber.toLowerCase().includes(keyword);
  });

  function handleConfirm(record) {
    setConfirmingId(record.id);
    axiosClient
      .post(`/delivery-orders/${record.id}/confirm`)
      .then(() => {
        message.success('Đã xác nhận giao hàng - hàng đã chuyển sang Kho xe tải');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'))
      .finally(() => setConfirmingId(null));
  }

  const columns = [
    { title: 'Số đơn giao', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày lập', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Đơn hàng bán', key: 'salesOrder', render: (_, r) => r.salesOrder?.docNumber },
    { title: 'Khách hàng', key: 'customer', render: (_, r) => r.salesOrder?.customer?.name },
    { title: 'Kho xuất', key: 'warehouse', render: (_, r) => r.warehouse?.name },
    {
      title: 'Số lượng SP',
      key: 'items',
      render: (_, r) => r.items.map((it) => `${it.product.code} x${Number(it.quantity)} ${it.uom?.name || ''}`.trim()).join(', '),
    },
    { title: 'Trạng thái', key: 'status', render: () => <Tag color="gold">Chờ xác nhận</Tag> },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Xác nhận đã giao hàng này?"
            description="Hàng chuyển từ Kho chính sang Kho xe tải của chi nhánh (Kho chính giảm, Kho xe tải tăng) đúng số lượng khai báo, không thể sửa/hủy. Tồn thực tế chỉ giảm hẳn khi xuất hóa đơn."
            onConfirm={() => handleConfirm(record)}
          >
            <Button icon={<CheckOutlined />} type="primary" ghost loading={confirmingId === record.id}>
              Xác nhận giao hàng
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Xác nhận giao hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số đơn giao hoặc số đơn bán..."
        onReload={loadData}
        betweenReloadExport={
          <Tooltip title="Người xác nhận giao hàng">
            <Button icon={<UserOutlined />} onClick={() => setConfirmedByModalOpen(true)} />
          </Tooltip>
        }
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title="Người xác nhận giao hàng"
        open={confirmedByModalOpen}
        onCancel={() => setConfirmedByModalOpen(false)}
        footer={<Button onClick={() => setConfirmedByModalOpen(false)}>Đóng</Button>}
        width={640}
        destroyOnHidden
      >
        <Table
          rowKey="id"
          size="small"
          dataSource={allOrders}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Số đơn giao', dataIndex: 'docNumber', key: 'docNumber' },
            { title: 'Đơn hàng bán', key: 'salesOrder', render: (_, r) => r.salesOrder?.docNumber },
            {
              title: 'Trạng thái',
              key: 'status',
              render: (_, r) => (r.status === 'CLOSED' ? <Tag color="green">Đã xác nhận</Tag> : <Tag color="gold">Chờ xác nhận</Tag>),
            },
            {
              title: 'Người xác nhận',
              key: 'confirmedBy',
              render: (_, r) => r.confirmedBy?.fullName || r.confirmedBy?.username || '-',
            },
          ]}
        />
      </Modal>
    </div>
  );
}
