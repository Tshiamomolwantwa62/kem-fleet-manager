import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Send, Loader2, CheckCircle, Briefcase, Users, Shield, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function Careers() {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", position: "", experience: "", cover_letter: "" });
  const [files, setFiles] = useState({ cv: null, certificates: null, license: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileUpload = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...form };
      if (files.cv) data.cv_url = await handleFileUpload(files.cv);
      if (files.certificates) data.certificates_url = await handleFileUpload(files.certificates);
      if (files.license) data.license_url = await handleFileUpload(files.license);
      await base44.entities.JobApplication.create(data);
      setSubmitted(true);
    } catch (err) {
      alert("Something went wrong. Please try again or email us directly at office1@kem-plant.com");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-500 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="font-mono text-gold text-xs tracking-[0.25em] uppercase mb-3">// JOIN OUR TEAM</div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight">CAREERS</h1>
          <p className="mt-4 text-navy-200 text-lg max-w-xl">Build your career with KEM Plant & Construction. We're always looking for talented professionals.</p>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-16 md:py-20 bg-steel-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Briefcase, title: "Growth Opportunities", desc: "Advance your career in a rapidly growing company" },
              { icon: Users, title: "Great Team", desc: "Work with experienced professionals who support each other" },
              { icon: Shield, title: "Safety First", desc: "We prioritise the health and safety of every team member" },
              { icon: Award, title: "Competitive Pay", desc: "Fair compensation and benefits for all positions" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 border border-navy-100 rounded-lg text-center"
              >
                <item.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                <h3 className="font-display font-bold text-navy-500">{item.title}</h3>
                <p className="text-navy-300 text-sm mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 md:py-24 blueprint-bg">
        <div className="max-w-3xl mx-auto px-6">
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-navy-100 rounded-lg p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="font-display font-bold text-2xl text-navy-500">Application Submitted!</h3>
              <p className="text-navy-300 mt-2">Thank you for your interest. We'll review your application and be in touch.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-navy-100 rounded-lg p-8 md:p-10 space-y-5">
              <h2 className="font-display font-bold text-2xl text-navy-500 mb-2">APPLY NOW</h2>
              <p className="text-navy-300 text-sm mb-6">Submit your details and we'll keep you in mind for current and future opportunities.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Full Name *</label>
                  <Input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="border-navy-200" />
                </div>
                <div>
                  <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Email *</label>
                  <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border-navy-200" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Phone *</label>
                  <Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border-navy-200" />
                </div>
                <div>
                  <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Position Applying For</label>
                  <Input value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="border-navy-200" placeholder="e.g. TLB Operator" />
                </div>
              </div>
              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Experience</label>
                <Input value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} className="border-navy-200" placeholder="e.g. 5 years operating heavy machinery" />
              </div>

              {/* File uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: "cv", label: "CV / Resume" },
                  { key: "certificates", label: "Certificates" },
                  { key: "license", label: "Driver's Licence" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">{f.label}</label>
                    <label className="flex items-center gap-2 p-3 border border-dashed border-navy-200 rounded-lg cursor-pointer hover:border-gold transition-colors text-sm text-navy-400">
                      <Upload className="w-4 h-4 shrink-0" />
                      <span className="truncate">{files[f.key]?.name || "Choose file"}</span>
                      <input type="file" className="hidden" onChange={e => setFiles({...files, [f.key]: e.target.files[0]})} />
                    </label>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Cover Letter</label>
                <Textarea rows={4} value={form.cover_letter} onChange={e => setForm({...form, cover_letter: e.target.value})} className="border-navy-200 resize-none" placeholder="Tell us about yourself..." />
              </div>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-3 bg-gold text-navy-500 font-heading font-bold hover:bg-gold-300 h-auto text-sm">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {submitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}