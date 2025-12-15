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
                            {canShip(order) && (
                              <button
                                onClick={() => handleShipOrder(order.OrderId || order.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Ship
                              </button>
                            )}
                            {canDeliver(order) && (
                              <button
                                onClick={() =>
                                  handleMarkDelivered(order.OrderId || order.id)
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
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
                          {inv.OrderStatus === 'Shipped' && (
                            <button
                              onClick={() =>
                                handleMarkDelivered(inv.Order?.OrderId)
                              }
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Mark Delivered
                            </button>
                          )}
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