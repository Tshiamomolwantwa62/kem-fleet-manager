import React, { useState, useEffect } from "react";
import { Loader2, Check, X, Plus, Trash2, Plane } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { empName, fmtDate, daysBetween, STATUS_COLORS, logAudit } from "@/lib/hr";

export default function AdminLeave() {
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [newType, setNewType] = useState({ name: "", default_days: 0, is_paid: true });
  const [typeOpen, setTypeOpen] = useState(false);
  const [balanceForm, setBalanceForm] = useState({ employee_id: "", leave_type: "", entitled: 0 });
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.LeaveRequest.list("-created_date", 200).catch(() => []),
      base44.entities.LeaveType.list("-created_date", 100).catch(() => []),
      base44.entities.Employee.filter({ employment_status: "Active" }, "-created_date", 500).catch(() => []),
      base44.entities.LeaveBalance.list("-created_date", 200).catch(() => []),
    ]).then(([r, lt, e, b]) => { setRequests(r); setLeaveTypes(lt); setEmployees(e); setBalances(b); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const decide = async (req, status) => {
    await base44.entities.LeaveRequest.update(req.id, { status, approved_by: "Admin", approval_date: new Date().toISOString().slice(0, 10) });
    await logAudit({ action: `${status} leave request`, module: "Leave", record: req.employee_name });
    if (status === "Approved") {
      const bal = balances.find(b => b.employee_id === req.employee_id && b.leave_type === req.leave_type);
      if (bal) {
        await base44.entities.LeaveBalance.update(bal.id, { used: (bal.used || 0) + (req.days || 1), remaining: Math.max(0, (bal.remaining || 0) - (req.days || 1)) });
      }
    }
    toast({ title: `Leave ${status.toLowerCase()}` });
    load();
  };

  const addType = async () => {
    if (!newType.name) { toast({ title: "Name required", variant: "destructive" }); return; }
    await base44.entities.LeaveType.create({ ...newType, default_days: Number(newType.default_days) || 0 });
    toast({ title: "Leave type added" });
    setNewType({ name: "", default_days: 0, is_paid: true });
    setTypeOpen(false);
    load();
  };

  const deleteType = async (t) => { await base44.entities.LeaveType.delete(t.id); toast({ title: "Leave type deleted" }); load(); };

  const assignBalance = async () => {
    if (!balanceForm.employee_id || !balanceForm.leave_type) { toast({ title: "Select employee and leave type", variant: "destructive" }); return; }
    const emp = employees.find(e => e.id === balanceForm.employee_id);
    const entitled = Number(balanceForm.entitled) || 0;
    await base44.entities.LeaveBalance.create({ employee_id: balanceForm.employee_id, employee_name: empName(emp), leave_type: balanceForm.leave_type, entitled, used: 0, remaining: entitled, year: new Date().getFullYear() });
    toast({ title: "Leave entitlement assigned" });
    setBalanceForm({ employee_id: "", leave_type: "", entitled: 0 });
    load();
  };

  const filtered = statusFilter === "All" ? requests : requests.filter(r => r.status === statusFilter);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-navy-500">Leave Management</h1>
        <p className="text-navy-300 text-sm mt-1">Requests, types &amp; entitlements</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
        </TabsList>

        {/* Requests */}
        <TabsContent value="requests">
          <div className="flex items-center gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>{["All", "Pending", "Approved", "Rejected", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {filtered.length === 0 ? <div className="text-center py-16 bg-white border rounded-lg"><p className="text-navy-300">No leave requests</p></div> : (
            <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-steel-100 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Employee</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Type</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Dates</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Days</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Reason</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Status</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-t border-navy-50 hover:bg-steel-50">
                      <td className="px-4 py-3 font-heading font-bold text-navy-500">{r.employee_name || "—"}</td>
                      <td className="px-4 py-3 text-navy-400">{r.leave_type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-navy-400">{fmtDate(r.start_date)} → {fmtDate(r.end_date)}</td>
                      <td className="px-4 py-3 font-mono text-navy-500 font-bold">{r.days || daysBetween(r.start_date, r.end_date)}</td>
                      <td className="px-4 py-3 text-navy-400 text-xs max-w-[200px] truncate">{r.reason || "—"}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                      <td className="px-4 py-3">
                        {r.status === "Pending" ? (
                          <div className="flex gap-1">
                            <button onClick={() => decide(r, "Approved")} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve"><Check className="w-4 h-4" /></button>
                            <button onClick={() => decide(r, "Rejected")} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject"><X className="w-4 h-4" /></button>
                          </div>
                        ) : <span className="text-navy-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Types */}
        <TabsContent value="types">
          <div className="flex justify-between items-center mb-4">
            <p className="text-navy-300 text-sm">{leaveTypes.length} leave type{leaveTypes.length !== 1 ? "s" : ""}</p>
            <Button onClick={() => setTypeOpen(true)} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold"><Plus className="w-4 h-4 mr-2" /> Add Type</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaveTypes.map(t => (
              <div key={t.id} className="bg-white border border-navy-100 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-navy-500 text-gold flex items-center justify-center"><Plane className="w-5 h-5" /></div>
                  <button onClick={() => deleteType(t)} className="p-1 text-navy-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <h3 className="font-heading font-bold text-navy-500 mt-3">{t.name}</h3>
                <div className="text-navy-300 text-xs mt-1">{t.default_days} days · {t.is_paid ? "Paid" : "Unpaid"}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Balances */}
        <TabsContent value="balances">
          <div className="bg-white border border-navy-100 rounded-lg p-5 mb-5">
            <h3 className="font-heading font-bold text-navy-500 text-sm mb-3">Assign Leave Entitlement</h3>
            <div className="flex items-end gap-3 flex-wrap">
              <div><Label className="text-xs text-navy-400">Employee</Label>
                <Select value={balanceForm.employee_id} onValueChange={v => setBalanceForm({ ...balanceForm, employee_id: v })}>
                  <SelectTrigger className="mt-1 w-56"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{empName(e)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-navy-400">Leave Type</Label>
                <Select value={balanceForm.leave_type} onValueChange={v => setBalanceForm({ ...balanceForm, leave_type: v })}>
                  <SelectTrigger className="mt-1 w-44"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{leaveTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-navy-400">Entitled Days</Label><Input type="number" value={balanceForm.entitled} onChange={e => setBalanceForm({ ...balanceForm, entitled: e.target.value })} className="mt-1 w-32" /></div>
              <Button onClick={assignBalance} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">Assign</Button>
            </div>
          </div>
          {balances.length === 0 ? <p className="text-navy-300 text-sm py-8 text-center">No leave balances assigned</p> : (
            <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-steel-100 text-left">
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Employee</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Leave Type</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Entitled</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Used</th>
                  <th className="px-4 py-3 font-mono text-[10px] text-navy-400 uppercase">Remaining</th>
                </tr></thead>
                <tbody>
                  {balances.map(b => (
                    <tr key={b.id} className="border-t border-navy-50">
                      <td className="px-4 py-3 font-heading font-bold text-navy-500">{b.employee_name}</td>
                      <td className="px-4 py-3 text-navy-400">{b.leave_type}</td>
                      <td className="px-4 py-3 font-mono text-navy-500">{b.entitled}</td>
                      <td className="px-4 py-3 font-mono text-red-600">{b.used}</td>
                      <td className="px-4 py-3 font-mono text-green-600 font-bold">{b.remaining}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Type Dialog */}
      <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">Add Leave Type</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-xs text-navy-400">Name</Label><Input value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} className="mt-1" placeholder="e.g. Annual Leave" /></div>
            <div><Label className="text-xs text-navy-400">Default Days</Label><Input type="number" value={newType.default_days} onChange={e => setNewType({ ...newType, default_days: e.target.value })} className="mt-1" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="paid" checked={newType.is_paid} onChange={e => setNewType({ ...newType, is_paid: e.target.checked })} /><Label htmlFor="paid" className="text-sm text-navy-500">Paid leave</Label></div>
            <div className="flex justify-end gap-3 pt-2"><Button variant="outline" onClick={() => setTypeOpen(false)}>Cancel</Button><Button onClick={addType} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">Add</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}