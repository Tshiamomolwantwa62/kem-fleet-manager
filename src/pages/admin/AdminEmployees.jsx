import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Eye, Ban, CheckCircle, Search, ArrowUpDown, UserX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { empName, fmtDate, STATUS_COLORS, logAudit } from "@/lib/hr";

const EMPTY = {
  employee_id: "", first_name: "", middle_name: "", last_name: "", date_of_birth: "",
  gender: "Male", nationality: "South African", phone: "", email: "", address: "",
  job_title: "", department: "", employment_type: "Full-time", employment_status: "Active",
  date_joined: "", contract_start: "", contract_end: "", supervisor_name: "", work_location: "",
  salary: "", emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relation: "", notes: "",
};

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [sortKey, setSortKey] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Employee.list("-created_date", 500),
      base44.entities.Department.list("-created_date", 100).catch(() => []),
    ]).then(([emps, depts]) => { setEmployees(emps); setDepartments(depts); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY, date_joined: new Date().toISOString().slice(0, 10) }); setFormOpen(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...EMPTY, ...e, salary: e.salary || "" }); setFormOpen(true); };

  const save = async () => {
    if (!form.first_name || !form.last_name) { toast({ title: "First and last name are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        employee_id: form.employee_id || `EMP-${Date.now().toString(36).toUpperCase().slice(-5)}`,
        salary: form.salary ? Number(form.salary) : undefined,
      };
      if (editing) {
        await base44.entities.Employee.update(editing.id, payload);
        await logAudit({ action: "Updated employee", module: "Employees", record: empName(editing) });
        toast({ title: "Employee updated" });
      } else {
        const created = await base44.entities.Employee.create(payload);
        await logAudit({ action: "Added employee", module: "Employees", record: empName(payload) });
        toast({ title: "Employee added" });
      }
      setFormOpen(false);
      load();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const changeStatus = async (e, status) => {
    await base44.entities.Employee.update(e.id, { employment_status: status });
    await logAudit({ action: `Set status to ${status}`, module: "Employees", record: empName(e), prev: e.employment_status, next: status });
    toast({ title: `Employee marked as ${status}` });
    load();
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = employees
    .filter(e => statusFilter === "All" || e.employment_status === statusFilter)
    .filter(e => deptFilter === "All" || (e.department || "Unassigned") === deptFilter)
    .filter(e => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return [empName(e), e.email, e.phone, e.job_title, e.employee_id].filter(Boolean).some(v => v.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const av = (a[sortKey] || "").toString().toLowerCase();
      const bv = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const SortHeader = ({ label, k }) => (
    <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
    </th>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Employees</h1>
          <p className="text-navy-300 text-sm mt-1">{filtered.length} employee{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-navy-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search name, email, ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Active", "On Leave", "Suspended", "Terminated", "Resigned"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No employees found</p></div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100 text-left">
                <SortHeader label="Name" k="first_name" />
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Job Title</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Department</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Contact</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-t border-navy-50 hover:bg-steel-50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/employee/${e.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-500 text-gold flex items-center justify-center font-heading font-bold text-[10px]">{(e.first_name?.[0] || "") + (e.last_name?.[0] || "")}</div>
                      <div>
                        <div className="font-heading font-bold text-navy-500 hover:text-gold transition-colors">{empName(e)}</div>
                        <div className="text-navy-300 text-xs font-mono">{e.employee_id || "—"}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{e.job_title || "—"}</td>
                  <td className="px-4 py-3 text-navy-400">{e.department || "—"}</td>
                  <td className="px-4 py-3 text-navy-400">
                    <div className="text-xs">{e.email || "—"}</div>
                    <div className="text-xs font-mono text-navy-300">{e.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${STATUS_COLORS[e.employment_status] || "bg-gray-100 text-gray-600"}`}>{e.employment_status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/employee/${e.id}`} className="p-1.5 text-navy-300 hover:text-gold transition-colors" title="View"><Eye className="w-4 h-4" /></Link>
                      <button onClick={() => openEdit(e)} className="p-1.5 text-navy-300 hover:text-gold transition-colors" title="Edit"><Plus className="w-4 h-4" /></button>
                      {e.employment_status === "Active" ? (
                        <button onClick={() => changeStatus(e, "Suspended")} className="p-1.5 text-navy-300 hover:text-amber-600 transition-colors" title="Suspend"><Ban className="w-4 h-4" /></button>
                      ) : (
                        <button onClick={() => changeStatus(e, "Active")} className="p-1.5 text-navy-300 hover:text-green-600 transition-colors" title="Activate"><CheckCircle className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => changeStatus(e, "Terminated")} className="p-1.5 text-navy-300 hover:text-red-600 transition-colors" title="Terminate"><UserX className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editing ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
          <div className="space-y-5 mt-4">
            {/* Personal */}
            <div>
              <h4 className="font-mono text-[10px] text-gold tracking-widest uppercase mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><Label className="text-xs text-navy-400">First Name *</Label><Input value={form.first_name} onChange={e => setField("first_name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Middle Name</Label><Input value={form.middle_name} onChange={e => setField("middle_name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Last Name *</Label><Input value={form.last_name} onChange={e => setField("last_name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => setField("date_of_birth", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Gender</Label><Select value={form.gender} onValueChange={v => setField("gender", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs text-navy-400">Nationality</Label><Input value={form.nationality} onChange={e => setField("nationality", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Phone</Label><Input value={form.phone} onChange={e => setField("phone", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Email</Label><Input type="email" value={form.email} onChange={e => setField("email", e.target.value)} className="mt-1" /></div>
                <div className="md:col-span-3"><Label className="text-xs text-navy-400">Address</Label><Input value={form.address} onChange={e => setField("address", e.target.value)} className="mt-1" /></div>
              </div>
            </div>
            {/* Employment */}
            <div>
              <h4 className="font-mono text-[10px] text-gold tracking-widest uppercase mb-3">Employment Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><Label className="text-xs text-navy-400">Employee ID</Label><Input value={form.employee_id} onChange={e => setField("employee_id", e.target.value)} placeholder="Auto" className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Job Title</Label><Input value={form.job_title} onChange={e => setField("job_title", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Department</Label>
                  <Select value={form.department || "none"} onValueChange={v => setField("department", v === "none" ? "" : v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">— None —</SelectItem>{departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-navy-400">Employment Type</Label><Select value={form.employment_type} onValueChange={v => setField("employment_type", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["Full-time","Part-time","Contract","Casual","Intern"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs text-navy-400">Status</Label><Select value={form.employment_status} onValueChange={v => setField("employment_status", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["Active","On Leave","Suspended","Terminated","Resigned"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs text-navy-400">Work Location</Label><Input value={form.work_location} onChange={e => setField("work_location", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Date Joined</Label><Input type="date" value={form.date_joined} onChange={e => setField("date_joined", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Contract Start</Label><Input type="date" value={form.contract_start} onChange={e => setField("contract_start", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Contract End</Label><Input type="date" value={form.contract_end} onChange={e => setField("contract_end", e.target.value)} className="mt-1" /></div>
                <div className="md:col-span-2"><Label className="text-xs text-navy-400">Supervisor</Label><Input value={form.supervisor_name} onChange={e => setField("supervisor_name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Salary (R)</Label><Input type="number" value={form.salary} onChange={e => setField("salary", e.target.value)} className="mt-1" /></div>
              </div>
            </div>
            {/* Emergency contact */}
            <div>
              <h4 className="font-mono text-[10px] text-gold tracking-widest uppercase mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-xs text-navy-400">Name</Label><Input value={form.emergency_contact_name} onChange={e => setField("emergency_contact_name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Phone</Label><Input value={form.emergency_contact_phone} onChange={e => setField("emergency_contact_phone", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Relationship</Label><Input value={form.emergency_contact_relation} onChange={e => setField("emergency_contact_relation", e.target.value)} className="mt-1" /></div>
              </div>
            </div>
            <div><Label className="text-xs text-navy-400">Notes</Label><Textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{editing ? "Update" : "Add"} Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}