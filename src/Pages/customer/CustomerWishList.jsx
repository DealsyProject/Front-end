import React, { useState, useEffect } from "react";
import Navbar from "../../Components/customer/Common/Navbar";
import Footer from "../../Components/customer/Common/Footer";
import { Trash2 } from "lucide-react";
import axiosInstance from "../../Components/utils/axiosInstance";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      // 1️⃣ Fetch wishlist
      const wishlistRes = await axiosInstance.get(`/Wishlist`);
      const wishlistData = wishlistRes.data || [];

      if (wishlistData.length === 0) {
        setWishlist([]);
        return;
      }

      // 2️⃣ Fetch all products only once
      const productRes = await axiosInstance.get(`/Product/all`);
      const products = productRes.data?.products || [];

      // 3️⃣ Merge product details with wishlist
      const updatedWishlist = wishlistData.map((item) => {
        const product = products.find((p) => p.Id === item.ProductId);

        if (!product) return item;

        const primaryImage =
          product.Images?.find((img) => img.IsPrimary) || product.Images?.[0];

        return {
          ...item,
          productName: product.ProductName,
          price: product.Price,
          description: product.Description,
          productImage: primaryImage?.ImageUrl || null,
        };
      });

      setWishlist(updatedWishlist);
    } catch (error) {
      console.error("❌ Error fetching wishlist:", error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id) => {
    try {
      await axiosInstance.delete(`/wishlist/${id}`);
      setWishlist((prev) => prev.filter((item) => item.Id !== id));
    } catch (error) {
      console.error("❌ Error removing from wishlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pink-50">
        <p className="text-gray-700 text-lg">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-pink-50">
      <Navbar />

      <main className="flex-grow px-6 py-10 flex flex-col items-center">
        <div className="w-full max-w-5xl">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">your Wishlist</h2>

          {wishlist.length === 0 ? (
            <div className="text-center text-gray-600 py-16">
              <p>Your wishlist is empty 😔</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.Id}
                  className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col"
                >
                  <img
                    src={item.productImage || "https://via.placeholder.com/300"}
                    alt={item.productName}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />

                  <h3 className="font-semibold text-gray-800 text-lg">
                    {item.productName}
                  </h3>

                  <p className="text-gray-500 text-sm mb-2 line-clamp-2">
                    {item.description || "No description available"}
                  </p>

                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-semibold text-gray-900">
                      ₹{item.price?.toLocaleString("en-IN") || "—"}
                    </span>

                    <button
                      onClick={() => removeFromWishlist(item.Id)}
                      className="text-gray-500 hover:text-red-500 transition"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
