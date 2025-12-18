import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../../Components/Vendor/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../Components/utils/axiosInstance';
import { 
  Package, 
  Truck, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';

const Customers = () => {
  const navigate = useNavigate();
  const [vendorOrders, setVendorOrders] = useState([]);
  const [vendorReturns, setVendorReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchReturnTerm, setSearchReturnTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsTotalPages, setReturnsTotalPages] = useState(1);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tempUserData');
    navigate('/');
  };

  const activeView = 'customers';

  useEffect(() => {
    fetchVendorOrders();
    fetchVendorReturns();
  }, []);

  const fetchVendorOrders = async () => {
    try {
      setLoading(true);
      console.log("Fetching vendor orders...");

      const response = await axiosInstance.get('/Order/vendor/orders');
      console.log("Orders API Response:", response);

      const ordersData = response.data.orders || [];
      console.log("Processed Orders Count:", ordersData.length);
      
      setVendorOrders(ordersData);

      if (ordersData.length === 0) {
        toast.info("No customer orders found for your products");
      }
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      toast.error('Failed to load customer orders');
      setVendorOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorReturns = async (page = 1) => {
    try {
      setLoadingReturns(true);
      console.log("Fetching vendor returns...");

      const response = await axiosInstance.get('/Order/vendor/returns');
      console.log("Returns API Response:", response);

      const returnsData = response.data.returns || [];
      
      // Map the API response to your expected format
      const mappedReturns = returnsData.map(returnItem => ({
        returnId: returnItem.ReturnId || returnItem.returnId || 0,
        orderId: returnItem.OrderId || returnItem.orderId || 0,
        orderNumber: returnItem.OrderNumber || returnItem.orderNumber || `ORD-${returnItem.OrderId || returnItem.orderId || 0}`,
        returnDate: returnItem.ReturnDate || returnItem.returnDate || null,
        reason: returnItem.Reason || returnItem.reason || 'No reason provided',
        status: returnItem.Status || returnItem.status || 'Pending',
        carrierName: returnItem.CarrierName || returnItem.carrierName || null,
        trackingId: returnItem.TrackingId || returnItem.trackingId || null,
        shippingSubmittedAt: returnItem.ModifiedOn || returnItem.shippingSubmittedAt || null,
        customerName: returnItem.CustomerName || returnItem.customerName || 
                     (returnItem.customer?.customerName || returnItem.customer?.CustomerName) || 'Unknown Customer',
        customerEmail: returnItem.CustomerEmail || returnItem.customerEmail || 
                      (returnItem.customer?.email || returnItem.customer?.Email) || 'N/A',
        customerPhone: returnItem.CustomerPhone || returnItem.customerPhone || 
                      (returnItem.customer?.phone || returnItem.customer?.PhoneNumber) || 'N/A',
        shippingAddress: returnItem.ShippingAddress || returnItem.shippingAddress || 'N/A',
        items: returnItem.Items || returnItem.items || [],
        refundAmount: returnItem.RefundAmount || returnItem.refundAmount || 0,
        refundStatus: returnItem.RefundStatus || returnItem.refundStatus || 'Pending',
        refundDate: returnItem.RefundDate || returnItem.refundDate || null
      }));
      
      console.log("Mapped Returns Count:", mappedReturns.length);
      setVendorReturns(mappedReturns);
      setReturnsPage(page);

      if (mappedReturns.length === 0) {
        toast.info("No return requests found for your products");
      }
    } catch (error) {
      console.error('Error fetching vendor returns:', error);
      toast.error('Failed to load return requests');
      setVendorReturns([]);
    } finally {
      setLoadingReturns(false);
    }
  };

  const getFlattenedOrders = () => {
    const flattenedOrders = [];

    vendorOrders.forEach(order => {
      flattenedOrders.push({
        orderId: order.OrderId || order.Id || 0,
        customerId: order.CustomerId || 0,
        customerName: order.CustomerName || 'Unknown Customer',
        customerEmail: order.CustomerEmail || 'No email',
        totalAmount: Number(order.TotalAmount) || 0,
        orderDate: order.OrderDate || order.CreatedOn || new Date(),
        orderStatus: order.Status || 'Pending',
        confirmationStatus: order.ConfirmationStatus || 'Pending',
        items: order.Items || [],
        razorpayOrderId: order.RazorpayOrderId,
        paymentId: order.PaymentId,
        shippingAddress: order.ShippingAddress,
        trackingNumber: order.TrackingNumber,
        carrierName: order.CarrierName,
        shippedDate: order.ShippedDate,
        deliveredDate: order.DeliveredDate
      });
    });

    return flattenedOrders.sort((a, b) => 
      new Date(b.orderDate) - new Date(a.orderDate)
    );
  };

  const getUniqueCustomers = () => {
    const customerMap = new Map();
    
    vendorOrders.forEach(order => {
      const customerId = order.CustomerId;
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName: order.CustomerName,
          customerEmail: order.CustomerEmail,
          orderIds: []
        });
      }
      
      const customer = customerMap.get(customerId);
      customer.orderIds.push(order.OrderId || order.Id);
    });
    
    return Array.from(customerMap.values());
  };

  const flattenedOrders = getFlattenedOrders();
  const uniqueCustomers = getUniqueCustomers();

  const filteredOrders = flattenedOrders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderId.toString().includes(searchTerm)
  );

  const filteredReturns = vendorReturns.filter(returnItem =>
    returnItem.customerName?.toLowerCase().includes(searchReturnTerm.toLowerCase()) ||
    returnItem.orderNumber?.toLowerCase().includes(searchReturnTerm.toLowerCase()) ||
    returnItem.trackingId?.toLowerCase().includes(searchReturnTerm.toLowerCase()) ||
    returnItem.reason?.toLowerCase().includes(searchReturnTerm.toLowerCase()) ||
    returnItem.returnId?.toString().includes(searchReturnTerm)
  );

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setSelectedReturn(null);

    const customerOrders = flattenedOrders.filter(o => 
      o.customerId === order.customerId
    );
    
    const stats = {
      totalOrders: customerOrders.length || 0,
      completedOrders: customerOrders.filter(o =>
        ['Delivered', 'Completed', 'Confirmed'].includes(o.orderStatus)
      ).length,
      pendingOrders: customerOrders.filter(o =>
        ['Pending', 'Processing', 'Shipped'].includes(o.orderStatus)
      ).length,
      returnedOrders: customerOrders.filter(o => o.confirmationStatus === 'Returned').length,
      totalSpent: customerOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      customerName: order.customerName,
      customerEmail: order.customerEmail
    };

    setCustomerStats(stats);
  };

  const handleReturnSelect = (returnItem) => {
    setSelectedReturn(returnItem);
    setSelectedOrder(null);
  };

  const handleConfirmReturnReceipt = async (returnId) => {
    try {
      const response = await axiosInstance.post(`/Order/return/${returnId}/vendor-confirm`);
      if (response.data.success) {
        toast.success('Return confirmed as received! Items have been restocked.');
        // Refresh both returns and orders
        fetchVendorReturns();
        fetchVendorOrders();
        
        // Update selected return if it's the current one
        if (selectedReturn?.returnId === returnId) {
          setSelectedReturn(prev => ({ 
            ...prev, 
            status: 'Confirmed'
          }));
        }
      }
    } catch (error) {
      console.error('Error confirming return receipt:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm return receipt');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const s = status.toLowerCase();

    if (['delivered', 'completed', 'confirmed', 'paid'].includes(s))
      return 'bg-green-100 text-green-800';
    if (['pending', 'processing'].includes(s))
      return 'bg-yellow-100 text-yellow-800';
    if (['shipped', 'in-transit'].includes(s))
      return 'bg-blue-100 text-blue-800';
    if (['returned', 'refunded'].includes(s))
      return 'bg-red-100 text-red-800';
    if (s === 'expired')
      return 'bg-purple-100 text-purple-800';

    return 'bg-gray-100 text-gray-800';
  };

  const getReturnStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const s = status.toLowerCase();

    if (['confirmed', 'completed', 'shipped', 'delivered'].includes(s))
      return 'bg-green-100 text-green-800';
    if (['pending', 'processing'].includes(s))
      return 'bg-yellow-100 text-yellow-800';
    if (['rejected', 'cancelled', 'failed'].includes(s))
      return 'bg-red-100 text-red-800';

    return 'bg-gray-100 text-gray-800';
  };

  const handleRefresh = () => {
    if (activeTab === 'orders') {
      fetchVendorOrders();
    } else {
      fetchVendorReturns();
    }
  };

  const handleReturnsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= returnsTotalPages) {
      fetchVendorReturns(newPage);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar handleLogout={handleLogout} activeView={activeView} />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
          <p className="text-gray-600 mt-1">View orders, returns, and customer details</p>
        </div>

       
       

        {/* Search & Refresh */}
        <div className="mb-8 bg-white p-5 rounded-xl shadow-sm">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder={
                activeTab === 'orders' 
                  ? "Search by customer name, email, or order ID..." 
                  : "Search by customer name, order ID, or tracking ID..."
              }
              value={activeTab === 'orders' ? searchTerm : searchReturnTerm}
              onChange={(e) => activeTab === 'orders' ? setSearchTerm(e.target.value) : setSearchReturnTerm(e.target.value)}
              className="flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586330]"
            />
           
          </div>
        </div>


          {/* Tabs */}
        <div className="mb-8 bg-white p-2 rounded-xl shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'orders' 
                ? 'bg-[#586330] text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package size={20} className="inline mr-2" />
            Orders ({flattenedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'returns' 
                ? 'bg-[#586330] text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck size={20} className="inline mr-2" />
            Returns ({vendorReturns.length})
          </button>
        </div>

        {loading && activeTab === 'orders' ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
            <span className="ml-4 text-lg text-gray-600">Loading orders...</span>
          </div>
        ) : loadingReturns && activeTab === 'returns' ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
            <span className="ml-4 text-lg text-gray-600">Loading returns...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - List */}
            <div className="lg:col-span-1">
              {activeTab === 'orders' ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-[#586330] text-white p-5">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Orders Available </h2> 
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                        {uniqueCustomers.length} customers
                      </span>
                    </div>
                  </div>
                   
                   
                  <div className="max-h-[70vh] overflow-y-auto">
                    {filteredOrders.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Package size={40} className="text-gray-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          {searchTerm ? 'No matching orders' : 'No orders yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'Try a different search' : 'Orders will appear here once customers buy your products'}
                        </p>
                      </div>
                    ) : (
                      filteredOrders.map((order) => (
                        <div
                          key={order.orderId}
                          onClick={() => handleOrderSelect(order)}
                          className={`p-5 border-b border-gray-100 cursor-pointer transition-all hover:bg-[#f8f6f0] ${
                            selectedOrder?.orderId === order.orderId
                              ? 'bg-[#f8f6f0] border-l-4 border-l-[#586330]'
                              : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-800">{order.customerName}</h3>
                              <p className="text-sm text-gray-600 truncate">{order.customerEmail}</p>
                            </div>
                            <span className="text-sm font-medium text-[#586330] bg-[#f8f6f0] px-2 py-1 rounded">
                              Order #{order.orderId}
                            </span>
                          </div>

                          <div className="mt-3 flex justify-between items-center">
                            <div>
                              <span className="text-lg font-bold text-gray-800">
                                {formatCurrency(order.totalAmount)}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)} mb-1`}>
                                {order.orderStatus}
                              </span>
                              {order.confirmationStatus && order.confirmationStatus !== 'Pending' && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.confirmationStatus)}`}>
                                  {order.confirmationStatus}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(order.orderDate)}
                            {order.items && order.items.length > 0 && (
                              <span className="ml-2">• {order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                            )}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-[#586330] text-white p-5">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold">Return Requests </h2> 
                       

                      
                    </div>
                  </div>

                  <div className="max-h-[70vh] overflow-y-auto">
                    {filteredReturns.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Truck size={40} className="text-gray-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          {searchReturnTerm ? 'No matching returns' : 'No return requests'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {searchReturnTerm ? 'Try a different search' : 'Return requests will appear here when customers return products'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {filteredReturns.map((returnItem) => (
                          <div
                            key={returnItem.returnId}
                            onClick={() => handleReturnSelect(returnItem)}
                            className={`p-5 border-b border-gray-100 cursor-pointer transition-all hover:bg-[#586330]/20 ${
                              selectedReturn?.returnId === returnItem.returnId
                                ? 'bg-[#586330]/10 border-l-4 '
                                : ''
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {returnItem.customerName}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">
                                  Order {returnItem.orderNumber}
                                </p>
                              </div>
                             
                            </div>

                            

                            <div className="flex justify-between items-center">
                              
                              <div className="flex flex-col items-end">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReturnStatusColor(returnItem.status)} mb-1`}>
                                  {returnItem.status}
                                </span>
                               
                              </div>
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                              Returned on {formatDate(returnItem.returnDate)}
                              {returnItem.items && returnItem.items.length > 0 && (
                                <span className="ml-2">• {returnItem.items.length} item{returnItem.items.length !== 1 ? 's' : ''}</span>
                              )}
                            </p>
                          </div>
                        ))}
                        
                        {/* Pagination for returns */}
                        {returnsTotalPages > 1 && (
                          <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                            <button
                              onClick={() => handleReturnsPageChange(returnsPage - 1)}
                              disabled={returnsPage === 1}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <ArrowLeft size={16} />
                              Previous
                            </button>
                            <span className="text-sm text-gray-600">
                              Page {returnsPage} of {returnsTotalPages}
                            </span>
                            <button
                              onClick={() => handleReturnsPageChange(returnsPage + 1)}
                              disabled={returnsPage === returnsTotalPages}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              Next
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2">
              {activeTab === 'orders' ? (
                selectedOrder ? (
                  <div className="bg-white rounded-xl shadow-lg p-8">
                    {/* Customer Header */}
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedOrder.customerName}</h2>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span>{selectedOrder.customerEmail}</span>
                        <span className="text-gray-400">•</span>
                        
                      </div>
                    </div>

                    {/* Order Header */}
                    <div className="bg-gray-50 p-6 rounded-xl mb-8">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Order {selectedOrder.orderId}</h3>
                          <p className="text-gray-600">
                            Booked on {formatDate(selectedOrder.orderDate)}
                          </p>
                          {selectedOrder.deliveredDate && (
                            <p className="text-gray-600">
                              Delivered on {formatDate(selectedOrder.deliveredDate)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          
                          <div className="flex gap-2 justify-end flex-wrap">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                              {selectedOrder.orderStatus}
                            </span>
                            {selectedOrder.confirmationStatus && selectedOrder.confirmationStatus !== 'Pending' && (
                              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.confirmationStatus)}`}>
                                {selectedOrder.confirmationStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Order Details */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        {selectedOrder.razorpayOrderId && (
                          <div>
                            <p className="text-sm text-gray-500">Razorpay Order ID</p>
                            <p className="font-medium">{selectedOrder.razorpayOrderId}</p>
                          </div>
                        )}
                        {selectedOrder.paymentId && (
                          <div>
                            <p className="text-sm text-gray-500">Payment ID</p>
                            <p className="font-medium">{selectedOrder.paymentId}</p>
                          </div>
                        )}
                        {selectedOrder.trackingNumber && (
                          <div>
                            <p className="text-sm text-gray-500">Tracking Number</p>
                            <p className="font-medium">{selectedOrder.trackingNumber}</p>
                          </div>
                        )}
                        {selectedOrder.carrierName && (
                          <div>
                            <p className="text-sm text-gray-500">Carrier</p>
                            <p className="font-medium">{selectedOrder.carrierName}</p>
                          </div>
                        )}
                      </div>
                    </div>

                   

                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h3>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        <div className="space-y-4">
                          {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 p-5 rounded-lg border">
                              <div>
                                <p className="font-medium text-gray-800 text-lg">{item.ProductName || 'Unknown Product'}</p>
                                <div className="mt-2 flex gap-6 text-sm text-gray-600">
                                
                                  <span>Quantity: {item.Quantity || 1}</span>
                                  <span>Price: {formatCurrency(item.Price)} each</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-[#586330]">
                                  {formatCurrency((item.Price || 0) * (item.Quantity || 1))}
                                </p>
                                
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No items found for this order</p>
                        </div>
                      )}
                    </div>

                    {/* Shipping Address */}
                    {selectedOrder.shippingAddress && (
                      <div className="mt-8 pt-8 border-t">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Shipping Address</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700">{selectedOrder.shippingAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-20 text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Package size={60} className="text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-700 mb-3">Select an Order</h3>
                    <p className="text-gray-500 max-w-md mx-auto text-center">
                      Click on an order from the list on the left to view its details, customer information, and items purchased.
                    </p>
                  </div>
                )
              ) : (
                selectedReturn ? (
                  <div className="bg-white rounded-xl shadow-lg p-8">
                    {/* Return Details Header */}
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Return Request {selectedReturn.returnId}</h2>
                      <div className="flex items-center gap-4 text-gray-600">
                        <span>{selectedReturn.customerName}</span>
                        <span className="text-gray-400">•</span>
                        <span>{selectedReturn.orderNumber}</span>
                      </div>
                    </div>

                    {/* Return Summary */}
                    <div className="bg-[#586330]/20 p-6 rounded-xl mb-8 border border-purple-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">Return Details</h3>
                          <p className="text-gray-600">
                            Return requested on {formatDate(selectedReturn.returnDate)}
                          </p>
                         
                        </div>
                        <div className="text-right">
                          <div className={`px-4 py-2 rounded-full text-sm font-medium ${getReturnStatusColor(selectedReturn.status)} mb-2`}>
                            {selectedReturn.status}
                          </div>
                         
                        </div>
                      </div>
                      
                      {/* Return Info Grid */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        {selectedReturn.carrierName && (
                          <div>
                            <p className="text-sm text-gray-500">Carrier</p>
                            <p className="font-medium">{selectedReturn.carrierName}</p>
                          </div>
                        )}
                        
                        
                        
                      </div>
                    </div>

                    {/* Vendor Action - Confirm Receipt */}
                    {selectedReturn.status === 'Shipped' && (
                      <div className="mb-8">
                        <div className="bg-[#586330]/20 border border-[#586330]/20 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-[#586330] mb-3 flex items-center gap-2">
                            <CheckCircle size={20} />
                            Action Required
                          </h4>
                          <p className="text-gray-700 mb-4">
                            The returned items have been shipped to you. Please confirm receipt once you receive the package.
                          </p>
                          <button
                            onClick={() => {
                              if (window.confirm('Confirm that you have received the returned items? This will update the return status to "Confirmed" and restock the products.')) {
                                handleConfirmReturnReceipt(selectedReturn.returnId);
                              }
                            }}
                            className="px-6 py-3 bg-[#586330] text-white rounded-lg  transition font-medium flex items-center gap-2"
                          >
                            <CheckCircle size={20} />
                            Confirm Receipt 
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Return Reason */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FileText size={20} />
                        Return Reason
                      </h3>
                      <div className="bg-[#586330]/10 border border-[#586330] p-4 rounded-lg">
                        <p className="text-gray-700 italic">"{selectedReturn.reason || 'No reason provided'}"</p>
                      </div>
                    </div>

                    {/* Return Items */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Items:({selectedReturn.items?.length || 0})</h3>
                      {selectedReturn.items && selectedReturn.items.length > 0 ? (
                        <div className="space-y-4">
                          {selectedReturn.items.map((item, idx) => {
                            // Handle both object structures
                            const productName = item.productName || item.ProductName || 'Unknown Product';
                           
                            const quantity = item.quantity || item.Quantity || 1;
                            const price = item.price || item.Price || 0;
                            
                            return (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 p-5 rounded-lg border">
                                <div>
                                  <p className="font-medium text-gray-800 text-lg">{productName}</p>
                                  <div className="mt-2 flex gap-6 text-sm text-gray-600">
                                   
                                    <span>Quantity: {quantity}</span>
                                    <span>Price: {formatCurrency(price)} each</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold ">
                                    {formatCurrency(price * quantity)}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">Item Total</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No items found for this return</p>
                        </div>
                      )}
                    </div>

                    {/* Customer Information */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User size={20} />
                        Customer Information
                      </h3>
                      <div className="bg-gray-50 p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <User size={18} className="text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-medium">{selectedReturn.customerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail size={18} className="text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium">{selectedReturn.customerEmail}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Phone size={18} className="text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="font-medium">{selectedReturn.customerPhone}</p>
                            </div>
                          </div>
                          {selectedReturn.shippingAddress && selectedReturn.shippingAddress !== 'N/A' && (
                            <div className="flex items-start gap-3">
                              <MapPin size={18} className="text-gray-500 mt-1" />
                              <div>
                                <p className="text-sm text-gray-500">Shipping Address</p>
                                <p className="font-medium">{selectedReturn.shippingAddress}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-20 text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Truck size={60} className="text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-700 mb-3">Select a Return Request</h3>
                    <p className="text-gray-500 max-w-md mx-auto text-center">
                      Click on a return request from the list on the left to view its details, items being returned, and shipping information.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;