import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Edit2, Trash2 } from "lucide-react";
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
  Available: "bg-green-100 text-green-700",
  Reserved: "bg-blue-100 text-blue-700",
  "On Hire": "bg-gold/20 text-amber-700",
  "Under Maintenance": "bg-orange-100 text-orange-700",
  Returned: "bg-gray-100 text-gray-600",
  Damaged: "bg-red-100 text-red-700",
  "Out of Service": "bg-red-200 text-red-800",
};

const EMPTY = {
  equipment_id: "", name: "", category: "", make: "", model: "", serial_number: "",
  registration_number: "", year: "", description: "", current_location: "",
  rental_rate: "", rate_type: "Per Day", fuel_policy: "Dry Rate", status: "Available",
  condition: "Good", maintenance_status: "Up to Date", notes: "",
};

export default function RentalEquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [catName, setCatName] = useState("");
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.RentalEquipment.list("-created_date", 500),
      base44.entities.EquipmentCategory.filter({ status: "Active" }).catch(() => []),
    ]).then(([eq, cats]) => { setEquipment(eq); setCategories(cats); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openAdd = () => { setEditing(null); setForm({ ...EMPTY }); setFormOpen(true); };
  const openEdit = e => { setEditing(e); setForm({ ...EMPTY, ...e, year: e.year || "", rental_rate: e.rental_rate || "" }); setFormOpen(true); };

  const save = async () => {
    if (!form.name || !form.category) { toast({ title: "Name and category required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, year: form.year ? Number(form.year) : undefined, rental_rate: form.rental_rate ? Number(form.rental_rate) : undefined, equipment_id: form.equipment_id || `EQ-${Date.now().toString(36).toUpperCase().slice(-5)}` };
      editing ? await base44.entities.RentalEquipment.update(editing.id, payload) : await base44.entities.RentalEquipment.create(payload);
      toast({ title: editing ? "Equipment updated" : "Equipment added" });
      setFormOpen(false);
      load();
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const deleteEquip = async (e) => {
    await base44.entities.RentalEquipment.delete(e.id);
    toast({ title: "Equipment deleted" });
    load();
  };

  const addCategory = async () => {
    if (!catName.trim()) return;
    await base44.entities.EquipmentCategory.create({ name: catName.trim(), status: "Active" });
    setCatName("");
    toast({ title: "Category added" });
    load();
  };

  const filtered = equipment
    .filter(e => statusFilter === "All" || e.status === statusFilter)
    .filter(e => !search || [e.name, e.make, e.model, e.equipment_id, e.category].filter(Boolean).some(v => v.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Equipment Register</h1>
          <p className="text-navy-300 text-sm">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openAdd} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Equipment
        </Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-navy-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Available", "Reserved", "On Hire", "Under Maintenance", "Returned", "Damaged", "Out of Service"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div> : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100">
                <th className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">ID / Name</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">Category</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">Make / Model</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">Rate</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] text-navy-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-t border-navy-50 hover:bg-steel-50">
                  <td className="px-4 py-3">
                    <div className="font-heading font-bold text-navy-500">{e.name}</div>
                    <div className="font-mono text-[10px] text-navy-300">{e.equipment_id}</div>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{e.category}</td>
                  <td className="px-4 py-3 text-navy-400">{[e.make, e.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-4 py-3 font-mono text-navy-500">R{(e.rental_rate || 0).toLocaleString()} / {e.rate_type?.replace("Per ", "") || "Day"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${STATUS_COLORS[e.status] || "bg-gray-100 text-gray-600"}`}>{e.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(e)} className="p-1.5 text-navy-300 hover:text-gold"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteEquip(e)} className="p-1.5 text-navy-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-navy-300 py-10">No equipment found</p>}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editing ? "Edit Equipment" : "Add Equipment"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="details">
            <TabsList><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="rental">Rental</TabsTrigger><TabsTrigger value="status">Status</TabsTrigger></TabsList>
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-navy-400">Equipment Name *</Label><Input value={form.name} onChange={e => sf("name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Category *</Label>
                  <Select value={form.category || "none"} onValueChange={v => sf("category", v === "none" ? "" : v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Select —</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-navy-400">Equipment ID</Label><Input value={form.equipment_id} onChange={e => sf("equipment_id", e.target.value)} placeholder="Auto" className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Year</Label><Input type="number" value={form.year} onChange={e => sf("year", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Make</Label><Input value={form.make} onChange={e => sf("make", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Model</Label><Input value={form.model} onChange={e => sf("model", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Serial Number</Label><Input value={form.serial_number} onChange={e => sf("serial_number", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Registration Number</Label><Input value={form.registration_number} onChange={e => sf("registration_number", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Current Location</Label><Input value={form.current_location} onChange={e => sf("current_location", e.target.value)} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs text-navy-400">Description</Label><Textarea value={form.description} onChange={e => sf("description", e.target.value)} rows={2} className="mt-1" /></div>
              <div><Label className="text-xs text-navy-400">Notes</Label><Textarea value={form.notes} onChange={e => sf("notes", e.target.value)} rows={2} className="mt-1" /></div>
            </TabsContent>
            <TabsContent value="rental" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-navy-400">Rental Rate (R)</Label><Input type="number" value={form.rental_rate} onChange={e => sf("rental_rate", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs text-navy-400">Rate Type</Label>
                  <Select value={form.rate_type} onValueChange={v => sf("rate_type", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Per Day", "Per Week", "Per Month", "Per Hour"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label className="text-xs text-navy-400">Fuel Policy</Label>
                  <Select value={form.fuel_policy} onValueChange={v => sf("fuel_policy", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Customer Provides Fuel", "KEM Provides Fuel", "Fuel Charged Separately", "Dry Rate"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="status" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-navy-400">Status</Label>
                  <Select value={form.status} onValueChange={v => sf("status", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Available", "Reserved", "On Hire", "Under Maintenance", "Returned", "Damaged", "Out of Service"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-navy-400">Condition</Label>
                  <Select value={form.condition} onValueChange={v => sf("condition", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Excellent", "Good", "Fair", "Poor"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-navy-400">Maintenance Status</Label>
                  <Select value={form.maintenance_status} onValueChange={v => sf("maintenance_status", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Up to Date", "Due Soon", "Overdue", "In Progress"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? "Update" : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories management inline */}
      <div className="mt-8 bg-white border border-navy-100 rounded-lg p-5">
        <h3 className="font-heading font-bold text-navy-500 mb-3">Equipment Categories</h3>
        <div className="flex gap-2 mb-4">
          <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="New category name" className="max-w-xs" onKeyDown={e => e.key === "Enter" && addCategory()} />
          <Button onClick={addCategory} className="bg-navy-500 text-white hover:bg-navy-400 font-heading font-bold"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <span key={c.id} className="px-3 py-1.5 bg-steel-100 text-navy-500 text-sm font-heading font-bold rounded-full">{c.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}