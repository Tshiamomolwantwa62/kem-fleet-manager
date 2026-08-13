import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Eye, Edit2, Trash2, CheckCircle, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const STATUS_COLORS = {
  Enquiry: "bg-gray-100 text-gray-600",
  Quotation: "bg-blue-100 text-blue-700",
  "Pending Payment": "bg-amber-100 text-amber-700",
  Confirmed: "bg-green-100 text-green-700",
  "Equipment Dispatched": "bg-purple-100 text-purple-700",
  "On Hire": "bg-gold/20 text-amber-700",
  Completed: "bg-navy-100 text-navy-500",
  Cancelled: "bg-red-100 text-red-700",
};

const EMPTY = {
  customer_id: "", customer_name: "", contact_person: "", contact_phone: "", contact_email: "",
  equipment_id: "", equipment_name: "", quantity: 1, start_date: "", end_date: "",
  rental_rate: "", rate_type: "Per Day", fuel_arrangement: "", delivery_required: false,
  delivery_address: "", delivery_charge: 0, site_location: "", notes: "",
  override_amount: "", override_reason: "", status: "Enquiry",
};

function daysBetween(s, e) {
  if (!s || !e) return 0;
  return Math.max(0, Math.round((new Date(e) - new Date(s)) / 86400000) + 1);
}

