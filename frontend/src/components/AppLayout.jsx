import { Layout, Menu } from 'antd';
import {
  HomeOutlined, AppstoreOutlined, InboxOutlined, ShoppingCartOutlined,
  DatabaseOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useLocation } from 'react-router-dom';

const { Sider, Header, Content } = Layout;

// Menu bam sat cau truc module da dung trong backend/ (category, inbound, sales, inventory, user/role)
const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: <Link to="/">Trang chu</Link> },
  {
    key: 'danh-muc', icon: <AppstoreOutlined />, label: 'Danh muc',
    children: [
      { key: '/products', label: <Link to="/products">San pham</Link> },
      { key: '/product-categories', label: <Link to="/product-categories">Danh muc san pham</Link> },
      { key: '/suppliers', label: <Link to="/suppliers">Nha cung cap</Link> },
      { key: '/warehouses', label: <Link to="/warehouses">Kho</Link> },
    ],
  },
  { key: '/goods-receipts', icon: <InboxOutlined />, label: <Link to="/goods-receipts">Nhap hang</Link> },
  { key: '/sales-orders', icon: <ShoppingCartOutlined />, label: <Link to="/sales-orders">Ban hang</Link> },
  { key: '/stock', icon: <DatabaseOutlined />, label: <Link to="/stock">Ton kho</Link> },
  {
    key: 'he-thong', icon: <SafetyOutlined />, label: 'He thong',
    children: [
      { key: '/users', label: <Link to="/users">Nguoi dung</Link> },
      { key: '/roles', label: <Link to="/roles">Phan quyen</Link> },
    ],
  },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsible>
        <div style={{ color: '#fff', textAlign: 'center', padding: 16, fontWeight: 'bold', fontSize: 18 }}>
          ERP QLKHO
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {/* TODO: hien thi ten user dang nhap + nut dang xuat (lay tu JWT / context auth) */}
          admin
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
