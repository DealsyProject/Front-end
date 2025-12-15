import React, { useState, useEffect } from "react";
import axiosInstance from "../../Components/utils/axiosInstance";
import { 
  Package, Truck, DollarSign, Eye, IndianRupee, Calendar, 
  AlertCircle, CheckCircle, RefreshCw, CreditCard 
} from "lucide-react";

export default function ProductReturnPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showConfirmedModal, setShowConfirmedModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [processingVendorPayment, setProcessingVendorPayment] = useState(false);

  useEffect(() => {
    fetchDeliveredOrders();
  }, []);

  const fetchDeliveredOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/Order/admin/delivered-orders");
      console.log("Fetched orders:", res.data.orders); // Debug log
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error("Error fetching delivered orders:", error);
      alert("Failed to load delivered orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
 const handleProcessRefund = async () => {
  if (!selectedOrder) return;
  
  // DEBUG: Log everything
  console.log("=== DEBUG: Refund Data ===");
  console.log("1. selectedOrder.Reason:", selectedOrder.Reason);
  console.log("2. typeof selectedOrder.Reason:", typeof selectedOrder.Reason);
  console.log("3. Is Reason truthy?:", !!selectedOrder.Reason);
  console.log("4. Is Reason empty string?:", selectedOrder.Reason === "");
  console.log("5. Full selectedOrder:", selectedOrder);
  
  // Check if we have a valid reason
  if (!selectedOrder.Reason || selectedOrder.Reason.trim() === "") {
    alert(`Cannot process refund: Reason is required. Current reason: "${selectedOrder.Reason}"`);
    return;
  }
  
  if (!window.confirm(`Process refund of ₹${selectedOrder.RefundAmount?.toFixed(2) || selectedOrder.TotalAmount?.toFixed(2)} to customer for reason: "${selectedOrder.Reason}"?`)) return;

  try {
    setProcessingRefund(true);
    
    // Prepare refund data - ensure all fields are present
    const refundData = {
      ReturnId: selectedOrder.Id, // Using OrderId as ReturnId
      PaymentId: selectedOrder.PaymentId || "", // Ensure string
      RefundAmount: selectedOrder.RefundAmount || selectedOrder.TotalAmount || 0,
      Reason: selectedOrder.Reason || "Customer return request" // Ensure this is not empty
    };
    
    console.log("=== SENDING REFUND DATA ===");
    console.log("Refund data to send:", refundData);
    console.log("Reason being sent:", refundData.Reason);
    console.log("Reason length:", refundData.Reason.length);
    
    const response = await axiosInstance.post("/payment/refund", refundData);
    
    console.log("=== REFUND RESPONSE ===");
    console.log("Response:", response);
    
    if (response.data.success) {
      alert(`Refund processed successfully! Razorpay Refund ID: ${response.data.razorpayRefundId}`);
      fetchDeliveredOrders();
      setShowReturnModal(false);
    } else {
      alert(response.data.message || "Failed to process refund.");
    }
  } catch (error) {
    console.error("=== REFUND ERROR DETAILS ===");
    console.error("Full error:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error status:", error.response?.status);
    console.error("Error headers:", error.response?.headers);
    
    if (error.response?.data?.errors) {
      alert(`Validation errors: ${JSON.stringify(error.response.data.errors, null, 2)}`);
    } else {
      alert(error.response?.data?.message || error.message || "Failed to process refund.");
    }
  } finally {
    setProcessingRefund(false);
  }
};
// Also fix the vendor payment function:
const handlePayVendor = async (orderId) => {
  if (!window.confirm("Confirm payment to vendor (80% of order amount)?")) return;

  try {
    setProcessingVendorPayment(true);
    // Send OrderId as per ProcessVendorPaymentDto
    await axiosInstance.post("/payment/vendor-payment", { OrderId: orderId });
    alert("Vendor payment processed successfully!");
    fetchDeliveredOrders();
  } catch (error) {
    console.error("Vendor payment error:", error);
    alert(error.response?.data?.message || "Failed to pay vendor.");
  } finally {
    setProcessingVendorPayment(false);
  }
};

const openReturnDetails = (order) => {
  console.log("Opening return details for order:", order);
  console.log("Order Reason property:", order.Reason);
  console.log("All properties of order:", Object.keys(order));
  console.log("Full order object:", JSON.stringify(order, null, 2));
  
  setSelectedOrder(order);
  setShowReturnModal(true);
};

  const openConfirmedDetails = (order) => {
    setSelectedOrder(order);
    setShowConfirmedModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const s = status.toLowerCase();
    if (s === "delivered") return "bg-green-100 text-green-800";
    if (s === "returned") return "bg-red-100 text-red-800";
    if (s === "confirmed") return "bg-blue-100 text-blue-800";
    if (s === "expired") return "bg-purple-100 text-purple-800";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "shipped") return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
        <p className="mt-6 text-xl text-gray-600">Loading delivered orders...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-4xl font-bold text-gray-900">Delivered Orders Management</h2>
        <button
          onClick={fetchDeliveredOrders}
          className="px-6 py-3 bg-[#586330] text-white rounded-lg hover:bg-[#586330]/90 font-medium transition flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <Package size={80} className="mx-auto text-gray-400 mb-6" />
          <p className="text-2xl font-medium text-gray-600">No delivered orders yet</p>
          <p className="text-gray-500 mt-3">Delivered orders will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#586330] text-white">
                <tr>
                  <th className="px-8 py-5 text-left font-semibold">Order ID</th>
                  <th className="px-8 py-5 text-left font-semibold">Customer</th>
                  <th className="px-8 py-5 text-left font-semibold">Amount</th>
                  <th className="px-8 py-5 text-left font-semibold">Delivered On</th>
                  <th className="px-8 py-5 text-left font-semibold">Order Status</th>
                  <th className="px-8 py-5 text-left font-semibold">Confirmation Status</th>
                  <th className="px-8 py-5 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const isReturned = order.ConfirmationStatus === "Returned";
                  const isConfirmed = order.ConfirmationStatus === "Confirmed";
                  const isExpired = order.ConfirmationStatus === "Expired";
                  const vendorPaid = order.VendorPaymentStatus === "Paid";
                  const refundPending = order.RefundStatus === "Pending";
                  const hasReturn = isReturned || isConfirmed || isExpired;
                  
                  return (
                    <tr key={order.Id} className="hover:bg-gray-50 transition">
                      <td className="px-8 py-6 font-bold text-lg">#{order.Id}</td>
                      <td className="px-8 py-6">
                        <div className="font-medium text-gray-900">Customer #{order.CustomerId}</div>
                      </td>
                      <td className="px-8 py-6 font-bold text-2xl text-[#586330]">
                        ₹{order.TotalAmount?.toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-gray-700">
                        {formatDate(order.DeliveredDate)}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-5 py-2 rounded-full font-medium ${getStatusBadge(order.OrderStatus)}`}>
                          {order.OrderStatus}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-5 py-2 rounded-full font-medium ${getStatusBadge(order.ConfirmationStatus)}`}>
                          {order.ConfirmationStatus}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-4">
                          {/* For Returned orders: Show View Return button */}
                          {isReturned && (
                            <button
                              onClick={() => openReturnDetails(order)}
                              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 transition shadow-md"
                            >
                              <Eye size={18} />
                              View Return
                            </button>
                          )}

                          {/* For Confirmed orders: Show Pay Vendor button */}
                          {isConfirmed && !vendorPaid && (
                            <button
                              onClick={() => handlePayVendor(order.Id)}
                              disabled={processingVendorPayment}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingVendorPayment ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <DollarSign size={18} />
                                  Pay Vendor
                                </>
                              )}
                            </button>
                          )}

                          {/* For Confirmed orders with vendor already paid */}
                          {isConfirmed && vendorPaid && (
                            <div className="flex items-center gap-2 text-green-600 font-bold">
                              <CheckCircle size={20} />
                              Vendor Paid
                            </div>
                          )}

                          {/* For Expired orders: Show View Details button */}
                          {isExpired && (
                            <button
                              onClick={() => openConfirmedDetails(order)}
                              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 transition shadow-md"
                            >
                              <Eye size={18} />
                              View Details
                            </button>
                          )}

                          {/* For orders that are just Delivered (not Returned/Confirmed/Expired) */}
                          {!hasReturn && (
                            <div className="text-gray-500 italic">
                              Awaiting customer confirmation
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Details Modal (for Returned status) */}
      {showReturnModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-10 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-4xl font-bold text-gray-900">
                  Return Request - Order #{selectedOrder.Id}
                </h3>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="text-4xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-10 space-y-10">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-red-50 p-8 rounded-2xl text-center border border-red-200">
                  <p className="text-lg font-medium text-red-700">Return Status</p>
                  <p className="text-3xl font-bold text-red-900 mt-4">
                    {selectedOrder.Status || "Returned"}
                  </p>
                </div>
                <div className="bg-yellow-50 p-8 rounded-2xl text-center border border-yellow-200">
                  <p className="text-lg font-medium text-yellow-700">Customer Refund</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-4">
                    {selectedOrder.RefundStatus || "Pending"}
                  </p>
                </div>
                <div className="bg-purple-50 p-8 rounded-2xl text-center border border-purple-200">
                  <p className="text-lg font-medium text-purple-700">Vendor Payment</p>
                  <p className="text-3xl font-bold text-purple-900 mt-4">
                    {selectedOrder.VendorPaymentStatus || "Pending"}
                  </p>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-2xl border border-amber-300">
                <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <IndianRupee size={32} />
                  Payment Breakdown
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <p className="text-gray-700 text-lg">Total Amount</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      ₹{selectedOrder.TotalAmount?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 text-lg">Commission (20%)</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      ₹{(selectedOrder.TotalAmount * 0.2).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 text-lg">Vendor Payout (80%)</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      ₹{(selectedOrder.TotalAmount * 0.8).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 text-lg">Customer Refund</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      ₹{selectedOrder.RefundAmount?.toFixed(2) || selectedOrder.TotalAmount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Return Reason Section - Important for Refund */}
              {selectedOrder.Reason && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-2xl font-bold text-red-900">Customer Return Reason</h4>
                    <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-medium">
                      This reason will be used for refund
                    </div>
                  </div>
                  <div className="bg-red-50 border-2 border-red-300 p-8 rounded-2xl">
                    <p className="text-xl italic text-red-800 leading-relaxed">
                      "{selectedOrder.Reason}"
                    </p>
                  </div>
                </div>
              )}

              {/* Returned Items */}
              <div>
                <h4 className="text-2xl font-bold mb-6">Returned Items</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(selectedOrder.Items || []).map((item, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-300 p-6 rounded-xl">
                      <p className="font-bold text-lg text-gray-900">{item.ProductName}</p>
                      <div className="mt-4 flex justify-between text-lg">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-bold">{item.Quantity}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-xl">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-bold text-[#586330]">₹{item.Price?.toFixed(2)}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between">
                        <span className="text-gray-700 font-medium">Total:</span>
                        <span className="text-2xl font-bold text-red-600">
                          ₹{(item.Quantity * item.Price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pickup Info */}
              {selectedOrder.TrackingId && (
                <div>
                  <h4 className="text-2xl font-bold mb-4 flex items-center gap-3 text-purple-900">
                    <Truck size={32} />
                    Pickup Information
                  </h4>
                  <div className="bg-purple-50 border-2 border-purple-300 p-8 rounded-2xl space-y-4">
                    <p className="text-lg">
                      <strong>Carrier:</strong> {selectedOrder.CarrierName || "Not specified"}
                    </p>
                    <p className="text-lg">
                      <strong>Tracking ID:</strong>{" "}
                      <span className="font-mono bg-white px-4 py-2 rounded-lg border">
                        {selectedOrder.TrackingId}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-300">
                <h4 className="text-2xl font-bold mb-4 text-blue-900">Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700">Payment ID:</p>
                    <p className="font-mono bg-white p-2 rounded border break-all">
                      {selectedOrder.PaymentId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Razorpay Order ID:</p>
                    <p className="font-mono bg-white p-2 rounded border break-all">
                      {selectedOrder.RazorpayOrderId || "N/A"}
                    </p>
                  </div>
                </div>
                {!selectedOrder.PaymentId && (
                  <p className="mt-3 text-red-600 font-medium">
                    ⚠️ Payment ID is missing. Cannot process refund without Payment ID.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-8 border-t-4 border-gray-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Refund Details</h4>
                    <p className="text-gray-600">
                      Amount to refund: <span className="font-bold text-2xl text-red-600">
                        ₹{selectedOrder.RefundAmount?.toFixed(2) || selectedOrder.TotalAmount?.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-gray-600 mt-1">
                      Refund status: <span className={`font-bold ${selectedOrder.RefundStatus === "Pending" ? "text-yellow-600" : "text-green-600"}`}>
                        {selectedOrder.RefundStatus || "Pending"}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    {/* Refund Button - Only show if refund is pending AND PaymentId exists */}
                    {selectedOrder.RefundStatus === "Pending" && selectedOrder.PaymentId && (
                      <button
                        onClick={handleProcessRefund}
                        disabled={processingRefund}
                        className="px-8 py-4 bg-red-600 text-white text-xl font-bold rounded-xl hover:bg-red-700 transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {processingRefund ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            Processing Refund...
                          </>
                        ) : (
                          <>
                            <CreditCard size={24} />
                            Process Razorpay Refund
                          </>
                        )}
                      </button>
                    )}

                    {/* Show status if refund already processed */}
                    {selectedOrder.RefundStatus === "Completed" && (
                      <div className="flex items-center gap-3 px-8 py-4 bg-green-100 text-green-800 rounded-xl border-2 border-green-300">
                        <CheckCircle size={24} />
                        <div>
                          <p className="font-bold text-xl">Refund Completed</p>
                          <p className="text-sm">via Razorpay</p>
                        </div>
                      </div>
                    )}

                    {/* Show warning if PaymentId is missing */}
                    {selectedOrder.RefundStatus === "Pending" && !selectedOrder.PaymentId && (
                      <div className="flex items-center gap-3 px-8 py-4 bg-yellow-100 text-yellow-800 rounded-xl border-2 border-yellow-300">
                        <AlertCircle size={24} />
                        <div>
                          <p className="font-bold text-xl">Cannot Process Refund</p>
                          <p className="text-sm">Payment ID is missing</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setShowReturnModal(false)}
                      className="px-10 py-4 bg-[#586330] text-white text-xl font-bold rounded-xl hover:bg-[#586330]/90 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed/Expired Details Modal */}
      {showConfirmedModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-10 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-4xl font-bold text-gray-900">
                  Order #{selectedOrder.Id} - {selectedOrder.ConfirmationStatus}
                </h3>
                <button
                  onClick={() => setShowConfirmedModal(false)}
                  className="text-4xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-10 space-y-10">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-8 rounded-2xl text-center border ${
                  selectedOrder.ConfirmationStatus === "Confirmed" 
                    ? "bg-blue-50 border-blue-200" 
                    : "bg-purple-50 border-purple-200"
                }`}>
                  <p className="text-lg font-medium">Confirmation Status</p>
                  <p className="text-3xl font-bold mt-4">
                    {selectedOrder.ConfirmationStatus}
                  </p>
                </div>
                <div className="bg-green-50 p-8 rounded-2xl text-center border border-green-200">
                  <p className="text-lg font-medium text-green-700">Vendor Payment</p>
                  <p className="text-3xl font-bold text-green-900 mt-4">
                    {selectedOrder.VendorPaymentStatus === "Paid" ? "Paid" : "Pending"}
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-300">
                <h4 className="text-2xl font-bold mb-6">Order Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-gray-600">Order ID</p>
                    <p className="text-xl font-bold">#{selectedOrder.Id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-[#586330]">
                      ₹{selectedOrder.TotalAmount?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Delivered On</p>
                    <p className="text-lg">{formatDate(selectedOrder.DeliveredDate)}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-2xl font-bold mb-6">Order Items</h4>
                <div className="space-y-4">
                  {(selectedOrder.Items || []).map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-semibold">{item.ProductName}</p>
                        <p className="text-gray-600">Qty: {item.Quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg">₹{item.Price?.toFixed(2)} × {item.Quantity}</p>
                        <p className="text-xl font-bold text-[#586330]">
                          ₹{(item.Quantity * item.Price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message based on status */}
              <div className={`p-6 rounded-2xl ${
                selectedOrder.ConfirmationStatus === "Confirmed" 
                  ? "bg-blue-50 border-2 border-blue-300" 
                  : "bg-purple-50 border-2 border-purple-300"
              }`}>
                <h4 className="text-xl font-bold mb-3">
                  {selectedOrder.ConfirmationStatus === "Confirmed" 
                    ? "✅ Order Confirmed Successfully" 
                    : "⏰ Return Window Expired"}
                </h4>
                <p className="text-lg">
                  {selectedOrder.ConfirmationStatus === "Confirmed" 
                    ? "Customer has confirmed receipt of order. Vendor can now be paid." 
                    : "Customer did not confirm receipt within 1 hour window. No return requested."}
                </p>
              </div>

              {/* Pay Vendor Button for Confirmed orders */}
              {selectedOrder.ConfirmationStatus === "Confirmed" && selectedOrder.VendorPaymentStatus !== "Paid" && (
                <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-300">
                  <h4 className="text-2xl font-bold mb-4 text-green-900">Vendor Payment Required</h4>
                  <div className="mb-6">
                    <p className="text-lg">Total order amount: <span className="font-bold">₹{selectedOrder.TotalAmount?.toFixed(2)}</span></p>
                    <p className="text-lg mt-2">Vendor payout (80%): <span className="font-bold text-2xl text-green-700">₹{(selectedOrder.TotalAmount * 0.8).toFixed(2)}</span></p>
                    <p className="text-lg mt-2">Commission (20%): <span className="font-bold text-orange-600">₹{(selectedOrder.TotalAmount * 0.2).toFixed(2)}</span></p>
                  </div>
                  <button
                    onClick={() => handlePayVendor(selectedOrder.Id)}
                    disabled={processingVendorPayment}
                    className="px-8 py-4 bg-green-600 text-white text-xl font-bold rounded-xl hover:bg-green-700 transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingVendorPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign size={24} />
                        Pay Vendor (80%)
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="pt-8 border-t-4 border-gray-300 flex justify-end">
                <button
                  onClick={() => setShowConfirmedModal(false)}
                  className="px-10 py-4 bg-[#586330] text-white text-xl font-bold rounded-xl hover:bg-[#586330]/90 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}