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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
  // Group orders by customer
  const getCustomersFromOrders = () => {


    const customersMap = new Map();

    vendorOrders.forEach(order => {
      const customerId = order.CustomerId;
      const customerName = order.CustomerName || 'Unknown Customer';
      const customerEmail = order.CustomerEmail || 'No email';
      const orderId = order.OrderId;
      const totalAmount = Number(order.TotalAmount) || 0;
      const orderDate = order.OrderDate || order.CreatedOn;

      if (!customersMap.has(customerId)) {
        customersMap.set(customerId, {
          customerId,
          fullName: customerName,
          email: customerEmail,
          totalOrders: 0,
          totalSpent: 0,
          orders: [],
          lastOrderDate: orderDate
        });
      }

      const customer = customersMap.get(customerId);
      customer.totalOrders += 1;
      customer.totalSpent += totalAmount;

      customer.orders.push({
        orderId,
        totalAmount,
        orderDate,
        orderStatus: order.Status || 'Pending',
        confirmationStatus: order.ConfirmationStatus || 'Pending',
        items: order.Items || []
      });

      // Update last order date
      if (new Date(orderDate) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = orderDate;
      }
    });

    return Array.from(customersMap.values())
      .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
  };

  const customers = getCustomersFromOrders();
console.log("Grouped Customers:", customers);
console.log("Customers Count:", customers.length);

  const filteredCustomers = customers.filter(customer =>
    customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);

    const orders = customer.orders || [];
    const stats = {
      totalOrders: customer.totalOrders || 0,
      completedOrders: orders.filter(o =>
        ['Delivered', 'Completed', 'Confirmed'].includes(o.orderStatus)
      ).length,
      pendingOrders: orders.filter(o =>
        ['Pending', 'Processing', 'Shipped'].includes(o.orderStatus)
      ).length,
      returnedOrders: orders.filter(o => o.confirmationStatus === 'Returned').length,
      totalSpent: customer.totalSpent || 0,
      averageOrderValue: customer.totalOrders > 0
        ? (customer.totalSpent / customer.totalOrders).toFixed(2)
        : '0'
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
          <h1 className="text-3xl font-bold text-gray-800">My Customers</h1>
          <p className="text-gray-600 mt-1">View customers who purchased your products</p>
        </div>

        {/* Search & Refresh */}
        <div className="mb-8 bg-white p-5 rounded-xl shadow-sm">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586330]"
            />
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-[#586330] text-white rounded-lg hover:bg-[#4a5428] transition font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
            <span className="ml-4 text-lg text-gray-600">Loading customers...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#586330] text-white p-5">
                  <h2 className="text-xl font-semibold">Customers ({filteredCustomers.length})</h2>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-4xl">👥</span>
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        {searchTerm ? 'No matching customers' : 'No customers yet'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {searchTerm ? 'Try a different search' : 'Customers will appear here once they buy your products'}
                      </p>
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.customerId}
                        onClick={() => handleCustomerSelect(customer)}
                        className={`p-5 border-b border-gray-100 cursor-pointer transition-all hover:bg-[#f8f6f0] ${
                          selectedCustomer?.customerId === customer.customerId
                            ? 'bg-[#f8f6f0] border-l-4 border-l-[#586330]'
                            : ''
                        }`}
                      >
                        <h3 className="font-semibold text-gray-800 text-lg">{customer.fullName}</h3>
                        <p className="text-sm text-gray-600 truncate">{customer.email}</p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                            {customer.totalOrders} order{customer.totalOrders !== 1 ? 's' : ''}
                          </span>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                          Last order: {formatDate(customer.lastOrderDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="lg:col-span-2">
              {selectedCustomer ? (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedCustomer.fullName}</h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 p-5 rounded-xl text-center border border-blue-100">
                      <div className="text-3xl font-bold text-blue-600">{customerStats.totalOrders}</div>
                      <div className="text-sm text-blue-800 mt-1">Total Orders</div>
                    </div>
                    <div className="bg-green-50 p-5 rounded-xl text-center border border-green-100">
                      <div className="text-3xl font-bold text-green-600">{customerStats.completedOrders}</div>
                      <div className="text-sm text-green-800 mt-1">Completed</div>
                    </div>
                    <div className="bg-yellow-50 p-5 rounded-xl text-center border border-yellow-100">
                      <div className="text-3xl font-bold text-yellow-600">{customerStats.pendingOrders}</div>
                      <div className="text-sm text-yellow-800 mt-1">Pending/Shipped</div>
                    </div>
                    <div className="bg-red-50 p-5 rounded-xl text-center border border-red-100">
                      <div className="text-3xl font-bold text-red-600">{customerStats.returnedOrders}</div>
                      <div className="text-sm text-red-800 mt-1">Returned</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Order History ({selectedCustomer.orders.length})
                    </h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Average Order Value</p>
                      <p className="text-2xl font-bold text-[#586330]">
                        {formatCurrency(customerStats.averageOrderValue)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    {selectedCustomer.orders.map((order) => (
                      <div key={order.orderId} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <p className="text-lg font-semibold text-gray-800">Order #{order.orderId}</p>
                            <p className="text-sm text-gray-600">
                              {order.orderDate ? formatDate(order.orderDate) : 'Date not available'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#586330] mb-3">
                              {formatCurrency(order.totalAmount)}
                            </p>
                            <div className="flex gap-2 justify-end flex-wrap">
                              <span className={`px-4 py-2 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                                {order.orderStatus}
                              </span>
                              {order.confirmationStatus && order.confirmationStatus !== 'Pending' && (
                                <span className={`px-4 py-2 rounded-full text-xs font-medium ${getStatusColor(order.confirmationStatus)}`}>
                                  {order.confirmationStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {order.items && order.items.length > 0 && (
                          <div className="border-t pt-5">
                            <h4 className="font-medium text-gray-700 mb-4">Purchased Items:</h4>
                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                  <div className="flex items-center gap-4">
                                    {item.ProductImage ? (
                                      <img
                                        src={item.ProductImage}
                                        alt={item.ProductName}
                                        className="w-14 h-14 object-cover rounded-lg border"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div className="w-14 h-14 bg-gray-200 rounded-lg border flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">No image</span>
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-gray-800">{item.ProductName || 'Unknown Product'}</p>
                                      <p className="text-sm text-gray-600">Quantity: {item.Quantity || 1}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">{formatCurrency(item.Price)} each</p>
                                    <p className="font-semibold text-[#586330]">
                                      {formatCurrency((item.Price || 0) * (item.Quantity || 1))}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-20 text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <span className="text-6xl">👤</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-3">Select a Customer</h3>
                  <p className="text-gray-500 max-w-md mx-auto text-center">
                    Click on a customer from the list on the left to view their order history, spending, and purchase details.
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