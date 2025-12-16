
import React, { useState, useEffect } from "react";
import axiosInstance from "../../Components/utils/axiosInstance";
import {
  Package,
  Truck,
  Eye,
  IndianRupee,
  Calendar,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  CreditCard,
} from "lucide-react";
import Navbar from "../../Components/Admin/Navbar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showConfirmedModal, setShowConfirmedModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);

  // Vendor Shipping states
  const [activeTab, setActiveTab] = useState("details"); // "details" or "vendor-shipping"
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [carrierName, setCarrierName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [submittingShipping, setSubmittingShipping] = useState(false);
  const [vendorShippingDetails, setVendorShippingDetails] = useState(null); // Stores submitted shipping info

  useEffect(() => {
    fetchDeliveredOrders();
  }, []);

  const fetchDeliveredOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/Order/admin/delivered-orders");
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error("Error fetching delivered orders:", error);
      toast.error("Failed to load delivered orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedOrder) return;

    if (!selectedOrder.ReturnId || selectedOrder.ReturnId === 0) {
      toast.error("Cannot process refund: Valid Return ID is missing");
      return;
    }

    if (!selectedOrder.PaymentId || selectedOrder.PaymentId.trim() === "") {
      toast.error("Cannot process refund: Payment ID is missing");
      return;
    }

    if (!selectedOrder.Reason || selectedOrder.Reason.trim() === "") {
      toast.error("Cannot process refund: Return reason is required");
      return;
    }

    const refundAmount = selectedOrder.RefundAmount || selectedOrder.TotalAmount;

    const confirmed = window.confirm(
      `Process Razorpay refund of ₹${refundAmount.toFixed(2)} to customer?\n\n` +
        `Return ID: ${selectedOrder.ReturnId}\n` +
        `Payment ID: ${selectedOrder.PaymentId}\n` +
        `Reason: "${selectedOrder.Reason}"`
    );

    if (!confirmed) return;

    try {
      setProcessingRefund(true);

      const refundData = {
        ReturnId: selectedOrder.ReturnId,
        PaymentId: selectedOrder.PaymentId,
        RefundAmount: refundAmount,
        Reason: selectedOrder.Reason,
      };

      const response = await axiosInstance.post("/payment/refund", refundData);

      if (response.data.success) {
        toast.success(
          `Refund processed successfully!\nRazorpay Refund ID: ${response.data.razorpayRefundId}\nAmount: ₹${response.data.refundAmount.toFixed(2)}`
        );
        await fetchDeliveredOrders();
        setShowReturnModal(false);
      } else {
        const msg = response.data.message || "Unknown error";
        if (
          msg.toLowerCase().includes("fully refunded already") ||
          msg.toLowerCase().includes("already been fully refunded")
        ) {
          toast.info("This payment has already been fully refunded to the customer.");
        } else {
          toast.error(`Failed to process refund: ${msg}`);
        }
      }
    } catch (error) {
      console.error("Refund error:", error);
      let message = "Failed to process refund.";
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      if (
        message.toLowerCase().includes("fully refunded already") ||
        message.toLowerCase().includes("already been fully refunded")
      ) {
        toast.info("This payment has already been fully refunded to the customer.");
      } else {
        toast.error(message);
      }
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleInitiateShipping = () => {
    setShowShippingForm(true);
  };

  const handleSubmitShipping = async () => {
    if (!carrierName.trim() || !trackingId.trim()) {
      toast.error("Please enter both Carrier Name and Tracking ID");
      return;
    }

    setSubmittingShipping(true);

    try {
      // Placeholder for actual API call
      // await axiosInstance.post(`/return/${selectedOrder.ReturnId}/vendor-shipping`, {
      //   CarrierName: carrierName,
      //   TrackingId: trackingId
      // });

      // Store details locally (in real app, fetch from backend on open)
      const shippingInfo = {
        carrierName: carrierName.trim(),
        trackingId: trackingId.trim(),
        submittedAt: new Date().toLocaleString("en-IN"),
      };

      setVendorShippingDetails(shippingInfo);
      setShowShippingForm(false);
      setCarrierName("");
      setTrackingId("");

      toast.success(
        `Vendor shipping initiated successfully!\nCarrier: ${shippingInfo.carrierName}\nTracking ID: ${shippingInfo.trackingId}`
      );
    } catch (error) {
      toast.error("Failed to initiate vendor shipping. Please try again.");
    } finally {
      setSubmittingShipping(false);
    }
  };

  const openReturnDetails = (order) => {
    const returnData = {
      ...order,
      ReturnId: order.ReturnId ?? null,
      Reason: order.Reason ?? "",
      RefundAmount: order.RefundAmount || order.TotalAmount,
      PaymentId: order.PaymentId,
      RefundStatus: order.RefundStatus || "Pending",
    };

    if (!returnData.ReturnId || returnData.ReturnId === 0) {
      toast.error("This return request is missing its Return ID. Cannot open details.");
      return;
    }

    setSelectedOrder(returnData);
    setActiveTab("details");
    setShowShippingForm(false);
    setCarrierName("");
    setTrackingId("");
    setVendorShippingDetails(null); // Reset when opening new return
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
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <Navbar />
        <div className="flex justify-between items-center mt-24">
          <h2 className="text-4xl font-bold text-gray-900 mb-10">
            Delivered Orders Management
          </h2>
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
                    const hasReturn = isReturned || isConfirmed || isExpired;

                    return (
                      <tr key={order.Id} className="hover:bg-gray-50 transition">
                        <td className="px-8 py-6 font-bold text-lg">#{order.Id}</td>
                        <td className="px-8 py-6">
                          <div className="font-medium text-gray-900">
                            Customer #{order.CustomerId}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-bold text-2xl text-[#586330]">
                          ₹{order.TotalAmount?.toFixed(2)}
                        </td>
                        <td className="px-8 py-6 text-gray-700">{formatDate(order.DeliveredDate)}</td>
                        <td className="px-8 py-6">
                          <span
                            className={`px-5 py-2 rounded-full font-medium ${getStatusBadge(
                              order.OrderStatus
                            )}`}
                          >
                            {order.OrderStatus}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={`px-5 py-2 rounded-full font-medium ${getStatusBadge(
                              order.ConfirmationStatus
                            )}`}
                          >
                            {order.ConfirmationStatus}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-center gap-4">
                            {isReturned && (
                              <button
                                onClick={() => openReturnDetails(order)}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 transition shadow-md"
                              >
                                <Eye size={18} />
                                View Return
                              </button>
                            )}

                            {isExpired && (
                              <button
                                onClick={() => openConfirmedDetails(order)}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 transition shadow-md"
                              >
                                <Eye size={18} />
                                View Details
                              </button>
                            )}

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

        {/* Return Details Modal with Tabs */}
        {showReturnModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-10 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-4xl font-bold text-gray-900">
                    Return Request - Order {selectedOrder.Id}
                  </h3>
                  <button
                    onClick={() => setShowReturnModal(false)}
                    className="text-4xl text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                {/* Tabs */}
                <div className="mt-8 flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-8 py-4 text-lg font-medium transition ${
                      activeTab === "details"
                        ? "border-b-4 border-red-600 text-red-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Return Details
                  </button>
                  <button
                    onClick={() => setActiveTab("vendor-shipping")}
                    className={`px-8 py-4 text-lg font-medium transition ${
                      activeTab === "vendor-shipping"
                        ? "border-b-4 border-purple-600 text-purple-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Truck size={20} className="inline mr-2" />
                    Vendor Shipping
                  </button>
                </div>
              </div>

              <div className="p-10 space-y-10">
                {activeTab === "details" && (
                  <>
                    {/* Status Overview */}
                    <div className="grid grid-cols-3  gap-2">
                      <div className="bg-red-50 p-8 rounded-xl text-center border border-red-200">
                        <p className="text-lg font-medium text-red-700">Return Status</p>
                        <p className="text-3xl font-bold text-red-900 mt-4">
                          {selectedOrder.Status || "Returned"}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-8 rounded-xl text-center border border-yellow-200">
                        <p className="text-lg font-medium text-yellow-700">Customer Refund</p>
                        <p className="text-3xl font-bold text-yellow-900 mt-4">
                          {selectedOrder.RefundStatus || "Pending"}
                        </p>
                      </div>

                      {/* Refund Amount */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8  border border-amber-300">
                      <h4 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        
                        Refund Amount
                      </h4>
                      <div className="text-center">
                        <p className="text-5xl font-bold text-red-600">
                          ₹{selectedOrder.RefundAmount?.toFixed(2) || selectedOrder.TotalAmount?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    </div>

                    

                    {/* Return Reason */}
                    {selectedOrder.Reason && (
                      <div>
                        <h4 className="text-2xl font-bold text-red-900 mb-4">
                          Customer Return Reason
                        </h4>
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
                              <span className="font-bold text-[#586330]">
                                ₹{item.Price?.toFixed(2)}
                              </span>
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

                    {/* Customer Pickup Info */}
                    {selectedOrder.TrackingId && (
                      <div>
                        <h4 className="text-2xl font-bold mb-4 flex items-center gap-3 text-blue-900">
                          <Truck size={32} />
                          Customer Pickup Information
                        </h4>
                        <div className="bg-blue-50 border-2 border-blue-300 p-8 rounded-2xl space-y-4">
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

                    {/* Refund Action */}
                    <div className="pt-8 border-t-4 border-gray-300">
                      <div className="flex justify-between items-center">
                        
                        <div className="flex gap-4">
                          {selectedOrder.RefundStatus === "Pending" && selectedOrder.PaymentId && (
                            <button
                              onClick={handleProcessRefund}
                              disabled={processingRefund}
                              className="px-8 py-4 bg-red-600 text-white text-xl font-bold rounded-xl hover:bg-red-700 transition flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                              {processingRefund ? (
                                <>
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CreditCard size={24} />
                                  Process Refund
                                </>
                              )}
                            </button>
                          )}

                          {selectedOrder.RefundStatus === "Completed" && (
                            <div className="flex items-center gap-3 px-8 py-4 bg-green-100 text-green-800 rounded-xl border-2 border-green-300">
                              <CheckCircle size={24} />
                              <div>
                                <p className="font-bold text-xl">Refund Completed</p>
                                <p className="text-sm">via Razorpay</p>
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
                  </>
                )}

                {activeTab === "vendor-shipping" && (
                  <div className="max-w-2xl mx-auto">
                    <h3 className="text-3xl font-bold text-purple-900 mb-8 text-center">
                      <Truck size={40} className="inline mr-3" />
                      Ship Returned Product to Vendor
                    </h3>

                    {/* Show submitted shipping details */}
                    {vendorShippingDetails ? (
                      <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-10 text-center">
                        <CheckCircle size={80} className="mx-auto text-green-600 mb-6" />
                        <h4 className="text-2xl font-bold text-green-900 mb-6">
                          Vendor Shipping Completed
                        </h4>
                        <div className="space-y-4 text-lg">
                          <p>
                            <strong>Carrier:</strong> {vendorShippingDetails.carrierName}
                          </p>
                          <p>
                            <strong>Tracking ID:</strong>{" "}
                            <span className="font-mono bg-white px-4 py-2 rounded-lg border">
                              {vendorShippingDetails.trackingId}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 mt-6">
                            Submitted on: {vendorShippingDetails.submittedAt}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {!showShippingForm ? (
                          <div className="text-center py-12">
                            <div className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-2xl p-12">
                              <Truck size={80} className="mx-auto text-purple-400 mb-6" />
                              <p className="text-xl text-gray-700 mb-8">
                                Initiate shipping of returned item(s) back to the vendor
                              </p>
                              <button
                                onClick={handleInitiateShipping}
                                className="px-8 py-4 bg-purple-600 text-white text-xl font-bold rounded-xl hover:bg-purple-700 transition shadow-lg"
                              >
                                Initiate Shipping
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-10">
                            <h4 className="text-2xl font-bold text-purple-900 mb-8">
                              Enter Shipping Details
                            </h4>

                            <div className="space-y-6">
                              <div>
                                <label className="block text-lg font-medium text-gray-700 mb-2">
                                  Carrier Name
                                </label>
                                <input
                                  type="text"
                                  value={carrierName}
                                  onChange={(e) => setCarrierName(e.target.value)}
                                  placeholder="e.g. Delhivery, BlueDart, DTDC"
                                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-lg font-medium text-gray-700 mb-2">
                                  Tracking ID
                                </label>
                                <input
                                  type="text"
                                  value={trackingId}
                                  onChange={(e) => setTrackingId(e.target.value)}
                                  placeholder="e.g. 1234567890"
                                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                                />
                              </div>

                              <div className="flex gap-4 justify-center pt-6">
                                <button
                                  onClick={handleSubmitShipping}
                                  disabled={submittingShipping}
                                  className="px-8 py-4 bg-purple-600 text-white text-xl font-bold rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                  {submittingShipping ? "Submitting..." : "Submit Shipping"}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowShippingForm(false);
                                    setCarrierName("");
                                    setTrackingId("");
                                  }}
                                  className="px-8 py-4 bg-gray-500 text-white text-xl font-bold rounded-xl hover:bg-gray-600 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* Confirmed/Expired Details Modal - Vendor Payment stays here */}
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

      <ToastContainer
        position="top-right"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}


