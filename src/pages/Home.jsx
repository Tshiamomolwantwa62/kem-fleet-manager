import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Truck, Award, Users, Wrench, HardHat, CheckCircle, Star, Phone } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import { base44 } from "@/api/base44Client";

const HERO_IMG = "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/1e455e82d_generated_3bbf3773.png";
const COMPANY_FLYER = "https://media.base44.com/images/public/user_69832412d020af8163daec95/eeca9fc5b_IMG-20260705-WA0005.jpg";

const STATS = [
  { value: "15+", label: "Years Experience", icon: Award },
  { value: "200+", label: "Projects Completed", icon: CheckCircle },
  { value: "50+", label: "Machines Available", icon: Wrench },
  { value: "100%", label: "Safety Record", icon: Shield },
];

const SERVICES = [
  { title: "Plant Hire", desc: "TLBs, excavators, graders, tipper trucks, and compaction equipment available for daily, weekly, or monthly hire.", icon: Truck, path: "/services" },
  { title: "Construction Services", desc: "Earthworks, excavation, site clearing, road construction, building construction, and civil works.", icon: HardHat, path: "/services" },
  { title: "Property Maintenance", desc: "Landscaping, general maintenance, grass cutting, and building repairs for commercial and residential properties.", icon: Wrench, path: "/services" },
];

const TESTIMONIALS = [
  { name: "David van der Merwe", company: "Van der Merwe Construction", text: "KEM Plant has been our go-to for equipment hire for 5 years. Their machines are always in top condition and delivered on time. Highly recommended.", rating: 5 },
  { name: "Nomsa Dlamini", company: "City of Bloemfontein", text: "Professional service from start to finish. The team at KEM Plant understands the urgency of government projects. Equipment is reliable and operators are skilled.", rating: 5 },
  { name: "Johan Pretorius", company: "Pretorius Civils", text: "Competitive rates, excellent equipment, and a team that goes above and beyond. KEM Plant is a trusted partner for any construction project in the Free State.", rating: 5 },
];

