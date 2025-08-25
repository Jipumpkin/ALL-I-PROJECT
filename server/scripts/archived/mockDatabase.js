const hashUtils = require('./hash');

// Mock 사용자 데이터베이스 (메모리 기반)
class MockDatabase {
    constructor() {
        this.users = [];
        this.userImages = []; // 사용자 이미지 저장
        this.nextId = 1;
        this.nextImageId = 1;
        this.initializeUsers();
    }

    async initializeUsers() {
        // 기본 테스트 사용자들 생성 (schema.sql 구조에 맞춤)
        const testUsers = [
            {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!@#',
                nickname: '테스트유저',
                gender: 'male',
                phone_number: '010-1234-5678'
            },
            {
                username: 'admin',
                email: 'admin@allipet.com', 
                password: 'Admin123!@#',
                nickname: '관리자',
                gender: 'female',
                phone_number: '010-9999-0000'
            },
            {
                username: 'demo',
                email: 'demo@allipet.com',
                password: 'Demo123!@#',
                nickname: '데모유저',
                gender: 'other',
                phone_number: '010-5555-1234'
            }
        ];

        // 비밀번호 해싱 후 저장
        for (const userData of testUsers) {
            const hashedPassword = await hashUtils.hashPassword(userData.password);
            this.users.push({
                user_id: this.nextId++,
                username: userData.username,
                email: userData.email,
                password_hash: hashedPassword,
                nickname: userData.nickname,
                gender: userData.gender,
                phone_number: userData.phone_number,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                last_login_at: null
            });
        }

        console.log(`📊 Mock Database initialized with ${this.users.length} test users:`);
        this.users.forEach(user => {
            console.log(`   - ${user.username} (${user.email}) [${user.gender}]`);
        });
    }

    // username 또는 email로 사용자 찾기 (프론트엔드 호환용)
    async findByUsernameOrEmail(identifier) {
        return this.users.find(user => 
            user.username === identifier || user.email === identifier
        );
    }

    // 이메일로 사용자 찾기
    async findByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    // 이메일 중복 체크
    async checkEmailExists(email) {
        return !!this.findByEmail(email);
    }

    // 사용자 생성
    async createUser(userData) {
        // 이메일 중복 체크
        if (await this.checkEmailExists(userData.email)) {
            throw new Error('이미 존재하는 이메일입니다.');
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const newUser = {
            user_id: this.nextId++,
            username: userData.username,
            email: userData.email,
            password_hash: userData.password_hash,
            nickname: userData.nickname || userData.username,
            gender: userData.gender || 'unknown',
            phone_number: userData.phone_number || null,
            created_at: now,
            updated_at: now,
            last_login_at: null
        };

        this.users.push(newUser);
        console.log(`👤 New user created: ${newUser.username} (${newUser.email})`);
        return newUser;
    }

    // 로그인 시간 업데이트
    async updateLastLogin(userId) {
        const user = this.users.find(u => u.user_id === userId);
        if (user) {
            user.last_login_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
            user.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }
        return user;
    }

    // 모든 사용자 조회
    async getAllUsers() {
        return this.users;
    }

    // 사용자 수 조회
    getUserCount() {
        return this.users.length;
    }

    // ID로 사용자 찾기
    async findById(id) {
        return this.users.find(user => user.user_id === parseInt(id));
    }

    // === 사용자 이미지 관련 기능 ===
    
    // 사용자 이미지 추가
    async addUserImage(userId, imageUrl) {
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const newImage = {
            image_id: this.nextImageId++,
            user_id: parseInt(userId),
            image_url: imageUrl,
            uploaded_at: now
        };
        this.userImages.push(newImage);
        console.log(`📷 New image added for user ${userId}: ${imageUrl}`);
        return newImage;
    }

    // 사용자 이미지 조회
    async getUserImages(userId) {
        return this.userImages
            .filter(image => image.user_id === parseInt(userId))
            .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)); // 최신순
    }

    // 사용자 이미지 삭제
    async deleteUserImage(imageId) {
        const index = this.userImages.findIndex(image => image.image_id === parseInt(imageId));
        if (index > -1) {
            const deletedImage = this.userImages.splice(index, 1)[0];
            console.log(`🗑️ Image deleted: ${deletedImage.image_url}`);
            return deletedImage;
        }
        return null;
    }
}

// 싱글톤 인스턴스
const mockDB = new MockDatabase();

module.exports = mockDB;