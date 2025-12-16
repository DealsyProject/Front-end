

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
    initialValues: {
      email: '',
      password: ''
    },
    validate: (values) => {
      const errors = {};

      // Email validation (matches backend)
      if (!values.email.trim()) {
        errors.email = 'Email is required';
      } 

      // Password validation (matches backend)
      if (!values.password) {
        errors.password = 'Password is required';
      }

      return errors;
    },
    onSubmit: async (values) => {
      setIsLoading(true);

      try {
        const response = await axiosInstance.post('/auth/login', {
          email: values.email.trim(),
          password: values.password
        });

        const { data } = response;

        if (response.status === 200) {
          console.log('Login response:', data);

          // Store authentication data
          localStorage.setItem('authToken', data.Token);
          localStorage.setItem(
            'currentUser',
            JSON.stringify({
              userId: data.UserId,
              fullName: data.FullName,
              email: data.Email,
              role: data.Role,
              isRegistrationComplete: data.IsRegistrationComplete,
              vendorId: data.VendorId || data.vendorId
            })
          );

          toast.success('Login successful!');

          setTimeout(() => {
            const role = data.Role?.toString().toLowerCase();

            if (role === 'vendor') {
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
            } else if (role === 'admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Login error:', error);

        if (error.response) {
          toast.error(error.response.data?.message || 'Login failed');
        } else if (error.request) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error('Login failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos-1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#586330]/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="px-8 py-6">
          <h1 className="text-4xl font-bold text-[#586330]">Dealsy</h1>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-[#586330]/70 mb-2">
                Login Here
              </h2>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-6 text-gray-900">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  autoComplete="email"
                />
                {formik.touched.email && formik.errors.email && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.email}</div>
                )}
              </div>

              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter Password
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                {/* Eye Icon */}
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    // Eye open icon (visible password)
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    // Eye closed icon (hidden password)
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </button>
                {formik.touched.password && formik.errors.password && (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.password}</div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !formik.isValid}
                className="w-full bg-[#586330]/70 hover:bg-[#586330]/80 text-white py-3 px-4 rounded-full font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Submit'}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                Not Yet Registered?{' '}
                <Link
                  to="/register"
                  className="text-[#586330]/70 hover:text-[#586330]/90 font-medium"
                >
                  Register Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Login;