import { FaRegHeart, FaRegUser, FaSearch } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ⭐ Cart count state
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // ⭐ Fetch cart count using same API as CartPage
  const fetchCartCount = async () => {
    try {
      const res = await axiosInstance.get(`/Cart`); // backend detects user via token
      const total = res.data.reduce((sum, item) => sum + item.Quantity, 0);
      setCartCount(total);
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };
  const fetchWishlistCount = async () => {
    try {
      const res = await axiosInstance.get(`/Wishlist`); // backend detects user via token
      setWishlistCount(res.data.length); // or use quantity logic if needed
    } catch (err) {
      console.error("Error fetching wishlist count:", err);
    }
  };

  // Check login status
  const checkLoginStatus = () => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
    if (token) fetchCartCount();
    fetchWishlistCount(); // ⭐ added

  };

  useEffect(() => {
    checkLoginStatus();

    // update navbar count when cart or wishlist changes
    window.addEventListener("cartUpdated", fetchCartCount);
    window.addEventListener("wishlistUpdated", fetchWishlistCount);

    const handleStorageChange = () => checkLoginStatus();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", fetchCartCount);
      window.removeEventListener("wishlistUpdated", fetchWishlistCount);

    };
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    setCartCount(0);
    navigate("/");
  };

  // Scroll to footer
  const scrollToFooter = () => {
    const footer = document.getElementById("footer-section");
    if (footer) footer.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="sticky top-0 z-50 bg-transparent px-8 py-4 flex items-center justify-between w-full">
      {/* Left: Brand and Search */}
      <div className="flex items-center space-x-4">
        <div
          onClick={() => navigate("/")}
          className="bg-white/40 backdrop-blur-md rounded-full px-6 py-2 cursor-pointer flex items-center"
        >
          <span className="font-serif text-2xl font-bold select-none">
            Dealsy
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="looking for?"
            className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-full text-sm outline-none"
          />
          <FaSearch className="absolute right-3 top-2 text-gray-500" />
        </div>
      </div>

      {/* Center: Navigation Links */}
      <div className="bg-white/40 backdrop-blur-md rounded-full px-6 py-2 flex items-center space-x-4">
        <button
          onClick={() => navigate("/customerproducts")}
          className="text-sm font-medium hover:text-[#586330] transition"
        >
          Products
        </button>

        <button
          onClick={() => {
            if (window.location.pathname === "/") {
              scrollToFooter();
            } else {
              navigate("/", { state: { scrollTo: "footer" } });
            }
          }}
          className="text-sm font-medium hover:text-[#586330] transition"
        >
          About Us
        </button>

        <button
          onClick={() => {
            if (window.location.pathname === "/") {
              scrollToFooter();
            } else {
              navigate("/", { state: { scrollTo: "footer" } });
            }
          }}
          className="text-sm font-medium hover:text-[#586330] transition"
        >
          Contact
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {isLoggedIn ? (
          <>
            {/* Chat */}
            <div className="bg-white/40 backdrop-blur-md rounded-full px-3 py-2 flex items-center">
              <button
                onClick={() => navigate("/customerchat")}
                className="bg-[#586330] text-white rounded-full px-3 py-2 flex items-center"
              >
                <IoChatbubbleEllipsesOutline className="text-xl" />
              </button>
            </div>

            {/* Icons */}
            <div className="bg-white/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-3 relative">
              <div className="relative">

                <FaRegHeart
                  className="text-xl cursor-pointer hover:text-[#586330] transition"
                  onClick={() => navigate("/customerwishlist")}
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs px-1 py-[1px] rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </div>


              {/* ⭐ Cart with badge */}
              <div className="relative">
                <FiShoppingCart
                  className="text-xl cursor-pointer hover:text-[#586330] transition"
                  onClick={() => navigate("/customercart")}
                />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs px-1 py-[1px] rounded-full">
                    {cartCount}
                  </span>
                )}
              </div>

              <FaRegUser
                className="text-xl cursor-pointer hover:text-[#586330] transition"
                onClick={() => navigate("/customerprofile")}
              />
            </div>

            {/* Logout */}
            <div className="bg-white/40 backdrop-blur-md rounded-full px-4 py-2">
              <button
                onClick={handleLogout}
                className="bg-[#586330] text-white px-4 py-2 rounded-full font-medium cursor-pointer hover:bg-red-700 transition"
              >
                Logout &rarr;
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-2">
            <button
              onClick={() => navigate("/login")}
              className="bg-[#586330] text-white px-4 py-2 rounded-full font-medium cursor-pointer hover:bg-[#465127] transition"
            >
              Login &rarr;
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-[#586330] text-white px-4 py-2 rounded-full font-medium cursor-pointer hover:bg-[#465127] transition"
            >
              Sign Up &rarr;
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
