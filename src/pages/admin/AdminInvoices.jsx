import React, { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ invoice_number: "", customer_id: "", customer_name: "", items: "", subtotal: "", vat_amount: "", total: "", due_date: "", notes: "", document_type: "Invoice" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.Invoice.list('-created_date', 200).then(setInvoices).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    base44.entities.Customer.list('-created_date', 200).then(setCustomers).catch(() => {});
  }, []);

  const customerLabel = (c) => c.company_name || c.full_name || c.contact_person || c.email;
  const onCustomerChange = (id) => {
    const c = customers.find(x => x.id === id);
    setForm(prev => ({ ...prev, customer_id: id, customer_name: c ? customerLabel(c) : "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, subtotal: Number(form.subtotal) || 0, vat_amount: Number(form.vat_amount) || 0, total: Number(form.total) || 0 };
      if (!data.invoice_number) data.invoice_number = `INV-${Date.now().toString(36).toUpperCase()}`;
      await base44.entities.Invoice.create(data);
      toast({ title: "Invoice created" });
      setDialogOpen(false);
      load();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const filtered = filter === "All" ? invoices : invoices.filter(i => i.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Invoices & Quotations</h1>
          <p className="text-navy-300 text-sm mt-1">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["All", "Draft", "Sent", "Paid", "Overdue", "Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setForm({ invoice_number: "", customer_id: "", customer_name: "", items: "", subtotal: "", vat_amount: "", total: "", due_date: "", notes: "", document_type: "Invoice" }); setDialogOpen(true); }} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
            <Plus className="w-4 h-4 mr-2" /> New Invoice
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No invoices found</p></div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100 text-left">
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Number</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Type</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Customer</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Total</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Due Date</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-t border-navy-50 hover:bg-steel-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-navy-500 font-bold">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-navy-400">{inv.document_type || "Invoice"}</td>
                  <td className="px-4 py-3 text-navy-500">{inv.customer_name || "—"}</td>
                  <td className="px-4 py-3 font-mono font-bold text-navy-500">R{(inv.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{inv.due_date || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                      inv.status === "Paid" ? "bg-green-100 text-green-700" :
                      inv.status === "Overdue" ? "bg-red-100 text-red-700" :
                      inv.status === "Sent" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Type</label>
                <Select value={form.document_type} onValueChange={v => setForm({...form, document_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="Quotation">Quotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Number</label>
                <Input value={form.invoice_number} onChange={e => setForm({...form, invoice_number: e.target.value})} placeholder="Auto-generated" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Customer</label>
              {customers.length === 0 ? (
                <p className="text-navy-300 text-sm italic">No customers found. Add customers first.</p>
              ) : (
                <Select value={form.customer_id} onValueChange={onCustomerChange}>
                  <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{customerLabel(c)}{c.company_name && c.full_name ? ` — ${c.full_name}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Items / Description</label>
              <Textarea value={form.items} onChange={e => setForm({...form, items: e.target.value})} rows={3} className="resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Subtotal</label>
                <Input type="number" value={form.subtotal} onChange={e => { const s = Number(e.target.value) || 0; setForm({...form, subtotal: e.target.value, vat_amount: String(Math.round(s * 0.15)), total: String(Math.round(s * 1.15))}); }} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">VAT (15%)</label>
                <Input type="number" value={form.vat_amount} readOnly className="bg-steel-100" />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Total</label>
                <Input type="number" value={form.total} readOnly className="bg-steel-100 font-bold" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Due Date</label>
              <Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}