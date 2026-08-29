import { useEffect, useState } from 'react';
import { Typography, Table, Space, Button, Modal, InputNumber, message } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';

const { Title, Text } = Typography;

// Khop voi du lieu mock o pages/category/Product va pages/warehouses de dong bo giua cac module.
const PRODUCT_OPTIONS = [
  { value: 'SP001', label: 'Nước ngọt Cola lon 330ml' },
  { value: 'SP002', label: 'Nước suối 500ml' },
  { value: 'SP003', label: 'Cá hộp sốt cà' },
  { value: 'SP004', label: 'Bánh quy bơ' },
  { value: 'SP005', label: 'Kẹo dẻo trái cây' },
];

const WAREHOUSE_OPTIONS = [
  { value: 'Q1MWH01', label: 'Kho chính Quận 1' },
  { value: 'Q1VWH01', label: 'Kho xe tải Quận 1' },
  { value: 'TBDWH01', label: 'Kho hàng lỗi Tân Bình' },
  { value: 'TBCWH01', label: 'Kho ký gửi Tân Bình' },
];

function optionLabel(options, code) {
  return options.find((o) => o.value === code)?.label || code;
}

// Du lieu mau (100% mock). Cot "Committed" khong co field rieng trong bang `stock` that
// (chi co `quantity`) - gia lap de dung cong thuc Available = In Stock - Committed nhu
// yeu cau; ngoai doi se tinh tu tong SL cac don ban dang "Cho xac nhan" cung product+warehouse.
const INITIAL_STOCK = [
  { id: 1, productCode: 'SP001', warehouseCode: 'Q1MWH01', inStock: 500, committed: 120 },
  { id: 2, productCode: 'SP001', warehouseCode: 'Q1VWH01', inStock: 80, committed: 0 },
  { id: 3, productCode: 'SP002', warehouseCode: 'Q1MWH01', inStock: 300, committed: 340 },
  { id: 4, productCode: 'SP003', warehouseCode: 'Q1MWH01', inStock: 150, committed: 50 },
  { id: 5, productCode: 'SP004', warehouseCode: 'TBDWH01', inStock: 20, committed: 0 },
  { id: 6, productCode: 'SP005', warehouseCode: 'Q1MWH01', inStock: 60, committed: 10 },
  { id: 7, productCode: 'SP002', warehouseCode: 'TBCWH01', inStock: 0, committed: 0 },
];

// TODO: day la trang UI mau (mock 100%). Backend co bang `stock` that (xem V5__inventory.sql)
// nhung chua co StockController de noi API that, va chua co cot "committed".
export default function InventoriesPage() {
  const [stockRows, setStockRows] = useState(INITIAL_STOCK);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [prQuantities, setPrQuantities] = useState({});

  // Mo phong trang thai loading khi vao trang / lam moi, cho dung UX goi API that.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  function reload() {
    setLoading(true);
    setStockRows(INITIAL_STOCK);
    setSearchText('');
    setSelectedRowKeys([]);
    setTimeout(() => setLoading(false), 400);
  }

  const filteredStock = stockRows.filter((s) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return (
      s.productCode.toLowerCase().includes(keyword) ||
      optionLabel(PRODUCT_OPTIONS, s.productCode).toLowerCase().includes(keyword)
    );
  });

  function openPrModal() {
    const initialQty = {};
    selectedRowKeys.forEach((id) => {
      const row = stockRows.find((s) => s.id === id);
      const shortage = row.committed - row.inStock;
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
    { title: 'Mã SP', dataIndex: 'productCode', key: 'productCode' },
    { title: 'Tên SP', key: 'productName', render: (_, r) => optionLabel(PRODUCT_OPTIONS, r.productCode) },
    { title: 'Kho', key: 'warehouse', render: (_, r) => optionLabel(WAREHOUSE_OPTIONS, r.warehouseCode) },
    { title: 'Tồn thực tế', dataIndex: 'inStock', key: 'inStock', align: 'right', render: (v) => v.toLocaleString('vi-VN') },
    { title: 'Đã đặt hàng', dataIndex: 'committed', key: 'committed', align: 'right', render: (v) => v.toLocaleString('vi-VN') },
    {
      title: 'Sẵn sàng bán',
      key: 'available',
      align: 'right',
      render: (_, r) => {
        const available = r.inStock - r.committed;
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
        onReload={reload}
        extra={
          <Button
            icon={<ShoppingCartOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={openPrModal}
          >
            Tạo yêu cầu mua hàng
          </Button>
        }
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredStock}
        loading={loading}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
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
              <Text>{optionLabel(PRODUCT_OPTIONS, r.productCode)}</Text>
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
