import React, { useState, useEffect } from "react";
import { Loader2, FileText, Download, DollarSign, Package, Users, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AdminReports() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("revenue");
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list('-created_date', 500),
      base44.entities.Equipment.list('-created_date', 200),
      base44.entities.Customer.list('-created_date', 200),
      base44.entities.Invoice.list('-created_date', 200),
    ]).then(([b, e, c, inv]) => {
      setBookings(b);
      setEquipment(e);
      setCustomers(c);
      setInvoices(inv);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const paidBookings = bookings.filter(b => b.status === "Paid" || b.status === "Completed");
  const totalRevenue = paidBookings.reduce((s, b) => s + (b.total_cost || 0), 0);
  const outstandingInvoices = invoices.filter(i => i.status === "Overdue" || i.status === "Sent");
  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + (i.total || 0), 0);
  const activeRentals = bookings.filter(b => b.status === "Active Hire");

  const handleExportCSV = () => {
    let data = [];
    let filename = "";

    if (reportType === "revenue") {
      data = paidBookings.map(b => ({
        Ref: b.booking_ref || b.id.slice(0, 8),
        Customer: b.customer_name || "",
        Equipment: b.equipment_name || "",
        Start: b.start_date || "",
        End: b.end_date || "",
        Subtotal: b.subtotal || 0,
        VAT: b.vat_amount || 0,
        Total: b.total_cost || 0,
        Status: b.status,
      }));
      filename = "revenue-report.csv";
    } else if (reportType === "equipment") {
      data = equipment.map(e => ({
        Name: e.name,
        Category: e.category,
        "Daily Rate": e.daily_rate || 0,
        "Weekly Rate": e.weekly_rate || 0,
        "Monthly Rate": e.monthly_rate || 0,
        Status: e.availability_status,
        "Operator Available": e.operator_available ? "Yes" : "No",
      }));
      filename = "equipment-report.csv";
    } else if (reportType === "customers") {
      data = customers.map(c => ({
        Name: c.company_name || c.full_name || "",
        Type: c.customer_type,
        Email: c.email,
        Phone: c.phone,
        Status: c.status || "Active",
      }));
      filename = "customer-report.csv";
    } else if (reportType === "payments") {
      data = invoices.map(i => ({
        Number: i.invoice_number,
        Customer: i.customer_name || "",
        Type: i.document_type,
        Total: i.total || 0,
        Status: i.status,
        "Due Date": i.due_date || "",
      }));
      filename = "payments-report.csv";
    } else if (reportType === "outstanding") {
      data = outstandingInvoices.map(i => ({
        Number: i.invoice_number,
        Customer: i.customer_name || "",
        Total: i.total || 0,
        Status: i.status,
        "Due Date": i.due_date || "",
      }));
      filename = "outstanding-invoices.csv";
    }

    if (data.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported" });
  };

  const REPORTS = [
    { key: "revenue", label: "Revenue Report", icon: DollarSign, desc: "All paid and completed bookings with totals" },
    { key: "equipment", label: "Equipment Utilisation", icon: Package, desc: "All equipment with rates and availability" },
    { key: "customers", label: "Customer Report", icon: Users, desc: "Complete customer list with details" },
    { key: "payments", label: "Payment Report", icon: FileText, desc: "All invoices and quotations with status" },
    { key: "outstanding", label: "Outstanding Invoices", icon: CalendarCheck, desc: "Unpaid and overdue invoices" },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-navy-500">Reports</h1>
        <p className="text-navy-300 text-sm mt-1">Generate and download business reports</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <DollarSign className="w-8 h-8 text-green-600 mb-2" />
          <div className="font-mono text-xs text-navy-300 tracking-wider uppercase">Total Revenue</div>
          <div className="font-display font-bold text-2xl text-navy-500">R{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <CalendarCheck className="w-8 h-8 text-blue-600 mb-2" />
          <div className="font-mono text-xs text-navy-300 tracking-wider uppercase">Active Rentals</div>
          <div className="font-display font-bold text-2xl text-navy-500">{activeRentals.length}</div>
        </div>
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <FileText className="w-8 h-8 text-red-600 mb-2" />
          <div className="font-mono text-xs text-navy-300 tracking-wider uppercase">Outstanding</div>
          <div className="font-display font-bold text-2xl text-navy-500">R{outstandingTotal.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-navy-100 rounded-lg p-5">
          <Users className="w-8 h-8 text-purple-600 mb-2" />
          <div className="font-mono text-xs text-navy-300 tracking-wider uppercase">Total Customers</div>
          <div className="font-display font-bold text-2xl text-navy-500">{customers.length}</div>
        </div>
      </div>

      {/* Report Generator */}
      <div className="bg-white border border-navy-100 rounded-lg p-6">
        <h2 className="font-display font-bold text-navy-500 text-lg mb-4">Generate Report</h2>
        <div className="space-y-3 mb-6">
          {REPORTS.map(r => (
            <label key={r.key} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${reportType === r.key ? "border-gold bg-gold/5" : "border-navy-100 hover:border-navy-200"}`}>
              <input type="radio" name="report" checked={reportType === r.key} onChange={() => setReportType(r.key)} className="sr-only" />
              <r.icon className={`w-6 h-6 ${reportType === r.key ? "text-gold" : "text-navy-300"}`} />
              <div>
                <div className="font-heading font-bold text-navy-500">{r.label}</div>
                <div className="text-navy-300 text-sm">{r.desc}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
            <Download className="w-4 h-4 mr-2" /> Download CSV
          </Button>
          <span className="text-navy-300 text-sm">
            {reportType === "revenue" ? `${paidBookings.length} records` :
             reportType === "equipment" ? `${equipment.length} records` :
             reportType === "customers" ? `${customers.length} records` :
             reportType === "payments" ? `${invoices.length} records` :
             `${outstandingInvoices.length} records`}
          </span>
        </div>
      </div>

      {/* Preview Table */}
      <div className="mt-6 bg-white border border-navy-100 rounded-lg overflow-x-auto">
        <div className="p-4 border-b border-navy-50">
          <h2 className="font-display font-bold text-navy-500">Preview</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-steel-100 text-left">
              {reportType === "revenue" && ["Ref", "Customer", "Equipment", "Total", "Status"].map(h => <th key={h} className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">{h}</th>)}
              {reportType === "equipment" && ["Name", "Category", "Daily Rate", "Status"].map(h => <th key={h} className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">{h}</th>)}
              {reportType === "customers" && ["Name", "Type", "Email", "Status"].map(h => <th key={h} className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">{h}</th>)}
              {(reportType === "payments" || reportType === "outstanding") && ["Number", "Customer", "Total", "Status"].map(h => <th key={h} className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {reportType === "revenue" && paidBookings.slice(0, 10).map(b => (
              <tr key={b.id} className="border-t border-navy-50">
                <td className="px-4 py-3 font-mono text-xs text-navy-500">{b.booking_ref || b.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-navy-500">{b.customer_name}</td>
                <td className="px-4 py-3 text-navy-400">{b.equipment_name}</td>
                <td className="px-4 py-3 font-mono font-bold text-navy-500">R{(b.total_cost || 0).toLocaleString()}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-mono font-bold rounded">{b.status}</span></td>
              </tr>
            ))}
            {reportType === "equipment" && equipment.slice(0, 10).map(e => (
              <tr key={e.id} className="border-t border-navy-50">
                <td className="px-4 py-3 font-heading font-bold text-navy-500">{e.name}</td>
                <td className="px-4 py-3 text-navy-400">{e.category}</td>
                <td className="px-4 py-3 font-mono text-navy-500">R{e.daily_rate?.toLocaleString()}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-steel-100 text-navy-400 text-[10px] font-mono font-bold rounded">{e.availability_status}</span></td>
              </tr>
            ))}
            {reportType === "customers" && customers.slice(0, 10).map(c => (
              <tr key={c.id} className="border-t border-navy-50">
                <td className="px-4 py-3 font-heading font-bold text-navy-500">{c.company_name || c.full_name}</td>
                <td className="px-4 py-3 text-navy-400">{c.customer_type}</td>
                <td className="px-4 py-3 text-navy-400">{c.email}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-mono font-bold rounded">{c.status || "Active"}</span></td>
              </tr>
            ))}
            {(reportType === "payments") && invoices.slice(0, 10).map(i => (
              <tr key={i.id} className="border-t border-navy-50">
                <td className="px-4 py-3 font-mono text-xs text-navy-500">{i.invoice_number}</td>
                <td className="px-4 py-3 text-navy-500">{i.customer_name}</td>
                <td className="px-4 py-3 font-mono font-bold text-navy-500">R{(i.total || 0).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${i.status === "Paid" ? "bg-green-100 text-green-700" : i.status === "Overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{i.status}</span></td>
              </tr>
            ))}
            {reportType === "outstanding" && outstandingInvoices.slice(0, 10).map(i => (
              <tr key={i.id} className="border-t border-navy-50">
                <td className="px-4 py-3 font-mono text-xs text-navy-500">{i.invoice_number}</td>
                <td className="px-4 py-3 text-navy-500">{i.customer_name}</td>
                <td className="px-4 py-3 font-mono font-bold text-navy-500">R{(i.total || 0).toLocaleString()}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-mono font-bold rounded">{i.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}