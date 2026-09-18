import { useEffect, useState } from 'react';
import { Typography, Table, Tag, message } from 'antd';
import TableToolbar from '../../../components/TableToolbar';
import axiosClient from '../../../api/axiosClient';

const { Title } = Typography;

// Nhat ky dang nhap (thanh cong/that bai) - chi xem, khong co CRUD - xem
// backend/.../system/controller/LoginLogController.java (V25).
export default function LoginLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  function loadData() {
    setLoading(true);
    axiosClient
      .get('/login-logs')
      .then(({ data }) => setLogs(data.data))
      .catch((err) => message.error(err.response?.data?.message || 'Không tải được nhật ký đăng nhập'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = logs.filter((l) => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return true;
    return l.username.toLowerCase().includes(keyword);
  });

  const columns = [
    { title: 'Tài khoản', dataIndex: 'username', key: 'username' },
    {
      title: 'Kết quả',
      dataIndex: 'success',
      key: 'success',
      render: (v) => (v ? <Tag color="green">Thành công</Tag> : <Tag color="red">Thất bại</Tag>),
    },
    { title: 'Địa chỉ IP', dataIndex: 'ipAddress', key: 'ipAddress' },
    { title: 'User Agent', dataIndex: 'userAgent', key: 'userAgent', ellipsis: true },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v?.replace('T', ' ') },
  ];

  return (
    <div>
      <Title level={3}>Nhật ký đăng nhập</Title>
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