export default function Home() {
  const [featuredEquipment, setFeaturedEquipment] = useState([]);

  useEffect(() => {
    base44.entities.Equipment.filter({ featured: true }, '-created_date', 4)
      .then(setFeaturedEquipment)
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Heavy construction equipment on site" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-500/95 via-navy-500/80 to-navy-500/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="font-mono text-gold text-xs tracking-[0.25em] uppercase mb-4">
              KEM PLANT & CONSTRUCTION (PTY) LTD
            </div>
            <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-white leading-[0.95] tracking-tight">
              RELIABLE<br />
              <span className="text-gold">PLANT HIRE</span><br />
              & CONSTRUCTION<br />
              SOLUTIONS
            </h1>
            <p className="mt-6 text-lg text-navy-200 max-w-lg leading-relaxed">
              Providing quality equipment and construction services throughout South Africa. 15+ years of trusted expertise.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/equipment" className="inline-flex items-center gap-2 px-7 py-4 bg-gold text-navy-500 font-heading font-bold text-sm rounded hover:bg-gold-300 transition-colors">
                BOOK EQUIPMENT <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 px-7 py-4 border-2 border-white text-white font-heading font-bold text-sm rounded hover:bg-white hover:text-navy-500 transition-colors">
                REQUEST A QUOTE
              </Link>
              <a href="tel:0737377462" className="inline-flex items-center gap-2 px-7 py-4 border-2 border-gold/40 text-gold font-heading font-bold text-sm rounded hover:bg-gold/10 transition-colors">
                <Phone className="w-4 h-4" /> CONTACT US
              </a>
            </div>
          </motion.div>
        </div>
        {/* Blueprint grid overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gold/20" />
      </section>

      {/* Stats */}
      <section className="bg-navy-500 border-t border-navy-400">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-gold mx-auto mb-3" />
                <div className="font-display font-black text-3xl md:text-4xl text-white">{stat.value}</div>
                <div className="font-mono text-xs text-navy-300 tracking-wider uppercase mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 md:py-28 blueprint-bg">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            label="// OUR SERVICES"
            title="WHAT WE DO"
            subtitle="From plant hire to full-scale construction, we provide end-to-end solutions for projects of any size."
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={service.path} className="block group p-8 bg-white border border-navy-100 rounded-lg hover:border-gold hover:shadow-xl transition-all h-full">
                  <div className="w-14 h-14 bg-navy-500 rounded flex items-center justify-center mb-6 group-hover:bg-gold transition-colors">
                    <service.icon className="w-7 h-7 text-gold group-hover:text-navy-500 transition-colors" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-navy-500 mb-3">{service.title}</h3>
                  <p className="text-navy-300 text-sm leading-relaxed">{service.desc}</p>
                  <div className="mt-6 flex items-center gap-2 text-gold font-heading font-bold text-sm group-hover:gap-3 transition-all">
                    LEARN MORE <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Equipment */}
      <section className="py-20 md:py-28 bg-steel-100">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            label="// EQUIPMENT FLEET"
            title="FEATURED MACHINES"
            subtitle="Browse our fleet of well-maintained construction equipment available for hire."
          />
          {featuredEquipment.length > 0 ? (
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEquipment.map((eq) => (
                <Link key={eq.id} to="/equipment" className="group bg-white border border-navy-100 rounded-lg overflow-hidden hover:shadow-xl hover:border-gold transition-all">
                  {eq.image_url && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={eq.image_url} alt={eq.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="font-mono text-[10px] text-navy-300 tracking-wider uppercase">{eq.category}</div>
                    <h3 className="font-display font-bold text-navy-500 mt-1">{eq.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-mono font-bold text-gold text-lg">R{eq.daily_rate?.toLocaleString()}</span>
                      <span className="text-xs text-navy-300">/day</span>
                    </div>
                    <div className={`mt-2 inline-block px-2 py-0.5 text-[10px] font-mono rounded ${
                      eq.availability_status === "Available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {eq.availability_status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
              <img src={COMPANY_FLYER} alt="KEM Plant equipment for hire" className="rounded-lg shadow-xl w-full" />
              <img src="https://media.base44.com/images/public/user_69832412d020af8163daec95/755c21aaf_IMG-20260705-WA0006.jpg" alt="KEM machines available for hire" className="rounded-lg shadow-xl w-full" />
            </div>
          )}
          <div className="mt-10 text-center">
            <Link to="/equipment" className="inline-flex items-center gap-2 px-7 py-4 bg-navy-500 text-white font-heading font-bold text-sm rounded hover:bg-navy-600 transition-colors">
              VIEW FULL CATALOGUE <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-28 bg-navy-500">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            light
            label="// WHY KEM PLANT"
            title="BUILT ON TRUST"
            subtitle="With 15+ years of experience, we've built a reputation for reliability, safety, and excellence in every project."
          />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: "On-Time Delivery", desc: "Equipment delivered and collected on schedule, every time." },
              { icon: Shield, title: "Safety First", desc: "All machines regularly serviced and certified. Full compliance with safety standards." },
              { icon: Users, title: "Experienced Operators", desc: "Skilled, certified operators available with every machine hire." },
              { icon: Truck, title: "Nationwide Service", desc: "Serving Bloemfontein and surrounding areas, expanding across South Africa." },
              { icon: Award, title: "Quality Equipment", desc: "Modern, well-maintained fleet of construction and plant hire machinery." },
              { icon: Wrench, title: "Full Maintenance", desc: "Comprehensive maintenance program ensuring zero downtime on your project." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="p-6 border border-navy-400 rounded-lg hover:border-gold/40 transition-colors"
              >
                <item.icon className="w-8 h-8 text-gold mb-4" />
                <h3 className="font-display font-bold text-white text-lg mb-2">{item.title}</h3>
                <p className="text-navy-200 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 blueprint-bg">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            label="// CLIENT TESTIMONIALS"
            title="TRUSTED BY THE INDUSTRY"
            subtitle="Hear what our clients say about working with KEM Plant & Construction."
          />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-navy-100 rounded-lg p-8"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-navy-400 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="mt-6 pt-4 border-t border-navy-100">
                  <div className="font-display font-bold text-navy-500 text-sm">{t.name}</div>
                  <div className="font-mono text-[11px] text-navy-300">{t.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gold">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display font-black text-3xl md:text-5xl text-navy-500 tracking-tight">
            READY TO START YOUR PROJECT?
          </h2>
          <p className="mt-4 text-navy-500/80 text-lg">
            Get in touch today for competitive rates and reliable service.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-navy-500 text-white font-heading font-bold text-sm rounded hover:bg-navy-600 transition-colors">
              GET A FREE QUOTE <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="tel:0737377462" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-navy-500 font-heading font-bold text-sm rounded hover:bg-gray-100 transition-colors">
              <Phone className="w-4 h-4" /> CALL NOW
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}