export default function RentalBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.RentalBooking.list("-created_date", 500),
      base44.entities.RentalCustomer.filter({ status: "Active" }).catch(() => []),
      base44.entities.RentalEquipment.list().catch(() => []),
    ]).then(([b, c, e]) => { setBookings(b); setCustomers(c); setEquipment(e); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcAmount = (f) => {
    const days = daysBetween(f.start_date, f.end_date);
    const rate = Number(f.rental_rate) || 0;
    const qty = Number(f.quantity) || 1;
    return rate * days * qty;
  };

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setFormOpen(true); };
  const openEdit = b => { setEditing(b); setForm({ ...EMPTY, ...b }); setFormOpen(true); };

  const selectCustomer = (cid) => {
    const c = customers.find(x => x.id === cid);
    if (c) sf("customer_id", cid), sf("customer_name", c.company_name || c.contact_person), sf("contact_person", c.contact_person), sf("contact_phone", c.phone), sf("contact_email", c.email || "");
    else sf("customer_id", cid);
  };

  const selectEquipment = (eid) => {
    const e = equipment.find(x => x.id === eid);
    if (e) {
      sf("equipment_id", eid);
      sf("equipment_name", e.name);
      sf("rental_rate", e.rental_rate || "");
      sf("rate_type", e.rate_type || "Per Day");
      sf("fuel_arrangement", e.fuel_policy || "");
    } else sf("equipment_id", eid);
  };

  const checkConflict = async (form, excludeId) => {
    const existing = await base44.entities.RentalBooking.filter({ equipment_id: form.equipment_id }).catch(() => []);
    return existing.filter(b => {
      if (b.id === excludeId) return false;
      if (["Cancelled", "Completed"].includes(b.status)) return false;
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      const fStart = new Date(form.start_date);
      const fEnd = new Date(form.end_date);
      return fStart <= bEnd && fEnd >= bStart;
    });
  };

  const save = async () => {
    if (!form.customer_id || !form.equipment_id || !form.start_date || !form.end_date) {
      toast({ title: "Customer, equipment, and dates are required", variant: "destructive" }); return;
    }
    const conflicts = await checkConflict(form, editing?.id);
    if (conflicts.length > 0) {
      const proceed = window.confirm(`Warning: This equipment already has ${conflicts.length} booking(s) in this period. Proceed anyway?`);
      if (!proceed) return;
    }
    setSaving(true);
    try {
      const days = daysBetween(form.start_date, form.end_date);
      const calculated = calcAmount(form);
      const final_amount = form.override_amount ? Number(form.override_amount) : calculated;
      const payload = {
        ...form,
        booking_number: form.booking_number || `BK-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        duration_days: days, calculated_amount: calculated, final_amount,
        quantity: Number(form.quantity) || 1,
        rental_rate: Number(form.rental_rate) || 0,
        delivery_charge: Number(form.delivery_charge) || 0,
        override_amount: form.override_amount ? Number(form.override_amount) : undefined,
      };
      editing ? await base44.entities.RentalBooking.update(editing.id, payload) : await base44.entities.RentalBooking.create(payload);
      toast({ title: editing ? "Booking updated" : "Booking created" });
      setFormOpen(false);
      load();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (b, status) => {
    await base44.entities.RentalBooking.update(b.id, { status });
    if (status === "On Hire" || status === "Equipment Dispatched") {
      await base44.entities.RentalEquipment.update(b.equipment_id, { status: "On Hire" }).catch(() => {});
    }
    if (status === "Completed") {
      await base44.entities.RentalEquipment.update(b.equipment_id, { status: "Available" }).catch(() => {});
    }
    toast({ title: `Booking ${status}` });
    load();
  };

  const STATUSES = ["Enquiry", "Quotation", "Pending Payment", "Confirmed", "Equipment Dispatched", "On Hire", "Completed", "Cancelled"];

  const filtered = bookings
    .filter(b => statusFilter === "All" || b.status === statusFilter)
    .filter(b => !search || [b.booking_number, b.customer_name, b.equipment_name].filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Rental Bookings</h1>
          <p className="text-navy-300 text-sm">{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
          <Plus className="w-4 h-4 mr-2" /> New Booking
        </Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-navy-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="All">All Statuses</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div> : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100">
                {["Booking #", "Customer", "Equipment", "Period", "Amount", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-t border-navy-50 hover:bg-steel-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-navy-500">{b.booking_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-heading font-bold text-navy-500 text-sm">{b.customer_name}</div>
                    <div className="text-navy-300 text-xs">{b.contact_person}</div>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{b.equipment_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{b.start_date}<br />{b.end_date} <span className="text-navy-300">({b.duration_days}d)</span></td>
                  <td className="px-4 py-3 font-mono text-navy-500 font-bold">R{(b.final_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Select value={b.status} onValueChange={s => updateStatus(b, s)}>
                      <SelectTrigger className={`h-7 text-[10px] font-mono font-bold border-0 ${STATUS_COLORS[b.status] || ""}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(b)} className="p-1.5 text-navy-300 hover:text-gold"><Edit2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-navy-300 py-10">No bookings found</p>}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editing ? "Edit Booking" : "New Booking"}</DialogTitle></DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-xs text-navy-400">Customer *</Label>
                <Select value={form.customer_id || "none"} onValueChange={v => selectCustomer(v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— Select —</SelectItem>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name || c.contact_person}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-navy-400">Contact Person</Label><Input value={form.contact_person} onChange={e => sf("contact_person", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Contact Phone</Label><Input value={form.contact_phone} onChange={e => sf("contact_phone", e.target.value)} className="mt-1" /></div>
              <div className="col-span-2">
                <Label className="text-xs text-navy-400">Equipment *</Label>
                <Select value={form.equipment_id || "none"} onValueChange={v => selectEquipment(v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— Select —</SelectItem>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.status})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs text-navy-400">Quantity</Label><Input type="number" value={form.quantity} onChange={e => sf("quantity", e.target.value)} className="mt-1" min={1} /></div>
              <div><Label className="text-xs text-navy-400">Rental Rate (R)</Label><Input type="number" value={form.rental_rate} onChange={e => sf("rental_rate", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Start Date *</Label><Input type="date" value={form.start_date} onChange={e => sf("start_date", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">End Date *</Label><Input type="date" value={form.end_date} onChange={e => sf("end_date", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Site / Location</Label><Input value={form.site_location} onChange={e => sf("site_location", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Fuel Arrangement</Label><Input value={form.fuel_arrangement} onChange={e => sf("fuel_arrangement", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Delivery Charge (R)</Label><Input type="number" value={form.delivery_charge} onChange={e => sf("delivery_charge", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Status</Label>
                <Select value={form.status} onValueChange={v => sf("status", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Enquiry","Quotation","Pending Payment","Confirmed","Equipment Dispatched","On Hire","Completed","Cancelled"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {/* Calculated amount display */}
            <div className="bg-steel-50 border border-navy-100 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-navy-400">Calculated Amount:</span>
                <span className="font-mono font-bold text-navy-500">R{calcAmount(form).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div><Label className="text-xs text-navy-400">Override Amount (R)</Label><Input type="number" value={form.override_amount} onChange={e => sf("override_amount", e.target.value)} placeholder="Leave blank to use calculated" className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Override Reason</Label><Input value={form.override_reason} onChange={e => sf("override_reason", e.target.value)} className="mt-1" /></div>
              </div>
            </div>
            <div><Label className="text-xs text-navy-400">Notes</Label><Textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? "Update" : "Create"} Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}