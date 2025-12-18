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
  DollarSign,
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
  const [processingVendorPayment, setProcessingVendorPayment] = useState(false);
  const [initiatingShipping, setInitiatingShipping] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState("details"); // return modal
  const [confirmedActiveTab, setConfirmedActiveTab] = useState("details"); // confirmed modal

  // Vendor Shipping Form
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [carrierName, setCarrierName] = useState("");
  const [trackingId, setTrackingId] = useState("");

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
      toast.error("Failed to load delivered orders.");
    } finally {
      setLoading(false);
    }
  };

 const handleSubmitShipping = async () => {
  if (!selectedOrder) {
    toast.error("No order selected");
    return;
  }

  if (!carrierName.trim() || !trackingId.trim()) {
    toast.error("Please enter both Carrier Name and Tracking ID");
    return;
  }

  try {
    setInitiatingShipping(true);
    
    console.log("Sending shipping data:", {
      ReturnId: selectedOrder.ReturnId,
      CarrierName: carrierName.trim(),
      TrackingId: trackingId.trim()
    });
    
    // Make API call to initiate return shipping
    const response = await axiosInstance.post("/Order/return/initiate-shipping", {
      ReturnId: selectedOrder.ReturnId,
      CarrierName: carrierName.trim(),
      TrackingId: trackingId.trim()
    });

    console.log("API Response:", response.data);
    
    // Check both "Success" and "success" to handle case differences
    const isSuccess = response.data.Success || response.data.success;
    
    if (isSuccess) {
      const successMessage = response.data.Message || response.data.message || "Return shipping initiated successfully!";
      toast.success(successMessage);
      
      // Update the selected order with shipping info
      setSelectedOrder(prev => ({
        ...prev,
        TrackingId: trackingId.trim(),
        CarrierName: carrierName.trim(),
        Status: "Shipped"
      }));

      // Refresh the orders list
      await fetchDeliveredOrders();
      
      // Close the form
      setShowShippingForm(false);
      setCarrierName("");
      setTrackingId("");
    } else {
      const errorMessage = response.data.Message || response.data.message || "Failed to initiate shipping";
      toast.error(errorMessage);
    }
  } catch (error) {
    console.error("Error initiating return shipping:", error);
    console.error("Error response:", error.response);
    toast.error(
      error.response?.data?.message || 
      error.response?.data?.Message || 
      error.response?.data?.error || 
      "Failed to initiate return shipping"
    );
  } finally {
    setInitiatingShipping(false);
  }
};
  const handleInitiateShipping = () => {
    // Reset form and show it
    setCarrierName("");
    setTrackingId("");
    setShowShippingForm(true);
  };

 const handleProcessRefund = async () => {
  if (!selectedOrder) return;

  const refundAmount = selectedOrder.RefundAmount || selectedOrder.TotalAmount;

  const confirmed = window.confirm(
    `Process refund of ₹${refundAmount.toFixed(2)} to customer?\n\n` +
    `Order ID: ${selectedOrder.Id}\n` +
    `Reason: "${selectedOrder.Reason}"`
  );

  if (!confirmed) return;

  try {
    setProcessingRefund(true);

    console.log("Processing refund with data:", {
      ReturnId: selectedOrder.ReturnId,
      PaymentId: selectedOrder.PaymentId,
      RefundAmount: refundAmount,
      Reason: selectedOrder.Reason
    });

    const refundData = {
      ReturnId: selectedOrder.ReturnId,
      PaymentId: selectedOrder.PaymentId,
      RefundAmount: refundAmount,
      Reason: selectedOrder.Reason,
    };

    const response = await axiosInstance.post("/payment/refund", refundData);
    
    console.log("Refund response:", response.data);

    // Check both uppercase and lowercase success
    if (response.data.success || response.data.Success) {
      const refundId = response.data.razorpayRefundId || response.data.RazorpayRefundId;
      const message = response.data.message || response.data.Message || "Refund processed successfully!";
      
      toast.success(`${message} Razorpay ID: ${refundId}`);
      await fetchDeliveredOrders();
      setShowReturnModal(false);
    } else {
      const errorMessage = response.data.message || response.data.Message || "Refund failed.";
      toast.error(errorMessage);
    }
  } catch (error) {
    console.error("Refund error:", error);
    console.error("Error response:", error.response?.data);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.Message || 
                        "Failed to process refund.";
    toast.error(errorMessage);
  } finally {
    setProcessingRefund(false);
  }
};

  const handlePayVendor = async () => {
    if (!selectedOrder) return;

    const totalAmount = selectedOrder.TotalAmount;
    const estimatedVendorAmount = totalAmount * 0.8;
    const estimatedCommission = totalAmount * 0.2;

    const confirmed = window.confirm(
      `Pay vendor approximately ₹${estimatedVendorAmount.toFixed(2)} (80% of ₹${totalAmount.toFixed(2)})?\n` +
      `Platform commission: ₹${estimatedCommission.toFixed(2)} (20%)\n\n` +
      `Order ID: ${selectedOrder.Id}`
    );

    if (!confirmed) return;

    try {
      setProcessingVendorPayment(true);

      const paymentData = { OrderId: selectedOrder.Id };

      const response = await axiosInstance.post("/payment/vendor-payment", paymentData);

      if (response.data.success) {
        const { vendorAmount, commissionAmount } = response.data;

        toast.success(
          <div className="text-left">
            <strong>Vendor Payment Successful!</strong><br />
            Paid to Vendor: <strong>₹{parseFloat(vendorAmount).toFixed(2)}</strong><br />
            Platform Commission: <strong>₹{parseFloat(commissionAmount).toFixed(2)}</strong><br />
            <small>Order {selectedOrder.Id}</small>
          </div>,
          { autoClose: 8000 }
        );

        setSelectedOrder(prev => ({
          ...prev,
          VendorPaymentStatus: "Paid",
          VendorPayoutAmount: vendorAmount,
          CommissionAmount: commissionAmount,
          VendorPayoutDate: new Date().toISOString()
        }));

        await fetchDeliveredOrders();
      } else {
        toast.error(response.data.message || "Vendor payment failed.");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to process vendor payment.";
      toast.error(message);
    } finally {
      setProcessingVendorPayment(false);
    }
  };

  const openReturnDetails = (order) => {
  if (order.ConfirmationStatus !== "Returned") {
    toast.error("This order does not have a return request.");
    return;
  }

  // Just use the order as-is — backend already mapped return fields correctly
  setSelectedOrder(order);

  setActiveTab("details");
  setShowShippingForm(false);
  setCarrierName("");
  setTrackingId("");
  setShowReturnModal(true);
};

  const openConfirmedDetails = (order) => {
    setSelectedOrder(order);
    setConfirmedActiveTab("details");
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

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <Package size={80} className="mx-auto text-gray-400 mb-6" />
            <p className="text-2xl font-medium text-gray-600">No delivered orders yet</p>
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

                    return (
                      <tr key={order.Id} className="hover:bg-gray-50 transition">
                        <td className="px-8 py-6 font-bold text-lg">{order.Id}</td>
                        <td className="px-8 py-6 font-medium text-gray-900">Customer {order.CustomerId}</td>
                        <td className="px-8 py-6 font-bold text-2xl text-[#586330]">₹{order.TotalAmount?.toFixed(2)}</td>
                        <td className="px-8 py-6 text-gray-700">{formatDate(order.DeliveredDate)}</td>
                        <td className="px-8 py-6">
                          <span className={`px-5 py-2 rounded-full font-medium ${getStatusBadge(order.OrderStatus)}`}>
                            {order.OrderStatus}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-5 py-2 rounded-full font-medium ${getStatusBadge(order.ConfirmationStatus)}`}>
                            {order.ConfirmationStatus || "Pending"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex justify-center gap-4">
                            {isReturned && (
                              <button
                                onClick={() => openReturnDetails(order)}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 shadow-md"
                              >
                                <Eye size={18} /> View Return
                              </button>
                            )}
                            {isConfirmed && (
                              <button
                                onClick={() => openConfirmedDetails(order)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-md"
                              >
                                <Eye size={18} /> View Details
                              </button>
                            )}
                            {!isReturned && !isConfirmed && (
                              <span className="text-gray-500 italic">Awaiting confirmation</span>
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

        {/* ==================== RETURN MODAL ==================== */}
        {showReturnModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-10 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-4xl font-bold text-gray-900">
                    Return Request - Order {selectedOrder.Id}
                  </h3>
                  <button onClick={() => setShowReturnModal(false)} className="text-4xl text-gray-500 hover:text-gray-700">
                    ×
                  </button>
                </div>

                <div className="mt-8 flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-8 py-4 text-lg font-medium transition ${
                      activeTab === "details" ? "border-b-4 border-red-600 text-red-600" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Return Details
                  </button>
                  <button
                    onClick={() => setActiveTab("vendor-shipping")}
                    className={`px-8 py-4 text-lg font-medium transition ${
                      activeTab === "vendor-shipping" ? "border-b-4 border-purple-600 text-purple-600" : "text-gray-600 hover:text-gray-900"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-red-50 p-8 rounded-xl text-center border border-red-200">
                        <p className="text-lg font-medium text-red-700">Return Status</p>
                        <p className="text-3xl font-bold text-red-900 mt-4">
                          {selectedOrder.Status }
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-8 rounded-xl text-center border border-yellow-200">
                        <p className="text-lg font-medium text-yellow-700">Customer Refund</p>
                        <p className="text-3xl font-bold text-yellow-900 mt-4">
                          {selectedOrder.RefundStatus || "Pending"}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-xl border border-amber-300 text-center">
                        <p className="text-2xl font-bold mb-2">Refund Amount</p>
                        <p className="text-5xl font-bold text-red-600">
                          ₹{(selectedOrder.TotalAmount)?.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {selectedOrder.Reason && (
                      <div>
                        <h4 className="text-2xl font-bold text-red-900 mb-4">Customer Return Reason</h4>
                        <div className="bg-red-50 border-2 border-red-300 p-8 rounded-2xl">
                          <p className="text-xl italic text-red-800 leading-relaxed">"{selectedOrder.Reason}"</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-2xl font-bold mb-6">Returned Items</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(selectedOrder.Items || []).map((item, idx) => (
                          <div key={idx} className="bg-gray-50 p-6 rounded-xl border border-gray-300">
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

                    {selectedOrder.RefundStatus !== "Completed" && selectedOrder.PaymentId && (
                      <div className="pt-8 border-t-4 border-gray-300 text-center">
                        <button
                          onClick={handleProcessRefund}
                          disabled={processingRefund}
                          className="px-10 py-5 bg-red-600 text-white text-2xl font-bold rounded-xl hover:bg-red-700 transition flex items-center gap-4 mx-auto disabled:opacity-50 shadow-lg"
                        >
                          {processingRefund ? (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard size={32} />
                              Process Customer Refund
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {selectedOrder.RefundStatus === "Completed" && (
                      <div className="bg-green-50 border-2 border-green-300 p-8 rounded-2xl text-center">
                        <CheckCircle size={80} className="mx-auto text-green-600 mb-4" />
                        <p className="text-3xl font-bold text-green-900">Refund Completed</p>
                        <p className="text-lg text-gray-700 mt-2">Customer has been refunded successfully.</p>
                      </div>
                    )}
                  </>
                )}

              {activeTab === "vendor-shipping" && (
  <div className="max-w-2xl mx-auto">
    <h3 className="text-3xl font-bold text-purple-900 mb-8 text-center">
      <Truck size={40} className="inline mr-3" />
      Product Returned to Vendor
    </h3>

    {/* Show workflow status */}
    <div className="mb-8">
      <h4 className="text-xl font-bold mb-4">Return Workflow:</h4>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center ${selectedOrder.Status === "Pending" ? "text-blue-600 font-bold" : "text-gray-400"}`}>
          <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2">
            1
          </div>
          <span>Return Requested</span>
        </div>
        <div className={`flex items-center ${selectedOrder.Status === "Shipped" ? "text-blue-600 font-bold" : "text-gray-400"}`}>
          <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2">
            2
          </div>
          <span>Admin Ships to Vendor</span>
        </div>
        <div className={`flex items-center ${selectedOrder.Status === "Confirmed" ? "text-blue-600 font-bold" : "text-gray-400"}`}>
          <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2">
            3
          </div>
          <span>Vendor Confirms Receipt</span>
        </div>
      </div>
    </div>

    {/* Check current status */}
    {selectedOrder.Status === "Shipped" ? (
      <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-8">
        <div className="text-center mb-6">
          <Truck size={60} className="mx-auto text-blue-500 mb-4" />
          <h4 className="text-2xl font-bold text-blue-900 mb-2">Return Shipped to Vendor</h4>
          <p className="text-gray-600">Waiting for vendor to confirm receipt</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="font-medium">Carrier:</p>
            <p className="text-lg">{selectedOrder.CarrierName}</p>
          </div>
          <div>
            <p className="font-medium">Tracking ID:</p>
            <p className="text-lg font-mono bg-white px-3 py-1 rounded border">
              {selectedOrder.TrackingId}
            </p>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              Status: <span className="font-medium text-blue-700">Shipped</span>
              <br />
              Next step: Vendor confirms receipt
            </p>
          </div>
        </div>
      </div>
    ) : selectedOrder.Status === "Confirmed" ? (
      <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-10 text-center">
        <CheckCircle size={80} className="mx-auto text-green-600 mb-6" />
        <h4 className="text-2xl font-bold text-green-900 mb-6">Return Completed</h4>
        <div className="space-y-4 text-lg">
         
          <p className="text-sm text-gray-600 mt-6">
            Status: <span className="font-medium text-green-700">Confirmed by Vendor</span>
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
                Initiate Shipping to Vendor
              </button>
              <p className="text-gray-500 mt-4 text-sm">
                After shipping, vendor will confirm receipt when they receive the returned items
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-10">
            <h4 className="text-2xl font-bold text-purple-900 mb-8">Enter Shipping Details</h4>
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Carrier Name</label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  placeholder="e.g. Delhivery, BlueDart"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Tracking ID</label>
                <input
                  type="text"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-purple-500"
                />
              </div>
              <div className="flex gap-4 justify-center pt-6">
                <button
                  onClick={handleSubmitShipping}
                  disabled={initiatingShipping}
                  className="px-8 py-4 bg-purple-600 text-white text-xl font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {initiatingShipping ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Initiating...
                    </span>
                  ) : "Submit Shipping"}
                </button>
                <button
                  onClick={() => {
                    setShowShippingForm(false);
                    setCarrierName("");
                    setTrackingId("");
                  }}
                  className="px-8 py-4 bg-gray-500 text-white text-xl font-bold rounded-xl hover:bg-gray-600"
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

              <div className="p-8 border-t-4 border-gray-300 flex justify-end">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="px-10 py-4 bg-[#586330] text-white text-xl font-bold rounded-xl hover:bg-[#586330]/90 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmed Modal with Vendor Payment Tab */}
        {showConfirmedModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-10 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-4xl font-bold text-gray-900">Order {selectedOrder.Id} - Confirmed</h3>
                  <button onClick={() => setShowConfirmedModal(false)} className="text-4xl text-gray-500 hover:text-gray-700">×</button>
                </div>

                <div className="mt-8 flex border-b border-gray-200">
                  <button
                    onClick={() => setConfirmedActiveTab("details")}
                    className={`px-8 py-4 text-lg font-medium transition ${confirmedActiveTab === "details" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    Order Details
                  </button>
                  <button
                    onClick={() => setConfirmedActiveTab("vendor-payment")}
                    className={`px-8 py-4 text-lg font-medium transition ${confirmedActiveTab === "vendor-payment" ? "border-b-4 border-green-600 text-green-600" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    <DollarSign size={20} className="inline mr-2" />
                    Vendor Payment
                  </button>
                </div>
              </div>

              <div className="p-10 space-y-10">
                {confirmedActiveTab === "details" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-blue-50 p-8 rounded-2xl text-center border border-blue-200">
                        <p className="text-lg font-medium">Confirmation Status</p>
                        <p className="text-3xl font-bold mt-4 text-blue-900">Confirmed</p>
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
                        <div><p className="text-gray-600">Order ID</p><p className="text-xl font-bold">{selectedOrder.Id}</p></div>
                        <div><p className="text-gray-600">Total Amount</p><p className="text-2xl font-bold text-[#586330]">₹{selectedOrder.TotalAmount?.toFixed(2)}</p></div>
                        <div><p className="text-gray-600">Delivered On</p><p className="text-lg">{formatDate(selectedOrder.DeliveredDate)}</p></div>
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
                              <p className="text-xl font-bold text-[#586330]">₹{(item.Quantity * item.Price).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-2xl">
                      <h4 className="text-xl font-bold mb-3">✅ Order Confirmed</h4>
                      <p className="text-lg">
                        Customer has accepted the order (active confirmation or return window expired).
                      </p>
                    </div>
                  </>
                )}

                {confirmedActiveTab === "vendor-payment" && (
                  <div className="max-w-3xl mx-auto">
                    <h3 className="text-3xl font-bold text-green-900 mb-10 text-center">
                      <DollarSign size={40} className="inline mr-3" />
                      Vendor Payout
                    </h3>

                    {selectedOrder.VendorPaymentStatus === "Paid" ? (
                      <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-12 text-center">
                        <CheckCircle size={100} className="mx-auto text-green-600 mb-6" />
                        <h4 className="text-3xl font-bold text-green-900 mb-6">Vendor Payment Completed</h4>
                        <div className="space-y-4 text-xl">
                          <p>Paid to Vendor: <strong className="text-green-800">
                            ₹{parseFloat(selectedOrder.VendorPayoutAmount || 0).toFixed(2)}
                          </strong></p>
                          <p>Platform Commission: <strong className="text-orange-800">
                            ₹{parseFloat(selectedOrder.CommissionAmount || 0).toFixed(2)}
                          </strong></p>
                          {selectedOrder.VendorPayoutDate && (
                            <p className="text-gray-600">
                              Paid on: {new Date(selectedOrder.VendorPayoutDate).toLocaleDateString("en-IN")}
                            </p>
                          )}
                        </div>
                        <p className="text-gray-600 mt-8">This order has been fully settled.</p>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-10">
                        <div className="space-y-8 text-center">
                          <div>
                            <p className="text-2xl text-gray-700 mb-2">Total Order Amount</p>
                            <p className="text-5xl font-bold text-[#586330]">₹{selectedOrder.TotalAmount?.toFixed(2)}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-8 my-10">
                            <div className="bg-orange-100 p-6 rounded-xl border-2 border-orange-300">
                              <p className="text-xl text-orange-700 mb-2">Platform Commission (20%)</p>
                              <p className="text-4xl font-bold text-orange-800">₹{(selectedOrder.TotalAmount * 0.2).toFixed(2)}</p>
                            </div>
                            <div className="bg-green-100 p-6 rounded-xl border-2 border-green-300">
                              <p className="text-xl text-green-700 mb-2">Vendor Payout (80%)</p>
                              <p className="text-4xl font-bold text-green-800">₹{(selectedOrder.TotalAmount * 0.8).toFixed(2)}</p>
                            </div>
                          </div>

                          <button
                            onClick={handlePayVendor}
                            disabled={processingVendorPayment}
                            className="px-10 py-5 bg-green-600 text-white text-2xl font-bold rounded-xl hover:bg-green-700 transition flex items-center gap-4 mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          >
                            {processingVendorPayment ? (
                              <>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <DollarSign size={32} />
                                Pay Vendor Now (80%)
                              </>
                            )}
                          </button>

                          <p className="text-gray-600 mt-6 text-lg">
                            This will transfer the vendor's share and mark the payment as completed.
                          </p>
                        </div>
                      </div>
                    )}
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

      <ToastContainer position="top-right" autoClose={8000} theme="light" />
    </>
  );
}