import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, User, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import moment from "moment";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost.filter({ status: "Published" }, '-publish_date', 20)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-500 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="font-mono text-gold text-xs tracking-[0.25em] uppercase mb-3">// INSIGHTS & NEWS</div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-white tracking-tight">OUR BLOG</h1>
          <p className="mt-4 text-navy-200 text-lg max-w-xl">Construction tips, equipment insights, and project showcases from KEM Plant & Construction.</p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 md:py-24 blueprint-bg min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="font-display font-bold text-2xl text-navy-500">Coming Soon</h2>
              <p className="text-navy-300 mt-2">We're preparing insightful content for the construction industry. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white border border-navy-100 rounded-lg overflow-hidden hover:shadow-xl hover:border-gold transition-all group"
                >
                  {post.cover_image && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    {post.category && (
                      <span className="font-mono text-[10px] text-gold tracking-wider uppercase bg-gold/10 px-2 py-1 rounded">{post.category}</span>
                    )}
                    <h3 className="font-display font-bold text-navy-500 text-lg mt-3 line-clamp-2">{post.title}</h3>
                    {post.excerpt && <p className="text-navy-300 text-sm mt-2 line-clamp-3">{post.excerpt}</p>}
                    <div className="mt-4 flex items-center gap-4 text-[11px] text-navy-300 font-mono">
                      {post.publish_date && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {moment(post.publish_date).format("DD MMM YYYY")}</span>
                      )}
                      {post.author && (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}