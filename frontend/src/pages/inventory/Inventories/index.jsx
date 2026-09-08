import { useEffect, useState } from 'react';
import { Typography, Table, Space, Button, Modal, InputNumber, message } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';

const { Title, Text } = Typography;

// Khop rule chung: SALES_STAFF chi duoc xem bao cao ton kho, khong tao yeu cau mua hang
// (nut nay von la UI mau/mock, khong co API that, nhung van an theo dung yeu cau phan quyen).
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Trang nay da noi API that (khong con mock) - xem backend/.../inventory/controller/StockController.java.
// Cot "Committed" khong co trong bang stock that - tinh song song bang tong SL cac dong
// sales_order dang PENDING cung product+warehouse (goi them GET /api/sales-orders).
export default function InventoriesPage() {
  const [stockRows, setStockRows] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [prQuantities, setPrQuantities] = useState({});

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

  function openPrModal() {
    const initialQty = {};
    selectedRowKeys.forEach((id) => {
      const row = stockRows.find((s) => s.id === id);
      const committed = committedOf(row.product.id, row.warehouse.id);
      const shortage = committed - row.quantity;
      initialQty[id] = shortage > 0 ? shortage : 0;
    });
    setPrQuantities(initialQty);
    setPrModalOpen(true);
  }

  function handleSubmitPr() {
    message.success(`Đã tạo yêu cầu mua hàng cho ${selectedRowKeys.length} sản phẩm`);
    setPrModalOpen(false);
    setSelectedRowKeys([]);
  }

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

  const selectedRows = stockRows.filter((s) => selectedRowKeys.includes(s.id));

  return (
    <div>
      <Title level={3}>Báo cáo tồn kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo mã hoặc tên sản phẩm..."
        onReload={loadData}
        extra={
          canWrite && (
            <Button
              icon={<ShoppingCartOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={openPrModal}
            >
              Tạo yêu cầu mua hàng
            </Button>
          )
        }
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredStock}
        loading={loading}
        rowSelection={canWrite ? { selectedRowKeys, onChange: setSelectedRowKeys } : undefined}
      />

      <Modal
        title="Tạo yêu cầu mua hàng"
        open={prModalOpen}
        onOk={handleSubmitPr}
        onCancel={() => setPrModalOpen(false)}
        okText="Xác nhận"
        cancelText="Hủy"
        destroyOnHidden
      >
        <Text type="secondary">
          Đây là UI mẫu (mock) - chưa có module Purchase Order trong phạm vi đồ án, xác nhận chỉ hiển thị thông báo.
        </Text>
        <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
          {selectedRows.map((r) => (
            <Space key={r.id} style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>{r.product.name}</Text>
              <InputNumber
                min={0}
                value={prQuantities[r.id]}
                onChange={(v) => setPrQuantities((prev) => ({ ...prev, [r.id]: v }))}
                addonAfter="SL cần mua"
              />
            </Space>
          ))}
        </Space>
      </Modal>
    </div>
  );
}
