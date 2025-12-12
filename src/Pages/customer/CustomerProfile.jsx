import React, { useState, useEffect } from "react";
import Navbar from "../../Components/customer/Common/Navbar";
import Footer from "../../Components/customer/Common/Footer";
import axiosInstance from "../../Components/utils/axiosInstance";
import CustomerOrders from "../../Components/customer/Orders/fetchCustomerOrders"; // ⬅️ IMPORT HERE

import { Pencil, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const [active, setActive] = useState("My Profile");
  const [profile, setProfile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const menu = ["My Profile", "My Orders", "Returned", "Refunded","Rate & Review"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const profileRes = await axiosInstance.get("/CustomerViewDetails/profile");
        setProfile(profileRes.data.data || profileRes.data);

        const photoRes = await axiosInstance.get("/CustomerPicture/photoView");
        if (photoRes.data?.photoUrl) setPhotoUrl(photoRes.data.photoUrl);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Unable to fetch profile or photo details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ---------- Upload Profile Photo ----------
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image");
      return;
    }

    const formData = new FormData();
    formData.append("Photo", file); // must match dto.Photo

    try {
      setIsUploading(true);
      const res = await axiosInstance.put("/CustomerPicture/photoUpdate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPhotoUrl(res.data?.photoUrl);
      alert("Profile picture updated!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload photo.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // ---------- Delete Photo ----------
  const handlePhotoDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your profile photo?")) return;

    try {
      await axiosInstance.delete("/CustomerPicture/photoDelete");
      setPhotoUrl(null);
      alert("Profile picture deleted successfully!");
    } catch (err) {
      console.error("Error deleting photo:", err);
      alert("Failed to delete photo.");
    }
  };

  const getField = (field) =>
    profile?.[field] || profile?.[field.toLowerCase()] || "N/A";

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col">
      <Navbar />
      <main className="flex-1 flex justify-center px-6 py-4">
        <div className="bg-white rounded-xl shadow-md w-full max-w-6xl p-6 flex flex-col md:flex-row gap-8 flex-1">
          {/* LEFT - PROFILE SIDEBAR */}
          <div className="w-full md:w-1/4 border rounded-xl p-4 flex-shrink-0">
            <div className="flex flex-col items-center relative">

              {loading ? (
                <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse mb-2"></div>
              ) : (
                <div className="relative">
                  <img
                    src={photoUrl || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
                    alt="profile"
                    className="w-24 h-24 rounded-full object-cover mb-2 border"
                    onError={() => setPhotoUrl(null)}
                  />

                  {/* Upload Button */}
                  <label className="absolute bottom-0 right-1 bg-black text-white p-1.5 rounded-full cursor-pointer hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Pencil size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>

                  {/* Uploading Overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="text-white text-xs">Uploading...</div>
                    </div>
                  )}
                </div>
              )}

              {/* Delete Photo */}
              {photoUrl && !isUploading && (
                <button
                  onClick={handlePhotoDelete}
                  className="flex items-center gap-1 bg-red-500 text-white text-xs px-3 py-1 rounded-md mt-2 hover:bg-red-600"
                >
                  <Trash2 size={12} /> Delete Photo
                </button>
              )}

              <p className="font-medium text-gray-800 text-sm mt-2 mb-4">
                {getField("FullName")}
              </p>

              {/* Sidebar Menu */}
              <div className="w-full space-y-2">
                {menu.map((item) => (
                  <button
                    key={item}
                    onClick={() => setActive(item)}
                    className={`w-full border rounded-md py-2 text-sm font-medium transition ${
                      active === item
                        ? "bg-black text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE – PROFILE DETAILS */}
          <div className="flex-1 border rounded-xl p-6 overflow-y-auto max-h-[70vh]">
            {active === "My Profile" && (
              <div>
                <h3 className="text-lg font-semibold mb-6 border-b pb-2">Profile Information</h3>

                {loading ? (
                  <p className="text-gray-500 text-sm">Loading profile...</p>
                ) : error ? (
                  <p className="text-red-500 text-sm">{error}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div><p className="text-gray-600">Full Name</p><p className="font-medium text-gray-900">{getField("FullName")}</p></div>
                    <div><p className="text-gray-600">Email</p><p className="font-medium text-gray-900">{getField("Email")}</p></div>
                    <div><p className="text-gray-600">Phone Number</p><p className="font-medium text-gray-900">{getField("PhoneNumber")}</p></div>
                    <div><p className="text-gray-600">Address</p><p className="font-medium text-gray-900">{getField("Address")}</p></div>
                    <div><p className="text-gray-600">Pincode</p><p className="font-medium text-gray-900">{getField("Pincode")}</p></div>
                  </div>
                )}
              </div>
            )}
             {active === "My Orders" && <CustomerOrders />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}