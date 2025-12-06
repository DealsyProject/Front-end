// src/Components/Vendor/Dashboard/hooks/useProfile.js
import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../Components/utils/axiosInstance';

export const useProfile = (setShowProfile, fetchDashboardData) => {
  const [profileForm, setProfileForm] = useState({
    vendorName: '',
    businessType: '',
    description: '',
    about: '',
  });
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isProfileCreated, setIsProfileCreated] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const profileInputRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('🔄 Loading profile...');
        const response = await axiosInstance.get('/vendorprofile');
        console.log('📦 Profile response:', response.data);

        // Handle the nested response structure: { Profile: {...} }
        const profile = response.data?.Profile || response.data?.profile || response.data;
        
        console.log('✅ Extracted profile:', profile);

        // Check if profile exists and has required data (support both camelCase and PascalCase)
        if (profile && (profile.vendorName || profile.VendorName)) {
          setProfileForm({
            vendorName: profile.vendorName || profile.VendorName || '',
            businessType: profile.businessType || profile.BusinessType || '',
            description: profile.description || profile.Description || '',
            about: profile.about || profile.About || '',
          });
          setProfilePreview(profile.profileImage || profile.ProfileImage || null);
          setIsProfileCreated(true);
          console.log('✅ Profile loaded successfully - isProfileCreated set to TRUE');
        } else {
          console.log('ℹ️ No profile found');
          setIsProfileCreated(false);
        }
      } catch (err) {
        console.log('❌ Error loading profile:', err);
        if (err.response?.status !== 404) {
          console.warn('Failed to load profile:', err);
        }
        setIsProfileCreated(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    // Store the actual file for upload
    setProfileImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePreview(ev.target?.result);
      toast.success('Image selected');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfileImage = () => {
    setProfilePreview(null);
    setProfileImageFile(null);
    if (profileInputRef.current) profileInputRef.current.value = '';
    toast.info('Image removed');
  };

  const handleProfileSave = async () => {
    const { vendorName, businessType, description, about } = profileForm;
    if (!vendorName || !businessType || !description || !about) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsUpdating(true);

    try {
      console.log('💾 Saving profile...');
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('vendorName', vendorName);
      formData.append('businessType', businessType);
      formData.append('description', description);
      formData.append('about', about);

      // Only append image if a new file was selected
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
        console.log('📸 Including new profile image');
      }

      let response;
      if (isProfileCreated) {
        console.log('🔄 Updating existing profile...');
        response = await axiosInstance.put('/vendorprofile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        console.log('➕ Creating new profile...');
        response = await axiosInstance.post('/vendorprofile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      console.log('✅ Profile saved:', response.data);
      
      // Update state with the new profile data (support both camelCase and PascalCase)
      const savedProfile = response.data?.Profile || response.data?.profile || response.data;
      if (savedProfile && (savedProfile.profileImage || savedProfile.ProfileImage)) {
        setProfilePreview(savedProfile.profileImage || savedProfile.ProfileImage);
      }

      toast.success('Profile saved successfully!');
      setIsProfileCreated(true);
      console.log('✅ Profile created flag set to TRUE');
      
      // Clear the file after successful upload
      setProfileImageFile(null);
      
      if (fetchDashboardData) fetchDashboardData();

    } catch (err) {
      console.error('❌ Profile save error:', err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.errorMessage || 'Failed to save profile';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
      setShowProfile(false);
    }
  };

  const handleProfileCancel = () => {
    setShowProfile(false);
    toast.info('Cancelled');
  };

  return {
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
  };
};