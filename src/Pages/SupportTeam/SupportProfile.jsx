import React, { useEffect, useState } from "react";
import axiosInstance from "../../Components/utils/axiosInstance";
import { Edit2, Save, X, User, Mail, Phone, Shield, Loader2 } from "lucide-react";
import NavbarSupport from "../../Components/SupportTeam/NavbarSupport";

// Define the primary color utility for better readability
const PRIMARY_COLOR_HEX = '#586330'; // Olive/Moss Green

export default function SupportProfile() {
  const [profile, setProfile] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await axiosInstance.get("/SupportTeam/profile");

      if (res.data) {
        const profileData = {
          id: res.data.Id,
          fullName: res.data.FullName || "",
          email: res.data.Email || "",
          phone: res.data.PhoneNumber || "",
          role: res.data.Role || "Support Agent",
        };
        setProfile(profileData);
        setForm({ fullName: profileData.fullName, phone: profileData.phone, email: profileData.email });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await axiosInstance.put("/SupportTeam/profile", {
        FullName: form.fullName,
        PhoneNumber: form.phone || null,
        email: form.email || null
      });

      setProfile(prev => ({ ...prev, fullName: form.fullName, phone: form.phone, email: form.email }));
      setIsEdit(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ fullName: profile.fullName, phone: profile.phone, email: profile.email }); // Fixed bug: used form.email instead of profile.email
    setIsEdit(false);
    setError("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className={`w-12 h-12 animate-spin text-[${PRIMARY_COLOR_HEX}] mx-auto mb-4`} />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile && !isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md border border-gray-100">
          <div className={`text-[${PRIMARY_COLOR_HEX}] text-6xl mb-4`}>Error</div>
          <p className="text-gray-700 mb-6">{error || "Could not load profile"}</p>
          <button
            onClick={fetchProfile}
            className={`bg-[${PRIMARY_COLOR_HEX}] text-white px-6 py-3 rounded-xl hover:opacity-90 transition`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header with Solid Color */}
          <div className={`bg-[${PRIMARY_COLOR_HEX}] p-8 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Shield className="w-10 h-10" />
                  Support Team Profile
                </h1>
                <p className="text-white/90 mt-2">Manage your account information</p>
              </div>
              <div className="relative">
                <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center border-4 border-white/50">
                  <User className="w-12 h-12 text-white" />
                </div>
                {/* Status dot remains a friendly green for clarity */}
                <div className="absolute -bottom-2 -right-2 bg-lime-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  Online
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Success Banner - Updated to a light olive/lime gradient */}
            <div className="mb-8 bg-gradient-to-r from-lime-50 to-white border border-lime-200 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-[${PRIMARY_COLOR_HEX}] rounded-full flex items-center justify-center`}>
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Welcome back, {profile.fullName.split(" ")[0]}!</h3>
                  <p className="text-gray-600">Your role: <span className="font-semibold text-[${PRIMARY_COLOR_HEX}]">{profile.role}</span></p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
                <X className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Info */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <User className={`w-4 h-4 text-[${PRIMARY_COLOR_HEX}]`} /> Full Name
                  </label>
                  <input
                    disabled={!isEdit}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className={`mt-2 w-full px-5 py-4 rounded-xl border-2 text-lg font-medium transition-all ${
                      isEdit
                        ? `border-[${PRIMARY_COLOR_HEX}] bg-lime-50/50 focus:border-[${PRIMARY_COLOR_HEX}] focus:ring-4 focus:ring-lime-100`
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    } ${!isEdit && "cursor-not-allowed"}`}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Mail className={`w-4 h-4 text-[${PRIMARY_COLOR_HEX}]`} /> Email Address
                  </label>
                  <input
                    disabled={!isEdit}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`mt-2 w-full px-5 py-4 rounded-xl border-2 text-lg font-medium transition-all ${
                      isEdit
                        ? `border-[${PRIMARY_COLOR_HEX}] bg-lime-50/50 focus:border-[${PRIMARY_COLOR_HEX}] focus:ring-4 focus:ring-lime-100`
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                    placeholder="Email"
                  />

                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Phone className={`w-4 h-4 text-[${PRIMARY_COLOR_HEX}]`} /> Phone Number
                  </label>
                  <input
                    disabled={!isEdit}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`mt-2 w-full px-5 py-4 rounded-xl border-2 text-lg font-medium transition-all ${
                      isEdit
                        ? `border-[${PRIMARY_COLOR_HEX}] bg-lime-50/50 focus:border-[${PRIMARY_COLOR_HEX}] focus:ring-4 focus:ring-lime-100`
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                    placeholder="+1 (555) 000-1234"
                  />
                </div>
              </div>

              {/* Right Column - Avatar & Stats */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{profile.fullName}</p>
                </div>

                {/* Stat Box - Updated to lighter green gradient */}
                <div className="bg-gradient-to-r from-lime-100 to-green-100 rounded-2xl p-6 w-full">
                  <p className="text-sm text-gray-600">Account Status</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">Active</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex gap-4 justify-end">
              {isEdit ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition flex items-center gap-3"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className={`px-8 py-4 bg-[${PRIMARY_COLOR_HEX}] text-white rounded-xl font-medium hover:shadow-xl transition flex items-center gap-3`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEdit(true)}
                  className={`px-10 py-4 bg-[${PRIMARY_COLOR_HEX}] text-white rounded-xl font-medium hover:shadow-2xl transform hover:scale-105 transition flex items-center gap-3 mx-auto`}
                >
                  <Edit2 className="w-5 h-5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 Support Portal • Secure & Protected
        </p>
      </div>
    </div>
  );
}