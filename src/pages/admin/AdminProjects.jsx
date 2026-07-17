import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Upload, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["Construction", "Road Works", "Civil Engineering", "Plant Hire", "Property Maintenance"];
const EMPTY = { name: "", client_name: "", location: "", description: "", completion_date: "", equipment_used: "", images: "", video_url: "", category: "Construction", featured: false };

export default function AdminProjects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.Project.list('-created_date', 100).then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleOpen = (item = null) => {
    setForm(item ? { ...EMPTY, ...item } : EMPTY);
    setEditId(item?.id || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const current = form.images ? form.images.split(",").filter(Boolean) : [];
    current.push(file_url);
    setForm(f => ({ ...f, images: current.join(",") }));
    toast({ title: "Image added" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) { await base44.entities.Project.update(editId, form); toast({ title: "Project updated" }); }
      else { await base44.entities.Project.create(form); toast({ title: "Project added" }); }
      setDialogOpen(false);
      load();
    } catch (err) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    await base44.entities.Project.delete(id);
    toast({ title: "Project deleted" });
    load();
  };

  const images = form.images ? form.images.split(",").filter(Boolean) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Projects</h1>
          <p className="text-navy-300 text-sm mt-1">{items.length} project{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Project
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No projects yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(p => {
            const imgs = p.images ? p.images.split(",").filter(Boolean) : [];
            return (
              <div key={p.id} className="bg-white border border-navy-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {imgs[0] && <img src={imgs[0]} alt={p.name} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-heading font-bold text-navy-500">{p.name}</h3>
                    {p.featured && <Star className="w-4 h-4 text-gold fill-gold" />}
                  </div>
                  {p.client_name && <p className="text-navy-300 text-sm">{p.client_name}</p>}
                  {p.location && <p className="font-mono text-[11px] text-navy-300">{p.location}</p>}
                  <div className="mt-2 flex gap-2">
                    <span className="px-2 py-0.5 bg-steel-100 text-navy-400 text-[10px] font-mono rounded">{p.category}</span>
                    {p.completion_date && <span className="px-2 py-0.5 bg-steel-100 text-navy-400 text-[10px] font-mono rounded">{p.completion_date}</span>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleOpen(p)} className="p-1.5 text-navy-300 hover:text-gold"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editId ? "Edit" : "Add"} Project</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Project Name *</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Client Name</label>
                <Input value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Location</label>
                <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Completion Date</label>
                <Input type="date" value={form.completion_date} onChange={e => setForm({...form, completion_date: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Category</label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Equipment Used</label>
                <Input value={form.equipment_used} onChange={e => setForm({...form, equipment_used: e.target.value})} placeholder="e.g. TLB, Excavator" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} className="resize-none" />
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Video URL</label>
              <Input value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} placeholder="YouTube/Vimeo link" />
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Project Images</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 group">
                    <img src={url} alt="" className="w-full h-full object-cover rounded" />
                    <button onClick={() => setForm({...form, images: images.filter((_, idx) => idx !== i).join(",")})} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-navy-200 rounded flex items-center justify-center cursor-pointer hover:border-gold transition-colors">
                  <Upload className="w-5 h-5 text-navy-300" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.featured} onCheckedChange={v => setForm({...form, featured: v})} />
              <span className="text-sm text-navy-500">Featured Project</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}