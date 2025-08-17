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
import CreateUpdateCourse from './pages/CreateUpdateCourse/CreateUpdateCourse.jsx'
import Admin from './pages/Admin/Admin.jsx'

function App() {
  const isAdmin = useLocation().pathname.startsWith('/admin')

  const {user} = useAppContext();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster/>
      {!isAdmin && <Navbar/>}
      <div style={{ flex: 1 }}>
        <Routes >
          <Route path='/' element={<Home/>}/>
          <Route path='/course/search*' element={<CourseSearch/>}/>
          <Route path='/course/:slug' element={<CoursePage/>}/>
          <Route path='/auth/*' element={<Authentication/>}/>
          <Route path='/sso-callback' element={<SSOCallback/>}/>
          {/* <Route path='/my-learning/*' element={user ? <MyLearning/> : <Navigate to='/auth/login' replace/>}/> */}
          <Route path='/my-learning/*' element={<MyLearning/>}/>
          <Route path='/course/:slug/content/' element={<CourseContent/>}/>
          <Route path='/course/:slug/content/video' element={<VideoSection/>}/>
          <Route path='/quizzes/attempt' element={<Quizzes/>}/>
          <Route path='/quizzes/result' element={<Quizzes/>}/>
          <Route path='/quizzes/result/review' element={<Quizzes/>}/>
          <Route path='/quizzes' element={<Quizzes/>}/>
          <Route path='/instructor' element={<Instructor/>}/>
          <Route path='/instructor/create-course' element={<CreateUpdateCourse/>}/>
          <Route path='/update-course/:courseId' element={<CreateUpdateCourse/>}/>
          <Route path='/admin' element={<Admin/>}/>
        </Routes>
      </div>
      {!isAdmin && <Footer/>}
    </div>
  )
}

export default App
