import React, { useState, useEffect } from "react";
import { Loader2, Eye, Ban, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    base44.entities.Customer.list('-created_date', 200).then(setCustomers).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggleBlacklist = async (c) => {
    const newStatus = c.status === "Blacklisted" ? "Active" : "Blacklisted";
    await base44.entities.Customer.update(c.id, { status: newStatus });
    toast({ title: `Customer ${newStatus.toLowerCase()}` });
    load();
    setSelected(null);
  };

  const filtered = filter === "All" ? customers : customers.filter(c => c.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Customers</h1>
          <p className="text-navy-300 text-sm mt-1">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["All", "Active", "Blacklisted", "Inactive"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No customers found</p></div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100 text-left">
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Name</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Type</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Email</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Phone</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-navy-50 hover:bg-steel-50 transition-colors">
                  <td className="px-4 py-3 font-heading font-bold text-navy-500">{c.company_name || c.full_name || "—"}</td>
                  <td className="px-4 py-3 text-navy-400">{c.customer_type}</td>
                  <td className="px-4 py-3 text-navy-400">{c.email}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${
                      c.status === "Active" ? "bg-green-100 text-green-700" :
                      c.status === "Blacklisted" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{c.status || "Active"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(c)} className="p-1.5 text-navy-300 hover:text-gold transition-colors"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-navy-500">Customer Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="font-mono text-[10px] text-navy-300 block">TYPE</span>{selected.customer_type}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">STATUS</span>{selected.status || "Active"}</div>
                {selected.company_name && <div><span className="font-mono text-[10px] text-navy-300 block">COMPANY</span>{selected.company_name}</div>}
                {selected.full_name && <div><span className="font-mono text-[10px] text-navy-300 block">NAME</span>{selected.full_name}</div>}
                <div><span className="font-mono text-[10px] text-navy-300 block">EMAIL</span>{selected.email}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">PHONE</span>{selected.phone}</div>
                {selected.address && <div className="col-span-2"><span className="font-mono text-[10px] text-navy-300 block">ADDRESS</span>{selected.address}</div>}
                {selected.vat_number && <div><span className="font-mono text-[10px] text-navy-300 block">VAT</span>{selected.vat_number}</div>}
                {selected.registration_number && <div><span className="font-mono text-[10px] text-navy-300 block">REG #</span>{selected.registration_number}</div>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => toggleBlacklist(selected)} variant={selected.status === "Blacklisted" ? "default" : "destructive"} className="font-heading font-bold text-sm">
                  {selected.status === "Blacklisted" ? <><CheckCircle className="w-4 h-4 mr-2" /> Restore</> : <><Ban className="w-4 h-4 mr-2" /> Blacklist</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}