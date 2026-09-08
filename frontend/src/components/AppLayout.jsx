import { useEffect, useState } from 'react';
import { Layout, Menu, Space, Button, Breadcrumb, Avatar, Badge, Tooltip } from 'antd';
import {
  HomeOutlined, AppstoreOutlined, InboxOutlined, ShoppingCartOutlined,
  DatabaseOutlined, SafetyOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, UserOutlined, BellOutlined, EnvironmentOutlined, GlobalOutlined, BankOutlined,
  ContainerOutlined,
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
        {
          key: 'vung-dia-ly', icon: <GlobalOutlined />, label: 'Vùng địa lý',
          children: [
            { key: '/regions', label: <Link to="/regions">Vùng</Link> },
            { key: '/provinces', label: <Link to="/provinces">Tỉnh/Thành phố</Link> },
            { key: '/districts', label: <Link to="/districts">Quận/Huyện</Link> },
            { key: '/wards', label: <Link to="/wards">Phường/Xã</Link> },
          ],
        },
        {
          key: 'company-setup', icon: <BankOutlined />, label: 'Company Setup',
          children: [
            { key: '/company', label: <Link to="/company">Công ty</Link> },
            { key: '/vendors', label: <Link to="/vendors">Nhà cung cấp</Link> },
            { key: '/branches', label: <Link to="/branches">Chi nhánh</Link> },
            { key: '/warehouses', label: <Link to="/warehouses">Kho</Link> },
          ],
        },
        {
          key: 'tuyen-ban-hang', icon: <EnvironmentOutlined />, label: 'Tuyến bán hàng',
          children: [
            { key: '/selling-zones', label: <Link to="/selling-zones">Vùng bán hàng</Link> },
            { key: '/route-masters', label: <Link to="/route-masters">Khung tuyến</Link> },
            { key: '/route-settings', label: <Link to="/route-settings">Giao tuyến vận hành</Link> },
          ],
        },
        {
          key: 'san-pham', icon: <ContainerOutlined />, label: 'Sản phẩm',
          children: [
            { key: '/products', label: <Link to="/products">Sản phẩm</Link> },
            { key: '/product-categories', label: <Link to="/product-categories">Nhóm sản phẩm</Link> },
            { key: '/units', label: <Link to="/units">Đơn vị tính</Link> },
            { key: '/tax-groups', label: <Link to="/tax-groups">Nhóm thuế</Link> },
          ],
        },
        { key: '/customers', label: <Link to="/customers">Khách hàng</Link> },
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
  '/products': ['Danh mục', 'Sản phẩm', 'Sản phẩm'],
  '/product-categories': ['Danh mục', 'Sản phẩm', 'Nhóm sản phẩm'],
  '/units': ['Danh mục', 'Sản phẩm', 'Đơn vị tính'],
  '/tax-groups': ['Danh mục', 'Sản phẩm', 'Nhóm thuế'],
  '/customers': ['Danh mục', 'Khách hàng'],
  '/company': ['Danh mục', 'Company Setup', 'Công ty'],
  '/vendors': ['Danh mục', 'Company Setup', 'Nhà cung cấp'],
  '/branches': ['Danh mục', 'Company Setup', 'Chi nhánh'],
  '/warehouses': ['Danh mục', 'Company Setup', 'Kho'],
  '/selling-zones': ['Danh mục', 'Tuyến bán hàng', 'Vùng bán hàng'],
  '/route-masters': ['Danh mục', 'Tuyến bán hàng', 'Khung tuyến'],
  '/route-settings': ['Danh mục', 'Tuyến bán hàng', 'Giao tuyến vận hành'],
  '/regions': ['Danh mục', 'Vùng địa lý', 'Vùng'],
  '/provinces': ['Danh mục', 'Vùng địa lý', 'Tỉnh/Thành phố'],
  '/districts': ['Danh mục', 'Vùng địa lý', 'Quận/Huyện'],
  '/wards': ['Danh mục', 'Vùng địa lý', 'Phường/Xã'],
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

// Danh sach key cua cac submenu cha (theo thu tu tu ngoai vao trong) ung voi tung route -
// dung de tu dong mo dung nhanh submenu chua route dang đứng, khong dua vao hanh vi mac dinh
// cua AntD (co the khac nhau giua cac phien ban) - xem ham computeOpenKeys ben duoi.
const MENU_ANCESTOR_KEYS = {
  '/products': ['danh-muc', 'san-pham'],
  '/product-categories': ['danh-muc', 'san-pham'],
  '/units': ['danh-muc', 'san-pham'],
  '/tax-groups': ['danh-muc', 'san-pham'],
  '/customers': ['danh-muc'],
  '/company': ['danh-muc', 'company-setup'],
  '/vendors': ['danh-muc', 'company-setup'],
  '/branches': ['danh-muc', 'company-setup'],
  '/warehouses': ['danh-muc', 'company-setup'],
  '/selling-zones': ['danh-muc', 'tuyen-ban-hang'],
  '/route-masters': ['danh-muc', 'tuyen-ban-hang'],
  '/route-settings': ['danh-muc', 'tuyen-ban-hang'],
  '/regions': ['danh-muc', 'vung-dia-ly'],
  '/provinces': ['danh-muc', 'vung-dia-ly'],
  '/districts': ['danh-muc', 'vung-dia-ly'],
  '/wards': ['danh-muc', 'vung-dia-ly'],
  '/inventory/inventories': ['ton-kho'],
  '/inventory/goods-issue': ['ton-kho'],
  '/inventory/transfer': ['ton-kho'],
  '/inventory/stock-counting': ['ton-kho'],
  '/inventory/stock-alerts': ['ton-kho'],
  '/users': ['he-thong'],
  '/roles': ['he-thong'],
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const menuItems = buildMenuItems(user?.role);
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [openKeys, setOpenKeys] = useState(MENU_ANCESTOR_KEYS[location.pathname] || []);

  useEffect(() => {
    // Chuyen trang (kể ca bang Link trong menu) -> dam bao nhanh submenu chua route hien tai
    // luon o trang thai mo, khong tu dong dong - giu nguyen cac nhanh nguoi dung da tu mo khac.
    const ancestors = MENU_ANCESTOR_KEYS[location.pathname];
    if (ancestors) {
      setOpenKeys((prev) => Array.from(new Set([...prev, ...ancestors])));
    }
  }, [location.pathname]);

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
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
        />
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
