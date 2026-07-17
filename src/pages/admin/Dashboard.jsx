import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, CalendarCheck, Package, Users, AlertTriangle, ArrowRight, TrendingUp, Mail, Eye, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import moment from "moment";

function MetricCard({ icon: Icon, label, value, color, loading, sublabel }) {
  return (
    <div className="bg-white border border-navy-100 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {sublabel && <span className="font-mono text-[10px] text-green-600">{sublabel}</span>}
      </div>
      <div className="font-mono text-xs text-navy-300 tracking-wider uppercase">{label}</div>
      {loading ? (
        <div className="h-8 skeleton-pulse rounded mt-1 w-24" />
      ) : (
        <div className="font-display font-bold text-2xl text-navy-500 mt-1">{value}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list('-created_date', 200),
      base44.entities.Equipment.list('-created_date', 100),
      base44.entities.Customer.list('-created_date', 100),
      base44.entities.MaintenanceRecord.filter({ status: "Scheduled" }, '-next_service_date', 10),
      base44.entities.ContactSubmission.filter({ status: "New" }, '-created_date', 5),
    ]).then(([b, e, c, m, msg]) => {
      setBookings(b);
      setEquipment(e);
      setCustomers(c);
      setMaintenance(m);
      setMessages(msg);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeBookings = bookings.filter(b => ["Approved", "Paid", "Active Hire"].includes(b.status));
  const pendingBookings = bookings.filter(b => b.status === "Pending");
  const thisMonth = moment().format("YYYY-MM");
  const monthlyRevenue = bookings.filter(b => 
    (b.status === "Paid" || b.status === "Completed") && 
    b.created_date && moment(b.created_date).format("YYYY-MM") === thisMonth
  ).reduce((sum, b) => sum + (b.total_cost || 0), 0);
  const outstandingPayments = bookings.filter(b => b.status === "Awaiting Payment").reduce((sum, b) => sum + (b.total_cost || 0), 0);
  const availableEquipment = equipment.filter(e => e.availability_status === "Available");

  // Revenue chart data (last 6 months)
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
    const month = moment().subtract(i, 'months');
    const monthKey = month.format("YYYY-MM");
    const monthBookings = bookings.filter(b =>
      (b.status === "Paid" || b.status === "Completed") &&
      b.created_date && moment(b.created_date).format("YYYY-MM") === monthKey
    );
    revenueData.push({
      month: month.format("MMM"),
      revenue: monthBookings.reduce((s, b) => s + (b.total_cost || 0), 0),
    });
  }

  // Equipment utilization
  const utilData = [
    { name: "Available", value: availableEquipment.length, color: "#22c55e" },
    { name: "Hired Out", value: equipment.filter(e => e.availability_status === "Hired Out").length, color: "#3b82f6" },
    { name: "Maintenance", value: equipment.filter(e => e.availability_status === "Maintenance").length, color: "#f59e0b" },
    { name: "Unavailable", value: equipment.filter(e => e.availability_status === "Unavailable").length, color: "#ef4444" },
  ];

  // Booking trends (last 6 months)
  const bookingTrends = [];
  for (let i = 5; i >= 0; i--) {
    const month = moment().subtract(i, 'months');
    const monthKey = month.format("YYYY-MM");
    const count = bookings.filter(b => b.created_date && moment(b.created_date).format("YYYY-MM") === monthKey).length;
    bookingTrends.push({ month: month.format("MMM"), bookings: count });
  }

  // Popular equipment
  const equipmentCounts = {};
  bookings.forEach(b => {
    if (b.equipment_name) equipmentCounts[b.equipment_name] = (equipmentCounts[b.equipment_name] || 0) + 1;
  });
  const popularEquipment = Object.entries(equipmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const popularData = popularEquipment.map(([name, count]) => ({ name: name.length > 15 ? name.slice(0, 12) + "..." : name, bookings: count }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-navy-500">Dashboard</h1>
        <p className="text-navy-300 text-sm mt-1">Overview of your operations — {moment().format("dddd, DD MMMM YYYY")}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={DollarSign} label="Revenue This Month" value={`R${monthlyRevenue.toLocaleString()}`} color="bg-green-100 text-green-600" loading={loading} />
        <MetricCard icon={CalendarCheck} label="Active Bookings" value={activeBookings.length} color="bg-blue-100 text-blue-600" loading={loading} />
        <MetricCard icon={Clock} label="Pending Requests" value={pendingBookings.length} color="bg-yellow-100 text-yellow-600" loading={loading} />
        <MetricCard icon={AlertTriangle} label="Outstanding Payments" value={`R${outstandingPayments.toLocaleString()}`} color="bg-red-100 text-red-600" loading={loading} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={Package} label="Total Equipment" value={equipment.length} color="bg-gold-100 text-gold-600" loading={loading} />
        <MetricCard icon={Package} label="Available Now" value={availableEquipment.length} color="bg-green-100 text-green-600" loading={loading} />
        <MetricCard icon={Users} label="Customers" value={customers.length} color="bg-purple-100 text-purple-600" loading={loading} />
        <MetricCard icon={Mail} label="New Enquiries" value={messages.length} color="bg-indigo-100 text-indigo-600" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h2 className="font-display font-bold text-navy-500 mb-4">Monthly Revenue</h2>
          {loading ? (
            <div className="h-64 skeleton-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `R${v/1000}k`} />
                <Tooltip formatter={(v) => `R${v.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="#F4B400" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Equipment Utilization */}
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h2 className="font-display font-bold text-navy-500 mb-4">Equipment Utilisation</h2>
          {loading ? (
            <div className="h-64 skeleton-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={utilData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {utilData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Booking Trends */}
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h2 className="font-display font-bold text-navy-500 mb-4">Booking Trends</h2>
          {loading ? (
            <div className="h-64 skeleton-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="bookings" stroke="#0B1F3A" strokeWidth={3} dot={{ fill: "#F4B400", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Popular Equipment */}
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h2 className="font-display font-bold text-navy-500 mb-4">Most Popular Equipment</h2>
          {loading ? (
            <div className="h-64 skeleton-pulse rounded" />
          ) : popularData.length === 0 ? (
            <p className="text-navy-300 text-sm text-center py-20">No booking data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={popularData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="bookings" fill="#0B1F3A" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Links + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <div className="bg-white border border-navy-100 rounded-lg">
          <div className="p-5 border-b border-navy-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-navy-500">Recent Enquiries</h2>
            <Link to="/admin/messages" className="text-xs text-gold font-heading font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 skeleton-pulse rounded" />)}</div>
            ) : messages.length === 0 ? (
              <p className="text-navy-300 text-sm text-center py-6">No new enquiries</p>
            ) : (
              <div className="space-y-3">
                {messages.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-steel-100 rounded-lg">
                    <div>
                      <div className="font-heading font-bold text-navy-500 text-sm">{m.name}</div>
                      <div className="font-mono text-[11px] text-navy-300">{m.subject || m.email}</div>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-mono font-bold rounded">NEW</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="bg-white border border-navy-100 rounded-lg">
          <div className="p-5 border-b border-navy-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-navy-500">Maintenance Alerts</h2>
            <Link to="/admin/maintenance" className="text-xs text-gold font-heading font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 skeleton-pulse rounded" />)}</div>
            ) : maintenance.length === 0 ? (
              <p className="text-navy-300 text-sm text-center py-6">No upcoming maintenance</p>
            ) : (
              <div className="space-y-3">
                {maintenance.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-steel-100 rounded-lg">
                    <div>
                      <div className="font-heading font-bold text-navy-500 text-sm">{m.equipment_name || "Equipment"}</div>
                      <div className="font-mono text-[11px] text-navy-300">{m.service_type} • Next: {m.next_service_date || "TBD"}</div>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}