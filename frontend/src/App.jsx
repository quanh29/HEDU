import Navbar from './components/Navbar/Navbar.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CourseSearch from './pages/CourseSearch/CourseSearch.jsx'
import CoursePage from './pages/CoursePage.jsx'
import {Toaster} from 'react-hot-toast'
import Footer from './components/Footer/Footer.jsx'
import Authentication from './pages/Authentication/Authentication.jsx'
import MyLearning from './pages/MyLearning/MyLearning.jsx'
import CourseContent from './pages/CourseContent/CourseContent.jsx'
import VideoSection from './pages/VideoSection/VideoSection.jsx'
import Quizzes from './pages/Quizzes/Quizzes.jsx'
import SSOCallback from './components/SSOCallback/SSOCallback.jsx'


function App() {
  const isAdmin = useLocation().pathname.startsWith('/admin')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster/>
      {!isAdmin && <Navbar/>}
      <div style={{ flex: 1 }}>
        <Routes >
          <Route path='/' element={<Home/>}/>
          <Route path='/course/search/' element={<CourseSearch/>}/>
          <Route path='/course/:slug' element={<CoursePage/>}/>
          <Route path='/auth/*' element={<Authentication/>}/>
          <Route path='/sso-callback' element={<SSOCallback/>}/>
          <Route path='/my-learning/*'element={<MyLearning/>}/>
          <Route path='/course/:slug/content/'element={<CourseContent/>}/>
          <Route path='/course/:slug/content/video' element={<VideoSection/>}/>
          <Route path='/quizzes/attempt' element={<Quizzes/>}/>
          <Route path='/quizzes/result' element={<Quizzes/>}/>
          <Route path='/quizzes/result/review' element={<Quizzes/>}/>
          <Route path='/quizzes' element={<Quizzes/>}/>
        </Routes>
      </div>
      {!isAdmin && <Footer/>}
    </div>
  )
}

export default App
