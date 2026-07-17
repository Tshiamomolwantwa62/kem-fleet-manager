import React, { useState, useEffect } from "react";
import { Loader2, Upload, Trash2, Search, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["Plant Hire", "Construction Projects", "Road Works", "Civil Engineering", "Property Maintenance", "Before & After", "Company Events"];

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", caption: "", alt_text: "", seo_description: "", category: "Plant Hire" });
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.GalleryImage.list('-sort_order', 200).then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleUpload = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await base44.entities.GalleryImage.create({
          title: file.name.replace(/\.[^.]+$/, ""),
          image_url: file_url,
          category: filter === "All" ? "Plant Hire" : filter,
          sort_order: 0,
        });
      }
      toast({ title: `${files.length} image${files.length > 1 ? "s" : ""} uploaded` });
      load();
    } catch (err) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this image?")) return;
    await base44.entities.GalleryImage.delete(id);
    toast({ title: "Image deleted" });
    load();
  };

  const handleEditSave = async () => {
    await base44.entities.GalleryImage.update(editItem.id, editForm);
    toast({ title: "Image updated" });
    setEditItem(null);
    load();
  };

  const filtered = items.filter(img => {
    const matchesSearch = img.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filter === "All" || img.category === filter;
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Gallery</h1>
          <p className="text-navy-300 text-sm mt-1">{items.length} image{items.length !== 1 ? "s" : ""}</p>
        </div>
        <label>
          <Button disabled={uploading} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? "UPLOADING..." : "UPLOAD IMAGES"}
          </Button>
          <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files.length > 0 && handleUpload(Array.from(e.target.files))} />
        </label>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
          <Input placeholder="Search images..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No images found. Upload some!</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(img => (
            <div key={img.id} className="group relative aspect-square bg-white border border-navy-100 rounded-lg overflow-hidden">
              <img src={img.image_url} alt={img.alt_text || img.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-navy-500/0 group-hover:bg-navy-500/60 transition-all flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100">
                <div className="text-white text-xs font-heading font-bold truncate">{img.title}</div>
                <div className="font-mono text-[9px] text-navy-200">{img.category}</div>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => { setEditItem(img); setEditForm({ title: img.title || "", caption: img.caption || "", alt_text: img.alt_text || "", seo_description: img.seo_description || "", category: img.category || "Plant Hire" }); }} className="p-1 bg-white/20 rounded text-white hover:bg-white/30">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(img.id)} className="p-1 bg-red-500/80 rounded text-white hover:bg-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">Edit Image</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4 mt-4">
              <img src={editItem.image_url} alt="" className="w-full h-40 object-cover rounded" />
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Title</label>
                <Input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Caption</label>
                <Input value={editForm.caption} onChange={e => setEditForm({...editForm, caption: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Alt Text (SEO)</label>
                <Input value={editForm.alt_text} onChange={e => setEditForm({...editForm, alt_text: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">SEO Description</label>
                <Input value={editForm.seo_description} onChange={e => setEditForm({...editForm, seo_description: e.target.value})} />
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Category</label>
                <Select value={editForm.category} onValueChange={v => setEditForm({...editForm, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
                <Button onClick={handleEditSave} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}