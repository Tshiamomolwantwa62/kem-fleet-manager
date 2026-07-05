import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, HardHat, Wrench, ArrowRight, CheckCircle } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const PLANT_HIRE_ITEMS = [
  "TLB", "Excavators", "Graders", "Tipper Trucks", "Plate Compactors",
  "Wackers", "Water Pumps", "Pokers", "Drive Units", "Grinders",
  "Drills", "Breakers", "Generators", "Grass Cutting Equipment", "Compaction Equipment"
];

const CONSTRUCTION_SERVICES = [
  { title: "Earthworks", desc: "Bulk earthworks, cut and fill operations, and land preparation for any scale project." },
  { title: "Excavation", desc: "Precise excavation services for foundations, trenches, and utility installations." },
  { title: "Site Clearing", desc: "Complete site preparation including vegetation removal, demolition, and debris clearing." },
  { title: "Road Construction", desc: "Gravel and tar road construction, grading, and road maintenance services." },
  { title: "Building Construction", desc: "Commercial and residential building construction from foundation to finish." },
  { title: "Civil Works", desc: "Stormwater systems, retaining walls, and civil engineering infrastructure." },
];

const PROPERTY_MAINTENANCE = [
  { title: "Landscaping", desc: "Commercial and residential landscaping, garden design, and irrigation systems." },
  { title: "General Maintenance", desc: "Preventive and reactive maintenance for commercial properties and facilities." },
  { title: "Grass Cutting", desc: "Large-scale grass cutting and vegetation management for municipal and private properties." },
  { title: "Building Repairs", desc: "Structural repairs, renovations, and maintenance for existing buildings." },
];

const HERO_IMG = "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/1e455e82d_generated_3bbf3773.png";

export default function Services() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-center">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Construction equipment" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-500/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 w-full">
          <div className="font-mono text-gold text-xs tracking-[0.25em] uppercase mb-3">// OUR SERVICES</div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight">WHAT WE OFFER</h1>
          <p className="mt-4 text-navy-200 text-lg max-w-xl">Comprehensive plant hire, construction, and property maintenance solutions.</p>
        </div>
      </section>

      {/* Plant Hire */}
      <section className="py-20 md:py-28 blueprint-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="w-16 h-16 bg-navy-500 rounded-lg flex items-center justify-center mb-6">
                <Truck className="w-8 h-8 text-gold" />
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-navy-500 tracking-tight">PLANT HIRE</h2>
              <p className="mt-4 text-navy-300 leading-relaxed">
                Our extensive fleet of construction equipment is available for daily, weekly, or monthly hire. All machines are regularly serviced and maintained to the highest standards. Experienced operators available on request.
              </p>
              <Link to="/equipment" className="mt-6 inline-flex items-center gap-2 text-gold font-heading font-bold text-sm hover:gap-3 transition-all">
                VIEW EQUIPMENT CATALOGUE <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PLANT_HIRE_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-2 p-3 bg-white border border-navy-100 rounded-lg text-sm text-navy-500 font-medium">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Construction Services */}
      <section className="py-20 md:py-28 bg-navy-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-gold rounded-lg flex items-center justify-center">
              <HardHat className="w-8 h-8 text-navy-500" />
            </div>
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">CONSTRUCTION SERVICES</h2>
              <p className="text-navy-200 mt-1">Full-scale construction solutions from foundation to finish</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONSTRUCTION_SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="p-6 border border-navy-400 rounded-lg hover:border-gold/40 transition-colors"
              >
                <h3 className="font-display font-bold text-white text-lg mb-2">{service.title}</h3>
                <p className="text-navy-200 text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Maintenance */}
      <section className="py-20 md:py-28 bg-steel-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 bg-navy-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-navy-500 tracking-tight">PROPERTY MAINTENANCE</h2>
              <p className="text-navy-300 mt-1">Keeping your properties in top condition</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PROPERTY_MAINTENANCE.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white p-8 border border-navy-100 rounded-lg hover:border-gold hover:shadow-lg transition-all"
              >
                <h3 className="font-display font-bold text-navy-500 text-xl mb-3">{service.title}</h3>
                <p className="text-navy-300 text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display font-black text-3xl md:text-4xl text-navy-500">NEED A QUOTE FOR YOUR PROJECT?</h2>
          <p className="mt-3 text-navy-500/80">Contact us today for competitive pricing and expert advice.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to="/contact" className="px-8 py-4 bg-navy-500 text-white font-heading font-bold text-sm rounded hover:bg-navy-600 transition-colors inline-flex items-center gap-2">
              REQUEST A QUOTE <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/equipment" className="px-8 py-4 bg-white text-navy-500 font-heading font-bold text-sm rounded hover:bg-gray-100 transition-colors">
              VIEW EQUIPMENT
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}