import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../../Components/Vendor/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../Components/utils/axiosInstance';

const Invoices = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchVendorOrders(), fetchVendorInvoices()]);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorOrders = async () => {
    try {
      const response = await axiosInstance.get('/Order/vendor/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  const fetchVendorInvoices = async () => {
    try {
      const response = await axiosInstance.get('/Order/vendor/invoices');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      toast.error('Failed to load invoices');
    }
  };

  const handleShipOrder = async (orderId) => {
    const carrierName = prompt('Enter Carrier Name (e.g., Delhivery, BlueDart):');
    if (!carrierName) return;

    const trackingNumber = prompt('Enter Tracking Number:');
    if (!trackingNumber) return;

    try {
      setLoading(true);
      const response = await axiosInstance.post(`/Order/${orderId}/ship`, {
        carrierName,
        trackingNumber,
      });

      toast.success(`Order shipped! Invoice ${response.data.invoiceNumber} generated.`);
      fetchData(); // Refresh both lists
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to ship order');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    if (!window.confirm('Mark this order as Delivered?')) return;

    try {
      setLoading(true);
      await axiosInstance.post(`/Order/${orderId}/deliver`);
      toast.success('Order marked as Delivered!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as delivered');
    } finally {
      setLoading(false);
    }
  };

  // View Invoice Details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  // View Order Details
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Print Invoice
  const handlePrintInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    
    // Small delay to ensure modal renders
    setTimeout(() => {
      setShowInvoiceModal(true);
      
      // Another small delay to ensure content is rendered
      setTimeout(() => {
        const printContent = document.getElementById('invoice-print-content');
        if (printContent) {
          const originalContent = document.body.innerHTML;
          const printContentHTML = printContent.innerHTML;
          
          document.body.innerHTML = printContentHTML;
          window.print();
          document.body.innerHTML = originalContent;
          
          // Refresh the page to restore functionality
          window.location.reload();
        }
      }, 500);
    }, 100);
  };

  // Send Invoice via Email
  const handleSendEmail = (invoice) => {
    // Show a custom modal for email
    const email = prompt('Enter customer email address:', invoice.Order?.CustomerEmail || '');
    if (email) {
      sendInvoiceEmail(invoice, email);
    }
  };

  const sendInvoiceEmail = async (invoice, email) => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setSendingEmail(true);
      // This would typically call your backend API
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Invoice sent to ${email}`);
      
      // In a real implementation, you would call:
      // await axiosInstance.post('/email/send-invoice', {
      //   invoiceId: invoice.InvoiceId,
      //   email: email
      // });
      
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amt || 0);

  const formatDate = (d) =>
    !d
      ? 'N/A'
      : new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

  const formatDateFull = (d) =>
    !d
      ? 'N/A'
      : new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const s = status.toLowerCase();
    if (['confirmed', 'completed', 'delivered', 'paid'].includes(s))
      return 'bg-green-100 text-green-800';
    if (['pending', 'processing'].includes(s)) return 'bg-yellow-100 text-yellow-800';
    if (['shipped', 'in-transit'].includes(s)) return 'bg-blue-100 text-blue-800';
    if (s === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const canShip = (order) =>
    ['Pending', 'Confirmed'].includes(order.Status || order.status);

  const canDeliver = (order) =>
    ['Shipped'].includes(order.Status || order.status);

  return (
    <>
      <ToastContainer position="top-right" />
      
      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Order #{selectedOrder.OrderId}
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
            
            <div className="p-8">
              {/* Order Header */}
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-gray-700 mb-2">Customer Details:</h3>
                    <p className="font-medium">{selectedOrder.CustomerName || 'Customer'}</p>
                    <p className="text-gray-600">{selectedOrder.CustomerEmail}</p>
                    <p className="text-gray-600">Customer ID: {selectedOrder.CustomerId}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-gray-700 mb-2">Order Details:</h3>
                    <p className="text-gray-600">
                      <span className="font-medium">Order Date:</span> {formatDateFull(selectedOrder.OrderDate || selectedOrder.CreatedOn)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.Status)}`}>
                        {selectedOrder.Status || 'Pending'}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Confirmation:</span> 
                      <span className={`ml-2 px-3 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.ConfirmationStatus)}`}>
                        {selectedOrder.ConfirmationStatus || 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Items Table */}
              <div className="mb-8">
                <h3 className="font-bold text-gray-700 mb-4">Order Items:</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 border">Product</th>
                      <th className="text-left p-3 border">Quantity</th>
                      <th className="text-left p-3 border">Unit Price</th>
                      <th className="text-left p-3 border">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.Items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-3 border">{item.ProductName}</td>
                        <td className="p-3 border">{item.Quantity}</td>
                        <td className="p-3 border">{formatCurrency(item.Price)}</td>
                        <td className="p-3 border font-medium">{formatCurrency(item.Price * item.Quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.TotalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-[#586330]">{formatCurrency(selectedOrder.TotalAmount)}</span>
                  </div>
                </div>
              </div>
              
              {/* Shipping Address */}
              {selectedOrder.ShippingAddress && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="font-bold text-gray-700 mb-2">Shipping Address:</h3>
                  <p className="text-gray-700">{selectedOrder.ShippingAddress}</p>
                </div>
              )}
              
              {/* Actions */}
              <div className="mt-8 pt-8 border-t">
                <div className="flex gap-4">
                  {canShip(selectedOrder) && (
                    <button
                      onClick={() => {
                        setShowOrderModal(false);
                        handleShipOrder(selectedOrder.OrderId);
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Ship Order
                    </button>
                  )}
                  {canDeliver(selectedOrder) && (
                    <button
                      onClick={() => {
                        setShowOrderModal(false);
                        handleMarkDelivered(selectedOrder.OrderId);
                      }}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Invoice Preview Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Invoice #{selectedInvoice.InvoiceNumber}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* Invoice Content for Print/Download */}
            <div id="invoice-print-content" className="p-8">
              {/* Invoice Header */}
              <div className="mb-8 pb-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                    <p className="text-gray-600">#{selectedInvoice.InvoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-[#586330]">DEALSY</h2>
                    <p className="text-gray-600">Vendor Platform</p>
                  </div>
                </div>
              </div>
              
              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">Bill To:</h3>
                  <p className="font-medium">{selectedInvoice.Order?.CustomerName || 'Customer'}</p>
                  <p className="text-gray-600">{selectedInvoice.Order?.CustomerEmail}</p>
                  <p className="text-gray-600">{selectedInvoice.Order?.ShippingAddress || 'Address not provided'}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-gray-700 mb-2">Invoice Details:</h3>
                  <p className="text-gray-600">
                    <span className="font-medium">Invoice Date:</span> {formatDateFull(selectedInvoice.InvoiceDate)}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Order ID:</span> {selectedInvoice.Order?.OrderId}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Status:</span> {selectedInvoice.OrderStatus}
                  </p>
                  {selectedInvoice.TrackingNumber && (
                    <p className="text-gray-600">
                      <span className="font-medium">Tracking:</span> {selectedInvoice.TrackingNumber}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 border">Product</th>
                      <th className="text-left p-3 border">Quantity</th>
                      <th className="text-left p-3 border">Unit Price</th>
                      <th className="text-left p-3 border">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.Order?.Items?.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-3 border">{item.ProductName}</td>
                        <td className="p-3 border">{item.Quantity}</td>
                        <td className="p-3 border">{formatCurrency(item.Price)}</td>
                        <td className="p-3 border font-medium">{formatCurrency(item.Price * item.Quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.Amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Tax (if any):</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-[#586330]">{formatCurrency(selectedInvoice.Amount)}</span>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="mt-12 pt-8 border-t text-center text-gray-500 text-sm">
                <p>Thank you for your business!</p>
                <p className="mt-2">This is a computer-generated invoice. No signature required.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          handleLogout={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            navigate('/');
          }}
          activeView="invoices"
        />

        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Order & Invoice Management
          </h1>
          <p className="text-gray-600 mb-8">Pending → Shipped → Delivered</p>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'orders'
                  ? 'text-[#586330] border-b-2 border-[#586330]'
                  : 'text-gray-500'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'invoices'
                  ? 'text-[#586330] border-b-2 border-[#586330]'
                  : 'text-gray-500'
              }`}
            >
              Invoices ({invoices.length})
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#586330]"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          )}

          {/* Orders Tab */}
          {!loading && activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-orange-50 p-4 font-bold text-lg">
                Orders ({orders.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#586330] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">Order ID</th>
                      <th className="px-6 py-4 text-left">Customer</th>
                      <th className="px-6 py-4 text-left">Total</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-left">Confirmation</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.OrderId || order.id}
                        className="border-b hover:bg-[#F5F1E8]"
                      >
                        <td className="px-6 py-4 font-medium">
                          Order {order.OrderId || order.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {order.CustomerName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.CustomerEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#586330]">
                          {formatCurrency(order.TotalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                              order.Status
                            )}`}
                          >
                            {order.Status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                              order.ConfirmationStatus
                            )}`}
                          >
                            {order.ConfirmationStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {formatDate(order.CreatedOn || order.OrderDate)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {/* VIEW button - always shows */}
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            
                            {/* SHIP button - only shows when applicable */}
                            {canShip(order) && (
                              <button
                                onClick={() => handleShipOrder(order.OrderId || order.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                              >
                                Ship
                              </button>
                            )}
                            
                            {/* DELIVER button - only shows when applicable */}
                            {canDeliver(order) && (
                              <button
                                onClick={() =>
                                  handleMarkDelivered(order.OrderId || order.id)
                                }
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                              >
                                Deliver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-gray-500">
                          No orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {!loading && activeTab === 'invoices' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-orange-50 p-4 font-bold text-lg">
                Invoices ({invoices.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#586330] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">Invoice No.</th>
                      <th className="px-6 py-4 text-left">Order ID</th>
                      <th className="px-6 py-4 text-left">Customer</th>
                      <th className="px-6 py-4 text-left">Amount</th>
                      <th className="px-6 py-4 text-left">Invoice Date</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-left">Tracking ID</th>
                      <th className="px-6 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv.InvoiceId}
                        className="border-b hover:bg-[#F5F1E8]"
                      >
                        <td className="px-6 py-4 font-medium">
                          {inv.InvoiceNumber || `INV-${inv.InvoiceId}`}
                        </td>
                        <td className="px-6 py-4">Order {inv.Order?.OrderId}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {inv.Order?.CustomerName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inv.Order?.CustomerEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#586330]">
                          {formatCurrency(inv.Amount)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {formatDate(inv.InvoiceDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                              inv.OrderStatus
                            )}`}
                          >
                            {inv.OrderStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">
                          {inv.TrackingNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleViewInvoice(inv)}
                              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            <button
                              onClick={() => handlePrintInvoice(inv)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print
                            </button>
                            <button
                              onClick={() => handleSendEmail(inv)}
                              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs flex items-center gap-1"
                              disabled={sendingEmail}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {sendingEmail ? 'Sending...' : 'Email'}
                            </button>
                            {inv.OrderStatus === 'Shipped' && (
                              <button
                                onClick={() => handleMarkDelivered(inv.Order?.OrderId)}
                                className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs"
                              >
                                Deliver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-10 text-gray-500">
                          No invoices generated yet. Ship an order to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Invoices;