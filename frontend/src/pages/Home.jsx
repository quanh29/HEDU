import Carousel from "../components/Carousel/Carousel.jsx";
import Hero from "../components/Hero/Hero.jsx";
import { courses } from "../assets/dummyData.js";
import Testimonial from "../components/Testimonial/Testimonial.jsx";
import TrustedBrand from "../components/TrustedBrand/TrustedBrand.jsx";

function Home() {
  return (
    <>
      <Hero />
      <TrustedBrand/>
      <Carousel 
        courses={courses}
        title="Khóa Học Nổi Bật"
      />
      <Carousel 
        courses={courses}
        title="Khóa Học Mới Nhất"
      />
      <Testimonial />
    </>
  );
}

export default Home;