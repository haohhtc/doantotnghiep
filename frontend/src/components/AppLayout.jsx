import { useEffect, useState } from 'react';
import { Layout, Menu, Space, Button, Breadcrumb, Avatar, Badge, Tooltip } from 'antd';
import {
  HomeOutlined, AppstoreOutlined, InboxOutlined, ShoppingCartOutlined,
  DatabaseOutlined, SafetyOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, UserOutlined, BellOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { getCurrentUser } from '../utils/auth';

const { Sider, Header, Content } = Layout;

// Menu bam sat cau truc module da dung trong backend/ (category, inbound, sales, inventory, user/role)
// Nhom "he-thong" (Nguoi dung/Phan quyen) chi ADMIN duoc thay - build dong theo role dang nhap,
// khop voi ProtectedRoute allowedRoles=['ADMIN'] o AppRoutes.jsx (tranh hien menu roi bi chan 403).
function buildMenuItems(role) {
  const items = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">Trang chủ</Link> },
    {
      key: 'danh-muc', icon: <AppstoreOutlined />, label: 'Danh mục',
      children: [
        { key: '/products', label: <Link to="/products">Sản phẩm</Link> },
        { key: '/product-categories', label: <Link to="/product-categories">Danh mục sản phẩm</Link> },
        { key: '/vendors', label: <Link to="/vendors">Nhà cung cấp</Link> },
        { key: '/warehouses', label: <Link to="/warehouses">Kho</Link> },
        { key: '/customers', label: <Link to="/customers">Khách hàng</Link> },
        { key: '/uoms', label: <Link to="/uoms">Đơn vị tính</Link> },
      ],
    },
    { key: '/goods-receipts', icon: <InboxOutlined />, label: <Link to="/goods-receipts">Nhập hàng</Link> },
    { key: '/sales-orders', icon: <ShoppingCartOutlined />, label: <Link to="/sales-orders">Bán hàng</Link> },
    {
      key: 'ton-kho', icon: <DatabaseOutlined />, label: 'Tồn kho',
      children: [
        { key: '/inventory/inventories', label: <Link to="/inventory/inventories">Báo cáo tồn kho</Link> },
        { key: '/inventory/goods-issue', label: <Link to="/inventory/goods-issue">Phiếu xuất kho</Link> },
        { key: '/inventory/transfer', label: <Link to="/inventory/transfer">Điều chuyển kho</Link> },
        { key: '/inventory/stock-counting', label: <Link to="/inventory/stock-counting">Kiểm kê kho</Link> },
        { key: '/inventory/stock-alerts', label: <Link to="/inventory/stock-alerts">Cảnh báo tồn kho</Link> },
      ],
    },
  ];

  if (role === 'ADMIN') {
    items.push({
      key: 'he-thong', icon: <SafetyOutlined />, label: 'Hệ thống',
      children: [
        { key: '/users', label: <Link to="/users">Người dùng</Link> },
        { key: '/roles', label: <Link to="/roles">Phân quyền</Link> },
      ],
    });
  }

  return items;
}

// Duong dan breadcrumb theo tung route - khop voi nhom module trong menuItems o tren.
const BREADCRUMB_MAP = {
  '/': ['Trang chủ'],
  '/products': ['Danh mục', 'Sản phẩm'],
  '/product-categories': ['Danh mục', 'Danh mục sản phẩm'],
  '/vendors': ['Danh mục', 'Nhà cung cấp'],
  '/warehouses': ['Danh mục', 'Kho'],
  '/customers': ['Danh mục', 'Khách hàng'],
  '/uoms': ['Danh mục', 'Đơn vị tính'],
  '/goods-receipts': ['Nhập hàng'],
  '/sales-orders': ['Bán hàng'],
  '/inventory/inventories': ['Tồn kho', 'Báo cáo tồn kho'],
  '/inventory/goods-issue': ['Tồn kho', 'Phiếu xuất kho'],
  '/inventory/transfer': ['Tồn kho', 'Điều chuyển kho'],
  '/inventory/stock-counting': ['Tồn kho', 'Kiểm kê kho'],
  '/inventory/stock-alerts': ['Tồn kho', 'Cảnh báo tồn kho'],
  '/users': ['Hệ thống', 'Người dùng'],
  '/roles': ['Hệ thống', 'Phân quyền'],
};

// TODO: them lai Select chon chi nhanh/don vi o day sau khi co bang branch/don vi
// that trong SQL (hien schema chua co khai niem chi nhanh - app dang single-tenant).
export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const menuItems = buildMenuItems(user?.role);
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    // INV-05: dem so canh bao ton kho dang ACTIVE de hien badge. Fetch khi tai trang, va fetch lai
    // moi khi trang Canh bao ton kho tao/sua/resolve xong (bao qua su kien 'stock-alert-changed'
    // vi Header va trang Canh bao la 2 component doc lap, khong chung state/props).
    function fetchAlertCount() {
      axiosClient
        .get('/stock-alerts', { params: { status: 'ACTIVE' } })
        .then(({ data }) => setAlertCount(data.data.length))
        .catch(() => setAlertCount(0));
    }

    fetchAlertCount();
    window.addEventListener('stock-alert-changed', fetchAlertCount);
    return () => window.removeEventListener('stock-alert-changed', fetchAlertCount);
  }, []);

  const breadcrumbItems = (BREADCRUMB_MAP[location.pathname] || []).map((label) => ({ title: label }));

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsed={collapsed} trigger={null} collapsible>
        <div style={{ color: '#fff', textAlign: 'center', padding: 16, fontWeight: 'bold', fontSize: 18 }}>
          {collapsed ? 'EQK' : 'ERP QLKHO'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Breadcrumb items={breadcrumbItems} />
          <div style={{ flex: 1 }} />
          <Space size={20}>
            <Tooltip title={alertCount > 0 ? `${alertCount} sản phẩm sắp hết hàng` : 'Không có cảnh báo tồn kho'}>
              <Badge count={alertCount} size="small">
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: 18 }} />}
                  onClick={() => navigate('/inventory/stock-alerts')}
                />
              </Badge>
            </Tooltip>
            <Avatar icon={<UserOutlined />} />
            {user?.fullName || user?.username || 'User'}
            <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
