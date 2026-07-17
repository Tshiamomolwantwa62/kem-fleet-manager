import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, ArrowRight, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Footer() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (!authed) return;
      try {
        const user = await base44.auth.me();
        if (user?.role === "admin") setIsAdmin(true);
      } catch {}
    });
  }, []);

  return (
    <footer className="bg-navy-500 text-white">
      {/* CTA Band */}
      <div className="bg-gold">
        <div className="max-w-7xl mx-auto px-6 py-8 md:py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-navy-500 text-xl md:text-2xl">NEED EQUIPMENT FOR YOUR PROJECT?</h3>
            <p className="text-navy-500/80 text-sm mt-1">Get a free quote within 24 hours</p>
          </div>
          <div className="flex gap-3">
            <Link to="/equipment" className="px-6 py-3 bg-navy-500 text-white font-heading font-bold text-sm rounded hover:bg-navy-600 transition-colors">
              VIEW EQUIPMENT
            </Link>
            <Link to="/contact" className="px-6 py-3 bg-white text-navy-500 font-heading font-bold text-sm rounded hover:bg-gray-100 transition-colors">
              CONTACT US
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gold rounded flex items-center justify-center">
                <span className="text-navy-500 font-display font-black text-lg">K</span>
              </div>
              <div>
                <div className="font-display font-bold text-lg">KEM</div>
                <div className="text-[10px] text-navy-200 font-mono tracking-widest">PLANT & CONSTRUCTION</div>
              </div>
            </div>
            <p className="text-navy-200 text-sm leading-relaxed">
              Providing reliable plant hire and construction solutions throughout South Africa for over 15 years.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-6 text-gold">Quick Links</h4>
            <div className="space-y-3">
              {[
                { label: "About Us", path: "/about" },
                { label: "Our Services", path: "/services" },
                { label: "Equipment Hire", path: "/equipment" },
                { label: "Blog", path: "/blog" },
                { label: "Careers", path: "/careers" },
                { label: "Contact", path: "/contact" },
              ].map(l => (
                <Link key={l.path} to={l.path} className="flex items-center gap-2 text-sm text-navy-200 hover:text-gold transition-colors">
                  <ArrowRight className="w-3 h-3" /> {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-6 text-gold">Services</h4>
            <div className="space-y-3">
              {["Plant Hire", "Construction Services", "Earthworks", "Road Construction", "Property Maintenance", "Civil Works"].map(s => (
                <Link key={s} to="/services" className="flex items-center gap-2 text-sm text-navy-200 hover:text-gold transition-colors">
                  <ArrowRight className="w-3 h-3" /> {s}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-sm uppercase tracking-wider mb-6 text-gold">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span className="text-sm text-navy-200">18 Hill Street, Bloemfontein, Free State, 9302</span>
              </div>
              <a href="tel:0737377462" className="flex items-center gap-3 text-sm text-navy-200 hover:text-gold transition-colors">
                <Phone className="w-4 h-4 text-gold shrink-0" /> 073 737 7462
              </a>
              <a href="tel:0822181773" className="flex items-center gap-3 text-sm text-navy-200 hover:text-gold transition-colors">
                <Phone className="w-4 h-4 text-gold shrink-0" /> 082 218 1773
              </a>
              <a href="mailto:office1@kem-plant.com" className="flex items-center gap-3 text-sm text-navy-200 hover:text-gold transition-colors">
                <Mail className="w-4 h-4 text-gold shrink-0" /> office1@kem-plant.com
              </a>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span className="text-sm text-navy-200">Mon – Fri: 07:00 – 17:00<br />Sat: 08:00 – 13:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-navy-400">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-navy-300">
            © {new Date().getFullYear()} KEM Plant & Construction (Pty) Ltd. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-navy-300 items-center">
            <span className="hover:text-gold cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-gold cursor-pointer transition-colors">Terms of Service</span>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 hover:text-gold transition-colors">
                <Shield className="w-3 h-3" /> Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}