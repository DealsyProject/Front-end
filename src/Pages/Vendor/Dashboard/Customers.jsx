import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../../Components/Vendor/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../Components/utils/axiosInstance';

const Customers = () => {
  const navigate = useNavigate();
  const [vendorOrders, setVendorOrders] = useState([]);
  const [invoices, setInvoices] = useState([]); // Added invoices state
  const [loading, setLoading] = useState(false);
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

  // Fetch both vendor orders and invoices
  useEffect(() => {
    fetchVendorOrders();
    fetchInvoices();
  }, []);

  const fetchVendorOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/Order/vendor/orders');
      console.log('Vendor Orders API Response:', response.data);

      const ordersData = response.data.orders || response.data || [];
      
      const formattedOrders = ordersData.map(order => ({
        orderId: order.orderId || order.OrderId || order.id,
        customerId: order.customerId || order.CustomerId,
        customerName: order.customerName || order.CustomerName || 'Unknown Customer',
        customerEmail: order.customerEmail || order.CustomerEmail || 'No email',
        totalAmount: order.totalAmount || order.TotalAmount || 0,
        status: order.status || order.Status || 'Pending',
        orderDate: order.orderDate || order.OrderDate || order.createdOn || order.CreatedOn,
        items: order.items || order.Items || []
      }));

      setVendorOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      toast.error('Failed to load orders');
      setVendorOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch invoices to get latest statuses
  const fetchInvoices = async () => {
    try {
      const response = await axiosInstance.get('/Order/vendor/invoices');
      const invoicesData = response.data.invoices || response.data || [];
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Continue without invoices if there's an error
    }
  };

  // Get the correct order status by checking invoices first, then orders
  const getCorrectOrderStatus = (orderId) => {
    // First check if there's an invoice with updated status
    const invoice = invoices.find(inv => 
      inv.orderId === orderId || 
      inv.OrderId === orderId ||
      (inv.Order && (inv.Order.orderId === orderId || inv.Order.OrderId === orderId))
    );

    if (invoice) {
      // Check for confirmation status first (from invoices)
      if (invoice.ConfirmationStatus) {
        return invoice.ConfirmationStatus;
      }
      if (invoice.confirmationStatus) {
        return invoice.confirmationStatus;
      }
      // Check for order status
      if (invoice.OrderStatus) {
        return invoice.OrderStatus;
      }
      if (invoice.orderStatus) {
        return invoice.orderStatus;
      }
    }

    // If no invoice or no status in invoice, return order status
    const order = vendorOrders.find(o => o.orderId === orderId);
    return order ? order.status : 'Pending';
  };

  // Group orders by customer with corrected statuses
  const getCustomersFromOrders = () => {
    const customersMap = new Map();

    vendorOrders.forEach(order => {
      const customerId = order.customerId;
      const correctedStatus = getCorrectOrderStatus(order.orderId);
      
      if (!customersMap.has(customerId)) {
        customersMap.set(customerId, {
          customerId: customerId,
          fullName: order.customerName,
          email: order.customerEmail,
          totalOrders: 0,
          totalSpent: 0,
          orders: [],
          lastOrderDate: order.orderDate
        });
      }

      const customer = customersMap.get(customerId);
      customer.totalOrders += 1;
      customer.totalSpent += order.totalAmount;
      
      // Create order object with corrected status
      const orderWithCorrectedStatus = {
        ...order,
        status: correctedStatus
      };
      
      customer.orders.push(orderWithCorrectedStatus);
      
      // Update last order date if this order is newer
      if (new Date(order.orderDate) > new Date(customer.lastOrderDate || 0)) {
        customer.lastOrderDate = order.orderDate;
      }
    });

    return Array.from(customersMap.values());
  };

  const customers = getCustomersFromOrders();

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    // Search is handled client-side in filteredCustomers
  };

  const handleCustomerSelect = (customer) => {
    setSelectedOrder(customer);
    
    // Get statuses with corrected order statuses
    const orders = customer.orders || [];
    const stats = {
      totalOrders: customer.totalOrders || 0,
      completedOrders: orders.filter(o => 
        ['Completed', 'Delivered', 'Confirmed', 'Paid', 'Paided'].includes(o.status)
      ).length,
      pendingOrders: orders.filter(o => 
        ['Pending', 'Processing'].includes(o.status)
      ).length,
      returnedOrders: orders.filter(o => 
        ['Returned', 'Refunded'].includes(o.status)
      ).length,
      totalSpent: customer.totalSpent || 0,
      averageOrderValue: (customer.totalOrders || 0) > 0 
        ? ((customer.totalSpent || 0) / (customer.totalOrders || 1)).toFixed(2)
        : 0
    };
    setCustomerStats(stats);
  };

  // Update stats grid to include returned orders
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

  const filteredCustomers = customers.filter(customer =>
    customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Updated status color mapping to match invoice statuses
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusLower = status.toLowerCase();
    
    switch (statusLower) {
      case 'confirmed':
      case 'completed':
      case 'delivered':
      case 'paid':
      case 'paided':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
      case 'in-transit':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Refresh all data
  const handleRefresh = () => {
    fetchVendorOrders();
    fetchInvoices();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar handleLogout={handleLogout} activeView={activeView} />

      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Customers</h1>
          <p className="text-gray-600 mt-1">View customers who purchased your products</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586330] focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-[#586330] text-white rounded-lg hover:bg-[#5A3E3E] transition font-medium"
            >
              Search
            </button>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium"
            >
              Refresh
            </button>
          </div>
          
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
            <span className="ml-3 text-gray-600">Loading customers...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#586330] text-white p-4">
                  <h2 className="text-xl font-semibold">Customers ({filteredCustomers.length})</h2>
                </div>
                <div className="max-h-screen overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      <p className="text-lg mb-2">No customers found</p>
                      <p className="text-sm text-gray-400 mb-4">
                        {searchTerm ? 'Try a different search term' : 'Customers who purchase your products will appear here'}
                      </p>
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.customerId}
                        onClick={() => handleCustomerSelect(customer)}
                        className={`p-5 border-b border-gray-200 cursor-pointer transition-all hover:bg-[#F5F1E8] ${
                          selectedOrder?.customerId === customer.customerId 
                            ? 'bg-[#F5F1E8] border-l-4 border-l-[#586330]' 
                            : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 text-lg mb-1">
                              {customer.fullName}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">{customer.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {customer.totalOrders} orders
                          </span>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            {formatCurrency(customer.totalSpent)}
                          </span>
                        </div>
                        {customer.lastOrderDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Last order: {formatDate(customer.lastOrderDate)}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details Panel */}
            <div className="lg:col-span-2">
              {selectedOrder ? (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedOrder.fullName}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Email:</strong> {selectedOrder.email}
                        </div>
                        <div>
                          <strong>Customer ID:</strong> {selectedOrder.customerId}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid - Updated to include returned orders */}
                  {customerStats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                        <div className="text-2xl font-bold text-blue-600">{customerStats.totalOrders}</div>
                        <div className="text-xs text-blue-800 font-medium">Total Orders</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                        <div className="text-2xl font-bold text-green-600">{customerStats.completedOrders}</div>
                        <div className="text-xs text-green-800 font-medium">Completed</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-100">
                        <div className="text-2xl font-bold text-yellow-600">{customerStats.pendingOrders}</div>
                        <div className="text-xs text-yellow-800 font-medium">Pending</div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100">
                        <div className="text-2xl font-bold text-purple-600">{customerStats.returnedOrders || 0}</div>
                        <div className="text-xs text-purple-800 font-medium">Returned</div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-lg text-center border border-amber-100">
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(customerStats.totalSpent)}</div>
                        <div className="text-xs text-amber-800 font-medium">Total amount</div>
                      </div>
                    </div>
                  )}

                  {/* Orders List */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Order History ({(selectedOrder.orders || []).length})
                      </h3>
                      {customerStats && (
                        <div className="text-sm text-gray-600">
                          Avg. Order: {formatCurrency(customerStats.averageOrderValue)}
                        </div>
                      )}
                    </div>
                    
                    {(selectedOrder.orders || []).length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {selectedOrder.orders.map((order, index) => {
                          const orderStatus = order.status || 'Unknown';
                          const orderId = order.orderId || `order-${index}`;
                          const totalAmount = order.totalAmount || 0;
                          const orderDate = order.orderDate;
                          const orderItems = order.items || [];

                          return (
                            <div key={orderId} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="font-semibold text-gray-800">Order #{orderId}</p>
                                  <p className="text-sm text-gray-600">
                                    {orderDate ? `Placed on ${formatDate(orderDate)}` : 'Date not available'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-[#586330]">{formatCurrency(totalAmount)}</p>
                                  <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(orderStatus)}`}>
                                    {orderStatus}
                                  </span>
                                </div>
                              </div>

                              {/* Order Items */}
                              {orderItems.length > 0 && (
                                <div className="border-t pt-3">
                                  <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
                                  <div className="space-y-2">
                                    {orderItems.map((item, itemIndex) => {
                                      const productName = item.productName || item.ProductName || 'Unknown Product';
                                      const quantity = item.quantity || item.Quantity || 1;
                                      const price = item.price || item.Price || 0;
                                      const itemTotal = item.totalAmount || item.TotalAmount || (quantity * price);

                                      return (
                                        <div key={itemIndex} className="flex justify-between items-center text-sm">
                                          <div className="flex items-center space-x-3">
                                            {item.productImage && (
                                              <img 
                                                src={item.productImage} 
                                                alt={productName}
                                                className="w-10 h-10 object-cover rounded"
                                              />
                                            )}
                                            <div>
                                              <span className="font-medium">{productName}</span>
                                              <span className="text-gray-500 ml-2">(Qty: {quantity})</span>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="font-medium">{formatCurrency(price)} each</span>
                                            <span className="ml-2 text-[#586330] font-semibold">
                                              = {formatCurrency(itemTotal)}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <span className="text-3xl">📦</span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">No Orders Yet</h4>
                        <p className="text-gray-500 max-w-md mx-auto">
                          This customer hasn't placed any orders with your products yet. 
                          They will appear here once they make a purchase.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-16 text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-2">Select a Customer</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Click on a customer from the list to view their details, order history, and statistics
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