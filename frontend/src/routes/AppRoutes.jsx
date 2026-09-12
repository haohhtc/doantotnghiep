import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import ProductPage from '../pages/category/Product';
import ProductCategoryPage from '../pages/category/ProductCategory';
import CompanyPage from '../pages/company';
import VendorsPage from '../pages/vendors';
import WarehousesPage from '../pages/warehouses';
import CustomersPage from '../pages/customers';
import CustomerGroupsPage from '../pages/customerGroups';
import CustomerChannelsPage from '../pages/customerChannels';
import UnitsPage from '../pages/units';
import TaxGroupsPage from '../pages/taxGroups';
import PriceListsPage from '../pages/priceLists';
import BranchesPage from '../pages/branches';
import SellingZonesPage from '../pages/sellingZones';
import RouteMastersPage from '../pages/routeMasters';
import RouteSettingsPage from '../pages/routeSettings';
import RegionsPage from '../pages/regions';
import ProvincesPage from '../pages/provinces';
import DistrictsPage from '../pages/districts';
import WardsPage from '../pages/wards';
import GoodsReceiptPage from '../pages/inbound/GoodsReceipt';
import SalesOrderPage from '../pages/sales/SalesOrder';
import InventoriesPage from '../pages/inventory/Inventories';
import GoodsIssuePage from '../pages/inventory/GoodsIssue';
import TransferPage from '../pages/inventory/Transfer';
import StockCountingPage from '../pages/inventory/StockCounting';
import StockAlertsPage from '../pages/inventory/StockAlerts';
import UsersPage from '../pages/system/Users';
import RolesPage from '../pages/system/Roles';
import EmployeePositionsPage from '../pages/employeePositions';
import SalesmanTypesPage from '../pages/salesmanTypes';
import PlaceholderPage from '../components/PlaceholderPage';

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
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customer-groups" element={<CustomerGroupsPage />} />
            <Route path="/customer-channels" element={<CustomerChannelsPage />} />
            <Route path="/units" element={<UnitsPage />} />
            <Route path="/tax-groups" element={<TaxGroupsPage />} />
            <Route path="/price-lists" element={<PriceListsPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/selling-zones" element={<SellingZonesPage />} />
            <Route path="/route-masters" element={<RouteMastersPage />} />
            <Route path="/route-settings" element={<RouteSettingsPage />} />

            {/* Vung dia ly (Region/Province/District/Ward) - API that, xem V11__geography.sql */}
            <Route path="/regions" element={<RegionsPage />} />
            <Route path="/provinces" element={<ProvincesPage />} />
            <Route path="/districts" element={<DistrictsPage />} />
            <Route path="/wards" element={<WardsPage />} />

            <Route path="/goods-receipts" element={<GoodsReceiptPage />} />
            <Route path="/sales-orders" element={<SalesOrderPage />} />
            <Route path="/inventory/inventories" element={<InventoriesPage />} />
            <Route path="/inventory/goods-issue" element={<GoodsIssuePage />} />
            <Route path="/inventory/transfer" element={<TransferPage />} />
            <Route path="/inventory/stock-counting" element={<StockCountingPage />} />
            <Route path="/inventory/stock-alerts" element={<StockAlertsPage />} />

            <Route path="/employee-positions" element={<EmployeePositionsPage />} />
            <Route path="/salesman-types" element={<SalesmanTypesPage />} />

            {/* Nguoi dung & Phan quyen: chi ADMIN duoc truy cap - go thang URL se bi chan hien 403 */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
