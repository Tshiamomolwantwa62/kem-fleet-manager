import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = { equipment_id: "", equipment_name: "", service_date: "", next_service_date: "", technician: "", service_cost: "", service_notes: "", service_type: "Routine", status: "Scheduled" };

export default function AdminMaintenance() {
  const [records, setRecords] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.MaintenanceRecord.list('-service_date', 100),
      base44.entities.Equipment.list('-created_date', 100),
    ]).then(([r, e]) => { setRecords(r); setEquipment(e); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleOpen = (rec = null) => {
    if (rec) { setForm({ ...EMPTY, ...rec, service_cost: rec.service_cost || "" }); setEditId(rec.id); }
    else { setForm(EMPTY); setEditId(null); }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, service_cost: Number(form.service_cost) || 0 };
      if (editId) { await base44.entities.MaintenanceRecord.update(editId, data); toast({ title: "Record updated" }); }
      else { await base44.entities.MaintenanceRecord.create(data); toast({ title: "Record added" }); }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this maintenance record?")) return;
    await base44.entities.MaintenanceRecord.delete(id);
    toast({ title: "Record deleted" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Maintenance</h1>
          <p className="text-navy-300 text-sm mt-1">Track equipment servicing</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Record
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No maintenance records yet</p></div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100 text-left">
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Equipment</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Type</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Service Date</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Next Service</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Technician</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Cost</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-t border-navy-50 hover:bg-steel-50 transition-colors">
                  <td className="px-4 py-3 font-heading font-bold text-navy-500">{r.equipment_name || "—"}</td>
                  <td className="px-4 py-3 text-navy-400">{r.service_type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{r.service_date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{r.next_service_date || "—"}</td>
                  <td className="px-4 py-3 text-navy-400">{r.technician || "—"}</td>
                  <td className="px-4 py-3 font-mono text-navy-500">R{(r.service_cost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                      r.status === "Completed" ? "bg-green-100 text-green-700" :
                      r.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpen(r)} className="p-1.5 text-navy-300 hover:text-gold"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editId ? "Edit" : "Add"} Maintenance Record</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Equipment</label>
              <Select value={form.equipment_id} onValueChange={v => { const eq = equipment.find(e => e.id === v); setForm({...form, equipment_id: v, equipment_name: eq?.name || ""}); }}>
                <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                <SelectContent>{equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Service Type</label>
                <Select value={form.service_type} onValueChange={v => setForm({...form, service_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Routine", "Repair", "Emergency", "Inspection"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Scheduled", "In Progress", "Completed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Service Date</label>
                <Input type="date" value={form.service_date} onChange={e => setForm({...form, service_date: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Next Service</label>
                <Input type="date" value={form.next_service_date} onChange={e => setForm({...form, next_service_date: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Technician</label>
                <Input value={form.technician} onChange={e => setForm({...form, technician: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Cost (R)</label>
                <Input type="number" value={form.service_cost} onChange={e => setForm({...form, service_cost: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Notes</label>
              <Textarea value={form.service_notes} onChange={e => setForm({...form, service_notes: e.target.value})} rows={3} className="resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}