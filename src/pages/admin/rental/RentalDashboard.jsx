import React, { useState, useEffect } from "react";
import { Loader2, Package, Users, FileText, DollarSign, AlertTriangle, TrendingUp, CalendarCheck, Clock, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { base44 } from "@/api/base44Client";

const GOLD = "#F4B400";
const NAVY = "#0B1F3A";

function StatCard({ icon: Icon, label, value, sub, color, to }) {
  const inner = (
    <div className="bg-white border border-navy-100 rounded-lg p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-navy-300 tracking-wider uppercase">{label}</div>
          <div className="font-display font-black text-3xl text-navy-500 mt-1">{value}</div>
          {sub && <div className="text-xs text-navy-300 mt-1">{sub}</div>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function RentalDashboard() {
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.RentalEquipment.list("-created_date", 500).catch(() => []),
      base44.entities.RentalBooking.list("-created_date", 500).catch(() => []),
      base44.entities.RentalInvoice.list("-created_date", 500).catch(() => []),
      base44.entities.Payment.list("-created_date", 200).catch(() => []),
    ]).then(([eq, bk, inv, pay]) => { setEquipment(eq); setBookings(bk); setInvoices(inv); setPayments(pay); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;

  const totalEquip = equipment.length;
  const available = equipment.filter(e => e.status === "Available").length;
  const onHire = equipment.filter(e => e.status === "On Hire").length;
  const maintenance = equipment.filter(e => e.status === "Under Maintenance").length;

  const activeBookings = bookings.filter(b => ["Confirmed", "Equipment Dispatched", "On Hire"].includes(b.status)).length;
  const pendingQuotes = bookings.filter(b => b.status === "Quotation").length;

  const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const totalPaid = payments.filter(p => !["Failed", "Refunded", "Reversed"].includes(p.status)).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const outstanding = invoices.reduce((s, i) => s + Math.max(0, Number(i.outstanding) || 0), 0);
  const unreconciledPayments = payments.filter(p => p.reconciliation_status !== "Reconciled" && !["Failed", "Refunded", "Reversed"].includes(p.status));
  const overdue = invoices.filter(i => i.status === "Overdue").length;

  const today = new Date().toISOString().slice(0, 10);
  const todayReturns = bookings.filter(b => b.end_date === today && b.status === "On Hire").length;
  const todayDispatches = bookings.filter(b => b.start_date === today && b.status === "Confirmed").length;

  // Monthly revenue
  const monthlyMap = {};
  invoices.forEach(inv => {
    if (!inv.invoice_date) return;
    const m = inv.invoice_date.slice(0, 7);
    monthlyMap[m] = (monthlyMap[m] || 0) + (inv.total || 0);
  });
  const monthlyData = Object.entries(monthlyMap).sort().slice(-6).map(([m, v]) => ({ month: m.slice(5), revenue: v }));

  // Equipment status pie
  const statusCounts = {};
  equipment.forEach(e => { statusCounts[e.status] = (statusCounts[e.status] || 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = [NAVY, GOLD, "#22C55E", "#EF4444", "#3B82F6", "#A855F7"];

  const recentBookings = bookings.slice(0, 5);
  const overdueInvoices = invoices.filter(i => i.status === "Overdue").slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-navy-500">Equipment Rental Dashboard</h1>
        <p className="text-navy-300 text-sm mt-1">Live overview of fleet, bookings &amp; financials</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard icon={Package} label="Total Equipment" value={totalEquip} to="/admin/rental/equipment" color="bg-navy-500" />
        <StatCard icon={Package} label="Available" value={available} color="bg-green-600" to="/admin/rental/equipment" />
        <StatCard icon={Package} label="On Hire" value={onHire} color="bg-gold" to="/admin/rental/bookings" />
        <StatCard icon={Wrench} label="Maintenance" value={maintenance} color="bg-orange-500" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard icon={CalendarCheck} label="Active Bookings" value={activeBookings} to="/admin/rental/bookings" color="bg-blue-600" />
        <StatCard icon={FileText} label="Pending Quotes" value={pendingQuotes} to="/admin/rental/quotations" color="bg-purple-600" />
        <StatCard icon={Clock} label="Today's Returns" value={todayReturns} color="bg-amber-600" />
        <StatCard icon={Clock} label="Today's Dispatches" value={todayDispatches} color="bg-teal-600" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Invoiced" value={`R${totalInvoiced.toLocaleString()}`} color="bg-navy-500" to="/admin/rental/invoices" />
        <StatCard icon={DollarSign} label="Total Paid" value={`R${totalPaid.toLocaleString()}`} sub={`${unreconciledPayments.length} unreconciled payment${unreconciledPayments.length === 1 ? "" : "s"}`} color="bg-green-600" to="/admin/rental/payments" />
        <StatCard icon={DollarSign} label="Outstanding" value={`R${outstanding.toLocaleString()}`} color="bg-amber-600" />
        <StatCard icon={AlertTriangle} label="Overdue Invoices" value={overdue} color="bg-red-600" to="/admin/rental/invoices" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h3 className="font-heading font-bold text-navy-500 text-sm mb-4">Monthly Revenue (R)</h3>
          {monthlyData.length === 0 ? <p className="text-navy-300 text-sm py-8 text-center">No invoice data yet</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => `R${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h3 className="font-heading font-bold text-navy-500 text-sm mb-4">Fleet Status</h3>
          {pieData.length === 0 ? <p className="text-navy-300 text-sm py-8 text-center">No equipment yet</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-heading font-bold text-navy-500 text-sm">Recent Bookings</h3>
            <Link to="/admin/rental/bookings" className="text-gold text-[10px] font-mono uppercase tracking-wider hover:underline">View All</Link>
          </div>
          {recentBookings.length === 0 ? <p className="text-navy-300 text-sm py-4 text-center">No bookings</p> : (
            <div className="space-y-2">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center justify-between p-2 border border-navy-50 rounded">
                  <div>
                    <div className="font-heading font-bold text-navy-500 text-sm">{b.booking_number} — {b.customer_name}</div>
                    <div className="text-navy-300 text-xs">{b.equipment_name} · {b.start_date} → {b.end_date}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-navy-100 text-navy-500">{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-heading font-bold text-red-600 text-sm">Overdue Invoices</h3>
            <Link to="/admin/rental/invoices" className="text-gold text-[10px] font-mono uppercase tracking-wider hover:underline">View All</Link>
          </div>
          {overdueInvoices.length === 0 ? <p className="text-navy-300 text-sm py-4 text-center">No overdue invoices</p> : (
            <div className="space-y-2">
              {overdueInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-2 border border-red-100 rounded bg-red-50">
                  <div>
                    <div className="font-heading font-bold text-navy-500 text-sm">{inv.invoice_number}</div>
                    <div className="text-navy-300 text-xs">{inv.customer_name} · Due {inv.due_date}</div>
                  </div>
                  <span className="font-mono font-bold text-red-600 text-sm">R{(inv.outstanding || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}