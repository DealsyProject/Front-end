import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../Components/customer/Common/Navbar";
import Footer from "../../Components/customer/Common/Footer";
import { FaTrashAlt, FaPlus, FaMinus, FaShoppingBag } from "react-icons/fa";
import axiosInstance from "../../Components/utils/axiosInstance";

export default function CustomerCart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const cartRes = await axiosInstance.get(`/Cart`);
      let cartData = cartRes.data || [];

      if (cartData.length === 0) {
        setCart([]);
        return;
      }

      const updatedCart = await Promise.all(
        cartData.map(async (item) => {
          try {
            const prodRes = await axiosInstance.get(`/Product/${item.ProductId}`);
            const prod = prodRes.data;

            const primaryImage =
              prod.Images?.find((img) => img.IsPrimary) || prod.Images?.[0];

            return {
              ...item,
              ProductImage: primaryImage?.ImageUrl || null,
            };
          } catch {
            return { ...item, ProductImage: null };
          }
        })
      );

      setCart(updatedCart);
    } catch (error) {
      console.error("❌ Error fetching cart:", error);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const increaseQty = async (cartItemId) => {
    try {
      const response = await axiosInstance.patch(`/Cart/increment/${cartItemId}`);
      if (response.data.Success) {
        // Update local state with the returned updated item
        setCart((prev) =>
          prev.map((item) =>
            item.Id === cartItemId
              ? { ...item, Quantity: response.data.UpdatedItem.Quantity }
              : item
          )
        );
      } else {
        alert(response.data.Message || "Failed to increment quantity");
      }
    } catch (error) {
      console.error("❌ Error incrementing quantity:", error);
      alert("Failed to increment quantity");
    }
  };

  const decreaseQty = async (cartItemId) => {
    try {
      const response = await axiosInstance.patch(`/Cart/decrement/${cartItemId}`);
      if (response.data.Success) {
        if (response.data.UpdatedItem) {
          // Update local state with the returned updated item
          setCart((prev) =>
            prev.map((item) =>
              item.Id === cartItemId
                ? { ...item, Quantity: response.data.UpdatedItem.Quantity }
                : item
            )
          );
        } else {
          // Item was removed (quantity hit 0)
          setCart((prev) => prev.filter((i) => i.Id !== cartItemId));
          window.dispatchEvent(new Event("cartUpdated")); // 🔥 navbar refresh
        }
      } else {
        alert(response.data.Message || "Failed to decrement quantity");
      }
    } catch (error) {
      console.error("❌ Error decrementing quantity:", error);
      alert("Failed to decrement quantity");
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      await axiosInstance.delete(`/Cart/${cartItemId}`);
      setCart((prev) => prev.filter((i) => i.Id !== cartItemId));
      window.dispatchEvent(new Event("cartUpdated")); // 🔥 navbar refresh
    } catch (error) {
      console.error("❌ Error removing item:", error);
      alert("Failed to remove item from cart");
    }
  };

  const clearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) return;

    try {
      await axiosInstance.delete(`/Cart/clear`);
      setCart([]);
      window.dispatchEvent(new Event("cartUpdated")); // 🔥 navbar refresh
      alert("🗑️ Cart cleared!");
    } catch (error) {
      console.error("❌ Error clearing cart:", error);
      alert("Failed to clear cart.");
    }
  };

  // REMOVED SHIPPING FEE - Only product total
  const total = cart.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);
  const finalTotal = total; // No shipping fee

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-pink-50">
        <Navbar />
        <main className="flex-grow flex justify-center items-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#586330] mb-4"></div>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-pink-50">
      <Navbar />
      <main className="flex-grow py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Shopping Cart</h1>
            <p className="text-gray-600">
              {cart.length === 0
                ? "Your cart is waiting to be filled"
                : `You have ${cart.length} item${cart.length !== 1 ? "s" : ""} in your cart`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Cart Items</h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700 transition text-sm font-medium"
                    >
                      <FaTrashAlt size={14} /> Clear Cart
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaShoppingBag className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                    <p className="text-gray-500 mb-6">Add some products to get started</p>
                    <Link
                      to="/customer/products"
                      className="inline-block bg-[#586330] text-white px-6 py-3 rounded-lg hover:bg-[#586330]/80"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.Id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.ProductImage || "https://via.placeholder.com/80x80?text=No+Image"}
                              alt={item.ProductName}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 text-lg mb-1">
                              {item.ProductName}
                            </h3>
                            <p className="text-[#586330] font-bold text-lg">₹{item.Price.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => decreaseQty(item.Id)}
                              className="px-3 py-2 hover:bg-gray-200 rounded-l-lg"
                              disabled={item.Quantity <= 1}
                            >
                              <FaMinus size={12} />
                            </button>
                            <span className="px-4 py-2 bg-white min-w-12 text-center font-medium">
                              {item.Quantity}
                            </span>
                            <button
                              onClick={() => increaseQty(item.Id)}
                              className="px-3 py-2 hover:bg-gray-200 rounded-r-lg"
                            >
                              <FaPlus size={12} />
                            </button>
                          </div>

                          <p className="font-bold text-gray-800 text-lg min-w-24">
                            ₹{(item.Price * item.Quantity).toFixed(2)}
                          </p>

                          <button
                            onClick={() => removeItem(item.Id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <FaTrashAlt size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.length} items)</span>
                    <span className="font-medium">₹{total.toFixed(2)}</span>
                  </div>

                  {/* REMOVED SHIPPING FEE SECTION */}

                  <div className="border-t pt-4 flex justify-between text-lg font-semibold text-gray-800">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className={`block w-full py-3 rounded-lg text-center font-medium transition ${cart.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#586330] text-white hover:bg-[#586330]/80"
                    }`}
                >
                  {cart.length === 0 ? "Cart is Empty" : "Proceed to Checkout"}
                </Link>

                {cart.length > 0 && (
                  <Link
                    to="/customer/products"
                    className="block w-full py-3 text-center text-[#586330] font-medium hover:text-[#586330]/80 mt-3"
                  >
                    Continue Shopping
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}