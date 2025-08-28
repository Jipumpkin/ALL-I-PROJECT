const { User } = require('./models');

async function checkUsers() {
  try {
    console.log('데이터베이스 사용자 확인 중...');
    
    const users = await User.findAll({
      attributes: ['user_id', 'username', 'email', 'created_at'],
      limit: 10
    });
    
    console.log(`총 ${users.length}명의 사용자 발견:`);
    users.forEach(user => {
      console.log(`- ID: ${user.user_id}, Username: ${user.username}, Email: ${user.email}`);
    });
    
    // testuser 확인
    const testUser = await User.findOne({
      where: { username: 'testuser' }
    });
    
    if (testUser) {
      console.log('\n✅ testuser 발견:', {
        id: testUser.user_id,
        username: testUser.username,
        email: testUser.email
      });
    } else {
      console.log('\n❌ testuser를 찾을 수 없습니다.');
      
      // 새로운 테스트 사용자 생성
      console.log('\n새로운 테스트 사용자 생성 중...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Test123!@#', 10);
      
      const newUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        nickname: 'Test User',
        created_at: new Date()
      });
      
      console.log('✅ 새로운 테스트 사용자 생성 완료:', {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkUsers();