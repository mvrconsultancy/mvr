"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Quote, ArrowRight } from "lucide-react";
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

export default function TestimonialsPageClient() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/testimonials"))
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setTestimonials(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="bg-[#1a2f5e] py-20 relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#c9a84c] text-sm font-semibold uppercase tracking-widest mb-3">Student Stories</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-playfair)" }}>
            What Our <span className="text-gradient-gold">Students Say</span>
          </h1>
          <p className="text-white/65 text-lg max-w-xl mx-auto">
            Real reviews from students who achieved their study abroad dreams with MVR Consultants.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <p className="text-center text-gray-400">Testimonials will appear here once added in the admin panel.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                >
                  <div className="bg-[#f8f9fc] rounded-2xl p-7 border border-gray-100 hover:shadow-lg h-full flex flex-col relative">
                    <Quote size={32} className="text-[#c9a84c]/25 absolute top-5 right-6" />
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} size={14} className="text-[#c9a84c] fill-[#c9a84c]" />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">&ldquo;{t.review}&rdquo;</p>
                    <div className="border-t border-gray-200 pt-4 flex items-center gap-3">
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
                        <p className="text-gray-400 text-xs">
                          {[t.course, t.country].filter(Boolean).join(" · ")}
                        </p>
                        {t.university && <p className="text-gray-400 text-xs">{t.university}</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-14">
            <Link href="/contact" className="inline-flex items-center gap-2 text-[#1a2f5e] font-semibold hover:text-[#c9a84c] transition-colors">
              Start your journey <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
