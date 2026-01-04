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
    const { courseFilter, month, year } = req.query;

    // Get courses filter
    let coursesQuery = { instructor_id: instructorId };
    if (courseFilter && courseFilter !== 'all') {
      coursesQuery._id = courseFilter;
    }

    // Get total courses from MongoDB
    const totalCourses = await Course.countDocuments({
      ...coursesQuery,
      course_status: { $ne: 'draft' }
    });

    // Get course IDs for enrollments
    const courses = await Course.find(coursesQuery, { _id: 1 });
    const courseIdsList = courses.map(c => c._id);
    
    const totalStudents = courseIdsList.length > 0 
      ? await Enrollment.countDocuments({ courseId: { $in: courseIdsList } })
      : 0;

    // Calculate date ranges for comparison
    const now = new Date();
    let startOfThisMonth, startOfLastMonth, endOfLastMonth;
    
    // Nếu có filter theo tháng cụ thể
    if (month && year) {
      const selectedMonth = parseInt(month);
      const selectedYear = parseInt(year);
      startOfThisMonth = new Date(selectedYear, selectedMonth - 1, 1);
      const endOfThisMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      startOfLastMonth = new Date(selectedYear, selectedMonth - 2, 1);
      endOfLastMonth = new Date(selectedYear, selectedMonth - 1, 0, 23, 59, 59);
      
      // Adjust for year boundary
      if (selectedMonth === 1) {
        startOfLastMonth = new Date(selectedYear - 1, 11, 1);
        endOfLastMonth = new Date(selectedYear - 1, 11, 31, 23, 59, 59);
      }
    } else {
      // Default: current month vs last month
      startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    // Get total revenue (all time)
    const earnings = await Earning.find({
      instructor_id: instructorId,
      ...(courseIdsList.length > 0 ? { course_id: { $in: courseIdsList } } : {}),
      status: { $in: ['pending', 'cleared'] }
    });
    const totalRevenue = earnings.reduce((sum, e) => sum + e.net_amount, 0);

    // Get this month revenue
    const thisMonthEarnings = await Earning.find({
      instructor_id: instructorId,
      ...(courseIdsList.length > 0 ? { course_id: { $in: courseIdsList } } : {}),
      status: { $in: ['pending', 'cleared'] },
      createdAt: { $gte: startOfThisMonth }
    });
    const thisMonthRevenue = thisMonthEarnings.reduce((sum, e) => sum + e.net_amount, 0);

    // Get last month revenue
    const lastMonthEarnings = await Earning.find({
      instructor_id: instructorId,
      ...(courseIdsList.length > 0 ? { course_id: { $in: courseIdsList } } : {}),
      status: { $in: ['pending', 'cleared'] },
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    const lastMonthRevenue = lastMonthEarnings.reduce((sum, e) => sum + e.net_amount, 0);

    // Get last month students count
    const lastMonthStudents = courseIdsList.length > 0
      ? await Enrollment.countDocuments({ 
          courseId: { $in: courseIdsList },
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        })
      : 0;

    // Get this month students count
    const thisMonthStudents = courseIdsList.length > 0
      ? await Enrollment.countDocuments({ 
          courseId: { $in: courseIdsList },
          createdAt: { $gte: startOfThisMonth }
        })
      : 0;

    // Get pending revenue
    const pendingEarnings = await Earning.find({
      instructor_id: instructorId,
      ...(courseIdsList.length > 0 ? { course_id: { $in: courseIdsList } } : {}),
      status: 'pending'
    });
    const pendingRevenue = pendingEarnings.reduce((sum, e) => sum + e.net_amount, 0);

    // Get cleared revenue
    const clearedEarnings = await Earning.find({
      instructor_id: instructorId,
      ...(courseIdsList.length > 0 ? { course_id: { $in: courseIdsList } } : {}),
      status: 'cleared'
    });
    const clearedRevenue = clearedEarnings.reduce((sum, e) => sum + e.net_amount, 0);

    // Get average rating
    const ratings = await Rating.find({ course_id: { $in: courseIdsList } });
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    // Calculate percentage changes
    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    const studentsChange = lastMonthStudents > 0
      ? ((thisMonthStudents - lastMonthStudents) / lastMonthStudents) * 100
      : 0;

    return res.json({
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalRevenue: courseFilter && courseFilter !== 'all' ? thisMonthRevenue : totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueChange,
        thisMonthStudents,
        lastMonthStudents,
        studentsChange,
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
    const { timeFilter = 'all', courseFilter } = req.query;

    // Calculate date range based on filter
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    let limit = 100;

    // Check if timeFilter is a specific year (like "2025", "2024", etc.)
    const yearMatch = timeFilter.match(/^(\d{4})$/);
    
    if (yearMatch) {
      // Filter by specific year - show all 12 months
      const year = parseInt(yearMatch[1]);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
      groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
      limit = 12;
    } else if (timeFilter === 'all') {
      // Show all years from 2000
      startDate = new Date(2000, 0, 1);
      endDate = now;
      groupBy = { year: { $year: '$createdAt' } };
      limit = 100;
    } else {
      // Default to current year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = now;
      groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
      limit = 12;
    }

    let matchQuery = {
      instructor_id: instructorId,
      status: { $in: ['pending', 'cleared'] },
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (courseFilter && courseFilter !== 'all') {
      matchQuery.course_id = courseFilter;
    }

    const earnings = await Earning.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: groupBy,
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
    const chartData = earnings.map(e => {
      let label;
      if (timeFilter === 'all') {
        // Show only year for "all" view
        label = `${e._id.year}`;
      } else if (e._id.month) {
        // Show only month name for specific year view
        label = monthNames[e._id.month - 1];
      } else {
        label = `${e._id.year}`;
      }
      return {
        month: label,
        monthNumber: e._id.month || null, // Thêm month number để frontend có thể filter
        year: e._id.year,
        revenue: e.revenue,
        courses: e.count
      };
    });

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
    const { courseFilter, month, year } = req.query;

    let matchQuery = {
      instructor_id: instructorId,
      status: { $in: ['pending', 'cleared'] }
    };

    if (courseFilter && courseFilter !== 'all') {
      matchQuery.course_id = courseFilter;
    }

    // Filter by specific month and year if provided
    if (month && year) {
      const selectedMonth = parseInt(month);
      const selectedYear = parseInt(year);
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      matchQuery.createdAt = { $gte: startDate, $lte: endDate };
    }

    const earnings = await Earning.aggregate([
      {
        $match: matchQuery
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
    const { courseFilter, month, year } = req.query;

    let coursesQuery = {
      instructor_id: instructorId,
      course_status: { $ne: 'draft' }
    };

    if (courseFilter && courseFilter !== 'all') {
      coursesQuery._id = courseFilter;
    }

    // Get instructor courses from MongoDB
    const courses = await Course.find(coursesQuery, { _id: 1, title: 1 });

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
    const { courseFilter, month, year } = req.query;

    let coursesQuery = { instructor_id: instructorId };
    if (courseFilter && courseFilter !== 'all') {
      coursesQuery._id = courseFilter;
    }

    // Get instructor courses from MongoDB
    const courses = await Course.find(coursesQuery, { _id: 1, title: 1 });

    const courseIds = courses.map(c => c._id);
    const courseTitles = {};
    courses.forEach(c => {
      courseTitles[c._id] = c.title;
    });

    if (courseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Date filter query
    let dateQuery = {};
    if (month && year) {
      const selectedMonth = parseInt(month);
      const selectedYear = parseInt(year);
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      dateQuery = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    // Get recent enrollments
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds }, ...dateQuery })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get recent ratings
    const ratings = await Rating.find({ course_id: { $in: courseIds }, ...dateQuery })
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
 * Get available years with revenue data
 * @route GET /api/dashboard/instructor/available-years
 */
export const getAvailableYears = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { courseFilter } = req.query;

    let matchQuery = {
      instructor_id: instructorId,
      status: { $in: ['pending', 'cleared'] }
    };

    if (courseFilter && courseFilter !== 'all') {
      matchQuery.course_id = courseFilter;
    }

    // Get distinct years from earnings
    const years = await Earning.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: { $year: '$createdAt' }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    const yearList = years.map(y => y._id);

    return res.json({
      success: true,
      data: yearList
    });

  } catch (error) {
    console.error('Error fetching available years:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải danh sách năm',
      error: error.message
    });
  }
};

/**
 * Get top courses by students
 * @route GET /api/dashboard/instructor/top-courses-by-students
 */
export const getTopCoursesByStudents = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { courseFilter, month, year } = req.query;

    let coursesQuery = {
      instructor_id: instructorId,
      course_status: { $ne: 'draft' }
    };

    if (courseFilter && courseFilter !== 'all') {
      coursesQuery._id = courseFilter;
    }

    // Get instructor courses
    const courses = await Course.find(coursesQuery, { _id: 1, title: 1 });
    const courseIds = courses.map(c => c._id);
    
    if (courseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Date filter query
    let dateQuery = {};
    if (month && year) {
      const selectedMonth = parseInt(month);
      const selectedYear = parseInt(year);
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      dateQuery = { createdAt: { $gte: startDate, $lte: endDate } };
    }

    // Get enrollment counts for each course
    const enrollmentCounts = await Promise.all(
      courses.map(async (course) => {
        const studentCount = await Enrollment.countDocuments({ courseId: course._id, ...dateQuery });
        return {
          name: course.title,
          value: studentCount,
          courseId: course._id
        };
      })
    );

    // Sort by student count and limit to top 5
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    const topCourses = enrollmentCounts
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((course, index) => ({
        ...course,
        color: colors[index % colors.length]
      }));

    return res.json({
      success: true,
      data: topCourses
    });

  } catch (error) {
    console.error('Error fetching top courses by students:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải top khóa học theo học viên',
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
