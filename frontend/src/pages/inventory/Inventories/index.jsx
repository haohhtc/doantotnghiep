import { useEffect, useRef, useState } from 'react';
import { Typography, Table, message, notification } from 'antd';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { useBranch } from '../../../contexts/BranchContext';

// Realtime (yeu cau giang vien, xem dalam.md "Realtime"): App Van-Sale co giao dich moi (Ung/Tra
// hang, hoa don Van Sale) thi backend phat tin hieu qua WebSocket (xem config/WebSocketConfig.java
// + InventoryEventPublisher) - KHONG kem so lieu ton kho that, chi bao "co gi vua doi" + ten NVBH,
// trang nay nhan duoc thi tu goi lai loadData() + hien thong bao, khong can F5.
const EVENT_LABEL = {
  VAN_SALE: 'vừa tạo đơn Van Sale',
  ADVANCE: 'vừa tạo phiếu Ứng hàng',
  RETURN: 'vừa tạo phiếu Trả hàng',
};
const WS_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '') + '/ws';

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
// sales_order PENDING/CONFIRMED chua giao xong (Don giao hang chua CLOSED) cung product+warehouse.
export default function InventoriesPage() {
  const { selectedBranchId, loading: branchLoading } = useBranch();
  const [branchProducts, setBranchProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [closedVanWarehouseIdByOrderId, setClosedVanWarehouseIdByOrderId] = useState({});
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
      // 2 endpoint nhe (chi vai cot can thiet) thay cho tai toan bo Don giao hang/Hoa don (4000+
      // dong moi cai) - truoc day lam trang nay cham ro ret du backend da nhanh hon nhieu.
      axiosClient.get('/delivery-orders/closed-van-mapping'),
      axiosClient.get('/invoices/active-sales-order-ids'),
    ])
      .then(([productsRes, warehousesRes, stockRes, ordersRes, vanMappingRes, activeInvoiceIdsRes]) => {
        setBranchProducts(productsRes.data.data);
        setWarehouses(warehousesRes.data.data);
        setStockRows(stockRes.data.data);
        // "Da dat hang" = don PENDING + CONFIRMED, chua xuat Hoa don, con "giu cho" o 1 trong 3
        // truong hop (khop AvailabilityService/sumCommittedBase o backend - sua V39):
        //  1) Con nam o kho nguon (Main) - chua co Don giao hang CLOSED.
        //  2) Dat thang tu kho Van (van sale truc tiep) - tinh den khi xuat Hoa don.
        //  3) Da co Don giao hang CLOSED -> hang da nam o kho Van do, van phai tinh la "giu cho"
        //     tai dung kho Van ay cho den khi xuat Hoa don (truoc day bi bo sot, hien 0 sai).
        // Chi tinh hoa don CON HIEU LUC (status != CANCELLED) - don co hoa don da Huy van phai tinh
        // la dang "giu cho" cho den khi xuat hoa don MOI thanh cong.
        const invoicedOrderIds = new Set(activeInvoiceIdsRes.data.data);
        const vanIdByOrderId = {};
        vanMappingRes.data.data.forEach((m) => { vanIdByOrderId[m.salesOrderId] = m.vanWarehouseId; });
        setClosedVanWarehouseIdByOrderId(vanIdByOrderId);
        setPendingOrders(
          ordersRes.data.data.filter((o) => {
            if (o.status !== 'PENDING' && o.status !== 'CONFIRMED') return false;
            return !invoicedOrderIds.has(o.id);
          })
        );
      })
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu tồn kho'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [selectedBranchId]);

  // Ket noi WebSocket 1 lan khi mo trang - lang nghe /topic/inventory, nhan tin hieu thi hien
  // thong bao goc man hinh + tu goi lai loadData() (xem comment dau file).
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/inventory', (msg) => {
          const { eventType, employeeName } = JSON.parse(msg.body);
          notification.open({
            message: 'Cập nhật tồn kho',
            description: `${employeeName || 'NVBH'} ${EVENT_LABEL[eventType] || 'vừa tạo giao dịch mới'}`,
            placement: 'topRight',
          });
          loadDataRef.current();
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, []);

  function committedOf(productId, warehouseId) {
    let total = 0;
    pendingOrders.forEach((o) => {
      const vanWarehouseId = closedVanWarehouseIdByOrderId[o.id];
      const stillAtSourceMain = o.warehouse?.id === warehouseId && o.warehouse?.warehouseType !== 'VAN' && vanWarehouseId == null;
      const directVanSale = o.warehouse?.id === warehouseId && o.warehouse?.warehouseType === 'VAN';
      const sittingAtThisVan = vanWarehouseId === warehouseId;
      if (!stillAtSourceMain && !directVanSale && !sittingAtThisVan) return;
      o.details.forEach((d) => {
        if (d.product?.id === productId) total += Number(d.baseQuantity ?? d.quantity);
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
