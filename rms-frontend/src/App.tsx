import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "react-hot-toast";

import Loader from "./features/shared/LottieLoader";
import CompanyGuard from "./components/layout/guards/CompanyGuard";
import RoleGuard from "@/components/layout/guards/RoleGuard";
import AppLayout from "@/components/layout/Applayout";
import { queryClient } from "./lib/queryClient";
import CompanyRegisterGuard from "./components/layout/guards/CompanyRegisterGuard";
import RootRedirect from "./features/auth/componenets/RootRedirect";
import AllInventoryUnitPage from "./features/inventory/inventoryUnit/pages/AllInventoryUnitPage";
import AllInventorySupplierPage from "./features/inventory/inventorySupplier/pages/AllInventorySupplierPage";
import AllInventoryItemPage from "./features/inventory/inventoryItem/pages/AllInventoryItemPage";
import AllPurchasesPage from "./features/inventory/inventoryPurchase/pages/AllPurchasesPage";
import CreatePurchasePage from "./features/inventory/inventoryPurchase/pages/CreatePurchasePage";
import PurchaseDetailPage from "./features/inventory/inventoryPurchase/pages/PurchaseDetailPage";
import { CustomerList } from "./features/customer/pages/AllCustomerpage";


import AllKitchenStation from "./features/kotStation/pages/AllKitchenStation";
import StationAssignmentManager from "./features/stationManager/pages/StationAssignmentManager";

import { AllKitchenRouting } from "./features/kotStation/pages/AllKitchenRouting";
import AllShiftsPage from "./features/shift/pages/AllShiftsPage";

import ShiftDetailPage from "./features/shift/pages/ShiftDetailPage";
import ZReportPage from "./features/shift/pages/ZreportPage";
import CurrentShiftPage from "./features/shift/pages/CurrentShiftPage";
import PrintersPage from "./features/setting/printer/pages/PrintersPage";
import CreateStockOutPage from "./features/inventory/inventoryStockout/pages/CreateStockOutPage";
import StockOutDetailPage from "./features/inventory/inventoryStockout/pages/StockOutDetailPage";
import AllStockOutsPage from "./features/inventory/inventoryStockout/pages/AllStockOutsPage";
import AllStockBalancePage from "./features/inventory/stockBalance/pages/AllStockBalancePage";
import RefundsPage from "./features/Refund/pages/RefundsPage";
import { RefundDetailDrawer } from "./features/Refund/component/RefundsDetailDrawer";
import RefundDetailPage from "./features/Refund/pages/RefundDetailPage";

// ─── Public Pages ─────────────────────────────────────────────────────────────
const SignInPage = lazy(() => import("./features/auth/componenets/LoginPage"));
const CompanyRegistryPage = lazy(
  () => import("./features/auth/componenets/CompanyRegistryPage"),
);
const ErrorPage = lazy(() => import("./features/shared/systemErrorPage"));

// ─── Admin Pages ──────────────────────────────────────────────────────────────
const DashboardPage = lazy(() => import("./components/layout/DashboardPage"));
const OrdersPage = lazy(() => import("@/features/orders/pages/OrdersPage"));

const TablesPage = lazy(() => import("./features/tables/pages/TablesPage"));
const AddTablePage = lazy(() => import("./features/tables/pages/AddTablePage"));
const AllItemsPage = lazy(() => import("@/features/menu/pages/AllMenuPage"));
const AddMenuItemPage = lazy(() => import("@/features/menu/pages/AddNewMenu"));
const AllStaffPage = lazy(() => import("./features/staff/pages/AllStaffPage"));
const StaffPage = lazy(() => import("./features/staff/pages/StaffPage"));
const StockFormPage = lazy(
  () => import("./features/stock/pages/StockFormPage"),
);

const AllStockPage = lazy(() => import("./features/stock/pages/AllStockPage"));
const BillingPage = lazy(() => import("./features/billing/pages/BIllPage"));
const ActivityLogsPage = lazy(
  () => import("./features/audit/pages/ActivityLogsPage"),
);
const ReportOrderPage = lazy(
  () => import("./features/reports/pages/ReportOrderPage"),
);
const ReportStaffPage = lazy(
  () => import("./features/reports/pages/ReportStaffPage"),
);
const ReportItemsPage = lazy(
  () => import("./features/reports/pages/ReportItemsPage"),
);
const SalesReportPage = lazy(
  () => import("./features/reports/pages/ReportSalesPage"),
);
const PaymentReportPage = lazy(
  () => import("./features/reports/pages/ReportPaymentsPage"),
);

// ─── POS Pages ────────────────────────────────────────────────────────────────
const Tables = lazy(() => import("@/features/tables/pages/WaiterTable"));
const ActiveOrder = lazy(() => import("@/features/orders/pages/ActiveOrder"));
const Neworders = lazy(() => import("@/features/orders/pages/NewOrders"));

