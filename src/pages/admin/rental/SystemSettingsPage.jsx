import React, { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const DEFAULTS = [
  { key: "vat_rate", value: "15", category: "Financial", label: "VAT Rate (%)", description: "Standard VAT rate applied to invoices and quotations" },
  { key: "invoice_prefix", value: "INV-", category: "Invoice", label: "Invoice Number Prefix", description: "Prefix for auto-generated invoice numbers" },
  { key: "quotation_prefix", value: "QT-", category: "Invoice", label: "Quotation Number Prefix", description: "" },
  { key: "booking_prefix", value: "BK-", category: "Invoice", label: "Booking Number Prefix", description: "" },
  { key: "agreement_prefix", value: "AGR-", category: "Invoice", label: "Agreement Number Prefix", description: "" },
  { key: "late_return_multiplier", value: "2", category: "Rental", label: "Late Return Rate (× daily rate per late day)", description: "Per the rental agreement: late returns are charged at this multiple of the daily rate" },
  { key: "default_payment_terms", value: "Upfront", category: "Rental", label: "Default Payment Terms", description: "" },
  { key: "rental_terms", value: `1. The Lessee shall use the Equipment in a careful, reasonable and proper manner and shall comply with all applicable South African laws and regulations.

2. The Lessee agrees to keep the equipment properly housed, sheltered, and in good order, repair, and good condition.

3. The Lessee is responsible for any loss or damage to the Equipment, regardless of the cause.

4. The Equipment shall only be used by the Lessee or Lessee's employees without the express permission of the Lessor.

5. The Lessor, at its own cost, shall keep the Equipment in good repair, condition and working order.

6. In the event of loss of any kind to the Equipment, the Lessee shall repair, replace, or pay market-related value to the Lessor.

7. Upon expiration or termination of this Agreement, the Lessee shall return the Equipment in good repair, condition and working order.

8. Late returns are subject to a fee equal to the configured late-return rate per day.

9. The Equipment is, and shall at all times remain, the sole and exclusive property of the Lessor.

10. This Agreement shall be construed and enforced according to the laws of South Africa.`, category: "Terms", label: "Default Rental Terms & Conditions", description: "Used in rental agreements and quotations" },
  { key: "lessor_name", value: "Kem Plant and Construction (Pty) Ltd", category: "System", label: "Lessor Name", description: "" },
  { key: "lessor_registration", value: "2024/020875/07", category: "System", label: "Lessor Registration Number", description: "" },
  { key: "lessor_vat", value: "455 032 2913", category: "System", label: "Lessor VAT Number", description: "" },
  { key: "lessor_address", value: "18 Hill Street, Navilhil, Bloemfontein, 9301", category: "System", label: "Lessor Business Address", description: "" },
  { key: "bank_name", value: "FNB", category: "Financial", label: "Bank Name", description: "" },
  { key: "bank_account_type", value: "Gold Business Account", category: "Financial", label: "Account Type", description: "" },
  { key: "bank_account_number", value: "63085733418", category: "Financial", label: "Account Number", description: "" },
];

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.SystemSetting.list().then(existing => {
      const map = {};
      existing.forEach(s => { map[s.key] = s; });
      // Seed missing defaults
      const toCreate = DEFAULTS.filter(d => !map[d.key]);
      Promise.all(toCreate.map(d => base44.entities.SystemSetting.create(d))).then(() => {
        base44.entities.SystemSetting.list().then(all => {
          const m = {};
          all.forEach(s => { m[s.key] = s; });
          setSettings(m);
          setLoading(false);
        });
      });
      if (toCreate.length === 0) { setSettings(map); setLoading(false); }
    });
  }, []);

  const update = (key, value) => {
    setSettings(p => ({ ...p, [key]: { ...p[key], value } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(Object.values(settings).map(s => base44.entities.SystemSetting.update(s.id, { value: s.value })));
      toast({ title: "Settings saved" });
    } catch (e) { toast({ title: "Save failed", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const categories = [...new Set(DEFAULTS.map(d => d.category))];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">System Settings</h1>
          <p className="text-navy-300 text-sm mt-1">Configure VAT, rates, terms, and business rules</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save Settings
        </Button>
      </div>

      <Tabs defaultValue={categories[0]}>
        <TabsList className="mb-4 flex-wrap h-auto">{categories.map(c => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}</TabsList>
        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="bg-white border border-navy-100 rounded-lg p-6">
            <div className="space-y-6">
              {DEFAULTS.filter(d => d.category === cat).map(d => {
                const s = settings[d.key];
                if (!s) return null;
                const isLongText = d.key === "rental_terms";
                return (
                  <div key={d.key}>
                    <Label className="text-sm font-heading font-bold text-navy-500">{d.label}</Label>
                    {d.description && <p className="text-navy-300 text-xs mt-0.5">{d.description}</p>}
                    {isLongText ? (
                      <Textarea value={s.value} onChange={e => update(d.key, e.target.value)} rows={12} className="mt-2 font-mono text-xs" />
                    ) : (
                      <Input value={s.value} onChange={e => update(d.key, e.target.value)} className="mt-2 max-w-sm" />
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}