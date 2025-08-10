import React from 'react';
import { Plus, Trash2, GripVertical, PlayCircle, FileText, X } from 'lucide-react';
import styles from './Curriculum.module.css';

const Curriculum = ({ sections, errors, addSection, updateSection, removeSection, addLesson, updateLesson, removeLesson }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Chương trình học</h2>
        <button
          onClick={addSection}
          className={styles.addSectionBtn}
        >
          <Plus size={16} />
          Thêm chương
        </button>
      </div>
      {errors.sections && (
        <div className={styles.errorBox}>
          <p className={styles.error}>{errors.sections}</p>
        </div>
      )}
      <div className={styles.sections}>
        {sections.map((section, sectionIndex) => (
          <div key={section.id || section._id} className={styles.section}>
            {/* Section Header */}
            <div className={styles.sectionHeader}>
              <GripVertical size={16} style={{ color: '#9ca3af', cursor: 'grab' }} />
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(section.id || section._id, 'title', e.target.value)}
                placeholder={`Chương ${sectionIndex + 1}...`}
                className={styles.sectionInput}
              />
              <button
                onClick={() => removeSection(section.id || section._id)}
                className={styles.removeSectionBtn}
              >
                <Trash2 size={16} />
              </button>
            </div>
            {/* Lessons */}
            <div className={styles.lessons}>
              {(section.lessons || []).map((lesson, lessonIndex) => (
                <React.Fragment key={lesson.id || lesson._id}>
                  <div className={styles.lesson}>
                    <div
                      className={styles.lessonIcon}
                      style={{ background: lesson.contentType === 'video' ? '#3b82f6' : '#10b981' }}
                    >
                      {lesson.contentType === 'video' ? (
                        <PlayCircle size={12} />
                      ) : (
                        <FileText size={12} />
                      )}
                    </div>
                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) => updateLesson(
                        section.id || section._id,
                        lesson.id || lesson._id,
                        'title',
                        e.target.value
                      )}
                      placeholder={`Bài ${lessonIndex + 1}...`}
                      className={styles.lessonInput}
                    />
                    <select
                      value={lesson.contentType}
                      onChange={(e) => updateLesson(
                        section.id || section._id,
                        lesson.id || lesson._id,
                        'contentType',
                        e.target.value
                      )}
                      className={styles.lessonSelect}
                    >
                      <option value="video">Video</option>
                      <option value="text">Văn bản</option>
                      <option value="quiz">Quiz</option>
                    </select>
                    {/* Upload file for video or document with styled box */}
                    {(lesson.contentType === 'video' || lesson.contentType === 'text') && (
                      <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <label
                          htmlFor={`file-upload-${section.id || section._id}-${lesson.id || lesson._id}`}
                          style={{
                            display: 'block',
                            border: '2px dashed #d1d5db',
                            borderRadius: 8,
                            padding: '16px',
                            textAlign: 'center',
                            background: '#f9fafb',
                            color: '#6b7280',
                            cursor: 'pointer',
                            fontSize: 14,
                          }}
                        >
                          {lesson.file ? `Đã chọn: ${lesson.file.name}` : `Chọn tệp để tải lên (${lesson.contentType === 'video' ? 'video' : 'tài liệu'})`}
                          <input
                            id={`file-upload-${section.id || section._id}-${lesson.id || lesson._id}`}
                            type="file"
                            accept={lesson.contentType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.csv,.zip,.rar,.jpg,.jpeg,.png,.gif'}
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file) {
                                updateLesson(
                                  section.id || section._id,
                                  lesson.id || lesson._id,
                                  'file',
                                  file
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                    <button
                      onClick={() => removeLesson(section.id || section._id, lesson.id || lesson._id)}
                      className={styles.removeLessonBtn}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {/* Quiz form for quiz lessons - now below the lesson row */}
                  {lesson.contentType === 'quiz' && (
                    <div style={{
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      padding: 16,
                      background: '#f9fafb',
                      marginTop: 8,
                      width: '100%'
                    }}>
                      {(lesson.quizQuestions || []).map((q, qIdx) => (
                        <div key={q.id || qIdx} style={{ marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                          <div style={{ marginBottom: 8 }}>
                            <input
                              type="text"
                              value={q.question || ''}
                              placeholder={`Câu hỏi ${qIdx + 1}`}
                              style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db', fontSize: 14 }}
                              onChange={e => {
                                const updated = [...(lesson.quizQuestions || [])];
                                updated[qIdx] = { ...q, question: e.target.value };
                                updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                              }}
                            />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            {(q.answers || []).map((ans, ansIdx) => (
                              <div key={ans.id || ansIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <input
                                  type="checkbox"
                                  checked={!!ans.isCorrect}
                                  onChange={e => {
                                    const updated = [...(lesson.quizQuestions || [])];
                                    const answers = [...(q.answers || [])];
                                    answers[ansIdx] = { ...ans, isCorrect: e.target.checked };
                                    updated[qIdx] = { ...q, answers };
                                    updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                                  }}
                                  style={{ marginRight: 4 }}
                                />
                                <input
                                  type="text"
                                  value={ans.text || ''}
                                  placeholder={`Đáp án ${ansIdx + 1}`}
                                  style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }}
                                  onChange={e => {
                                    const updated = [...(lesson.quizQuestions || [])];
                                    const answers = [...(q.answers || [])];
                                    answers[ansIdx] = { ...ans, text: e.target.value };
                                    updated[qIdx] = { ...q, answers };
                                    updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                                  }}
                                />
                                <button
                                  type="button"
                                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}
                                  onClick={() => {
                                    const updated = [...(lesson.quizQuestions || [])];
                                    const answers = [...(q.answers || [])];
                                    answers.splice(ansIdx, 1);
                                    updated[qIdx] = { ...q, answers };
                                    updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                                  }}
                                >✕</button>
                              </div>
                            ))}
                            <button
                              type="button"
                              style={{ marginTop: 4, border: '1px dashed #3b82f6', background: 'white', color: '#3b82f6', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
                              onClick={() => {
                                const updated = [...(lesson.quizQuestions || [])];
                                const answers = [...(q.answers || [])];
                                answers.push({ text: '', isCorrect: false });
                                updated[qIdx] = { ...q, answers };
                                updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                              }}
                            >+ Thêm đáp án</button>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <input
                              type="text"
                              value={q.explanation || ''}
                              placeholder="Giải thích (tuỳ chọn)"
                              style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #d1d5db', fontSize: 13 }}
                              onChange={e => {
                                const updated = [...(lesson.quizQuestions || [])];
                                updated[qIdx] = { ...q, explanation: e.target.value };
                                updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            style={{ border: '1px solid #ef4444', background: 'white', color: '#ef4444', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
                            onClick={() => {
                              const updated = [...(lesson.quizQuestions || [])];
                              updated.splice(qIdx, 1);
                              updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                            }}
                          >Xoá câu hỏi</button>
                        </div>
                      ))}
                      <button
                        type="button"
                        style={{ border: '1px dashed #3b82f6', background: 'white', color: '#3b82f6', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}
                        onClick={() => {
                          const updated = [...(lesson.quizQuestions || [])];
                          updated.push({ question: '', answers: [{ text: '', isCorrect: false }], explanation: '' });
                          updateLesson(section.id || section._id, lesson.id || lesson._id, 'quizQuestions', updated);
                        }}
                      >+ Thêm câu hỏi</button>
                    </div>
                  )}
                </React.Fragment>
              ))}
              <button
                onClick={() => addLesson(section.id || section._id)}
                className={styles.addLessonBtn}
              >
                <Plus size={16} />
                Thêm bài học
              </button>
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className={styles.emptySection}>
            <PlayCircle size={48} className={styles.emptyIcon} />
            <p style={{ fontSize: '16px', margin: 0 }}>Chưa có chương học nào</p>
            <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>Nhấn "Thêm chương" để bắt đầu tạo nội dung</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Curriculum;
