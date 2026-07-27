import React, { useState, useEffect } from "react";
import { Loader2, Eye, Ban, CheckCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = {
  customer_type: "Individual",
  company_name: "",
  registration_number: "",
  vat_number: "",
  full_name: "",
  id_number: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  status: "Active",
  notes: "",
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.Customer.list('-created_date', 200).then(setCustomers).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleBlacklist = async (c) => {
    const newStatus = c.status === "Blacklisted" ? "Active" : "Blacklisted";
    await base44.entities.Customer.update(c.id, { status: newStatus });
    toast({ title: `Customer ${newStatus.toLowerCase()}` });
    load();
    setSelected(null);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ ...EMPTY, ...c });
    setFormOpen(true);
    setSelected(null);
  };

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!form.email || !form.phone) {
      toast({ title: "Email and phone are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Customer.update(editing.id, form);
        toast({ title: "Customer updated" });
      } else {
        await base44.entities.Customer.create(form);
        toast({ title: "Customer added" });
      }
      setFormOpen(false);
      load();
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.Customer.delete(deleteId);
      toast({ title: "Customer deleted" });
      setDeleteId(null);
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = customers.filter(c => {
    const matchesFilter = filter === "All" || c.status === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || [c.company_name, c.full_name, c.email, c.phone, c.contact_person].filter(Boolean).some(v => v.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Customers</h1>
          <p className="text-navy-300 text-sm mt-1">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-[220px]"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["All", "Active", "Blacklisted", "Inactive"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openAdd} className="font-heading font-bold">
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No customers found</p></div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100 text-left">
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Name</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Type</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Email</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Phone</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-navy-50 hover:bg-steel-50 transition-colors">
                  <td className="px-4 py-3 font-heading font-bold text-navy-500">{c.company_name || c.full_name || "—"}</td>
                  <td className="px-4 py-3 text-navy-400">{c.customer_type}</td>
                  <td className="px-4 py-3 text-navy-400">{c.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                      c.status === "Active" ? "bg-green-100 text-green-700" :
                      c.status === "Blacklisted" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{c.status || "Active"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(c)} className="p-1.5 text-navy-300 hover:text-gold transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(c)} className="p-1.5 text-navy-300 hover:text-gold transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-navy-300 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-navy-500">Customer Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="font-mono text-[10px] text-navy-300 block">TYPE</span>{selected.customer_type}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">STATUS</span>{selected.status || "Active"}</div>
                {selected.company_name && <div><span className="font-mono text-[10px] text-navy-300 block">COMPANY</span>{selected.company_name}</div>}
                {selected.full_name && <div><span className="font-mono text-[10px] text-navy-300 block">NAME</span>{selected.full_name}</div>}
                <div><span className="font-mono text-[10px] text-navy-300 block">EMAIL</span>{selected.email}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">PHONE</span>{selected.phone}</div>
                {selected.address && <div className="col-span-2"><span className="font-mono text-[10px] text-navy-300 block">ADDRESS</span>{selected.address}</div>}
                {selected.vat_number && <div><span className="font-mono text-[10px] text-navy-300 block">VAT</span>{selected.vat_number}</div>}
                {selected.registration_number && <div><span className="font-mono text-[10px] text-navy-300 block">REG #</span>{selected.registration_number}</div>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => toggleBlacklist(selected)} variant={selected.status === "Blacklisted" ? "default" : "destructive"} className="font-heading font-bold text-sm">
                  {selected.status === "Blacklisted" ? <><CheckCircle className="w-4 h-4 mr-2" /> Restore</> : <><Ban className="w-4 h-4 mr-2" /> Blacklist</>}
                </Button>
                <Button onClick={() => openEdit(selected)} variant="outline" className="font-heading font-bold text-sm">
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-navy-500">{editing ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Customer Type *</Label>
                <Select value={form.customer_type} onValueChange={v => setField("customer_type", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Status</Label>
                <Select value={form.status} onValueChange={v => setField("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.customer_type === "Company" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Company Name</Label>
                  <Input value={form.company_name || ""} onChange={e => setField("company_name", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Contact Person</Label>
                  <Input value={form.contact_person || ""} onChange={e => setField("contact_person", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Registration Number</Label>
                  <Input value={form.registration_number || ""} onChange={e => setField("registration_number", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">VAT Number</Label>
                  <Input value={form.vat_number || ""} onChange={e => setField("vat_number", e.target.value)} className="mt-1" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Full Name</Label>
                  <Input value={form.full_name || ""} onChange={e => setField("full_name", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">ID Number</Label>
                  <Input value={form.id_number || ""} onChange={e => setField("id_number", e.target.value)} className="mt-1" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Email *</Label>
                <Input type="email" value={form.email || ""} onChange={e => setField("email", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Phone *</Label>
                <Input value={form.phone || ""} onChange={e => setField("phone", e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Address</Label>
              <Input value={form.address || ""} onChange={e => setField("address", e.target.value)} className="mt-1" />
            </div>

            <div>
              <Label className="font-mono text-[10px] text-navy-300 uppercase tracking-wider">Notes</Label>
              <Textarea value={form.notes || ""} onChange={e => setField("notes", e.target.value)} className="mt-1" rows={3} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)} className="font-heading font-bold text-sm">Cancel</Button>
              <Button onClick={save} disabled={saving} className="font-heading font-bold text-sm">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editing ? "Update Customer" : "Add Customer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-navy-500">Delete Customer?</DialogTitle>
          </DialogHeader>
          <p className="text-navy-300 text-sm mt-4">This action cannot be undone. The customer record will be permanently removed.</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="font-heading font-bold text-sm">Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting} className="font-heading font-bold text-sm">
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}