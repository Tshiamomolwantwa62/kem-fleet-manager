import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, CalendarCheck, Users, FileText, Wrench,
  Settings, LogOut, Menu, X, ChevronRight, Image, Briefcase, Star,
  Newspaper, Mail, Megaphone, GalleryHorizontalEnd, BarChart3, FileEdit,
  UserCog, CalendarDays, Building2, DollarSign, ClipboardList, ReceiptText,
  SlidersHorizontal, Gauge
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const ADMIN_LINKS = [
  { section: "Operations", label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Equipment", path: "/admin/equipment", icon: Package },
  { label: "Maintenance", path: "/admin/maintenance", icon: Wrench },
  { label: "Messages", path: "/admin/messages", icon: Mail },
  { label: "Projects", path: "/admin/projects", icon: Briefcase },
  { label: "Gallery", path: "/admin/gallery", icon: GalleryHorizontalEnd },
  { label: "Testimonials", path: "/admin/testimonials", icon: Star },
  { label: "Blog Posts", path: "/admin/blog", icon: Newspaper },
  { label: "Banners", path: "/admin/banners", icon: Image },
  { label: "Popups", path: "/admin/popups", icon: Megaphone },
  { label: "Content", path: "/admin/content", icon: FileEdit },
  { label: "Reports", path: "/admin/reports", icon: BarChart3 },
  { section: "HR Management", label: "HR Dashboard", path: "/admin/hr", icon: LayoutDashboard },
  { label: "Employees", path: "/admin/employees", icon: UserCog },
  { label: "Leave", path: "/admin/leave", icon: CalendarDays },
  { section: "Equipment Rental", label: "Rental Dashboard", path: "/admin/rental", icon: LayoutDashboard },
  { label: "Customers", path: "/admin/rental/customers", icon: Building2 },
  { label: "Equipment", path: "/admin/rental/equipment", icon: Package },
  { label: "Bookings", path: "/admin/rental/bookings", icon: CalendarCheck },
  { label: "Quotations", path: "/admin/rental/quotations", icon: ClipboardList },
  { label: "Machine Hours", path: "/admin/rental/hours", icon: Gauge },
  { label: "Invoices", path: "/admin/rental/invoices", icon: ReceiptText },
  { label: "Payments", path: "/admin/rental/payments", icon: DollarSign },
  { section: "Administration", label: "System Settings", path: "/admin/settings", icon: SlidersHorizontal },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="min-h-screen bg-steel-100 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-500 transform transition-transform lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} overflow-y-auto`}>
        <div className="flex flex-col h-full min-h-screen">
          {/* Logo */}
          <div className="p-5 border-b border-navy-400 flex items-center justify-between sticky top-0 bg-navy-500 z-10">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gold rounded flex items-center justify-center">
                <span className="text-navy-500 font-display font-black text-sm">K</span>
              </div>
              <div>
                <div className="font-display font-bold text-white text-sm">KEM ADMIN</div>
                <div className="text-[9px] text-navy-300 font-mono tracking-widest">MANAGEMENT</div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-navy-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {ADMIN_LINKS.map(link => {
              const isActive = location.pathname === link.path || (link.path !== "/admin" && location.pathname.startsWith(link.path));
              return (
                <React.Fragment key={link.path}>
                  {link.section && (
                    <div className="pt-4 pb-1 px-4">
                      <span className="text-[9px] font-mono tracking-widest uppercase text-navy-400">{link.section}</span>
                    </div>
                  )}
                  <Link
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gold text-navy-500"
                        : "text-navy-200 hover:bg-navy-400 hover:text-white"
                    }`}
                  >
                    <link.icon className="w-4 h-4 shrink-0" />
                    {link.label}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-4 border-t border-navy-400 space-y-1 sticky bottom-0 bg-navy-500">
            <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-200 hover:bg-navy-400 hover:text-white rounded transition-colors">
              <ChevronRight className="w-4 h-4" /> View Website
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-200 hover:bg-navy-400 hover:text-white rounded transition-colors w-full">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-navy-100 px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-navy-500 hover:bg-navy-50 rounded">
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-mono text-xs text-navy-300 tracking-wider">
            KEM PLANT & CONSTRUCTION // ADMIN PORTAL
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}