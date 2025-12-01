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
  const [returns, setReturns] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(false);

  // Modals
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedInvoiceForReturn, setSelectedInvoiceForReturn] = useState(null);

  const [shipmentDetails, setShipmentDetails] = useState({
    shipmentDate: '',
    carrierName: '',
    trackingNumber: '',
    items: []
  });

  const [returnDetails, setReturnDetails] = useState({
    returnDate: '',
    carrierName: '',
    carrierPhoneNumber: '',
    trackingId: '',
    customerReason: '',
    items: []
  });

  const returnAddress = {
    name: 'Dealsy',
    street: '123 Dealsy Plaza',
    city: 'Kozhikode',
    state: 'Kerala',
    zipCode: '400059',
    country: 'India',
    phone: '+91 22 6789 4321',
    email: 'SupportDealsy@gmail.com'
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchVendorOrders();
      await fetchInvoices();
      await fetchReturns();
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

  const fetchReturns = async () => {
    try {
      const response = await axiosInstance.get('/Order/vendor/returns');
      const returnsData = response.data.returns || [];
      
      const transformedReturns = returnsData.map(ret => ({
        returnId: ret.returnId || ret.ReturnId || `RET${ret.id || Date.now()}`,
        orderId: ret.orderId || ret.OrderId,
        invoiceId: ret.invoiceId || ret.InvoiceId,
        date: ret.returnDate || ret.ReturnDate || ret.date,
        reason: ret.reason || ret.Reason || 'No reason provided',
        status: ret.status || ret.Status || 'Processed',
        carrierName: ret.carrierName || ret.CarrierName || '',
        trackingId: ret.trackingId || ret.TrackingId || '',
        items: ret.items || ret.Items || []
      }));
      
      setReturns(transformedReturns);
    } catch (error) {
      console.error('Error fetching returns:', error);
      // Show empty state if no returns or API error
      setReturns([]);
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

  const openReturnModal = (invoice) => {
    const po = purchaseOrders.find(p => p.orderId === invoice.orderId);
    if (po?.deliveryStatus !== 'delivered') {
      toast.error('Order must be delivered before processing return.');
      return;
    }

    setSelectedInvoiceForReturn(invoice);
    
    // Use invoice.Items (capital I) instead of invoice.items
    const invoiceItems = invoice.Items || invoice.items || [];
    
    setReturnDetails({
      returnDate: new Date().toISOString().split('T')[0],
      carrierName: '',
      carrierPhoneNumber: '',
      trackingId: '',
      customerReason: po.returnReason || 'No reason provided',
      items: invoiceItems.map(item => ({
        ...item,
        returnedQty: 0,
        customerSelected: false,
        productName: item.ProductName || item.productName,
        quantity: item.Quantity || item.quantity,
        price: item.Price || item.price,
        ProductId: item.ProductId || item.productId
      })) || []
    });
    setShowReturnModal(true);
  };

  const processReturn = async () => {
    if (!returnDetails.carrierName.trim() || !returnDetails.trackingId.trim()) {
      toast.error('Carrier Name and Tracking ID are required!');
      return;
    }
    
    const totalReturned = returnDetails.items.reduce((acc, i) => acc + (i.returnedQty || 0), 0);
    if (totalReturned === 0) {
      toast.error('Select at least one item to return.');
      return;
    }

    try {
      const returnedItems = returnDetails.items
        .filter(i => i.returnedQty > 0)
        .map(i => ({
          productId: i.ProductId || i.productId,
          productName: i.ProductName || i.productName,
          quantity: i.returnedQty,
          price: i.Price || i.price || 0
        }));

      // Call the new return API endpoint
      const response = await axiosInstance.post('/Order/return', {
        orderId: selectedInvoiceForReturn.orderId,
        invoiceId: selectedInvoiceForReturn.invoiceId,
        returnDate: returnDetails.returnDate,
        carrierName: returnDetails.carrierName,
        carrierPhoneNumber: returnDetails.carrierPhoneNumber,
        trackingId: returnDetails.trackingId,
        reason: returnDetails.customerReason,
        items: returnedItems
      });

      toast.success('Return processed successfully!');
      
      // Update invoice status to Returned
      setInvoices(prev =>
        prev.map(inv =>
          inv.orderId === selectedInvoiceForReturn.orderId
            ? { ...inv, confirmationStatus: 'Returned' }
            : inv
        )
      );
      
      setShowReturnModal(false);
      
      // Refresh returns data
      await fetchReturns();
      
      // Switch to returns tab
      setActiveTab('returns');
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error(error.response?.data?.message || 'Failed to process return');
    }
  };

  const calculateTotal = (items) => {
    if (!items) return 0;
    return items.reduce((sum, i) => sum + ((i.Quantity || i.quantity || i.shippedQty || i.returnedQty || 0) * (i.Price || i.price || i.unitPrice || 0)), 0);
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
      'Returned': 'bg-purple-100 text-purple-800',
      'Confirmed': 'bg-green-100 text-green-800',
      'Paid': 'bg-green-100 text-green-800',
      'Paided': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Refunded': 'bg-red-100 text-red-800'
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
            .status-returned { background: #e9d5ff; color: #6b21a8; }
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
                confirmationStatus.toLowerCase() === 'returned' ? 'status-returned' :
                confirmationStatus.toLowerCase() === 'refunded' ? 'status-returned' :
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

  const shippedOrders = purchaseOrders.filter(po => 
    po.deliveryStatus === 'in-transit' || po.status === 'Shipped'
  );

  const deliveredOrders = purchaseOrders.filter(po => 
    po.deliveryStatus === 'delivered' || po.status === 'Delivered'
  );

  return (
    <>
      <ToastContainer position="top-right" />
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar handleLogout={handleLogout} activeView="invoices" />

        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Order, Invoice & Return Management</h1>
          <p className="text-gray-600 mb-8">Pending → Shipped → Delivered → Returns</p>

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
            <button 
              onClick={() => setActiveTab('returns')} 
              className={`px-6 py-3 font-medium ${activeTab === 'returns' ? 'text-[#586330] border-b-2 border-[#586330]' : 'text-gray-500'}`}
            >
              Returns ({returns.length})
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
                        <th className="px-6 py-4 text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippedOrders.map(po => (
                        <tr key={po.orderId} className="border-b hover:bg-[#F5F1E8]">
                          <td className="px-6 py-4">Order {po.orderId}</td>
                          <td className="px-6 py-4">{po.customerName || 'Unknown Customer'}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {po.trackingNumber || 'No tracking'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{po.carrierName || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => markAsDelivered(po)} 
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
                        <th className="px-6 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveredOrders.map(po => (
                        <tr key={po.orderId} className="border-b hover:bg-[#F5F1E8]">
                          <td className="px-6 py-4">Order {po.orderId}</td>
                          <td className="px-6 py-4">{po.customerName || 'Unknown Customer'}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {po.trackingNumber || 'No tracking'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{po.carrierName || 'N/A'}</td>
                          <td className="px-6 py-4 font-bold text-[#586330]">{formatCurrency(po.totalAmount)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              Delivered
                            </span>
                          </td>
                        </tr>
                      ))}
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
          
          // Show return button ONLY when payment status is "Returned"
          const showReturnButton = invoiceStatus.text === 'Returned';
                    
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
                {showReturnButton && (
                  <button 
                    onClick={() => openReturnModal(inv)} 
                    className="text-red-600 hover:underline"
                  >
                    Return
                  </button>
                )}
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

          {/* Returns Tab */}
          {!loading && activeTab === 'returns' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#586330] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Return ID</th>
                    <th className="px-6 py-4 text-left">Order ID</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Reason</th>
                    <th className="px-6 py-4 text-left">Carrier</th>
                    <th className="px-6 py-4 text-left">Tracking ID</th>
                    <th className="px-6 py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-500">
                        No returns yet
                      </td>
                    </tr>
                  ) : (
                    returns.map(r => (
                      <tr key={r.returnId} className="border-b hover:bg-[#F5F1E8]">
                        <td className="px-6 py-4 font-medium">{r.returnId}</td>
                        <td className="px-6 py-4">Order {r.orderId}</td>
                        <td className="px-6 py-4">{formatDate(r.date)}</td>
                        <td className="px-6 py-4">{r.reason || 'No reason provided'}</td>
                        <td className="px-6 py-4">{r.carrierName || 'N/A'}</td>
                        <td className="px-6 py-4 font-mono text-sm">{r.trackingId || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            r.status === 'Processed' ? 'bg-green-100 text-green-800' : 
                            r.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {r.status || 'Processed'}
                          </span>
                        </td>
                      </tr>
                    ))
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

          {/* Return Modal */}
          {showReturnModal && selectedInvoiceForReturn && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
                <div className="bg-[#586330] text-white p-6 rounded-t-2xl">
                  <h2 className="text-2xl font-bold">Return Order</h2>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block font-medium mb-2">Return Date *</label>
                      <input 
                        type="date" 
                        value={returnDetails.returnDate} 
                        onChange={e => setReturnDetails(prev => ({ ...prev, returnDate: e.target.value }))} 
                        className="w-full px-4 py-3 border rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Carrier Name *</label>
                      <input 
                        type="text" 
                        placeholder="FedEx, Delhivery, etc." 
                        value={returnDetails.carrierName} 
                        onChange={e => setReturnDetails(prev => ({ ...prev, carrierName: e.target.value }))} 
                        className="w-full px-4 py-3 border rounded-lg" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block font-medium mb-2">Carrier Phone Number</label>
                      <input 
                        type="text" 
                        placeholder="+91 98765 43210" 
                        value={returnDetails.carrierPhoneNumber} 
                        onChange={e => setReturnDetails(prev => ({ ...prev, carrierPhoneNumber: e.target.value }))} 
                        className="w-full px-4 py-3 border rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-2">Tracking ID *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. RET123456789" 
                        value={returnDetails.trackingId} 
                        onChange={e => setReturnDetails(prev => ({ ...prev, trackingId: e.target.value }))} 
                        className="w-full px-4 py-3 border rounded-lg" 
                      />
                    </div>
                  </div>

                  {/* Return Address Section */}
                  <div className="mb-6">
                    <label className="block font-medium mb-2">Return Shipping Address</label>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-green-800 mb-2">Ship returns to:</p>
                      <div className="text-gray-700">
                        <p className="font-semibold">{returnAddress.name}</p>
                        <p>{returnAddress.street}</p>
                        <p>{returnAddress.city}, {returnAddress.state} {returnAddress.zipCode}</p>
                        <p>{returnAddress.country}</p>
                        <p className="mt-2">📞 {returnAddress.phone}</p>
                        <p>✉ {returnAddress.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block font-medium mb-2">Customer Reason for Return</label>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-gray-700">{returnDetails.customerReason}</p>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-4">Items for Return</h3>
                  {returnDetails.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-3">
                      <div className="flex-1">
                        <p className="font-medium">{item.ProductName || item.productName}</p>
                        <p className="text-sm text-gray-600">Delivered: {item.Quantity || item.quantity || 0}</p>
                        <p className="text-sm text-gray-600">Price: {formatCurrency(item.Price || item.price)}</p>
                      </div>
                      
                    </div>
                  ))}

                  <div className="flex justify-end gap-4 mt-8">
                    <button 
                      onClick={() => setShowReturnModal(false)} 
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={processReturn} 
                      className="px-8 py-3 bg-[#586330] text-white rounded-lg "
                    >
                      Process Return
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