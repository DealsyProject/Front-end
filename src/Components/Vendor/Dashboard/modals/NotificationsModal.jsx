import React, { useState, useEffect } from 'react';
import { Bell, Package, X, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const NotificationsModal = ({ 
  setShowNotifications, 
  notifications = [], 
  outOfStockNotifications = [], 
  otherNotifications = [],
  markNotificationAsRead, 
  refreshNotifications,
  unreadCount = 0,
  isConnected = false
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('🔔 [Modal] RAW notifications received:', notifications);
  console.log('🔔 [Modal] First notification RAW:', notifications[0]);
  console.log('🔔 [Modal] First notification keys:', notifications[0] ? Object.keys(notifications[0]) : 'No notifications');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    
    if (!notificationId) {
      console.error('❌ [Modal] No notification ID provided');
      console.error('❌ [Modal] Notification object:', notifications.find(n => n.id === notificationId || n.Id === notificationId));
      return;
    }
    
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('❌ [Modal] Error marking notification as read:', error);
    }
  };

  // Helper function to get notification ID safely
  const getNotificationId = (notification) => {
    return notification.id || notification.Id || `temp-${Math.random()}`;
  };

  // Helper function to normalize notification for display
  const normalizeForDisplay = (notification) => {
    return {
      id: getNotificationId(notification),
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
      // Keep raw data for debugging
      _raw: notification
    };
  };

  const getDisplayNotifications = () => {
    // Ensure we have arrays to work with
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const safeOutOfStock = Array.isArray(outOfStockNotifications) ? outOfStockNotifications : [];
    const safeOther = Array.isArray(otherNotifications) ? otherNotifications : [];

    switch (activeTab) {
      case 'outOfStock':
        return safeOutOfStock;
      case 'other':
        return safeOther;
      default:
        return safeNotifications;
    }
  };

  const displayNotifications = getDisplayNotifications();
  const normalizedDisplayNotifications = displayNotifications.map(normalizeForDisplay);

  console.log('🔔 [Modal] Normalized display notifications:', normalizedDisplayNotifications);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{unreadCount} unread</span>
                <div className={`flex items-center space-x-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-1 px-6">
            
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'outOfStock'
                  ? 'bg-red-100 text-red-700 border-b-2 border-red-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('outOfStock')}
            >
              Out of Stock ({outOfStockNotifications?.length || 0})
            </button>
            
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6">
          {normalizedDisplayNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications found</p>
              <p className="text-sm">Notifications will appear here when available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {normalizedDisplayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  } ${
                    notification.isOutOfStock ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {notification.isOutOfStock && (
                          <Package className="h-4 w-4 text-red-500" />
                        )}
                        <h3 className={`font-medium ${
                          notification.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {notification.createdAt 
                            ? new Date(notification.createdAt).toLocaleDateString()
                            : 'No date'
                          }
                        </span>
                        {notification.priority && (
                          <span className={`px-2 py-1 rounded ${
                            notification.priority === 'HIGH' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {notification.priority}
                          </span>
                        )}
                        {notification.isOutOfStock && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                  {/* Debug info - remove in production */}
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-500">
                    <div>Raw ID: {notification._raw?.Id || notification._raw?.id || 'No ID'}</div>
                    <div>Raw Type: {notification._raw?.Type || notification._raw?.type || 'No Type'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;