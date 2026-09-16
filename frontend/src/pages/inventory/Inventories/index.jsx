import { useEffect, useState } from 'react';
import { Typography, Table, message } from 'antd';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';

const { Title, Text } = Typography;

// Khop voi warehouse_type that trong DB (xem V2__master_data.sql, giong pages/warehouses).
const WHSE_TYPE_LABELS = { MAIN: 'Kho chính', VAN: 'Kho xe tải', DAMAGE: 'Kho hàng lỗi', CONSIGNMENT: 'Kho ký gửi' };

// Trang nay da noi API that - xem backend/.../inventory/controller/StockController.java.
// Loc theo Chi nhanh dang chon o Header (BranchSelector): chi hien SP thuoc chi nhanh do (theo
// Item-Branch Assignment co san, GET /api/branches/{id}/products) x 3 kho cua chi nhanh do (GET
// /api/warehouses?branchId=), moi SP luon du 3 dong ke ca ton = 0 (khong co dong nao trong bang
// stock that vi chua tung phat sinh giao dich) - build cartesian o Frontend, khong sua backend.
// Cot "Kho" doi thanh "Loai kho" (warehouseType) thay vi ten kho cu the.
// Cot "Committed" khong co trong bang stock that - tinh song song bang tong SL cac dong
// sales_order dang PENDING cung product+warehouse (goi them GET /api/sales-orders).
export default function InventoriesPage() {
  const { selectedBranchId, loading: branchLoading } = useBranch();
  const [branchProducts, setBranchProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  function loadData() {
    if (!selectedBranchId) return;
    setLoading(true);
    Promise.all([
      axiosClient.get(`/branches/${selectedBranchId}/products`),
      axiosClient.get('/warehouses', { params: { branchId: selectedBranchId } }),
      axiosClient.get('/stock'),
      axiosClient.get('/sales-orders'),
    ])
      .then(([productsRes, warehousesRes, stockRes, ordersRes]) => {
        setBranchProducts(productsRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setStockRows(stockRes.data.data);
        setPendingOrders(ordersRes.data.data.filter((o) => o.status === 'PENDING'));
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu tồn kho'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [selectedBranchId]);

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

  // Cartesian San pham (thuoc chi nhanh) x Kho (thuoc chi nhanh) - moi SP luon du 3 dong.
  const rows = [];
  branchProducts.forEach(({ product }) => {
    warehouses.forEach((warehouse) => {
      const stock = stockRows.find((s) => s.product.id === product.id && s.warehouse.id === warehouse.id);
      rows.push({
        key: `${product.id}-${warehouse.id}`,
        product,
        warehouse,
        quantity: stock ? Number(stock.quantity) : 0,
      });
    });
  });

  const filteredRows = rows.filter((r) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return r.product.code.toLowerCase().includes(keyword) || r.product.name.toLowerCase().includes(keyword);
  });

  const columns = [
    { title: 'Mã SP', dataIndex: ['product', 'code'], key: 'productCode' },
    { title: 'Tên SP', dataIndex: ['product', 'name'], key: 'productName' },
    { title: 'Loại kho', key: 'warehouseType', render: (_, r) => WHSE_TYPE_LABELS[r.warehouse.warehouseType] || r.warehouse.warehouseType },
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
        const available = r.quantity - committedOf(r.product.id, r.warehouse.id);
        return <Text type={available < 0 ? 'danger' : undefined}>{available.toLocaleString('vi-VN')}</Text>;
      },
    },
  ];

  return (
    <div>
      <Title level={3}>Tồn kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..."
        onReload={loadData}
      />

      <Table rowKey="key" columns={columns} dataSource={filteredRows} loading={loading || branchLoading} />
    </div>
  );
}
