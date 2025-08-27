import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 로컬 스토리지에서 사용자 정보 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData, tokens) => {
    // 디버깅: AuthContext에서 받은 사용자 데이터 확인
    console.log('🔍 AuthContext.login 받은 사용자 데이터:', userData);
    console.log('📅 AuthContext created_at 정보:');
    console.log('  - Raw created_at:', userData?.created_at);
    console.log('  - Type of created_at:', typeof userData?.created_at);
    console.log('  - created_at toString():', userData?.created_at ? userData.created_at.toString() : 'null');
    console.log('  - JavaScript Date 변환:', userData?.created_at ? new Date(userData.created_at) : 'null');
    console.log('  - toLocaleDateString(ko-KR):', userData?.created_at ? new Date(userData.created_at).toLocaleDateString('ko-KR') : 'null');
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (tokens) {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;