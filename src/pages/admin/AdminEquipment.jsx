import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["TLB", "Excavator", "Grader", "Tipper Truck", "Plate Compactor", "Wacker", "Water Pump", "Poker", "Drive Unit", "Grinder", "Drill", "Breaker", "Generator", "Grass Cutting", "Compaction Equipment", "Other"];
const STATUSES = ["Available", "Hired Out", "Maintenance", "Unavailable"];

const EMPTY_FORM = { name: "", category: "TLB", description: "", specifications: "", image_url: "", daily_rate: "", weekly_rate: "", monthly_rate: "", availability_status: "Available", operator_available: false, operator_daily_rate: "", delivery_rate_per_km: "", sku: "", featured: false };

export default function AdminEquipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadEquipment = () => {
    setLoading(true);
    base44.entities.Equipment.list('-created_date', 100).then(setEquipment).finally(() => setLoading(false));
  };

  useEffect(loadEquipment, []);

  const handleOpen = (eq = null) => {
    if (eq) {
      setForm({ ...EMPTY_FORM, ...eq, daily_rate: eq.daily_rate || "", weekly_rate: eq.weekly_rate || "", monthly_rate: eq.monthly_rate || "", operator_daily_rate: eq.operator_daily_rate || "", delivery_rate_per_km: eq.delivery_rate_per_km || "" });
      setEditId(eq.id);
    } else {
      setForm(EMPTY_FORM);
      setEditId(null);
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        daily_rate: Number(form.daily_rate) || 0,
        weekly_rate: Number(form.weekly_rate) || 0,
        monthly_rate: Number(form.monthly_rate) || 0,
        operator_daily_rate: Number(form.operator_daily_rate) || 0,
        delivery_rate_per_km: Number(form.delivery_rate_per_km) || 0,
      };
      if (editId) {
        await base44.entities.Equipment.update(editId, data);
        toast({ title: "Equipment updated" });
      } else {
        await base44.entities.Equipment.create(data);
        toast({ title: "Equipment added" });
      }
      setDialogOpen(false);
      loadEquipment();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    await base44.entities.Equipment.delete(id);
    toast({ title: "Equipment deleted" });
    loadEquipment();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Equipment</h1>
          <p className="text-navy-300 text-sm mt-1">Manage your fleet</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Equipment
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg">
          <p className="text-navy-300">No equipment added yet</p>
          <Button onClick={() => handleOpen()} className="mt-4 bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Your First Machine
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100 text-left">
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Equipment</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Category</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Daily Rate</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(eq => (
                <tr key={eq.id} className="border-t border-navy-50 hover:bg-steel-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {eq.image_url && <img src={eq.image_url} alt="" className="w-10 h-10 rounded object-cover" />}
                      <div>
                        <div className="font-heading font-bold text-navy-500">{eq.name}</div>
                        {eq.sku && <div className="font-mono text-[10px] text-navy-300">{eq.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-navy-400">{eq.category}</td>
                  <td className="px-4 py-3 font-mono font-bold text-navy-500">R{eq.daily_rate?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                      eq.availability_status === "Available" ? "bg-green-100 text-green-700" :
                      eq.availability_status === "Maintenance" ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>{eq.availability_status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpen(eq)} className="p-1.5 text-navy-300 hover:text-gold transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(eq.id)} className="p-1.5 text-navy-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-navy-500">{editId ? "Edit" : "Add"} Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Name *</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Category</label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="resize-none" />
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Specifications</label>
              <Input value={form.specifications} onChange={e => setForm({...form, specifications: e.target.value})} placeholder="e.g. 20 ton, 120HP" />
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Image</label>
              <div className="flex items-center gap-3">
                {form.image_url && <img src={form.image_url} alt="" className="w-16 h-16 rounded object-cover" />}
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded cursor-pointer hover:border-gold text-sm text-navy-400">
                  <Upload className="w-4 h-4" /> Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Daily Rate (R)</label>
                <Input type="number" value={form.daily_rate} onChange={e => setForm({...form, daily_rate: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Weekly Rate (R)</label>
                <Input type="number" value={form.weekly_rate} onChange={e => setForm({...form, weekly_rate: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Monthly Rate (R)</label>
                <Input type="number" value={form.monthly_rate} onChange={e => setForm({...form, monthly_rate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Status</label>
                <Select value={form.availability_status} onValueChange={v => setForm({...form, availability_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">SKU / Code</label>
                <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="e.g. TLB-001" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={form.operator_available} onCheckedChange={v => setForm({...form, operator_available: v})} />
                <span className="text-sm text-navy-500">Operator Available</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.featured} onCheckedChange={v => setForm({...form, featured: v})} />
                <span className="text-sm text-navy-500">Featured</span>
              </div>
            </div>
            {form.operator_available && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Operator Daily Rate (R)</label>
                  <Input type="number" value={form.operator_daily_rate} onChange={e => setForm({...form, operator_daily_rate: e.target.value})} />
                </div>
                <div>
                  <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Delivery Rate /km (R)</label>
                  <Input type="number" value={form.delivery_rate_per_km} onChange={e => setForm({...form, delivery_rate_per_km: e.target.value})} />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editId ? "Update" : "Add"} Equipment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}