import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, ChevronLeft, ChevronRight, Camera, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const HERO_IMG = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80";

const CATEGORIES = [
  "All",
  "Construction Projects",
  "Road Works",
  "Civil Engineering",
  "Plant Hire",
  "Property Maintenance",
  "Before & After",
  "Company Events",
];

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    base44.entities.GalleryImage.list("sort_order", 200)
      .then(setImages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === "All" ? images : images.filter((i) => i.category === activeCategory);

  const openLightbox = (idx) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const next = () => setLightboxIndex((i) => (i + 1) % filtered.length);
  const prev = () => setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[42vh] min-h-[320px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="KEM construction projects gallery" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-500/70" />
        </div>
        <div className="relative text-center px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/20 border border-gold/40 rounded-full mb-4">
              <Camera className="w-3.5 h-3.5 text-gold" />
              <span className="text-gold font-mono text-[10px] tracking-widest uppercase">Project Showcase</span>
            </div>
            <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight">
              Our Work in Action
            </h1>
            <p className="text-navy-100 mt-4 text-base md:text-lg max-w-xl mx-auto">
              A gallery of completed construction, earthworks, and plant hire projects delivered across the Free State.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category filter */}
      <section className="border-b border-navy-100 bg-white sticky top-16 md:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded transition-colors ${
                  activeCategory === cat
                    ? "bg-navy-500 text-gold"
                    : "bg-steel-100 text-navy-400 hover:bg-navy-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <Camera className="w-12 h-12 text-navy-200 mx-auto mb-4" />
            <p className="text-navy-300 font-heading font-bold text-lg">No images yet</p>
            <p className="text-navy-300 text-sm mt-1">Check back soon for project photos.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {filtered.map((img, idx) => (
              <motion.button
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.4) }}
                onClick={() => openLightbox(idx)}
                className="group relative w-full mb-4 break-inside-avoid block overflow-hidden rounded-lg bg-steel-100"
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || img.title}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-500/90 via-navy-500/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="text-left">
                    {img.category && (
                      <span className="text-gold font-mono text-[10px] tracking-widest uppercase block mb-1">{img.category}</span>
                    )}
                    <h3 className="font-heading font-bold text-white text-sm leading-tight">{img.title}</h3>
                    {img.caption && <p className="text-navy-100 text-xs mt-1 line-clamp-2">{img.caption}</p>}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-navy-500 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white">Have a Project in Mind?</h2>
          <p className="text-navy-200 mt-3 max-w-xl mx-auto">
            From earthworks to road construction, our fleet and team are ready to deliver. Get in touch for a quote.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center mt-6 px-7 py-3 bg-gold text-navy-500 font-heading font-bold text-sm rounded hover:bg-gold-300 transition-colors"
          >
            REQUEST A QUOTE <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-navy-500/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-gold transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-2 md:left-6 p-2 text-white/80 hover:text-gold transition-colors z-10"
              aria-label="Previous"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-2 md:right-6 p-2 text-white/80 hover:text-gold transition-colors z-10"
              aria-label="Next"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
            <motion.div
              key={filtered[lightboxIndex].id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="max-w-5xl max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filtered[lightboxIndex].image_url}
                alt={filtered[lightboxIndex].alt_text || filtered[lightboxIndex].title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
              <div className="text-center mt-4 max-w-xl">
                {filtered[lightboxIndex].category && (
                  <span className="text-gold font-mono text-[10px] tracking-widest uppercase block mb-1">{filtered[lightboxIndex].category}</span>
                )}
                <h3 className="font-heading font-bold text-white text-lg">{filtered[lightboxIndex].title}</h3>
                {filtered[lightboxIndex].caption && (
                  <p className="text-navy-100 text-sm mt-1">{filtered[lightboxIndex].caption}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}