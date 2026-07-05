import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, CalendarCheck, Package, Users, AlertTriangle, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function MetricCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="bg-white border border-navy-100 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list('-created_date', 100),
      base44.entities.Equipment.list('-created_date', 100),
      base44.entities.Customer.list('-created_date', 100),
      base44.entities.MaintenanceRecord.filter({ status: "Scheduled" }, '-next_service_date', 10),
    ]).then(([b, e, c, m]) => {
      setBookings(b);
      setEquipment(e);
      setCustomers(c);
      setMaintenance(m);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeBookings = bookings.filter(b => ["Approved", "Paid", "Active Hire"].includes(b.status));
  const totalRevenue = bookings.filter(b => b.status === "Paid" || b.status === "Completed").reduce((sum, b) => sum + (b.total_cost || 0), 0);
  const pendingBookings = bookings.filter(b => b.status === "Pending");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-navy-500">Dashboard</h1>
        <p className="text-navy-300 text-sm mt-1">Overview of your operations</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={DollarSign} label="Total Revenue" value={`R${totalRevenue.toLocaleString()}`} color="bg-green-100 text-green-600" loading={loading} />
        <MetricCard icon={CalendarCheck} label="Active Bookings" value={activeBookings.length} color="bg-blue-100 text-blue-600" loading={loading} />
        <MetricCard icon={Package} label="Total Equipment" value={equipment.length} color="bg-gold-100 text-gold-600" loading={loading} />
        <MetricCard icon={Users} label="Customers" value={customers.length} color="bg-purple-100 text-purple-600" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Bookings */}
        <div className="bg-white border border-navy-100 rounded-lg">
          <div className="p-5 border-b border-navy-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-navy-500">Pending Bookings</h2>
            <Link to="/admin/bookings" className="text-xs text-gold font-heading font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 skeleton-pulse rounded" />)}</div>
            ) : pendingBookings.length === 0 ? (
              <p className="text-navy-300 text-sm text-center py-6">No pending bookings</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-steel-100 rounded-lg">
                    <div>
                      <div className="font-heading font-bold text-navy-500 text-sm">{b.equipment_name || "Equipment"}</div>
                      <div className="font-mono text-[11px] text-navy-300">{b.booking_ref || b.id.slice(0, 8)} • {b.customer_name || "Customer"}</div>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-mono font-bold rounded">PENDING</span>
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

      {/* Recent Bookings */}
      <div className="mt-6 bg-white border border-navy-100 rounded-lg">
        <div className="p-5 border-b border-navy-100">
          <h2 className="font-display font-bold text-navy-500">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 skeleton-pulse rounded" />)}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-steel-100 text-left">
                  <th className="px-5 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Ref</th>
                  <th className="px-5 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Customer</th>
                  <th className="px-5 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Equipment</th>
                  <th className="px-5 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Dates</th>
                  <th className="px-5 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Total</th>
                  <th className="px-5 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 10).map(b => (
                  <tr key={b.id} className="border-t border-navy-50 hover:bg-steel-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-navy-500">{b.booking_ref || b.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-navy-500">{b.customer_name || "—"}</td>
                    <td className="px-5 py-3 text-navy-400">{b.equipment_name || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-navy-400">{b.start_date} — {b.end_date}</td>
                    <td className="px-5 py-3 font-mono font-bold text-navy-500">R{(b.total_cost || 0).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                        b.status === "Paid" || b.status === "Completed" ? "bg-green-100 text-green-700" :
                        b.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        b.status === "Cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}