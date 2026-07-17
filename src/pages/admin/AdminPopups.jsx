import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const TYPES = ["Holiday Special", "Weekend Promotion", "Limited-Time Discount", "New Equipment Arrival", "Important Announcement"];
const EMPTY = { title: "", description: "", button_text: "", button_link: "", background_image: "", popup_type: "Limited-Time Discount", enabled: true, show_once: true, delay_seconds: 5, start_date: "", end_date: "" };

export default function AdminPopups() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.Popup.list('-created_date', 50).then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleOpen = (item = null) => {
    setForm(item ? { ...EMPTY, ...item } : EMPTY);
    setEditId(item?.id || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, background_image: file_url }));
    toast({ title: "Background image uploaded" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, delay_seconds: Number(form.delay_seconds) || 5 };
      if (editId) { await base44.entities.Popup.update(editId, data); toast({ title: "Popup updated" }); }
      else { await base44.entities.Popup.create(data); toast({ title: "Popup created" }); }
      setDialogOpen(false);
      load();
    } catch (err) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this popup?")) return;
    await base44.entities.Popup.delete(id);
    toast({ title: "Popup deleted" });
    load();
  };

  const toggleEnabled = async (item) => {
    await base44.entities.Popup.update(item.id, { enabled: !item.enabled });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Promotional Popups</h1>
          <p className="text-navy-300 text-sm mt-1">{items.length} popup{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" /> Create Popup
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No popups yet. Create one to boost engagement!</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(p => (
            <div key={p.id} className="bg-white border border-navy-100 rounded-lg overflow-hidden">
              {p.background_image && <img src={p.background_image} alt="" className="w-full h-32 object-cover" />}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-bold text-navy-500">{p.title}</h3>
                    <span className="px-2 py-0.5 bg-steel-100 text-navy-400 text-[10px] font-mono rounded">{p.popup_type}</span>
                  </div>
                  <button onClick={() => toggleEnabled(p)} className={`p-2 rounded ${p.enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {p.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-navy-300 text-sm line-clamp-2">{p.description}</p>
                {p.button_text && <div className="mt-3"><span className="px-3 py-1 bg-gold text-navy-500 text-xs font-heading font-bold rounded">{p.button_text}</span></div>}
                <div className="mt-3 pt-3 border-t border-navy-50 flex items-center justify-between">
                  <div className="font-mono text-[10px] text-navy-300">
                    {p.start_date || "..."} → {p.end_date || "..."}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpen(p)} className="p-1.5 text-navy-300 hover:text-gold"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editId ? "Edit" : "Create"} Popup</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Popup Type</label>
              <Select value={form.popup_type} onValueChange={v => setForm({...form, popup_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Title *</label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Winter Special" />
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="resize-none" placeholder="e.g. 10% OFF all TLB rentals this month." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Button Text</label>
                <Input value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})} placeholder="e.g. Book Now" />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Button Link</label>
                <Input value={form.button_link} onChange={e => setForm({...form, button_link: e.target.value})} placeholder="/equipment" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Background Image</label>
              <div className="flex items-center gap-3">
                {form.background_image && <img src={form.background_image} alt="" className="w-16 h-16 rounded object-cover" />}
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded cursor-pointer hover:border-gold text-sm text-navy-400">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Start Date</label>
                <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">End Date</label>
                <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Show After (seconds)</label>
              <Input type="number" value={form.delay_seconds} onChange={e => setForm({...form, delay_seconds: e.target.value})} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={form.enabled} onCheckedChange={v => setForm({...form, enabled: v})} />
                <span className="text-sm text-navy-500">Enabled</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.show_once} onCheckedChange={v => setForm({...form, show_once: v})} />
                <span className="text-sm text-navy-500">Show Once Per Visitor</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}