import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Upload, Eye, EyeOff, Video, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = { title: "", subtitle: "", button_text: "", button_link: "", image_url: "", video_url: "", media_type: "Image", is_active: true, sort_order: 0, start_date: "", end_date: "" };

export default function AdminBanners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.Banner.list('-sort_order', 50).then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleOpen = (item = null) => {
    setForm(item ? { ...EMPTY, ...item } : EMPTY);
    setEditId(item?.id || null);
    setDialogOpen(true);
  };

  const handleUpload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (form.media_type === "Video") setForm(f => ({ ...f, video_url: file_url }));
    else setForm(f => ({ ...f, image_url: file_url }));
    toast({ title: "Media uploaded" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (editId) { await base44.entities.Banner.update(editId, data); toast({ title: "Banner updated" }); }
      else { await base44.entities.Banner.create(data); toast({ title: "Banner created" }); }
      setDialogOpen(false);
      load();
    } catch (err) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return;
    await base44.entities.Banner.delete(id);
    toast({ title: "Banner deleted" });
    load();
  };

  const toggleActive = async (item) => {
    await base44.entities.Banner.update(item.id, { is_active: !item.is_active });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Homepage Banners</h1>
          <p className="text-navy-300 text-sm mt-1">{items.length} banner{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Banner
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No banners yet</p></div>
      ) : (
        <div className="space-y-3">
          {items.map(b => (
            <div key={b.id} className="bg-white border border-navy-100 rounded-lg p-4 flex items-center gap-4">
              <div className="w-24 h-16 rounded overflow-hidden bg-navy-50 shrink-0 relative">
                {b.media_type === "Video" ? (
                  <div className="w-full h-full flex items-center justify-center"><Video className="w-6 h-6 text-navy-300" /></div>
                ) : b.image_url ? (
                  <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-navy-300" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-navy-500 truncate">{b.title}</h3>
                  <span className="px-2 py-0.5 bg-steel-100 text-navy-400 text-[10px] font-mono rounded">#{b.sort_order || 0}</span>
                </div>
                {b.subtitle && <p className="text-navy-300 text-sm truncate">{b.subtitle}</p>}
                <div className="font-mono text-[10px] text-navy-300 mt-0.5">
                  {b.media_type} • {b.start_date || "..."} → {b.end_date || "..."}
                </div>
              </div>
              <button onClick={() => toggleActive(b)} className={`p-2 rounded ${b.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                {b.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <div className="flex gap-2">
                <button onClick={() => handleOpen(b)} className="p-1.5 text-navy-300 hover:text-gold"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editId ? "Edit" : "Add"} Banner</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Title *</label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Media Type</label>
                <Select value={form.media_type} onValueChange={v => setForm({...form, media_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Subtitle</label>
              <Input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Button Text</label>
                <Input value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})} placeholder="BOOK NOW" />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Button Link</label>
                <Input value={form.button_link} onChange={e => setForm({...form, button_link: e.target.value})} placeholder="/equipment" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">{form.media_type === "Video" ? "Video" : "Image"}</label>
              <div className="flex items-center gap-3">
                {(form.media_type === "Video" ? form.video_url : form.image_url) && (
                  form.media_type === "Video" ? (
                    <video src={form.video_url} className="w-20 h-16 rounded object-cover" />
                  ) : (
                    <img src={form.image_url} alt="" className="w-20 h-16 rounded object-cover" />
                  )
                )}
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded cursor-pointer hover:border-gold text-sm text-navy-400">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept={form.media_type === "Video" ? "video/*" : "image/*"} className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Sort Order</label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Start Date</label>
                <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">End Date</label>
                <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({...form, is_active: v})} />
              <span className="text-sm text-navy-500">Active (visible on homepage)</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.title} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}