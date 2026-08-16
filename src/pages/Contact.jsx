import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await base44.entities.ContactSubmission.create(form);
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      alert("Something went wrong. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-500 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="font-mono text-gold text-xs tracking-[0.25em] uppercase mb-3">// GET IN TOUCH</div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight">CONTACT US</h1>
          <p className="mt-4 text-navy-200 text-lg max-w-xl">We'd love to hear from you. Reach out for quotes, enquiries, or to discuss your project.</p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-16 md:py-24 blueprint-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Details */}
            <div className="space-y-8">
              <h2 className="font-display font-bold text-2xl text-navy-500">REACH US</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-navy-500 rounded flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-navy-500 text-sm">ADDRESS</div>
                    <p className="text-navy-300 text-sm mt-1">18 Hill Street, Bloemfontein,<br />Free State, 9302, South Africa</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-navy-500 rounded flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-navy-500 text-sm">PHONE</div>
                    <a href="tel:0737377462" className="block text-navy-300 text-sm mt-1 hover:text-gold transition-colors">073 737 7462 (M. Mofana)</a>
                    <a href="tel:0822181773" className="block text-navy-300 text-sm hover:text-gold transition-colors">082 218 1773 (T. Dlodlo)</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-navy-500 rounded flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-navy-500 text-sm">EMAIL</div>
                    <a href="mailto:office1@kem-plant.com" className="text-navy-300 text-sm mt-1 hover:text-gold transition-colors">office1@kem-plant.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-navy-500 rounded flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-navy-500 text-sm">HOURS</div>
                    <p className="text-navy-300 text-sm mt-1">Mon – Fri: 07:00 – 17:00<br />Sat: 08:00 – 13:00<br />Sun: Closed</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <a
                href="https://wa.me/27737377462?text=Hi%20KEM%20Plant%2C%20I%20would%20like%20to%20enquire%20about%20equipment%20hire."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 bg-green-500 text-white font-heading font-bold text-sm rounded hover:bg-green-600 transition-colors w-fit"
              >
                CHAT ON WHATSAPP
              </a>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-navy-100 rounded-lg p-12 text-center"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-2xl text-navy-500">Message Sent!</h3>
                  <p className="text-navy-300 mt-2">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-6 text-gold font-heading font-bold text-sm hover:underline">
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-navy-100 rounded-lg p-8 md:p-10 space-y-5">
                  <h2 className="font-display font-bold text-2xl text-navy-500 mb-6">SEND US A MESSAGE</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Full Name *</label>
                      <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border-navy-200" />
                    </div>
                    <div>
                      <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Email Address *</label>
                      <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border-navy-200" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Phone Number</label>
                      <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border-navy-200" />
                    </div>
                    <div>
                      <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Subject</label>
                      <Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="border-navy-200" />
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-xs text-navy-400 tracking-wider uppercase mb-1.5 block">Message *</label>
                    <Textarea required rows={6} value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="border-navy-200 resize-none" />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-3 bg-gold text-navy-500 font-heading font-bold hover:bg-gold-300 h-auto text-sm">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {submitting ? "SENDING..." : "SEND MESSAGE"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-[400px] bg-navy-100">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3450.1!2d26.2!3d-29.1!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s18+Hill+Street%2C+Bloemfontein%2C+9302!5e0!3m2!1sen!2sza!4v1"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="KEM Plant & Construction Location"
        />
      </section>
    </div>
  );
}