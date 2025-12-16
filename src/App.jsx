import { BrowserRouter as Router, Routes, Route,  } from 'react-router-dom';



//admin
import AdminDashboard from './Pages/Admin/AdminDashboard.jsx';
import ProductPage from './Pages/Admin/ProductPage.jsx';
import OrdersPage from './Pages/Admin/OrdersPage.jsx';
import TransactionsPage from './Pages/Admin/TransactionsPage.jsx';
import UserManagement from './Pages/Admin/UserManagment.jsx';
import PendingVendors from './Pages/Admin/PendingVendors.jsx';

import SupportTeamPage from "./Pages/Admin/SupportTeamPage.jsx";


//customer
import CustomerHome from './Pages/customer/CustomerHome';
import CustomerRegistration from './Components/customer/Registration/CustomerExtraForm.jsx';
import CustomerProducts from './Pages/customer/CustomerProducts';
import CustomerProductView from './Pages/customer/CustomerProductview';
import CustomerProfile from './Pages/customer/CustomerProfile';
import CustomerCart from './Pages/customer/CustomerCart';
import CustomerWishList from './Pages/customer/CustomerWishList';
import CustomerCheckout from './Pages/customer/CustomerCheckout';

//Common for all users
import Login from './Pages/Auth/Login';

//Common for vendor/customer
import Register from './Pages/Auth/Register';



//Vendor
import VendorRegister from './Components/Vendor/Registration/VendorExtraForm.jsx';



import Dashboard from './Pages/Vendor/Dashboard/Dashboard';
import Products from './Pages/Vendor/Dashboard/Products';
import ProfileViewPage from './Pages/Vendor/Dashboard/ProfileViewPage.jsx';
import Customers from './Pages/Vendor/Dashboard/Customers';
import Invoices from './Pages/Vendor/Dashboard/Invoices';
import Payments from './Pages/Vendor/Dashboard/Payments';


// Support Team 
import CustemerVenderDetails from "./Pages/SupportTeam/CustemerVenderDetails"
import ReturnRefundTracker from './Pages/SupportTeam/ReturnRefundTracker';
import FaqOption from './Pages/SupportTeam/FaqOption.jsx';
import SupportChatCustomer from './Pages/SupportTeam/SupportChatCustomer.jsx';
import SupportChatToAdmin from './Pages/SupportTeam/SupportChatToAdmin.jsx';
import AdminChatToSupport from './Pages/Admin/AdminChatToSupport.jsx';
import CustomerChat from './Pages/customer/CustomerChat';
import SupportProfile from './Pages/SupportTeam/SupportProfile.jsx';
import EmailSupport from './Pages/SupportTeam/EmailSupport.jsx';






function App() {
  return (
    <Router>

      <Routes>

        {/* admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/productPage" element={<ProductPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/Transaction" element={<TransactionsPage />} />
        <Route path="/user" element={<UserManagement />} />
        <Route path="/Vendors" element={<PendingVendors />} />
     
        <Route path="/support-team" element={<SupportTeamPage />} />



        {/* Vendor */}
       
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vendor-register" element={<VendorRegister />} />
        
      
        <Route path="/vendor-dashboard" element={<Dashboard />} />
       <Route path="/vendor/profile" element={<ProfileViewPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/payments" element={<Payments />} />



        {/* Customer  */}
        <Route path="/" element={<CustomerHome />} />
        <Route path="/customer-register" element={<CustomerRegistration />} />
        <Route path="/customerproducts" element={<CustomerProducts />} />
        <Route path="/customer/product/:id" element={<CustomerProductView />} />
        <Route path="/customerprofile" element={<CustomerProfile />} />
        <Route path="/customercart" element={<CustomerCart />} />
        <Route path="/customerwishlist" element={<CustomerWishList />} />
        <Route path="/checkout" element={<CustomerCheckout />} />
        <Route path="/customerchat" element={<CustomerChat />} />



        {/* Support Team */}
        <Route path="/customerchat" element={<CustomerChat />}/>
        <Route path="/support-Customerchatcenter" element={<SupportChatCustomer/>}/>
        <Route path="/support-custemervenderdetails" element={<CustemerVenderDetails />}/>
        <Route path="/support-returnrefundtracker" element={<ReturnRefundTracker />}/>
        <Route path="/support-faq-options" element={<FaqOption />}/>
        <Route path="/support-emailsupport" element={<EmailSupport />}/>
        <Route path="/support-supportchattoadmin" element={<SupportChatToAdmin />}/>
        <Route path="/support-adminchattosupport" element={<AdminChatToSupport />}/>
        <Route path="/support-profile" element={<SupportProfile />}/>
        

         </Routes>
    </Router>
  );
}

export default App;
