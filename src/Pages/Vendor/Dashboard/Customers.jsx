import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../../Components/Vendor/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../Components/utils/axiosInstance';

const Customers = () => {
  const navigate = useNavigate();
  const [vendorOrders, setVendorOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tempUserData');
    navigate('/');
  };

  const activeView = 'customers';

  useEffect(() => {
    fetchVendorOrders();
  }, []);

  const fetchVendorOrders = async () => {
    try {
      setLoading(true);
      console.log("Fetching vendor orders...");

      const response = await axiosInstance.get('/Order/vendor/orders');
      console.log("Full API Response:", response);
      console.log("Response Data:", JSON.stringify(response.data, null, 2));

      const ordersData = response.data.orders || [];
      console.log("Processed Orders Count:", ordersData.length);
      
      // Log each order details
      ordersData.forEach((order, index) => {
        console.log(`Order ${index + 1}:`, {
          OrderId: order.OrderId,
          ItemsCount: order.Items?.length || 0,
          Items: order.Items?.map(item => ({
            ProductId: item.ProductId,
            ProductName: item.ProductName
          }))
        });
      });

      setVendorOrders(ordersData);

      if (ordersData.length === 0) {
        console.warn("No orders received from API");
        toast.info("No customer orders found for your products");
      }
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      console.error('Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      toast.error('Failed to load customer orders');
      setVendorOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Flatten orders - each order is separate
  const getFlattenedOrders = () => {
    const flattenedOrders = [];

    vendorOrders.forEach(order => {
      flattenedOrders.push({
        orderId: order.OrderId,
        customerId: order.CustomerId,
        customerName: order.CustomerName || 'Unknown Customer',
        customerEmail: order.CustomerEmail || 'No email',
        totalAmount: Number(order.TotalAmount) || 0,
        orderDate: order.OrderDate || order.CreatedOn,
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

    // Sort by date, newest first
    return flattenedOrders.sort((a, b) => 
      new Date(b.orderDate) - new Date(a.orderDate)
    );
  };

  // Get unique customers for stats
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
      customer.orderIds.push(order.OrderId);
    });
    
    return Array.from(customerMap.values());
  };

  const flattenedOrders = getFlattenedOrders();
  const uniqueCustomers = getUniqueCustomers();

  console.log("Flattened Orders:", flattenedOrders);
  console.log("Flattened Orders Count:", flattenedOrders.length);
  console.log("Unique Customers Count:", uniqueCustomers.length);

  const filteredOrders = flattenedOrders.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderId.toString().includes(searchTerm)
  );

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);

    // Calculate stats for this customer
    const customerOrders = flattenedOrders.filter(o => 
      o.customerId === order.customerId
    );
    
    const orders = customerOrders || [];
    const stats = {
      totalOrders: orders.length || 0,
      completedOrders: orders.filter(o =>
        ['Delivered', 'Completed', 'Confirmed'].includes(o.orderStatus)
      ).length,
      pendingOrders: orders.filter(o =>
        ['Pending', 'Processing', 'Shipped'].includes(o.orderStatus)
      ).length,
      returnedOrders: orders.filter(o => o.confirmationStatus === 'Returned').length,
      totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      customerName: order.customerName,
      customerEmail: order.customerEmail
    };

    setCustomerStats(stats);
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
      minimumFractionDigits: 0
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

  const handleRefresh = () => {
    fetchVendorOrders();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar handleLogout={handleLogout} activeView={activeView} />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Orders & Customers</h1>
          <p className="text-gray-600 mt-1">View all orders and customer details</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{flattenedOrders.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Orders</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{uniqueCustomers.length}</div>
            <div className="text-sm text-gray-600 mt-1">Unique Customers</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(flattenedOrders.reduce((sum, o) => sum + o.totalAmount, 0))}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Revenue</div>
          </div>
        </div>

        {/* Search & Refresh */}
        <div className="mb-8 bg-white p-5 rounded-xl shadow-sm">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search by customer name, email, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586330]"
            />
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-[#586330] text-white rounded-lg hover:bg-[#4a5428] transition font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               
              </svg>
              search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
            <span className="ml-4 text-lg text-gray-600">Loading orders...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#586330] text-white p-5">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Orders ({filteredOrders.length})</h2>
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                      {uniqueCustomers.length} customers
                    </span>
                  </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-4xl">📦</span>
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
            </div>

            {/* Order Details */}
            <div className="lg:col-span-2">
              {selectedOrder ? (
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
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Order #{selectedOrder.orderId}</h3>
                        <p className="text-gray-600">
                          Placed on {formatDate(selectedOrder.orderDate)}
                        </p>
                        {selectedOrder.deliveredDate && (
                          <p className="text-gray-600">
                            Delivered on {formatDate(selectedOrder.deliveredDate)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-[#586330] mb-3">
                          {formatCurrency(selectedOrder.totalAmount)}
                        </p>
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

                  {/* Customer Stats */}
                  {customerStats && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                          <div className="text-2xl font-bold text-blue-600">{customerStats.totalOrders}</div>
                          <div className="text-sm text-blue-800 mt-1">Total Orders</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                          <div className="text-2xl font-bold text-green-600">{customerStats.completedOrders}</div>
                          <div className="text-sm text-green-800 mt-1">Completed</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-xl text-center border border-yellow-100">
                          <div className="text-2xl font-bold text-yellow-600">{customerStats.pendingOrders}</div>
                          <div className="text-sm text-yellow-800 mt-1">Pending/Shipped</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                          <div className="text-2xl font-bold text-red-600">{customerStats.returnedOrders}</div>
                          <div className="text-sm text-red-800 mt-1">Returned</div>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-gray-600">
                          Total spent: <span className="font-bold text-[#586330]">{formatCurrency(customerStats.totalSpent)}</span>
                        </p>
                      </div>
                    </div>
                  )}

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
                                <span>Product ID: {item.ProductId}</span>
                                <span>Quantity: {item.Quantity || 1}</span>
                                <span>Price: {formatCurrency(item.Price)} each</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-[#586330]">
                                {formatCurrency((item.Price || 0) * (item.Quantity || 1))}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">Subtotal</p>
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
                    <span className="text-6xl">📦</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-3">Select an Order</h3>
                  <p className="text-gray-500 max-w-md mx-auto text-center">
                    Click on an order from the list on the left to view its details, customer information, and items purchased.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;