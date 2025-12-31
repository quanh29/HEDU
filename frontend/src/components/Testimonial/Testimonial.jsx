import { Star } from 'lucide-react';
import styles from './Testimonial.module.css';

const Testimonial = () => {
    const cardsData = [
        {
            image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
            name: 'Nguyễn Minh Tuấn',
            handle: 'Giám đốc công ty Tech Startup',
            date: '20/04/2025',
            rating: 5,
            cardText: 'Các khóa học trên HEDU đã giúp tôi và đội ngũ nâng cao kỹ năng chuyên môn đáng kể. Nội dung cập nhật, giảng viên nhiệt tình!'
        },
        {
            image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
            name: 'Trần Thị Hương',
            handle: 'Freelance Designer',
            date: '10/05/2025',
            rating: 5,
            cardText: 'Nền tảng học tập tuyệt vời! Giao diện thân thiện, dễ sử dụng. Tôi đã học được nhiều kỹ năng mới và áp dụng ngay vào công việc.'
        },
        {
            image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60',
            name: 'Lê Hoàng Nam',
            handle: 'Marketing Manager',
            date: '05/06/2025',
            rating: 5,
            cardText: 'Chất lượng khóa học vượt mong đợi với mức giá hợp lý. Đặc biệt thích phần thực hành và dự án thực tế.'
        },
        {
            image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60',
            name: 'Phạm Văn Đức',
            handle: 'Software Engineer',
            date: '15/06/2025',
            rating: 5,
            cardText: 'Giảng viên giàu kinh nghiệm, tài liệu đầy đủ. Hệ thống bài tập và quiz giúp tôi củng cố kiến thức rất tốt.'
        },
    ];

    const CreateCard = ({card}) => (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <img className={styles.cardImage} src={card.image} alt={card.name} />
                <div className={styles.cardInfo}>
                    <div className={styles.cardNameRow}>
                        <p className={styles.cardName}>{card.name}</p>
                        <svg className={styles.verifiedBadge} width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z" fill="#3b82f6" />
                        </svg>
                    </div>
                    <span className={styles.cardHandle}>{card.handle}</span>
                </div>
            </div>
            
            {/* Rating Stars */}
            <div className={styles.ratingRow}>
                {[...Array(card.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                ))}
            </div>
            
            <p className={styles.cardText}>{card.cardText}</p>
            
            <div className={styles.cardFooter}>
                <span className={styles.dateText}>{card.date}</span>
            </div>
        </div>
    );

    return (
        <section className={styles.testimonialSection}>
            <div className={styles.headerContainer}>
                <h2 className={styles.sectionTitle}>
                    Học viên nói gì về HEDU
                </h2>
                <p className={styles.sectionSubtitle}>
                    Hơn 10,000+ học viên đã tin tưởng và đồng hành cùng chúng tôi
                </p>
            </div>
            
            <div className={styles.marqueeRow}>
                <div className={styles.fadeLeft}></div>
                <div className={styles.marqueeInner}>
                    {[...cardsData, ...cardsData].map((card, index) => (
                        <CreateCard key={index} card={card} />
                    ))}
                </div>
                <div className={styles.fadeRight}></div>
            </div>

            <div className={styles.marqueeRow}>
                <div className={styles.fadeLeft}></div>
                <div className={`${styles.marqueeInner} ${styles.marqueeReverse}`}>
                    {[...cardsData, ...cardsData].map((card, index) => (
                        <CreateCard key={index} card={card} />
                    ))}
                </div>
                <div className={styles.fadeRight}></div>
            </div>
        </section>
    )
}

export default Testimonial;