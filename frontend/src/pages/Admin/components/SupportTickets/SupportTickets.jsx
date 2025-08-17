import { useState, useEffect } from 'react';
import styles from './SupportTickets.module.css';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([
    {
      id: 1,
      ticketNumber: 'TK001',
      subject: 'Không thể truy cập khóa học đã mua',
      description: 'Tôi đã thanh toán cho khóa học React Advanced nhưng không thể truy cập. Vui lòng hỗ trợ.',
      userType: 'student',
      userName: 'Nguyễn Văn A',
      userEmail: 'student@email.com',
      priority: 'high',
      status: 'open',
      category: 'technical',
      createdDate: '2024-01-17T09:30:00',
      lastUpdate: '2024-01-17T09:30:00',
      assignedTo: null,
      responses: []
    },
    {
      id: 2,
      ticketNumber: 'TK002',
      subject: 'Yêu cầu hoàn tiền khóa học',
      description: 'Khóa học không đúng như mô tả, tôi muốn được hoàn tiền.',
      userType: 'student',
      userName: 'Trần Thị B',
      userEmail: 'student2@email.com',
      priority: 'medium',
      status: 'in_progress',
      category: 'billing',
      createdDate: '2024-01-16T14:20:00',
      lastUpdate: '2024-01-17T08:15:00',
      assignedTo: 'Lê Văn Support',
      responses: [
        {
          id: 1,
          author: 'Lê Văn Support',
          authorType: 'admin',
          content: 'Chúng tôi đã nhận được yêu cầu của bạn. Vui lòng cung cấp thêm thông tin về lý do không hài lòng.',
          timestamp: '2024-01-17T08:15:00'
        }
      ]
    },
    {
      id: 3,
      ticketNumber: 'TK003',
      subject: 'Cập nhật thông tin thanh toán',
      description: 'Tôi muốn cập nhật thông tin thanh toán cho các khóa học tiếp theo.',
      userType: 'instructor',
      userName: 'Phạm Văn C',
      userEmail: 'instructor@email.com',
      priority: 'low',
      status: 'resolved',
      category: 'account',
      createdDate: '2024-01-15T16:45:00',
      lastUpdate: '2024-01-16T10:30:00',
      assignedTo: 'Lê Văn Support',
      responses: [
        {
          id: 1,
          author: 'Lê Văn Support',
          authorType: 'admin',
          content: 'Đã hướng dẫn cập nhật thông tin thanh toán qua email.',
          timestamp: '2024-01-16T10:30:00'
        }
      ]
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const priorities = {
    low: { label: 'Thấp', className: 'low' },
    medium: { label: 'Trung bình', className: 'medium' },
    high: { label: 'Cao', className: 'high' },
    urgent: { label: 'Khẩn cấp', className: 'urgent' }
  };

  const statuses = {
    open: { label: 'Mở', className: 'open' },
    in_progress: { label: 'Đang xử lý', className: 'inProgress' },
    waiting_customer: { label: 'Chờ khách hàng', className: 'waiting' },
    resolved: { label: 'Đã giải quyết', className: 'resolved' },
    closed: { label: 'Đã đóng', className: 'closed' }
  };

  const categories = {
    technical: 'Kỹ thuật',
    billing: 'Thanh toán',
    account: 'Tài khoản',
    course: 'Khóa học',
    other: 'Khác'
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: newStatus, lastUpdate: new Date().toISOString() }
          : ticket
      )
    );
  };

  const handleAssignTicket = (ticketId, assignee) => {
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, assignedTo: assignee, lastUpdate: new Date().toISOString() }
          : ticket
      )
    );
  };

  const handleAddResponse = (ticketId) => {
    if (!newResponse.trim()) {
      alert('Vui lòng nhập nội dung phản hồi!');
      return;
    }

    const response = {
      id: Date.now(),
      author: 'Admin User',
      authorType: 'admin',
      content: newResponse,
      timestamp: new Date().toISOString()
    };

    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId
          ? {
            ...ticket,
            responses: [...ticket.responses, response],
            lastUpdate: new Date().toISOString(),
            status: ticket.status === 'open' ? 'in_progress' : ticket.status
          }
          : ticket
      )
    );

    setNewResponse('');
  };

  const getPriorityBadge = (priority) => {
    const config = priorities[priority];
    return <span className={`${styles.priorityBadge} ${styles[config.className]}`}>{config.label}</span>;
  };

  const getStatusBadge = (status) => {
    const config = statuses[status];
    return <span className={`${styles.statusBadge} ${styles[config.className]}`}>{config.label}</span>;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ngày trước`;
  };

  return (
    <div className={styles.supportTickets}>
      <div className={styles.header}>
        <h2>Hỗ Trợ Khách Hàng</h2>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{tickets.filter(t => t.status === 'open').length}</span>
            <span>Mới</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{tickets.filter(t => t.status === 'in_progress').length}</span>
            <span>Đang xử lý</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length}</span>
            <span>Ưu tiên cao</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm kiếm ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(statuses).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả mức độ</option>
            {Object.entries(priorities).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả danh mục</option>
            {Object.entries(categories).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className={styles.ticketsList}>
        {filteredTickets.map(ticket => (
          <div 
            key={ticket.id} 
            className={`${styles.ticketCard} ${styles[ticket.priority]}`}
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className={styles.ticketHeader}>
              <div className={styles.ticketInfo}>
                <h3>{ticket.subject}</h3>
                <div className={styles.ticketMeta}>
                  <span className={styles.ticketNumber}>#{ticket.ticketNumber}</span>
                  <span className={styles.userInfo}>
                    {ticket.userType === 'student' ? '👨‍🎓' : '👨‍🏫'} {ticket.userName}
                  </span>
                  <span className={styles.category}>{categories[ticket.category]}</span>
                </div>
              </div>
              <div className={styles.ticketBadges}>
                {getPriorityBadge(ticket.priority)}
                {getStatusBadge(ticket.status)}
              </div>
            </div>

            <p className={styles.ticketDescription}>
              {ticket.description.length > 150 
                ? `${ticket.description.substring(0, 150)}...` 
                : ticket.description
              }
            </p>

            <div className={styles.ticketFooter}>
              <div className={styles.ticketTime}>
                <span>Tạo: {formatTime(ticket.createdDate)}</span>
                <span>Cập nhật: {formatTime(ticket.lastUpdate)}</span>
              </div>
              <div className={styles.assignedInfo}>
                {ticket.assignedTo ? (
                  <span>Phụ trách: {ticket.assignedTo}</span>
                ) : (
                  <span className={styles.unassigned}>Chưa phân công</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>#{selectedTicket.ticketNumber} - {selectedTicket.subject}</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setSelectedTicket(null)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.ticketDetails}>
                <div className={styles.ticketMainInfo}>
                  <div className={styles.userCard}>
                    <div className={styles.userAvatar}>
                      {selectedTicket.userType === 'student' ? '👨‍🎓' : '👨‍🏫'}
                    </div>
                    <div>
                      <h4>{selectedTicket.userName}</h4>
                      <p>{selectedTicket.userEmail}</p>
                      <span className={styles.userType}>
                        {selectedTicket.userType === 'student' ? 'Học viên' : 'Giảng viên'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.ticketMetaDetails}>
                    <div className={styles.metaRow}>
                      <strong>Mức độ:</strong> {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <div className={styles.metaRow}>
                      <strong>Trạng thái:</strong> {getStatusBadge(selectedTicket.status)}
                    </div>
                    <div className={styles.metaRow}>
                      <strong>Danh mục:</strong> {categories[selectedTicket.category]}
                    </div>
                    <div className={styles.metaRow}>
                      <strong>Phụ trách:</strong> 
                      {selectedTicket.assignedTo ? (
                        <span>{selectedTicket.assignedTo}</span>
                      ) : (
                        <span className={styles.unassigned}>Chưa phân công</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.ticketContent}>
                  <h5>Nội dung:</h5>
                  <p>{selectedTicket.description}</p>
                </div>

                {/* Responses */}
                <div className={styles.responses}>
                  <h5>Lịch sử trao đổi:</h5>
                  {selectedTicket.responses.length > 0 ? (
                    <div className={styles.responsesList}>
                      {selectedTicket.responses.map(response => (
                        <div key={response.id} className={styles.responseItem}>
                          <div className={styles.responseHeader}>
                            <strong>{response.author}</strong>
                            <span className={styles.responseTime}>
                              {new Date(response.timestamp).toLocaleDateString('vi-VN')} {new Date(response.timestamp).toLocaleTimeString('vi-VN')}
                            </span>
                          </div>
                          <p>{response.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noResponses}>Chưa có phản hồi nào.</p>
                  )}
                </div>

                {/* Add Response */}
                <div className={styles.addResponse}>
                  <h5>Phản hồi:</h5>
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Nhập nội dung phản hồi..."
                    className={styles.responseTextarea}
                    rows={4}
                  />
                  
                  <div className={styles.ticketActions}>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.sendBtn}
                        onClick={() => handleAddResponse(selectedTicket.id)}
                      >
                        Gửi phản hồi
                      </button>
                    </div>
                    
                    <div className={styles.statusActions}>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                        className={styles.statusSelect}
                      >
                        {Object.entries(statuses).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>
                      
                      <select
                        value={selectedTicket.assignedTo || ''}
                        onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value)}
                        className={styles.assignSelect}
                      >
                        <option value="">Chưa phân công</option>
                        <option value="Lê Văn Support">Lê Văn Support</option>
                        <option value="Trần Thị Helper">Trần Thị Helper</option>
                        <option value="Nguyễn Văn Admin">Nguyễn Văn Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
