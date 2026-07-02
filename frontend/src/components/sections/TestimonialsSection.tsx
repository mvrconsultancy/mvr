"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, Quote } from "lucide-react";
import { apiUrl } from "@/lib/api-url";

interface Testimonial {
  id: string;
  student_name: string;
  review: string;
  image_url: string | null;
  rating: number;
  country: string | null;
  university: string | null;
  course: string | null;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/testimonials?featured=true"))
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setTestimonials(json.data.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-3">Student Stories</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2f5e] mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            What Our Students Say
          </h2>
          <div className="section-divider" />
          <p className="text-gray-500 max-w-xl mx-auto text-sm mt-4">
            Over 50,000 success stories and counting. Here are a few from our students.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}>
                <div className="bg-[#f8f9fc] rounded-2xl p-7 border border-gray-100 hover:shadow-lg hover:border-[#c9a84c]/30 transition-all duration-300 h-full flex flex-col relative group">
                  <Quote size={32} className="text-[#c9a84c]/25 absolute top-5 right-6" />
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={14} className="text-[#c9a84c] fill-[#c9a84c]" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">&ldquo;{t.review}&rdquo;</p>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-3">
                      {t.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1a2f5e] flex items-center justify-center text-white font-bold text-sm">
                          {t.student_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-[#1a2f5e] text-sm">{t.student_name}</p>
                        <p className="text-gray-400 text-xs">{t.course} · {t.country}</p>
                        <p className="text-gray-400 text-xs">{t.university}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/testimonials" className="text-[#1a2f5e] hover:text-[#c9a84c] text-sm font-semibold transition-colors">
            View all testimonials →
          </Link>
        </div>
      </div>
    </section>
  );
}
