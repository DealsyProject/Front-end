// Components/Vendor/Dashboard/modals/ProfileModal.jsx
import React from 'react';

const ProfileModal = ({
  setShowProfile,
  profileForm,
  handleInputChange,
  profileInputRef,
  handleProfileImageUpload,
  profilePreview,
  handleRemoveProfileImage,
  handleProfileCancel,
  handleProfileSave,
  handleBackdropClick,
  isUpdating,
  categories,
  isCategoriesLoading
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-xl w-full max-w-6xl h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {profileForm.vendorName ? 'Edit Your Profile' : 'Create Your Profile'}
          </h2>
          <button
            onClick={() => setShowProfile(false)}
            className="text-gray-500 hover:text-gray-700 text-xl p-2 transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Details</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="vendorName"
                      name="vendorName"
                      type="text"
                      value={profileForm.vendorName || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your vendor name"
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type / Category <span className="text-red-500">*</span>
                    </label>
                    {isCategoriesLoading ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <span className="text-gray-500">Loading categories...</span>
                      </div>
                    ) : (
                      <select
                        id="businessType"
                        name="businessType"
                        value={profileForm.businessType || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select your business category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category === 'All' ? `${category} (General/Multiple Categories)` : category}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {profileForm.businessType === 'All' 
                        ? 'Select "All" if you deal in multiple product categories' 
                        : 'Select the main category for your business'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={profileForm.description || ''}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    profileForm.businessType === 'All' 
                      ? "Describe your business across multiple categories, products, and what makes you unique..."
                      : "Describe your business, products, and what makes you unique..."
                  }
                  required
                  minLength={10}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profileForm.description?.length || 0}/1000 characters
                </p>
              </div>

              <div>
                <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
                  About <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="about"
                  name="about"
                  value={profileForm.about || ''}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    profileForm.businessType === 'All'
                      ? "Tell us more about your business story and mission across different categories..."
                      : "Tell us more about your business story and mission..."
                  }
                  required
                  minLength={10}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profileForm.about?.length || 0}/1000 characters
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h3>
                <input
                  type="file"
                  ref={profileInputRef}
                  onChange={handleProfileImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div
                  onClick={() => profileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      profileInputRef.current?.click();
                    }
                  }}
                >
                  {profilePreview ? (
                    <div className="relative">
                      <img
                        src={profilePreview}
                        alt="Profile Preview"
                        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveProfileImage();
                        }}
                        className="absolute top-0 right-1/4 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 shadow-md"
                        aria-label="Remove profile picture"
                      >
                        ✕
                      </button>
                      <p className="text-sm text-green-600 font-medium">Profile picture uploaded</p>
                      <p className="text-xs text-gray-500 mt-1">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-gray-600 font-medium">Click to upload profile picture</span>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Information */}
              {profileForm.businessType === 'All' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    ℹ️ About "All" Category
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• You'll be able to list products in any category</li>
                    <li>• Your profile will appear in all category searches</li>
                    <li>• Ideal for general stores and multi-category businesses</li>
                    <li>• You can still specify categories for individual products</li>
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  onClick={handleProfileCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  type="button"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  disabled={
                    isUpdating || 
                    !profileForm.vendorName?.trim() || 
                    !profileForm.businessType || 
                    !profileForm.description?.trim() || 
                    !profileForm.about?.trim() ||
                    isCategoriesLoading
                    // Removed: profileForm.businessType === 'All'
                  }
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  type="button"
                  title={profileForm.businessType === 'All' ? 'Save profile with multiple categories' : ''}
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    profileForm.vendorName ? 'Update Profile' : 'Create Profile'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;