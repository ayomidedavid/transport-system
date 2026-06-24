import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './app/_context/UserContext';
import { VendorProvider } from './app/_context/VendorContext';
import { NotificationProvider } from './app/_context/NotificationContext';
import { AdminProvider } from './app/_context/AdminContext';
import LandingPage from './app/page';
import { AuthPage } from './app/_components/AuthPage';

import DashboardLayout from './app/dashboard/layout';
import OverviewPage from './app/dashboard/page';
import BrowsePage from './app/dashboard/browse/page';
import BookingsPage from './app/dashboard/bookings/page';
import ProfilePage from './app/dashboard/profile/page';
import VendorLayout from './app/vendor-dashboard/layout';
import VendorOverview from './app/vendor-dashboard/page';
import TripsPage from './app/vendor-dashboard/trips/page';
import VendorBookingsPage from './app/vendor-dashboard/bookings/page';
import VendorAnalyticsPage from './app/vendor-dashboard/analytics/page';
import VendorProfilePage from './app/vendor-dashboard/profile/page';
import AdminLayout from './app/admin/layout';
import AdminOverview from './app/admin/page';
import AdminUsersPage from './app/admin/users/page';
import AdminVendorsPage from './app/admin/vendors/page';
import AdminBookingsPage from './app/admin/bookings/page';
import AdminTransactionsPage from './app/admin/transactions/page';
import AdminAnalyticsPage from './app/admin/analytics/page';
import AdminNotificationsPage from './app/admin/notifications/page';
import AdminSettingsPage from './app/admin/settings/page';
import AdminSecurityPage from './app/admin/security/page';
import AdminLoginPage from './app/admin/login/page';
import VerifyPaymentPage from './app/verify-payment/page';

export default function App() {
  return (
    <AdminProvider>
    <UserProvider>
    <VendorProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login"  element={<AuthPage initialMode="login"  />} />
            <Route path="/signup" element={<AuthPage initialMode="signup" />} />

            <Route path="/verify-payment" element={<VerifyPaymentPage />} />
            <Route path="/admin/login"   element={<AdminLoginPage />} />

            {/* Student dashboard */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="browse"   element={<BrowsePage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="profile"  element={<ProfilePage />} />
            </Route>

            {/* Vendor portal */}
            <Route path="/vendor" element={<VendorLayout />}>
              <Route index element={<VendorOverview />} />
              <Route path="trips"     element={<TripsPage />} />
              <Route path="bookings"  element={<VendorBookingsPage />} />
              <Route path="analytics" element={<VendorAnalyticsPage />} />
              <Route path="profile"   element={<VendorProfilePage />} />
              {/* Placeholders for new Dealport design links */}
              <Route path="transactions" element={<div style={{ padding: '2rem', textAlign: 'center' }}><h2>Finances Coming Soon</h2></div>} />
              <Route path="brand"        element={<div style={{ padding: '2rem', textAlign: 'center' }}><h2>Fleet Management Coming Soon</h2></div>} />
              <Route path="list"         element={<div style={{ padding: '2rem', textAlign: 'center' }}><h2>Trip History Coming Soon</h2></div>} />
              <Route path="reviews"      element={<div style={{ padding: '2rem', textAlign: 'center' }}><h2>Student Reviews Coming Soon</h2></div>} />
              <Route path="role"         element={<div style={{ padding: '2rem', textAlign: 'center' }}><h2>Account Roles Coming Soon</h2></div>} />
              <Route path="settings"     element={<div style={{ padding: '2rem', textAlign: 'center' }}><h2>Security Settings Coming Soon</h2></div>} />
            </Route>

            {/* Admin dashboard */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users"        element={<AdminUsersPage />} />
              <Route path="vendors"      element={<AdminVendorsPage />} />
              <Route path="bookings"     element={<AdminBookingsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="analytics"    element={<AdminAnalyticsPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings"     element={<AdminSettingsPage />} />
              <Route path="security"     element={<AdminSecurityPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </VendorProvider>
    </UserProvider>
    </AdminProvider>
  );
}
