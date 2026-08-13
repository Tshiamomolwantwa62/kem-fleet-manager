import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Edit2, DollarSign, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Issued: "bg-blue-100 text-blue-700",
  Sent: "bg-blue-100 text-blue-700",
  "Partially Paid": "bg-amber-100 text-amber-700",
  Paid: "bg-green-100 text-green-700",
  Overdue: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-500",
};

const EMPTY_ITEM = { description: "", quantity: 1, unit_price: 0, total: 0 };

function parseItems(str) {
  try { return JSON.parse(str) || []; } catch { return []; }
}

export default function RentalInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vatRate, setVatRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ customer_id: "", customer_name: "", billing_address: "", customer_vat_number: "", booking_id: "", booking_number: "", due_date: "", invoice_date: new Date().toISOString().slice(0, 10), status: "Draft", notes: "", terms: "Payment required upfront. Terms and conditions apply." });
  const [items, setItems] = useState([{ ...EMPTY_ITEM, description: "Equipment Rental" }]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [inv, c, b, settings] = await Promise.all([
      base44.entities.RentalInvoice.list("-created_date", 500),
      base44.entities.RentalCustomer.filter({ status: "Active" }).catch(() => []),
      base44.entities.RentalBooking.list("-created_date", 200).catch(() => []),
      base44.entities.SystemSetting.filter({ key: "vat_rate" }).catch(() => []),
    ]);
    setInvoices(inv); setCustomers(c); setBookings(b);
    if (settings[0]) setVatRate(Number(settings[0].value) || 15);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateItem = (i, k, v) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [k]: v };
      updated.total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const vat_amount = subtotal * vatRate / 100;
  const total = subtotal + vat_amount;

  const selectCustomer = (cid) => {
    const c = customers.find(x => x.id === cid);
    sf("customer_id", cid);
    if (c) { sf("customer_name", c.company_name || c.contact_person); sf("billing_address", c.billing_address || ""); sf("customer_vat_number", c.vat_number || ""); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ customer_id: "", customer_name: "", billing_address: "", customer_vat_number: "", booking_id: "", booking_number: "", due_date: new Date(Date.now() + 0).toISOString().slice(0, 10), invoice_date: new Date().toISOString().slice(0, 10), status: "Draft", notes: "", terms: "Payment required upfront. Terms and conditions apply." });
    setItems([{ ...EMPTY_ITEM, description: "Equipment Rental" }]);
    setFormOpen(true);
  };

  const openEdit = inv => {
    setEditing(inv);
    setForm({ ...inv });
    setItems(parseItems(inv.items).length ? parseItems(inv.items) : [{ ...EMPTY_ITEM }]);
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.customer_id) { toast({ title: "Customer required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        invoice_number: form.invoice_number || `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        items: JSON.stringify(items),
        subtotal, vat_rate: vatRate, vat_amount, total,
        amount_paid: form.amount_paid || 0,
        outstanding: total - (Number(form.amount_paid) || 0),
      };
      editing ? await base44.entities.RentalInvoice.update(editing.id, payload) : await base44.entities.RentalInvoice.create(payload);
      toast({ title: editing ? "Invoice updated" : "Invoice created" });
      setFormOpen(false);
      load();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const recordPayment = async (inv, amount) => {
    const paid = (inv.amount_paid || 0) + Number(amount);
    const outstanding = Math.max(0, inv.total - paid);
    const status = outstanding <= 0 ? "Paid" : "Partially Paid";
    await base44.entities.RentalInvoice.update(inv.id, { amount_paid: paid, outstanding, status, payment_date: new Date().toISOString().slice(0, 10) });
    toast({ title: "Payment recorded" });
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const filtered = invoices
    .filter(i => statusFilter === "All" || i.status === statusFilter)
    .filter(i => !search || [i.invoice_number, i.customer_name].filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Invoices</h1>
          <p className="text-navy-300 text-sm">{filtered.length} invoice{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
          <Plus className="w-4 h-4 mr-2" /> New Invoice
        </Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-navy-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>{["All", "Draft", "Issued", "Sent", "Partially Paid", "Paid", "Overdue", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div> : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100">{["Invoice #", "Date", "Customer", "Total", "Paid", "Outstanding", "Status", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const isOverdue = inv.status !== "Paid" && inv.status !== "Cancelled" && inv.due_date && inv.due_date < today;
                return (
                  <tr key={inv.id} className={`border-t border-navy-50 hover:bg-steel-50 ${isOverdue ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-navy-500">
                      {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500 inline mr-1" />}{inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-navy-400">{inv.invoice_date}</td>
                    <td className="px-4 py-3 font-heading font-bold text-navy-500">{inv.customer_name}</td>
                    <td className="px-4 py-3 font-mono font-bold text-navy-500">R{(inv.total || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-green-600">R{(inv.amount_paid || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-red-600">R{(inv.outstanding || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${STATUS_COLORS[isOverdue ? "Overdue" : inv.status] || "bg-gray-100"}`}>{isOverdue ? "Overdue" : inv.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(inv)} className="p-1.5 text-navy-300 hover:text-gold"><Edit2 className="w-4 h-4" /></button>
                        {inv.status !== "Paid" && inv.status !== "Cancelled" && (
                          <button onClick={() => {
                            const a = window.prompt("Payment amount (R):");
                            if (a && !isNaN(a)) recordPayment(inv, a);
                          }} className="p-1.5 text-navy-300 hover:text-green-600" title="Record Payment">
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-navy-300 py-10">No invoices found</p>}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editing ? "Edit Invoice" : "New Invoice"}</DialogTitle></DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-navy-400">Invoice Date</Label><Input type="date" value={form.invoice_date} onChange={e => sf("invoice_date", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Due Date</Label><Input type="date" value={form.due_date} onChange={e => sf("due_date", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label className="text-xs text-navy-400">Customer</Label>
                <Select value={form.customer_id || "none"} onValueChange={v => selectCustomer(v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— Select —</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name || c.contact_person}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label className="text-xs text-navy-400">Billing Address</Label><Input value={form.billing_address} onChange={e => sf("billing_address", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Customer VAT Number</Label><Input value={form.customer_vat_number} onChange={e => sf("customer_vat_number", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Booking Reference</Label>
                <Select value={form.booking_id || "none"} onValueChange={v => { const bk = bookings.find(b => b.id === v); sf("booking_id", v === "none" ? "" : v); if (bk) sf("booking_number", bk.booking_number || ""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— None —</SelectItem>{bookings.map(b => <SelectItem key={b.id} value={b.id}>{b.booking_number} — {b.customer_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-navy-400 uppercase font-mono tracking-wider">Line Items</Label>
                <Button variant="outline" size="sm" onClick={() => setItems(p => [...p, { ...EMPTY_ITEM }])} className="text-xs"><Plus className="w-3 h-3 mr-1" /> Add Line</Button>
              </div>
              <div className="border border-navy-100 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-steel-100">{["Description", "Qty", "Unit Price (R)", "Total (R)", ""].map(h => <th key={h} className="px-3 py-2 text-left font-mono text-[10px] text-navy-400 uppercase">{h}</th>)}</tr></thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-t border-navy-50">
                        <td className="px-2 py-1.5"><Input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} className="h-8 text-sm" /></td>
                        <td className="px-2 py-1.5 w-20"><Input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} className="h-8 text-sm" min={0} /></td>
                        <td className="px-2 py-1.5 w-32"><Input type="number" value={item.unit_price} onChange={e => updateItem(i, "unit_price", e.target.value)} className="h-8 text-sm" min={0} /></td>
                        <td className="px-3 py-1.5 font-mono text-navy-500 font-bold">{(Number(item.total) || 0).toFixed(2)}</td>
                        <td className="px-2 py-1.5"><button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} className="text-navy-300 hover:text-red-600 text-xs">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 bg-steel-50 border border-navy-100 rounded-lg p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-navy-400">Subtotal</span><span className="font-mono font-bold">R{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-navy-400">VAT ({vatRate}%)</span><span className="font-mono font-bold">R{vat_amount.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-navy-100 pt-2"><span className="font-heading font-bold text-navy-500">Grand Total</span><span className="font-mono font-black text-navy-500 text-base">R{total.toFixed(2)}</span></div>
              </div>
            </div>
            <div><Label className="text-xs text-navy-400">Notes</Label><Textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <div><Label className="text-xs text-navy-400">Terms &amp; Conditions</Label><Textarea value={form.terms} onChange={e => sf("terms", e.target.value)} rows={2} className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? "Update" : "Create"} Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}