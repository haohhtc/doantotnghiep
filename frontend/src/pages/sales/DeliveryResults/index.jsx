import { useEffect, useState } from 'react';
import { Typography, Table, message } from 'antd';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

// Delivery Results - khong co bang/API moi, loc lai danh sach don status=CONFIRMED tu
// GET /api/sales-orders san co - xem tonghop.md.
export default function DeliveryResultsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/sales-orders')
      .then(({ data }) => setOrders(data.data.filter((o) => o.status === 'CONFIRMED')))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách đơn hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = orders.filter((o) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return o.docNumber.toLowerCase().includes(keyword) || (o.customer?.name || '').toLowerCase().includes(keyword);
  });

  const columns = [
    { title: 'Số đơn', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Ngày đặt hàng', dataIndex: 'docDate', key: 'docDate' },
    { title: 'Khách hàng', key: 'customer', render: (_, o) => o.customer?.name },
    { title: 'Kho xuất', key: 'warehouse', render: (_, o) => o.warehouse?.name },
    { title: 'Ngày xác nhận (giao hàng)', dataIndex: 'updatedAt', key: 'updatedAt', render: (v) => (v ? v.slice(0, 10) : '-') },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (v) => Number(v).toLocaleString('vi-VN') + ' đ',
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
