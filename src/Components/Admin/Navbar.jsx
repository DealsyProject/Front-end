import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // clear token
    navigate("/login"); // redirect to login
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-[#586330] text-white border-b border-[#4b572a] shadow-md">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5">
          <button
            onClick={toggleMenu}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-sm sm:text-base font-semibold absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none md:ml-2">
            Marketplace Admin
          </h1>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-3 xl:gap-4 text-xs text-gray-100 font-medium items-center">
            <Link to="/admin" className="hover:text-[#d7dcc4] transition-colors">Dashboard</Link>
            <Link to="/productPage" className="hover:text-[#d7dcc4] transition-colors">Products</Link>
            <Link to="/orders" className="hover:text-[#d7dcc4] transition-colors">Orders</Link>
            <Link to="/user" className="hover:text-[#d7dcc4] transition-colors">Customers</Link>
            <Link to="/support-adminchattosupport" className="hover:text-[#d7dcc4] transition-colors">Chat Support</Link>
            <Link to="/Transaction" className="hover:text-[#d7dcc4] transition-colors">Transactions</Link>
            <Link to="/Vendors" className="hover:text-[#d7dcc4] transition-colors">Vendors</Link>
            <Link to="/support-team" className="hover:text-[#d7dcc4] transition-colors">Support Team</Link>

            {/* Logout Button Desktop */}
            <button
              onClick={handleLogout}
              className="ml-3 px-3 py-1.5 bg-red-500 rounded text-white text-xs hover:bg-red-600 transition"
            >
              Logout
            </button>
          </nav>

          <div className="w-5 md:w-8"></div>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 sm:w-72 h-full bg-white text-gray-900 flex flex-col z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Menu</h2>
          <button 
            onClick={toggleMenu} 
            className="text-gray-600 hover:text-[#586330] p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex flex-col flex-1 overflow-y-auto py-2">
          <Link onClick={toggleMenu} to="/admin" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Dashboard
          </Link>
          <Link onClick={toggleMenu} to="/productPage" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Products
          </Link>
          <Link onClick={toggleMenu} to="/orders" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Orders
          </Link>
          <Link onClick={toggleMenu} to="/user" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Customers
          </Link>
          <Link onClick={toggleMenu} to="/support-adminchattosupport" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Chat Support
          </Link>
          <Link onClick={toggleMenu} to="/Transaction" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Transactions
          </Link>
          <Link onClick={toggleMenu} to="/Vendors" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Vendors
          </Link>
          <Link onClick={toggleMenu} to="/product-returns" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Product Returns
          </Link>
          <Link onClick={toggleMenu} to="/support-team" className="py-2.5 px-4 flex items-center hover:bg-[#e5e9d3]">
            Support Team
          </Link>
        </nav>

        {/* Logout Button in Sidebar */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              toggleMenu();
              handleLogout();
            }}
            className="w-full py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
