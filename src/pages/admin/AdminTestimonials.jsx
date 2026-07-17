import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = { name: "", company: "", rating: 5, text: "", approved: false, featured: false };

export default function AdminTestimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.Testimonial.list('-created_date', 100).then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleOpen = (item = null) => {
    setForm(item ? { ...EMPTY, ...item } : EMPTY);
    setEditId(item?.id || null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, rating: Number(form.rating) };
      if (editId) { await base44.entities.Testimonial.update(editId, data); toast({ title: "Testimonial updated" }); }
      else { await base44.entities.Testimonial.create(data); toast({ title: "Testimonial added" }); }
      setDialogOpen(false);
      load();
    } catch (err) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this testimonial?")) return;
    await base44.entities.Testimonial.delete(id);
    toast({ title: "Testimonial deleted" });
    load();
  };

  const toggleApprove = async (item) => {
    await base44.entities.Testimonial.update(item.id, { approved: !item.approved });
    toast({ title: item.approved ? "Unapproved" : "Approved" });
    load();
  };

  const toggleFeature = async (item) => {
    await base44.entities.Testimonial.update(item.id, { featured: !item.featured });
    toast({ title: item.featured ? "Unfeatured" : "Featured on homepage" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Testimonials</h1>
          <p className="text-navy-300 text-sm mt-1">{items.length} testimonial{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Testimonial
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No testimonials yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(t => (
            <div key={t.id} className="bg-white border border-navy-100 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-heading font-bold text-navy-500">{t.name}</div>
                  {t.company && <div className="font-mono text-[11px] text-navy-300">{t.company}</div>}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < (t.rating || 5) ? "text-gold fill-gold" : "text-navy-100"}`} />
                  ))}
                </div>
              </div>
              <p className="text-navy-400 text-sm italic line-clamp-3">"{t.text}"</p>
              <div className="mt-4 pt-3 border-t border-navy-50 flex items-center gap-4">
                <button onClick={() => toggleApprove(t)} className={`px-3 py-1 text-[10px] font-mono font-bold rounded ${t.approved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {t.approved ? "APPROVED" : "PENDING"}
                </button>
                <button onClick={() => toggleFeature(t)} className={`px-3 py-1 text-[10px] font-mono font-bold rounded ${t.featured ? "bg-gold text-navy-500" : "bg-gray-100 text-gray-500"}`}>
                  {t.featured ? "FEATURED" : "NOT FEATURED"}
                </button>
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => handleOpen(t)} className="p-1.5 text-navy-300 hover:text-gold"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editId ? "Edit" : "Add"} Testimonial</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Name *</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Company</label>
                <Input value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Rating</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm({...form, rating: n})}>
                    <Star className={`w-6 h-6 ${n <= form.rating ? "text-gold fill-gold" : "text-navy-100"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Testimonial *</label>
              <Textarea value={form.text} onChange={e => setForm({...form, text: e.target.value})} rows={4} className="resize-none" />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={form.approved} onCheckedChange={v => setForm({...form, approved: v})} />
                <span className="text-sm text-navy-500">Approved</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.featured} onCheckedChange={v => setForm({...form, featured: v})} />
                <span className="text-sm text-navy-500">Featured on Homepage</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.text} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}