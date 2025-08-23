const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdHVzZXIyMDI1QGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJ0ZXN0dXNlcjIwMjUiLCJpYXQiOjE3NTU4NDM4MjIsImV4cCI6MTc1NTg0NDcyMiwiaXNzIjoiYWxsLWktcHJvamVjdCJ9.xbhcxkx1va246zhbmTIxT8kxq9kNajEeKy_z35-Z060';

const decoded = jwt.decode(token);
console.log('토큰 내용:', decoded);
console.log('userId:', decoded.userId);
console.log('현재 시간:', new Date().getTime() / 1000);
console.log('토큰 만료시간:', decoded.exp);
console.log('만료여부:', decoded.exp < (new Date().getTime() / 1000));