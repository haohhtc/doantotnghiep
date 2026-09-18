import { useEffect, useState } from 'react';
import { Typography, Table, Tag, Button, Popconfirm, message } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

// Login Device Management - xem ai dang dang nhap o dau, dang xuat tu xa 1 thiet bi - xem
// backend/.../system/controller/ActiveSessionController.java (V30).
export default function LoginDevicesPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/system/sessions')
      .then(({ data }) => setSessions(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được danh sách phiên đăng nhập'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleRevoke(record) {
    axiosClient
      .post(`/system/sessions/${record.id}/revoke`)
      .then(() => {
        message.success('Đã đăng xuất từ xa thiết bị này');
        loadData();
      })
      .catch((err) => message.error(err.response?.data?.message || 'Thao tác thất bại'));
  }

  const filtered = sessions.filter((s) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return s.user?.username?.toLowerCase().includes(keyword);
  });

  const columns = [
    { title: 'Tài khoản', key: 'user', render: (_, r) => r.user?.username },
    { title: 'Thiết bị', dataIndex: 'deviceInfo', key: 'deviceInfo', ellipsis: true },
    { title: 'Địa chỉ IP', dataIndex: 'ipAddress', key: 'ipAddress' },
    { title: 'Đăng nhập lúc', dataIndex: 'loginAt', key: 'loginAt', render: (v) => v?.replace('T', ' ') },
    {
      title: 'Trạng thái',
      dataIndex: 'revoked',
      key: 'revoked',
      render: (v) => (v ? <Tag>Đã đăng xuất</Tag> : <Tag color="green">Đang hoạt động</Tag>),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) =>
        !record.revoked && (
          <Popconfirm title="Đăng xuất từ xa thiết bị này?" onConfirm={() => handleRevoke(record)}>
            <Button icon={<StopOutlined />} danger>
              Đăng xuất
            </Button>
          </Popconfirm>
        ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý thiết bị đăng nhập</Title>
      <TableToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm theo tài khoản..."
        onReload={loadData}
      />
      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} />
    </div>
  );
}
