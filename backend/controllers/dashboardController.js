import Course from '../models/Course.js';
import Earning from '../models/Earning.js';
import Enrollment from '../models/Enrollment.js';
import Rating from '../models/Rating.js';
import User from '../models/User.js';

/**
 * Get instructor dashboard statistics
 * @route GET /api/dashboard/instructor/stats
 */
export const getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.userId;

    // Get total courses from MongoDB
    const totalCourses = await Course.countDocuments({
      instructor_id: instructorId,
      course_status: { $ne: 'draft' }
    });

    // Get course IDs for enrollments
    const courses = await Course.find(
      { instructor_id: instructorId },
      { _id: 1 }
    );
    const courseIdsList = courses.map(c => c._id);
    
    const totalStudents = courseIdsList.length > 0 
      ? await Enrollment.countDocuments({ courseId: { $in: courseIdsList } })
      : 0;

    // Get total revenue (pending + cleared)
    const earnings = await Earning.find({
      instructor_id: instructorId,
      status: { $in: ['pending', 'cleared'] }
    });
    const totalRevenue = earnings.reduce((sum, e) => sum + e.net_amount, 0);

    // Get pending revenue
    const pendingEarnings = await Earning.find({
      instructor_id: instructorId,
      status: 'pending'
    });
    const pendingRevenue = pendingEarnings.reduce((sum, e) => sum + e.net_amount, 0);

    // Get cleared revenue
    const clearedEarnings = await Earning.find({
      instructor_id: instructorId,
      status: 'cleared'
    });
    const clearedRevenue = clearedEarnings.reduce((sum, e) => sum + e.net_amount, 0);

    // Get average rating
    const ratings = await Rating.find({ course_id: { $in: courseIdsList } });
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    return res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalRevenue,
        pendingRevenue,
        clearedRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: ratings.length
      }
    });

  } catch (error) {
    console.error('Error fetching instructor stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải thống kê',
      error: error.message
    });
  }
};

/**
 * Get revenue over time
 * @route GET /api/dashboard/instructor/revenue-chart
 */
export const getRevenueChart = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { timeFilter = 'month' } = req.query;

    // Calculate date range based on filter
    const now = new Date();
    let startDate = new Date();
    let groupBy = '$month';
    let limit = 12;

    switch (timeFilter) {
      case 'week':
        startDate.setDate(now.getDate() - 7 * 12); // 12 weeks
        groupBy = '$week';
        limit = 12;
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 12); // 12 quarters (3 years)
        groupBy = '$month';
        limit = 12;
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 5); // 5 years
        groupBy = '$year';
        limit = 5;
        break;
      default: // month
        startDate.setMonth(now.getMonth() - 12); // 12 months
        groupBy = '$month';
        limit = 12;
    }

    const earnings = await Earning.aggregate([
      {
        $match: {
          instructor_id: instructorId,
          status: { $in: ['pending', 'cleared'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$net_amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: limit
      }
    ]);

    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const chartData = earnings.map(e => ({
      month: monthNames[e._id.month - 1],
      revenue: e.revenue,
      courses: e.count
    }));

    return res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error fetching revenue chart:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải biểu đồ doanh thu',
      error: error.message
    });
  }
};

/**
 * Get revenue by course
 * @route GET /api/dashboard/instructor/revenue-by-course
 */
export const getRevenueByCourse = async (req, res) => {
  try {
    const instructorId = req.userId;

    const earnings = await Earning.aggregate([
      {
        $match: {
          instructor_id: instructorId,
          status: { $in: ['pending', 'cleared'] }
        }
      },
      {
        $group: {
          _id: '$course_id',
          value: { $sum: '$net_amount' }
        }
      },
      {
        $sort: { value: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get course names from MongoDB
    const courseIds = earnings.map(e => e._id);
    if (courseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const courses = await Course.find(
      { _id: { $in: courseIds } },
      { _id: 1, title: 1 }
    );

    const courseTitles = {};
    courses.forEach(c => {
      courseTitles[c._id] = c.title;
    });

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    const chartData = earnings.map((e, index) => ({
      name: courseTitles[e._id] || 'Unknown Course',
      value: e.value,
      color: colors[index % colors.length]
    }));

    return res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error fetching revenue by course:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải doanh thu theo khóa học',
      error: error.message
    });
  }
};

/**
 * Get course ratings
 * @route GET /api/dashboard/instructor/course-ratings
 */
export const getCourseRatings = async (req, res) => {
  try {
    const instructorId = req.userId;

    // Get instructor courses from MongoDB
    const courses = await Course.find(
      {
        instructor_id: instructorId,
        course_status: { $ne: 'draft' }
      },
      { _id: 1, title: 1 }
    );

    const courseIds = courses.map(c => c._id);
    
    if (courseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get ratings and enrollments for each course
    const ratingsData = await Promise.all(
      courses.map(async (course) => {
        const ratings = await Rating.find({ course_id: course._id });
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;
        
        const students = await Enrollment.countDocuments({ courseId: course._id });

        return {
          course: course.title,
          rating: Math.round(avgRating * 10) / 10,
          reviews: ratings.length,
          students
        };
      })
    );

    // Sort by rating and limit to top 5
    const sortedData = ratingsData
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    return res.json({
      success: true,
      data: sortedData
    });

  } catch (error) {
    console.error('Error fetching course ratings:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải đánh giá khóa học',
      error: error.message
    });
  }
};

/**
 * Get recent activities
 * @route GET /api/dashboard/instructor/recent-activities
 */
export const getRecentActivities = async (req, res) => {
  try {
    const instructorId = req.userId;

    // Get instructor courses from MongoDB
    const courses = await Course.find(
      { instructor_id: instructorId },
      { _id: 1, title: 1 }
    );

    const courseIds = courses.map(c => c._id);
    const courseTitles = {};
    courses.forEach(c => {
      courseTitles[c._id] = c.title;
    });

    if (courseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get recent enrollments
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get recent ratings
    const ratings = await Rating.find({ course_id: { $in: courseIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get user info from MongoDB
    const userIds = [...new Set([
      ...enrollments.map(e => e.userId),
      ...ratings.map(r => r.user_id)
    ])];

    const users = await User.find(
      { _id: { $in: userIds } },
      { _id: 1, full_name: 1 }
    );

    const userNames = {};
    users.forEach(u => {
      userNames[u._id] = u.full_name;
    });

    // Combine and format activities
    const activities = [];

    enrollments.forEach(e => {
      activities.push({
        id: `enroll-${e._id}`,
        type: 'enrollment',
        student: userNames[e.userId] || 'Unknown User',
        course: courseTitles[e.courseId] || 'Unknown Course',
        time: formatTimeAgo(e.createdAt),
        icon: 'user-plus',
        timestamp: e.createdAt
      });
    });

    ratings.forEach(r => {
      activities.push({
        id: `rating-${r._id}`,
        type: 'review',
        student: userNames[r.user_id] || 'Unknown User',
        course: courseTitles[r.course_id] || 'Unknown Course',
        rating: r.rating,
        comment: r.comment || '',
        time: formatTimeAgo(r.createdAt),
        icon: 'star',
        timestamp: r.createdAt
      });
    });

    // Sort by timestamp and limit to 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map(({ timestamp, ...rest }) => rest); // Remove timestamp from response

    return res.json({
      success: true,
      data: sortedActivities
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải hoạt động gần đây',
      error: error.message
    });
  }
};

/**
 * Helper function to format time ago
 */
function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 30) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString('vi-VN');
}
