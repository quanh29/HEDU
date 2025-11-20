import Navbar from './components/Navbar/Navbar.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'
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
import { Navigate } from 'react-router-dom'
import Instructor from './pages/Instructor/Instructor.jsx'
import CreateUpdateCourse from './pages/CourseManagement/CourseManagement.jsx'
import Admin from './pages/Admin/Admin.jsx'
import AdminLogin from './pages/AdminLogin/AdminLogin.jsx'
import UploadDemo from './pages/UploadDemo/UploadDemo.jsx'

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const {user} = useAppContext();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster/>
      {!isAdmin && <Navbar/>}
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
          
          {/* Instructor Routes */}
          <Route path='/instructor' element={<Instructor/>}>
            <Route index element={<Navigate to="/instructor/dashboard" replace />} />
            <Route path='dashboard' element={<Instructor activeTab="dashboard" />}/>
            <Route path='courses' element={<Instructor activeTab="courses" />}/>
            <Route path='students' element={<Instructor activeTab="students" />}/>
          </Route>
          <Route path='/instructor/create-course' element={<CreateUpdateCourse/>}/>
          <Route path='/instructor/view-course/:courseId' element={<CreateUpdateCourse mode="view"/>}/>
          <Route path='/instructor/update-course/:courseId' element={<CreateUpdateCourse/>}/>
          
          <Route path='/update-course/:courseId' element={<CreateUpdateCourse/>}/>
          
          {/* Admin Routes */}
          <Route path='/admin' element={<AdminLogin/>}/>
          <Route path='/admin/dashboard' element={<Admin/>}/>
          
          <Route path='/upload-demo' element={<UploadDemo/>}/>
        </Routes>
      </div>
      {!isAdmin && <Footer/>}
    </div>
  )
}

export default App
