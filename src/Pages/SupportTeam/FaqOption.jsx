// FaqOption.jsx — Simple Alternative Layout
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const BRAND_GREEN = "#586330";

// FAQ Data
const faqs = [
  { id: 1, q: "How do I create an account?", a: "Click 'Sign Up' in the header → enter your email → verify → done in 30 seconds.", cat: "account", votes: 2147, helpful: 2102 },
  { id: 2, q: "What payment methods do you accept?", a: "All major cards, Apple Pay, Google Pay, PayPal, and bank transfer.", cat: "billing", votes: 1892, helpful: 1876 },
  { id: 3, q: "Can I cancel anytime?", a: "Yes — instantly from Settings → Billing. No fees. No questions.", cat: "billing", votes: 1678, helpful: 1665 },
  { id: 4, q: "Is my data secure?", a: "End-to-end encryption. SOC 2 Type II certified. Your privacy is non-negotiable.", cat: "security", votes: 2981, helpful: 2956 },
  { id: 5, q: "Do you offer refunds?", a: "Full refund within 30 days. No restocking fees. Hassle-free.", cat: "returns", votes: 1234, helpful: 1218 },
  { id: 6, q: "How fast is shipping?", a: "Standard: 3–5 days • Express: 1–2 days • Same-day in major cities.", cat: "shipping", votes: 892, helpful: 881 },
];

// Categories
const categories = ["all", "account", "billing", "shipping", "returns", "security"];

export default function FaqOption() {
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return faqs.filter(f =>
      (selectedCat === "all" || f.cat === selectedCat) &&
      (search === "" || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, selectedCat]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const highlight = (text) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
    );
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4">

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#586330] mb-4 text-center">FAQs</h1>
        <p className="text-center text-gray-600 mb-8">Search or browse categories</p>

        {/* Search */}
        <div className="mb-6">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-3 border rounded-md outline-none"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-full text-sm border ${selectedCat === cat ? 'bg-[#586330] text-white' : 'bg-gray-100 text-gray-800'}`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>  

        {/* FAQ List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(faq => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border rounded-md p-4 cursor-pointer"
                onClick={() => setActiveId(activeId === faq.id ? null : faq.id)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-[#586330]">{highlight(faq.q)}</h3>
                  <span className="text-gray-500">{faq.helpful}/{faq.votes}</span>
                </div>

                {activeId === faq.id && (
                  <div className="mt-2 text-gray-700 border-t pt-2">
                    <p>{highlight(faq.a)}</p>
                    <div className="mt-2 flex gap-3">
                      <button className="text-[#586330] hover:underline text-sm">Copy answer</button>
                      <button className="text-[#586330] hover:underline text-sm" onClick={() => navigate('/support')}>Contact support</button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            No FAQs found.
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <h2 className="text-xl font-bold text-[#586330] mb-2">Still have questions?</h2>
          <p className="text-gray-700 mb-4">Our team responds quickly.</p>
          <button
            className="px-6 py-2 bg-[#586330] text-white rounded-md"
            onClick={() => navigate('/support')}
          >
            Get Support
          </button>
        </div>

      </div>
    </div>
  );
}
