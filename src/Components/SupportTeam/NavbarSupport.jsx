import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

function NavbarSupport() {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center px-8 py-3 bg-gradient-to-r from-[#ffffff] to-[#cff5be] backdrop-blur-md shadow-md">
      {/* Left Section - Logo and Search */}
      <div className="flex items-center space-x-4">
        <div
         
          className="bg-white/40 backdrop-blur-md rounded-full px-6 py-2 cursor-pointer flex items-center shadow-sm hover:shadow-md transition"
        >
          <span className="font-serif text-2xl font-bold select-none text-[#586330]">
            Dealsy Support Team
          </span>
        </div>


      </div>

      {/* Center Section - Links */}
      <div className="bg-white/40 backdrop-blur-md rounded-full px-6 py-2 flex items-center space-x-6 text-sm font-medium text-[#586330] shadow-sm">
        <Link
          to="/support-custemervenderdetails"
          className="hover:text-green-800 transition"
        >
          Customer/Vendor Details
        </Link>

        <Link
          to="/support-Customerchatcenter"
          className="hover:text-green-800 transition"
        >
          Help Center
        </Link>

        <Link
          to="/support-returnrefundtracker"
          className="hover:text-green-800 transition"
        >
          Return Tracker
        </Link>

        <Link
          to="/support-supportchattoadmin"
          className="hover:text-green-800 transition"
        >
          Admin-ChatCenter
        </Link>

        <Link
          to="/support-profile"
          className="hover:text-green-800 transition"
        >
         Profile
        </Link>

      </div>
    </nav>
  );
}

export default NavbarSupport;