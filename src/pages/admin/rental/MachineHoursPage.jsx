import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Edit2, FileText, Clock, Gauge, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { calculateTotals, DEFAULT_VAT_RATE } from "@/lib/financial";

const STATUS_COLORS = {
  Dispatched: "bg-blue-100 text-blue-700",
  "On Hire": "bg-gold/20 text-amber-700",
  Returned: "bg-purple-100 text-purple-700",
  Invoiced: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-500",
};

const FUEL_LEVELS = ["Full", "3/4", "1/2", "1/4", "Empty"];

const EMPTY = {
  booking_id: "", booking_number: "", equipment_id: "", equipment_name: "",
  customer_id: "", customer_name: "", start_meter_reading: "", end_meter_reading: "",
  hourly_rate: "", minimum_hours: 0, override_amount: "", override_reason: "",
  dispatch_date: new Date().toISOString().slice(0, 10), return_date: "",
  operator_name: "", site_location: "", fuel_level_start: "Full", fuel_level_end: "Full",
  notes: "", status: "Dispatched",
};

export default function MachineHoursPage() {
  const [logs, setLogs] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vatRate, setVatRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const [l, e, c, b, settings] = await Promise.all([
      base44.entities.MachineHourLog.list("-created_date", 500).catch(() => []),
      base44.entities.RentalEquipment.list().catch(() => []),
      base44.entities.RentalCustomer.filter({ status: "Active" }).catch(() => []),
      base44.entities.RentalBooking.list("-created_date", 200).catch(() => []),
      base44.entities.SystemSetting.filter({ key: "vat_rate" }).catch(() => []),
    ]);
    setLogs(l); setEquipment(e); setCustomers(c); setBookings(b);
    if (settings[0]) setVatRate(Number(settings[0].value) || 15);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcTotalHours = (f) => {
    const start = Number(f.start_meter_reading) || 0;
    const end = Number(f.end_meter_reading) || 0;
    return Math.max(0, end - start);
  };

  const calcBillableHours = (f) => {
    const total = calcTotalHours(f);
    const min = Number(f.minimum_hours) || 0;
    return Math.max(total, min);
  };

  const calcAmount = (f) => {
    const billable = calcBillableHours(f);
    const rate = Number(f.hourly_rate) || 0;
    return billable * rate;
  };

  const calcFinalAmount = (f) => {
    return f.override_amount ? Number(f.override_amount) : calcAmount(f);
  };

  const selectEquipment = (eid) => {
    const eq = equipment.find(x => x.id === eid);
    if (eq) {
      sf("equipment_id", eid);
      sf("equipment_name", eq.name);
      const rate = Number(eq.rental_rate) || 0;
      // Convert the equipment's configured rental rate to an hourly rate without rounding away cents.
      const hourly = eq.rate_type === "Per Hour" ? rate : eq.rate_type === "Per Day" ? rate / 8 : eq.rate_type === "Per Week" ? rate / 56 : eq.rate_type === "Per Month" ? rate / 240 : rate;
      sf("hourly_rate", Number(hourly.toFixed(2)));
    } else sf("equipment_id", eid);
  };

  const selectCustomer = (cid) => {
    const c = customers.find(x => x.id === cid);
    sf("customer_id", cid);
    if (c) sf("customer_name", c.company_name || c.contact_person);
  };

  const selectBooking = (bid) => {
    const b = bookings.find(x => x.id === bid);
    if (b) {
      sf("booking_id", bid);
      sf("booking_number", b.booking_number || "");
      sf("customer_id", b.customer_id || "");
      sf("customer_name", b.customer_name || "");
      sf("equipment_id", b.equipment_id || "");
      sf("equipment_name", b.equipment_name || "");
      sf("site_location", b.site_location || "");
      sf("dispatch_date", b.start_date || new Date().toISOString().slice(0, 10));
      sf("return_date", b.end_date || "");
      // Load hourly rate from equipment
      if (b.equipment_id) selectEquipment(b.equipment_id);
    } else sf("booking_id", bid);
  };

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setFormOpen(true); };
  const openEdit = l => { setEditing(l); setForm({ ...EMPTY, ...l }); setFormOpen(true); };

  const save = async () => {
    if (!form.equipment_id || !form.customer_id || form.start_meter_reading === "") {
      toast({ title: "Equipment, customer, and start meter reading are required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const total_hours = calcTotalHours(form);
      const billable_hours = calcBillableHours(form);
      const calculated = calcAmount(form);
      const final_amount = calcFinalAmount(form);
      const hasReturn = form.end_meter_reading !== "" && form.return_date;
      const payload = {
        ...form,
        log_number: form.log_number || `MHL-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        start_meter_reading: Number(form.start_meter_reading) || 0,
        end_meter_reading: form.end_meter_reading !== "" ? Number(form.end_meter_reading) : undefined,
        total_hours: hasReturn ? total_hours : undefined,
        billable_hours: hasReturn ? billable_hours : undefined,
        calculated_amount: hasReturn ? calculated : undefined,
        final_amount: hasReturn ? final_amount : undefined,
        hourly_rate: Number(form.hourly_rate) || 0,
        minimum_hours: Number(form.minimum_hours) || 0,
        override_amount: form.override_amount ? Number(form.override_amount) : undefined,
        status: hasReturn ? (form.status === "Dispatched" ? "Returned" : form.status) : (form.status === "Returned" || form.status === "Invoiced" ? form.status : "Dispatched"),
      };
      editing ? await base44.entities.MachineHourLog.update(editing.id, payload) : await base44.entities.MachineHourLog.create(payload);
      toast({ title: editing ? "Hour log updated" : "Hour log created" });
      setFormOpen(false);
      load();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const markReturned = async (l) => {
    // Open edit with the log pre-filled, focusing on return details
    openEdit(l);
  };

  const generateInvoice = async (l) => {
    if (!l.final_amount || l.final_amount <= 0) {
      toast({ title: "Cannot invoice — enter return meter reading first", variant: "destructive" }); return;
    }
    setGenerating(l.id);
    try {
      const customer = customers.find(c => c.id === l.customer_id);
      const subtotal = l.final_amount;
      const totals = calculateTotals({ rental: subtotal, vatRate: vatRate || DEFAULT_VAT_RATE });
      const vat_amount = totals.vat;
      const total = totals.total;
      const invoice_number = `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const items = JSON.stringify([{
        description: `${l.equipment_name || "Equipment"} — Machine Hours (${l.billable_hours} hrs @ R${l.hourly_rate}/hr)`,
        quantity: l.billable_hours,
        unit_price: l.hourly_rate,
        total: subtotal,
      }]);
      const inv = await base44.entities.RentalInvoice.create({
        invoice_number,
        invoice_date: new Date().toISOString().slice(0, 10),
        due_date: new Date().toISOString().slice(0, 10),
        customer_id: l.customer_id,
        customer_name: l.customer_name,
        customer_vat_number: customer?.vat_number || "",
        billing_address: customer?.billing_address || "",
        booking_id: l.booking_id || "",
        booking_number: l.booking_number || "",
        machine_hour_log_id: l.id,
        machine_hour_log_number: l.log_number,
        items,
        subtotal: totals.subtotal,
        vat_rate: totals.vatRate,
        vat_amount,
        total,
        amount_paid: 0,
        outstanding: total,
        status: "Issued",
        terms: "Payment required upfront. Terms and conditions apply.",
      });
      await base44.entities.MachineHourLog.update(l.id, { status: "Invoiced", invoice_id: inv.id, invoice_number });
      toast({ title: `Invoice ${invoice_number} generated`, description: `Total: R${total.toFixed(2)}` });
      load();
    } catch (e) { toast({ title: "Invoice generation failed", description: e.message, variant: "destructive" }); }
    finally { setGenerating(null); }
  };

  const updateStatus = async (l, status) => {
    await base44.entities.MachineHourLog.update(l.id, { status });
    if (status === "Dispatched" || status === "On Hire") {
      await base44.entities.RentalEquipment.update(l.equipment_id, { status: "On Hire" }).catch(() => {});
    }
    if (status === "Returned" || status === "Closed") {
      await base44.entities.RentalEquipment.update(l.equipment_id, { status: "Available" }).catch(() => {});
    }
    toast({ title: `Status updated to ${status}` });
    load();
  };

  const STATUSES = ["Dispatched", "On Hire", "Returned", "Invoiced", "Closed"];

  const filtered = logs
    .filter(l => statusFilter === "All" || l.status === statusFilter)
    .filter(l => !search || [l.log_number, l.customer_name, l.equipment_name, l.booking_number].filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Machine Hours Tracking</h1>
          <p className="text-navy-300 text-sm">{filtered.length} log{filtered.length !== 1 ? "s" : ""} · Hour meter-based billing</p>
        </div>
        <Button onClick={openAdd} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
          <Plus className="w-4 h-4 mr-2" /> New Hour Log
        </Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-navy-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search logs, equipment, customer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>{["All", ...STATUSES].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div> : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100">
                {["Log #", "Equipment", "Customer", "Meter (Start→End)", "Hours", "Amount", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-t border-navy-50 hover:bg-steel-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-navy-500">{l.log_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-heading font-bold text-navy-500 text-sm">{l.equipment_name}</div>
                    <div className="text-navy-300 text-xs">{l.operator_name ? `Op: ${l.operator_name}` : ""}</div>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{l.customer_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">
                    {l.start_meter_reading} → {l.end_meter_reading ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-navy-500 font-bold">
                    {l.billable_hours != null ? `${l.billable_hours}h` : "—"}
                    {l.total_hours != null && l.billable_hours > l.total_hours && (
                      <span className="text-navy-300 text-[10px] ml-1">(min applied)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-navy-500">
                    {l.final_amount != null ? `R${l.final_amount.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Select value={l.status} onValueChange={s => updateStatus(l, s)}>
                      <SelectTrigger className={`h-7 text-[10px] font-mono font-bold border-0 ${STATUS_COLORS[l.status] || ""}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(l)} className="p-1.5 text-navy-300 hover:text-gold" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      {l.status === "Returned" && !l.invoice_id && (
                        <button onClick={() => generateInvoice(l)} disabled={generating === l.id} className="p-1.5 text-navy-300 hover:text-green-600 disabled:opacity-50" title="Generate Invoice">
                          {generating === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        </button>
                      )}
                      {l.invoice_number && (
                        <span className="text-[10px] font-mono text-green-600 self-center">{l.invoice_number}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Gauge className="w-10 h-10 text-navy-200 mx-auto mb-2" />
              <p className="text-navy-300 text-sm">No machine hour logs yet</p>
              <p className="text-navy-300 text-xs mt-1">Create a log when equipment is dispatched to track hour-meter readings</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editing ? "Edit Hour Log" : "New Machine Hour Log"}</DialogTitle></DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs text-navy-400">Link to Booking (optional)</Label>
                <Select value={form.booking_id || "none"} onValueChange={v => v === "none" ? sf("booking_id", "") : selectBooking(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select booking to auto-fill" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— None —</SelectItem>{bookings.map(b => <SelectItem key={b.id} value={b.id}>{b.booking_number} — {b.customer_name} — {b.equipment_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-navy-400">Customer *</Label>
                <Select value={form.customer_id || "none"} onValueChange={v => v === "none" ? sf("customer_id", "") : selectCustomer(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— Select —</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name || c.contact_person}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-navy-400">Equipment *</Label>
                <Select value={form.equipment_id || "none"} onValueChange={v => v === "none" ? sf("equipment_id", "") : selectEquipment(v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— Select —</SelectItem>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-navy-400">Operator Name</Label><Input value={form.operator_name} onChange={e => sf("operator_name", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Site Location</Label><Input value={form.site_location} onChange={e => sf("site_location", e.target.value)} className="mt-1" /></div>
            </div>

            {/* Dispatch section */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-blue-600" />
                <span className="font-heading font-bold text-blue-700 text-sm">Dispatch Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-navy-400">Dispatch Date *</Label><Input type="date" value={form.dispatch_date} onChange={e => sf("dispatch_date", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Start Meter Reading (hrs) *</Label><Input type="number" step="0.1" value={form.start_meter_reading} onChange={e => sf("start_meter_reading", e.target.value)} className="mt-1" placeholder="e.g. 1250.5" /></div>
                <div>
                  <Label className="text-xs text-navy-400">Fuel Level at Dispatch</Label>
                  <Select value={form.fuel_level_start || "Full"} onValueChange={v => sf("fuel_level_start", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{FUEL_LEVELS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Return section */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="font-heading font-bold text-purple-700 text-sm">Return Details</span>
                <span className="text-purple-400 text-xs ml-auto">(fill in when equipment returns)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-navy-400">Return Date</Label><Input type="date" value={form.return_date} onChange={e => sf("return_date", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">End Meter Reading (hrs)</Label><Input type="number" step="0.1" value={form.end_meter_reading} onChange={e => sf("end_meter_reading", e.target.value)} className="mt-1" placeholder="e.g. 1318.2" /></div>
                <div>
                  <Label className="text-xs text-navy-400">Fuel Level at Return</Label>
                  <Select value={form.fuel_level_end || "Full"} onValueChange={v => sf("fuel_level_end", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{FUEL_LEVELS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Rate & calculation */}
            <div className="bg-steel-50 border border-navy-100 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><Label className="text-xs text-navy-400">Hourly Rate (R)</Label><Input type="number" step="0.01" value={form.hourly_rate} onChange={e => sf("hourly_rate", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Minimum Hours</Label><Input type="number" step="0.5" value={form.minimum_hours} onChange={e => sf("minimum_hours", e.target.value)} className="mt-1" placeholder="0" /></div>
                <div><Label className="text-xs text-navy-400">Status</Label>
                  <Select value={form.status} onValueChange={v => sf("status", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {form.end_meter_reading !== "" && (
                <div className="space-y-1 text-sm border-t border-navy-100 pt-3">
                  <div className="flex justify-between"><span className="text-navy-400">Total Hours (end − start)</span><span className="font-mono font-bold text-navy-500">{calcTotalHours(form).toFixed(1)} h</span></div>
                  <div className="flex justify-between"><span className="text-navy-400">Billable Hours (min applied)</span><span className="font-mono font-bold text-navy-500">{calcBillableHours(form).toFixed(1)} h</span></div>
                  <div className="flex justify-between"><span className="text-navy-400">Calculated Amount ({calcBillableHours(form).toFixed(1)}h × R{Number(form.hourly_rate) || 0})</span><span className="font-mono font-bold text-navy-500">R{calcAmount(form).toFixed(2)}</span></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div><Label className="text-xs text-navy-400">Override Amount (R)</Label><Input type="number" step="0.01" value={form.override_amount} onChange={e => sf("override_amount", e.target.value)} placeholder="Leave blank to use calculated" className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Override Reason</Label><Input value={form.override_reason} onChange={e => sf("override_reason", e.target.value)} className="mt-1" /></div>
              </div>
              {form.end_meter_reading !== "" && (
                <div className="flex justify-between border-t border-navy-100 pt-3 mt-3">
                  <span className="font-heading font-bold text-navy-500">Final Amount</span>
                  <span className="font-mono font-black text-navy-500 text-lg">R{calcFinalAmount(form).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div><Label className="text-xs text-navy-400">Notes</Label><Textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? "Update" : "Create"} Log
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}