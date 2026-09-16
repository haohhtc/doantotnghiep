import { useEffect, useState } from 'react';
import { Layout, Menu, Space, Button, Breadcrumb, Avatar } from 'antd';
import {
  HomeOutlined, AppstoreOutlined, ShoppingCartOutlined,
  DatabaseOutlined, SafetyOutlined, LogoutOutlined, MenuFoldOutlined,
  MenuUnfoldOutlined, UserOutlined, EnvironmentOutlined, GlobalOutlined, BankOutlined,
  ContainerOutlined, ClusterOutlined, CompassOutlined, TagOutlined, IdcardOutlined, BarChartOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { BranchProvider } from '../contexts/BranchContext';
import BranchSelector from './BranchSelector';

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
          key: 'sales-organization', icon: <ClusterOutlined />, label: 'Sales Organization',
          children: [
            { key: '/selling-zones', label: <Link to="/selling-zones">Vùng bán hàng</Link> },
          ],
        },
        {
          key: 'company-setup', icon: <BankOutlined />, label: 'Company Setup',
          children: [
            { key: '/company', label: <Link to="/company">Công ty</Link> },
            { key: '/vendors', label: <Link to="/vendors">Nhà cung cấp</Link> },
            { key: '/branches', label: <Link to="/branches">Chi nhánh</Link> },
          ],
        },
        {
          key: 'san-pham', icon: <ContainerOutlined />, label: 'Sản phẩm',
          children: [
            { key: '/products', label: <Link to="/products">Sản phẩm</Link> },
            { key: '/product-categories', label: <Link to="/product-categories">Thuộc tính</Link> },
            { key: '/product-groups', label: <Link to="/product-groups">Nhóm sản phẩm</Link> },
            { key: '/units', label: <Link to="/units">Đơn vị tính</Link> },
            { key: '/tax-groups', label: <Link to="/tax-groups">Nhóm thuế</Link> },
          ],
        },
        {
          key: 'bang-gia', icon: <TagOutlined />, label: 'Bảng giá',
          children: [
            { key: '/price-lists', label: <Link to="/price-lists">Bảng giá</Link> },
          ],
        },
        {
          key: 'khach-hang', icon: <IdcardOutlined />, label: 'Khách hàng',
          children: [
            { key: '/customers', label: <Link to="/customers">Khách hàng</Link> },
            { key: '/customer-groups', label: <Link to="/customer-groups">Nhóm khách hàng</Link> },
            { key: '/customer-channels', label: <Link to="/customer-channels">Kênh bán hàng</Link> },
          ],
        },
        {
          key: 'nhan-vien', icon: <UserOutlined />, label: 'Nhân viên',
          children: [
            // Employee tach bang rieng khoi User (V21) - khong con tro ve /users nua, xem
            // backend/.../category/employee/. "Người dùng" (tai khoan dang nhap) van o nhom Hệ thống.
            { key: '/employees', label: <Link to="/employees">Nhân viên</Link> },
            { key: '/employee-positions', label: <Link to="/employee-positions">Chức vụ</Link> },
            { key: '/salesman-types', label: <Link to="/salesman-types">Loại nhân viên bán hàng</Link> },
          ],
        },
        {
          key: 'route-mcp', icon: <CompassOutlined />, label: 'Route & MCP',
          children: [
            { key: '/route-masters', label: <Link to="/route-masters">Khung tuyến</Link> },
          ],
        },
      ],
    },
    { key: '/sales-orders', icon: <ShoppingCartOutlined />, label: <Link to="/sales-orders">Bán hàng</Link> },
    {
      key: 'ton-kho', icon: <DatabaseOutlined />, label: 'Tồn kho',
      children: [
        { key: '/inventory/inventories', label: <Link to="/inventory/inventories">Tồn kho</Link> },
        { key: '/warehouses', label: <Link to="/warehouses">Kho</Link> },
        { key: '/goods-receipts', label: <Link to="/goods-receipts">Nhập hàng</Link> },
        { key: '/inventory/goods-issue', label: <Link to="/inventory/goods-issue">Phiếu xuất kho</Link> },
        { key: '/inventory/transfer', label: <Link to="/inventory/transfer">Chuyển hàng tồn kho</Link> },
        { key: '/inventory/transfer-confirmation', label: <Link to="/inventory/transfer-confirmation">Xác nhận di chuyển hàng tồn kho</Link> },
        { key: '/inventory/stock-counting', label: <Link to="/inventory/stock-counting">Kiểm kê kho</Link> },
      ],
    },
  ];

  items.push({
    key: 'bao-cao', icon: <BarChartOutlined />, label: 'Báo cáo',
    children: [
      { key: '/reports/sales', label: <Link to="/reports/sales">BC bán hàng</Link> },
      { key: '/reports/inventory', label: <Link to="/reports/inventory">BC kho</Link> },
      { key: '/reports/purchase', label: <Link to="/reports/purchase">BC mua hàng</Link> },
      { key: '/reports/catalog', label: <Link to="/reports/catalog">BC danh mục</Link> },
    ],
  });

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
  '/product-categories': ['Danh mục', 'Sản phẩm', 'Thuộc tính'],
  '/product-groups': ['Danh mục', 'Sản phẩm', 'Nhóm sản phẩm'],
  '/units': ['Danh mục', 'Sản phẩm', 'Đơn vị tính'],
  '/tax-groups': ['Danh mục', 'Sản phẩm', 'Nhóm thuế'],
  '/price-lists': ['Danh mục', 'Bảng giá', 'Bảng giá'],
  '/customers': ['Danh mục', 'Khách hàng', 'Khách hàng'],
  '/customer-groups': ['Danh mục', 'Khách hàng', 'Nhóm khách hàng'],
  '/customer-channels': ['Danh mục', 'Khách hàng', 'Kênh bán hàng'],
  '/company': ['Danh mục', 'Company Setup', 'Công ty'],
  '/vendors': ['Danh mục', 'Company Setup', 'Nhà cung cấp'],
  '/branches': ['Danh mục', 'Company Setup', 'Chi nhánh'],
  '/selling-zones': ['Danh mục', 'Sales Organization', 'Vùng bán hàng'],
  '/route-masters': ['Danh mục', 'Route & MCP', 'Khung tuyến'],
  '/employees': ['Danh mục', 'Nhân viên', 'Nhân viên'],
  '/employee-positions': ['Danh mục', 'Nhân viên', 'Chức vụ'],
  '/salesman-types': ['Danh mục', 'Nhân viên', 'Loại nhân viên bán hàng'],
  '/regions': ['Danh mục', 'Vùng địa lý', 'Vùng'],
  '/provinces': ['Danh mục', 'Vùng địa lý', 'Tỉnh/Thành phố'],
  '/districts': ['Danh mục', 'Vùng địa lý', 'Quận/Huyện'],
  '/wards': ['Danh mục', 'Vùng địa lý', 'Phường/Xã'],
  '/goods-receipts': ['Tồn kho', 'Nhập hàng'],
  '/sales-orders': ['Bán hàng'],
  '/warehouses': ['Tồn kho', 'Kho'],
  '/inventory/inventories': ['Tồn kho', 'Tồn kho'],
  '/inventory/goods-issue': ['Tồn kho', 'Phiếu xuất kho'],
  '/inventory/transfer': ['Tồn kho', 'Chuyển hàng tồn kho'],
  '/inventory/transfer-confirmation': ['Tồn kho', 'Xác nhận di chuyển hàng tồn kho'],
  '/inventory/stock-counting': ['Tồn kho', 'Kiểm kê kho'],
  '/users': ['Hệ thống', 'Người dùng'],
  '/roles': ['Hệ thống', 'Phân quyền'],
  '/reports/sales': ['Báo cáo', 'BC bán hàng'],
  '/reports/inventory': ['Báo cáo', 'BC kho'],
  '/reports/purchase': ['Báo cáo', 'BC mua hàng'],
  '/reports/catalog': ['Báo cáo', 'BC danh mục'],
};

