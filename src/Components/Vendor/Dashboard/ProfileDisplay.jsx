// // Components/Vendor/Dashboard/ProfileDisplay.jsx
// import React from 'react';

// const ProfileDisplay = ({
//   userData,
//   isProfileCreated,
//   profileForm,
//   profilePreview,
//   setShowProfile,
//   handleRemoveProfileImage
// }) => {
//   if (!userData) return null;

//   const displayName = profileForm.vendorName || userData.vendorName;
//   const displayImage = profilePreview || userData.profileImage;
//   const displayType = profileForm.businessType || userData.businessType || 'Vendor';

//   return (
//     <div
//       className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
//       onClick={() => setShowProfile(true)}
//     >
//       {displayImage ? (
//         <div className="relative group">
//           <img
//             src={displayImage}
//             alt="Profile"
//             className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
//           />
//           <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//             <button className="p-1 text-white hover:text-blue-200" title="Edit">
//               Edit
//             </button>
//           </div>
//         </div>
//       ) : (
//         <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
//           {displayName?.charAt(0).toUpperCase() || 'V'}
//         </div>
//       )}
//       <div className="flex flex-col">
//         <span className="text-gray-700 font-medium">{displayName || 'Vendor'}</span>
//         <span className="text-xs text-gray-500">{displayType}</span>
//       </div>
//     </div>
//   );
// };

// export default ProfileDisplay;