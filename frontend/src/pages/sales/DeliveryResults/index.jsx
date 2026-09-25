import { useEffect, useState } from 'react';
import { Typography, Table, message } from 'antd';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

// Ket qua giao hang - doc danh sach Don giao hang da Xac nhan (status=CLOSED) tu
// GET /api/delivery-orders - day la nhung don da THUC SU xuat kho (khac voi Don hang ban chi moi
// duyet - xem V33 + DeliveryOrderService).
export default function DeliveryResultsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/delivery-orders')
      .then(({ data }) => setOrders(data.data.filter((o) => o.status === 'CLOSED')))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách đơn giao hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = orders.filter((o) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return o.docNumber.toLowerCase().includes(keyword) || (o.salesOrder?.customer?.name || '').toLowerCase().includes(keyword);
  });

  const columns = [
    { title: 'Số đơn giao', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Đơn hàng bán', key: 'salesOrder', render: (_, o) => o.salesOrder?.docNumber },
    { title: 'Khách hàng', key: 'customer', render: (_, o) => o.salesOrder?.customer?.name },
    { title: 'Kho xuất', key: 'warehouse', render: (_, o) => o.warehouse?.name },
    { title: 'Người xác nhận', key: 'confirmedBy', render: (_, o) => o.confirmedBy?.fullName || o.confirmedBy?.username || '-' },
    { title: 'Ngày xác nhận giao hàng', dataIndex: 'updatedAt', key: 'updatedAt', render: (v) => (v ? v.slice(0, 10) : '-') },
    {
      title: 'Số lượng SP',
      key: 'items',
      render: (_, o) => o.items.map((it) => `${it.product.code} x${Number(it.quantity)} ${it.uom?.name || ''}`.trim()).join(', '),
    },
  ];

  return (
    <div>
      <Title level={3}>Kết quả giao hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số đơn hoặc khách hàng..."
        onReload={loadData}
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />
    </div>
  );
}
