import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/customer/Common/Navbar";
import Footer from "../../Components/customer/Common/Footer";
import axiosInstance from "../../Components/utils/axiosInstance";

export default function CustomerCheckout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pincode: "",
    paymentMethod: "razorpay"
  });

  useEffect(() => {
    fetchCart();
    fetchCustomerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- FETCH CART (updated to include ProductImage like CustomerCart) ---
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

  const fetchCustomerDetails = async () => {
    try {
      const response = await axiosInstance.get('/CustomerViewDetails/profile');
      setCustomer(response.data);
      setForm(prev => ({
        ...prev,
        name: response.data.FullName || "",
        email: response.data.Email || "",
        phone: response.data.PhoneNumber || "",
        address: response.data.Address || "",
        pincode: response.data.Pincode || ""
      }));
    } catch (error) {
      console.error("❌ Error fetching customer details:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

 const handlePayment = async () => {
  if (!form.name || !form.phone || !form.address || !form.pincode) {
    alert("Please fill all required fields");
    return;
  }

  if (cart.length === 0) {
    alert("Your cart is empty");
    return;
  }

  setProcessing(true);
  try {
    const total = cart.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);

    const orderItems = cart.map(item => ({
      productId: item.ProductId,
      quantity: item.Quantity,
      price: item.Price
    }));

    const shippingAddress = `${form.address}, ${form.pincode}`;

    // Step 1: Create order
    const orderResponse = await axiosInstance.post('/Order/create', {
      items: orderItems,
      shippingAddress: shippingAddress,
      currency: 'INR'
    });

    console.log('✅ Order created:', orderResponse.data);

    const razorpayData = orderResponse.data;
    
    // Extract with fallback values
    const razorpayKey = razorpayData.RazorpayKey || razorpayData.razorpayKey || 'rzp_test_HDLC1terx8qsOw';
    const razorpayOrderId = razorpayData.RazorpayOrderId || razorpayData.razorpayOrderId;
    const amount = razorpayData.Amount || razorpayData.amount || total;
    const currency = razorpayData.Currency || razorpayData.currency || 'INR';

    if (!razorpayOrderId) {
      console.error('❌ Missing Razorpay Order ID:', razorpayData);
      alert('Payment configuration error. Please contact support.');
      setProcessing(false);
      return;
    }

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Are you online?');
      setProcessing(false);
      return;
    }

    // Step 2: Initialize Razorpay payment
    const options = {
      key: razorpayKey,
      amount: Math.round(amount * 100), // Convert to paise and round
      currency: currency,
      name: 'Dealsy Furniture',
      description: 'Order Payment',
      order_id: razorpayOrderId,
      handler: async function (response) {
        try {
          console.log('🔍 Razorpay response:', response);
          
          // Step 3: Verify payment with correct payload structure
          const verifyPayload = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
            // Note: items and shippingAddress might not be needed for verification
          };

          console.log('🔍 Sending verification payload:', verifyPayload);

          const verifyResponse = await axiosInstance.post('/Payment/verify', verifyPayload);
          console.log('✅ Payment verification response:', verifyResponse.data);

          if (verifyResponse.data.success || verifyResponse.data.Success) {
            // Clear cart
            await clearCart();
            
            // Show success message with order ID
            const orderId = verifyResponse.data.orderId || verifyResponse.data.OrderId;
            alert(`✅ Payment Successful! Order #${orderId} has been placed.`);
            navigate('/customerprofile');
          } else {
            const errorMsg = verifyResponse.data.message || verifyResponse.data.Message || 'Payment verification failed';
            alert(`❌ ${errorMsg}`);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
          }
          
          alert('❌ Payment verification failed. Please contact support with Payment ID: ' + response.razorpay_payment_id);
        }
      },
      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone
      },
      notes: {
        address: shippingAddress
      },
      theme: {
        color: '#586330'
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          alert('Payment cancelled. You can try again later from your orders page.');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    
    razorpay.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      alert(`❌ Payment failed: ${response.error.description}`);
      setProcessing(false);
    });
    
    razorpay.open();
    
  } catch (error) {
    console.error('❌ Payment initialization failed:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    alert(error.response?.data?.message || error.message || 'Payment initialization failed. Please try again.');
    setProcessing(false);
  }
};
  const clearCart = async () => {
    try {
      for (const item of cart) {
        // used same remove endpoint as your original checkout code
        await axiosInstance.delete(`/Cart/remove/${item.Id}`);
      }
      setCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };


  const total = cart.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);
  const finalTotal = total;
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#586330] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#586330]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#586330]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#586330]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#586330]"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#586330]"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={form.paymentMethod === "razorpay"}
                    onChange={handleChange}
                    className="text-[#586330] focus:ring-[#586330]"
                  />
                  <span>Razorpay (Credit/Debit Card, UPI, Net Banking)</span>
                </label>
              </div>
              <div className="mt-4 flex gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" className="w-10" alt="Visa" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/MasterCard_Logo.svg" className="w-10" alt="MasterCard" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Amex_logo.svg" className="w-10" alt="Amex" />
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-xl shadow-md p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.Id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.ProductImage || "https://via.placeholder.com/400x300?text=No+Image"}
                      alt={item.ProductName}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-sm">{item.ProductName}</p>
                      <p className="text-gray-500 text-xs">Qty: {item.Quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold">₹{(item.Price * item.Quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              {/* Remove shipping fee line */}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-[#586330]">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handlePayment}
              disabled={processing || cart.length === 0}
              className={`w-full mt-6 py-3 rounded-md font-semibold transition ${processing || cart.length === 0
                  ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                  : "bg-[#586330] text-white hover:bg-[#586330]/80"
                }`}
            >
              {processing ? "Processing..." : `Pay ₹${finalTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
