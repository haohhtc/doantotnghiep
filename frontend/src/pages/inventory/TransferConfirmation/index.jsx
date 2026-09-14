import { useEffect, useState } from 'react';
import { Typography, Button, Table, Tag, Space, Popconfirm, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasAnyRole } from '../../../utils/auth';

const { Title } = Typography;

function statusTag(status) {
  if (status === 'CLOSED') return <Tag color="green">Đã nhận hàng</Tag>;
  if (status === 'IN_TRANSIT') return <Tag color="blue">Đang vận chuyển</Tag>;
  return <Tag color="gold">Nháp</Tag>;
}

// Khop rule Backend o SecurityConfig: chi ADMIN + WAREHOUSE_MANAGER duoc xac nhan nhan hang.
const canWrite = hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER');

// Buoc 2/2 cua Dieu chuyen kho (giong DMS that - man hinh "Inventory Transfer Confirmation"
// rieng biet voi man hinh tao phieu o /inventory/transfer). Kho dich xac nhan da nhan hang ->
// IN_TRANSIT -> CLOSED, cong ton kho dich. Xem backend/.../inventory/controller/InventoryTransferController.java.
export default function TransferConfirmationPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/inventory-transfers')
      .then(({ data }) => setTransfers(data.data.filter((t) => t.status !== 'DRAFT')))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu điều chuyển kho'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransfers = transfers.filter((t) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return t.docNumber.toLowerCase().includes(keyword);
  });

  function handleConfirmReceive(record) {
    axiosClient
      .post(`/inventory-transfers/${record.id}/confirm-receive`)
      .then(() => {
        message.success('Đã xác nhận nhận hàng - đã cộng tồn kho đích');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'));
  }

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Kho đi', key: 'from', render: (_, r) => r.fromWarehouse?.name },
    { title: 'Kho đến', key: 'to', render: (_, r) => r.toWarehouse?.name },
    { title: 'Ngày xuất kho nguồn', dataIndex: 'sentAt', key: 'sentAt', render: (v) => (v ? v.slice(0, 10) : '-') },
    { title: 'Ngày nhận hàng', dataIndex: 'receivedAt', key: 'receivedAt', render: (v) => (v ? v.slice(0, 10) : '-') },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status) => statusTag(status) },
    ...(canWrite
      ? [
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) =>
              record.status === 'IN_TRANSIT' ? (
                <Popconfirm
                  title="Xác nhận đã nhận hàng tại kho đích?"
                  description="Sau khi xác nhận sẽ cộng vào tồn kho đích và không thể hoàn tác."
                  onConfirm={() => handleConfirmReceive(record)}
                >
                  <Button icon={<CheckOutlined />} type="primary" ghost>
                    Xác nhận nhận hàng
                  </Button>
                </Popconfirm>
              ) : (
                <Space />
              ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <Title level={3}>Xác nhận di chuyển hàng tồn kho</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu..."
        onReload={() => {
          loadData();
          setSearchText('');
        }}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredTransfers} loading={loading} />
    </div>
  );
}
