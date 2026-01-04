import { useState, useEffect } from "react";
import Carousel from "../components/Carousel/Carousel.jsx";
import Hero from "../components/Hero/Hero.jsx";
import Testimonial from "../components/Testimonial/Testimonial.jsx";
import TrustedBrand from "../components/TrustedBrand/TrustedBrand.jsx";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
import { searchCourses } from "../services/courseService.js";

function Home() {
  useDocumentTitle("Trang chủ");
  
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [latestCourses, setLatestCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // Fetch featured courses (sort theo rating)
        const featuredResponse = await searchCourses({
          page: 1,
          sort: 'rating'
        });
        
        // Fetch latest courses (sort theo newest)
        const latestResponse = await searchCourses({
          page: 1,
          sort: 'newest'
        });
        
        // Map data từ backend sang format mà Card component cần
        const mapCourseData = (courses) => {
          if (!Array.isArray(courses)) return [];
          
          return courses.map(course => ({
            courseId: course.course_id,
            title: course.title,
            instructors: course.instructors || [],
            rating: course.rating || 0,
            reviewCount: course.reviewCount || 0,
            originalPrice: course.originalPrice,
            currentPrice: course.currentPrice,
            image: course.picture_url
          }));
        };
        
        setFeaturedCourses(mapCourseData(featuredResponse));
        setLatestCourses(mapCourseData(latestResponse));
      } catch (error) {
        console.error('Error fetching courses:', error);
        setFeaturedCourses([]);
        setLatestCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <>
      <Hero />
      <TrustedBrand/>
      {!loading && (
        <>
          <Carousel 
            courses={featuredCourses}
            title="Khóa Học Nổi Bật"
          />
          <Carousel 
            courses={latestCourses}
            title="Khóa Học Mới Nhất"
          />
        </>
      )}
      <Testimonial />
    </>
  );
}

export default Home;