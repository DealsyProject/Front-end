import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Package, CheckCircle } from "lucide-react";

export default function ConfirmedReturns() {
  const [confirmedReturns, setConfirmedReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfirmedReturns();
  }, []);

  const fetchConfirmedReturns = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get("/Order/return/customer");

      const confirmed = (res.data.returns || []).filter(
        (ret) => ret.Status?.toLowerCase() === "confirmed"
      );

      setConfirmedReturns(confirmed);
    } catch (error) {
      console.error(error);
      alert("Failed to load confirmed returns.");
    } finally {
      setLoading(false);
    }
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

  const getStatusColor = () => {
    return "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
        <p className="mt-4 text-xl text-gray-600">Loading confirmed returns...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <CheckCircle className="text-green-600" size={32} />
        Confirmed Returns
      </h3>

      {confirmedReturns.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <Package size={80} className="mx-auto text-gray-400 mb-6" />
          <p className="text-2xl text-gray-600">No confirmed returns</p>
          <p className="text-gray-500 mt-3">
            Confirmed returns will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {confirmedReturns.map((ret) => (
            <div
              key={ret.ReturnId}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-2xl font-bold">
                    Return #{ret.ReturnId} → Order #{ret.OrderNumber}
                  </h4>
                  <p className="text-gray-600 mt-2">
                    Confirmed on: {formatDate(ret.ConfirmedDate || ret.ReturnDate)}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`px-6 py-3 rounded-full font-bold text-lg ${getStatusColor()}`}
                  >
                    {ret.Status}
                  </span>
                  <p className="mt-4 text-3xl font-bold text-green-600">
                    ₹{ret.RefundAmount?.toFixed(2)}
                  </p>
                  <p className="text-gray-600">Refunded Amount</p>
                </div>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-6">
                <p className="font-semibold text-green-900">Return Reason:</p>
                <p className="text-lg italic mt-2">"{ret.Reason}"</p>
              </div>

              <div>
                <h5 className="font-bold text-xl mb-4">Returned Items</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ret.Items.map((item, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
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
                  <h5 className="font-bold text-xl mb-3">Pickup Details</h5>
                  <p>
                    <strong>Carrier:</strong> {ret.CarrierName}
                  </p>
                  <p>
                    <strong>Tracking ID:</strong>{" "}
                    <span className="font-mono bg-white px-3 py-1 rounded">
                      {ret.TrackingId}
                    </span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
