import React from "react";

export default function SectionHeading({ label, title, subtitle, light = false, center = true }) {
  return (
    <div className={center ? "text-center" : ""}>
      {label && (
        <div className={`font-mono text-xs tracking-[0.2em] uppercase mb-3 ${light ? "text-gold" : "text-gold-600"}`}>
          {label}
        </div>
      )}
      <h2 className={`font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight ${light ? "text-white" : "text-navy-500"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base md:text-lg max-w-2xl leading-relaxed ${center ? "mx-auto" : ""} ${light ? "text-navy-200" : "text-navy-300"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}