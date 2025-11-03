import React from 'react';
import { PlayCircle, FileText, CheckSquare, Clock } from 'lucide-react';

/**
 * Component hiển thị thống kê bài học của khóa học
 * @param {Array} sections - Danh sách sections với lessons
 */
const LessonStatistics = ({ sections }) => {
  // Calculate statistics
  const stats = {
    totalVideos: 0,
    totalMaterials: 0,
    totalQuizzes: 0,
    totalDuration: 0
  };

  sections.forEach(section => {
    section.lessons?.forEach(lesson => {
      if (lesson.contentType === 'video') {
        stats.totalVideos++;
        stats.totalDuration += lesson.duration || 0;
      } else if (lesson.contentType === 'material') {
        stats.totalMaterials++;
      } else if (lesson.contentType === 'quiz') {
        stats.totalQuizzes++;
      }
    });
  });

  const totalLessons = stats.totalVideos + stats.totalMaterials + stats.totalQuizzes;
  const durationInMinutes = Math.round(stats.totalDuration / 60);
  const durationInHours = Math.floor(durationInMinutes / 60);
  const remainingMinutes = durationInMinutes % 60;

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '16px'
    }}>
      {/* Total Lessons */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <PlayCircle size={20} style={{ color: '#2563eb' }} />
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Tổng bài học</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            {totalLessons}
          </div>
        </div>
      </div>

      {/* Videos */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <PlayCircle size={20} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Videos</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            {stats.totalVideos}
          </div>
        </div>
      </div>

      {/* Materials */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FileText size={20} style={{ color: '#10b981' }} />
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Tài liệu</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            {stats.totalMaterials}
          </div>
        </div>
      </div>

      {/* Quizzes */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CheckSquare size={20} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Bài kiểm tra</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            {stats.totalQuizzes}
          </div>
        </div>
      </div>

      {/* Duration */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: '#e0e7ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Clock size={20} style={{ color: '#6366f1' }} />
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Thời lượng</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            {durationInHours > 0 
              ? `${durationInHours}h ${remainingMinutes}m`
              : `${durationInMinutes}m`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonStatistics;
