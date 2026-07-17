import React, { useState, useEffect } from "react";
import { Loader2, Save, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const SECTIONS = [
  {
    category: "Homepage",
    label: "Homepage Hero",
    fields: [
      { key: "homepage_hero_label", label: "Hero Label", type: "text", default: "KEM PLANT & CONSTRUCTION (PTY) LTD" },
      { key: "homepage_hero_title", label: "Hero Title", type: "textarea", default: "RELIABLE PLANT HIRE & CONSTRUCTION SOLUTIONS" },
      { key: "homepage_hero_subtitle", label: "Hero Subtitle", type: "textarea", default: "Providing quality equipment and construction services throughout South Africa. 15+ years of trusted expertise." },
      { key: "homepage_hero_cta_text", label: "Primary Button Text", type: "text", default: "BOOK EQUIPMENT" },
      { key: "homepage_hero_cta_link", label: "Primary Button Link", type: "text", default: "/equipment" },
    ]
  },
  {
    category: "About",
    label: "About Us Page",
    fields: [
      { key: "about_hero_label", label: "Page Label", type: "text", default: "ABOUT US" },
      { key: "about_hero_title", label: "Page Title", type: "text", default: "OUR STORY" },
      { key: "about_hero_subtitle", label: "Page Subtitle", type: "textarea", default: "Building South Africa's infrastructure with reliability and expertise since 2010." },
      { key: "about_mission", label: "Mission Statement", type: "textarea", default: "To provide safe, reliable, and cost-effective plant hire and construction services that exceed our clients' expectations." },
      { key: "about_vision", label: "Vision Statement", type: "textarea", default: "To grow into South Africa's leading plant hire and construction company, recognised for our professionalism, safety standards, and contribution to building the nation's infrastructure." },
      { key: "about_story", label: "Company Description", type: "textarea", default: "KEM Plant & Construction (Pty) Ltd was founded by Mofana Mofana and Thabani Dlodlo, two industry professionals with a shared vision of providing reliable, high-quality plant hire and construction services." },
    ]
  },
  {
    category: "Contact",
    label: "Contact Information",
    fields: [
      { key: "contact_phone1", label: "Phone 1", type: "text", default: "073 737 7462" },
      { key: "contact_phone2", label: "Phone 2", type: "text", default: "082 218 1773" },
      { key: "contact_email", label: "Email Address", type: "text", default: "office1@kem-plant.com" },
      { key: "contact_address", label: "Office Address", type: "textarea", default: "18 Hill Street, Bloemfontein, Free State, 9302" },
      { key: "contact_whatsapp", label: "WhatsApp Number", type: "text", default: "27737377462" },
      { key: "contact_hours_weekday", label: "Weekday Hours", type: "text", default: "Mon – Fri: 07:00 – 17:00" },
      { key: "contact_hours_weekend", label: "Weekend Hours", type: "text", default: "Sat: 08:00 – 13:00" },
    ]
  },
  {
    category: "Footer",
    label: "Footer Content",
    fields: [
      { key: "footer_description", label: "Company Description", type: "textarea", default: "Providing reliable plant hire and construction solutions throughout South Africa for over 15 years." },
      { key: "footer_facebook", label: "Facebook URL", type: "text", default: "" },
      { key: "footer_linkedin", label: "LinkedIn URL", type: "text", default: "" },
      { key: "footer_instagram", label: "Instagram URL", type: "text", default: "" },
    ]
  },
];

export default function AdminContent() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.SiteSetting.list('-created_date', 200).then(items => {
      const map = {};
      items.forEach(s => { map[s.key] = s; });
      setSettings(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getValue = (field) => settings[field.key]?.value || field.default || "";

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const section of SECTIONS) {
        for (const field of section.fields) {
          const existing = settings[field.key];
          const value = getValue(field);
          if (existing) {
            await base44.entities.SiteSetting.update(existing.id, { value, category: section.category });
          } else {
            await base44.entities.SiteSetting.create({ key: field.key, value, category: section.category });
          }
        }
      }
      toast({ title: "All content saved" });
      // Reload
      const items = await base44.entities.SiteSetting.list('-created_date', 200);
      const map = {};
      items.forEach(s => { map[s.key] = s; });
      setSettings(map);
    } catch (err) {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-500">Website Content</h1>
          <p className="text-navy-300 text-sm mt-1">Edit your website content — changes save instantly</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gold text-navy-500 hover:bg-gold-300 font-heading font-bold text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "SAVING..." : "SAVE ALL CHANGES"}
        </Button>
      </div>

      <div className="space-y-6">
        {SECTIONS.map(section => (
          <div key={section.category} className="bg-white border border-navy-100 rounded-lg p-6">
            <h2 className="font-display font-bold text-navy-500 text-lg mb-4 pb-3 border-b border-navy-50">{section.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map(field => (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">{field.label}</label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={getValue(field)}
                      onChange={e => setSettings(s => ({ ...s, [field.key]: { ...s[field.key], value: e.target.value } }))}
                      rows={3}
                      className="resize-none"
                    />
                  ) : (
                    <Input
                      value={getValue(field)}
                      onChange={e => setSettings(s => ({ ...s, [field.key]: { ...s[field.key], value: e.target.value } }))}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}