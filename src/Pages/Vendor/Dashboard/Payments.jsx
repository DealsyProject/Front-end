import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../../Components/Vendor/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../Components/utils/axiosInstance';

const Payments = () => {
  const navigate = useNavigate();
  const [orderPayments, setOrderPayments] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorStatusFilter, setVendorStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedVendorPayment, setSelectedVendorPayment] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('orders');
  const [stats, setStats] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tempUserData');
    navigate('/');
  };

  const activeView = 'payments';

  useEffect(() => {
    fetchOrderPayments();
    fetchVendorPayments();
  }, []);

  const fetchOrderPayments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/Payment/vendor/payments');
      const rawPayments = response.data.payments || [];

      const paymentsData = rawPayments.map(payment => ({
        paymentId: payment.PaymentId || payment.paymentId || payment.id,
        date: payment.Date || payment.date || payment.createdOn,
        amount: Number(payment.Amount || payment.amount) || 0,
        method: payment.Method || payment.method || 'razorpay',
        status: payment.Status || payment.status || 'completed',
        transactionId: payment.TransactionId || payment.transactionId || payment.razorpayPaymentId || 'N/A',
        invoiceId: payment.InvoiceId || payment.invoiceId || 'N/A',
        orderId: payment.OrderId || payment.orderId,
        isRefunded: payment.IsRefunded || payment.isRefunded || false,
        refundId: payment.RefundId || payment.refundId || null,
        refundDate: payment.RefundDate || payment.refundDate || null,
        refundReason: payment.RefundReason || payment.refundReason || null,
        customer: {
          id: payment.Customer?.Id || payment.customer?.id,
          name: payment.Customer?.Name || payment.customer?.name || 'Unknown Customer',
          email: payment.Customer?.Email || payment.customer?.email || 'N/A',
          phone: payment.Customer?.Phone || payment.customer?.phone || 'N/A',
          address: payment.Customer?.Address || payment.customer?.address || 'N/A',
          pincode: payment.Customer?.Pincode || payment.customer?.pincode || 'N/A',
        },
        items: (payment.Items || payment.items || []).map(item => ({
          productName: item.ProductName || item.productName || 'Unknown Product',
          productImage: item.ProductImage || item.productImage || null,
          quantity: item.Quantity || item.quantity || 1,
          price: Number(item.Price || item.price) || 0,
          total: Number(item.Total || item.total) || 0,
        })),
        orderDate: payment.OrderDate || payment.orderDate || null,
        type: 'order',
      }));

      setOrderPayments(paymentsData);
      calculateStatistics(paymentsData, vendorPayments);
    } catch (error) {
      console.error('Error fetching order payments:', error);
      toast.error('Failed to load order payments');
      setOrderPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorPayments = async () => {
    try {
      setVendorLoading(true);
      const response = await axiosInstance.get('/Payment/vendor/earnings');
      const rawVendorPayments = response.data.payments || response.data.earnings || [];

      if (rawVendorPayments.length === 0) {
        const dummyVendorPayments = generateDummyVendorPayments();
        setVendorPayments(dummyVendorPayments);
        calculateStatistics(orderPayments, dummyVendorPayments);
        return;
      }

      const vendorPaymentsData = rawVendorPayments.map(payment => ({
        paymentId: payment.payoutId || payment.id || `PAYOUT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        date: payment.payoutDate || payment.date || payment.createdAt,
        amount: Number(payment.amount || payment.netAmount) || 0,
        status: payment.status || payment.payoutStatus || 'pending',
        transactionId: payment.payoutTransactionId || payment.transactionId || 'N/A',
        method: payment.payoutMethod || payment.method || 'bank_transfer',
        bankAccount: payment.bankAccount || 'XXXXXX7890',
        bankName: payment.bankName || 'HDFC Bank',
        orderIds: payment.orderIds || [],
        commission: Number(payment.commission || payment.platformFee) || 0,
        netAmount: Number(payment.netAmount || payment.amount) || 0,
        totalOrders: payment.totalOrders || 1,
        type: 'vendor',
        notes: payment.notes || 'Monthly payout',
      }));

      setVendorPayments(vendorPaymentsData);
      calculateStatistics(orderPayments, vendorPaymentsData);
    } catch (error) {
      console.error('Error fetching vendor payments:', error);
      const dummyVendorPayments = generateDummyVendorPayments();
      setVendorPayments(dummyVendorPayments);
      calculateStatistics(orderPayments, dummyVendorPayments);
      toast.info('Using sample payout data');
    } finally {
      setVendorLoading(false);
    }
  };

  const generateDummyVendorPayments = () => {
    const statuses = ['completed', 'pending', 'processing', 'failed'];
    const methods = ['bank_transfer', 'upi', 'paypal'];
    const banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'];
    
    return Array.from({ length: 8 }, (_, i) => ({
      paymentId: `PAYOUT-${1000 + i}`,
      date: new Date(Date.now() - i * 86400000 * 7).toISOString(),
      amount: Math.floor(Math.random() * 5000) + 1000,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      transactionId: `TXN${10000 + i}`,
      method: methods[Math.floor(Math.random() * methods.length)],
      bankAccount: `XXXXXX${7890 + i}`,
      bankName: banks[Math.floor(Math.random() * banks.length)],
      orderIds: [`ORD${2000 + i}`, `ORD${2001 + i}`],
      commission: Math.floor(Math.random() * 500) + 50,
      netAmount: Math.floor(Math.random() * 4500) + 950,
      totalOrders: Math.floor(Math.random() * 5) + 1,
      type: 'vendor',
      notes: i % 2 === 0 ? 'Monthly payout' : 'Weekly settlement',
    }));
  };

  const calculateStatistics = (orderPaymentsData, vendorPaymentsData) => {
    const completedOrderPayments = orderPaymentsData.filter(p => ['Completed', 'Confirmed', 'Captured'].includes(p.status));
    const totalRevenue = completedOrderPayments.reduce((sum, p) => sum + p.amount, 0);
    const refundedCount = orderPaymentsData.filter(p => p.isRefunded).length;
    const refundedAmount = orderPaymentsData.filter(p => p.isRefunded).reduce((sum, p) => sum + p.amount, 0);

    const completedVendorPayments = vendorPaymentsData.filter(p => p.status === 'completed');
    const totalPayouts = completedVendorPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingPayouts = vendorPaymentsData.filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      totalRevenue,
      totalRefundedCount: refundedCount,
      totalRefundedAmount: refundedAmount,
      totalOrderPayments: orderPaymentsData.length,
      totalPayouts,
      totalVendorPayments: vendorPaymentsData.length,
      pendingPayouts,
      completedVendorPayments: completedVendorPayments.length,
    });
  };

  const paymentStatusConfig = {
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    Completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    confirmed: { color: 'bg-emerald-100 text-emerald-800', label: 'Confirmed' },
    Confirmed: { color: 'bg-emerald-100 text-emerald-800', label: 'Confirmed' },
    captured: { color: 'bg-green-100 text-green-800', label: 'Captured' },
    Captured: { color: 'bg-green-100 text-green-800', label: 'Captured' },
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    Pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
    Processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
    failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    Failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    refunded: { color: 'bg-orange-100 text-orange-800', label: 'Refunded' },
    Refunded: { color: 'bg-orange-100 text-orange-800', label: 'Refunded' },
  };

  const PaymentStatusBadge = ({ status }) => {
    const config = paymentStatusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>{config.label}</span>;
  };

  const filteredOrderPayments = orderPayments.filter(payment => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      payment.paymentId?.toLowerCase().includes(search) ||
      payment.customer?.name?.toLowerCase().includes(search) ||
      payment.customer?.email?.toLowerCase().includes(search) ||
      payment.transactionId?.toLowerCase().includes(search) ||
      payment.invoiceId?.toLowerCase().includes(search);

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredVendorPayments = vendorPayments.filter(payment => {
    const search = vendorSearchTerm.toLowerCase();
    const matchesSearch =
      payment.paymentId?.toLowerCase().includes(search) ||
      payment.transactionId?.toLowerCase().includes(search) ||
      payment.bankAccount?.toLowerCase().includes(search) ||
      payment.bankName?.toLowerCase().includes(search);

    const matchesStatus = vendorStatusFilter === 'all' || payment.status === vendorStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewOrderDetails = (payment) => {
    setSelectedPayment(payment);
    setViewMode('order-detail');
  };

  const handleViewVendorDetails = (payment) => {
    setSelectedVendorPayment(payment);
    setViewMode('vendor-detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPayment(null);
    setSelectedVendorPayment(null);
  };

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const renderOrderPaymentDetail = () => {
    if (!selectedPayment) return null;
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl mx-auto">
        <button onClick={handleBackToList} className="flex items-center text-[#586330] hover:underline mb-6 text-lg">
          ← Back to Payments List
        </button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-5">Order Payment Information</h3>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {selectedPayment.isRefunded && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Refunded
                </span>
              )}
            </div>
            {selectedPayment.refundId && (
              <div className="mt-3 text-sm">
                <span className="text-gray-600">Refund ID:</span>
                <span className="font-mono text-red-600 ml-2">{selectedPayment.refundId}</span>
                {selectedPayment.refundDate && (
                  <span className="text-gray-500 ml-4">on {formatDateTime(selectedPayment.refundDate)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="space-y-4 text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Payout ID</span>
                <span className="font-mono font-semibold">{selectedPayment.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Date</span>
                <span className="font-semibold">{formatDateTime(selectedPayment.date)}</span>
              </div>
              <div className="flex justify-between items-center">
                
                <span className="">Status:  <PaymentStatusBadge status={selectedPayment.status} /></span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-gray-800">{selectedPayment.customer.name}</p>
                <p className="text-gray-600">{selectedPayment.customer.email}</p>
                <p className="text-gray-500">{selectedPayment.customer.phone}</p>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <p className="text-sm text-gray-600 font-medium">Delivery Address</p>
                <p className="mt-1 text-gray-800">
                  {selectedPayment.customer.address}, {selectedPayment.customer.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Items Purchased</h3>
          <div className="space-y-4">
            {selectedPayment.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 p-6 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-6">
                  {item.productImage ? (
                    <img 
                      src={item.productImage} 
                      alt={item.productName} 
                      className="w-24 h-24 object-cover rounded-lg shadow-sm" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs ${item.productImage ? 'hidden' : 'flex'}`}>
                    No Image
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800">{item.productName}</h4>
                    <p className="text-gray-600 mt-1">Quantity: <span className="font-medium">{item.quantity}</span></p>
                    <p className="text-gray-600">Price: <span className="font-medium">{formatCurrency(item.price)}</span> each</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(item.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderVendorPaymentDetail = () => {
    if (!selectedVendorPayment) return null;
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
        <button onClick={handleBackToList} className="flex items-center text-[#586330] hover:underline mb-6 text-lg">
          ← Back to Payments List
        </button>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-5">My Payout Information</h3>
          <div className="flex items-center gap-4 mt-4">
            <PaymentStatusBadge status={selectedVendorPayment.status} />
            
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Payout Details</h4>
            <div className="space-y-4 text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Payout ID</span>
                <span className="font-mono font-semibold">{selectedVendorPayment.paymentId}</span>
              </div>
             
              <div className="flex justify-between">
                <span className="text-gray-600">Payout Date</span>
                <span className="font-semibold">{formatDateTime(selectedVendorPayment.date)}</span>
              </div>
             
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-semibold">{selectedVendorPayment.totalOrders}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Amount Details</h4>
            <div className="space-y-4">
              
              <div className="pt-4 border-t border-blue-200">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Order Amount</span>
                    <span className="font-medium">{formatCurrency(selectedVendorPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Commission</span>
                    <span className="text-red-600 font-medium">-{formatCurrency(selectedVendorPayment.commission)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-lg font-bold text-gray-800">Net Amount</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedVendorPayment.netAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedVendorPayment.orderIds && selectedVendorPayment.orderIds.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Included Orders</h3>
            <div className="space-y-3">
              {selectedVendorPayment.orderIds.map((orderId, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{orderId}</h4>
                      <p className="text-sm text-gray-500">Order included in this payout</p>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar handleLogout={handleLogout} activeView={activeView} />

      <div className="flex-1 p-6 text-black">
        {viewMode === 'list' ? (
          <>
            <header className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
              <p className="text-gray-600 mt-2">Manage and track all payment transactions</p>
            </header>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">💰</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">My Total Payouts</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalPayouts)}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">💳</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                      <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingPayouts)}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-2xl">⏳</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalOrderPayments + stats.totalVendorPayments}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">📊</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-md p-2 mb-6">
              <div className="flex border-b">
                <button
                  className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${
                    activeTab === 'orders'
                      ? 'text-[#586330] border-b-2 border-[#586330] bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('orders')}
                >
                  Order Payments ({orderPayments.length})
                </button>
                <button
                  className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${
                    activeTab === 'vendor'
                      ? 'text-[#586330] border-b-2 border-[#586330] bg-gray-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab('vendor')}
                >
                  My Payouts ({vendorPayments.length})
                </button>
              </div>
            </div>

            {activeTab === 'orders' ? (
              <>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#586330]"></div>
                    <p className="text-gray-600 mt-2">Loading order payments...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                      <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Search by Payment ID, customer, transaction..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="w-full lg:w-auto">
                          <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                          >
                            <option value="all">All Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="captured">Captured</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment Details</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrderPayments.map(payment => (
                              <tr key={payment.paymentId} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">ID: {payment.paymentId}</div>
                                  
                                  <div className="text-xs text-gray-500 mt-1">{formatDateTime(payment.date)}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">{payment.customer.name}</div>
                                  <div className="text-sm text-gray-500">{payment.customer.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <PaymentStatusBadge status={payment.status} />
                                  {payment.isRefunded && (
                                    <div className="mt-1">
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Refunded
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => handleViewOrderDetails(payment)} 
                                    className="px-4 py-2 bg-[#586330] text-white rounded-lg  text-sm"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {filteredOrderPayments.length === 0 && (
                          <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">💳</div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No order payments found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters</p>
                            <button 
                              onClick={fetchOrderPayments}
                              className="mt-4 px-4 py-2 bg-[#586330] text-white rounded-lg hover:bg-[#586330]/80"
                            >
                              Refresh
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {vendorLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#586330]"></div>
                    <p className="text-gray-600 mt-2">Loading my payouts...</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                      <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Search by Payout ID, bank, transaction..."
                            value={vendorSearchTerm}
                            onChange={(e) => setVendorSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="w-full lg:w-auto">
                          <select 
                            value={vendorStatusFilter} 
                            onChange={(e) => setVendorStatusFilter(e.target.value)} 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                          >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payout Details</th>
                              
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVendorPayments.map(payment => (
                              <tr key={payment.paymentId} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">ID: {payment.paymentId}</div>
                                  
                                  <div className="text-xs text-gray-500 mt-1">{formatDateTime(payment.date)}</div>
                                
                                </td>
                               
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</div>
                                   
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <PaymentStatusBadge status={payment.status} />
                                  
                                </td>
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => handleViewVendorDetails(payment)} 
                                    className="px-4 py-2 bg-[#586330] text-white rounded-lg hover:bg-[#586330]/80 text-sm"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {filteredVendorPayments.length === 0 && (
                          <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🏦</div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No payouts found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters</p>
                            <button 
                              onClick={fetchVendorPayments}
                              className="mt-4 px-4 py-2 bg-[#586330] text-white rounded-lg hover:bg-[#586330]/80"
                            >
                              Refresh
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : viewMode === 'order-detail' ? (
          renderOrderPaymentDetail()
        ) : viewMode === 'vendor-detail' ? (
          renderVendorPaymentDetail()
        ) : null}

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default Payments;