import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Login from '../pages/auth/Login';
import ProductPage from '../pages/category/Product';
import ProductCategoryPage from '../pages/category/ProductCategory';
import SupplierPage from '../pages/category/Supplier';
import WarehousePage from '../pages/category/Warehouse';
import GoodsReceiptPage from '../pages/inbound/GoodsReceipt';
import SalesOrderPage from '../pages/sales/SalesOrder';
import StockPage from '../pages/inventory/Stock';
import UsersPage from '../pages/system/Users';
import RolesPage from '../pages/system/Roles';
import PlaceholderPage from '../components/PlaceholderPage';

// TODO: boc cac route ben trong AppLayout bang 1 ProtectedRoute kiem tra JWT con han hay khong.
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<PlaceholderPage title="Trang chu" />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/product-categories" element={<ProductCategoryPage />} />
          <Route path="/suppliers" element={<SupplierPage />} />
          <Route path="/warehouses" element={<WarehousePage />} />
          <Route path="/goods-receipts" element={<GoodsReceiptPage />} />
          <Route path="/sales-orders" element={<SalesOrderPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
