import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Package } from "lucide-react";

export default function ConfirmedOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  useEffect(() => {
    fetchConfirmedOrders();
  }, []);

  const fetchConfirmedOrders = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get("/Order/customer/orders");
      const allOrders = res.data.orders || [];

      // ✅ CORRECT FILTER
      const confirmedOrders = allOrders.filter(
        o => o.ConfirmationStatus === "Confirmed"
      );

      // Attach product images (same logic as your main component)
      const enrichedOrders = await Promise.all(
        confirmedOrders.map(async (order) => {
          const updatedItems = await Promise.all(
            (order.Items || []).map(async (item) => {
              try {
                const prodRes = await axiosInstance.get(`/Product/${item.ProductId}`);
                const prod = prodRes.data;
                const img =
                  prod.Images?.find(i => i.IsPrimary) || prod.Images?.[0];
                return { ...item, Image: img?.ImageUrl || null };
              } catch {
                return { ...item, Image: null };
              }
            })
          );
          return { ...order, Items: updatedItems };
        })
      );

      setOrders(enrichedOrders);
    } catch (error) {
      console.error(error);
      alert("Failed to load confirmed orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "N/A";

  const getStatusColor = () =>
    "bg-purple-100 text-purple-800";

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
        <p className="mt-4 text-xl text-gray-600">Loading confirmed orders...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-3xl font-bold mb-8">Confirmed Orders</h3>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <Package size={80} className="mx-auto text-gray-400 mb-6" />
          <p className="text-2xl text-gray-600">No confirmed orders</p>
        </div>
      ) : (
        <div className="space-y-10">
          {orders.map(order => (
            <div
              key={order.Id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-8 border-b border-gray-300">
                <div className="flex justify-between">
                  <div>
                    <h4 className="text-2xl font-bold">Order #{order.Id}</h4>
                    <p className="mt-2 text-gray-600">
                      Placed: {formatDate(order.CreatedOn)}
                    </p>
                    <p className="mt-1 text-gray-600">
                      Delivered: {formatDate(order.DeliveredDate)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#586330]">
                      ₹{order.TotalAmount?.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block mt-3 px-6 py-2 rounded-full font-bold ${getStatusColor()}`}
                    >
                      Confirmed
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {(order.Items || []).slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                      <img
                        src={item.Image || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                        className="w-20 h-20 rounded object-cover border"
                        alt={item.ProductName}
                        onError={(e) =>
                          (e.target.src =
                            "https://cdn-icons-png.flaticon.com/512/847/847969.png")
                        }
                      />
                      <div>
                        <p className="font-semibold">{item.ProductName}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.Quantity} × ₹{item.Price?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
