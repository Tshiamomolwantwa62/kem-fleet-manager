import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Edit2, DollarSign, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = {
  customer_id: "", customer_name: "", invoice_id: "", invoice_number: "",
  amount: "", payment_date: new Date().toISOString().slice(0, 10),
  payment_method: "EFT", bank: "", payment_reference: "", notes: "", status: "Pending",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Payment.list("-created_date", 500),
      base44.entities.RentalCustomer.filter({ status: "Active" }).catch(() => []),
      base44.entities.RentalInvoice.list("-created_date", 200).catch(() => []),
    ]).then(([p, c, i]) => { setPayments(p); setCustomers(c); setInvoices(i); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectCustomer = (cid) => {
    const c = customers.find(x => x.id === cid);
    sf("customer_id", cid);
    if (c) sf("customer_name", c.company_name || c.contact_person);
  };

  const selectInvoice = (iid) => {
    const inv = invoices.find(x => x.id === iid);
    sf("invoice_id", iid);
    if (inv) { sf("invoice_number", inv.invoice_number); sf("amount", inv.outstanding || inv.total); }
  };

  const uploadProof = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    sf("proof_of_payment_url", file_url);
    setUploading(false);
    toast({ title: "Proof uploaded" });
    e.target.value = "";
  };

  const save = async () => {
    if (!form.customer_id || !form.invoice_id || !form.amount) { toast({ title: "Customer, invoice and amount required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), status: "Received", payment_reference: form.payment_reference || `PAY-${Date.now().toString(36).toUpperCase().slice(-6)}` };
      await base44.entities.Payment.create(payload);
      // Update invoice
      const inv = invoices.find(i => i.id === form.invoice_id);
      if (inv) {
        const paid = (inv.amount_paid || 0) + Number(form.amount);
        const outstanding = Math.max(0, inv.total - paid);
        await base44.entities.RentalInvoice.update(form.invoice_id, { amount_paid: paid, outstanding, status: outstanding <= 0 ? "Paid" : "Partially Paid", payment_date: form.payment_date, payment_method: form.payment_method, payment_reference: form.payment_reference });
      }
      toast({ title: "Payment recorded" });
      setFormOpen(false);
      load();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const filtered = payments.filter(p => !search || [p.customer_name, p.invoice_number, p.payment_reference].filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Payments</h1>
          <p className="text-navy-300 text-sm">{filtered.length} payment{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => { setForm({ ...EMPTY }); setFormOpen(true); }} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
          <Plus className="w-4 h-4 mr-2" /> Record Payment
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-navy-300 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div> : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-steel-100">{["Reference", "Date", "Customer", "Invoice", "Amount", "Method", "Status"].map(h => <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-navy-50 hover:bg-steel-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-navy-500">{p.payment_reference}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{p.payment_date}</td>
                  <td className="px-4 py-3 font-heading font-bold text-navy-500">{p.customer_name}</td>
                  <td className="px-4 py-3 text-navy-400">{p.invoice_number}</td>
                  <td className="px-4 py-3 font-mono font-bold text-green-600">R{(p.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-navy-400">{p.payment_method}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 text-[10px] font-mono font-bold rounded bg-green-100 text-green-700">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-navy-300 py-10">No payments</p>}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-xs text-navy-400">Customer</Label>
              <Select value={form.customer_id || "none"} onValueChange={v => selectCustomer(v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="none">— Select —</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name || c.contact_person}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs text-navy-400">Invoice</Label>
              <Select value={form.invoice_id || "none"} onValueChange={v => selectInvoice(v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="none">— Select —</SelectItem>{invoices.filter(i => !form.customer_id || i.customer_id === form.customer_id).map(i => <SelectItem key={i.id} value={i.id}>{i.invoice_number} — R{(i.outstanding || i.total || 0).toLocaleString()} outstanding</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-navy-400">Amount (R)</Label><Input type="number" value={form.amount} onChange={e => sf("amount", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Payment Date</Label><Input type="date" value={form.payment_date} onChange={e => sf("payment_date", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Method</Label><Select value={form.payment_method} onValueChange={v => sf("payment_method", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["EFT", "Cash", "Credit Card", "Debit Card", "Cheque", "Other"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs text-navy-400">Bank</Label><Input value={form.bank} onChange={e => sf("bank", e.target.value)} className="mt-1" placeholder="e.g. FNB" /></div>
              <div className="col-span-2"><Label className="text-xs text-navy-400">Reference Number</Label><Input value={form.payment_reference} onChange={e => sf("payment_reference", e.target.value)} className="mt-1" /></div>
            </div>
            <div>
              <Label className="text-xs text-navy-400">Proof of Payment</Label>
              <div className="mt-1 flex items-center gap-2">
                <Label className="cursor-pointer">
                  <input type="file" className="hidden" onChange={uploadProof} accept=".pdf,.jpg,.jpeg,.png" />
                  <span className="inline-flex items-center px-3 py-2 border border-navy-100 text-navy-500 text-xs font-medium rounded hover:bg-steel-50">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />} Upload
                  </span>
                </Label>
                {form.proof_of_payment_url && <a href={form.proof_of_payment_url} target="_blank" rel="noreferrer" className="text-gold text-xs hover:underline">View uploaded</a>}
              </div>
            </div>
            <div><Label className="text-xs text-navy-400">Notes</Label><Textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Record Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}