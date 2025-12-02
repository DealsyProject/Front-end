// Components/Vendor/Dashboard/DashboardHeader.jsx
import React from 'react';
import ProfileModal from './modals/ProfileModal';
import ProfileDisplay from './ProfileDisplay';
import { AlertTriangle } from 'lucide-react';

const DashboardHeader = ({
  activeView,
  setShowMessages,
  setShowNotifications,
  showProfile,
  setShowProfile,
  handleLogout,
  messageThreads,
  notifications,
  userData,
  vendorData,
  profileForm,
  profilePreview,
  isProfileCreated,
  isUpdating,
  handleInputChange,
  handleProfileSave,
  handleProfileCancel,
  handleProfileImageUpload,
  handleRemoveProfileImage,
  profileInputRef,
  handleBackdropClick
}) => {
  // Count out-of-stock notifications
  const outOfStockCount = notifications?.filter(n => n.isOutOfStock && n.status === 'New')?.length || 0;
  const orderNotificationsCount = notifications?.filter(n => !n.isOutOfStock && n.status === 'New')?.length || 0;
  const totalNotificationsCount = outOfStockCount + orderNotificationsCount;

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center relative">
      <h2 className="text-2xl font-bold text-gray-800">
        {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
      </h2>

      <div className="flex items-center space-x-4">
        

        {/* Notification Button */}
        <button
          onClick={() => setShowNotifications(true)}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors relative"
          title="Notifications"
        >
          Notifications
          {totalNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
              {totalNotificationsCount}
            </span>
          )}
        </button>

        {/* Out of Stock Alert Badge */}
        {outOfStockCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            {outOfStockCount} Out of Stock
          </div>
        )}

        {/* Profile Display */}
        <ProfileDisplay
          userData={userData}
          vendorData={vendorData}
          isProfileCreated={isProfileCreated}
          profileForm={profileForm}
          profilePreview={profilePreview}
          setShowProfile={setShowProfile}
          handleRemoveProfileImage={handleRemoveProfileImage}
        />
      </div>

      {/* Profile Modal - Render inside Header */}
      {showProfile && (
        <ProfileModal
          setShowProfile={setShowProfile}
          profileForm={profileForm}
          handleInputChange={handleInputChange}
          profileInputRef={profileInputRef}
          handleProfileImageUpload={handleProfileImageUpload}
          profilePreview={profilePreview}
          handleRemoveProfileImage={handleRemoveProfileImage}
          handleProfileCancel={handleProfileCancel}
          handleProfileSave={handleProfileSave}
          handleBackdropClick={handleBackdropClick}
          isUpdating={isUpdating}
        />
      )}
    </header>
  );
};

export default DashboardHeader;