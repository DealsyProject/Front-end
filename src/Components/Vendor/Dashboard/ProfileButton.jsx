// Components/Vendor/Dashboard/ProfileButton.jsx
import React from 'react';
import { UserCircle, Plus } from 'lucide-react';

const ProfileButton = ({ 
  isProfileCreated, 
  onClick,
  className = "",
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium ${className}`}
        title="Loading profile..."
      >
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }

  if (isProfileCreated) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 bg-[#586330] text-white rounded-lg hover:bg-[#4a5428] transition-all duration-200 font-medium shadow-sm hover:shadow-md ${className}`}
        title="View My Profile"
        aria-label="View my profile"
      >
        <UserCircle className="w-5 h-5" />
        <span>My Profile</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-[#586330] text-white rounded-lg  transition-all duration-200 font-medium shadow-sm hover:shadow-md animate-pulse-subtle ${className}`}
      title="Create your profile to get started"
      aria-label="Create profile"
    >
      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
        <Plus className="w-4 h-4 text-[#586330]" />
      </div>
      <span>Create Profile</span>
    </button>
  );
};

export default ProfileButton;