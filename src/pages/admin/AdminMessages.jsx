import React, { useState, useEffect } from "react";
import { Loader2, Mail, Phone, Trash2, Reply, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

export default function AdminMessages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.ContactSubmission.list('-created_date', 200).then(setItems).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleView = async (item) => {
    setSelected(item);
    if (item.status === "New") {
      await base44.entities.ContactSubmission.update(item.id, { status: "Read" });
      load();
    }
  };

  const handleReply = async () => {
    try {
      await base44.integrations.Core.SendEmail({
        to: selected.email,
        subject: `Re: ${selected.subject || "Your enquiry to KEM Plant"}`,
        body: replyText,
      });
      await base44.entities.ContactSubmission.update(selected.id, { status: "Replied" });
      toast({ title: "Reply sent" });
      setReplyText("");
      setSelected(null);
      load();
    } catch (err) {
      toast({ title: "Failed to send reply", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this message?")) return;
    await base44.entities.ContactSubmission.delete(id);
    toast({ title: "Message deleted" });
    setSelected(null);
    load();
  };

  const filtered = filter === "All" ? items : items.filter(i => i.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Messages</h1>
          <p className="text-navy-300 text-sm mt-1">{filtered.length} message{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "New", "Read", "Replied"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No messages found</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} className="bg-white border border-navy-100 rounded-lg p-4 flex items-center gap-4 hover:border-gold transition-colors cursor-pointer" onClick={() => handleView(m)}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === "New" ? "bg-blue-500" : "bg-transparent"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-navy-500">{m.name}</span>
                  {m.status === "New" && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-mono font-bold rounded">NEW</span>}
                  {m.status === "Replied" && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-mono font-bold rounded">REPLIED</span>}
                </div>
                <div className="text-navy-300 text-sm truncate">{m.subject || m.message}</div>
                <div className="font-mono text-[10px] text-navy-300 mt-0.5">{m.email} • {moment(m.created_date).format("DD MMM YYYY, HH:mm")}</div>
              </div>
              <Eye className="w-4 h-4 text-navy-300 shrink-0" />
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setReplyText(""); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display font-bold text-navy-500">Message Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="bg-steel-100 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-navy-500">{selected.name}</span>
                  <span className="font-mono text-xs text-navy-300">• {selected.email}</span>
                </div>
                {selected.phone && <div className="flex items-center gap-1.5 font-mono text-xs text-navy-400"><Phone className="w-3 h-3" /> {selected.phone}</div>}
                {selected.subject && <div className="font-heading font-bold text-navy-500 text-sm pt-2 border-t border-navy-100">{selected.subject}</div>}
                <p className="text-navy-400 text-sm whitespace-pre-wrap">{selected.message}</p>
                <div className="font-mono text-[10px] text-navy-300 pt-2 border-t border-navy-100">{moment(selected.created_date).format("DD MMMM YYYY, HH:mm")}</div>
              </div>
              {selected.status !== "Replied" && (
                <div>
                  <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Reply</label>
                  <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4} className="resize-none" placeholder="Type your reply..." />
                  <div className="flex justify-end gap-3 mt-3">
                    <Button variant="outline" onClick={() => handleDelete(selected.id)} className="text-red-500 border-red-200 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                    <Button onClick={handleReply} disabled={!replyText.trim()} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                      <Reply className="w-4 h-4 mr-2" /> Send Reply
                    </Button>
                  </div>
                </div>
              )}
              {selected.status === "Replied" && (
                <Button variant="outline" onClick={() => handleDelete(selected.id)} className="text-red-500 border-red-200 hover:bg-red-50 w-full">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Message
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}