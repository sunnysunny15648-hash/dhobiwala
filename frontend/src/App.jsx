import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PublicHeader, WorkspaceLayout } from "./components/AppShell";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ServicesPage from "./pages/ServicesPage";
import BookingPage from "./pages/BookingPage";
import AccountPage from "./pages/AccountPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import EmployeePage from "./pages/EmployeePage";

function Protected({ roles, children }) {
  const { user, ready } = useAuth();
  if (!ready)
    return (
      <div className="loading-screen">
        <span className="spinner" />
        Preparing your space
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return (
      <Navigate
        to={
          user.role === "admin"
            ? "/admin"
            : user.role === "employee"
              ? "/employee"
              : "/account"
        }
        replace
      />
    );
  return children;
}

function PublicPage({ children }) {
  return (
    <>
      <PublicHeader />
      {children}
    </>
  );
}
function CustomerSpace({ title, eyebrow, children }) {
  return (
    <Protected roles={["customer"]}>
      <WorkspaceLayout title={title} eyebrow={eyebrow}>
        {children}
      </WorkspaceLayout>
    </Protected>
  );
}
function AdminSpace({ title, eyebrow, children }) {
  return (
    <Protected roles={["admin"]}>
      <WorkspaceLayout title={title} eyebrow={eyebrow} admin>
        {children}
      </WorkspaceLayout>
    </Protected>
  );
}
function EmployeeSpace({ title, eyebrow, children }) {
  return (
    <Protected roles={["employee"]}>
      <WorkspaceLayout title={title} eyebrow={eyebrow} employee>
        {children}
      </WorkspaceLayout>
    </Protected>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicPage>
            <HomePage />
          </PublicPage>
        }
      />
      <Route
        path="/services"
        element={
          <PublicPage>
            <ServicesPage />
          </PublicPage>
        }
      />
      <Route
        path="/login"
        element={
          <PublicPage>
            <LoginPage />
          </PublicPage>
        }
      />
      <Route
        path="/book"
        element={
          <Protected roles={["customer"]}>
            <BookingPage />
          </Protected>
        }
      />
      <Route
        path="/account"
        element={
          <CustomerSpace
            title="A little less to think about."
            eyebrow="YOUR LAUNDRY, IN GOOD HANDS"
          >
            <AccountPage />
          </CustomerSpace>
        }
      />
      <Route
        path="/account/orders"
        element={
          <CustomerSpace
            title="Every order, in its place."
            eyebrow="ORDER HISTORY"
          >
            <OrdersPage />
          </CustomerSpace>
        }
      />
      <Route
        path="/account/profile"
        element={
          <CustomerSpace
            title="The details that make it yours."
            eyebrow="PROFILE & ADDRESSES"
          >
            <ProfilePage />
          </CustomerSpace>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminSpace
            title="The day, at a glance."
            eyebrow="OPERATIONS OVERVIEW"
          >
            <AdminPage section="overview" />
          </AdminSpace>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminSpace title="Orders in motion." eyebrow="ORDER MANAGEMENT">
            <AdminPage section="orders" />
          </AdminSpace>
        }
      />
      <Route
        path="/admin/services"
        element={
          <AdminSpace title="Care, with a price tag." eyebrow="SERVICE CATALOG">
            <AdminPage section="services" />
          </AdminSpace>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <AdminSpace
            title="People who trust us."
            eyebrow="CUSTOMER MANAGEMENT"
          >
            <AdminPage section="customers" />
          </AdminSpace>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <AdminSpace title="Every rupee, accounted for." eyebrow="PAYMENTS">
            <AdminPage section="payments" />
          </AdminSpace>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <AdminSpace title="A little something extra." eyebrow="OFFERS & COUPONS">
            <AdminPage section="coupons" />
          </AdminSpace>
        }
      />
      <Route
        path="/admin/reviews"
        element={
          <AdminSpace title="Words from our customers." eyebrow="CUSTOMER REVIEWS">
            <AdminPage section="reviews" />
          </AdminSpace>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminSpace title="The bigger picture." eyebrow="BUSINESS REPORTS">
            <AdminPage section="reports" />
          </AdminSpace>
        }
      />
      <Route
        path="/admin/team"
        element={
          <AdminSpace
            title="The people behind the care."
            eyebrow="DELIVERY TEAM"
          >
            <AdminPage section="team" />
          </AdminSpace>
        }
      />
      <Route
        path="/employee"
        element={
          <EmployeeSpace
            title="Your route for today."
            eyebrow="PICKUPS & DROPOFFS"
          >
            <EmployeePage />
          </EmployeeSpace>
        }
      />
      <Route
        path="/employee/tasks"
        element={
          <EmployeeSpace title="Your assigned orders." eyebrow="TASK LIST">
            <EmployeePage />
          </EmployeeSpace>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
