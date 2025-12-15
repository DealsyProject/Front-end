import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Clock, AlertCircle, Package, IndianRupee } from "lucide-react";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  // Return form state
  const [returningOrderId, setReturningOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState("");

  useEffect(() => {
    fetchOrdersAndReturns();
  }, []);

  const fetchOrdersAndReturns = async () => {
    try {
      setLoading(true);

      // Fetch orders (includes return fields if exists)
      const ordersRes = await axiosInstance.get('/Order/customer/orders');
      const ordersData = ordersRes.data.orders || [];

      // Fetch full return requests for Returns tab
      const returnsRes = await axiosInstance.get('/Order/return/customer');
      const returnsData = returnsRes.data.returns || [];

      // Enhance orders with product images
      const updatedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const updatedItems = await Promise.all(
            (order.Items || []).map(async (item) => {
              try {
                const prodRes = await axiosInstance.get(`/Product/${item.ProductId}`);
                const prod = prodRes.data;
                const primaryImage = prod.Images?.find(img => img.IsPrimary) || prod.Images?.[0];
                return { ...item, Image: primaryImage?.ImageUrl || null };
              } catch {
                return { ...item, Image: null };
              }
            })
          );
          return { ...order, Items: updatedItems };
        })
      );

      setOrders(updatedOrders);
      setReturns(returnsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load orders and returns.");
    } finally {
      setLoading(false);
    }
  };

  // Return allowed only if: Delivered + within 1 hour + not already returned
  const canReturnOrder = (order) => {
    if (!order) return false;
    if (order.Status?.toLowerCase() !== "delivered") return false;
    if (order.ConfirmationStatus === "Returned" || order.ConfirmationStatus === "Expired") return false;
    if (!order.DeliveredDate) return false;

    const delivered = new Date(order.DeliveredDate);
    const now = new Date();
    const hoursDiff = (now - delivered) / (1000 * 60 * 60);
    return hoursDiff >= 0 && hoursDiff <= 1;
  };

  const handleReturnRequest = async () => {
    if (!returnReason.trim()) {
      alert("Please select a reason for return.");
      return;
    }

    if (!window.confirm("Submit return request for this order?")) return;

    try {
      const order = orders.find(o => o.Id === returningOrderId);
      if (!order) throw new Error("Order not found");

      const items = order.Items.map(item => ({
        ProductId: item.ProductId,
        Quantity: item.Quantity,
        Price: item.Price
      }));

      await axiosInstance.post("/Order/return/create", {
        OrderId: returningOrderId,
        Reason: returnReason,
        Items: items
      });

      alert("Return request submitted successfully!");
      setReturningOrderId(null);
      setReturnReason("");
      fetchOrdersAndReturns(); // Refresh to show "Returned" status
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit return request.");
    }
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const s = status.toLowerCase();
    if (s === "delivered") return "bg-green-100 text-green-800";
    if (s === "shipped") return "bg-blue-100 text-blue-800";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "returned") return "bg-red-100 text-red-800";
    if (s === "confirmed" || s === "expired") return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
        <p className="mt-4 text-xl text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-3xl font-bold mb-8">My Orders & Returns</h3>

      {/* Tabs */}
      <div className="flex gap-8 mb-8 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-4 px-2 font-semibold text-lg border-b-4 transition-colors ${
            activeTab === "orders"
              ? "text-[#586330] border-[#586330]"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("returns")}
          className={`pb-4 px-2 font-semibold text-lg border-b-4 transition-colors ${
            activeTab === "returns"
              ? "text-[#586330] border-[#586330]"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          Return Requests ({returns.length})
        </button>
      </div>

      {/* Return Policy Alert */}
      <div className="mb-8 p-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={28} />
          <div>
            <p className="font-bold text-amber-900 text-lg">Return Policy</p>
            <p className="text-amber-800 mt-2">
              You can request a return <strong>only within 1 hour</strong> after delivery.
              Once submitted, the order status will change to <strong>"Returned"</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <>
          {orders.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl">
              <Package size={80} className="mx-auto text-gray-400 mb-6" />
              <p className="text-2xl text-gray-600">No orders yet</p>
              <p className="text-gray-500 mt-3">Your placed orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-10">
              {orders.map((order) => {
                const isReturnEligible = canReturnOrder(order);
                const isReturned = order.ConfirmationStatus === "Returned";

                return (
                  <div
                    key={order.Id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 border-b border-gray-300">
                      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        <div>
                          <h4 className="text-2xl font-bold text-gray-900">Order #{order.Id}</h4>
                          <div className="mt-4 space-y-2 text-gray-600">
                            <p>Placed: {formatDate(order.CreatedOn)}</p>
                            {order.DeliveredDate && (
                              <p>Delivered: {formatDate(order.DeliveredDate)}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-3xl font-bold text-[#586330]">
                            ₹{order.TotalAmount?.toFixed(2)}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3 justify-end">
                            <span className={`px-6 py-2 rounded-full font-medium ${getStatusColor(order.OrderStatus)}`}>
                              {order.OrderStatus || order.Status}
                            </span>
                            <span className={`px-6 py-2 rounded-full font-medium ${getStatusColor(order.ConfirmationStatus)}`}>
                              {order.ConfirmationStatus}
                            </span>
                          </div>

                          {/* Return Window Indicator */}
                          {order.Status?.toLowerCase() === "delivered" && (
                            <div className="mt-4 text-lg">
                              {isReturnEligible ? (
                                <div className="flex items-center justify-end gap-2 text-green-600 font-bold">
                                  <Clock size={20} />
                                  Return window open
                                </div>
                              ) : isReturned ? (
                                <div className="flex items-center justify-end gap-2 text-red-600 font-bold">
                                  <AlertCircle size={20} />
                                  Return Requested
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2 text-gray-600">
                                  <AlertCircle size={20} />
                                  Return window expired
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items & Actions */}
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {(order.Items || []).slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                            <img
                              src={item.Image || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                              alt={item.ProductName}
                              className="w-20 h-20 rounded object-cover border"
                              onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.ProductName}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Qty: {item.Quantity} × ₹{item.Price?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="px-6 py-3 bg-[#586330] text-white rounded-lg hover:bg-[#586330]/90 font-medium transition flex items-center gap-2"
                        >
                          View Full Details
                        </button>

                        {/* Return Form */}
                        {isReturnEligible && !isReturned && (
                          <div className="max-w-md">
                            {returningOrderId === order.Id ? (
                              <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
                                <h4 className="font-bold text-red-900 mb-4">Request Return</h4>
                                <select
                                  value={returnReason}
                                  onChange={(e) => setReturnReason(e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                  <option value="">-- Select Reason --</option>
                                  <option value="Damaged product">Damaged product</option>
                                  <option value="Wrong item received">Wrong item received</option>
                                  <option value="Defective item">Defective item</option>
                                  <option value="Does not match description">Does not match description</option>
                                  <option value="Changed my mind">Changed my mind</option>
                                  <option value="Other">Other</option>
                                </select>

                                <div className="flex gap-3">
                                  <button
                                    onClick={handleReturnRequest}
                                    disabled={!returnReason}
                                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition"
                                  >
                                    Submit Return
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReturningOrderId(null);
                                      setReturnReason("");
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 font-medium transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReturningOrderId(order.Id)}
                                className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-lg transition shadow-lg"
                              >
                                Return This Order
                              </button>
                            )}
                          </div>
                        )}

                        {/* Already Returned */}
                        {isReturned && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">Return Requested</p>
                            <p className="text-gray-600 mt-2">Admin is reviewing your request</p>
                          </div>
                        )}

                        {/* Expired */}
                        {!isReturnEligible && !isReturned && order.Status?.toLowerCase() === "delivered" && (
                          <div className="text-right">
                            <p className="text-xl font-semibold text-gray-500">Return Window Closed</p>
                            <p className="text-gray-500">More than 1 hour since delivery</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Returns Tab */}
      {activeTab === "returns" && (
        <div>
          {returns.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-xl">
              <Package size={80} className="mx-auto text-gray-400 mb-6" />
              <p className="text-2xl text-gray-600">No return requests</p>
              <p className="text-gray-500 mt-3">Your return requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-8">
              {returns.map((ret) => (
                <div key={ret.ReturnId} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-bold">
                        Return Request #{ret.ReturnId} → {ret.OrderNumber}
                      </h4>
                      <p className="text-gray-600 mt-2">Requested on: {formatDate(ret.ReturnDate)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-6 py-3 rounded-full font-bold text-lg ${getStatusColor(ret.Status)}`}>
                        {ret.Status}
                      </span>
                      <p className="mt-4 text-3xl font-bold text-red-600">
                        ₹{ret.RefundAmount?.toFixed(2)}
                      </p>
                      <p className="text-gray-600">Refund Amount</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg mb-6">
                    <p className="font-semibold text-red-900">Reason:</p>
                    <p className="text-lg italic mt-2">"{ret.Reason}"</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-xl mb-4">Returned Items</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {ret.Items.map((item, i) => (
                        <div key={i} className="bg-gray-50 p-4 rounded-lg border">
                          <p className="font-semibold">{item.ProductName}</p>
                          <p className="text-gray-600 mt-2">
                            Qty: {item.Quantity} × ₹{item.Price.toFixed(2)}
                          </p>
                          <p className="text-right font-bold text-xl mt-3">
                            ₹{(item.Quantity * item.Price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {ret.TrackingId && (
                    <div className="mt-8 bg-purple-50 p-6 rounded-xl">
                      <h5 className="font-bold text-xl mb-3">Pickup Scheduled</h5>
                      <p><strong>Carrier:</strong> {ret.CarrierName}</p>
                      <p><strong>Tracking ID:</strong> <span className="font-mono bg-white px-3 py-1 rounded">{ret.TrackingId}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Order Details #{selectedOrder.Id}</h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-4xl text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-600">Order Date</p>
                  <p className="text-xl font-bold">{formatDate(selectedOrder.CreatedOn)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-600">Status</p>
                  <span className={`inline-block px-6 py-2 rounded-full font-bold mt-2 ${getStatusColor(selectedOrder.OrderStatus)}`}>
                    {selectedOrder.OrderStatus || selectedOrder.Status}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-600">Confirmation</p>
                  <span className={`inline-block px-6 py-2 rounded-full font-bold mt-2 ${getStatusColor(selectedOrder.ConfirmationStatus)}`}>
                    {selectedOrder.ConfirmationStatus}
                  </span>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-gray-600">Total Amount</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{selectedOrder.TotalAmount?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-6">Items</h3>
                <div className="space-y-6">
                  {selectedOrder.Items?.map((item, i) => (
                    <div key={i} className="flex gap-6 p-6 bg-gray-50 rounded-xl">
                      <img
                        src={item.Image || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                        alt={item.ProductName}
                        className="w-32 h-32 rounded-xl object-cover border"
                        onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                      />
                      <div className="flex-1">
                        <h4 className="text-xl font-bold">{item.ProductName}</h4>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-lg">
                          <div>
                            <p className="text-gray-600">Quantity</p>
                            <p className="font-bold">{item.Quantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Unit Price</p>
                            <p className="font-bold">₹{item.Price?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="font-bold text-2xl text-[#586330]">
                              ₹{(item.Quantity * item.Price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Show Return Info if exists */}
              {selectedOrder.ReturnId && (
                <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                  <h3 className="text-2xl font-bold text-red-900 mb-4">Return Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-700">Return Status:</p>
                      <span className={`inline-block px-4 py-2 rounded-full font-bold mt-2 ${getStatusColor(selectedOrder.Status)}`}>
                        {selectedOrder.Status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-700">Refund Status:</p>
                      <span className="inline-block px-4 py-2 rounded-full font-bold mt-2 bg-yellow-100 text-yellow-800">
                        {selectedOrder.RefundStatus || "Pending"}
                      </span>
                    </div>
                    {selectedOrder.Reason && (
                      <div className="col-span-2">
                        <p className="text-gray-700">Reason:</p>
                        <p className="mt-2 italic text-red-800">"{selectedOrder.Reason}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowOrderDetails(false)}
                className="w-full py-4 bg-[#586330] text-white text-xl font-bold rounded-xl hover:bg-[#586330]/90 transition"
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