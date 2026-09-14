import { useEffect, useState } from 'react';
import { Typography, Table, message } from 'antd';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;

// Trang nay da noi API that (khong con mock) - xem backend/.../inventory/controller/StockController.java.
// Cot "Committed" khong co trong bang stock that - tinh song song bang tong SL cac dong
// sales_order dang PENDING cung product+warehouse (goi them GET /api/sales-orders).
export default function InventoriesPage() {
  const [stockRows, setStockRows] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  function loadData() {
    setLoading(true);
    Promise.all([axiosClient.get('/stock'), axiosClient.get('/sales-orders')])
      .then(([stockRes, ordersRes]) => {
        setStockRows(stockRes.data.data);
        setPendingOrders(ordersRes.data.data.filter((o) => o.status === 'PENDING'));
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu tồn kho'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  function committedOf(productId, warehouseId) {
    let total = 0;
    pendingOrders.forEach((o) => {
      if (o.warehouse?.id !== warehouseId) return;
      o.details.forEach((d) => {
        if (d.product?.id === productId) total += Number(d.quantity);
      });
    });
    return total;
  }

  const filteredStock = stockRows.filter((s) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return s.product.code.toLowerCase().includes(keyword) || s.product.name.toLowerCase().includes(keyword);
  });

  const columns = [
    { title: 'Mã SP', dataIndex: ['product', 'code'], key: 'productCode' },
    { title: 'Tên SP', dataIndex: ['product', 'name'], key: 'productName' },
    { title: 'Kho', dataIndex: ['warehouse', 'name'], key: 'warehouse' },
    { title: 'Tồn thực tế', dataIndex: 'quantity', key: 'quantity', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') },
    {
      title: 'Đã đặt hàng',
      key: 'committed',
      align: 'right',
      render: (_, r) => committedOf(r.product.id, r.warehouse.id).toLocaleString('vi-VN'),
    },
    {
      title: 'Sẵn sàng bán',
      key: 'available',
      align: 'right',
      render: (_, r) => {
        const available = Number(r.quantity) - committedOf(r.product.id, r.warehouse.id);
        return <Text type={available < 0 ? 'danger' : undefined}>{available.toLocaleString('vi-VN')}</Text>;
      },
    },
  ];

  return (
    <div>
      <Title level={3}>Báo cáo tồn kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..."
        onReload={loadData}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredStock} loading={loading} />
    </div>
  );
}
