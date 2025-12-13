import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReturnBox, setShowReturnBox] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    fetchOrdersAndReturns();
  }, []);

  const fetchOrdersAndReturns = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersRes = await axiosInstance.get('/order/customer/orders');
      let ordersData = ordersRes.data.orders || [];

      // Fetch returns
      const returnsRes = await axiosInstance.get('/order/return/customer');
      setReturns(returnsRes.data.returns || []);

      // Loop orders → loop items → fetch product image
      const updatedOrders = await Promise.all(
        ordersData.map(async (order) => {
          const updatedItems = await Promise.all(
            order.Items.map(async (item) => {
              try {
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
      console.error("Error fetching data:", error);
      alert("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const canReturnOrder = (deliveryDate, orderStatus) => {
    if (orderStatus?.toLowerCase() !== "delivered") return false;
    if (!deliveryDate) return false;

    const deliveredDate = new Date(deliveryDate);
    const currentDate = new Date();
    const diffTime = currentDate - deliveredDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  };

  const getDaysLeftForReturn = (deliveryDate) => {
    if (!deliveryDate) return { daysLeft: 0, isFuture: false };

    const deliveredDate = new Date(deliveryDate);
    const currentDate = new Date();
    const diffTime = deliveredDate - currentDate;

    if (diffTime > 0) {
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { daysLeft: diffDays, isFuture: true };
    }

    const daysPassed = Math.abs(Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const daysLeft = 2 - daysPassed;
    return { daysLeft: daysLeft >= 0 ? daysLeft : 0, isFuture: false };
  };

  const handleReturn = async (orderId) => {
    if (!returnReason) {
      alert("Please select a return reason");
      return;
    }

    if (!window.confirm("Are you sure you want to request a return?")) return;

    try {
      const order = orders.find(o => o.Id === orderId);
      if (!order) {
        alert("Order not found");
        return;
      }

      const items = order.Items.map(item => ({
        productId: item.ProductId,
        quantity: item.Quantity,
        price: item.Price
      })) || [];

      const response = await axiosInstance.post("/order/return/create", {
        orderId,
        reason: returnReason,
        items: items
      });

      alert(response.data.message || "Return request submitted successfully!");

      setShowReturnBox(null);
      setReturnReason("");
      fetchOrdersAndReturns();
    } catch (error) {
      console.error("Return request error:", error);
      alert(error.response?.data?.message || "Failed to request return. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getReturnStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return "bg-purple-100 text-purple-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const closeOrderDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const renderReturnStatus = (order) => {
    const status = order.Status?.toLowerCase();
    if (status !== "delivered") return null;

    const canReturn = canReturnOrder(order.DeliveredDate, order.Status);
    const daysInfo = getDaysLeftForReturn(order.DeliveredDate);

    if (canReturn) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
          <Clock size={14} />
          <span>Return window: {daysInfo.daysLeft} day{daysInfo.daysLeft !== 1 ? 's' : ''} left</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
          <AlertCircle size={14} />
          <span>Return window expired</span>
        </div>
      );
    }
  };

  if (loading) return <p className="text-center py-10">Loading Orders...</p>;

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6">My Orders & Returns</h3>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === "orders"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab("returns")}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === "returns"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Returns ({returns.length})
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-0.5" size={18} />
              <div>
                <p className="font-medium text-yellow-800">Return Policy</p>
                <p className="text-sm text-yellow-700">
                  Returns are only accepted within 2 days of delivery. Please ensure you initiate the return process before the deadline.
                </p>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-500">You have not placed any orders.</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const canReturn = canReturnOrder(order.DeliveredDate, order.Status);
                return (
                  <div key={order.Id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <div className="border-b border-gray-200 p-6 flex justify-between">
                      <div>
                        <h3 className="font-semibold">Order #{order.Id}</h3>
                        <p className="text-sm text-gray-500">Placed on {formatDate(order.CreatedOn)}</p>
                        {order.DeliveredDate && (
                          <p className="text-sm text-gray-500">Delivered on: {formatDate(order.DeliveredDate)}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.Status)}`}>
                          {order.Status}
                        </span>
                        {order.Status?.toLowerCase() === "delivered" && renderReturnStatus(order)}
                      </div>
                    </div>

                    <div className="p-6">
                      {order.Items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 mb-3">
                          <img
                            src={item.Image}
                            alt=""
                            className="w-16 h-16 rounded object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.ProductName}</p>
                            <p className="text-sm text-gray-500">Qty: {item.Quantity} × ₹{item.Price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-between items-center mt-4">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="text-[#586330] hover:underline text-sm font-medium"
                        >
                          View Details →
                        </button>

                        {order.Status?.toLowerCase() === "delivered" && (
                          <div>
                            {canReturn ? (
                              <div>
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
                                      <option value="Wrong item received">Wrong item received</option>
                                      <option value="Product defective">Product defective</option>
                                      <option value="Changed my mind">Changed my mind</option>
                                    </select>

                                    <div className="mt-3 flex gap-2">
                                      <button
                                        onClick={() => handleReturn(order.Id)}
                                        disabled={!returnReason}
                                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
                                      >
                                        Confirm Return
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowReturnBox(null);
                                          setReturnReason("");
                                        }}
                                        className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                disabled
                                className="px-4 py-2 text-sm font-medium bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                                title="Return window expired (2 days after delivery)"
                              >
                                Return Expired
                              </button>
                            )}
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
        <>
          {returns.length === 0 ? (
            <p className="text-gray-500">You have no return requests yet.</p>
          ) : (
            <div className="space-y-6">
              {returns.map((ret) => (
                <div key={ret.ReturnId} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                  <div className="border-b border-gray-200 p-6 flex justify-between">
                    <div>
                      <h3 className="font-semibold">{ret.OrderNumber}</h3>
                      <p className="text-sm text-gray-500">Return Date: {formatDate(ret.ReturnDate)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReturnStatusColor(ret.Status)}`}>
                        {ret.Status}
                      </span>
                      {ret.RefundStatus && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${ret.RefundStatus?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          Refund: {ret.RefundStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {ret.Reason}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Refund Amount:</span> ₹{ret.RefundAmount?.toFixed(2)}
                      </p>
                    </div>

                    {ret.TrackingId && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-purple-900">Shipping Information:</p>
                        <p className="text-sm text-gray-700">Carrier: {ret.CarrierName}</p>
                        <p className="text-sm text-gray-700">Tracking: {ret.TrackingId}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg p-6">
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

            <div className="pt-6">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <div><span className="font-medium">Order Date:</span> {formatDate(selectedOrder.CreatedOn)}</div>
                {selectedOrder.DeliveredDate && (
                  <div><span className="font-medium">Delivery Date:</span> {formatDate(selectedOrder.DeliveredDate)}</div>
                )}
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.Status)}`}>
                    {selectedOrder.Status}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.Items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.Image}
                      alt={item.ProductName}
                      className="w-20 h-20 object-cover rounded border"
                      onError={(e) => {
                        e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                      }}
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

            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">
                    ₹{selectedOrder.Items.reduce((sum, i) => sum + (i.Price * i.Quantity), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="text-[#586330]">₹{selectedOrder.TotalAmount?.toFixed(2) || "0.00"}</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-900">
                {selectedOrder.ShippingAddress || "No shipping address provided"}
              </div>
            </div>

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