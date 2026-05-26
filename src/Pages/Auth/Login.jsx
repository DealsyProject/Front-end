
import React from 'react';
import { useFormik } from 'formik';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../Components/utils/axiosInstance';

const Login = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '', password: '' },

   // Login.jsx - The onSubmit function
onSubmit: async (values) => {
  setIsLoading(true);
  console.log("🚀 Login attempt started...");

  try {
    const response = await axiosInstance.post('/auth/login', {
      email: values.email.trim(),
      password: values.password
    });

    const data = response.data;
    console.log("✅ Login Success:", data);

    // Store token EXACTLY as received
    const token = data.Token;
    console.log(`Token length: ${token.length}`);
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify({
      userId: data.UserId,
      fullName: data.FullName,
      email: data.Email,
      role: data.Role,
      isRegistrationComplete: data.IsRegistrationComplete,
      vendorId: data.VendorId || data.vendorId
    }));

    toast.success('Login successful!');

    // Small delay before navigation
    setTimeout(() => {
      const role = String(data.Role || '').toLowerCase().trim();
      
      if (role === 'admin') {
        // Navigate to admin dashboard
        navigate('/admin', { replace: true });
      } else if (role === 'vendor') {
        if (data.IsRegistrationComplete) {
          navigate('/vendor-dashboard', { replace: true });
        } else {
          navigate('/vendor-register', { replace: true });
        }
      } else if (role === 'customer') {
        if (data.IsRegistrationComplete) {
          navigate('/', { replace: true });
        } else {
          navigate('/customer-register', { replace: true });
        }
      } else if (role === 'supportteam') {
        navigate('/support-custemervenderdetails', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }, 500);

  } catch (error) {
    console.error("❌ Login Error:", error);
    toast.error(error.response?.data?.message || 'Login failed');
  } finally {
    setIsLoading(false);
  }
}
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'ur[](https://images.pexels.com/photos-1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#586330]/80" />
      </div>

      <div className="relative z-10">
        <div className="px-8 py-6">
          <h1 className="text-4xl font-bold text-[#586330]">Dealsy</h1>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-[#586330]">Login Here</h2>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  className="w-full px-4 py-3 pr-10 border rounded-lg"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-10">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#586330] text-white py-3 rounded-full font-semibold"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Login;