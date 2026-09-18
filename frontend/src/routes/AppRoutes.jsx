import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import ProductPage from '../pages/category/Product';
import ProductCategoryPage from '../pages/category/ProductCategory';
import ProductGroupsPage from '../pages/productGroups';
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
import RegionsPage from '../pages/regions';
import ProvincesPage from '../pages/provinces';
import DistrictsPage from '../pages/districts';
import WardsPage from '../pages/wards';
import GoodsReceiptPage from '../pages/inbound/GoodsReceipt';
import PurchaseGoodsReturnPage from '../pages/purchase/GoodsReturn';
import SalesOrderPage from '../pages/sales/SalesOrder';
import SalesReturnPage from '../pages/sales/SalesReturn';
import InvoicePage from '../pages/sales/Invoice';
import PickingListPage from '../pages/sales/PickingList';
import DeliveryResultsPage from '../pages/sales/DeliveryResults';
import InventoriesPage from '../pages/inventory/Inventories';
import GoodsIssuePage from '../pages/inventory/GoodsIssue';
import TransferPage from '../pages/inventory/Transfer';
import TransferConfirmationPage from '../pages/inventory/TransferConfirmation';
import StockCountingPage from '../pages/inventory/StockCounting';
import UsersPage from '../pages/system/Users';
import RolesPage from '../pages/system/Roles';
import LoginLogsPage from '../pages/system/LoginLogs';
import NumberingConfigsPage from '../pages/system/NumberingConfigs';
import LoginDevicesPage from '../pages/system/LoginDevices';
import ApprovalProcessPage from '../pages/system/ApprovalProcess';
import SettingsPage from '../pages/system/Settings';
import EmailConfigPage from '../pages/system/EmailConfig';
import EmployeePositionsPage from '../pages/employeePositions';
import EmployeesPage from '../pages/employees';
import SalesmanTypesPage from '../pages/salesmanTypes';
import PlaceholderPage from '../components/PlaceholderPage';
import ReportPlaceholderPage from '../components/ReportPlaceholderPage';

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
            <Route path="/product-groups" element={<ProductGroupsPage />} />
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

            {/* Vung dia ly (Region/Province/District/Ward) - API that, xem V11__geography.sql */}
            <Route path="/regions" element={<RegionsPage />} />
            <Route path="/provinces" element={<ProvincesPage />} />
            <Route path="/districts" element={<DistrictsPage />} />
            <Route path="/wards" element={<WardsPage />} />

            <Route path="/goods-receipts" element={<GoodsReceiptPage />} />
            <Route path="/purchase/goods-return" element={<PurchaseGoodsReturnPage />} />
            <Route path="/purchase/purchase-request" element={<PlaceholderPage title="Purchase Request" />} />
            <Route path="/purchase/auto-rpo" element={<PlaceholderPage title="Auto RPO log / SKU Target Setup" />} />

            <Route path="/sales-orders" element={<SalesOrderPage />} />
            <Route path="/sales/returns" element={<SalesReturnPage />} />
            <Route path="/sales/invoices" element={<InvoicePage />} />
            <Route path="/sales/picking-list" element={<PickingListPage />} />
            <Route path="/sales/delivery-results" element={<DeliveryResultsPage />} />
            <Route path="/sales/sales-request" element={<PlaceholderPage title="Sales Request" />} />
            <Route path="/sales/delivery-orders" element={<PlaceholderPage title="Delivery Orders" />} />
            <Route path="/sales/delivery-confirm" element={<PlaceholderPage title="Delivery Confirm" />} />
            <Route path="/sales/credit-memos" element={<PlaceholderPage title="Credit Memos (đã gộp vào Returns)" />} />
            <Route path="/sales/document-generation" element={<PlaceholderPage title="Document Generation" />} />
            <Route path="/sales/printed-note" element={<PlaceholderPage title="Printed Note (Express)" />} />
            <Route path="/sales/document-printing" element={<PlaceholderPage title="Document Printing" />} />
            <Route path="/sales/return-request" element={<PlaceholderPage title="Return Request (đã gộp vào Returns)" />} />
            <Route path="/sales/upload-vat-pit" element={<PlaceholderPage title="Upload VAT & PIT of Incentive" />} />
            <Route path="/inventory/inventories" element={<InventoriesPage />} />
            <Route path="/inventory/goods-issue" element={<GoodsIssuePage />} />
            <Route path="/inventory/transfer" element={<TransferPage />} />
            <Route path="/inventory/transfer-confirmation" element={<TransferConfirmationPage />} />
            <Route path="/inventory/stock-counting" element={<StockCountingPage />} />

            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employee-positions" element={<EmployeePositionsPage />} />
            <Route path="/salesman-types" element={<SalesmanTypesPage />} />

            {/* Module rong cho Nhi (PowerBI) - khong co API/du lieu, xem tonghop.md Nhom 7 */}
            <Route path="/reports/sales" element={<ReportPlaceholderPage title="Báo cáo bán hàng" />} />
            <Route path="/reports/inventory" element={<ReportPlaceholderPage title="Báo cáo kho" />} />
            <Route path="/reports/purchase" element={<ReportPlaceholderPage title="Báo cáo mua hàng" />} />
            <Route path="/reports/catalog" element={<ReportPlaceholderPage title="Báo cáo danh mục" />} />

            {/* Nguoi dung & Phan quyen: chi ADMIN duoc truy cap - go thang URL se bi chan hien 403 */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/system/login-logs" element={<LoginLogsPage />} />
              <Route path="/system/numbering-configs" element={<NumberingConfigsPage />} />
              <Route path="/system/login-devices" element={<LoginDevicesPage />} />
              <Route path="/system/approval-process" element={<ApprovalProcessPage />} />
              <Route path="/system/settings" element={<SettingsPage />} />
              <Route path="/system/email-config" element={<EmailConfigPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
