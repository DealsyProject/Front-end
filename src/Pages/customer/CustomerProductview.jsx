import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import Navbar from "../../Components/customer/Common/Navbar";
import Footer from "../../Components/customer/Common/Footer";
import axiosInstance from "../../Components/utils/axiosInstance";

export default function CustomerProductView() {
  const { id } = useParams();
  const [wishlist, setWishlist] = useState(false);
  const [mainImage, setMainImage] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) {
          setError("Product ID is missing");
          setLoading(false);
          return;
        }

        const response = await axiosInstance.get(`/Product/${id}`);
        const data = response.data;

        if (!data) {
          setError("Product not found");
          setLoading(false);
          return;
        }

        // FIXED: Use ImageUrl instead of ImageData
        if (data.Images?.length > 0) {
          setMainImage(data.Images[0].ImageUrl);
        }

        setProduct(data);
        setLoading(false);

        // Check if product is in wishlist
        await checkWishlistStatus(data.Id);
      } catch (error) {
        console.error("❌ Error fetching product:", error);
        setError("Failed to load product details");
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const checkWishlistStatus = async (productId) => {
    try {
      const response = await axiosInstance.get(`/wishlist`);
      const wishlistItems = response.data || [];
      const isInWishlist = wishlistItems.some(item => item.ProductId === productId);
      setWishlist(isInWishlist);
    } catch (error) {
      console.error("❌ Error checking wishlist status:", error);
    }
  };


  const handleAddToCart = async () => {
    try {
      await axiosInstance.post(`/Cart`, {
        productId: product.Id,
        quantity: 1,
      });
      window.dispatchEvent(new Event("cartUpdated"));
      alert("✅ Product added to cart!");
    } catch (error) {
      console.error("❌ Add to cart failed:", error);
      alert("Failed to add product to cart.");
    }
  };

  const handleWishlist = async () => {
    try {
      if (!wishlist) {
        // ADD TO WISHLIST
        await axiosInstance.post(`/wishlist`, { ProductId: product.Id });
        setWishlist(true);
        alert("❤️ Added to wishlist!");
      } else {
        // REMOVE FROM WISHLIST
        const response = await axiosInstance.get(`/wishlist`);
        const wishlistItems = response.data || [];
        const item = wishlistItems.find(i => i.ProductId === product.Id);

        if (item) {
          await axiosInstance.delete(`/wishlist/${item.Id}`);
        }

        setWishlist(false);
        alert("💔 Removed from wishlist!");
      }
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (error) {
      console.error("❌ Wishlist update failed:", error);
      alert("Failed to update wishlist.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fde7e7]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b450d] mb-4"></div>
          <p className="text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fde7e7]">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Product Not Found</h3>
          <p className="text-gray-500">{error || "The product you're looking for doesn't exist."}</p>
        </div>
      </div>
    );
  }

  // FIXED: Use ImageUrl for all image references
  const productImages = product.Images || [];

  return (
    <div className="flex flex-col min-h-screen bg-[#fde7e7]">
      <Navbar />
      <main className="flex-grow flex flex-col items-center py-10 px-5">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-5xl w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Product Image */}
            <div className="relative flex flex-col items-center">
              <img
                src={mainImage || "https://via.placeholder.com/400x300?text=No+Image"}
                alt={product.ProductName}
                className="w-full h-80 object-cover rounded-lg shadow-sm"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                }}
              />
              <button
                onClick={handleWishlist}
                className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition"
              >
                {wishlist ?
                  <FaHeart className="text-red-500 text-xl" /> :
                  <FaRegHeart className="text-gray-600 text-xl hover:text-red-500" />
                }
              </button>

              {productImages.length > 1 && (
                <div className="flex gap-4 mt-5 overflow-x-auto py-2">
                  {productImages.map((img, i) => (
                    <img
                      key={i}
                      src={img.ImageUrl}
                      alt={`${product.ProductName} view ${i + 1}`}
                      onClick={() => setMainImage(img.ImageUrl)}
                      className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 transition ${img.ImageUrl === mainImage ? "border-[#3b450d]" : "border-transparent hover:border-gray-300"
                        }`}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div>
              <h1 className="text-3xl font-semibold mb-2 text-gray-800">{product.ProductName}</h1>
              <p className="text-gray-500 mb-2">By {product.VendorName}</p>
              <span className="inline-block bg-[#3b450d] text-white px-3 py-1 rounded-full text-sm mb-4">
                {product.ProductCategory}
              </span>

              <p className="text-2xl font-semibold text-[#3b450d] mb-4">
                ₹{product.Price?.toLocaleString('en-IN') || '0'}
              </p>

              <p
                className={`mb-4 text-sm font-medium ${product.Quantity > 0 ? "text-green-600" : "text-red-600"
                  }`}
              >
                {product.Quantity > 0
                  ? `In Stock`
                  : "Unavailable"}
              </p>


              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Description:</h3>
                <p className="text-gray-600 leading-relaxed">{product.Description}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleWishlist}
                  className={`flex-1 px-6 py-3 rounded-md transition font-medium ${wishlist
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "border border-[#3b450d] text-[#3b450d] hover:bg-[#3b450d] hover:text-white"
                    }`}
                >
                  {wishlist ? "Added to Wishlist ❤️" : "Add to Wishlist"}
                </button>

                <button
                  disabled={product.Quantity === 0}
                  onClick={handleAddToCart}
                  className={`flex-1 px-6 py-3 rounded-md transition font-medium ${product.Quantity === 0
                    ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                    : "bg-[#3b450d] text-white hover:bg-[#2e350b]"
                    }`}
                >
                  {product.Quantity === 0 ? "Out of Stock" : "Add to Cart 🛒"}
                </button>
              </div>

              {/* Additional Product Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  {product.Rating > 0 && (
                    <div>
                      <span className="font-semibold">Rating:</span> ⭐ {product.Rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}