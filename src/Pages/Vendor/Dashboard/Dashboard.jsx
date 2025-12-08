import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useLocation } from 'react-router-dom';

// Import components
import MessagesModal from '../../../Components/Vendor/Dashboard/modals/MessagesModal';
import NotificationsModal from '../../../Components/Vendor/Dashboard/modals/NotificationsModal';
import Sidebar from "../../../Components/Vendor/Dashboard/Sidebar";
import DashboardHeader from '../../../Components/Vendor/Dashboard/DashboardHeader';
import DashboardMain from '../../../Components/Vendor/Dashboard/DashboardMain';
import LoadingState from '../../../Components/Vendor/Dashboard/LoadingState';
import ErrorState from '../../../Components/Vendor/Dashboard/ErrorState';

// Import hooks
import { useDashboardData } from '../../../Components/Vendor/Dashboard/hooks/useDashboardData';
import { useProfile } from '../../../Components/Vendor/Dashboard/hooks/useProfile';
import { useNotificationHub } from '../../../Components/Vendor/Dashboard/hooks/useNotificationHub';

const Dashboard = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch dashboard data
  const {
    userData,
    vendorData,
    financialData,
    recentActivities,
    isLoading,
    messageThreads,
    notifications: dashboardNotifications,
    fetchDashboardData,
    refreshActivities
  } = useDashboardData(navigate);

  // Profile hook
  const {
    profileForm,
    profilePreview,
    isProfileCreated,
    isUpdating,
    handleInputChange,
    handleProfileSave,
    handleProfileCancel,
    handleProfileImageUpload,
    handleRemoveProfileImage,
    profileInputRef
  } = useProfile(setShowProfile, fetchDashboardData);

  // SignalR hook
  const {
    notifications: signalRNotifications,
    unreadCount,
    isConnected,
    connectionStatus,
    markNotificationAsRead,
    refreshNotifications
  } = useNotificationHub();

  // Check if should open profile modal from navigation state
  useEffect(() => {
    console.log('📍 Location state:', location.state);
    if (location.state?.openProfileModal) {
      console.log('✅ Opening profile modal from navigation state');
      setShowProfile(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Log profile creation status
  useEffect(() => {
    console.log('👤 Profile created status:', isProfileCreated);
  }, [isProfileCreated]);

  const allNotifications = useMemo(() => {
    const primaryNotifications = isConnected && signalRNotifications?.length > 0 
      ? signalRNotifications 
      : dashboardNotifications || [];

    const normalized = primaryNotifications.map(n => ({
      id: n.id,
      type: n.type || '',
      title: n.title || '',
      message: n.message || '',
      productId: n.productId,
      createdAt: n.createdAt || n.createdOn,
      isRead: n.isRead || false,
      priority: n.priority || '',
      isOutOfStock: n.isOutOfStock === true || 
                    n.type?.toLowerCase() === 'out_of_stock' || 
                    n.type?.toLowerCase() === 'out-of-stock',
      source: isConnected ? 'signalr' : 'api',
      _raw: n
    }));

    return normalized;
  }, [signalRNotifications, dashboardNotifications, isConnected]);

  const outOfStockNotifications = useMemo(() => {
    return allNotifications.filter(n => n.isOutOfStock === true);
  }, [allNotifications]);

  const otherNotifications = useMemo(() => {
    return allNotifications.filter(n => !n.isOutOfStock);
  }, [allNotifications]);

  const handleMarkNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const success = await markNotificationAsRead(notificationId);
      
      if (success) {
        toast.success('Notification marked as read');
        fetchDashboardData();
      } else {
        toast.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, [markNotificationAsRead, fetchDashboardData]);

  const handleRefreshNotifications = useCallback(async () => {
    if (isConnected) {
      const signalRSuccess = await refreshNotifications();
      if (signalRSuccess) {
        toast.success('Notifications refreshed');
        return;
      }
    }
    
    await fetchDashboardData();
    toast.success('Notifications refreshed');
  }, [refreshNotifications, fetchDashboardData, isConnected]);

  const handleProfileNavigate = useCallback(() => {
    console.log('🚀 Navigating to profile view page...');
    console.log('   Profile created:', isProfileCreated);
    
    if (isProfileCreated) {
      navigate('/vendor/profile');
    } else {
      console.log('⚠️ Profile not created yet, opening modal instead');
      setShowProfile(true);
    }
  }, [navigate, isProfileCreated]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tempUserData');
    navigate('/login');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowProfile(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (!userData) return <ErrorState message="Unable to load user data" />;

  return (
    <div className="flex h-screen bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* External Modals */}
      {showMessages && (
        <MessagesModal
          setShowMessages={setShowMessages}
          messageThreads={messageThreads}
        />
      )}

      {showNotifications && (
        <NotificationsModal
          setShowNotifications={setShowNotifications}
          notifications={allNotifications}
          outOfStockNotifications={outOfStockNotifications}
          otherNotifications={otherNotifications}
          markNotificationAsRead={handleMarkNotificationAsRead}
          refreshNotifications={handleRefreshNotifications}
          unreadCount={unreadCount}
          isConnected={isConnected}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        handleLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
        userData={userData}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Profile Modal */}
        <DashboardHeader
          activeView={activeView}
          setShowMessages={setShowMessages}
          setShowNotifications={setShowNotifications}
          showProfile={showProfile}
          setShowProfile={setShowProfile}
          handleLogout={handleLogout}
          messageThreads={messageThreads}
          notifications={allNotifications}
          userData={userData}
          vendorData={vendorData}
          profileForm={profileForm}
          profilePreview={profilePreview}
          isProfileCreated={isProfileCreated}
          isUpdating={isUpdating}
          handleInputChange={handleInputChange}
          handleProfileSave={handleProfileSave}
          handleProfileCancel={handleProfileCancel}
          handleProfileImageUpload={handleProfileImageUpload}
          handleRemoveProfileImage={handleRemoveProfileImage}
          profileInputRef={profileInputRef}
          handleBackdropClick={handleBackdropClick}
          unreadCount={unreadCount}
          connectionStatus={connectionStatus}
          outOfStockCount={outOfStockNotifications.length}
          onProfileNavigate={handleProfileNavigate}
        />

        {/* Main Dashboard Content */}
        <DashboardMain
          activeView={activeView}
          financialData={financialData}
          recentActivities={recentActivities}
          setShowMessages={setShowMessages}
          setShowNotifications={setShowNotifications}
          messageThreads={messageThreads}
          notifications={allNotifications}
          outOfStockNotifications={outOfStockNotifications}
          otherNotifications={otherNotifications}
          refreshNotifications={handleRefreshNotifications}
          unreadCount={unreadCount}
          isConnected={isConnected}
          isLoading={false}
        />
      </div>
    </div>
  );
};

export default Dashboard;