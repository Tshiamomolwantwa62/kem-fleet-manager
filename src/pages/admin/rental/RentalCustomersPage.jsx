import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const STATUS_COLORS = {
  "Good Standing": "bg-green-100 text-green-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Blacklisted: "bg-red-100 text-red-700",
};

const EMPTY = {
  customer_type: "Company", company_name: "", registration_number: "", vat_number: "",
  contact_person: "", email: "", phone: "", billing_address: "", physical_address: "",
  postal_address: "", payment_terms: "Upfront", credit_status: "Good Standing", notes: "", status: "Active",
};

export default function RentalCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [customerBookings, setCustomerBookings] = useState([]);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.RentalCustomer.list("-created_date", 500)
      .then(setCustomers).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setFormOpen(true); };
  const openEdit = c => { setEditing(c); setForm({ ...EMPTY, ...c }); setFormOpen(true); };

  const save = async () => {
    if (!form.contact_person || !form.phone) { toast({ title: "Contact person and phone required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, customer_id: form.customer_id || `CUS-${Date.now().toString(36).toUpperCase().slice(-5)}` };
      editing ? await base44.entities.RentalCustomer.update(editing.id, payload) : await base44.entities.RentalCustomer.create(payload);
      toast({ title: editing ? "Customer updated" : "Customer added" });
      setFormOpen(false);
      load();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const viewCustomer = async (c) => {
    setSelected(c);
    const [invs, bks] = await Promise.all([
      base44.entities.RentalInvoice.filter({ customer_id: c.id }).catch(() => []),
      base44.entities.RentalBooking.filter({ customer_id: c.id }).catch(() => []),
    ]);
    setCustomerInvoices(invs);
    setCustomerBookings(bks);
  };

  const filtered = customers.filter(c => !search || [c.company_name, c.contact_person, c.email, c.customer_id].filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Customers</h1>
          <p className="text-navy-300 text-sm">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold"><Plus className="w-4 h-4 mr-2" /> Add Customer</Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-navy-300 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div> : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-steel-100">{["ID / Name", "Contact", "Payment Terms", "Credit", "Status", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-navy-50 hover:bg-steel-50">
                  <td className="px-4 py-3">
                    <button onClick={() => viewCustomer(c)} className="text-left">
                      <div className="font-heading font-bold text-navy-500 hover:text-gold">{c.company_name || c.contact_person}</div>
                      <div className="font-mono text-[10px] text-navy-300">{c.customer_id}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-navy-400"><div>{c.contact_person}</div><div className="text-xs text-navy-300">{c.phone}</div></td>
                  <td className="px-4 py-3 text-navy-400">{c.payment_terms}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${STATUS_COLORS[c.credit_status] || "bg-gray-100"}`}>{c.credit_status}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${c.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{c.status}</span></td>
                  <td className="px-4 py-3"><button onClick={() => openEdit(c)} className="p-1.5 text-navy-300 hover:text-gold"><Edit2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-navy-300 py-10">No customers found</p>}
        </div>
      )}

      {/* Customer detail panel */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{selected.company_name || selected.contact_person}</DialogTitle></DialogHeader>
            <Tabs defaultValue="profile">
              <TabsList><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="bookings">Bookings ({customerBookings.length})</TabsTrigger><TabsTrigger value="invoices">Invoices ({customerInvoices.length})</TabsTrigger></TabsList>
              <TabsContent value="profile" className="mt-4 grid grid-cols-2 gap-4 text-sm">
                {[["Company / Name", selected.company_name], ["Contact Person", selected.contact_person], ["Phone", selected.phone], ["Email", selected.email], ["Reg #", selected.registration_number], ["VAT #", selected.vat_number], ["Payment Terms", selected.payment_terms], ["Credit Status", selected.credit_status], ["Billing Address", selected.billing_address]].map(([l, v]) => <div key={l}><div className="font-mono text-[10px] text-navy-300 uppercase">{l}</div><div className="text-navy-500">{v || "—"}</div></div>)}
              </TabsContent>
              <TabsContent value="bookings" className="mt-4">
                {customerBookings.length === 0 ? <p className="text-navy-300 text-sm py-4 text-center">No bookings</p> : (
                  <div className="space-y-2">
                    {customerBookings.map(b => (
                      <div key={b.id} className="flex justify-between p-3 border border-navy-50 rounded text-sm">
                        <div><div className="font-bold text-navy-500">{b.booking_number}</div><div className="text-navy-300 text-xs">{b.equipment_name} · {b.start_date} → {b.end_date}</div></div>
                        <span className="font-mono text-xs px-2 py-1 rounded bg-navy-100 text-navy-500">{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="invoices" className="mt-4">
                {customerInvoices.length === 0 ? <p className="text-navy-300 text-sm py-4 text-center">No invoices</p> : (
                  <div className="space-y-2">
                    {customerInvoices.map(inv => (
                      <div key={inv.id} className="flex justify-between p-3 border border-navy-50 rounded text-sm">
                        <div><div className="font-bold text-navy-500">{inv.invoice_number}</div><div className="text-navy-300 text-xs">Total: R{(inv.total || 0).toLocaleString()} · Outstanding: R{(inv.outstanding || 0).toLocaleString()}</div></div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${STATUS_COLORS[inv.status] || "bg-gray-100"}`}>{inv.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editing ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-navy-400">Customer Type</Label><Select value={form.customer_type} onValueChange={v => sf("customer_type", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Company">Company</SelectItem><SelectItem value="Individual">Individual</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs text-navy-400">Company / Trading Name</Label><Input value={form.company_name} onChange={e => sf("company_name", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Registration Number</Label><Input value={form.registration_number} onChange={e => sf("registration_number", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">VAT Number</Label><Input value={form.vat_number} onChange={e => sf("vat_number", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Contact Person *</Label><Input value={form.contact_person} onChange={e => sf("contact_person", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Phone *</Label><Input value={form.phone} onChange={e => sf("phone", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label className="text-xs text-navy-400">Email</Label><Input type="email" value={form.email} onChange={e => sf("email", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label className="text-xs text-navy-400">Billing Address</Label><Textarea value={form.billing_address} onChange={e => sf("billing_address", e.target.value)} rows={2} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Payment Terms</Label><Select value={form.payment_terms} onValueChange={v => sf("payment_terms", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["Upfront", "7 Days", "14 Days", "30 Days", "60 Days"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs text-navy-400">Credit Status</Label><Select value={form.credit_status} onValueChange={v => sf("credit_status", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["Good Standing", "On Hold", "Blacklisted"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs text-navy-400">Notes</Label><Textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}