import { useEffect, useState } from 'react';
import { Typography, Table, Space, Button, Modal, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;

// Picking List / Delivery Note Printing - khong co bang/API moi, chi doc lai du lieu sales_order
// da CONFIRMED va hien thi dang phieu kho de in - xem tonghop.md. Nut "In" goi window.print(),
// CSS @media print an Sidebar/Header/nut bam khi in (xem #print-area o duoi).
export default function PickingListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [printOrder, setPrintOrder] = useState(null);

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
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<PrinterOutlined />} onClick={() => setPrintOrder(record)}>
            In phiếu
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
          #print-area .no-print { display: none; }
        }
      `}</style>
      <Title level={3}>Phiếu soạn hàng / In phiếu giao hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số đơn hoặc khách hàng..."
        onReload={loadData}
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={null}
        open={!!printOrder}
        onCancel={() => setPrintOrder(null)}
        footer={
          <Space className="no-print">
            <Button onClick={() => setPrintOrder(null)}>Đóng</Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
              In
            </Button>
          </Space>
        }
        width={640}
        destroyOnHidden
      >
        {printOrder && (
          <div id="print-area">
            <Title level={4} style={{ textAlign: 'center' }}>PHIẾU GIAO HÀNG</Title>
            <p><strong>Số đơn:</strong> {printOrder.docNumber}</p>
            <p><strong>Ngày đặt hàng:</strong> {printOrder.docDate}</p>
            <p><strong>Khách hàng:</strong> {printOrder.customer?.name}</p>
            <p><strong>Kho xuất:</strong> {printOrder.warehouse?.name}</p>
            <table width="100%" border="1" cellPadding="6" style={{ borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {printOrder.details.map((d) => (
                  <tr key={d.id}>
                    <td>{d.product.code} - {d.product.name}</td>
                    <td style={{ textAlign: 'right' }}>{Number(d.quantity).toLocaleString('vi-VN')} {d.uom?.name || ''}</td>
                    <td style={{ textAlign: 'right' }}>{Number(d.unitPrice).toLocaleString('vi-VN')} đ</td>
                    <td style={{ textAlign: 'right' }}>{Number(d.amount).toLocaleString('vi-VN')} đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ textAlign: 'right', marginTop: 12 }}>
              <Text strong>Tổng cộng: {Number(printOrder.totalAmount).toLocaleString('vi-VN')} đ</Text>
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
