/**
 * Utility functions for mapping and transforming course data
 * Handles mapping between backend API response and frontend state
 */

/**
 * Map video data from API to frontend format
 */
export const mapVideoData = (video) => {
  return {
    id: video._id,
    _id: video._id,
    title: video.title,
    contentType: 'video',
    url: video.contentUrl || '',
    info: video.description || '',
    description: video.description || '',
    order: video.order || 0,
    // Video-specific fields
    duration: video.duration || 0,
    status: video.status || 'processing',
    muxAssetId: video.muxAssetId || '',
    muxPlaybackId: video.muxPlaybackId || '',
    thumbnailUrl: video.thumbnailUrl || '',
    createdAt: video.createdAt,
    updatedAt: video.updatedAt
  };
};

/**
 * Map material data from API to frontend format
 */
export const mapMaterialData = (material) => {
  return {
    id: material._id,
    _id: material._id,
    title: material.title,
    contentType: 'material',
    url: material.contentUrl || '',
    info: material.description || '',
    description: material.description || '',
    order: material.order || 0,
    // Material-specific fields
    fileType: material.fileType || '',
    fileSize: material.fileSize || 0,
    fileName: material.fileName || '',
    downloadUrl: material.downloadUrl || material.contentUrl || '',
    createdAt: material.createdAt,
    updatedAt: material.updatedAt
  };
};

/**
 * Map quiz data from API to frontend format
 */
export const mapQuizData = (quiz) => {
  return {
    id: quiz._id,
    _id: quiz._id,
    title: quiz.title,
    contentType: 'quiz',
    info: quiz.description || '',
    order: quiz.order || 0,
    // Quiz-specific fields
    passingScore: quiz.passingScore || 70,
    timeLimit: quiz.timeLimit || null,
    allowRetake: quiz.allowRetake !== false,
    showCorrectAnswers: quiz.showCorrectAnswers !== false,
    quizQuestions: (quiz.questions || []).map(q => ({
      id: q._id,
      question: q.questionText,
      questionType: q.questionType || 'single-choice',
      answers: (q.options || []).map((opt, idx) => ({
        text: opt,
        isCorrect: (q.correctAnswers || []).includes(idx)
      })),
      explanation: q.explanation || '',
      points: q.points || 1
    })),
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt
  };
};

/**
 * Map section data with all lessons (videos, materials, quizzes)
 */
export const mapSectionData = (section) => {
  console.log('🔍 [mapSectionData] Processing section:', section.title || 'Untitled');
  console.log('🔍 [mapSectionData] Section data:', {
    _id: section._id,
    title: section.title,
    hasVideos: !!section.videos,
    videosLength: section.videos?.length || 0,
    hasMaterials: !!section.materials,
    materialsLength: section.materials?.length || 0,
    hasQuizzes: !!section.quizzes,
    quizzesLength: section.quizzes?.length || 0
  });
  
  const lessons = [];
  
  // Add videos
  if (section.videos && section.videos.length > 0) {
    console.log(`📹 [mapSectionData] Mapping ${section.videos.length} videos`);
    section.videos.forEach((video, idx) => {
      console.log(`  Video ${idx + 1}:`, video.title, video._id);
      lessons.push(mapVideoData(video));
    });
  } else {
    console.log('📹 [mapSectionData] No videos found');
  }
  
  // Add materials
  if (section.materials && section.materials.length > 0) {
    console.log(`📄 [mapSectionData] Mapping ${section.materials.length} materials`);
    section.materials.forEach((material, idx) => {
      console.log(`  Material ${idx + 1}:`, material.title, material._id);
      lessons.push(mapMaterialData(material));
    });
  } else {
    console.log('📄 [mapSectionData] No materials found');
  }
  
  // Add quizzes
  if (section.quizzes && section.quizzes.length > 0) {
    console.log(`📝 [mapSectionData] Mapping ${section.quizzes.length} quizzes`);
    section.quizzes.forEach((quiz, idx) => {
      console.log(`  Quiz ${idx + 1}:`, quiz.title, quiz._id);
      lessons.push(mapQuizData(quiz));
    });
  } else {
    console.log('📝 [mapSectionData] No quizzes found');
  }
  
  // Sort lessons by order
  lessons.sort((a, b) => a.order - b.order);
  
  console.log(`✅ [mapSectionData] Total lessons mapped: ${lessons.length}`);
  
  return {
    id: section._id,
    _id: section._id,
    title: section.title,
    description: section.description || '',
    order: section.order || 0,
    lessons: lessons,
    createdAt: section.createdAt,
    updatedAt: section.updatedAt
  };
};

/**
 * Transform video lesson data for saving
 */
export const transformVideoForSave = (lesson, lessonIndex) => {
  return {
    title: lesson.title,
    contentType: 'video',
    contentUrl: lesson.url || '',
    description: lesson.description || '',
    info: lesson.info || '',
    order: lesson.order || lessonIndex,
    duration: lesson.duration || 0,
    status: lesson.status || 'processing',
    ...(lesson.muxAssetId && { muxAssetId: lesson.muxAssetId }),
    ...(lesson.muxPlaybackId && { muxPlaybackId: lesson.muxPlaybackId }),
    ...(lesson.thumbnailUrl && { thumbnailUrl: lesson.thumbnailUrl })
  };
};

