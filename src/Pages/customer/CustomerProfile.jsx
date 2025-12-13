import React, { useState, useEffect } from "react";
import Navbar from "../../Components/customer/Common/Navbar";
import Footer from "../../Components/customer/Common/Footer";
import axiosInstance from "../../Components/utils/axiosInstance";
import CustomerOrders from "../../Components/customer/Orders/fetchCustomerOrders";
import { Pencil, Trash2, User } from "lucide-react";

export default function ProfilePage() {
  const [active, setActive] = useState("My Profile");
  const [profile, setProfile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const menu = ["My Profile", "My Orders", "Returned", "Refunded"];

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile
      const profileRes = await axiosInstance.get("/CustomerViewDetails/profile");
      const profileData = profileRes.data.data || profileRes.data;
      setProfile(profileData);

      // Fetch photo
      try {
        const photoRes = await axiosInstance.get("/CustomerPicture/photoView");
        if (photoRes.data?.photoUrl) {
          setPhotoUrl(photoRes.data.photoUrl);
        }
      } catch (photoError) {
        console.warn("Could not fetch profile photo:", photoError);
        // Continue without photo - it's optional
      }

    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Unable to fetch profile details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when My Orders tab is selected
  useEffect(() => {
    if (active === "My Orders") {
      fetchOrders();
    }
  }, [active]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await axiosInstance.get("/Order/customer-orders");
      setOrders(response.data.data || response.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Upload Profile Photo
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("Image size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("Photo", file);

    try {
      setIsUploading(true);
      const res = await axiosInstance.put("/CustomerPicture/photoUpdate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.photoUrl) {
        setPhotoUrl(res.data.photoUrl);
        alert("Profile picture updated successfully!");
      } else {
        alert("Profile picture updated, but no URL returned.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Delete Photo
  const handlePhotoDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?")) return;

    try {
      await axiosInstance.delete("/CustomerPicture/photoDelete");
      setPhotoUrl(null);
      alert("Profile picture deleted successfully!");
    } catch (err) {
      console.error("Error deleting photo:", err);
      alert("Failed to delete photo. Please try again.");
    }
  };

  // Helper to get field values
  const getField = (field) => {
    if (!profile) return "Loading...";
    return profile[field] || profile[field.toLowerCase()] || "Not provided";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex justify-center px-4 py-8">
        <div className="bg-white rounded-xl shadow-md w-full max-w-6xl p-6 flex flex-col md:flex-row gap-8">
          {/* LEFT - PROFILE SIDEBAR */}
          <div className="w-full md:w-1/4 border rounded-xl p-6 flex-shrink-0">
            <div className="flex flex-col items-center">
              {/* Profile Photo */}
              <div className="relative mb-4">
                {loading ? (
                  <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
                ) : (
                  <>
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#586330]">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <User size={48} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <label className="absolute bottom-2 right-2 bg-[#586330] text-white p-2 rounded-full cursor-pointer hover:bg-[#586330]/90 transition">
                      <Pencil size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="text-white font-medium">Uploading...</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* User Name */}
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {getField("FullName")}
              </h2>
              <p className="text-gray-600 text-sm mb-6">{getField("Email")}</p>

              {/* Sidebar Menu */}
              <div className="w-full space-y-2">
                {menu.map((item) => (
                  <button
                    key={item}
                    onClick={() => setActive(item)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      active === item
                        ? "bg-[#586330] text-white font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT - CONTENT AREA */}
          <div className="flex-1 border rounded-xl p-6 min-h-[500px]">
            {active === "My Profile" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b">
                  Profile Information
                </h3>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-8 bg-gray-200 animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                      onClick={fetchProfileData}
                      className="px-4 py-2 bg-[#586330] text-white rounded hover:bg-[#586330]/90"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-lg font-medium">{getField("FullName")}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-lg font-medium">{getField("Email")}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-lg font-medium">{getField("PhoneNumber")}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Pincode</p>
                      <p className="text-lg font-medium">{getField("Pincode")}</p>
                    </div>
                    
                    <div className="md:col-span-2 space-y-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-lg font-medium">{getField("Address")}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === "My Orders" && (
              <CustomerOrders />
            )}

            {active === "Returned" && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No returned orders yet</p>
                <p className="text-sm text-gray-400">Your returned orders will appear here</p>
              </div>
            )}

            {active === "Refunded" && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No refunded orders yet</p>
                <p className="text-sm text-gray-400">Your refunded orders will appear here</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}