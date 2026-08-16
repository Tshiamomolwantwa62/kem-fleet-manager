import React, { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const EMPTY = {
  customer_type: "Company",
  company_name: "",
  contact_person: "",
  phone: "",
  email: "",
  vat_number: "",
  billing_address: "",
};

/**
 * Inline "Add new customer" button + dialog. On save, creates a RentalCustomer
 * record and calls onCreated(customer) so the parent can select it.
 */
export default function QuickAddCustomer({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openDialog = () => { setForm(EMPTY); setOpen(true); };

  const save = async () => {
    if (form.customer_type === "Company" && !form.company_name) {
      toast({ title: "Company name required", variant: "destructive" }); return;
    }
    if (!form.contact_person) { toast({ title: "Contact person required", variant: "destructive" }); return; }
    if (!form.phone) { toast({ title: "Phone required", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        customer_id: `CUST-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        status: "Active",
      };
      const created = await base44.entities.RentalCustomer.create(payload);
      toast({ title: "Customer added" });
      setOpen(false);
      onCreated(created);
    } catch (e) {
      toast({ title: "Failed to add customer", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={openDialog} className="text-xs">
        <UserPlus className="w-3 h-3 mr-1" /> New
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-navy-500">Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs text-navy-400">Customer Type</Label>
              <Select value={form.customer_type} onValueChange={v => sf("customer_type", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">Company</SelectItem>
                  <SelectItem value="Individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.customer_type === "Company" ? (
              <div>
                <Label className="text-xs text-navy-400">Company Name *</Label>
                <Input value={form.company_name} onChange={e => sf("company_name", e.target.value)} className="mt-1" />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-navy-400">Contact Person *</Label>
                <Input value={form.contact_person} onChange={e => sf("contact_person", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-navy-400">Phone *</Label>
                <Input value={form.phone} onChange={e => sf("phone", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-navy-400">Email</Label>
              <Input type="email" value={form.email} onChange={e => sf("email", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-navy-400">VAT Number</Label>
              <Input value={form.vat_number} onChange={e => sf("vat_number", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-navy-400">Billing Address</Label>
              <Input value={form.billing_address} onChange={e => sf("billing_address", e.target.value)} className="mt-1" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}