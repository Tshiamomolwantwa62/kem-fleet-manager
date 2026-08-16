import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Users, UserCheck, UserX, CalendarClock, Plane, Cake } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { base44 } from "@/api/base44Client";
import { empName, fmtDate, STATUS_COLORS } from "@/lib/hr";

const NAVY = "#0B1F3A";
const GOLD = "#F4B400";
const STEEL = "#9E9EB5";
const GREEN = "#22C55E";
const RED = "#EF4444";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-navy-100 rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] text-navy-300 tracking-wider uppercase">{label}</div>
          <div className="font-display font-black text-3xl text-navy-500 mt-1">{value}</div>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function HRDashboard() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Employee.list("-created_date", 500).catch(() => []),
      base44.entities.LeaveRequest.list("-created_date", 200).catch(() => []),
      base44.entities.Department.list("-created_date", 100).catch(() => []),
    ]).then(([emps, lrs, depts]) => {
      setEmployees(emps);
      setLeaveRequests(lrs);
      setDepartments(depts);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }

  const total = employees.length;
  const active = employees.filter(e => e.employment_status === "Active").length;
  const inactive = employees.filter(e => ["Terminated", "Resigned", "Suspended"].includes(e.employment_status)).length;
  const onLeave = employees.filter(e => e.employment_status === "On Leave").length;
  const pendingLeave = leaveRequests.filter(l => l.status === "Pending").length;

  // department distribution
  const deptMap = {};
  employees.forEach(e => {
    const d = e.department || "Unassigned";
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = [NAVY, GOLD, STEEL, GREEN, "#3B82F6", "#A855F7", "#EC4899"];

  // status distribution
  const statusMap = {};
  employees.forEach(e => { statusMap[e.employment_status || "Active"] = (statusMap[e.employment_status || "Active"] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  const recentEmployees = [...employees].slice(0, 5);
  const pendingRequests = leaveRequests.filter(l => l.status === "Pending").slice(0, 5);

  // upcoming birthdays (next 30 days)
  const today = new Date();
  const upcomingBdays = employees
    .map(e => {
      if (!e.date_of_birth) return null;
      const bday = new Date(today.getFullYear(), new Date(e.date_of_birth).getMonth(), new Date(e.date_of_birth).getDate());
      if (bday < today) bday.setFullYear(today.getFullYear() + 1);
      const days = Math.round((bday - today) / 86400000);
      return { e, bday, days };
    })
    .filter(Boolean)
    .filter(x => x.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-navy-500">HR Dashboard</h1>
        <p className="text-navy-300 text-sm mt-1">Workforce overview &amp; HR activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={Users} label="Total Employees" value={total} color="bg-navy-500" />
        <StatCard icon={UserCheck} label="Active" value={active} color="bg-green-600" />
        <StatCard icon={UserX} label="Inactive" value={inactive} color="bg-red-500" />
        <StatCard icon={Plane} label="On Leave" value={onLeave} color="bg-amber-500" />
        <StatCard icon={CalendarClock} label="Pending Leave" value={pendingLeave} color="bg-gold" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h3 className="font-heading font-bold text-navy-500 text-sm mb-4">Employees by Department</h3>
          {deptData.length === 0 ? (
            <p className="text-navy-300 text-sm py-8 text-center">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {deptData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h3 className="font-heading font-bold text-navy-500 text-sm mb-4">Employment Status</h3>
          {statusData.length === 0 ? (
            <p className="text-navy-300 text-sm py-8 text-center">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#506A91" }} />
                <YAxis tick={{ fontSize: 11, fill: "#506A91" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill={NAVY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent employees */}
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-navy-500 text-sm">Recent Hires</h3>
            <Link to="/admin/employees" className="text-gold font-mono text-[10px] tracking-wider uppercase hover:underline">View All</Link>
          </div>
          {recentEmployees.length === 0 ? <p className="text-navy-300 text-sm py-4 text-center">No employees yet</p> : (
            <div className="space-y-3">
              {recentEmployees.map(e => (
                <Link key={e.id} to={`/admin/employee/${e.id}`} className="flex items-center gap-3 hover:bg-steel-50 -mx-2 px-2 py-1.5 rounded transition-colors">
                  <div className="w-9 h-9 rounded-full bg-navy-500 text-gold flex items-center justify-center font-heading font-bold text-xs">{(e.first_name?.[0] || "") + (e.last_name?.[0] || "")}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-navy-500 text-sm truncate">{empName(e)}</div>
                    <div className="text-navy-300 text-xs truncate">{e.job_title || "—"}</div>
                  </div>
                  <div className="text-navy-300 text-xs font-mono">{fmtDate(e.date_joined)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending leave */}
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-navy-500 text-sm">Pending Leave Requests</h3>
            <Link to="/admin/leave" className="text-gold font-mono text-[10px] tracking-wider uppercase hover:underline">View All</Link>
          </div>
          {pendingRequests.length === 0 ? <p className="text-navy-300 text-sm py-4 text-center">No pending requests</p> : (
            <div className="space-y-3">
              {pendingRequests.map(l => (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><Plane className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-navy-500 text-sm truncate">{l.employee_name || "—"}</div>
                    <div className="text-navy-300 text-xs">{l.leave_type} · {fmtDate(l.start_date)}</div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming birthdays */}
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <h3 className="font-heading font-bold text-navy-500 text-sm mb-4">Upcoming Birthdays</h3>
          {upcomingBdays.length === 0 ? <p className="text-navy-300 text-sm py-4 text-center">None in the next 30 days</p> : (
            <div className="space-y-3">
              {upcomingBdays.map(({ e, bday, days }) => (
                <div key={e.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gold/20 text-gold flex items-center justify-center"><Cake className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold text-navy-500 text-sm truncate">{empName(e)}</div>
                    <div className="text-navy-300 text-xs">{fmtDate(bday)}</div>
                  </div>
                  <span className="text-navy-300 text-xs font-mono">{days === 0 ? "Today" : `${days}d`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}