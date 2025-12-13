import React, { useState, useEffect } from "react";
import { Search, Trash2, Eye, DollarSign, CheckCircle, Clock, Mail, ExternalLink, Truck, Package, User, Phone, MapPin, Calendar, Info, X, Percent } from 'lucide-react';
import Navbar from '../../Components/Admin/Navbar'

export default function ProductReturnPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewItem, setViewItem] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [toast, setToast] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [editingReturn, setEditingReturn] = useState(null);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    trackingId: "", carrier: "", shippingMethod: "standard", shippingCost: "",
    estimatedDelivery: "", returnReason: "", notes: ""
  });

  const COMMISSION_RATE = 0.20; // 20% commission to admin

  useEffect(() => {
    fetchReturns();
    // Check for expired returns every minute
    const interval = setInterval(checkExpiredReturns, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkExpiredReturns = () => {
    setReturns(prevReturns => {
      return prevReturns.map(returnItem => {
        const returnDate = new Date(returnItem.returnRequestDate);
        const expiryDate = new Date(returnDate);
        expiryDate.setDate(expiryDate.getDate() + 2); // 2-day return window
        
        if (new Date() > expiryDate && returnItem.status === "Pending") {
          return {
            ...returnItem,
            status: "Confirmed",
            isReturnExpired: true,
            expiryDate: expiryDate.toISOString().split('T')[0]
          };
        }
        return returnItem;
      });
    });
  };

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const dummyReturns = getDummyReturns();
      // Initialize with expiry check and commission calculations
      const returnsWithExpiry = dummyReturns.map(returnItem => {
        const returnDate = new Date(returnItem.returnRequestDate);
        const expiryDate = new Date(returnDate);
        expiryDate.setDate(expiryDate.getDate() + 2);
        
        const isExpired = new Date() > expiryDate && returnItem.status === "Pending";
        
        // Calculate commission and vendor payment amounts
        const commissionAmount = returnItem.purchasePrice * COMMISSION_RATE;
        const vendorAmount = returnItem.purchasePrice * (1 - COMMISSION_RATE);
        
        return {
          ...returnItem,
          isReturnExpired: isExpired,
          expiryDate: expiryDate.toISOString().split('T')[0],
          status: isExpired ? "Confirmed" : returnItem.status,
          vendorPaymentStatus: returnItem.vendorPaymentStatus || "Pending",
          commissionAmount,
          vendorAmount,
          adminAmount: commissionAmount
        };
      });
      setReturns(returnsWithExpiry);
    } catch (error) {
      console.error("Error fetching returns:", error);
      setReturns(getDummyReturns());
    } finally {
      setLoading(false);
    }
  };

  const getDummyReturns = () => [
    {
      id: 1,
      orderId: "ORD-2025-001",
      product: "Wireless Keyboard",
      customer: "John Doe",
      email: "john@example.com",
      reason: "Defective",
      returnDate: new Date().toISOString().split('T')[0],
      orderDate: "2025-10-20",
      deliveryDate: "2025-10-27",
      purchasePrice: 49.99,
      refundAmount: 0,
      status: "Pending",
      quantity: 1,
      condition: "Used",
      description: "Keys not working properly",
      customerId: "CUST-001",
      productId: "PROD-001",
      returnRequestDate: "2025-10-28",
      isWithinReturnWindow: true,
      vendor: {
        id: "VEND-001",
        name: "TechGadgets Inc.",
        email: "vendor@techgadgets.com",
        phone: "+1 (555) 123-4567",
        address: "123 Tech Street, San Francisco, CA 94107",
        contactPerson: "Michael Chen",
        rating: 4.8,
        totalSales: 1245,
        paymentStatus: "Pending",
        bankDetails: {
          accountName: "TechGadgets Inc.",
          accountNumber: "XXXX-XXXX-7890",
          bankName: "Chase Bank",
          routingNumber: "021000021"
        }
      },
      shippingStatus: "Not Initiated",
      vendorPaymentStatus: "Pending"
    },
    {
      id: 2,
      orderId: "ORD-2025-002",
      product: "Gaming Mouse Pad",
      customer: "Sarah Lee",
      email: "sarah@example.com",
      reason: "Wrong Item",
      returnDate: "2025-10-27",
      orderDate: "2025-10-18",
      deliveryDate: "2025-10-25",
      purchasePrice: 24.99,
      refundAmount: 24.99,
      status: "Refunded",
      quantity: 1,
      condition: "Unopened",
      description: "Received wrong color",
      customerId: "CUST-002",
      productId: "PROD-002",
      returnRequestDate: "2025-10-26",
      isWithinReturnWindow: true,
      vendor: {
        id: "VEND-002",
        name: "Gaming Gear Pro",
        email: "sales@gaminggearpro.com",
        phone: "+1 (555) 987-6543",
        address: "456 Gaming Ave, Los Angeles, CA 90001",
        contactPerson: "Alex Rodriguez",
        rating: 4.6,
        totalSales: 892,
        paymentStatus: "Paid",
        bankDetails: {
          accountName: "Gaming Gear Pro",
          accountNumber: "XXXX-XXXX-4567",
          bankName: "Bank of America",
          routingNumber: "026009593"
        }
      },
      shippingStatus: "Returned to Vendor",
      shippingInfo: {
        trackingId: "TRK789012345",
        carrier: "FedEx",
        shippingMethod: "express",
        shippingCost: 8.99,
        estimatedDelivery: "2025-11-05",
        returnReason: "Wrong color received",
        notes: "Customer requested black, received blue"
      },
      vendorPaymentStatus: "Paid"
    },
    {
      id: 3,
      orderId: "ORD-2025-003",
      product: "Bluetooth Headphones",
      customer: "Robert Wilson",
      email: "robert@example.com",
      reason: "Damaged",
      returnDate: "2025-10-20",
      orderDate: "2025-10-15",
      deliveryDate: "2025-10-18",
      purchasePrice: 89.99,
      refundAmount: 0,
      status: "Confirmed", // Expired return
      quantity: 1,
      condition: "Used",
      description: "Damaged during delivery",
      customerId: "CUST-003",
      productId: "PROD-003",
      returnRequestDate: "2025-10-19",
      isWithinReturnWindow: false,
      isReturnExpired: true,
      expiryDate: "2025-10-21",
      vendor: {
        id: "VEND-003",
        name: "AudioTech Solutions",
        email: "support@audiotech.com",
        phone: "+1 (555) 456-7890",
        address: "789 Sound Ave, New York, NY 10001",
        contactPerson: "David Miller",
        rating: 4.9,
        totalSales: 2100,
        paymentStatus: "Pending",
        bankDetails: {
          accountName: "AudioTech Solutions",
          accountNumber: "XXXX-XXXX-1234",
          bankName: "Wells Fargo",
          routingNumber: "121000248"
        }
      },
      shippingStatus: "Not Eligible",
      vendorPaymentStatus: "Pending"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Refunded': return 'text-green-700 bg-green-100 border border-green-200';
      case 'Pending': return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'Confirmed': return 'text-purple-700 bg-purple-100 border border-purple-200';
      case 'Partial Refund': return 'text-blue-700 bg-blue-100 border border-blue-200';
      case 'Rejected': return 'text-red-700 bg-red-100 border border-red-200';
      case 'Expired': return 'text-gray-700 bg-gray-100 border border-gray-200';
      default: return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  const getShippingStatusColor = (status) => {
    switch (status) {
      case 'Returned to Vendor': return 'text-green-700 bg-green-100 border border-green-200';
      case 'In Transit': return 'text-blue-700 bg-blue-100 border border-blue-200';
      case 'Pickup Scheduled': return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'Not Initiated': return 'text-gray-700 bg-gray-100 border border-gray-200';
      case 'Not Eligible': return 'text-red-700 bg-red-100 border border-red-200';
      default: return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'Defective': return 'text-red-700 bg-red-100 border border-red-200';
      case 'Damaged': return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'Wrong Item': return 'text-blue-700 bg-blue-100 border border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border border-gray-200';
    }
  };

  const handleRefundUpdate = (id) => {
    if (!refundAmount || isNaN(refundAmount) || refundAmount < 0) {
      showToast("⚠️ Please enter a valid refund amount!");
      return;
    }
    const amount = parseFloat(refundAmount);
    const returnItem = returns.find(r => r.id === id);
    let status = "Partial Refund";
    if (amount === 0) {
      status = "Rejected";
    } else if (amount >= returnItem.purchasePrice) {
      status = "Refunded";
    }
    
    setReturns(returns.map(item => {
      if (item.id === id) {
        return { ...item, refundAmount: amount, status: status };
      }
      return item;
    }));
    showToast(`✅ Refund amount updated to ₹${refundAmount}`);
    setRefundAmount("");
    setEditingReturn(null);
  };

  const handleVendorPayment = (id) => {
    const returnItem = returns.find(r => r.id === id);
    const commissionAmount = returnItem.purchasePrice * COMMISSION_RATE;
    const vendorAmount = returnItem.purchasePrice * (1 - COMMISSION_RATE);
    
    setReturns(returns.map(item => {
      if (item.id === id) {
        return {
          ...item,
          vendorPaymentStatus: "Paid",
          vendor: {
            ...item.vendor,
            paymentStatus: "Paid"
          },
          commissionAmount,
          vendorAmount,
          adminAmount: commissionAmount,
          paymentDate: new Date().toISOString().split('T')[0]
        };
      }
      return item;
    }));
    showToast(`✅ Vendor payment processed! Admin: ₹${commissionAmount.toFixed(2)} | Vendor: ₹${vendorAmount.toFixed(2)}`);
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    const updatedReturn = {
      ...viewItem,
      shippingStatus: "In Transit",
      shippingInfo: shippingInfo
    };
    setReturns(returns.map(r => r.id === viewItem.id ? updatedReturn : r));
    setViewItem(updatedReturn);
    setShowShippingForm(false);
    setActiveTab("details");
    setShippingInfo({
      trackingId: "", carrier: "", shippingMethod: "standard", shippingCost: "",
      estimatedDelivery: "", returnReason: "", notes: ""
    });
    showToast("✅ Return shipping initiated successfully!");
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleSendEmail = (customerEmail, customerName) => {
    const subject = encodeURIComponent(`Regarding Your Return Request`);
    const body = encodeURIComponent(`Dear ${customerName},\n\nWe are processing your return request.\n\nBest regards,\nAdmin Team`);
    window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const filteredReturns = returns.filter((r) => {
    const matchesSearch = r.product.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesReasonFilter = filter === "All" || r.reason === filter;
    const matchesStatusFilter = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesReasonFilter && matchesStatusFilter;
  });

  const totalRefunds = returns.reduce((sum, r) => sum + r.refundAmount, 0);
  const pendingReturns = returns.filter(r => r.status === "Pending").length;
  const pendingShipping = returns.filter(r => r.shippingStatus === "Pickup Scheduled" || r.shippingStatus === "Not Initiated").length;
  const confirmedReturns = returns.filter(r => r.status === "Confirmed").length;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const calculateDaysSinceDelivery = (deliveryDate) => {
    const delivery = new Date(deliveryDate);
    const today = new Date();
    const diffTime = today - delivery;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateDaysUntilExpiry = (returnRequestDate) => {
    const requestDate = new Date(returnRequestDate);
    const expiryDate = new Date(requestDate);
    expiryDate.setDate(expiryDate.getDate() + 2);
    const today = new Date();
    const diffTime = expiryDate - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading return requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="p-6 mt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Returns Management</h1>
          <p className="text-gray-600 mt-2">Manage customer returns within 2-day return window</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalRefunds.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Returns</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingReturns}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Shipping</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingShipping}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Confirmed Orders</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{confirmedReturns}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by product, customer, order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl p-3 pl-12 text-md text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none w-full shadow-md"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl p-3 text-md text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-md"
            >
              <option value="All">All Reasons</option>
              <option value="Defective">Defective</option>
              <option value="Damaged">Damaged</option>
              <option value="Wrong Item">Wrong Item</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl p-3 text-md text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-md"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Refunded">Refunded</option>
              <option value="Partial Refund">Partial Refund</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Order ID</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Product & Customer</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Return Info</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Financial</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReturns.length > 0 ? (
                  filteredReturns.map((r) => {
                    const daysSinceDelivery = calculateDaysSinceDelivery(r.deliveryDate);
                    const daysUntilExpiry = calculateDaysUntilExpiry(r.returnRequestDate);
                    const isWithinWindow = r.isWithinReturnWindow !== false;
                    
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-5 px-6">
                          <div className="font-semibold text-gray-900">{r.orderId}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Delivered: {formatDate(r.deliveryDate)}
                          </div>
                          {r.isReturnExpired && (
                            <div className="text-xs text-red-600 mt-1">
                              Expired: {formatDate(r.expiryDate)}
                            </div>
                          )}
                        </td>
                        
                        <td className="py-5 px-6">
                          <div className="font-medium text-gray-900">{r.product}</div>
                          <div className="text-sm text-gray-500 mt-1">Qty: {r.quantity}</div>
                          <div className="mt-3">
                            <div className="font-medium text-gray-900">{r.customer}</div>
                            <div className="text-sm text-gray-500">{r.email}</div>
                          </div>
                        </td>
                        
                        <td className="py-5 px-6">
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getReasonColor(r.reason)}`}>
                            {r.reason}
                          </div>
                          <div className="mt-2">
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getShippingStatusColor(r.shippingStatus)}`}>
                              {r.shippingStatus}
                            </div>
                          </div>
                          {r.status === "Pending" && (
                            <div className="mt-2 text-xs text-yellow-600">
                              <Clock className="inline w-3 h-3 mr-1" />
                              {daysUntilExpiry} days to return
                            </div>
                          )}
                        </td>
                        
                        <td className="py-5 px-6">
                          <div className="text-gray-900 font-medium">
                            Purchase Price
                            <div className="text-lg">₹{r.purchasePrice.toFixed(2)}</div>
                          </div>
                          <div className="mt-3">
                            <div className="text-gray-500 text-sm">Refund Amount</div>
                            <div className={`text-lg font-medium ${r.refundAmount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                              ₹{r.refundAmount.toFixed(2)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-5 px-6">
                          <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                            {r.status}
                          </div>
                          {r.status === "Confirmed" && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-700">
                                Vendor Payment:
                              </div>
                              <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${r.vendorPaymentStatus === "Paid" ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {r.vendorPaymentStatus}
                              </div>
                            </div>
                          )}
                        </td>
                        
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setViewItem(r);
                                setActiveTab("details");
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            
                            {r.status === "Confirmed" && r.vendorPaymentStatus === "Pending" && (
                              <button
                                onClick={() => handleVendorPayment(r.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
                              >
                               ₹ Pay Vendor
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      <div className="text-gray-500 flex flex-col items-center">
                        <Search className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg">🔍 No returns match the current criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Return Details</h2>
                <p className="text-gray-600">Order #{viewItem.orderId}</p>
              </div>
              <button
                onClick={() => {
                  setViewItem(null);
                  setActiveTab("details");
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-8">
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`pb-3 px-2 font-medium transition-colors ${
                    activeTab === "details"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Return Details
                </button>
                
                {/* Hide Shipping Info tab for Confirmed orders (has Pay Vendor button) */}
                {viewItem.status !== "Confirmed" && (
                  <button
                    onClick={() => setActiveTab("shipping")}
                    className={`pb-3 px-2 font-medium transition-colors ${
                      activeTab === "shipping"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Shipping Info
                  </button>
                )}
                
                {viewItem.status === "Confirmed" && (
                  <button
                    onClick={() => setActiveTab("vendor")}
                    className={`pb-3 px-2 font-medium transition-colors ${
                      activeTab === "vendor"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Vendor Payment
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Date:</span>
                          <span className="font-medium">{formatDate(viewItem.orderDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Date:</span>
                          <span className="font-medium">{formatDate(viewItem.deliveryDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Return Request:</span>
                          <span className="font-medium">{formatDate(viewItem.returnRequestDate)}</span>
                        </div>
                        {viewItem.expiryDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Return Expiry:</span>
                            <span className={`font-medium ${viewItem.isReturnExpired ? 'text-red-600' : 'text-green-600'}`}>
                              {formatDate(viewItem.expiryDate)}
                              {viewItem.isReturnExpired && ' (Expired)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{viewItem.customer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{viewItem.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Customer ID:</span>
                          <span className="ml-2 font-medium">{viewItem.customerId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-600">Product:</span>
                          <div className="font-medium mt-1">{viewItem.product}</div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{viewItem.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reason:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReasonColor(viewItem.reason)}`}>
                            {viewItem.reason}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Details</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <div className="font-medium">{viewItem.vendor.name}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Contact:</span>
                          <div className="font-medium">{viewItem.vendor.contactPerson}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <div className="font-medium">{viewItem.vendor.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Actions */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                      {viewItem.refundAmount > 0 && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">✓ Refund Already Processed: ₹{viewItem.refundAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Refund Amount Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Refund Amount (₹)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            disabled={viewItem.refundAmount > 0 || viewItem.status === "Confirmed"}
                            className="flex-1 border border-gray-300 rounded-lg p-3 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                            placeholder={viewItem.refundAmount > 0 ? "Refund completed" : "Enter amount"}
                            min="0"
                            max={viewItem.purchasePrice}
                            step="0.01"
                          />
                          <button
                            onClick={() => handleRefundUpdate(viewItem.id)}
                            disabled={viewItem.refundAmount > 0 || viewItem.status === "Confirmed"}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 transition-colors"
                            title={viewItem.refundAmount > 0 ? "Refund already processed" : "Process refund"}
                          >
                            <DollarSign className="w-4 h-4" /> Refund
                          </button>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Purchase Price: ₹{viewItem.purchasePrice.toFixed(2)}
                        </div>
                      </div>

                      {/* Quick Actions - Hide for Confirmed orders */}
                      {viewItem.status !== "Confirmed" && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => {
                                setRefundAmount(viewItem.purchasePrice);
                              }}
                              disabled={viewItem.refundAmount > 0 || viewItem.status === "Confirmed"}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-100 transition-colors"
                            >
                              Full Refund
                            </button>
                            <button
                              onClick={() => {
                                setRefundAmount(viewItem.purchasePrice * 0.5);
                              }}
                              disabled={viewItem.refundAmount > 0 || viewItem.status === "Confirmed"}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-100 transition-colors"
                            >
                              50% Refund
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Vendor Payment Button for Confirmed Orders */}
                      {viewItem.status === "Confirmed" && viewItem.vendorPaymentStatus === "Pending" && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h4 className="font-medium text-yellow-800 mb-2">Vendor Payment Pending</h4>
                          <p className="text-sm text-yellow-700 mb-3">
                            The return window has expired. Customer did not return the product within 2 days.
                            You can now process vendor payment with 20% commission.
                          </p>
                          <button
                            onClick={() => handleVendorPayment(viewItem.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" /> Pay Vendor
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Info Tab - Only show for non-Confirmed orders */}
              {activeTab === "shipping" && viewItem.status !== "Confirmed" && (
                <div className="max-w-2xl mx-auto">
                  {viewItem.shippingInfo ? (
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Shipping Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tracking ID</label>
                          <div className="font-medium bg-gray-50 p-3 rounded-lg">{viewItem.shippingInfo.trackingId}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Carrier</label>
                          <div className="font-medium bg-gray-50 p-3 rounded-lg">{viewItem.shippingInfo.carrier}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cost</label>
                          <div className="font-medium bg-gray-50 p-3 rounded-lg">₹{viewItem.shippingInfo.shippingCost}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                          <div className="font-medium bg-gray-50 p-3 rounded-lg">{formatDate(viewItem.shippingInfo.estimatedDelivery)}</div>
                        </div>
                      </div>
                      {viewItem.shippingInfo.notes && (
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                          <div className="bg-gray-50 p-4 rounded-lg">{viewItem.shippingInfo.notes}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipping information available yet</h3>
                      <p className="text-gray-600 mb-6">Shipping details will appear once the return is initiated.</p>
                      {viewItem.isWithinReturnWindow && viewItem.shippingStatus !== "Returned to Vendor" && (
                        <button
                          onClick={() => setShowShippingForm(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center gap-2 mx-auto"
                        >
                          <Truck className="w-5 h-5" /> Initiate Return Shipping
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "vendor" && viewItem.status === "Confirmed" && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white p-8 rounded-xl border border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Vendor Payment</h3>
                    <p className="text-gray-600 mb-8">
                      The return window has expired. Customer did not return the product within 2 days.
                      You can now process payment to the vendor with 20% commission.
                    </p>

                    <div className="space-y-6">
                      {/* Commission Info Card */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Percent className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-blue-900">Commission Information</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              20% commission will be deducted from the total amount and retained by admin.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Order ID:</span>
                              <span className="font-medium">{viewItem.orderId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Product:</span>
                              <span className="font-medium">{viewItem.product}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Purchase Price:</span>
                              <span className="font-medium">₹{viewItem.purchasePrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span className="font-medium">Admin Commission (20%):</span>
                              <span className="font-bold">+ ₹{(viewItem.purchasePrice * COMMISSION_RATE).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-blue-600">
                              <span className="font-medium">Vendor Amount (80%):</span>
                              <span className="font-bold">₹{(viewItem.purchasePrice * (1 - COMMISSION_RATE)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-3">
                              <span className="text-gray-900 font-semibold">Total Amount:</span>
                              <span className="text-gray-900 font-bold">₹{viewItem.purchasePrice.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Vendor Details</h4>
                          <div className="space-y-3">
                            <div>
                              <span className="text-gray-600">Vendor Name:</span>
                              <div className="font-medium">{viewItem.vendor.name}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Contact Person:</span>
                              <div className="font-medium">{viewItem.vendor.contactPerson}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <div className="font-medium">{viewItem.vendor.email}</div>
                            </div>
                            {viewItem.vendor.bankDetails && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-700 mb-2">Bank Details</h5>
                                <div className="text-sm space-y-1">
                                  <div>Bank: {viewItem.vendor.bankDetails.bankName}</div>
                                  <div>Account: {viewItem.vendor.bankDetails.accountNumber}</div>
                                  <div>Account Name: {viewItem.vendor.bankDetails.accountName}</div>
                                </div>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Payment Status:</span>
                              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${viewItem.vendorPaymentStatus === "Paid" ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {viewItem.vendorPaymentStatus}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {viewItem.vendorPaymentStatus === "Pending" && (
                        <div className="pt-6 border-t">
                          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-green-900">Payment Summary</h4>
                                <div className="flex gap-4 mt-2">
                                  <div className="text-green-700">
                                    <div className="text-sm">Admin Commission</div>
                                    <div className="font-bold">₹{(viewItem.purchasePrice * COMMISSION_RATE).toFixed(2)}</div>
                                  </div>
                                  <div className="text-blue-700">
                                    <div className="text-sm">Vendor Payment</div>
                                    <div className="font-bold">₹{(viewItem.purchasePrice * (1 - COMMISSION_RATE)).toFixed(2)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleVendorPayment(viewItem.id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 shadow-lg"
                          >
                            <DollarSign className="w-6 h-6" />
                            Process Vendor Payment
                          </button>
                          <p className="text-center text-sm text-gray-500 mt-3">
                            Admin will retain ₹{(viewItem.purchasePrice * COMMISSION_RATE).toFixed(2)} commission
                          </p>
                        </div>
                      )}

                      {viewItem.vendorPaymentStatus === "Paid" && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-3 text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            <div>
                              <h4 className="font-medium">Payment Processed Successfully!</h4>
                              <p className="text-sm mt-1">
                                Date: {viewItem.paymentDate ? formatDate(viewItem.paymentDate) : formatDate(new Date())}
                              </p>
                              <div className="flex gap-4 mt-2">
                                <div>
                                  <div className="text-sm">Admin Received:</div>
                                  <div className="font-bold">₹{viewItem.adminAmount?.toFixed(2) || (viewItem.purchasePrice * COMMISSION_RATE).toFixed(2)}</div>
                                </div>
                                <div>
                                  <div className="text-sm">Vendor Received:</div>
                                  <div className="font-bold">₹{viewItem.vendorAmount?.toFixed(2) || (viewItem.purchasePrice * (1 - COMMISSION_RATE)).toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setViewItem(null);
                  setActiveTab("details");
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2.5 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Shipping Form Modal - Only show for non-Confirmed orders */}
      {showShippingForm && viewItem && viewItem.status !== "Confirmed" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
                  <p className="text-gray-600 mt-1">Order #{viewItem.orderId} • Product: {viewItem.product}</p>
                </div>
                <button
                  onClick={() => setShowShippingForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Vendor Info */}
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Ship to Vendor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Vendor Name</label>
                    <div className="font-medium">{viewItem.vendor.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Contact Person</label>
                    <div className="font-medium">{viewItem.vendor.contactPerson}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-blue-700 mb-1">Shipping Address</label>
                    <div className="font-medium">{viewItem.vendor.address}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                    <div className="font-medium">{viewItem.vendor.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Phone</label>
                    <div className="font-medium">{viewItem.vendor.phone}</div>
                  </div>
                </div>
              </div>

              {/* Shipping Form */}
              <form onSubmit={handleShippingSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tracking ID *</label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.trackingId}
                      onChange={(e) => setShippingInfo({...shippingInfo, trackingId: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter tracking number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Carrier *</label>
                    <select
                      required
                      value={shippingInfo.carrier}
                      onChange={(e) => setShippingInfo({...shippingInfo, carrier: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Carrier</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="DHL">DHL</option>
                      <option value="USPS">USPS</option>
                      <option value="Amazon Logistics">Amazon Logistics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={shippingInfo.shippingCost}
                      onChange={(e) => setShippingInfo({...shippingInfo, shippingCost: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Date *</label>
                    <input
                      type="date"
                      required
                      value={shippingInfo.estimatedDelivery}
                      onChange={(e) => setShippingInfo({...shippingInfo, estimatedDelivery: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Return Reason for Vendor</label>
                    <textarea
                      value={shippingInfo.returnReason}
                      onChange={(e) => setShippingInfo({...shippingInfo, returnReason: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      placeholder="Brief reason for return to vendor..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      value={shippingInfo.notes}
                      onChange={(e) => setShippingInfo({...shippingInfo, notes: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Any additional notes for the vendor..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowShippingForm(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg"
                    >
                      Initiate Return Shipping
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}