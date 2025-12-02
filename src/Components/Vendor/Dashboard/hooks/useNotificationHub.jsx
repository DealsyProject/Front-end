import { useEffect, useRef, useCallback, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { toast } from 'react-toastify';

export const useNotificationHub = () => {
  const connectionRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Get JWT token from localStorage
  const getToken = useCallback(() => {
    try {
      const authData = localStorage.getItem('authToken');
      return authData;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }, []);

  // Initialize SignalR connection
  const initializeConnection = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.warn('⚠️ No authentication token available');
      return;
    }

    // Stop existing connection if any
    if (connectionRef.current) {
      await connectionRef.current.stop();
    }

    try {
      console.log('🔄 [SignalR] Starting connection...');

      // Try multiple endpoint URLs
      const baseUrls = [
        'https://localhost:7001/hubs/notification',
        'https://localhost:7001/notificationHub'
      ];

      let connection;
      let lastError;

      for (const url of baseUrls) {
        try {
          connection = new signalR.HubConnectionBuilder()
            .withUrl(url, {
              accessTokenFactory: () => token,
              transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
              skipNegotiation: false, // Let SignalR handle negotiation
              withCredentials: true
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000]) // Retry intervals
            .withHubProtocol(new signalR.JsonHubProtocol())
            .configureLogging(signalR.LogLevel.Warning)
            .build();

          // Set up event handlers
          setupConnectionHandlers(connection);

          await connection.start();
          console.log(`✓ [SignalR] Connected successfully to ${url}`);
          connectionRef.current = connection;
          setConnectionStatus('connected');
          setIsConnected(true);
          reconnectCountRef.current = 0;
          return;

        } catch (error) {
          lastError = error;
          console.warn(`⚠️ [SignalR] Failed to connect to ${url}:`, error.message);
          if (connection) {
            await connection.stop();
          }
        }
      }

      // If all URLs failed, throw the last error
      throw lastError;

    } catch (error) {
      console.error('❌ [SignalR] All connection attempts failed:', error);
      setConnectionStatus('error');
      setIsConnected(false);

      reconnectCountRef.current++;
      if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
        console.log(`⏳ Retrying connection in ${delay}ms... (attempt ${reconnectCountRef.current})`);
        
        setTimeout(() => {
          initializeConnection();
        }, delay);
      } else {
        console.error('❌ [SignalR] Max reconnection attempts reached');
        toast.error('Failed to connect to notification service', {
          position: 'top-right',
          autoClose: 5000
        });
      }
    }
  }, [getToken]);

  // Setup connection event handlers
  const setupConnectionHandlers = (connection) => {
    connection.onreconnecting((error) => {
      console.log('🔄 [SignalR] Attempting to reconnect...', error?.message);
      setConnectionStatus('reconnecting');
      setIsConnected(false);
    });

    connection.onreconnected((connectionId) => {
      console.log('✓ [SignalR] Reconnected successfully. Connection ID:', connectionId);
      setConnectionStatus('connected');
      setIsConnected(true);
      reconnectCountRef.current = 0;
    });

    connection.onclose((error) => {
      console.log('✗ [SignalR] Connection closed', error?.message);
      setConnectionStatus('disconnected');
      setIsConnected(false);
    });

    // In your useNotificationHub.js, update the ReceiveNotification handler
    connection.on('ReceiveNotification', (notification) => {
      console.log('📨 [SignalR] RAW notification received:', notification);
      console.log('📨 [SignalR] Notification type:', typeof notification);
      console.log('📨 [SignalR] Notification keys:', Object.keys(notification));
      
      // Normalize the notification structure (handle both PascalCase and camelCase)
      const normalizedNotification = {
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
                      notification.Type?.toLowerCase() === 'out_of_stock' || 
                      notification.type?.toLowerCase() === 'out_of_stock',
        productName: notification.ProductName || notification.productName,
        vendorId: notification.VendorId || notification.vendorId,
        source: 'signalr'
      };

      console.log('📨 [SignalR] Normalized notification:', normalizedNotification);
      
      setNotifications(prev => {
        const exists = prev.find(n => n.id === normalizedNotification.id);
        if (exists) {
          return prev.map(n => n.id === normalizedNotification.id ? normalizedNotification : n);
        }
        return [normalizedNotification, ...prev];
      });

      if (!normalizedNotification.isRead) {
        setUnreadCount(prev => prev + 1);
      }

      // Show toast for out-of-stock notifications
      if (normalizedNotification.isOutOfStock) {
        toast.warning(`⚠️ ${normalizedNotification.title}`, {
          position: 'top-right',
          autoClose: 5000,
        });
      } else {
        toast.info(normalizedNotification.title, {
          position: 'top-right',
          autoClose: 3000
        });
      }
    });

  // In the AllNotificationsLoaded handler:
connection.on('AllNotificationsLoaded', (allNotifications) => {
  console.log('📂 [SignalR] All notifications loaded:', allNotifications?.length || 0);
  
  if (allNotifications) {
    // Handle both array format and {notifications: [...]} format
    let notificationsArray = [];
    
    if (Array.isArray(allNotifications)) {
      notificationsArray = allNotifications;
    } else if (allNotifications.notifications && Array.isArray(allNotifications.notifications)) {
      notificationsArray = allNotifications.notifications;
    } else if (allNotifications.Notifications && Array.isArray(allNotifications.Notifications)) {
      notificationsArray = allNotifications.Notifications;
    }
    
    // Normalize all notifications
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
    
    console.log('📂 [SignalR] Normalized notifications:', normalizedNotifications);
    setNotifications(normalizedNotifications);
    const unread = normalizedNotifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }
});

    connection.on('NotificationMarkedAsRead', (notificationId) => {
      console.log('✓ [SignalR] Notification marked as read:', notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    connection.on('UnreadCountUpdated', (count) => {
      console.log('🔔 [SignalR] Unread count updated:', count);
      setUnreadCount(count);
    });

    connection.on('ConnectionEstablished', (data) => {
      console.log('✓ [SignalR] Connection established:', data);
      setConnectionStatus('connected');
      setIsConnected(true);
    });
  };

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    if (connectionRef.current?.state !== signalR.HubConnectionState.Connected) {
      console.warn('⚠️ [SignalR] Connection not available');
      return false;
    }

    try {
      await connectionRef.current.invoke('MarkNotificationAsRead', notificationId);
      console.log('✓ [SignalR] Mark notification request sent:', notificationId);
      return true;
    } catch (error) {
      console.error('❌ [SignalR] Error marking notification as read:', error);
      return false;
    }
  }, []);

  // Refresh all notifications
  const refreshNotifications = useCallback(async () => {
    if (connectionRef.current?.state !== signalR.HubConnectionState.Connected) {
      console.warn('⚠️ [SignalR] Connection not available');
      return false;
    }

    try {
      await connectionRef.current.invoke('GetAllNotifications');
      console.log('✓ [SignalR] Refresh notifications requested');
      return true;
    } catch (error) {
      console.error('❌ [SignalR] Error refreshing notifications:', error);
      return false;
    }
  }, []);

  // Disconnect connection
  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
        console.log('✓ [SignalR] Connection stopped');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        reconnectCountRef.current = MAX_RECONNECT_ATTEMPTS;
      } catch (error) {
        console.error('❌ [SignalR] Error stopping connection:', error);
      }
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeConnection();

    return () => {
      disconnect();
    };
  }, [initializeConnection, disconnect]);

  return {
    connection: connectionRef.current,
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    markNotificationAsRead,
    refreshNotifications,
    reconnect: initializeConnection,
    disconnect
  };
};