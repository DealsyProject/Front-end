import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReturnBox, setShowReturnBox] = useState(null);
  const [returnReason, setReturnReason] = useState("");

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  const handleReturn = async (orderId) => {
    if (!returnReason) {
      alert("Please select a return reason");
      return;
    }

    if (!window.confirm("Are you sure you want to request a return?")) return;

    try {
      // later you will replace with your API endpoint
      await axiosInstance.post("/Order/return", {
        orderId,
        reason: returnReason,
      });

      alert("Return request submitted successfully!");

      // reset UI
      setShowReturnBox(null);
      setReturnReason("");
      fetchCustomerOrders(); // refresh orders to update status
    } catch (e) {
      alert("Failed to request return. Please try again.");
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      const response = await axiosInstance.get('/Order/customer/orders');
      let ordersData = response.data.orders || [];

      // Loop orders → loop items → fetch product image
      const updatedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const updatedItems = await Promise.all(
            order.Items.map(async (item) => {
              try {
                // Fetch product details to get image
                const prodRes = await axiosInstance.get(`/Product/${item.ProductId}`);
                const prod = prodRes.data;

                const primaryImage =
                  prod.Images?.find((img) => img.IsPrimary) || prod.Images?.[0];

                return {
                  ...item,
                  Image: primaryImage?.ImageUrl || item.Image || null
                };
              } catch {
                return { ...item, Image: item.Image || null };
              }
            })
          );

          return { ...order, Items: updatedItems };
        })
      );

      setOrders(updatedOrders);
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      alert("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };


  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed": case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });

  if (loading) return <p className="text-center py-10">Loading Orders...</p>;

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">My Orders</h3>

      {orders.length === 0 ? (
        <p className="text-gray-500">You have not placed any orders.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.Id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-200 p-6 flex justify-between">
                <div>
                  <h3 className="font-semibold">Order #{order.Id}</h3>
                  <p className="text-sm text-gray-500">Placed on {formatDate(order.CreatedOn)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.Status)}`}>
                  {order.Status}
                </span>
              </div>

              <div className="p-6">
                {order.Items?.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 mb-3">
                    <img src={item.Image} alt="" className="w-16 h-16 rounded object-cover" />
                    <div className="flex-1">
                      <p className="font-medium">{item.ProductName}</p>
                      <p className="text-sm text-gray-500">Qty: {item.Quantity}</p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => viewOrderDetails(order)}
                  className="text-[#586330] hover:underline text-sm font-medium"
                >
                  View Details →
                </button>
                {order.Status?.toLowerCase() === "delivered" && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowReturnBox(showReturnBox === order.Id ? null : order.Id)}
                      className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600 transition"
                    >
                      {showReturnBox === order.Id ? "Cancel Return" : "Return Order"}
                    </button>

                    {showReturnBox === order.Id && (
                      <div className="mt-3 bg-gray-100 p-4 rounded-lg">
                        <label className="block text-sm font-medium mb-2">Select Return Reason</label>
                        <select
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="w-full border p-2 rounded"
                        >
                          <option value="">-- Choose a reason --</option>
                          <option value="Item arrived damaged">Item arrived damaged</option>
                          <option value="Not expected item">Not expected item</option>
                          <option value="Changed my mind">Changed my mind</option>
                        </select>

                        <button
                          onClick={() => handleReturn(order.Id)}
                          disabled={!returnReason}
                          className="mt-3 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm Return
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}

      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg p-6">

            {/* Header */}
            <div className="border-b border-gray-200 pb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Order Details #{selectedOrder.Id}</h2>
              <button
                onClick={closeOrderDetails}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Order Basic Info */}
            <div className="pt-6 text-sm text-gray-600 flex flex-wrap gap-4">
              <div><span className="font-medium">Order Date:</span> {formatDate(selectedOrder.CreatedOn)}</div>
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.Status)}`}>
                  {selectedOrder.Status}
                </span>
              </div>
              {selectedOrder.RazorpayOrderId && (
                <div><span className="font-medium">Payment ID:</span> {selectedOrder.RazorpayOrderId}</div>
              )}
            </div>

            {/* Items */}
            <div className="pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.Items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.Image}
                      alt={item.ProductName}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.ProductName}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.Quantity}</p>
                      <p className="text-sm text-gray-600">Price: ₹{item.Price.toFixed(2)} each</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-right">
                      ₹{(item.Quantity * item.Price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">
                    ₹{selectedOrder.Items.reduce((sum, i) => sum + (i.Price * i.Quantity), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-gray-900">₹49.00</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="text-[#586330]">₹{selectedOrder.TotalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-900">
                {selectedOrder.ShippingAddress || "No shipping address provided"}
              </div>
            </div>

            {/* Close btn */}
            <div className="pt-8 border-t border-gray-200">
              <button
                onClick={closeOrderDetails}
                className="w-full bg-[#586330] text-white py-3 rounded-md hover:bg-[#586330]/90 transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
