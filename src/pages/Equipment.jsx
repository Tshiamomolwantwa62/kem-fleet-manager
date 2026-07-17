import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, Grid, List, CheckCircle, User, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SectionHeading from "@/components/SectionHeading";

const CATEGORIES = ["All", "TLB", "Excavator", "Grader", "Tipper Truck", "Plate Compactor", "Wacker", "Water Pump", "Poker", "Drive Unit", "Grinder", "Drill", "Breaker", "Generator", "Grass Cutting", "Compaction Equipment"];

const FILTER_GROUPS = [
  { label: "All", icon: "🏗️", categories: [] },
  { label: "Earthworks", icon: "🚜", categories: ["TLB", "Excavator", "Grader", "Tipper Truck"] },
  { label: "Compaction", icon: "🔨", categories: ["Plate Compactor", "Wacker", "Compaction Equipment"] },
  { label: "Power Tools", icon: "🔧", categories: ["Grinder", "Drill", "Breaker", "Drive Unit"] },
  { label: "Pumps & Power", icon: "⚡", categories: ["Water Pump", "Generator", "Poker"] },
  { label: "Grounds Care", icon: "🌿", categories: ["Grass Cutting"] },
];

const PLACEHOLDER_IMAGES = {
  TLB: "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/834d70991_generated_6e0b2b96.png",
  Excavator: "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/7a3158956_generated_14c59a06.png",
  Grader: "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/b88f40f35_generated_f05b0c68.png",
  "Tipper Truck": "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/2a950a1f7_generated_d73650d4.png",
  "Plate Compactor": "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/a8fd1f165_generated_7ba4674e.png",
  Generator: "https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/93a1ad7ee_generated_7c12ad63.png",
};

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [view, setView] = useState("grid");

  useEffect(() => {
    base44.entities.Equipment.list('-created_date', 100)
      .then(setEquipment)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeGroup = FILTER_GROUPS.find(g => g.label === groupFilter);
  const groupCategories = activeGroup?.categories || [];

  const filtered = equipment.filter(eq => {
    const matchesSearch = eq.name?.toLowerCase().includes(search.toLowerCase()) || eq.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || eq.category === category;
    const matchesGroup = groupFilter === "All" || groupCategories.includes(eq.category);
    return matchesSearch && matchesCat && matchesGroup;
  });

  const availableCategories = groupFilter === "All" ? CATEGORIES : ["All", ...CATEGORIES.filter(c => c !== "All" && groupCategories.includes(c))];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center">
        <div className="absolute inset-0">
          <img src="https://media.base44.com/images/public/6a4a859bde6fdb91ddac1cac/1e455e82d_generated_3bbf3773.png" alt="Equipment" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-500/80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 w-full">
          <div className="font-mono text-gold text-xs tracking-[0.25em] uppercase mb-3">// EQUIPMENT CATALOGUE</div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight">OUR FLEET</h1>
          <p className="mt-4 text-navy-200 text-lg max-w-xl">Browse our range of well-maintained construction equipment available for hire.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b sticky top-16 md:top-20 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Group filter pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTER_GROUPS.map(g => (
              <button
                key={g.label}
                onClick={() => { setGroupFilter(g.label); setCategory("All"); }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-heading font-bold transition-colors ${
                  groupFilter === g.label
                    ? "bg-navy-500 text-white"
                    : "bg-steel-100 text-navy-400 hover:bg-navy-50 hover:text-navy-500"
                }`}
              >
                <span>{g.icon}</span> {g.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
              <Input
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-navy-200"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[200px] border-navy-200">
                <Filter className="w-4 h-4 mr-2 text-navy-300" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="hidden sm:flex border border-navy-200 rounded-md overflow-hidden">
              <button onClick={() => setView("grid")} className={`p-2.5 ${view === "grid" ? "bg-navy-500 text-white" : "text-navy-400 hover:bg-navy-50"}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={`p-2.5 ${view === "list" ? "bg-navy-500 text-white" : "text-navy-400 hover:bg-navy-50"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Grid */}
      <section className="py-12 md:py-16 bg-steel-100 blueprint-bg min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-navy-300 text-lg">No equipment found</div>
              <p className="text-navy-200 text-sm mt-2">Try adjusting your search or filter</p>
              <Link to="/contact" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gold text-navy-500 font-heading font-bold text-sm rounded hover:bg-gold-300 transition-colors">
                CONTACT US FOR AVAILABILITY
              </Link>
            </div>
          ) : (
            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filtered.map((eq, i) => (
                <motion.div
                  key={eq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={view === "grid"
                    ? "bg-white border border-navy-100 rounded-lg overflow-hidden hover:border-gold hover:shadow-xl transition-all group"
                    : "bg-white border border-navy-100 rounded-lg p-4 flex gap-4 hover:border-gold hover:shadow-lg transition-all items-center"
                  }
                >
                  {view === "grid" ? (
                    <>
                      <div className="aspect-[4/3] overflow-hidden relative bg-navy-50">
                        <img
                          src={eq.image_url || PLACEHOLDER_IMAGES[eq.category] || PLACEHOLDER_IMAGES.Excavator}
                          alt={eq.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-mono font-bold rounded ${
                          eq.availability_status === "Available" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                        }`}>
                          {eq.availability_status || "Available"}
                        </div>
                        {eq.sku && (
                          <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-navy-500/80 text-[10px] font-mono text-white rounded">
                            {eq.sku}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="font-mono text-[10px] text-navy-300 tracking-wider uppercase">{eq.category}</div>
                        <h3 className="font-display font-bold text-navy-500 text-lg mt-1">{eq.name}</h3>
                        {eq.description && <p className="text-navy-300 text-sm mt-2 line-clamp-2">{eq.description}</p>}
                        {eq.specifications && <p className="font-mono text-[11px] text-navy-300 mt-2 line-clamp-1">{eq.specifications}</p>}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-steel-100 rounded">
                            <div className="font-mono font-bold text-gold text-sm">R{eq.daily_rate?.toLocaleString()}</div>
                            <div className="text-[10px] text-navy-300">Daily</div>
                          </div>
                          <div className="text-center p-2 bg-steel-100 rounded">
                            <div className="font-mono font-bold text-navy-500 text-sm">R{eq.weekly_rate?.toLocaleString() || "—"}</div>
                            <div className="text-[10px] text-navy-300">Weekly</div>
                          </div>
                          <div className="text-center p-2 bg-steel-100 rounded">
                            <div className="font-mono font-bold text-navy-500 text-sm">R{eq.monthly_rate?.toLocaleString() || "—"}</div>
                            <div className="text-[10px] text-navy-300">Monthly</div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          {eq.operator_available && (
                            <div className="flex items-center gap-1.5 text-[11px] text-green-600">
                              <User className="w-3.5 h-3.5" /> Operator Available
                            </div>
                          )}
                          <Link to="/contact" className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-navy-500 font-heading font-bold text-xs rounded hover:bg-gold-300 transition-colors">
                            BOOK NOW <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded overflow-hidden shrink-0 bg-navy-50">
                        <img src={eq.image_url || PLACEHOLDER_IMAGES[eq.category] || PLACEHOLDER_IMAGES.Excavator} alt={eq.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[10px] text-navy-300 tracking-wider uppercase">{eq.category}</div>
                        <h3 className="font-display font-bold text-navy-500">{eq.name}</h3>
                        {eq.description && <p className="text-navy-300 text-xs mt-1 truncate">{eq.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-gold">R{eq.daily_rate?.toLocaleString()}/day</div>
                        <div className={`text-[10px] font-mono mt-1 ${eq.availability_status === "Available" ? "text-green-600" : "text-red-500"}`}>
                          {eq.availability_status || "Available"}
                        </div>
                      </div>
                      <Link to="/contact" className="shrink-0 px-4 py-2 bg-gold text-navy-500 font-heading font-bold text-xs rounded hover:bg-gold-300 transition-colors">
                        BOOK
                      </Link>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-navy-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white">Can't find what you need?</h2>
          <p className="mt-2 text-navy-200">Contact us and we'll source the right equipment for your project.</p>
          <Link to="/contact" className="mt-6 inline-flex items-center gap-2 px-7 py-3 bg-gold text-navy-500 font-heading font-bold text-sm rounded hover:bg-gold-300 transition-colors">
            CONTACT US <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}