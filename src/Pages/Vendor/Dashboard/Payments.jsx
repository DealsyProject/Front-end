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
  const [earningsData, setEarningsData] = useState(null);

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
    fetchVendorEarnings();
  }, []);

  const fetchOrderPayments = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/Payment/vendor/orders/payments');
      const rawPayments = response.data.payments || [];

      console.log('Order payments response:', response.data);
      console.log('Raw payments:', rawPayments);

      const paymentsData = rawPayments.map(payment => ({
        paymentId: payment.PaymentId || `PAY-${payment.OrderId}`,
        date: payment.PaymentDate || payment.OrderDate,
        amount: Number(payment.OrderAmount) || 0,
        method: 'razorpay',
        status: payment.PaymentStatus?.toLowerCase() || (payment.PaymentId ? 'completed' : 'pending'),
        transactionId: payment.TransactionId || payment.PaymentId || 'N/A',
        invoiceId: `INV-${payment.OrderId}`,
        orderId: payment.OrderId,
        orderNumber: payment.OrderNumber || `ORD-${payment.OrderId}`,
        isRefunded: false,
        customer: {
          id: payment.Customer?.CustomerId || payment.Customer?.id,
          name: payment.Customer?.CustomerName || payment.Customer?.name || 'Unknown Customer',
          email: payment.Customer?.Email || 'N/A',
          phone: payment.Customer?.Phone || 'N/A',
          address: payment.Customer?.Address || 'Address not available',
          pincode: payment.Customer?.Pincode || 'N/A',
        },
        items: (payment.Items || []).map(item => ({
          productId: item.ProductId,
          productName: item.ProductName || 'Unknown Product',
          productImage: null,
          quantity: item.Quantity || 1,
          price: Number(item.Price) || 0,
          total: (item.Quantity || 1) * (Number(item.Price) || 0),
        })),
        orderDate: payment.OrderDate,
        orderStatus: payment.OrderStatus,
        type: 'order',
        isPaidToVendor: payment.IsPaidToVendor || false,
        vendorPayoutDate: payment.VendorPayoutDate,
        vendorPayoutAmount: payment.VendorPayoutAmount || 0,
      }));

      console.log('Processed payments:', paymentsData);
      setOrderPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching order payments:', error);
      if (error.response?.status === 404) {
        toast.info('No order payments found. You will see data when customers place orders.');
      } else {
        toast.error('Failed to load order payments');
      }
      setOrderPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorPayments = async () => {
    try {
      setVendorLoading(true);
      const response = await axiosInstance.get('/Payment/vendor/payouts');
      const rawVendorPayments = response.data.payouts || [];

      console.log('Vendor payouts response:', response.data);
      console.log('Raw payouts:', rawVendorPayments);

      const vendorPaymentsData = rawVendorPayments.map(payment => ({
        payoutId: payment.PayoutId || payment.id,
        date: payment.PayoutDate || payment.createdOn,
        amount: Number(payment.VendorAmount) || 0,
        status: payment.Status?.toLowerCase() || 'pending',
        transactionId: payment.TransactionId || `TXN-${payment.PayoutId || payment.id}`,
        method: payment.PaymentMethod || 'bank_transfer',
        bankAccount: 'XXXXXX7890',
        bankName: 'Bank Name',
        orderId: payment.OrderId,
        orderIds: [payment.OrderId],
        commission: Number(payment.CommissionAmount) || 0,
        netAmount: Number(payment.VendorAmount) || 0,
        totalOrders: 1,
        type: 'vendor',
        notes: 'Order payout',
        orderInfo: payment.Order,
        totalAmount: Number(payment.TotalAmount) || Number(payment.VendorAmount) + Number(payment.CommissionAmount) || 0,
      }));

      console.log('Processed vendor payments:', vendorPaymentsData);
      setVendorPayments(vendorPaymentsData);
    } catch (error) {
      console.error('Error fetching vendor payments:', error);
      if (error.response?.status === 404) {
        toast.info('No vendor payouts found. Admin will process payouts for confirmed orders.');
      } else {
        toast.error('Failed to load vendor payouts');
      }
      setVendorPayments([]);
    } finally {
      setVendorLoading(false);
    }
  };

  const fetchVendorEarnings = async () => {
    try {
      const response = await axiosInstance.get('/Payment/vendor/earnings');
      const earnings = response.data.earnings;
      
      console.log('Earnings data:', earnings);
      setEarningsData(earnings);
    } catch (error) {
      console.error('Error fetching vendor earnings:', error);
      // Don't show error for earnings as it's secondary data
    }
  };

  const calculateStatistics = (orderPaymentsData, vendorPaymentsData) => {
    // Calculate total revenue from completed orders
    const completedOrderPayments = orderPaymentsData.filter(p => 
      p.status?.toLowerCase() === 'paid'
    );
    const totalRevenue = completedOrderPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate total payouts from vendor payments that are completed
    const completedVendorPayments = vendorPaymentsData.filter(p => 
      ['completed', 'paid', 'confirmed'].includes(p.status?.toLowerCase())
    );
    const totalPayouts = completedVendorPayments.reduce((sum, p) => sum + p.netAmount, 0);

    // Calculate pending payouts from unpaid delivered orders
    const unpaidDeliveredOrders = orderPaymentsData.filter(p => 
      !p.isPaidToVendor && 
      p.orderStatus === 'Delivered' && 
      p.status?.toLowerCase() === 'paid'
    );
    
    // Calculate vendor's share (80%) for pending orders
    const pendingOrderAmount = unpaidDeliveredOrders.reduce((sum, p) => {
      // Calculate vendor's 80% share of the order amount
      return sum + (p.amount * 0.8);
    }, 0);

    // Also include any vendor payouts that are pending/processing
    const pendingVendorPayments = vendorPaymentsData.filter(p => 
      ['pending', 'processing'].includes(p.status?.toLowerCase())
    );
    const pendingPayoutAmount = pendingVendorPayments.reduce((sum, p) => sum + p.netAmount, 0);

    // Total pending payouts = pending vendor payments + pending order amounts
    const totalPendingPayouts = pendingOrderAmount + pendingPayoutAmount;

    // Calculate commission paid
    const totalCommissionPaid = vendorPaymentsData
      .filter(p => ['completed', 'paid', 'confirmed'].includes(p.status?.toLowerCase()))
      .reduce((sum, p) => sum + p.commission, 0);

    setStats(prev => ({
      ...prev,
      totalRevenue,
      totalPayouts,
      pendingPayouts: totalPendingPayouts,
      totalOrderPayments: orderPaymentsData.length,
      totalVendorPayments: vendorPaymentsData.length,
      completedVendorPayments: completedVendorPayments.length,
      unpaidOrdersCount: unpaidDeliveredOrders.length,
      totalOrders: orderPaymentsData.length,
      completedOrders: completedOrderPayments.length,
      commissionPaid: totalCommissionPaid,
      netEarnings: totalPayouts,
    }));
  };

  const paymentStatusConfig = {
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    confirmed: { color: 'bg-emerald-100 text-emerald-800', label: 'Confirmed' },
    captured: { color: 'bg-green-100 text-green-800', label: 'Captured' },
    paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
    failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    refunded: { color: 'bg-orange-100 text-orange-800', label: 'Refunded' },
  };

  const PaymentStatusBadge = ({ status }) => {
    const normalizedStatus = status?.toLowerCase();
    const config = paymentStatusConfig[normalizedStatus] || { 
      color: 'bg-gray-100 text-gray-800', 
      label: status || 'Unknown' 
    };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>{config.label}</span>;
  };

  const filteredOrderPayments = orderPayments.filter(payment => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      payment.paymentId?.toLowerCase().includes(search) ||
      payment.orderNumber?.toLowerCase().includes(search) ||
      payment.customer?.name?.toLowerCase().includes(search) ||
      payment.customer?.email?.toLowerCase().includes(search) ||
      payment.transactionId?.toLowerCase().includes(search) ||
      payment.invoiceId?.toLowerCase().includes(search);

    const normalizedStatus = payment.status?.toLowerCase();
    const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const filteredVendorPayments = vendorPayments.filter(payment => {
    const search = vendorSearchTerm.toLowerCase();
    const matchesSearch =
      payment.payoutId?.toString().toLowerCase().includes(search) ||
      payment.transactionId?.toLowerCase().includes(search);

    const normalizedStatus = payment.status?.toLowerCase();
    const matchesStatus = vendorStatusFilter === 'all' || normalizedStatus === vendorStatusFilter.toLowerCase();

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

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString('en-IN', { 
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

  const formatDateOnly = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const renderOrderPaymentDetail = () => {
    if (!selectedPayment) return null;
    
    // Calculate vendor share (80%) for this order
    const vendorShare = selectedPayment.amount * 0.8;
    const commission = selectedPayment.amount * 0.2;
    
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-5xl mx-auto">
        <button onClick={handleBackToList} className="flex items-center text-[#586330] hover:underline mb-6 text-lg">
          ← Back to Payments List
        </button>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-5">Order Payment Information</h3>
            
            <div className="mt-3 text-sm text-gray-600">
              {selectedPayment.orderNumber} | 
              Date: {formatDateOnly(selectedPayment.orderDate)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800">{formatCurrency(selectedPayment.amount)}</div>
            <div className="text-sm text-gray-500">Total Amount</div>
            {selectedPayment.isPaidToVendor ? (
              <div className="text-lg font-semibold text-green-600 mt-2">
                Vendor Payout: {formatCurrency(selectedPayment.vendorPayoutAmount)}
              </div>
            ) : selectedPayment.orderStatus === 'Delivered' ? (
              <div className="text-lg font-semibold text-yellow-600 mt-2">
                Pending Payout: {formatCurrency(vendorShare)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Payment Details</h4>
            <div className="space-y-4 text-base">
              
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono font-semibold">{selectedPayment.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment ID</span>
                <span className="font-mono font-semibold">{selectedPayment.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Date</span>
                <span className="font-semibold">{formatDateTime(selectedPayment.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Status</span>
                <span className="font-semibold">{selectedPayment.orderStatus}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status</span>
                <PaymentStatusBadge status={selectedPayment.status} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Order Confirmation</h4>
            <div className="space-y-4">
              {selectedPayment.isPaidToVendor ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Paid to Vendor
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payout Date</span>
                    <span className="font-semibold">{formatDateTime(selectedPayment.vendorPayoutDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payout Amount</span>
                    <span className="font-semibold text-green-600">{formatCurrency(selectedPayment.vendorPayoutAmount)}</span>
                  </div>
                </>
              ) : selectedPayment.orderStatus === 'Delivered' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      Pending Payout
                    </span>
                  </div>
                  <div className="pt-3 border-t border-blue-200">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Amount</span>
                        <span className="font-medium">{formatCurrency(selectedPayment.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Platform Commission (20%)</span>
                        <span className="text-red-600 font-medium">-{formatCurrency(commission)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-bold text-gray-800">Your Share (80%)</span>
                        <span className="font-bold text-green-600">{formatCurrency(vendorShare)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Payout will be processed when order is delivered
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Customer Information</h3>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="space-y-4">
              <div>
                <p className="text-xl font-bold text-gray-800">{selectedPayment.customer.name}</p>
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
            {selectedPayment.items && selectedPayment.items.length > 0 ? (
              selectedPayment.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 p-6 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-6">
                    
                      
                   
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800">{item.productName}</h4>
                      <p className="text-gray-600 mt-1">Product ID: {item.productId}</p>
                      <p className="text-gray-600">Quantity: <span className="font-medium">{item.quantity}</span></p>
                      <p className="text-gray-600">Price: <span className="font-medium">{formatCurrency(item.price)}</span> each</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items found for this order
              </div>
            )}
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
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-5">My Payout Information</h3>
              <div className="flex items-center gap-4 mt-4">
                <PaymentStatusBadge status={selectedVendorPayment.status} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800">{formatCurrency(selectedVendorPayment.netAmount)}</div>
              <div className="text-sm text-gray-500">Net Amount Received</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Payout Details</h4>
            <div className="space-y-4 text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Payout ID</span>
                <span className="font-mono font-semibold">{selectedVendorPayment.payoutId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono font-semibold">{selectedVendorPayment.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payout Date</span>
                <span className="font-semibold">{formatDateTime(selectedVendorPayment.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-semibold">{selectedVendorPayment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold capitalize">{selectedVendorPayment.status}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Amount Details</h4>
            <div className="space-y-4">
              {selectedVendorPayment.orderInfo && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 font-medium">Order Information</p>
                  <p className="font-medium">Order #{selectedVendorPayment.orderInfo.Id}</p>
                  <p className="text-sm text-gray-500">{formatDateOnly(selectedVendorPayment.orderInfo.OrderDate)}</p>
                  <p className="text-sm text-gray-500">Status: {selectedVendorPayment.orderInfo.Status}</p>
                </div>
              )}
              <div className="pt-4 border-t border-blue-200">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Order Amount</span>
                    <span className="font-medium">{formatCurrency(selectedVendorPayment.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Commission</span>
                    <span className="text-red-600 font-medium">-{formatCurrency(selectedVendorPayment.commission)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-lg font-bold text-gray-800">Net Amount Received</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedVendorPayment.netAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedVendorPayment.orderInfo?.Customer && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Customer Information</h4>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-800">{selectedVendorPayment.orderInfo.Customer.CustomerName}</p>
              <p className="text-gray-600">{selectedVendorPayment.orderInfo.Customer.Email}</p>
              <p className="text-gray-500">{selectedVendorPayment.orderInfo.Customer.Phone}</p>
              <p className="text-gray-500 mt-2">{selectedVendorPayment.orderInfo.Customer.Address}, {selectedVendorPayment.orderInfo.Customer.Pincode}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to refresh all data
  const refreshAllData = async () => {
    try {
      await Promise.all([
        fetchOrderPayments(),
        fetchVendorPayments(),
        fetchVendorEarnings()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar handleLogout={handleLogout} activeView={activeView} />

      <div className="flex-1 p-6 text-black">
        {viewMode === 'list' ? (
          <>
            <header className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
                  <p className="text-gray-600 mt-2">Manage and track all payment transactions</p>
                </div>
               
              </div>
            </header>

            {/* REMOVED STATISTICS SECTION - Starts here */}
            
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
                            placeholder="Search by Order ID, customer, transaction..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#586330] focus:border-transparent"
                          />
                        </div>
                        
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Order Details</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Vendor Payment</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrderPayments.map(payment => {
                              const vendorShare = payment.amount * 0.8;
                              return (
                                <tr key={payment.paymentId} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{payment.orderNumber}</div>
                                    
                                    <div className="text-xs text-gray-500">{formatDateOnly(payment.orderDate)}</div>
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
                                    <div className="text-xs text-gray-500 mt-1">{payment.orderStatus}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {payment.isPaidToVendor ? (
                                      <div className="text-sm">
                                        <div className="text-green-600 font-medium">Paid</div>
                                        <div className="text-xs text-gray-500">
                                          {formatDateOnly(payment.vendorPayoutDate)}
                                        </div>
                                      </div>
                                    ) : payment.orderStatus === 'Delivered' ? (
                                      <div className="text-[#586330] font-medium">Pending</div>
                                    ) : (
                                      <div className="text-gray-500 font-medium">Not Delivered</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <button 
                                      onClick={() => handleViewOrderDetails(payment)} 
                                      className="px-4 py-2 bg-[#586330] text-white rounded-lg hover:bg-[#586330]/80 text-sm"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {filteredOrderPayments.length === 0 && !loading && (
                          <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">💳</div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No order payments found</h3>
                            <p className="text-gray-500 mb-4">You will see order payments when customers place orders for your products</p>
                            <div className="space-x-4">
                             
                              <button 
                                onClick={() => navigate('/vendor-dashboard')}
                                className="px-4 py-2 border border-[#586330] text-[#586330] rounded-lg hover:bg-[#586330]/10"
                              >
                                Go to Dashboard
                              </button>
                            </div>
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
                            placeholder="Search by Payout ID"
                            value={vendorSearchTerm}
                            onChange={(e) => setVendorSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#586330] focus:border-transparent"
                          />
                        </div>
                        
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payout Details</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Order Info</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount Details</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVendorPayments.map(payment => (
                              <tr key={payment.payoutId} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">PAY-{payment.payoutId}</div>
                                  <div className="text-xs text-gray-500 mt-1">{formatDateOnly(payment.date)}</div>
                                  <div className="text-xs text-gray-500">TXN: {payment.transactionId}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm">
                                    {payment.orderInfo ? (
                                      <>
                                        <div className="font-medium">Order {payment.orderInfo.Id}</div>
                                        
                                        <div className="text-xs text-gray-500">
                                          {payment.orderInfo.Customer?.CustomerName || 'Customer'}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-gray-500">Order #{payment.orderId || 'N/A'}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <div className="text-lg font-bold text-gray-900">{formatCurrency(payment.netAmount)}</div>
                                    <div className="text-xs text-gray-500">
                                      Total: {formatCurrency(payment.totalAmount)} | 
                                      Commission: {formatCurrency(payment.commission)}
                                    </div>
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

                        {filteredVendorPayments.length === 0 && !vendorLoading && (
                          <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🏦</div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No payouts found</h3>
                            <p className="text-gray-500 mb-4">Admin will process payouts for confirmed orders</p>
                            <div className="space-x-4">
                             
                              <button 
                                onClick={() => setActiveTab('orders')}
                                className="px-4 py-2 border border-[#586330] text-[#586330] rounded-lg hover:bg-[#586330]/10"
                              >
                                View Order Payments
                              </button>
                            </div>
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