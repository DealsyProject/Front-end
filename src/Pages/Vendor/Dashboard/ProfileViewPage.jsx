import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Briefcase, Star, MapPin, Phone, Mail, Globe, Clock, Award, Users, Truck, Shield, Building, Package, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import axiosInstance from '../../../Components/utils/axiosInstance';
import { toast } from 'react-toastify';

const ProfileViewPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    customerRating: 4.8,
    ordersCompleted: 0,
    activeProducts: 0,
    totalRevenue: 0
  });
  const [vendorStats, setVendorStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('🔄 Fetching vendor profile...');
        const response = await axiosInstance.get('/vendorprofile');
        console.log('📦 Profile response:', response.data);
        
        const profileData = response.data?.Profile || response.data?.profile;
        
        if (profileData) {
          console.log('✅ Profile data received:', profileData);
          setProfile(profileData);
          
          // Fetch vendor stats
          await fetchVendorStats(profileData.VendorName || '');
        } else {
          console.log('⚠️ No profile data found');
          toast.error('Profile not found. Please create your profile first.');
          navigate('/vendor-dashboard', { state: { openProfileModal: true } });
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        console.error('Error response:', error.response?.data);
        
        if (error.response?.status === 404 || error.response?.data?.message?.includes('not found')) {
          toast.error('Profile not found. Please create your profile first.');
          navigate('/vendor-dashboard', { state: { openProfileModal: true } });
        } else {
          toast.error('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchVendorStats = async (vendorName) => {
      try {
        console.log('📊 Fetching vendor stats...');
        // Note: You'll need to implement these API endpoints in your backend
        // For now, using placeholder data
        const statsResponse = await axiosInstance.get('/vendor/stats');
        
        if (statsResponse.data) {
          setVendorStats({
            totalOrders: statsResponse.data.totalOrders || 0,
            totalRevenue: statsResponse.data.totalRevenue || 0,
            totalProducts: statsResponse.data.totalProducts || 0,
            totalCustomers: statsResponse.data.totalCustomers || 0
          });
        }
      } catch (error) {
        console.error('❌ Error fetching vendor stats:', error);
        // Use default stats
        setVendorStats({
          totalOrders: 0,
          totalRevenue: 0,
          totalProducts: 0,
          totalCustomers: 0
        });
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleEdit = () => {
    navigate('/vendor-dashboard', { state: { openProfileModal: true } });
  };

  const handleBack = () => {
    navigate('/vendor-dashboard');
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Get business type display text
  const getBusinessTypeDisplay = (businessType) => {
    if (businessType === 'All') {
      return 'Multiple Categories';
    }
    return businessType;
  };

  // Get business description placeholder based on business type
  const getBusinessDescriptionPlaceholder = (businessType) => {
    if (businessType === 'All') {
      return "We offer a wide range of products across multiple categories, providing customers with a one-stop shopping experience. Our commitment to quality and customer satisfaction spans all our product lines.";
    }
    return "We are a premium provider of quality products with a commitment to customer satisfaction and sustainable business practices.";
  };

  // Get about section placeholder based on business type
  const getAboutPlaceholder = (businessType, vendorName) => {
    if (businessType === 'All') {
      return `Welcome to ${vendorName}, your trusted partner for a diverse range of quality products across multiple categories. With over a decade of experience in the industry, we have built a reputation for excellence, reliability, and outstanding customer service across all product lines.`;
    }
    return `Welcome to ${vendorName}, your trusted partner for premium quality products. With over a decade of experience in the ${businessType} industry, we have built a reputation for excellence, reliability, and outstanding customer service.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#586330] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profile not found</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-[#586330] text-white rounded-lg hover:bg-[#4a5428] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const contactInfo = profile.ContactInfo || {};
  const businessTypeDisplay = getBusinessTypeDisplay(profile.BusinessType);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-[#586330] text-white rounded-lg hover:bg-[#4a5428] transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
       

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          {/* Cover Banner */}
          <div className="h-48 bg-gradient-to-r from-[#586330] to-[#8a9a5b] relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-4xl font-bold mb-2">Welcome to {profile.VendorName}</h1>
                <p className="text-lg opacity-90">Your trusted partner for quality products</p>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            {/* Profile Picture */}
            <div className="relative -mt-20 mb-6">
              {profile.ProfileImage ? (
                <div className="relative w-40 h-40">
                  <img
                    src={profile.ProfileImage}
                    alt={profile.VendorName}
                    className="w-40 h-40 rounded-full object-cover border-8 border-white shadow-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="w-40 h-40 rounded-full bg-[#586330] items-center justify-center text-white text-5xl font-bold border-8 border-white shadow-xl absolute top-0 left-0"
                    style={{ display: 'none' }}
                  >
                    {profile.VendorName?.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-full bg-[#586330] flex items-center justify-center text-white text-5xl font-bold border-8 border-white shadow-xl">
                  {profile.VendorName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name and Business Type */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {profile.VendorName}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-5 h-5" />
                  <span className="text-lg capitalize">
                    {businessTypeDisplay}
                  </span>
                  {profile.BusinessType === 'All' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      General Store
                    </span>
                  )}
                </div>
                {contactInfo.CompanyName && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building className="w-5 h-5" />
                    <span className="text-lg">{contactInfo.CompanyName}</span>
                  </div>
                )}
                {/* Rating Display
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{stats.customerRating}</span>
                  <span className="text-gray-500">({formatNumber(vendorStats.totalCustomers)} reviews)</span>
                </div> */}
              </div>
            </div>

            {/* Business Description */}
            <div className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-6 h-6" />
                {profile.BusinessType === 'All' ? 'Business Overview' : 'Business Description'}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-600 leading-relaxed text-lg">
                  {profile.Description || getBusinessDescriptionPlaceholder(profile.BusinessType)}
                </p>
              </div>
            </div>

            {/* About Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Story</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                {profile.About || getAboutPlaceholder(profile.BusinessType, profile.VendorName)}
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-r from-[#586330] to-[#8a9a5b] rounded-xl shadow-sm p-6">
                  <div className="space-y-6">
                    {contactInfo.Location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-white" />
                        <div>
                          <div className="font-medium text-white">Location</div>
                          <div className="text-white">{contactInfo.Location}</div>
                        </div>
                      </div>
                    )}
                    
                    {contactInfo.PhoneNumber && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-white" />
                        <div>
                          <div className="font-medium text-white">Phone</div>
                          <div className="text-white">{contactInfo.PhoneNumber}</div>
                        </div>
                      </div>
                    )}
                    
                    {(contactInfo.Email || contactInfo.CompanyEmail) && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-white" />
                        <div>
                          <div className="font-medium text-white">Email</div>
                          <div className="text-white">{contactInfo.CompanyEmail || contactInfo.Email}</div>
                        </div>
                      </div>
                    )}
                    
                    {contactInfo.CompanyOwnerName && (
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-white" />
                        <div>
                          <div className="font-medium text-white">Company Owner</div>
                          <div className="text-white">{contactInfo.CompanyOwnerName}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Business Hours */}
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-white" />
                      <div>
                        <div className="font-medium text-white">Business Hours</div>
                        <div className="text-white">Mon-Fri: 9AM-6PM | Sat: 10AM-4PM</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certifications & Features */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Certifications & Badges
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.BusinessType === 'All' ? (
                        <>
                          <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                            Multi-Category Verified
                          </span>
                          <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                            Quality Certified
                          </span>
                          <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                            Trusted Seller
                          </span>
                          <span className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
                            Fast Shipping
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                            Verified Seller
                          </span>
                          <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                            Quality Certified
                          </span>
                          <span className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                            Eco-Friendly
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                 

                 
                </div>
              </div>
            </div>

           
          </div>
        </div>

      

      
      </div>
    </div>
  );
};

export default ProfileViewPage;