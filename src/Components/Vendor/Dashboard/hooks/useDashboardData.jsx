import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../Components/utils/axiosInstance';

export const useDashboardData = (navigate) => {
  const [userData, setUserData] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [financialData, setFinancialData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchNotifications = useCallback(async () => {
    try {
      console.log('🔔 [Dashboard] Fetching notifications from API...');
      
      const notificationResponse = await axiosInstance.get('/Notification/vendor-out-of-stock');
    
      let notificationsArray = [];
      
      if (Array.isArray(notificationResponse.data)) {
        notificationsArray = notificationResponse.data;
      } else if (notificationResponse.data.notifications && Array.isArray(notificationResponse.data.notifications)) {
        notificationsArray = notificationResponse.data.notifications;
      } else if (notificationResponse.data.Notifications && Array.isArray(notificationResponse.data.Notifications)) {
        notificationsArray = notificationResponse.data.Notifications;
      }
      
      const normalizedNotifications = notificationsArray.map(notification => ({
        id: notification.Id || notification.id,
        type: notification.Type || notification.type || '',
        title: notification.Title || notification.title || '',
        message: notification.Message || notification.message || '',
        productId: notification.ProductId || notification.productId,
        createdAt: notification.CreatedAt || notification.createdAt || notification.createdOn,
        isRead: notification.IsRead || notification.isRead || false,
        priority: notification.Priority || notification.priority || '',
        isOutOfStock: notification.IsOutOfStock === true || 
                      notification.isOutOfStock === true ||
                      (notification.Type || notification.type || '').toLowerCase() === 'out_of_stock',
        productName: notification.ProductName || notification.productName,
        vendorId: notification.VendorId || notification.vendorId,
        source: 'api'
      }));
      
      setNotifications(normalizedNotifications);

    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  }, []);

  const fetchVendorData = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockVendorData = {
        companyName: 'Vendor ',
        companyEmail: 'vendor@demo.com',
        category: 'Retail',
        about: 'This is a vendor profile',
        taxId: 'TAX123456',
        isActive: true
      };
      
      setVendorData(mockVendorData);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  }, []);

  const fetchFinancialData = useCallback(async () => {
    try {
      console.log('💰 Fetching financial data...');
      
      // Fetch earnings data from API
      const response = await axiosInstance.get('/Payment/vendor/earnings');
      
      if (!response.data || !response.data.success) {
        console.warn('⚠️ No financial data available from API');
        setFinancialData(getDefaultFinancialData('No data available'));
        return;
      }
      
      const earnings = response.data.earnings;
      
      console.log('📊 Earnings data:', earnings);
      
      if (!earnings) {
        setFinancialData(getDefaultFinancialData('No data available'));
        return;
      }
      
      const financialCards = [
        { 
          title: 'Total Revenue', 
          value: formatCurrency(earnings.TotalEarnings || 0),
          subtitle: `From ${earnings.TotalOrders || 0} orders`,
          trend: earnings.TotalEarnings > 0 ? '+Revenue' : 'No revenue yet',
          icon: '💰',
          color: 'green'
        },
        { 
          title: 'My Payouts', 
          value: formatCurrency(earnings.CompletedPayouts || 0),
          subtitle: `${earnings.CompletedPayouts > 0 ? 'Received payouts' : 'No payouts yet'}`,
          trend: earnings.CompletedPayouts > 0 ? '+Paid to you' : 'Pending',
          icon: '💳',
          color: 'blue'
        },
        { 
          title: 'Pending Payouts', 
          value: formatCurrency(earnings.PendingPayouts || 0),
          subtitle: `From ${earnings.CompletedOrders || 0} delivered orders`,
          trend: earnings.PendingPayouts > 0 ? 'Pending' : 'All paid',
          icon: '⏳',
          color: 'yellow'
        },
        { 
          title: 'Commission Paid', 
          value: formatCurrency(earnings.CommissionPaid || 0),
          subtitle: '20% platform commission',
          trend: '-20% commission',
          icon: '📊',
          color: 'purple'
        }
      ];
      
      setFinancialData(financialCards);
      
    } catch (error) {
      console.error('❌ Error fetching financial data:', error);
      setFinancialData(getDefaultFinancialData('Data temporarily unavailable'));
    }
  }, []);

  const fetchRecentActivities = useCallback(async () => {
    try {
      console.log('📊 Fetching recent activities...');
      
      // Fetch vendor orders to generate activities
      const response = await axiosInstance.get('/Order/vendor/orders');
      
      const ordersData = response.data.orders || response.data || [];
      
      if (!Array.isArray(ordersData) || ordersData.length === 0) {
        console.log('ℹ️ No orders found for activities');
        setRecentActivities(getDefaultActivities());
        return;
      }

      // Generate activities from orders
      const activities = [];
      
      ordersData.forEach(order => {
        const orderId = order.orderId || order.OrderId || order.id;
        const customerName = order.customerName || order.CustomerName || 'Customer';
        const totalAmount = order.totalAmount || order.TotalAmount || 0;
        const status = (order.status || order.Status || 'pending').toLowerCase();
        const orderDate = order.orderDate || order.OrderDate || order.createdOn || order.CreatedOn;

        let activityType = 'info';
        let activityDescription = '';

        switch (status) {
          case 'pending':
          case 'confirmed':
            activityType = 'order_pending';
            activityDescription = `${customerName} placed order ${orderId} worth ₹${totalAmount.toLocaleString('en-IN')}`;
            break;

          case 'shipped':
          case 'in-transit':
            activityType = 'order_shipped';
            activityDescription = `Order ${orderId} shipped to ${customerName}`;
            break;

          case 'delivered':
          case 'completed':
            activityType = 'order_completed';
            activityDescription = `${customerName} received order ${orderId} (₹${totalAmount.toLocaleString('en-IN')})`;
            break;

          case 'cancelled':
            activityType = 'order_cancelled';
            activityDescription = `Order ${orderId} was cancelled by ${customerName}`;
            break;

          default:
            activityType = 'info';
            activityDescription = `Order ${orderId} - ${customerName}`;
        }

        activities.push({
          id: `${orderId}-${status}-${Date.now()}`,
          type: activityType,
          description: activityDescription,
          date: formatActivityDate(orderDate),
          orderId: orderId,
          customerName: customerName,
          amount: totalAmount,
          status: status,
          rawDate: orderDate
        });
      });

      // Sort by raw date (most recent first)
      const sortedActivities = activities.sort((a, b) => {
        return new Date(b.rawDate) - new Date(a.rawDate);
      });

      // Limit to 10 most recent
      const limitedActivities = sortedActivities.slice(0, 10);

      setRecentActivities(limitedActivities);
      
      console.log('✅ Recent Activities Generated:', limitedActivities.length);
      
    } catch (error) {
      console.error('❌ Error fetching recent activities:', error);
      setRecentActivities(getDefaultActivities());
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const user = localStorage.getItem('currentUser');
      
      if (!user) {
        toast.error('Please login to access dashboard');
        navigate('/login');
        return;
      }

      const userObj = JSON.parse(user);
      setUserData(userObj);

      await Promise.all([
        fetchVendorData(),
        fetchFinancialData(),
        fetchRecentActivities(),
        fetchNotifications()
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, fetchVendorData, fetchFinancialData, fetchRecentActivities, fetchNotifications]);

  return {
    userData,
    vendorData,
    financialData,
    recentActivities,
    isLoading,
    notifications,
    fetchDashboardData,
    refreshNotifications: fetchNotifications,
    refreshActivities: fetchRecentActivities
  };
};

// Helper function to format date for activities
const formatActivityDate = (dateString) => {
  if (!dateString) return 'Just now';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return 'Just now';
  }
};

const getDefaultFinancialData = (subtitle = 'No data available') => [
  { title: 'Total Revenue', value: '₹0.00', subtitle, icon: '💰', color: 'green' },
  { title: 'My Payouts', value: '₹0.00', subtitle, icon: '💳', color: 'blue' },
  { title: 'Pending Payouts', value: '₹0.00', subtitle, icon: '⏳', color: 'yellow' },
  { title: 'Commission Paid', value: '₹0.00', subtitle, icon: '📊', color: 'purple' }
];

const getDefaultActivities = () => [
  { 
    type: 'welcome', 
    description: 'Welcome to Dealsy! Start by adding your products and services', 
    date: 'Just now' 
  }
];