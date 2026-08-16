import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import moment from "moment";

const CATEGORIES = ["Construction Tips", "Equipment Maintenance", "Project Showcase", "Safety", "Company News"];
const EMPTY = { title: "", slug: "", excerpt: "", content: "", cover_image: "", category: "Company News", status: "Draft", author: "", publish_date: "" };

export default function AdminBlog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.BlogPost.list('-created_date', 100).then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleOpen = (item = null) => {
    setForm(item ? { ...EMPTY, ...item } : EMPTY);
    setEditId(item?.id || null);
    setDialogOpen(true);
  };

  const handleImageUpload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_image: file_url }));
    toast({ title: "Cover image uploaded" });
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      const data = {
        ...form,
        slug: form.slug || slugify(form.title),
        status: publish ? "Published" : form.status,
        publish_date: publish ? (form.publish_date || moment().format("YYYY-MM-DD")) : form.publish_date,
      };
      if (editId) { await base44.entities.BlogPost.update(editId, data); toast({ title: "Post updated" }); }
      else { await base44.entities.BlogPost.create(data); toast({ title: publish ? "Post published" : "Draft saved" }); }
      setDialogOpen(false);
      load();
    } catch (err) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this post?")) return;
    await base44.entities.BlogPost.delete(id);
    toast({ title: "Post deleted" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Blog Posts</h1>
          <p className="text-navy-300 text-sm mt-1">{items.length} post{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No blog posts yet</p></div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100 text-left">
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Title</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Category</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Author</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Date</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-t border-navy-50 hover:bg-steel-50 transition-colors">
                  <td className="px-4 py-3 font-heading font-bold text-navy-500">{p.title}</td>
                  <td className="px-4 py-3 text-navy-400">{p.category}</td>
                  <td className="px-4 py-3 text-navy-400">{p.author || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{p.publish_date || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${p.status === "Published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpen(p)} className="p-1.5 text-navy-300 hover:text-gold"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-navy-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">{editId ? "Edit" : "New"} Blog Post</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Title *</label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value, slug: slugify(e.target.value)})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Category</label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Author</label>
                <Input value={form.author} onChange={e => setForm({...form, author: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Slug</label>
              <Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="font-mono text-xs" />
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Excerpt</label>
              <Textarea value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} rows={2} className="resize-none" />
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Cover Image</label>
              <div className="flex items-center gap-3">
                {form.cover_image && <img src={form.cover_image} alt="" className="w-20 h-20 rounded object-cover" />}
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded cursor-pointer hover:border-gold text-sm text-navy-400">
                  <Upload className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Content *</label>
              <ReactQuill theme="snow" value={form.content} onChange={v => setForm({...form, content: v})} className="bg-white" style={{ minHeight: 200 }} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving || !form.title} className="font-heading font-bold">
                <Save className="w-4 h-4 mr-2" /> Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving || !form.title || !form.content} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Publish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}