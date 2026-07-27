import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Target, Eye, Award, Users, Clock, CheckCircle, ArrowRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

const ABOUT_HERO = "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/43bea7e6d_generated_ab678dd7.png";

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-center">
        <div className="absolute inset-0">
          <img src={ABOUT_HERO} alt="KEM Plant construction site" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-500/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 w-full">
          <div className="font-mono text-gold text-xs tracking-[0.25em] uppercase mb-3">// ABOUT US</div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight">OUR STORY</h1>
          <p className="mt-4 text-navy-200 text-lg max-w-xl">Building South Africa's infrastructure with reliability and expertise since 2010.</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 md:py-28 blueprint-bg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeading
                label="// OUR JOURNEY"
                title="BUILDING EXCELLENCE SINCE 2010"
                center={false}
              />
              <div className="mt-8 space-y-5 text-navy-400 leading-relaxed">
                <p>
                  KEM Plant & Construction (Pty) Ltd was founded by <strong className="text-navy-500">Mofana Mofana</strong> and <strong className="text-navy-500">Mary-Ann B. Dlodlo</strong>, two industry professionals with a shared vision of providing reliable, high-quality plant hire and construction services to the Free State and beyond.
                </p>
                <p>
                  With over <strong className="text-navy-500">15 years of combined experience</strong> in plant hire and logistics, and 5 years in construction services, we've grown from a small operation in Bloemfontein to a trusted partner for construction companies, municipalities, and government departments across South Africa.
                </p>
                <p>
                  Our commitment to safety, punctuality, and quality has earned us a reputation as one of the most dependable plant hire companies in the region. Every machine in our fleet is meticulously maintained, and our operators are certified and experienced professionals.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img src="https://media.base44.com/images/public/user_69832412d020af8163daec95/eeca9fc5b_IMG-20260705-WA0005.jpg" alt="KEM Plant equipment" className="rounded-lg shadow-lg w-full" />
              <img src="https://media.base44.com/images/public/user_69832412d020af8163daec95/755c21aaf_IMG-20260705-WA0006.jpg" alt="KEM machines for hire" className="rounded-lg shadow-lg w-full mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision */}
      <section className="py-20 bg-navy-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 border border-navy-400 rounded-lg"
            >
              <Target className="w-10 h-10 text-gold mb-5" />
              <h3 className="font-display font-bold text-2xl text-white mb-4">OUR MISSION</h3>
              <p className="text-navy-200 leading-relaxed">
                To provide safe, reliable, and cost-effective plant hire and construction services that exceed our clients' expectations. We aim to be the first choice for equipment hire in South Africa through exceptional service, modern equipment, and a commitment to excellence.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-10 border border-navy-400 rounded-lg"
            >
              <Eye className="w-10 h-10 text-gold mb-5" />
              <h3 className="font-display font-bold text-2xl text-white mb-4">OUR VISION</h3>
              <p className="text-navy-200 leading-relaxed">
                To grow into South Africa's leading plant hire and construction company, recognised for our professionalism, safety standards, and contribution to building the nation's infrastructure. We envision a future where KEM Plant is synonymous with construction excellence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="py-20 md:py-28 blueprint-bg">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading label="// LEADERSHIP" title="MEET OUR FOUNDERS" />
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              { name: "Mofana Mofana", role: "Co-Founder & Director", phone: "073 737 7462", exp: "15+ years in Plant Hire & Logistics" },
              { name: "Mary-Ann B. Dlodlo", role: "Co-Founder & Director", phone: "082 218 1773", exp: "15+ years in Plant Hire & Logistics" },
            ].map((founder, i) => (
              <motion.div
                key={founder.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="bg-white border border-navy-100 rounded-lg p-8 text-center"
              >
                <div className="w-24 h-24 bg-navy-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Users className="w-10 h-10 text-gold" />
                </div>
                <h3 className="font-display font-bold text-xl text-navy-500">{founder.name}</h3>
                <div className="font-mono text-xs text-gold tracking-wider mt-1 uppercase">{founder.role}</div>
                <p className="text-navy-300 text-sm mt-3">{founder.exp}</p>
                <a href={`tel:${founder.phone.replace(/\s/g, '')}`} className="mt-3 inline-block text-sm text-navy-400 hover:text-gold transition-colors">
                  {founder.phone}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-28 bg-steel-100">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading label="// OUR COMMITMENT" title="WHY CHOOSE KEM PLANT" />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Safety Commitment", desc: "Strict adherence to all safety standards and regulations. Regular equipment inspections and operator certifications." },
              { icon: Clock, title: "On-Time Every Time", desc: "Reliable delivery and collection schedules. Your project timeline is our priority." },
              { icon: Award, title: "Quality Guarantee", desc: "Modern, well-maintained equipment fleet. Every machine serviced to manufacturer specifications." },
              { icon: Users, title: "Skilled Operators", desc: "Experienced, certified operators available with every equipment hire." },
              { icon: CheckCircle, title: "Competitive Pricing", desc: "Transparent pricing with no hidden costs. Flexible daily, weekly, and monthly rates." },
              { icon: Target, title: "Client Focused", desc: "Dedicated account management, 24/7 support, and customised solutions for every project." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white border border-navy-100 rounded-lg p-8 hover:border-gold hover:shadow-lg transition-all"
              >
                <item.icon className="w-8 h-8 text-gold mb-4" />
                <h3 className="font-display font-bold text-navy-500 text-lg mb-2">{item.title}</h3>
                <p className="text-navy-300 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display font-black text-3xl md:text-4xl text-navy-500">PARTNER WITH US ON YOUR NEXT PROJECT</h2>
          <p className="mt-3 text-navy-500/80">Let's build something great together.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link to="/contact" className="px-8 py-4 bg-navy-500 text-white font-heading font-bold text-sm rounded hover:bg-navy-600 transition-colors inline-flex items-center gap-2">
              GET IN TOUCH <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}