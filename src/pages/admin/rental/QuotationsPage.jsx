import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Edit2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import DocumentActions from "@/components/admin/rental/DocumentActions";
import { buildQuotationHTML } from "@/lib/documentActions";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Sent: "bg-blue-100 text-blue-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Expired: "bg-orange-100 text-orange-700",
  Converted: "bg-navy-100 text-navy-500",
};

const EMPTY = {
  customer_id: "", customer_name: "", customer_address: "", equipment_id: "", equipment_name: "",
  quantity: 1, start_date: "", end_date: "", unit_rate: "", rate_type: "Per Day",
  fuel_charge: 0, delivery_charge: 0, additional_charges: 0, additional_charges_desc: "",
  terms: "Payment required upfront. Terms and conditions apply.", notes: "", status: "Draft",
};

export default function QuotationsPage() {
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [vatRate, setVatRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [q, c, e, settings] = await Promise.all([
      base44.entities.Quotation.list("-created_date", 200),
      base44.entities.RentalCustomer.filter({ status: "Active" }).catch(() => []),
      base44.entities.RentalEquipment.list().catch(() => []),
      base44.entities.SystemSetting.filter({ key: "vat_rate" }).catch(() => []),
    ]);
    setQuotes(q); setCustomers(c); setEquipment(e);
    if (settings[0]) setVatRate(Number(settings[0].value) || 15);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcTotals = (f) => {
    const days = Math.max(1, Math.round((new Date(f.end_date) - new Date(f.start_date)) / 86400000) + 1);
    const rental = (Number(f.unit_rate) || 0) * days * (Number(f.quantity) || 1);
    const sub = rental + (Number(f.fuel_charge) || 0) + (Number(f.delivery_charge) || 0) + (Number(f.additional_charges) || 0);
    const vat = sub * vatRate / 100;
    return { sub: sub.toFixed(2), vat: vat.toFixed(2), total: (sub + vat).toFixed(2), days };
  };

  const totals = calcTotals(form);

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY, date: new Date().toISOString().slice(0, 10), valid_until: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) }); setFormOpen(true); };
  const openEdit = q => { setEditing(q); setForm({ ...EMPTY, ...q }); setFormOpen(true); };

  const selectCustomer = (cid) => {
    const c = customers.find(x => x.id === cid);
    sf("customer_id", cid);
    if (c) { sf("customer_name", c.company_name || c.contact_person); sf("customer_address", c.billing_address || ""); }
  };

  const selectEquipment = (eid) => {
    const e = equipment.find(x => x.id === eid);
    sf("equipment_id", eid);
    if (e) { sf("equipment_name", e.name); sf("unit_rate", e.rental_rate || ""); sf("rate_type", e.rate_type || "Per Day"); }
  };

  const save = async () => {
    if (!form.customer_id || !form.equipment_id) { toast({ title: "Customer and equipment required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const t = calcTotals(form);
      const payload = {
        ...form, duration_days: t.days, subtotal: Number(t.sub), vat_rate: vatRate, vat_amount: Number(t.vat), total: Number(t.total),
        quantity: Number(form.quantity) || 1, unit_rate: Number(form.unit_rate) || 0,
        fuel_charge: Number(form.fuel_charge) || 0, delivery_charge: Number(form.delivery_charge) || 0,
        additional_charges: Number(form.additional_charges) || 0,
        quotation_number: form.quotation_number || `QT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      };
      editing ? await base44.entities.Quotation.update(editing.id, payload) : await base44.entities.Quotation.create(payload);
      toast({ title: editing ? "Quotation updated" : "Quotation created" });
      setFormOpen(false);
      load();
    } catch (err) { toast({ title: "Save failed", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const convertToBooking = async (q) => {
    const booking = await base44.entities.RentalBooking.create({
      booking_number: `BK-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      customer_id: q.customer_id, customer_name: q.customer_name,
      equipment_id: q.equipment_id, equipment_name: q.equipment_name,
      quantity: q.quantity, start_date: q.start_date, end_date: q.end_date,
      rental_rate: q.unit_rate, rate_type: q.rate_type, duration_days: q.duration_days,
      final_amount: q.total, calculated_amount: q.subtotal,
      quotation_id: q.id, status: "Quotation",
    });
    await base44.entities.Quotation.update(q.id, { status: "Converted", booking_id: booking.id });
    toast({ title: "Converted to booking" });
    load();
  };

  const filtered = quotes.filter(q => !search || [q.quotation_number, q.customer_name, q.equipment_name].filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Quotations</h1>
          <p className="text-navy-300 text-sm">{filtered.length} quotation{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
          <Plus className="w-4 h-4 mr-2" /> New Quotation
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-navy-300 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div> : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100">{["Quote #", "Date", "Customer", "Equipment", "Period", "Total", "Status", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(q => (
                <tr key={q.id} className="border-t border-navy-50 hover:bg-steel-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-navy-500">{q.quotation_number}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{q.date}</td>
                  <td className="px-4 py-3 font-heading font-bold text-navy-500">{q.customer_name}</td>
                  <td className="px-4 py-3 text-navy-400">{q.equipment_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{q.start_date} → {q.end_date}</td>
                  <td className="px-4 py-3 font-mono font-bold text-navy-500">R{(q.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${STATUS_COLORS[q.status] || "bg-gray-100"}`}>{q.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(q)} className="p-1.5 text-navy-300 hover:text-gold"><Edit2 className="w-4 h-4" /></button>
                      <DocumentActions
                        doc={q}
                        type="quotation"
                        buildHTML={buildQuotationHTML}
                        filename={(d) => d.quotation_number || "quotation"}
                        customerEmail={customers.find(c => c.id === q.customer_id)?.email}
                      />
                      {q.status === "Accepted" && (
                        <button onClick={() => convertToBooking(q)} title="Convert to Booking" className="p-1.5 text-navy-300 hover:text-green-600"><ArrowRight className="w-4 h-4" /></button>
                      )}
                      {q.status === "Draft" && (
                        <button onClick={() => { base44.entities.Quotation.update(q.id, { status: "Accepted" }); load(); }} className="p-1.5 text-navy-300 hover:text-green-600" title="Mark Accepted"><CheckCircle className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-navy-300 py-10">No quotations found</p>}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editing ? "Edit Quotation" : "New Quotation"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-navy-400">Quotation Date</Label><Input type="date" value={form.date} onChange={e => sf("date", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Valid Until</Label><Input type="date" value={form.valid_until} onChange={e => sf("valid_until", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2"><Label className="text-xs text-navy-400">Customer *</Label>
                <Select value={form.customer_id || "none"} onValueChange={v => selectCustomer(v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— Select —</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name || c.contact_person}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label className="text-xs text-navy-400">Equipment *</Label>
                <Select value={form.equipment_id || "none"} onValueChange={v => selectEquipment(v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— Select —</SelectItem>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-navy-400">Quantity</Label><Input type="number" value={form.quantity} onChange={e => sf("quantity", e.target.value)} className="mt-1" min={1} /></div>
              <div><Label className="text-xs text-navy-400">Unit Rate (R)</Label><Input type="number" value={form.unit_rate} onChange={e => sf("unit_rate", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Start Date</Label><Input type="date" value={form.start_date} onChange={e => sf("start_date", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">End Date</Label><Input type="date" value={form.end_date} onChange={e => sf("end_date", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Fuel Charge (R)</Label><Input type="number" value={form.fuel_charge} onChange={e => sf("fuel_charge", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Delivery Charge (R)</Label><Input type="number" value={form.delivery_charge} onChange={e => sf("delivery_charge", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Additional Charges (R)</Label><Input type="number" value={form.additional_charges} onChange={e => sf("additional_charges", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Additional Charges Description</Label><Input value={form.additional_charges_desc} onChange={e => sf("additional_charges_desc", e.target.value)} className="mt-1" /></div>
            </div>
            <div className="bg-steel-50 border border-navy-100 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-navy-400">Subtotal</span><span className="font-mono font-bold">R{totals.sub}</span></div>
              <div className="flex justify-between"><span className="text-navy-400">VAT ({vatRate}%)</span><span className="font-mono font-bold">R{totals.vat}</span></div>
              <div className="flex justify-between border-t border-navy-100 pt-2 mt-2"><span className="font-heading font-bold text-navy-500">Total</span><span className="font-mono font-black text-navy-500 text-base">R{totals.total}</span></div>
            </div>
            <div><Label className="text-xs text-navy-400">Terms &amp; Conditions</Label><Textarea value={form.terms} onChange={e => sf("terms", e.target.value)} rows={3} className="mt-1" /></div>
            <div><Label className="text-xs text-navy-400">Notes</Label><Textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? "Update" : "Create"} Quotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}