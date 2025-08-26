import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axios';
import styles from './AdminDashboard.module.css';

const AdminDashboard = ({ adminToken, onLogout }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [adoptionApplications, setAdoptionApplications] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStatistics();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'adoptions') {
      fetchAdoptionApplications();
    }
  }, [activeTab]);

  // 통계 데이터 조회
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/statistics', {
        headers: { 'Admin-Token': adminToken }
      });
      
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (err) {
      console.error('통계 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 목록 조회
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users', {
        headers: { 'Admin-Token': adminToken }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('사용자 목록 조회 실패:', err);
      if (err.response?.status === 403) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // 입양 신청 내역 조회
  const fetchAdoptionApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/adoption-applications', {
        headers: { 'Admin-Token': adminToken }
      });
      
      if (response.data.success) {
        setAdoptionApplications(response.data.applications);
      }
    } catch (err) {
      console.error('입양 신청 내역 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`정말로 사용자 "${username}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await axios.delete(`/api/admin/users/${userId}`, {
        headers: { 'Admin-Token': adminToken }
      });
      
      if (response.data.success) {
        alert('사용자가 삭제되었습니다.');
        fetchUsers();
      }
    } catch (err) {
      alert('사용자 삭제에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 사용자 복원
  const handleRestoreUser = async (userId, username) => {
    if (!window.confirm(`사용자 "${username}"을(를) 복원하시겠습니까?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await axios.post(`/api/admin/users/${userId}/restore`, {}, {
        headers: { 'Admin-Token': adminToken }
      });
      
      if (response.data.success) {
        alert('사용자가 복원되었습니다.');
        fetchUsers();
      }
    } catch (err) {
      alert('사용자 복원에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 사용자별 입양 신청 내역 조회
  const viewUserAdoptionApplications = (userId) => {
    setSelectedUser(userId);
    setActiveTab('adoptions');
  };

  // 로그아웃
  const handleLogout = () => {
    if (window.confirm('관리자 세션을 종료하시겠습니까?')) {
      onLogout();
    }
  };

  // 홈으로 이동
  const goToHome = () => {
    navigate('/');
  };

  // 검색 필터링
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = selectedUser 
    ? adoptionApplications.filter(app => app.user_id === selectedUser)
    : adoptionApplications;

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>🛡️ 관리자 대시보드</h1>
          <p>ALL-I-PROJECT 시스템 관리</p>
        </div>
        <div className={styles.headerRight}>
          <button onClick={goToHome} className={styles.homeButton}>
            🏠 홈으로
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            🚪 로그아웃
          </button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setSelectedUser(null);
            }}
          >
            📊 대시보드
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('users');
              setSelectedUser(null);
            }}
          >
            👥 회원 관리 ({users.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'adoptions' ? styles.active : ''}`}
            onClick={() => setActiveTab('adoptions')}
          >
            🐾 입양 신청 ({adoptionApplications.length})
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className={styles.content}>
        {/* 대시보드 개요 */}
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <h2>📈 시스템 통계</h2>
            {loading ? (
              <div className={styles.loading}>통계 로딩 중...</div>
            ) : statistics ? (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statContent}>
                    <h3>전체 회원</h3>
                    <p className={styles.statNumber}>{statistics.users?.total || 0}</p>
                    <span className={styles.statDetail}>
                      활성: {statistics.users?.active || 0} | 
                      삭제: {statistics.users?.deleted || 0}
                    </span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>🆕</div>
                  <div className={styles.statContent}>
                    <h3>최근 가입</h3>
                    <p className={styles.statNumber}>{statistics.users?.recentSignups || 0}</p>
                    <span className={styles.statDetail}>최근 7일</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>🐾</div>
                  <div className={styles.statContent}>
                    <h3>등록 동물</h3>
                    <p className={styles.statNumber}>{statistics.animals?.total || 0}</p>
                    <span className={styles.statDetail}>전체 동물</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📋</div>
                  <div className={styles.statContent}>
                    <h3>입양 신청</h3>
                    <p className={styles.statNumber}>{adoptionApplications.length}</p>
                    <span className={styles.statDetail}>총 신청 수</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.noData}>통계 데이터를 불러올 수 없습니다.</div>
            )}

            <div className={styles.quickActions}>
              <h3>빠른 작업</h3>
              <div className={styles.actionButtons}>
                <button
                  onClick={() => setActiveTab('users')}
                  className={styles.quickActionButton}
                >
                  👥 회원 관리
                </button>
                <button
                  onClick={() => setActiveTab('adoptions')}
                  className={styles.quickActionButton}
                >
                  🐾 입양 신청 관리
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 회원 관리 */}
        {activeTab === 'users' && (
          <div className={styles.userManagement}>
            <div className={styles.sectionHeader}>
              <h2>👥 회원 관리</h2>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="사용자 검색 (아이디, 이메일, 닉네임)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <button onClick={fetchUsers} className={styles.refreshButton}>
                  🔄 새로고침
                </button>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>아이디</th>
                    <th>이메일</th>
                    <th>닉네임</th>
                    <th>연락처</th>
                    <th>가입일</th>
                    <th>상태</th>
                    <th>입양신청</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className={styles.loading}>
                        로딩 중...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr key={user.user_id}>
                        <td>{user.user_id}</td>
                        <td>
                          <span className={styles.username}>{user.username}</span>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.nickname || '-'}</td>
                        <td>{user.phone_number || '-'}</td>
                        <td>{new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                        <td>
                          <span className={`${styles.status} ${user.deleted_at ? styles.deleted : styles.active}`}>
                            {user.deleted_at ? '삭제됨' : '활성'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => viewUserAdoptionApplications(user.user_id)}
                            className={styles.viewButton}
                          >
                            📋 조회
                          </button>
                        </td>
                        <td>
                          {actionLoading === user.user_id ? (
                            <span className={styles.actionLoading}>처리중...</span>
                          ) : user.deleted_at ? (
                            <button
                              onClick={() => handleRestoreUser(user.user_id, user.username)}
                              className={styles.restoreButton}
                            >
                              ♻️ 복원
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(user.user_id, user.username)}
                              className={styles.deleteButton}
                            >
                              🗑️ 삭제
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className={styles.noData}>
                        {searchTerm ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 입양 신청 관리 */}
        {activeTab === 'adoptions' && (
          <div className={styles.adoptionManagement}>
            <div className={styles.sectionHeader}>
              <h2>🐾 입양 신청 관리</h2>
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className={styles.clearFilterButton}
                >
                  ❌ 필터 해제
                </button>
              )}
            </div>

            {selectedUser && (
              <div className={styles.filterInfo}>
                <span>📌 사용자 ID {selectedUser}의 입양 신청 내역</span>
              </div>
            )}

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>신청 ID</th>
                    <th>사용자</th>
                    <th>동물 정보</th>
                    <th>신청일</th>
                    <th>상태</th>
                    <th>연락처</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className={styles.loading}>
                        로딩 중...
                      </td>
                    </tr>
                  ) : filteredApplications.length > 0 ? (
                    filteredApplications.map(app => (
                      <tr key={app.application_id}>
                        <td>{app.application_id}</td>
                        <td>
                          <div>
                            <span className={styles.username}>{app.username}</span>
                            <small>(ID: {app.user_id})</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{app.animal_name || '정보 없음'}</strong>
                            <small>(ID: {app.animal_id})</small>
                          </div>
                        </td>
                        <td>{new Date(app.created_at).toLocaleDateString('ko-KR')}</td>
                        <td>
                          <span className={`${styles.status} ${styles[app.status]}`}>
                            {app.status === 'pending' ? '📋 대기중' :
                             app.status === 'approved' ? '✅ 승인됨' :
                             app.status === 'rejected' ? '❌ 거절됨' : app.status}
                          </span>
                        </td>
                        <td>{app.contact || '-'}</td>
                        <td>
                          <button className={styles.detailButton}>
                            📄 상세보기
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className={styles.noData}>
                        {selectedUser 
                          ? '해당 사용자의 입양 신청 내역이 없습니다.' 
                          : '입양 신청 내역이 없습니다.'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;