import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

export default function HomeProductSection() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadRandomProducts();
  }, []);

  const loadRandomProducts = async () => {
    try {
      const todayKey = "home_random_products";
      const lastSaved = JSON.parse(localStorage.getItem(todayKey));

      // If products were saved within last 24 hours → reuse them
      if (lastSaved && Date.now() - lastSaved.timestamp < 24 * 60 * 60 * 1000) {
        setProducts(lastSaved.data);
        return;
      }

      // Otherwise fetch fresh data
      const response = await axiosInstance.get("/Product/all");
      let allProducts = response.data.products || [];

      // Get 3 random unique products
      const randomThree = allProducts
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      setProducts(randomThree);

      // Save in localStorage for 24h caching
      localStorage.setItem(
        todayKey,
        JSON.stringify({
          timestamp: Date.now(),
          data: randomThree,
        })
      );
    } catch (error) {
      console.error("❌ Error loading home products:", error);
    }
  };

  return (
    <section className="py-12">
      <h2 className="text-3xl font-serif font-bold mb-6 pl-5">
        Check The Products
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-5">
        {products.map(product => {
          const img =
            product.Images?.find(img => img.IsPrimary)?.ImageUrl ||
            product.Images?.[0]?.ImageUrl ||
            "https://via.placeholder.com/400x300?text=No+Image";

          return (
            <div
              key={product.Id}
              className="rounded-lg shadow p-4 bg-white hover:shadow-xl transition cursor-pointer"
            >
              {/* On Click go to product details */}
              <Link to={`/customer/product/${product.Id}`}>
                <img
                  src={img}
                  alt={product.ProductName}
                  className="rounded mb-4 w-full h-56 object-cover hover:scale-105 transition"
                  onError={e => {
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=No+Image";
                  }}
                />
              </Link>

              <div className="font-semibold mb-1">{product.ProductName}</div>
              <div className="text-[#586330] font-bold mb-2">
                ₹{product.Price.toLocaleString("en-IN")}
              </div>
              <div className="text-gray-700 text-sm line-clamp-2">
                {product.Description}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