// Danh sach key cua cac submenu cha (theo thu tu tu ngoai vao trong) ung voi tung route -
// dung de tu dong mo dung nhanh submenu chua route dang đứng, khong dua vao hanh vi mac dinh
// cua AntD (co the khac nhau giua cac phien ban) - xem ham computeOpenKeys ben duoi.
const MENU_ANCESTOR_KEYS = {
  '/products': ['danh-muc', 'san-pham'],
  '/product-categories': ['danh-muc', 'san-pham'],
  '/product-groups': ['danh-muc', 'san-pham'],
  '/units': ['danh-muc', 'san-pham'],
  '/tax-groups': ['danh-muc', 'san-pham'],
  '/price-lists': ['danh-muc', 'bang-gia'],
  '/customers': ['danh-muc', 'khach-hang'],
  '/customer-groups': ['danh-muc', 'khach-hang'],
  '/customer-channels': ['danh-muc', 'khach-hang'],
  '/company': ['danh-muc', 'company-setup'],
  '/vendors': ['danh-muc', 'company-setup'],
  '/branches': ['danh-muc', 'company-setup'],
  '/selling-zones': ['danh-muc', 'sales-organization'],
  '/route-masters': ['danh-muc', 'route-mcp'],
  '/employees': ['danh-muc', 'nhan-vien'],
  '/employee-positions': ['danh-muc', 'nhan-vien'],
  '/salesman-types': ['danh-muc', 'nhan-vien'],
  '/regions': ['danh-muc', 'vung-dia-ly'],
  '/provinces': ['danh-muc', 'vung-dia-ly'],
  '/districts': ['danh-muc', 'vung-dia-ly'],
  '/wards': ['danh-muc', 'vung-dia-ly'],
  '/inventory/inventories': ['ton-kho'],
  '/warehouses': ['ton-kho'],
  '/goods-receipts': ['ton-kho'],
  '/inventory/goods-issue': ['ton-kho'],
  '/inventory/transfer': ['ton-kho'],
  '/inventory/transfer-confirmation': ['ton-kho'],
  '/inventory/stock-counting': ['ton-kho'],
  '/users': ['he-thong'],
  '/roles': ['he-thong'],
  '/reports/sales': ['bao-cao'],
  '/reports/inventory': ['bao-cao'],
  '/reports/purchase': ['bao-cao'],
  '/reports/catalog': ['bao-cao'],
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const menuItems = buildMenuItems(user?.role);
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState(MENU_ANCESTOR_KEYS[location.pathname] || []);

  useEffect(() => {
    // Chuyen trang (kể ca bang Link trong menu) -> dam bao nhanh submenu chua route hien tai
    // luon o trang thai mo, khong tu dong dong - giu nguyen cac nhanh nguoi dung da tu mo khac.
    const ancestors = MENU_ANCESTOR_KEYS[location.pathname];
    if (ancestors) {
      setOpenKeys((prev) => Array.from(new Set([...prev, ...ancestors])));
    }
  }, [location.pathname]);

  const breadcrumbItems = (BREADCRUMB_MAP[location.pathname] || []).map((label) => ({ title: label }));

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  }

  return (
    // BranchProvider mong o day (chi mount sau khi ProtectedRoute da xac nhan dang nhap) - tranh
    // lap lai dung bug "dong bang truoc login" vua sua o canWrite: neu dat o App.jsx (bao ca
    // trang /login), lan goi GET /branches dau tien se that bai vi chua co token va khong bao
    // gio tu dong thu lai sau khi dang nhap xong.
    <BranchProvider>
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
          <Header style={{ background: '#fff', padding: 0, height: 'auto', lineHeight: 'normal' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', height: 64 }}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
              <BranchSelector />
              <div style={{ flex: 1 }} />
              <Space size={20}>
                <Avatar icon={<UserOutlined />} />
                {user?.fullName || user?.username || 'User'}
                <Button type="link" icon={<LogoutOutlined />} onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </Space>
            </div>
            <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0' }}>
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </Header>
          <Content style={{ margin: 16 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </BranchProvider>
  );
}