/**
 * Transform material lesson data for saving
 */
export const transformMaterialForSave = (lesson, lessonIndex) => {
  return {
    title: lesson.title,
    contentType: 'material',
    contentUrl: lesson.url || '',
    description: lesson.description || '',
    info: lesson.info || '',
    order: lesson.order || lessonIndex,
    ...(lesson.fileType && { fileType: lesson.fileType }),
    ...(lesson.fileSize && { fileSize: lesson.fileSize }),
    ...(lesson.fileName && { fileName: lesson.fileName }),
    ...(lesson.downloadUrl && { downloadUrl: lesson.downloadUrl })
  };
};

/**
 * Transform quiz lesson data for saving
 */
export const transformQuizForSave = (lesson, lessonIndex) => {
  return {
    title: lesson.title,
    contentType: 'quiz',
    description: lesson.info || '',
    order: lesson.order || lessonIndex,
    passingScore: lesson.passingScore || 70,
    timeLimit: lesson.timeLimit || null,
    allowRetake: lesson.allowRetake !== false,
    showCorrectAnswers: lesson.showCorrectAnswers !== false,
    questions: (lesson.quizQuestions || []).map(q => ({
      questionText: q.question,
      questionType: q.questionType || 'single-choice',
      options: (q.answers || []).map(ans => ans.text),
      correctAnswers: (q.answers || [])
        .map((ans, idx) => ans.isCorrect ? idx : null)
        .filter(idx => idx !== null),
      explanation: q.explanation || '',
      points: q.points || 1
    }))
  };
};

/**
 * Transform lesson data for saving based on contentType
 */
export const transformLessonForSave = (lesson, lessonIndex) => {
  if (lesson.contentType === 'video') {
    return transformVideoForSave(lesson, lessonIndex);
  } else if (lesson.contentType === 'material') {
    return transformMaterialForSave(lesson, lessonIndex);
  } else if (lesson.contentType === 'quiz') {
    return transformQuizForSave(lesson, lessonIndex);
  }
  
  // Fallback for unknown content type
  return {
    title: lesson.title,
    contentType: lesson.contentType,
    order: lesson.order || lessonIndex
  };
};

/**
 * Transform section data for saving
 */
export const transformSectionForSave = (section, sectionIndex) => {
  return {
    title: section.title,
    description: section.description || '',
    order: section.order || sectionIndex,
    lessons: (section.lessons || []).map((lesson, lessonIndex) => 
      transformLessonForSave(lesson, lessonIndex)
    )
  };
};

/**
 * Get lesson statistics from sections
 */
export const getLessonStatistics = (sections) => {
  let totalVideos = 0;
  let totalMaterials = 0;
  let totalQuizzes = 0;
  let totalDuration = 0;
  
  sections.forEach(section => {
    section.lessons?.forEach(lesson => {
      if (lesson.contentType === 'video') {
        totalVideos++;
        totalDuration += lesson.duration || 0;
      } else if (lesson.contentType === 'material') {
        totalMaterials++;
      } else if (lesson.contentType === 'quiz') {
        totalQuizzes++;
      }
    });
  });
  
  return {
    totalVideos,
    totalMaterials,
    totalQuizzes,
    totalLessons: totalVideos + totalMaterials + totalQuizzes,
    totalDuration: Math.round(totalDuration / 60) // Convert to minutes
  };
};

/**
 * Validate lesson data
 */
export const validateLesson = (lesson) => {
  const errors = [];
  
  if (!lesson.title || !lesson.title.trim()) {
    errors.push('Tiêu đề bài học không được để trống');
  }
  
  if (lesson.contentType === 'video') {
    if (!lesson.url && !lesson.muxPlaybackId) {
      errors.push('Video chưa được upload');
    }
  } else if (lesson.contentType === 'material') {
    if (!lesson.url) {
      errors.push('Tài liệu chưa được upload');
    }
  } else if (lesson.contentType === 'quiz') {
    if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
      errors.push('Quiz phải có ít nhất 1 câu hỏi');
    }
    lesson.quizQuestions?.forEach((q, idx) => {
      if (!q.question || !q.question.trim()) {
        errors.push(`Câu hỏi ${idx + 1} không được để trống`);
      }
      if (!q.answers || q.answers.length < 2) {
        errors.push(`Câu hỏi ${idx + 1} phải có ít nhất 2 đáp án`);
      }
      const hasCorrectAnswer = q.answers?.some(ans => ans.isCorrect);
      if (!hasCorrectAnswer) {
        errors.push(`Câu hỏi ${idx + 1} phải có ít nhất 1 đáp án đúng`);
      }
    });
  }
  
  return errors;
};

/**
 * Validate section data
 */
export const validateSection = (section) => {
  const errors = [];
  
  if (!section.title || !section.title.trim()) {
    errors.push('Tiêu đề chương không được để trống');
  }
  
  if (!section.lessons || section.lessons.length === 0) {
    errors.push('Chương phải có ít nhất 1 bài học');
  }
  
  return errors;
};
