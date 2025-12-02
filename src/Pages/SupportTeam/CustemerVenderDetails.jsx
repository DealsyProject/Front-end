import React, { useEffect, useState } from "react";
import {
  Search,
  Download,
  RefreshCw,
  Copy,
  Eye,
  Users,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  UserX,
  Filter,
  Building,
  Home,
} from "lucide-react";
import { Quote } from "lucide-react";
import NavbarSupport from "../../Components/SupportTeam/NavbarSupport";
import axiosInstance from "../../Components/utils/axiosInstance";
import { motion } from "framer-motion";


export default function CustomerVendorDetails() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/SupportTeam"); 
      const users = response.data.map((u, index) => ({
        id: index + 1,
        name: u.FullName || "Unknown", // Match backend casing
        role: u.Role || "Unknown", // Match backend casing
        team: u.Role === "Customer" ? "Customer" : "Vendor", // Match backend casing
        email: u.Email || "No email", // Match backend casing
        phone: u.PhoneNumber || "No phone", // Match backend casing
        location: u.VendorDetails
          ? u.VendorDetails.Location // Match backend casing
          : u.CustomerDetails
          ? u.CustomerDetails.Address // Match backend casing
          : "N/A",
        active: !u.IsBlocked, // Match backend casing
        registrationDate: new Date().toISOString().split('T')[0], // Default since backend doesn't provide
        lastActive: "Recently", // Default since backend doesn't provide
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
          u.FullName || "User" // Match backend casing
        )}`,
        // Additional vendor details for modal
        companyName: u.VendorDetails?.CompanyName || "N/A", // Match backend casing
        companyEmail: u.VendorDetails?.CompanyEmail || "N/A", // Match backend casing
        companyOwner: u.VendorDetails?.CompanyOwnerName || "N/A", // Match backend casing
        address: u.CustomerDetails?.Address || "N/A", // Match backend casing
        pincode: u.CustomerDetails?.Pincode || "N/A", // Match backend casing
      }));
      setData(users);
    } catch (err) {
      console.error(err);
      setError("Failed to load data from server");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchData();
  };

  // Separate data into customers and vendors
  const customers = data.filter(item => item.team === "Customer");
  const vendors = data.filter(item => item.team === "Vendor");

  // Safe string comparison function
  const safeStringCompare = (a, b) => {
    const strA = String(a || "").toLowerCase();
    const strB = String(b || "").toLowerCase();
    return strA.localeCompare(strB);
  };

  // Safe date comparison function
  const safeDateCompare = (a, b) => {
    const dateA = new Date(a || 0);
    const dateB = new Date(b || 0);
    return dateB - dateA;
  };

  // Filtering + searching with tab support
  const getFilteredData = () => {
    let filteredData = data;
    
    // Apply tab filter
    if (activeTab === "customers") {
      filteredData = customers;
    } else if (activeTab === "vendors") {
      filteredData = vendors;
    }

    // Apply team filter
    if (filterTeam !== "all") {
      filteredData = filteredData.filter(item => 
        item.team.toLowerCase() === filterTeam
      );
    }

    // Apply active filter
    if (showOnlyActive) {
      filteredData = filteredData.filter(item => item.active);
    }

    // Apply search query
    const q = query.trim().toLowerCase();
    if (q) {
      filteredData = filteredData.filter(item => {
        const searchableFields = [
          item.name || "",
          item.role || "",
          item.email || "",
          item.phone || "",
          item.location || "",
          item.companyName || "",
          item.companyEmail || ""
        ];
        return searchableFields.some(field => 
          field.toLowerCase().includes(q)
        );
      });
    }

    // Apply sorting with safe comparisons
    filteredData = [...filteredData].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return safeStringCompare(a.name, b.name);
        case "role":
          return safeStringCompare(a.role, b.role);
        case "date":
          return safeDateCompare(a.registrationDate, b.registrationDate);
        default:
          return 0;
      }
    });

    return filteredData;
  };
const quotes = [
  "A great support team doesn’t just solve problems—they build trust and empower others.",
  "Support is not just service, it’s an experience we create together.",
  "Behind every satisfied customer is a team that cares.",
  "Care is our first response, and a solution is the result.",
  "Our support is a promise, kept with every interaction.",
  "Care is our first response, and a solution is the result.",
  "We measure our success by your growing independence."
];
  const filtered = getFilteredData();

  // Utilities
  function copyToClipboard(text) {
    if (!text || text === "No email") {
      alert("No email available to copy");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard: " + text);
    });
  }

  function downloadCSV(items) {
    if (!items || items.length === 0) {
      alert("No rows to export");
      return;
    }
    const header = [
      "id", "name", "role", "team", "email", "phone", 
      "location", "active", "registrationDate", "lastActive",
      "companyName", "companyEmail", "companyOwner", "address", "pincode"
    ];
    const rows = items.map((r) =>
      header.map((h) => JSON.stringify(r[h] ?? "")).join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_export.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const UserTable = ({ users, type }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="p-4 text-left text-sm font-semibold text-gray-600">
              Member
            </th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">
              Role
            </th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">
              Contact
            </th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">
              Location
            </th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">
              Status
            </th>
            <th className="p-4 text-left text-sm font-semibold text-gray-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-12 text-center text-gray-500">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-400">
                  No {type} found
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try adjusting your search criteria
                </p>
              </td>
            </tr>
          ) : (
            users.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={row.avatar}
                      alt={row.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {row.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.team === "Vendor" && row.companyName !== "N/A" && (
                          <span className="flex items-center gap-1">
                            <Building size={12} />
                            {row.companyName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-gray-900">{row.role}</div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-gray-600">{row.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-gray-600">{row.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    {row.location}
                  </div>
                </td>
                <td className="p-4">
                  {row.active ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <UserCheck size={12} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <UserX size={12} />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(row.email)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Copy email"
                    >
                      <Copy size={12} />
                      Email
                    </button>
                    <button 
                      onClick={() => setModalData(row)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={12} />
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#586330]/5 to-[#586330]/10 p-6">
      <div className="max-w-7xl mx-auto">
        <NavbarSupport />
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#8ba03e] rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#586330]">
                Customer & Vendor Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and view customer and vendor details
              </p>
            </div>
          </div>
        </div>


    <div className="space-y-4 mt-4">
      {quotes.map((text, index) => (
        <motion.div
          key={index}
          className="flex items-start gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.15 }}
        >
          <Quote className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
          <p className="text-gray-700 italic text-lg flex-1">
            "{text}"
          </p>
        </motion.div>
      ))}
    </div>
<div>
  <div className="h-15 ">
    --------------------------------------------------------------------------------------------------------------------------------------------
  </div>
</div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
              </div>
              <div className="p-2 bg-[#586330]/10 rounded-lg">
                <Users className="h-5 w-5 text-[#586330]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                <p className="text-xs text-green-600">
                  {customers.filter(c => c.active).length} active
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
                <p className="text-xs text-green-600">
                  {vendors.filter(v => v.active).length} active
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Building className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.filter(item => item.active).length}
                </p>
                <p className="text-xs text-gray-500">
                  {((data.filter(item => item.active).length / (data.length || 1)) * 100).toFixed(1)}% active rate
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>
<div className="mb-8">
  <div className="flex items-center gap-3 mb-2">

  </div>
</div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6">
          <div className="flex">
            {[
              { id: "all", label: "All Users", count: data.length },
              { id: "customers", label: "Customers", count: customers.length },
              { id: "vendors", label: "Vendors", count: vendors.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#586330] text-white shadow-sm"
                    : "text-gray-600 hover:text-[#586330] hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{tab.label}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id 
                      ? "bg-white/20 text-white" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, role, email, phone or location..."
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#586330] focus:border-[#586330] w-full transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#586330] focus:border-[#586330] transition-colors"
                >
                  <option value="name">Sort by Name</option>
                  <option value="role">Sort by Role</option>
                </select>

                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#586330] focus:border-[#586330] transition-colors"
                >
                  <option value="all">All teams</option>
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>

                <label className="flex items-center gap-2 text-sm px-3 py-2.5 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={showOnlyActive}
                    onChange={(e) => setShowOnlyActive(e.target.checked)}
                    className="rounded focus:ring-[#586330] text-[#586330]"
                  />
                  Only active
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => downloadCSV(filtered)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={refreshData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={() => {
                  setQuery("");
                  setFilterTeam("all");
                  setShowOnlyActive(false);
                  setSortBy("name");
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#586330] text-white hover:bg-[#4a5428] transition-colors text-sm font-medium"
              >
                <Filter size={16} />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 text-[#586330] animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Loading team data...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={refreshData}
                className="mt-3 px-4 py-2 bg-[#586330] text-white rounded-lg hover:bg-[#4a5428] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {activeTab === "all" && <UserTable users={filtered} type="users" />}
              {activeTab === "customers" && <UserTable users={filtered} type="customers" />}
              {activeTab === "vendors" && <UserTable users={filtered} type="vendors" />}

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{filtered.length}</span> of{" "}
                    <span className="font-semibold">{data.length}</span> team members
                    {activeTab !== "all" && ` (${activeTab})`}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <UserCheck size={14} />
                      Active: {data.filter(item => item.active).length}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserX size={14} />
                      Inactive: {data.filter(item => !item.active).length}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl w-full max-w-md p-6 animate-scaleIn border border-white/40">
            <button
              onClick={() => setModalData(null)}
              className="absolute top-4 right-4 text-gray-700 hover:text-black transition text-2xl"
            >
              ✕
            </button>

            <div className="flex flex-col items-center text-center">
              <img
                src={modalData.avatar}
                className="w-24 h-24 rounded-full shadow-md border-4 border-white"
                alt="profile"
              />
              <h2 className="text-2xl font-bold mt-4">{modalData.name}</h2>
              <p className="text-gray-600">{modalData.role}</p>
              <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                modalData.team === "Customer" 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-green-100 text-green-700"
              }`}>
                {modalData.team === "Vendor" ? <Building size={12} className="mr-1" /> : <Home size={12} className="mr-1" />}
                {modalData.team}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {/* Basic Info */}
              <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                <span className="font-medium">Email</span>
                <span>{modalData.email}</span>
              </div>

              <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                <span className="font-medium">Phone</span>
                <span>{modalData.phone}</span>
              </div>

              <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                <span className="font-medium">Location</span>
                <span>{modalData.location}</span>
              </div>

              {/* Vendor Specific Details */}
              {modalData.team === "Vendor" && (
                <>
                  <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                    <span className="font-medium">Company Name</span>
                    <span>{modalData.companyName}</span>
                  </div>
                  <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                    <span className="font-medium">Company Email</span>
                    <span>{modalData.companyEmail}</span>
                  </div>
                  <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                    <span className="font-medium">Company Owner</span>
                    <span>{modalData.companyOwner}</span>
                  </div>
                </>
              )}

              {/* Customer Specific Details */}
              {modalData.team === "Customer" && (
                <>
                  <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                    <span className="font-medium">Address</span>
                    <span>{modalData.address}</span>
                  </div>
                  <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                    <span className="font-medium">Pincode</span>
                    <span>{modalData.pincode}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between bg-white/60 p-3 rounded-xl shadow-sm">
                <span className="font-medium">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  modalData.active 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {modalData.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => copyToClipboard(modalData.email)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <Copy size={14} />
                Copy Email
              </button>
              <button
                onClick={() => setModalData(null)}
                className="px-6 py-2 rounded-full bg-[#586330] text-white shadow-md hover:bg-[#485327] transition"
              >
                Close
              </button>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}