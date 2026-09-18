import { useEffect, useState } from 'react';
import { Typography, Table, Space, Button, Modal, List, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title, Text } = Typography;

// Danh sach Hoa don - xuat tu 1 Sales Order da CONFIRMED (nut "Xuat hoa don" nam tren trang Sales
// Order, khong phai o day - xem tonghop.md). Trang nay chi xem lai, khong tao/sua duoc (hoa don
// bat bien sau khi xuat) - xem backend/.../sales/controller/InvoiceController.java.
export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [detailInvoice, setDetailInvoice] = useState(null);

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/invoices')
      .then(({ data }) => setInvoices(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách hóa đơn'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = invoices.filter((i) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return i.invoiceNumber.toLowerCase().includes(keyword) || (i.salesOrder?.docNumber || '').toLowerCase().includes(keyword);
  });

  const columns = [
    { title: 'Số hóa đơn', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    { title: 'Ngày xuất', dataIndex: 'invoiceDate', key: 'invoiceDate' },
    { title: 'Đơn hàng gốc', key: 'salesOrder', render: (_, r) => r.salesOrder?.docNumber },
    { title: 'Khách hàng', key: 'customer', render: (_, r) => r.salesOrder?.customer?.name },
    { title: 'Tiền hàng', dataIndex: 'subtotalAmount', key: 'subtotalAmount', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    { title: 'Tiền thuế', dataIndex: 'taxAmount', key: 'taxAmount', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (v) => Number(v).toLocaleString('vi-VN') + ' đ' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setDetailInvoice(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Hóa đơn (Invoices)</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số hóa đơn hoặc số đơn hàng..."
        onReload={loadData}
      />

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={detailInvoice ? `Chi tiết hóa đơn ${detailInvoice.invoiceNumber}` : ''}
        open={!!detailInvoice}
        onCancel={() => setDetailInvoice(null)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        {detailInvoice && (
          <>
            <List
              dataSource={detailInvoice.items}
              renderItem={(item) => (
                <List.Item>
                  <Text>
                    {item.product.code} - {item.product.name}: {Number(item.quantity).toLocaleString('vi-VN')} x{' '}
                    {Number(item.unitPrice).toLocaleString('vi-VN')} đ (thuế {Number(item.taxRate)}%) ={' '}
                    <Text strong>{Number(item.lineTotal).toLocaleString('vi-VN')} đ</Text>
                  </Text>
                </List.Item>
              )}
            />
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <Text>Tiền hàng: {Number(detailInvoice.subtotalAmount).toLocaleString('vi-VN')} đ</Text><br />
              <Text>Tiền thuế: {Number(detailInvoice.taxAmount).toLocaleString('vi-VN')} đ</Text><br />
              <Text strong>Tổng cộng: {Number(detailInvoice.totalAmount).toLocaleString('vi-VN')} đ</Text>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
