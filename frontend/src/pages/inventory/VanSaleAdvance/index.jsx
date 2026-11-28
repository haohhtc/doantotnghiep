import { useEffect, useRef, useState } from 'react';
import { Typography, Table, Tag, Space, Button, Popconfirm, message, Modal, Descriptions } from 'antd';
import { CheckOutlined, EyeOutlined } from '@ant-design/icons';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';
import { hasPermission } from '../../../utils/auth';
import { useBranch } from '../../../contexts/BranchContext';

const WS_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '') + '/ws';

const { Title } = Typography;

const STATUS_FILTER_OPTIONS = [
  { value: 'DRAFT', label: 'Chờ xác nhận' },
  { value: 'CLOSED', label: 'Đã duyệt' },
];

function statusTag(status) {
  return status === 'CLOSED' ? <Tag color="green">Đã duyệt</Tag> : <Tag color="gold">Chờ xác nhận</Tag>;
}

const detailColumns = [
  { title: 'Sản phẩm', key: 'product', render: (_, d) => d.product?.name },
  { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
  { title: 'ĐVT', key: 'uom', render: (_, d) => d.uom?.name },
];

// App Van-Sale: NVBH bam "Gui yeu cau Ung hang" CHI tao phieu (DRAFT) - KHONG tu dong chuyen ton
// kho nua (xem mobile/.../advance-return/new.js). Trang nay la noi thu kho xac nhan that su ->
// goi /confirm -> chuyen ton Kho Main sang Kho Van chi nhanh + cong Kho NVBH cua nhan vien do
// (xem VanSaleAdvanceService.confirm() o backend). Quyen chi tiet: van_sale_advance:confirm.
export default function VanSaleAdvancePage() {
  const { selectedBranchId } = useBranch();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [viewRecord, setViewRecord] = useState(null);

  function loadData() {
    setLoading(true);
    // skipCache: giao dich tao o App (thiet bi khac) khong lam tab Web nay tu xoa cache GET 2
    // phut (axiosClient.js chi tu xoa khi CHINH tab goi POST/PUT) - luon lay du lieu moi nhat.
    axiosClient
      .get('/van-sale-advances', { skipCache: true })
      .then(({ data }) => setAdvances(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được dữ liệu ứng hàng'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  // Realtime: App tao yeu cau Ung hang moi (VanSaleAdvanceService.create()) se phat tin hieu
  // eventType=ADVANCE qua /topic/inventory - nghe va tu goi lai loadData(), khong can F5 (giong
  // cach Inventories/index.jsx da lam). Loc dung branchId cua Chi nhanh dang chon o Header.
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;
  const selectedBranchIdRef = useRef(selectedBranchId);
  selectedBranchIdRef.current = selectedBranchId;
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/inventory', (msg) => {
          const { eventType, branchId } = JSON.parse(msg.body);
          if (eventType !== 'ADVANCE') return;
          if (branchId != null && Number(branchId) !== selectedBranchIdRef.current) return;
          loadDataRef.current();
        });
      },
    });
    client.activate();
    return () => client.deactivate();
  }, []);

  // Loc theo Chi nhanh dang chon o Header - backend tu "patch" employee.user.branch bang chi
  // nhanh suy tu Tuyen ban hang dang phu trach (VanSaleAdvanceService.enrichResolvedBranch(), vi
  // NVBH thuong khong gan san user.branch) nen field nay giờ luon co gia tri dung de loc.
  const filteredAdvances = advances.filter((a) => {
    if (selectedBranchId && a.employee?.user?.branch?.id !== selectedBranchId) return false;
    if (filterValues.status && a.status !== filterValues.status) return false;
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return (
      a.docNumber.toLowerCase().includes(keyword) ||
      (a.employee?.fullName || '').toLowerCase().includes(keyword)
    );
  });

  function handleConfirm(record) {
    axiosClient
      .post(`/van-sale-advances/${record.id}/confirm`)
      .then(() => {
        message.success('Đã xác nhận ứng hàng - đã chuyển tồn kho');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Xác nhận thất bại'));
  }

  const columns = [
    { title: 'Số phiếu', dataIndex: 'docNumber', key: 'docNumber' },
    { title: 'Nhân viên', key: 'employee', render: (_, r) => r.employee?.fullName },
    {
      title: 'Ngày giờ tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => (v ? new Date(v).toLocaleString('vi-VN') : '-'),
    },
    { title: 'Số sản phẩm', key: 'itemCount', render: (_, r) => r.items?.length || 0 },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: statusTag },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setViewRecord(record)}>
            Xem
          </Button>
          {record.status === 'DRAFT' && hasPermission('van_sale_advance:confirm') ? (
            <Popconfirm
              title="Xác nhận phiếu ứng hàng này?"
              description="Sau khi xác nhận sẽ chuyển tồn kho Main sang Van và cộng vào Kho NVBH, không thể hoàn tác."
              onConfirm={() => handleConfirm(record)}
            >
              <Button icon={<CheckOutlined />} type="primary" ghost>
                Xác nhận
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Ứng hàng</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo số phiếu hoặc nhân viên..."
        onReload={() => {
          loadData();
          setSearchText('');
        }}
        filters={[{ name: 'status', label: 'Trạng thái', options: STATUS_FILTER_OPTIONS }]}
        filterValues={filterValues}
        onFilterChange={setFilterValues}
      />

      <Table rowKey="id" columns={columns} dataSource={filteredAdvances} loading={loading} />

      <Modal
        title={viewRecord ? `Chi tiết phiếu ${viewRecord.docNumber}` : ''}
        open={!!viewRecord}
        onCancel={() => setViewRecord(null)}
        footer={null}
        width={700}
      >
        {viewRecord && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Số phiếu">{viewRecord.docNumber}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{statusTag(viewRecord.status)}</Descriptions.Item>
              <Descriptions.Item label="Nhân viên">{viewRecord.employee?.fullName}</Descriptions.Item>
              <Descriptions.Item label="Chi nhánh">{viewRecord.employee?.user?.branch?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Ngày giờ tạo">
                {viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleString('vi-VN') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày chứng từ">{viewRecord.docDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="Lý do" span={2}>{viewRecord.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>{viewRecord.remarks || '-'}</Descriptions.Item>
            </Descriptions>
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={viewRecord.items}
              columns={detailColumns}
              summary={(items) => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <strong>Tổng số lượng</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>{items.reduce((sum, d) => sum + Number(d.quantity || 0), 0).toLocaleString('vi-VN')}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} />
                </Table.Summary.Row>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
