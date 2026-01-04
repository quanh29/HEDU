import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { 
  Layers, 
  Plus, 
  Search, 
  Edit2,
  Trash2,
  Tag,
  Grid,
  List,
  X,
  AlertTriangle,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';
import styles from './CategoryManagement.module.css';

const CategoryManagement = () => {
  const { getToken } = useAuth();
  const [headings, setHeadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('headings'); // 'headings' or 'categories'
  const [showHeadingModal, setShowHeadingModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingHeading, setEditingHeading] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedHeading, setSelectedHeading] = useState(null);
  const [statistics, setStatistics] = useState({
    totalHeadings: 0,
    totalCategories: 0,
    totalMappings: 0
  });
  
  const [headingForm, setHeadingForm] = useState({
    title: '',
    sub_title: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    title: ''
  });

  const [assignForm, setAssignForm] = useState({
    headingId: '',
    categoryId: ''
  });

  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  // Fetch headings with categories
  const fetchHeadings = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`${baseURL}/api/admin/categories/headings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setHeadings(response.data);
      
      // Fetch all categories for the assign dropdown
      await fetchAllCategories();
    } catch (error) {
      console.error('Error fetching headings:', error);
      alert('Failed to fetch headings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch all categories with pagination
  const [allCategories, setAllCategories] = useState([]);
  const fetchAllCategories = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${baseURL}/api/admin/categories`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          limit: 1000 // Fetch all categories
        }
      });
      
      if (response.data.success) {
        setAllCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching all categories:', error);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${baseURL}/api/admin/categories/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchHeadings();
    fetchStatistics();
  }, []);

  // Create heading
  const handleCreateHeading = async () => {
    if (!headingForm.title || !headingForm.sub_title) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.post(
        `${baseURL}/api/admin/categories/headings`,
        headingForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Heading đã được tạo thành công');
        setShowHeadingModal(false);
        resetHeadingForm();
        fetchHeadings();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error creating heading:', error);
      alert('Tạo heading thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Update heading
  const handleUpdateHeading = async () => {
    if (!headingForm.title || !headingForm.sub_title) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.put(
        `${baseURL}/api/admin/categories/headings/${editingHeading.heading_id}`,
        {
          title: headingForm.title,
          sub_title: headingForm.sub_title
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Heading đã được cập nhật thành công');
        setShowHeadingModal(false);
        setEditingHeading(null);
        resetHeadingForm();
        fetchHeadings();
      }
    } catch (error) {
      console.error('Error updating heading:', error);
      alert('Cập nhật heading thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete heading
  const handleDeleteHeading = async (headingId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa heading này? Tất cả categories liên kết sẽ bị xóa.')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.delete(
        `${baseURL}/api/admin/categories/headings/${headingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Heading đã được xóa thành công');
        fetchHeadings();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error deleting heading:', error);
      alert('Xóa heading thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Create category
  const handleCreateCategory = async () => {
    if (!categoryForm.title) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.post(
        `${baseURL}/api/admin/categories`,
        categoryForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Category đã được tạo thành công');
        setShowCategoryModal(false);
        resetCategoryForm();
        fetchHeadings();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Tạo category thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!categoryForm.title) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.put(
        `${baseURL}/api/admin/categories/${editingCategory.category_id}`,
        { title: categoryForm.title },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Category đã được cập nhật thành công');
        setShowCategoryModal(false);
        setEditingCategory(null);
        resetCategoryForm();
        fetchHeadings();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Cập nhật category thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa category này?')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.delete(
        `${baseURL}/api/admin/categories/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Category đã được xóa thành công');
        fetchHeadings();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Xóa category thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Assign category to heading
  const handleAssignCategory = async () => {
    if (!assignForm.headingId || !assignForm.categoryId) {
      alert('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.post(
        `${baseURL}/api/admin/categories/assign`,
        assignForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Category đã được gán cho heading thành công');
        setShowAssignModal(false);
        resetAssignForm();
        fetchHeadings();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error assigning category:', error);
      alert('Gán category thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  // Remove category from heading
  const handleRemoveCategory = async (headingId, categoryId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa category khỏi heading này?')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await axios.delete(
        `${baseURL}/api/admin/categories/${headingId}/${categoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Category đã được xóa khỏi heading');
        fetchHeadings();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error removing category:', error);
      alert('Xóa category thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditHeadingModal = (heading) => {
    setEditingHeading(heading);
    setHeadingForm({
      title: heading.title,
      sub_title: heading.sub_title
    });
    setShowHeadingModal(true);
  };

  const openEditCategoryModal = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      title: category.title
    });
    setShowCategoryModal(true);
  };

  const openAssignModal = (heading) => {
    setSelectedHeading(heading);
    setAssignForm({
      headingId: heading.heading_id,
      categoryId: ''
    });
    setAssignSearchTerm('');
    setShowAssignModal(true);
  };

  const resetHeadingForm = () => {
    setHeadingForm({
      title: '',
      sub_title: ''
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      title: ''
    });
  };

  const resetAssignForm = () => {
    setAssignForm({
      headingId: '',
      categoryId: ''
    });
  };

  // Get all unique categories
  const getAllCategories = () => {
    const categoriesMap = new Map();
    headings.forEach(heading => {
      heading.categories.forEach(cat => {
        if (!categoriesMap.has(cat.category_id)) {
          categoriesMap.set(cat.category_id, cat);
        }
      });
    });
    return Array.from(categoriesMap.values());
  };

  // Filter data based on search
  const filteredHeadings = headings.filter(heading =>
    heading.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    heading.sub_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = allCategories.filter(category =>
    category.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.categoryManagement}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Layers className={styles.headerIcon} />
          <h2>Quản lý Danh mục</h2>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.createBtn}
            onClick={() => setShowHeadingModal(true)}
          >
            <Plus size={18} />
            Tạo Heading
          </button>
          <button 
            className={styles.createBtn}
            onClick={() => setShowCategoryModal(true)}
          >
            <Plus size={18} />
            Tạo Category
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Grid size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{statistics.totalHeadings}</h3>
            <p>Tổng Headings</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Tag size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{statistics.totalCategories}</h3>
            <p>Tổng Categories</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <LinkIcon size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>{statistics.totalMappings}</h3>
            <p>Liên kết</p>
          </div>
        </div>
      </div>

      {/* View Toggle and Search */}
      <div className={styles.filters}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${activeView === 'headings' ? styles.active : ''}`}
            onClick={() => setActiveView('headings')}
          >
            <Grid size={18} />
            Headings
          </button>
          <button
            className={`${styles.viewBtn} ${activeView === 'categories' ? styles.active : ''}`}
            onClick={() => setActiveView('categories')}
          >
            <List size={18} />
            Categories
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={`Tìm kiếm ${activeView === 'headings' ? 'heading' : 'category'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Content */}
      <div className={styles.contentArea}>
        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : activeView === 'headings' ? (
          /* Headings View */
          filteredHeadings.length === 0 ? (
            <div className={styles.noData}>Không tìm thấy heading</div>
          ) : (
            <div className={styles.headingsGrid}>
              {filteredHeadings.map(heading => (
                <div key={heading.heading_id} className={styles.headingCard}>
                  <div className={styles.headingHeader}>
                    <div className={styles.headingTitle}>
                      <Grid size={20} />
                      <div>
                        <h3>{heading.title}</h3>
                        <p className={styles.subtitle}>{heading.sub_title}</p>
                      </div>
                    </div>
                    <div className={styles.headingActions}>
                      <button
                        className={styles.iconBtn}
                        onClick={() => openEditHeadingModal(heading)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={styles.iconBtn}
                        onClick={() => handleDeleteHeading(heading.heading_id)}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.categoriesList}>
                    <div className={styles.categoriesHeader}>
                      <span className={styles.categoriesLabel}>
                        <Tag size={14} />
                        Categories ({heading.categories.length})
                      </span>
                      <button
                        className={styles.addCategoryBtn}
                        onClick={() => openAssignModal(heading)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {heading.categories.length > 0 ? (
                      <div className={styles.categoryTags}>
                        {heading.categories.map(cat => (
                          <div key={cat.category_id} className={styles.categoryTag}>
                            <span>{cat.title}</span>
                            <button
                              className={styles.removeBtn}
                              onClick={() => handleRemoveCategory(heading.heading_id, cat.category_id)}
                              title="Xóa"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.noCategories}>Chưa có category nào</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Categories View */
          <div className={styles.tableContainer}>
            {filteredCategories.length === 0 ? (
              <div className={styles.noData}>Không tìm thấy category</div>
            ) : (
              <table className={styles.categoriesTable}>
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Số Headings</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map(category => {
                    const usageCount = headings.filter(h => 
                      h.categories.some(c => c.category_id === category.category_id)
                    ).length;
                    
                    return (
                      <tr key={category.category_id}>
                        <td>
                          <div className={styles.categoryName}>
                            <Tag size={16} />
                            <strong>{category.title}</strong>
                          </div>
                        </td>
                        <td>
                          <span className={styles.usageCount}>{usageCount}</span>
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              className={styles.editBtn}
                              onClick={() => openEditCategoryModal(category)}
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteCategory(category.category_id)}
                              title="Xóa"
                              disabled={usageCount > 0}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Heading Modal */}
      {showHeadingModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {editingHeading ? <Edit2 size={20} /> : <Plus size={20} />}
                {editingHeading ? 'Chỉnh sửa Heading' : 'Tạo Heading mới'}
              </h3>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowHeadingModal(false);
                  setEditingHeading(null);
                  resetHeadingForm();
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formGroup}>
                  <label>Tiêu đề *</label>
                  <input
                    type="text"
                    value={headingForm.title}
                    onChange={(e) => setHeadingForm({...headingForm, title: e.target.value})}
                    placeholder="VD: Programming"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phụ đề *</label>
                  <input
                    type="text"
                    value={headingForm.sub_title}
                    onChange={(e) => setHeadingForm({...headingForm, sub_title: e.target.value})}
                    placeholder="VD: Learn programming languages"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowHeadingModal(false);
                      setEditingHeading(null);
                      resetHeadingForm();
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button"
                    className={styles.saveBtn}
                    onClick={editingHeading ? handleUpdateHeading : handleCreateHeading}
                  >
                    {editingHeading ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingHeading ? 'Cập nhật' : 'Tạo heading'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Category Modal */}
      {showCategoryModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {editingCategory ? <Edit2 size={20} /> : <Plus size={20} />}
                {editingCategory ? 'Chỉnh sửa Category' : 'Tạo Category mới'}
              </h3>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formGroup}>
                  <label>Tiêu đề *</label>
                  <input
                    type="text"
                    value={categoryForm.title}
                    onChange={(e) => setCategoryForm({...categoryForm, title: e.target.value})}
                    placeholder="VD: Web Development"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowCategoryModal(false);
                      setEditingCategory(null);
                      resetCategoryForm();
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button"
                    className={styles.saveBtn}
                    onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  >
                    {editingCategory ? <Edit2 size={16} /> : <Plus size={16} />}
                    {editingCategory ? 'Cập nhật' : 'Tạo category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Category Modal */}
      {showAssignModal && selectedHeading && (
        <div className={styles.modal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                <LinkIcon size={20} />
                Gán Category cho {selectedHeading.title}
              </h3>
              <button 
                className={styles.closeBtn}
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedHeading(null);
                  resetAssignForm();
                  setAssignSearchTerm('');
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.formGroup}>
                  <label>Chọn Category *</label>
                  <div className={styles.selectWithSearch}>
                    <div className={styles.searchBox}>
                      <Search size={18} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Tìm kiếm category..."
                        value={assignSearchTerm}
                        onChange={(e) => setAssignSearchTerm(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>
                    <select
                      value={assignForm.categoryId}
                      onChange={(e) => setAssignForm({...assignForm, categoryId: e.target.value})}
                      className={styles.formInput}
                      size="8"
                    >
                      <option value="">-- Chọn category --</option>
                      {allCategories
                        .filter(cat => !selectedHeading.categories.some(c => c.category_id === cat.category_id))
                        .filter(cat => cat.title.toLowerCase().includes(assignSearchTerm.toLowerCase()))
                        .map(cat => (
                          <option key={cat.category_id} value={cat.category_id}>
                            {cat.title}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedHeading(null);
                      resetAssignForm();
                    }}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleAssignCategory}
                  >
                    <LinkIcon size={16} />
                    Gán category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
