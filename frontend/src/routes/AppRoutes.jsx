import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import ProductPage from '../pages/category/Product';
import ProductCategoryPage from '../pages/category/ProductCategory';
import VendorsPage from '../pages/vendors';
import WarehousesPage from '../pages/warehouses';
import CustomersPage from '../pages/customers';
import UomsPage from '../pages/uoms';
import GoodsReceiptPage from '../pages/inbound/GoodsReceipt';
import SalesOrderPage from '../pages/sales/SalesOrder';
import InventoriesPage from '../pages/inventory/Inventories';
import GoodsIssuePage from '../pages/inventory/GoodsIssue';
import TransferPage from '../pages/inventory/Transfer';
import StockCountingPage from '../pages/inventory/StockCounting';
import UsersPage from '../pages/system/Users';
import RolesPage from '../pages/system/Roles';
import PlaceholderPage from '../components/PlaceholderPage';

// TODO: ProtectedRoute hien chi kiem tra co token trong localStorage hay khong (mock login),
// can nang cap kiem tra JWT con han khi noi API /api/auth/login that.
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<PlaceholderPage title="Trang chủ" />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/product-categories" element={<ProductCategoryPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/uoms" element={<UomsPage />} />
            <Route path="/goods-receipts" element={<GoodsReceiptPage />} />
            <Route path="/sales-orders" element={<SalesOrderPage />} />
            <Route path="/inventory/inventories" element={<InventoriesPage />} />
            <Route path="/inventory/goods-issue" element={<GoodsIssuePage />} />
            <Route path="/inventory/transfer" element={<TransferPage />} />
            <Route path="/inventory/stock-counting" element={<StockCountingPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/roles" element={<RolesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
