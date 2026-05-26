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
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const profileInputRef = useRef(null);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('🔄 Loading categories...');
        const token = localStorage.getItem('authToken');
if (!token) {
  console.warn("No token, skipping API call");
  return;
}
        const response = await axiosInstance.get('/category/names');
        console.log('📦 Categories response:', response.data);
        
        const categoryList = response.data?.categories || [];
        
        // Add "All" category at the beginning and ensure no duplicates
        const categoriesWithAll = ['All', ...categoryList.filter(cat => cat !== 'All')];
        
        setCategories(categoriesWithAll);
        console.log('✅ Categories loaded with "All":', categoriesWithAll);
      } catch (err) {
        console.error('❌ Error loading categories:', err);
        toast.error('Failed to load business types');
        // Fallback with "All" category
        setCategories(['All', 'Grocery', 'Furniture', 'Books', 'Home Appliance', 'Cloth']);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Load existing profile - Update to handle "All" category
  useEffect(() => {
    const loadProfile = async () => {
      setIsProfileLoading(true);
      try {
        console.log('🔄 Loading profile...');
        const response = await axiosInstance.get('/vendorprofile');
        console.log('📦 Profile response:', response.data);

        const profile = response.data?.Profile;
        
        console.log('✅ Extracted profile:', profile);

        // Check if profile exists and has data
        if (profile && profile.VendorName) {
          setProfileForm({
            vendorName: profile.VendorName || '',
            businessType: profile.BusinessType || '',
            description: profile.Description || '',
            about: profile.About || '',
          });
          setProfilePreview(profile.ProfileImage || null);
          setIsProfileCreated(true);
          console.log('✅ Profile loaded successfully - isProfileCreated set to TRUE');
        } else {
          // Profile doesn't exist yet
          console.log('ℹ️ No profile found:', response.data?.Message || 'Profile not created yet');
          setIsProfileCreated(false);
          
          // Reset form to empty state
          setProfileForm({
            vendorName: '',
            businessType: '',
            description: '',
            about: '',
          });
          setProfilePreview(null);
        }
      } catch (err) {
        console.log('❌ Error loading profile:', err);
        if (err.response?.status !== 404) {
          console.warn('Failed to load profile:', err);
        }
        setIsProfileCreated(false);
        
        // Reset form on error
        setProfileForm({
          vendorName: '',
          businessType: '',
          description: '',
          about: '',
        });
        setProfilePreview(null);
      } finally {
        setIsProfileLoading(false);
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    setProfileImageFile(file);

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
    
    // Validation - Check if "All" is selected
    if (!vendorName || !businessType || !description || !about) {
      toast.error('Please fill all required fields');
      return;
    }

    
    if (vendorName.trim().length < 2) {
      toast.error('Vendor name must be at least 2 characters');
      return;
    }

    if (description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    if (about.trim().length < 10) {
      toast.error('About must be at least 10 characters');
      return;
    }

    setIsUpdating(true);

    try {
      console.log('💾 Saving profile...');
      
      const formData = new FormData();
      formData.append('vendorName', vendorName.trim());
      formData.append('businessType', businessType);
      formData.append('description', description.trim());
      formData.append('about', about.trim());

      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
        console.log('📸 Including new profile image');
      }

      const response = await axiosInstance({
        method: isProfileCreated ? 'PUT' : 'POST',
        url: '/vendorprofile',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Profile saved:', response.data);
      
      const savedProfile = response.data;
      
      if (savedProfile) {
        setProfileForm({
          vendorName: savedProfile.VendorName || vendorName,
          businessType: savedProfile.BusinessType || businessType,
          description: savedProfile.Description || description,
          about: savedProfile.About || about,
        });
        
        if (savedProfile.ProfileImage) {
          setProfilePreview(savedProfile.ProfileImage);
        }
      }

      toast.success(isProfileCreated ? 'Profile updated successfully!' : 'Profile created successfully!');
      setIsProfileCreated(true);
      console.log('✅ Profile created flag set to TRUE');
      
      setProfileImageFile(null);
      if (profileInputRef.current) {
        profileInputRef.current.value = '';
      }
      
      if (fetchDashboardData) {
        fetchDashboardData();
      }

    } catch (err) {
      console.error('❌ Profile save error:', err);
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.errors?.[0]?.message 
        || 'Failed to save profile';
      toast.error(errorMessage);
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
    isProfileLoading,
    categories,
    isCategoriesLoading,
    handleInputChange,
    handleProfileSave,
    handleProfileCancel,
    handleProfileImageUpload,
    handleRemoveProfileImage,
    profileInputRef
  };
};