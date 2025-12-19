import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function ReviewsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get(
        "/Review/products-with-reviews"
      );

      // 🔥 Keep only products that actually have reviews
      const withReviews = res.data.filter(
        p => p.ReviewCount > 0 && p.Reviews?.length > 0
      );

      // Optional: show only latest / random reviews
      const flattened = withReviews.flatMap(p =>
        p.Reviews.map(r => ({
          productName: p.ProductName,
          productImage: p.ImageUrl,
          rating: r.Rating,
          comment: r.Comment,
          customerName: r.CustomerName,
          createdOn: r.CreatedOn
        }))
      );

      // Limit to first 6 reviews (homepage friendly)
      setItems(flattened.slice(0, 6));
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 px-5">
        <p className="text-center text-gray-500">Loading reviews...</p>
      </section>
    );
  }

  if (items.length === 0) {
    return null; // hide section if no reviews yet
  }

  return (
    <section className="py-12 bg-white px-5">
      <h2 className="text-3xl font-serif font-bold mb-8">
        What Our Customers Say
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((fb, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-5 shadow-sm bg-white hover:shadow-md transition"
          >
            {/* ⭐ Rating */}
            <div className="flex mb-2">
              {[1, 2, 3, 4, 5].map(n => (
                <span
                  key={n}
                  className={`text-lg ${
                    n <= fb.rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            {/* 💬 Comment */}
            <p className="mb-4 text-gray-700 italic">
              “{fb.comment}”
            </p>

            {/* 👤 Customer + Product */}
            <div className="flex items-center gap-4">
              <img
                src={fb.productImage}
                alt={fb.productName}
                className="w-12 h-12 rounded object-cover border"
                onError={e =>
                  (e.target.src =
                    "https://cdn-icons-png.flaticon.com/512/847/847969.png")
                }
              />

              <div>
                <div className="font-semibold">
                  {fb.customerName}
                </div>
                <div className="text-sm text-gray-500">
                  {fb.productName}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
