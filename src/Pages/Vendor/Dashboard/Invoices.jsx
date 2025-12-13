import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../../Components/Vendor/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../Components/utils/axiosInstance';

const Invoices = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(false);

  // Modals
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const [shipmentDetails, setShipmentDetails] = useState({
    shipmentDate: '',
    carrierName: '',
    trackingNumber: '',
    items: []
  });

  useEffect(() => {
    const fetchData = async () => {
      await fetchVendorOrders();
      await fetchInvoices();
    };
    fetchData();
  }, []);

  const fetchVendorOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/Order/vendor/orders');
      const ordersData = response.data.orders || [];
      
      const transformedOrders = ordersData.map(order => ({
        ...order,
        orderId: order.OrderId || order.orderId || order.id,
        customerId: order.CustomerId || order.customerId,
        customerName: order.CustomerName || order.customerName || 'Unknown Customer',
        customerEmail: order.CustomerEmail || order.customerEmail || '',
        totalAmount: order.TotalAmount || order.totalAmount || 0,
        status: order.Status || order.status || 'Pending',
        orderDate: order.OrderDate || order.orderDate || order.createdOn,
        items: order.Items || order.items || [],
        deliveryStatus: getDeliveryStatus(order.Status || order.status),
        trackingNumber: order.TrackingNumber || order.trackingNumber || '',
        carrierName: order.CarrierName || order.carrierName || ''
      }));
      
      setPurchaseOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryStatus = (status) => {
    if (!status) return 'pending';
    
    switch (status.toLowerCase()) {
      case 'pending':
      case 'confirmed':
        return 'pending';
      case 'shipped':
        return 'in-transit';
      case 'delivered':
        return 'delivered';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await axiosInstance.get('/Order/vendor/invoices');
      const invoicesData = response.data.invoices || response.data || [];
      
      const transformedInvoices = invoicesData.map(invoice => {
        const orderData = invoice.Order || invoice.order || {};
        const items = invoice.Items || invoice.items || orderData.Items || orderData.items || [];
        const orderId = orderData.OrderId || orderData.orderId || invoice.OrderId;
        const relatedOrder = purchaseOrders.find(po => po.orderId == orderId);

        // Use stored statuses from backend
        const orderStatus = invoice.OrderStatus || 'Pending';
        const confirmationStatus = invoice.ConfirmationStatus || 'Pending';
        const shippedDate = invoice.ShippedDate || invoice.shippedDate;
        
        // Determine delivery status from stored order status
        let deliveryStatus = 'pending';
        if (orderStatus.toLowerCase() === 'delivered') {
          deliveryStatus = 'delivered';
        } else if (orderStatus.toLowerCase() === 'shipped') {
          deliveryStatus = 'in-transit';
        } else if (relatedOrder) {
          deliveryStatus = relatedOrder.deliveryStatus;
        }

        return {
          invoiceId: invoice.InvoiceId || invoice.invoiceId,
          invoiceNumber: invoice.InvoiceNumber || invoice.invoiceNumber,
          invoiceDate: invoice.InvoiceDate || invoice.invoiceDate,
          amount: invoice.Amount || invoice.amount || 0,
          carrierName: invoice.CarrierName || invoice.carrierName,
          trackingNumber: invoice.TrackingNumber || invoice.trackingNumber,
          shippedDate: shippedDate,
          deliveredDate: invoice.DeliveredDate || invoice.deliveredDate,
          orderId: orderId,
          customer: {
            name: orderData.CustomerName || orderData.customerName || invoice.CustomerName || 'Unknown Customer',
            email: orderData.CustomerEmail || orderData.customerEmail || invoice.CustomerEmail || ''
          },
          // Use stored statuses
          orderStatus: orderStatus,
          confirmationStatus: confirmationStatus,
          deliveryStatus: deliveryStatus,
          Items: items.map(item => ({
            ProductId: item.ProductId || item.productId,
            ProductName: item.ProductName || item.productName,
            Quantity: item.Quantity || item.quantity,
            Price: item.Price || item.price
          })),
          id: invoice.InvoiceId || invoice.invoiceId,
          date: invoice.InvoiceDate || invoice.invoiceDate,
          shipment: {
            carrier: invoice.CarrierName || invoice.carrierName,
            trackingNumber: invoice.TrackingNumber || invoice.trackingNumber
          }
        };
      });

      setInvoices(transformedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
      setInvoices([]);
    }
  };

  const markAsDelivered = async (po) => {
    try {
      await axiosInstance.post(`/Order/${po.orderId}/deliver`);
      toast.success('Order marked as delivered');
      
      // Update local state
      setPurchaseOrders(prev => 
        prev.map(order => 
          order.orderId === po.orderId 
            ? { ...order, status: 'Delivered', deliveryStatus: 'delivered' }
            : order
        )
      );
      
      // Update invoices state
      setInvoices(prev =>
        prev.map(inv =>
          inv.orderId === po.orderId
            ? { 
                ...inv, 
                orderStatus: 'Delivered', 
                confirmationStatus: 'Confirmed',
                deliveryStatus: 'delivered', 
                deliveredDate: new Date().toISOString() 
              }
            : inv
        )
      );

      setTimeout(() => {
        fetchVendorOrders();
        fetchInvoices();
      }, 300);
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const openShipmentModal = (po) => {
    setSelectedPO(po);
    setShipmentDetails({
      shipmentDate: new Date().toISOString().split('T')[0],
      carrierName: '',
      trackingNumber: '',
      items: po.items?.map(item => ({ 
        ...item, 
        shippedQty: item.Quantity || item.quantity || 0,
        id: item.ProductId || item.productId,
        productName: item.ProductName || item.productName,
        quantity: item.Quantity || item.quantity
      })) || []
    });
    setShowShipmentModal(true);
  };

  const confirmShipmentAndGenerateInvoice = async () => {
    if (!shipmentDetails.carrierName.trim() || !shipmentDetails.trackingNumber.trim()) {
      toast.error('Carrier Name and Tracking Number are required!');
      return;
    }
    
    const totalShipped = shipmentDetails.items.reduce((acc, item) => acc + (item.shippedQty || 0), 0);
    if (totalShipped === 0) {
      toast.error('At least one item must be shipped.');
      return;
    }

    try {
      const shippedItems = shipmentDetails.items
        .filter(i => i.shippedQty > 0)
        .map(i => ({
          orderItemId: i.id,
          shippedQuantity: i.shippedQty
        }));

      await axiosInstance.post(`/Order/${selectedPO.orderId}/ship`, {
        carrierName: shipmentDetails.carrierName,
        trackingNumber: shipmentDetails.trackingNumber,
        shippedItems: shippedItems
      });

      toast.success('Shipment confirmed and invoice generated!');
      setShowShipmentModal(false);
      fetchVendorOrders();
      fetchInvoices();
      setActiveTab('invoices');
    } catch (error) {
      console.error('Error confirming shipment:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm shipment');
    }
  };

  const calculateTotal = (items) => {
    if (!items) return 0;
    return items.reduce((sum, i) => sum + ((i.Quantity || i.quantity || 0) * (i.Price || i.price || 0)), 0);
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    minimumFractionDigits: 0 
  }).format(amt || 0);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Simplified invoice status function using stored confirmation status
  const getInvoiceStatus = (invoice) => {
    const status = invoice.confirmationStatus || 'Pending';
    
    const statusConfig = {
      'Confirmed': 'bg-green-100 text-green-800',
      'Paid': 'bg-green-100 text-green-800',
      'Paided': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
    };
    
    return {
      text: status,
      class: statusConfig[status] || 'bg-gray-100 text-gray-800'
    };
  };

  const handlePrintInvoice = (invoice) => {
    const items = invoice.Items || invoice.items || invoice.Order?.Items || [];
    const total = invoice.amount || calculateTotal(items);
    const invoiceNumber = invoice.InvoiceNumber || invoice.invoiceNumber || invoice.invoiceId || invoice.id;
    const invoiceDate = invoice.InvoiceDate || invoice.invoiceDate || invoice.date;
    
    // Use stored statuses
    const orderStatus = invoice.orderStatus || 'Pending';
    const confirmationStatus = invoice.confirmationStatus || 'Pending';
    
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              line-height: 1.6; 
              color: #333;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              border-bottom: 3px solid #6B4E4E; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .logo { 
              font-size: 32px; 
              font-weight: bold; 
              color: #6B4E4E; 
            }
            .company-info {
              text-align: left;
              font-size: 14px;
              color: #666;
            }
            .invoice-info {
              background: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
            }
            .info-section {
              margin-bottom: 15px;
            }
            .info-label {
              font-weight: bold;
              color: #6B4E4E;
              margin-bottom: 10px;
            }
            .tracking { 
              background: #f0f8ff; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-left: 4px solid #586330;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin-left: 10px;
            }
            .status-delivered { background: #d1fae5; color: #065f46; }
            .status-shipped { background: #dbeafe; color: #1e40af; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-confirmed { background: #d1fae5; color: #065f46; }
            .status-cancelled { background: #fee2e2; color: #dc2626; }
            .status-paid { background: #d1fae5; color: #065f46; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 30px 0; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th { 
              background: #6B4E4E; 
              color: white; 
              padding: 14px; 
              text-align: left; 
              font-weight: bold;
            }
            td { 
              padding: 14px; 
              border-bottom: 1px solid #ddd; 
            }
            tr:hover {
              background: #f8f9fa;
            }
            .total-section {
              text-align: right;
              margin-top: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .subtotal, .tax, .shipping, .total {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              max-width: 300px;
              margin-left: auto;
            }
            .total { 
              font-size: 24px; 
              font-weight: bold; 
              color: #6B4E4E;
              border-top: 2px solid #6B4E4E;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .notes {
              margin-top: 30px;
              padding: 15px;
              background: #fff3cd;
              border-radius: 5px;
              border-left: 4px solid #ffc107;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div>
              <div class="logo">Dealsy</div>
              <div class="company-info">
                123 Plaza, Beach Road <br>
                Kozhikode, Kerala 400059<br>
                Phone: +91 8281304925<br>
                Email: SupportDealsy@gmail.com
              </div>
            </div>
            <div>
              <div>
                <div class="info-label">BILL TO</div>
                <div><strong>${invoice.customer?.name || invoice.Order?.CustomerName || 'N/A'}</strong></div>
              </div>
            </div>
          </div>

          <!-- Invoice Info -->
          <div class="invoice-info">
            <div><strong>Invoice Number:</strong> ${invoiceNumber}</div>
            <div><strong>Invoice Date:</strong> ${formatDate(invoiceDate)}</div>
            <div><strong>Order Number:</strong> ${invoice.orderId || 'N/A'}</div>
          </div>

          <!-- Status Information -->
          <div class="info-grid">
            <div class="info-section">
              <div class="info-label">ORDER STATUS</div>
              <span class="status-badge ${
                orderStatus.toLowerCase() === 'delivered' ? 'status-delivered' :
                orderStatus.toLowerCase() === 'shipped' ? 'status-shipped' :
                orderStatus.toLowerCase() === 'confirmed' ? 'status-confirmed' :
                orderStatus.toLowerCase() === 'cancelled' ? 'status-cancelled' :
                'status-pending'
              }">${orderStatus}</span>
            </div>
            <div class="info-section">
              <div class="info-label">PAYMENT STATUS</div>
              <span class="status-badge ${
                confirmationStatus.toLowerCase() === 'confirmed' ? 'status-confirmed' :
                confirmationStatus.toLowerCase() === 'paid' ? 'status-paid' :
                'status-pending'
              }">${confirmationStatus}</span>
            </div>
          </div>

          <!-- Shipping Information -->
          <div class="tracking">
            <div class="info-label">SHIPPING INFORMATION</div>
            <div><strong>Carrier:</strong> ${invoice.CarrierName || invoice.carrierName || invoice.shipment?.carrier || 'N/A'}</div>
            <div><strong>Tracking Number:</strong> ${invoice.TrackingNumber || invoice.trackingNumber || invoice.shipment?.trackingNumber || 'N/A'}</div>
            ${invoice.deliveredDate ? `<div><strong>Delivered Date:</strong> ${formatDate(invoice.deliveredDate)}</div>` : ''}
          </div>

          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const quantity = item.Quantity || item.quantity || 0;
                const price = item.Price || item.price || item.unitPrice || 0;
                const total = quantity * price;
                const productName = item.ProductName || item.productName || 'Unknown Product';
                
                return `
                  <tr>
                    <td><strong>${productName}</strong></td>
                    <td>${quantity}</td>
                    <td>₹${price.toLocaleString('en-IN')}</td>
                    <td><strong>₹${total.toLocaleString('en-IN')}</strong></td>
                  </tr>
                `;
              }).join('')}
              ${items.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                    No items found in this invoice
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <!-- Total -->
          <div class="total-section">
            <div class="total">
              <span>Total Amount:</span>
              <span>₹${total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <!-- Notes -->
          <div class="notes">
            <strong>Notes:</strong><br>
            • Thank you for your business!<br>
            • Please retain this invoice for your records.<br>
            • For any queries, contact our support Team.
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Dealsy - Quality Products at Great Prices</p>
            <p>SupportDealsy@gmail.com | +91 8281304925</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const handleSendInvoice = (invoice) => {
    const total = invoice.amount || calculateTotal(invoice.items);
    const invoiceNumber = invoice.invoiceNumber || invoice.invoiceId;
    const subject = `Invoice ${invoiceNumber} - Shipment Confirmed`;
    const body = `Dear ${invoice.customer?.name || 'Customer'},\n\nYour order has been shipped!\n\nTracking: ${invoice.trackingNumber || invoice.shipment?.trackingNumber || 'N/A'}\nCarrier: ${invoice.carrierName || invoice.shipment?.carrier || 'N/A'}\nInvoice: ${invoiceNumber}\nAmount: ${formatCurrency(total)}\n\nThank you!\nDealsy Team`;
    window.location.href = `mailto:${invoice.customer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success('Opening email client...');
  };

  const pendingOrders = purchaseOrders.filter(po => 
    (po.status === 'Pending' || po.status === 'Confirmed') && 
    po.deliveryStatus !== 'delivered'
  );

  const shippedOrders = invoices.filter(inv => inv.orderStatus === 'Shipped');
  
  // Combine delivered orders from both purchaseOrders and invoices
  const deliveredOrders = [
    // Get delivered orders from purchaseOrders
    ...purchaseOrders.filter(po => 
      po.deliveryStatus === 'delivered' || po.status === 'Delivered'
    ).map(po => ({
      orderId: po.orderId,
      customerName: po.customerName,
      customer: { name: po.customerName, email: po.customerEmail },
      totalAmount: po.totalAmount,
      amount: po.totalAmount,
      orderDate: po.orderDate,
      date: po.orderDate,
      status: po.status,
      deliveryStatus: po.deliveryStatus,
      trackingNumber: po.trackingNumber,
      carrierName: po.carrierName,
      deliveredDate: po.deliveredDate,
      type: 'purchaseOrder'
    })),
    
    // Get delivered orders from invoices
    ...invoices.filter(inv => inv.orderStatus === 'Delivered')
      .map(inv => ({
        orderId: inv.orderId,
        customerName: inv.customer?.name,
        customer: inv.customer,
        totalAmount: inv.amount,
        amount: inv.amount,
        orderDate: inv.invoiceDate || inv.date,
        date: inv.invoiceDate || inv.date,
        status: 'Delivered',
        deliveryStatus: 'delivered',
        trackingNumber: inv.trackingNumber || inv.shipment?.trackingNumber,
        carrierName: inv.carrierName || inv.shipment?.carrier,
        deliveredDate: inv.deliveredDate,
        type: 'invoice'
      }))
  ].filter((item, index, self) => 
    // Remove duplicates by orderId (keep invoice data if available)
    index === self.findIndex(t => t.orderId === item.orderId && t.type === 'invoice') ||
    index === self.findIndex(t => t.orderId === item.orderId && t.type === 'purchaseOrder' && 
      !self.some(inv => inv.orderId === item.orderId && inv.type === 'invoice'))
  );

  return (
    <>
      <ToastContainer position="top-right" />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar handleLogout={handleLogout} activeView="invoices" />

        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Order & Invoice Management</h1>
          <p className="text-gray-600 mb-8">Pending → Shipped → Delivered</p>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8">
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`px-6 py-3 font-medium ${activeTab === 'orders' ? 'text-[#586330] border-b-2 border-[#586330]' : 'text-gray-500'}`}
            >
              Orders ({purchaseOrders.length})
            </button>
            <button 
              onClick={() => setActiveTab('invoices')} 
              className={`px-6 py-3 font-medium ${activeTab === 'invoices' ? 'text-[#586330] border-b-2 border-[#586330]' : 'text-gray-500'}`}
            >
              Invoices ({invoices.length})
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#586330]"></div>
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          )}

          {/* Orders Tab */}
          {!loading && activeTab === 'orders' && (
            <div className="space-y-8">
              {/* Pending Orders */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-orange-50 p-4 font-bold">Pending Orders ({pendingOrders.length})</div>
                <table className="w-full">
                  <thead className="bg-[#586330] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">Order ID</th>
                      <th className="px-6 py-4 text-left">Customer</th>
                      <th className="px-6 py-4 text-left">Total</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-left">Order Date</th>
                      <th className="px-6 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map(po => (
                      <tr key={po.orderId} className="border-b hover:bg-[#F5F1E8]">
                        <td className="px-6 py-4 font-medium">Order {po.orderId}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{po.customerName || 'Unknown Customer'}</div>
                            <div className="text-sm text-gray-500">{po.customerEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#586330]">{formatCurrency(po.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            po.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(po.orderDate)}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => openShipmentModal(po)} 
                            className="px-4 py-2 bg-[#586330] text-white rounded mr-2 hover:bg-[#586330]/80"
                          >
                            Ship Order
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingOrders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No pending orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Shipped Orders */}
              {shippedOrders.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-blue-50 p-4 font-bold text-blue-800">Shipped Orders ({shippedOrders.length})</div>
                  <table className="w-full">
                    <thead className="bg-[#586330] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left">Order ID</th>
                        <th className="px-6 py-4 text-left">Customer</th>
                        <th className="px-6 py-4 text-left">Tracking</th>
                        <th className="px-6 py-4 text-left">Carrier</th>
                        <th className="px-6 py-4 text-left">Shipped Date</th>
                        <th className="px-6 py-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippedOrders.map(inv => (
                        <tr key={inv.invoiceId} className="border-b hover:bg-[#F5F1E8]">
                          <td className="px-6 py-4">Order {inv.orderId}</td>
                          <td className="px-6 py-4">{inv.customer?.name || 'Unknown Customer'}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {inv.trackingNumber || inv.shipment?.trackingNumber || 'No tracking'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{inv.carrierName || inv.shipment?.carrier || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {inv.shippedDate ? formatDate(inv.shippedDate) : formatDate(inv.invoiceDate)}
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                // Find the corresponding purchase order
                                const po = purchaseOrders.find(p => p.orderId == inv.orderId);
                                if (po) markAsDelivered(po);
                              }} 
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Mark Delivered
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Delivered Orders */}
              {deliveredOrders.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-green-50 p-4 font-bold text-green-800">Delivered Orders ({deliveredOrders.length})</div>
                  <table className="w-full">
                    <thead className="bg-[#586330] text-white">
                      <tr>
                        <th className="px-6 py-4 text-left">Order ID</th>
                        <th className="px-6 py-4 text-left">Customer</th>
                        <th className="px-6 py-4 text-left">Tracking Id</th>
                        <th className="px-6 py-4 text-left">Carrier Name</th>
                        <th className="px-6 py-4 text-left">Total</th>
                        <th className="px-6 py-4 text-left">Delivered Date</th>
                        <th className="px-6 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveredOrders.map(deliveredItem => {
                        // Find the corresponding invoice for shipping information
                        const invoice = invoices.find(inv => inv.orderId == deliveredItem.orderId);
                        
                        return (
                          <tr key={deliveredItem.orderId} className="border-b hover:bg-[#F5F1E8]">
                            <td className="px-6 py-4">Order {deliveredItem.orderId}</td>
                            <td className="px-6 py-4">{deliveredItem.customerName || deliveredItem.customer?.name || 'Unknown Customer'}</td>
                            <td className="px-6 py-4">
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {invoice?.trackingNumber || deliveredItem.trackingNumber || 'No tracking'}
                              </span>
                            </td>
                            <td className="px-6 py-4">{invoice?.carrierName || deliveredItem.carrierName || 'N/A'}</td>
                            <td className="px-6 py-4 font-bold text-[#586330]">
                              {formatCurrency(deliveredItem.totalAmount || deliveredItem.amount || 0)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {deliveredItem.deliveredDate ? formatDate(deliveredItem.deliveredDate) : 
                               invoice?.deliveredDate ? formatDate(invoice.deliveredDate) : 
                               formatDate(deliveredItem.orderDate || deliveredItem.date)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                Delivered
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {!loading && activeTab === 'invoices' && viewMode === 'list' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#586330] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Invoice ID</th>
                    <th className="px-6 py-4 text-left">Order ID</th>
                    <th className="px-6 py-4 text-left">Customer</th>
                    <th className="px-6 py-4 text-left">Amount</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Order Status</th>
                    <th className="px-6 py-4 text-left">Payment Status</th>
                    <th className="px-6 py-4 text-left">Tracking Id</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const total = inv.amount || calculateTotal(inv.items);
                    
                    // Order Status Badge
                    const orderStatusBadge = {
                      text: inv.orderStatus || 'Pending',
                      class: inv.orderStatus?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                             inv.orderStatus?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-800' :
                             inv.orderStatus?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                             'bg-yellow-100 text-yellow-800'
                    };
                    
                    // Payment Status from stored confirmation status
                    const invoiceStatus = getInvoiceStatus(inv);
                    
                    return (
                      <tr key={inv.invoiceId} className="border-b hover:bg-[#F5F1E8]">
                        <td className="px-6 py-4 font-medium">{inv.invoiceNumber || inv.invoiceId}</td>
                        <td className="px-6 py-4">Order {inv.orderId}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{inv.customer?.name || 'Unknown Customer'}</div>
                            <div className="text-sm text-gray-500">{inv.customer?.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#586330]">{formatCurrency(total)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(inv.invoiceDate || inv.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${orderStatusBadge.class}`}>
                            {orderStatusBadge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${invoiceStatus.class}`}>
                            {invoiceStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">{inv.trackingNumber || inv.shipment?.trackingNumber || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handlePrintInvoice(inv)} 
                            className="text-white bg-gray-600 px-2 mr-3 hover:underline"
                          >
                            Print
                          </button>
                          <button 
                            onClick={() => handleSendInvoice(inv)} 
                            className="text-green-600 mt-2 bg-green-100 px-2 mr-3 hover:underline"
                          >
                            Email
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        No invoices found. Ship an order to generate invoices.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Shipment Modal */}
          {showShipmentModal && selectedPO && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
                <div className="bg-[#586330] text-white p-6 rounded-t-2xl">
                  <h2 className="text-2xl font-bold">Confirm Shipment - Order #{selectedPO.orderId}</h2>
                  <p className="text-[#586330]/80 mt-2">Customer: {selectedPO.customerName} • Total: {formatCurrency(selectedPO.totalAmount)}</p>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block font-medium mb-2">Shipment Date</label>
                      <input 
                        type="date" 
                        value={shipmentDetails.shipmentDate} 
                        onChange={e => setShipmentDetails(prev => ({ ...prev, shipmentDate: e.target.value }))} 
                        className="w-full px-4 py-3 border rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Carrier Name *</label>
                      <input 
                        type="text" 
                        placeholder="FedEx, Delhivery, etc." 
                        value={shipmentDetails.carrierName} 
                        onChange={e => setShipmentDetails(prev => ({ ...prev, carrierName: e.target.value }))} 
                        className="w-full px-4 py-3 border rounded-lg" 
                      />
                    </div>
                  </div>
                  <div className="mb-8">
                    <label className="block font-medium mb-2">Tracking Id *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 123456789012" 
                      value={shipmentDetails.trackingNumber} 
                      onChange={e => setShipmentDetails(prev => ({ ...prev, trackingNumber: e.target.value }))} 
                      className="w-full px-4 py-3 border rounded-lg" 
                    />
                  </div>

                  <h3 className="font-bold text-lg mb-4">Items to Ship</h3>
                  <div className="space-y-4 mb-8">
                    {shipmentDetails.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.ProductName || item.productName}</p>
                          <p className="text-sm text-gray-600">Ordered: {item.Quantity || item.quantity || 0}</p>
                          <p className="text-sm text-gray-600">Price: {formatCurrency(item.Price || item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Qty:</span>
                          <div className="text-center bg-gray-50">
                            {item.Quantity || item.quantity || 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-4">
                    <button 
                      onClick={() => setShowShipmentModal(false)} 
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmShipmentAndGenerateInvoice} 
                      className="px-8 py-3 bg-[#586330] text-white rounded-lg"
                    >
                      Confirm & Generate Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Invoices;