import React, { useState, useEffect } from "react";
import { Loader2, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const STATUSES = ["All", "Pending", "Approved", "Awaiting Payment", "Paid", "Active Hire", "Completed", "Cancelled"];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const { toast } = useToast();

  const loadBookings = () => {
    setLoading(true);
    base44.entities.Booking.list('-created_date', 200).then(setBookings).finally(() => setLoading(false));
  };

  useEffect(loadBookings, []);

  const updateStatus = async (id, status) => {
    await base44.entities.Booking.update(id, { status });
    toast({ title: `Booking ${status.toLowerCase()}` });
    loadBookings();
    setSelected(null);
  };

  const filtered = filter === "All" ? bookings : bookings.filter(b => b.status === filter);

  const statusColor = (s) => {
    if (s === "Paid" || s === "Completed") return "bg-green-100 text-green-700";
    if (s === "Pending") return "bg-yellow-100 text-yellow-700";
    if (s === "Cancelled") return "bg-red-100 text-red-700";
    if (s === "Active Hire") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Bookings</h1>
          <p className="text-navy-300 text-sm mt-1">{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border rounded-lg"><p className="text-navy-300">No bookings found</p></div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-steel-100 text-left">
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Ref</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Customer</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Equipment</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Dates</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Total</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] text-navy-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-t border-navy-50 hover:bg-steel-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-navy-500">{b.booking_ref || b.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-navy-500">{b.customer_name || "—"}</td>
                  <td className="px-4 py-3 text-navy-400">{b.equipment_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-400">{b.start_date} – {b.end_date}</td>
                  <td className="px-4 py-3 font-mono font-bold text-navy-500">R{(b.total_cost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-[10px] font-mono font-bold rounded ${statusColor(b.status)}`}>{b.status}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(b)} className="p-1.5 text-navy-300 hover:text-gold transition-colors"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-navy-500">Booking Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-mono text-[10px] text-navy-300 block">REF</span>{selected.booking_ref || selected.id.slice(0, 8)}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">STATUS</span><span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${statusColor(selected.status)}`}>{selected.status}</span></div>
                <div><span className="font-mono text-[10px] text-navy-300 block">CUSTOMER</span>{selected.customer_name || "—"}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">EQUIPMENT</span>{selected.equipment_name || "—"}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">START DATE</span>{selected.start_date}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">END DATE</span>{selected.end_date}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">DELIVERY TO</span>{selected.delivery_address || "—"}</div>
                <div><span className="font-mono text-[10px] text-navy-300 block">OPERATOR</span>{selected.operator_required ? "Yes" : "No"}</div>
              </div>
              <div className="bg-steel-100 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between"><span>Rental Cost</span><span className="font-mono">R{(selected.rental_cost || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span className="font-mono">R{(selected.delivery_cost || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Operator</span><span className="font-mono">R{(selected.operator_cost || 0).toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-2"><span>Subtotal</span><span className="font-mono">R{(selected.subtotal || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>VAT (15%)</span><span className="font-mono">R{(selected.vat_amount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="font-mono text-gold">R{(selected.total_cost || 0).toLocaleString()}</span></div>
              </div>
              {selected.additional_notes && <div className="text-sm"><span className="font-mono text-[10px] text-navy-300 block mb-1">NOTES</span>{selected.additional_notes}</div>}
              <div className="flex gap-2 pt-2">
                {selected.status === "Pending" && (
                  <>
                    <Button onClick={() => updateStatus(selected.id, "Approved")} className="bg-green-600 text-white hover:bg-green-700 font-heading font-bold text-sm">
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button onClick={() => updateStatus(selected.id, "Cancelled")} variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 font-heading font-bold text-sm">
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </>
                )}
                {selected.status === "Approved" && (
                  <Button onClick={() => updateStatus(selected.id, "Awaiting Payment")} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
                    Send Invoice
                  </Button>
                )}
                {selected.status === "Paid" && (
                  <Button onClick={() => updateStatus(selected.id, "Active Hire")} className="bg-blue-600 text-white hover:bg-blue-700 font-heading font-bold text-sm">
                    Start Hire
                  </Button>
                )}
                {selected.status === "Active Hire" && (
                  <Button onClick={() => updateStatus(selected.id, "Completed")} className="bg-green-600 text-white hover:bg-green-700 font-heading font-bold text-sm">
                    Complete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}