import Navbar from './components/Navbar/Navbar.jsx'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CourseSearch from './pages/CourseSearch/CourseSearch.jsx'
import CoursePage from './pages/CoursePage.jsx'
import toast, {Toaster} from 'react-hot-toast'
import Footer from './components/Footer/Footer.jsx'
import Authentication from './pages/Authentication/Authentication.jsx'
import MyLearning from './pages/MyLearning/MyLearning.jsx'
import CourseContent from './pages/CourseContent/CourseContent.jsx'
import VideoSection from './pages/VideoSection/VideoSection.jsx'
import Quizzes from './pages/Quizzes/Quizzes.jsx'
import SSOCallback from './components/SSOCallback/SSOCallback.jsx'
import { useAppContext } from './context/AppContext.jsx'
import Instructor from './pages/Instructor/Instructor.jsx'
import CreateUpdateCourse from './pages/CourseManagement/CourseManagement.jsx'
import Admin from './pages/Admin/Admin.jsx'
import AdminLogin from './pages/AdminLogin/AdminLogin.jsx'
import UploadDemo from './pages/UploadDemo/UploadDemo.jsx'
import { CartProvider } from './context/CartContext.jsx'
import Checkout from './pages/Checkout/Checkout.jsx'
import PaymentStatus from './pages/PaymentStatus/PaymentStatus.jsx'
import PaymentHistory from './pages/PaymentHistory/PaymentHistory.jsx'
import RefundHistory from './pages/RefundHistory/RefundHistory.jsx'
import Wallet from './pages/Wallet/Wallet.jsx'
import Dashboard from './pages/Instructor/Dashboard.jsx'
import Messaging from './pages/Messaging/Messaging.jsx'
import Profile from './pages/Profile/Profile.jsx'
import PublicProfile from './pages/PublicProfile/PublicProfile.jsx'

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/login-admin');

  const {user} = useAppContext();

  return (
    <CartProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Toaster/>
        {!isAdminRoute && <Navbar/>}
      <div style={{ flex: 1 }}>
        <Routes >
          <Route path='/' element={<Home/>}/>
          <Route path='/course/search*' element={<CourseSearch/>}/>
          <Route path='/course/:courseId' element={<CoursePage/>}/>
          <Route path='/auth/*' element={<Authentication/>}/>
          <Route path='/sso-callback' element={<SSOCallback/>}/>
          {/* <Route path='/my-learning/*' element={user ? <MyLearning/> : <Navigate to='/auth/login' replace/>}/> */}
          <Route path='/my-learning/*' element={<MyLearning/>}/>
          <Route path='/course/:courseId/content/' element={<CourseContent/>}/>
          <Route path='/course/:courseId/content/video' element={<VideoSection/>}/>
          <Route path='/course/:courseId/content/quiz' element={<Quizzes/>}/>
          
          {/* Checkout Route */}
          <Route path='/checkout' element={<Checkout/>}/>
          
          {/* Payment Status Route */}
          <Route path='/payment/momo/return' element={<PaymentStatus/>}/>
          
          {/* Payment History Route */}
          <Route path='/payment-history' element={<PaymentHistory/>}/>
          
          {/* Refund History Route */}
          <Route path='/refund-history' element={<RefundHistory/>}/>
          
          {/* Wallet Route */}
          <Route path='/wallet' element={<Wallet/>}/>
          
          {/* Messaging Route */}
          <Route path='/messages' element={<Messaging/>}/>
          
          {/* Profile Route */}
          <Route path='/profile' element={<Profile/>}/>
          
          {/* Public Profile Route */}
          <Route path='/user/:userId' element={<PublicProfile/>}/>
          
          {/* Instructor Routes */}
          <Route path='/instructor' element={<Instructor/>}>
            <Route index element={<Navigate to="/instructor/dashboard" replace />} />
            <Route path='dashboard' element={<Dashboard/>}/>
            <Route path='courses' element={<Instructor activeTab="courses" />}/>
            <Route path='students' element={<Instructor activeTab="students" />}/>
          </Route>
          <Route path='/instructor/create-course' element={<CreateUpdateCourse/>}/>
          <Route path='/instructor/view-course/:courseId' element={<CreateUpdateCourse mode="view"/>}/>
          <Route path='/instructor/update-course/:courseId' element={<CreateUpdateCourse/>}/>
          
          {/* <Route path='/update-course/:courseId' element={<CreateUpdateCourse/>}/> */}
          
          {/* Admin Routes - Completely separate, no Navbar/Footer */}
          <Route path='/login-admin' element={<AdminLogin/>}/>
          <Route path='/admin' element={<Navigate to="/admin/dashboard" replace />}/>
          <Route path='/admin/dashboard' element={<Admin/>}/>
          <Route path='/admin/courses' element={<Admin/>}/>
          <Route path='/admin/revisions' element={<Admin/>}/>
          <Route path='/admin/refunds' element={<Admin/>}/>
          <Route path='/admin/users' element={<Admin/>}/>
          <Route path='/admin/statistics' element={<Admin/>}/>
          <Route path='/admin/support' element={<Admin/>}/>
          <Route path='/admin/settings' element={<Admin/>}/>
          
          <Route path='/upload-demo' element={<UploadDemo/>}/>
        </Routes>
      </div>
      {!isAdminRoute && <Footer/>}
    </div>
    </CartProvider>
  )
}

export default App
