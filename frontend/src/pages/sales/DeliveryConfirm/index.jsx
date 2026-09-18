import { useEffect, useState } from 'react';
import { Typography, Table, Tag, Space, Button, Popconfirm, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

// Xac nhan giao hang - worklist rieng cho nhan vien kho: chi hien Don giao hang con DRAFT (chua
// xac nhan), bam Xac nhan moi that su tru ton kho (theo dung so luong giao thuc te da khai bao o
// trang "Don giao hang"). Tach rieng man hinh voi "Don giao hang" giong dung pattern Goods Receipt
// PO Confirmation trong DMS that: nguoi lap lenh va nguoi xac nhan xuat kho la 2 vai khac nhau.
export default function DeliveryConfirmPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/delivery-orders')
      .then(({ data }) => setOrders(data.data.filter((o) => o.status === 'DRAFT')))
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
        message.success('Đã xác nhận giao hàng - đã xuất kho');
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
      render: (_, r) => r.items.map((it) => `${it.product.code} x${Number(it.quantity)}`).join(', '),
    },
    { title: 'Trạng thái', key: 'status', render: () => <Tag color="gold">Chờ xác nhận</Tag> },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Xác nhận đã giao hàng này?"
            description="Sau khi xác nhận sẽ xuất kho đúng số lượng khai báo và không thể sửa/hủy."
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
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />
    </div>
  );
}
