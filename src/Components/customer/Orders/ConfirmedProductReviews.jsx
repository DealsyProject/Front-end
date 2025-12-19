import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Package } from "lucide-react";

export default function ConfirmedProductReviews() {
  const [products, setProducts] = useState([]);
  const [reviewsMap, setReviewsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConfirmedProducts();
  }, []);

  const loadConfirmedProducts = async () => {
    try {
      setLoading(true);

      /* 1️⃣ Fetch orders */
      const res = await axiosInstance.get("/Order/customer/orders");

      const confirmedOrders = (res.data.orders || []).filter(
        o => o.ConfirmationStatus === "Confirmed"
      );

      if (confirmedOrders.length === 0) {
        setProducts([]);
        return;
      }

      /* 2️⃣ Extract UNIQUE productIds */
      const productIdSet = new Set();
      confirmedOrders.forEach(order =>
        order.Items.forEach(item => productIdSet.add(item.ProductId))
      );

      const productIds = Array.from(productIdSet);

      /* 3️⃣ Fetch PRODUCT details (IMAGES 🔥) */
      const productResponses = await Promise.all(
        productIds.map(id =>
          axiosInstance.get(`/Product/${id}`).then(r => r.data)
        )
      );

      const productsWithImages = productResponses.map(prod => {
        const primaryImg =
          prod.Images?.find(i => i.IsPrimary) || prod.Images?.[0];

        return {
          ProductId: prod.Id,
          ProductName: prod.Name,
          Image: primaryImg?.ImageUrl || null
        };
      });

      /* 4️⃣ Fetch REVIEWS */
      const reviewResponses = await Promise.all(
        productIds.map(id =>
          axiosInstance
            .get(`/Review/product/${id}`)
            .then(r => ({ productId: id, reviews: r.data }))
            .catch(() => ({ productId: id, reviews: [] }))
        )
      );

      const reviewMap = {};
      reviewResponses.forEach(r => {
        if (r.reviews.length > 0) {
          reviewMap[r.productId] = r.reviews[0];
        }
      });

      setProducts(productsWithImages);
      setReviewsMap(reviewMap);
    } catch (err) {
      console.error(err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!comment.trim()) {
      alert("Please enter comment");
      return;
    }

    try {
      setSubmitting(true);

      await axiosInstance.post("/Review", {
        productId: selectedProduct.ProductId,
        rating,
        comment
      });

      alert("Review submitted successfully");
      setSelectedProduct(null);
      setRating(5);
      setComment("");

      loadConfirmedProducts(); // refresh UI
    } catch (err) {
      alert("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]" />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-3xl font-bold mb-6">Rate Your Products</h3>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <Package size={80} className="mx-auto text-gray-400 mb-6" />
          <p className="text-xl text-gray-600">No confirmed orders</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {products.map(p => {
            const review = reviewsMap[p.ProductId];

            return (
              <div
                key={p.ProductId}
                className="bg-white p-5 rounded-xl shadow border"
              >
                <img
                  src={
                    p.Image ||
                    "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                  }
                  className="h-40 w-full object-cover rounded"
                  alt={p.ProductName}
                />

                <h4 className="mt-4 font-semibold">{p.ProductName}</h4>

                {review ? (
                  <div className="mt-3">
                    <div className="text-yellow-400 text-lg">
                      {"★".repeat(review.Rating)}
                      {"☆".repeat(5 - review.Rating)}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {review.Comment}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedProduct(p)}
                    className="mt-4 w-full bg-[#586330] text-white py-2 rounded-lg font-bold"
                  >
                    Write Review
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ⭐ REVIEW MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              Review: {selectedProduct.ProductName}
            </h3>

            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl ${
                    n <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              className="w-full border rounded-lg p-3"
              placeholder="Write your review..."
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting}
                className="px-4 py-2 bg-[#586330] text-white rounded font-bold"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