function App() {
  useEffect(() => {
    const handler = () => {
      queryClient.clear();
      window.location.href = "/sign-in";
    };
    window.addEventListener("force-logout", handler);
    return () => window.removeEventListener("force-logout", handler);
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* ── Public ──────────────────────────────────────────────────────── */}
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/" element={<RootRedirect />} />
          <Route element={<CompanyRegisterGuard />}>
            <Route path="/company-register" element={<CompanyRegistryPage />} />
          </Route>
          <Route path="/error" element={<ErrorPage />} />

          {/* ── All protected routes — single CompanyGuard + single AppLayout ── */}
          <Route element={<CompanyGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/allprinter" element={<PrintersPage />} />

              <Route element={<RoleGuard permission="bill:read" />}>
                <Route path="/billing" element={<BillingPage />} />
              </Route>
              <Route element={<RoleGuard permission="table:read" />}>
                <Route path="/tables" element={<Tables />} />
              </Route>
              <Route element={<RoleGuard permission="order:write" />}>
                <Route path="/new-order" element={<Neworders />} />
              </Route>

              <Route element={<RoleGuard permission="order:read" />}>
                <Route path="/active-orders" element={<ActiveOrder />} />
              </Route>

              <Route element={<RoleGuard permission="kot:read" />}></Route>

              <Route
                element={<RoleGuard roles={["ADMIN", "CASHIER", "MASTER"]} />}
              >
                <Route element={<RoleGuard permission="order:read" />}>
                  <Route path="/admin/orders" element={<OrdersPage />} />
                </Route>
              </Route>
              {/* ── ADMIN / MASTER routes ──────────────────────────────────── */}
              <Route element={<RoleGuard roles={["ADMIN", "MASTER"]} />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                <Route element={<RoleGuard permission="table:read" />}>
                  <Route path="/admin/table" element={<TablesPage />} />
                  <Route path="/admin/addtable" element={<AddTablePage />} />
                </Route>

                <Route element={<RoleGuard permission="menu:read" />}>
                  <Route path="/admin/menu" element={<AllItemsPage />} />
                  <Route
                    path="/admin/menu/create"
                    element={<AddMenuItemPage />}
                  />
                </Route>

                <Route element={<RoleGuard permission="user:manage" />}>
                  <Route path="/admin/staff" element={<AllStaffPage />} />
                  <Route path="/admin/create" element={<StaffPage />} />
                </Route>


                <Route element={<RoleGuard permission="stock:read" />}>
                  <Route path="/admin/openStock" element={<StockFormPage />} />
                  <Route path="/admin/stock" element={<AllStockPage />} />
                </Route>

                <Route element={<RoleGuard permission="inventory:read" />}>
                  <Route
                    path="/admin/inventoryUnits"
                    element={<AllInventoryUnitPage />}
                  />
                  <Route
                    path="/admin/inventorySupplier"
                    element={<AllInventorySupplierPage />}
                  />
                </Route>

                <Route element={<RoleGuard permission="inventory:read" />}>
                  <Route
                    path="/admin/inventoryitems"
                    element={<AllInventoryItemPage />}
                  />
                  <Route
                    path="/admin/inventory/purchases"
                    element={<AllPurchasesPage />}
                  />
                  <Route
                    path="/admin/inventory/purchases/:id"
                    element={<PurchaseDetailPage />}
                  />
                  <Route
                    path="/admin/inventory/stock-outs"
                    element={<AllStockOutsPage />}
                  />
                  <Route
                    path="/admin/inventory/stock-outs/:id"
                    element={<StockOutDetailPage />}
                  />
                  <Route
                    path="/admin/inventory/stock-balances"
                    element={<AllStockBalancePage />}
                  />
                </Route>

                <Route element={<RoleGuard permission="inventory:write" />}>
                  <Route
                    path="/admin/inventory/purchases/create"
                    element={<CreatePurchasePage />}
                  />
                  <Route
                    path="/admin/inventory/stock-outs/create"
                    element={<CreateStockOutPage />}
                  />
                </Route>

                <Route element={<RoleGuard permission="customer:read" />}>
                  <Route path="/admin/customers" element={<CustomerList />} />
                </Route>

                <Route element={<RoleGuard permission="shift:read" />}>
                  <Route path="/admin/shifts" element={<AllShiftsPage/>} />
                  <Route path="/admin/shifts/:id" element={<ShiftDetailPage/>} />
                  <Route path="/admin/shifts/:id/z-report" element={<ZReportPage/>} />
                </Route>
                 <Route element={<RoleGuard permission="shift:write" />}>
                  <Route path="/admin/shifts/currentShifts" element={<CurrentShiftPage/>} />
                </Route>

                <Route element={<RoleGuard permission="refund:read" />}>
                  <Route path="/admin/refunds" element={<RefundsPage/>} />
                  <Route path="/admin/refunds/:id" element={<RefundDetailPage/>} />
                  
                </Route>

                <Route element={<RoleGuard permission="kot:read" />}>
                  <Route
                    path="/admin/kotstation"
                    element={<AllKitchenStation />}
                  />
                </Route>

                <Route element={<RoleGuard permission="kot:read" />}>
                  <Route
                    path="/admin/kotstationrouting"
                    element={<AllKitchenRouting />}
                  />
                </Route>

                <Route element={<RoleGuard permission="kot:write" />}>
                  <Route
                    path="/admin/stationManager"
                    element={<StationAssignmentManager />}
                  />
                </Route>

                <Route element={<RoleGuard permission="audit:read" />}>
                  <Route
                    path="/admin/audit-log"
                    element={<ActivityLogsPage />}
                  />
                </Route>

                <Route element={<RoleGuard permission="report:read" />}>
                  <Route
                    path="/admin/reports/orders"
                    element={<ReportOrderPage />}
                  />
                  <Route
                    path="/admin/reports/staff"
                    element={<ReportStaffPage />}
                  />
                  <Route
                    path="/admin/reports/items"
                    element={<ReportItemsPage />}
                  />
                  <Route
                    path="/admin/reports/sales"
                    element={<SalesReportPage />}
                  />
                  <Route
                    path="/admin/reports/payments"
                    element={<PaymentReportPage />}
                  />
                </Route>
              </Route>

              {/* ── POS routes (WAITER / CASHIER / CASHIER_WAITER / KITCHEN) ── */}
              <Route
                element={
                  <RoleGuard
                    roles={["WAITER", "CASHIER", "CASHIER_WAITER", "KITCHEN"]}
                  />
                }
              ></Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
