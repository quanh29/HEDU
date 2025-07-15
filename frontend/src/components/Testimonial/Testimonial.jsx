import styles from './Testimonial.module.css';

const Testimonial = () => {
    const cardsData = [
        {
            image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
            name: 'Briar Martin',
            handle: 'Giám đốc công ty Radiant',
            date: '20/04/2025',
            cardText: 'Radiant giúp chúng tôi vượt qua mọi đối thủ một cách dễ dàng.'
        },
        {
            image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
            name: 'Avery Johnson',
            handle: 'Nhà văn tự do',
            date: '10/05/2025',
            cardText: 'Nền tảng này thực sự thay đổi cách tôi học tập và làm việc.'
        },
        {
            image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60',
            name: 'Jordan Lee',
            handle: 'Chuyên gia Marketing',
            date: '05/06/2025',
            cardText: 'Tôi đã nâng cao kỹ năng chuyên môn nhờ các khoá học chất lượng.'
        },
        {
            image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60',
            name: 'Avery Johnson',
            handle: 'Nhà văn tự do',
            date: '10/05/2025',
            cardText: 'Giảng viên tận tâm, nội dung cập nhật liên tục.'
        },
    ];

    const CreateCard = ({card}) => (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <img className={styles.cardImage} src={card.image} alt="User Image" />
                <div className={styles.cardInfo}>
                    <div className={styles.cardNameRow}>
                        <p className={styles.cardName}>{card.name}</p>
                        <svg style={{marginTop: '2px'}} width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.555.72a4 4 0 0 1-.297.24c-.179.12-.38.202-.59.244a4 4 0 0 1-.38.041c-.48.039-.721.058-.922.129a1.63 1.63 0 0 0-.992.992c-.071.2-.09.441-.129.922a4 4 0 0 1-.041.38 1.6 1.6 0 0 1-.245.59 3 3 0 0 1-.239.297c-.313.368-.47.551-.56.743-.213.444-.213.96 0 1.404.09.192.247.375.56.743.125.146.187.219.24.297.12.179.202.38.244.59.018.093.026.189.041.38.039.48.058.721.129.922.163.464.528.829.992.992.2.071.441.09.922.129.191.015.287.023.38.041.21.042.411.125.59.245.078.052.151.114.297.239.368.313.551.47.743.56.444.213.96.213 1.404 0 .192-.09.375-.247.743-.56.146-.125.219-.187.297-.24.179-.12.38-.202.59-.244a4 4 0 0 1 .38-.041c.48-.039.721-.058.922-.129.464-.163.829-.528.992-.992.071-.2.09-.441.129-.922a4 4 0 0 1 .041-.38c.042-.21.125-.411.245-.59.052-.078.114-.151.239-.297.313-.368.47-.551.56-.743.213-.444.213-.96 0-1.404-.09-.192-.247-.375-.56-.743a4 4 0 0 1-.24-.297 1.6 1.6 0 0 1-.244-.59 3 3 0 0 1-.041-.38c-.039-.48-.058-.721-.129-.922a1.63 1.63 0 0 0-.992-.992c-.2-.071-.441-.09-.922-.129a4 4 0 0 1-.38-.041 1.6 1.6 0 0 1-.59-.245A3 3 0 0 1 7.445.72C7.077.407 6.894.25 6.702.16a1.63 1.63 0 0 0-1.404 0c-.192.09-.375.247-.743.56m4.07 3.998a.488.488 0 0 0-.691-.69l-2.91 2.91-.958-.957a.488.488 0 0 0-.69.69l1.302 1.302c.19.191.5.191.69 0z" fill="#2196F3" />
                        </svg>
                    </div>
                    <span className={styles.cardHandle}>{card.handle}</span>
                </div>
            </div>
            <p className={styles.cardText}>{card.cardText}</p>
            <div className={styles.cardFooter}>
                <p>{card.date}</p>
            </div>
        </div>
    );

    return (
        <>
            <h2 style={{textAlign: 'center', fontWeight: 700, fontSize: '2rem', margin: '2rem 0 1rem'}}>
                Trải nghiệm của người dùng
            </h2>
            <div className={styles.marqueeRow}>
                <div className={styles.gradientLeft}></div>
                <div className={styles.marqueeInner + ' flex min-w-[200%] pt-10 pb-5'}>
                    {[...cardsData, ...cardsData].map((card, index) => (
                        <CreateCard key={index} card={card} />
                    ))}
                </div>
                <div className={styles.gradientRight}></div>
            </div>

            <div className={styles.marqueeRow}>
                <div className={styles.gradientLeft}></div>
                <div className={styles.marqueeInner + ' ' + styles.marqueeReverse + ' flex min-w-[200%] pt-10 pb-5'}>
                    {[...cardsData, ...cardsData].map((card, index) => (
                        <CreateCard key={index} card={card} />
                    ))}
                </div>
                <div className={styles.gradientRight}></div>
            </div>
        </>
    )
}

export default Testimonial;