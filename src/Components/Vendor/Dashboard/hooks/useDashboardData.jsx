import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../Components/utils/axiosInstance'; // Adjust path as needed

export const useDashboardData = (navigate) => {
  const [userData, setUserData] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [financialData, setFinancialData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]); // Changed from mock to real state
  const [isLoading, setIsLoading] = useState(true);

  const [messageThreads] = useState([
    { id: 1, title: 'Support Team for Vendor', preview: 'Welcome to Dealsy! How can we help you?', time: '2 hours ago', unread: true },
    { id: 2, title: 'Support Team from Customer', preview: 'Interested in your products...', time: '1 day ago', unread: false }
  ]);

  // Fetch real notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      console.log('🔔 [Dashboard] Fetching notifications from API...');
      
      const notificationResponse = await axiosInstance.get('/Notification/vendor-out-of-stock');
    
    // Handle both response formats
    let notificationsArray = [];
    
    if (Array.isArray(notificationResponse.data)) {
      notificationsArray = notificationResponse.data;
    } else if (notificationResponse.data.notifications && Array.isArray(notificationResponse.data.notifications)) {
      notificationsArray = notificationResponse.data.notifications;
    } else if (notificationResponse.data.Notifications && Array.isArray(notificationResponse.data.Notifications)) {
      notificationsArray = notificationResponse.data.Notifications;
    }
    
    // Normalize notifications
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
      console.error('❌ Error fetching dashboard data:', error);
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
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockFinancialData = [
      { title: 'Total Revenue', value: '₹25,430.00', subtitle: '+12% from last month' },
      { title: 'Total Refunded', value: '₹1,340.00', subtitle: '5 refund requests' },
      { title: 'Overdue Bills', value: '₹2,340.00', subtitle: '2 overdue payments' }
    ];
    
    setFinancialData(mockFinancialData);
  } catch (error) {
    console.error('Error loading financial data:', error);
    setFinancialData(getDefaultFinancialData());
  }
}, []);

  const fetchRecentActivities = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const mockActivities = [
        { type: 'Customer 1 added product', description: 'Customer 1 added product', date: 'Just now' },
        { type: '1 order purchased customer1', description: '1 order purchased customer1', date: '2 hours ago' },
        { type: 'pending customer payment of your wooden chair', description: 'pending customer payment of your wooden chair', date: '1 day ago' }
      ];
      
      setRecentActivities(mockActivities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities(getDefaultActivities());
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const user = localStorage.getItem('currentUser');
      
      if (!user) {
        toast.error('Please login to access dashboard');
        navigate('/login');
        return;
      }

      const userObj = JSON.parse(user);
      setUserData(userObj);

      // Fetch all data including real notifications
      await Promise.all([
        fetchVendorData(),
        fetchFinancialData(),
        fetchRecentActivities(),
        fetchNotifications() // Add this to fetch real notifications
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
    messageThreads,
    notifications, // Now this returns real notifications from API
    fetchDashboardData,
    refreshNotifications: fetchNotifications // Add this for manual refresh
  };
};

const getDefaultFinancialData = (subtitle = 'No data available') => [
  { title: 'Total Revenue', value: '₹0.00', subtitle },
  { title: 'Total Payments', value: '₹0.00', subtitle },
  { title: 'Total Refunded', value: '₹0.00', subtitle },
  { title: 'Overdue Bills', value: '₹0.00', subtitle }
];

const getDefaultActivities = () => [
  { type: 'Welcome to Dealsy!', description: 'Start by adding your products and services', date: 'Just now' }
];