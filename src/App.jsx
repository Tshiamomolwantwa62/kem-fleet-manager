import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

// Public pages
import Home from '@/pages/Home';
import About from '@/pages/About';
import Services from '@/pages/Services';
import Equipment from '@/pages/Equipment';
import Contact from '@/pages/Contact';
import Blog from '@/pages/Blog';
import Careers from '@/pages/Careers';
import Gallery from '@/pages/Gallery';

// Layouts
import PublicLayout from '@/components/PublicLayout';
import AdminLayout from '@/components/admin/AdminLayout';

// Admin pages
import Dashboard from '@/pages/admin/Dashboard';
import AdminEquipment from '@/pages/admin/AdminEquipment';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminCustomers from '@/pages/admin/AdminCustomers';
import AdminInvoices from '@/pages/admin/AdminInvoices';
import AdminMaintenance from '@/pages/admin/AdminMaintenance';
import AdminTestimonials from '@/pages/admin/AdminTestimonials';
import AdminProjects from '@/pages/admin/AdminProjects';
import AdminGallery from '@/pages/admin/AdminGallery';
import AdminBlog from '@/pages/admin/AdminBlog';
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminContent from '@/pages/admin/AdminContent';
import AdminPopups from '@/pages/admin/AdminPopups';
import AdminBanners from '@/pages/admin/AdminBanners';
import AdminReports from '@/pages/admin/AdminReports';
import HRDashboard from '@/pages/admin/HRDashboard';
import AdminEmployees from '@/pages/admin/AdminEmployees';
import EmployeeProfile from '@/pages/admin/EmployeeProfile';
import AdminLeave from '@/pages/admin/AdminLeave';
import RentalDashboard from '@/pages/admin/rental/RentalDashboard';
import RentalEquipmentPage from '@/pages/admin/rental/RentalEquipmentPage';
import RentalBookingsPage from '@/pages/admin/rental/RentalBookingsPage';
import QuotationsPage from '@/pages/admin/rental/QuotationsPage';
import RentalInvoicesPage from '@/pages/admin/rental/RentalInvoicesPage';
import RentalCustomersPage from '@/pages/admin/rental/RentalCustomersPage';
import PaymentsPage from '@/pages/admin/rental/PaymentsPage';
import SystemSettingsPage from '@/pages/admin/rental/SystemSettingsPage';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy-500">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy-400 border-t-gold rounded-full animate-spin mx-auto" />
          <div className="mt-4 font-mono text-xs text-navy-300 tracking-wider">LOADING...</div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/gallery" element={<Gallery />} />
      </Route>

      {/* Admin routes (protected) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/equipment" element={<AdminEquipment />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/invoices" element={<AdminInvoices />} />
          <Route path="/admin/maintenance" element={<AdminMaintenance />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/gallery" element={<AdminGallery />} />
          <Route path="/admin/testimonials" element={<AdminTestimonials />} />
          <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/popups" element={<AdminPopups />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/hr" element={<HRDashboard />} />
          <Route path="/admin/employees" element={<AdminEmployees />} />
          <Route path="/admin/employee/:id" element={<EmployeeProfile />} />
          <Route path="/admin/leave" element={<AdminLeave />} />
          <Route path="/admin/rental" element={<RentalDashboard />} />
          <Route path="/admin/rental/equipment" element={<RentalEquipmentPage />} />
          <Route path="/admin/rental/bookings" element={<RentalBookingsPage />} />
          <Route path="/admin/rental/quotations" element={<QuotationsPage />} />
          <Route path="/admin/rental/invoices" element={<RentalInvoicesPage />} />
          <Route path="/admin/rental/customers" element={<RentalCustomersPage />} />
          <Route path="/admin/rental/payments" element={<PaymentsPage />} />
          <Route path="/admin/settings" element={<SystemSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App