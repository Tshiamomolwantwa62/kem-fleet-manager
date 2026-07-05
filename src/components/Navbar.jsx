import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Mail, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Equipment", path: "/equipment" },
  { label: "Blog", path: "/blog" },
  { label: "Careers", path: "/careers" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  return (
    <>
      {/* Top bar */}
      <div className="bg-navy-500 text-white text-sm py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="tel:0737377462" className="flex items-center gap-1.5 hover:text-gold transition-colors">
              <Phone className="w-3.5 h-3.5" /> 073 737 7462
            </a>
            <a href="tel:0822181773" className="flex items-center gap-1.5 hover:text-gold transition-colors">
              <Phone className="w-3.5 h-3.5" /> 082 218 1773
            </a>
            <a href="mailto:office1@kem-plant.com" className="flex items-center gap-1.5 hover:text-gold transition-colors">
              <Mail className="w-3.5 h-3.5" /> office1@kem-plant.com
            </a>
          </div>
          <div className="font-mono text-xs text-navy-200 tracking-wider">
            BLOEMFONTEIN, FREE STATE, SA
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-navy-500 rounded flex items-center justify-center">
                <span className="text-gold font-display font-black text-lg md:text-xl">K</span>
              </div>
              <div className="leading-tight">
                <div className="font-display font-bold text-navy-500 text-lg md:text-xl tracking-tight">KEM</div>
                <div className="text-[10px] md:text-xs text-navy-300 font-mono tracking-widest uppercase">Plant & Construction</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                    location.pathname === link.path
                      ? "text-gold bg-navy-500"
                      : "text-navy-500 hover:text-gold hover:bg-navy-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                to="/equipment"
                className="hidden md:inline-flex items-center px-5 py-2.5 bg-gold text-navy-500 font-heading font-bold text-sm rounded hover:bg-gold-300 transition-colors"
              >
                BOOK EQUIPMENT
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-2 text-navy-500"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-t overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block px-4 py-3 rounded text-sm font-medium ${
                      location.pathname === link.path
                        ? "text-gold bg-navy-500"
                        : "text-navy-500 hover:bg-navy-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <a href="tel:0737377462" className="flex items-center gap-2 px-4 py-2 text-sm text-navy-400">
                    <Phone className="w-4 h-4" /> 073 737 7462
                  </a>
                  <a href="tel:0822181773" className="flex items-center gap-2 px-4 py-2 text-sm text-navy-400">
                    <Phone className="w-4 h-4" /> 082 218 1773
                  </a>
                  <Link to="/equipment" className="mx-4 py-3 bg-gold text-navy-500 font-bold text-sm rounded text-center">
                    BOOK EQUIPMENT
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}