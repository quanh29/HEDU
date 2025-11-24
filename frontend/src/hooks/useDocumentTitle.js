import { useEffect } from 'react';

/**
 * Custom hook to set document title dynamically
 * @param {string} title - The title to set
 * @param {boolean} includeAppName - Whether to append " - HEDU" to the title
 */
const useDocumentTitle = (title, includeAppName = true) => {
  useEffect(() => {
    if (title) {
      document.title = includeAppName ? `${title} - HEDU` : title;
    }

    // Cleanup: reset to default title when component unmounts
    return () => {
      document.title = 'HEDU - Nền tảng học trực tuyến';
    };
  }, [title, includeAppName]);
};

export default useDocumentTitle;