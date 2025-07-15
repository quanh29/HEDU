// Định dạng dữ liệu mẫu cho CoursePage:
/*
{
  courseId: number | string, // Mã khóa học
  title: string, // Tiêu đề khóa học
  image: string, // URL ảnh
  rating: number, // Điểm đánh giá
  reviewCount: number, // Số lượng đánh giá
  studentsCount: number, // Số học viên
  tags: string[], // Các tag liên quan
  originalPrice: number, // Giá gốc
  currentPrice: number, // Giá khuyến mãi (nếu có)
  description: string, // Mô tả khóa học
  instructor: {
    name: string,
    avatar: string | null,
    bio: string
  },
  objectives: string[], // Các mục tiêu học tập
  requirements: string[], // Yêu cầu đầu vào
  curriculum: [
    {
      title: string, // Tiêu đề phần
      lessons: string[] // Danh sách bài học
    }
  ]
}
*/
export const courseDetailDummy = {
  courseId: 1,
  title: "Lập trình Web từ cơ bản đến nâng cao",
  image: "https://i.pinimg.com/originals/1c/06/a8/1c06a8c6747ce5a26cb75e7ff908e329.gif",
  rating: 4.8,
  reviewCount: 1234,
  studentsCount: 15847,
  tags: ["Web Development", "HTML/CSS", "JavaScript", "React", "Node.js", "Dành cho người mới"],
  originalPrice: 1000000,
  currentPrice: 250000,
  description: `Khóa học toàn diện giúp bạn từ người mới bắt đầu trở thành lập trình viên web chuyên nghiệp. Học HTML, CSS, JavaScript, React, Node.js và nhiều công nghệ hiện đại khác thông qua các dự án thực tế.`,
  instructor: {
    name: "Nguyễn Văn A",
    avatar: "data:image/jpeg;base64,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",
    bio: "Giảng viên có 10 năm kinh nghiệm phát triển web và đào tạo lập trình."
  },
  objectives: [
    "Xây dựng website responsive với HTML5 và CSS3",
    "Lập trình JavaScript từ cơ bản đến nâng cao",
    "Phát triển ứng dụng web với React.js",
    "Xây dựng API với Node.js và Express",
    "Làm việc với cơ sở dữ liệu MongoDB",
    "Deploy ứng dụng lên cloud platform",
    "Áp dụng Git và GitHub trong dự án",
    "Hiểu về bảo mật web và best practices"
  ],
  requirements: [
    "Máy tính có kết nối internet",
    "Không cần kiến thức lập trình trước đó",
    "Sẵn sàng dành 2-3 giờ/ngày để học",
    "Có tinh thần học hỏi và kiên trì",
    "Text editor (VS Code được khuyến nghị)"
  ],
  curriculum: [
    {
      title: "Giới thiệu & HTML/CSS",
      lessons: ["Giới thiệu khóa học", "Cài đặt môi trường", "HTML cơ bản", "CSS cơ bản"]
    },
    {
      title: "JavaScript & React",
      lessons: ["JavaScript cơ bản", "DOM manipulation", "React căn bản", "React nâng cao"]
    },
    {
      title: "Node.js & Backend",
      lessons: ["Node.js căn bản", "Express.js", "Kết nối MongoDB", "Xây dựng API"]
    }
  ]
};
