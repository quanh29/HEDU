import heroImg from '../../assets/9 SCENE.svg';
import styles from './Hero.module.css';

function Hero() {
  return (
    <section className={styles.hero} id="home">
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <h1>Học tập không giới hạn cùng các khóa học chất lượng cao</h1>
          <p>Tiết kiệm thời gian và chi phí với phương pháp học tập trực tuyến linh hoạt. Phát triển sự nghiệp, nâng cao tư duy chỉ với vài cú click.</p>
          <div className={styles.heroButtons}>
            <a href="#courses" className={styles.btnHero}>Tham gia ngay</a>
            <a href="#demo" className={styles.btnHero}>Xem demo</a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroIllustration}>
            <img src={heroImg} alt="Hero Illustration" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;