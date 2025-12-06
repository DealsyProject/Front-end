import React from 'react';
import { UserCircle, Plus } from 'lucide-react';

const ProfileButton = ({ 
  isProfileCreated, 
  onClick,
  className = "" 
}) => {
  if (isProfileCreated) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 bg-[#586330]/80 text-white rounded-lg hover:bg-[#586330]/90 transition-colors font-medium ${className}`}
        title="View My Profile"
      >
        <UserCircle className="w-5 h-5" />
        <span>My Profile</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-[#586330]/50 text-white rounded-lg hover:bg-[#586330]/60 transition-colors font-medium ${className}`}
      title="Create Profile"
    >
      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
        <Plus className="w-4 h-4 text-[#586330]" />
      </div>
      <span>Create Profile</span>
    </button>
  );
};

export default ProfileButton;