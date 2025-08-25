// Mock 동물 데이터 (데이터베이스 연결 실패시 사용)

const mockAnimals = [
    {
        animal_id: 1,
        species: '믹스견',
        age: 2021,
        gender: 'male',
        region: '서울특별시',
        image_url: '/images/hoochoo1.jpeg',
        shelter_id: 1,
        rescued_at: '2023-01-15',
        status: 'available'
    },
    {
        animal_id: 2,
        species: '시바견',
        age: 2020,
        gender: 'female',
        region: '경기도',
        image_url: '/images/poster1.jpg',
        shelter_id: 1,
        rescued_at: '2023-02-20',
        status: 'available'
    },
    {
        animal_id: 3,
        species: '고양이',
        age: 2022,
        gender: 'male',
        region: '부산광역시',
        image_url: '/images/poster2.jpg',
        shelter_id: 2,
        rescued_at: '2023-03-10',
        status: 'available'
    },
    {
        animal_id: 4,
        species: '페르시안고양이',
        age: 2021,
        gender: 'female',
        region: '인천광역시',
        image_url: '/images/poster4.jpg',
        shelter_id: 2,
        rescued_at: '2023-04-05',
        status: 'available'
    },
    {
        animal_id: 5,
        species: '골든리트리버',
        age: 2019,
        gender: 'male',
        region: '대구광역시',
        image_url: '/images/poster5.jpg',
        shelter_id: 3,
        rescued_at: '2023-05-12',
        status: 'available'
    },
    {
        animal_id: 6,
        species: '토끼',
        age: 2023,
        gender: 'unknown',
        region: '광주광역시',
        image_url: '/images/poster6.jpg',
        shelter_id: 3,
        rescued_at: '2023-06-18',
        status: 'available'
    }
];

const mockShelters = [
    {
        shelter_id: 1,
        shelter_name: '서울시 동물보호센터',
        address: '서울특별시 중구',
        contact_number: '02-123-4567'
    },
    {
        shelter_id: 2,
        shelter_name: '경기도 동물보호센터',
        address: '경기도 수원시',
        contact_number: '031-123-4567'
    },
    {
        shelter_id: 3,
        shelter_name: '부산시 동물보호센터',
        address: '부산광역시 해운대구',
        contact_number: '051-123-4567'
    }
];

// 필터링 함수들
const filterAnimals = (animals, filter, shelter_id, page = 1, limit = 12) => {
    let filtered = [...animals];

    // 카테고리 필터
    if (filter && filter !== 'all') {
        if (filter === 'dog') {
            filtered = filtered.filter(animal => animal.species.includes('견') || animal.species.toLowerCase().includes('dog'));
        } else if (filter === 'cat') {
            filtered = filtered.filter(animal => animal.species.includes('고양이') || animal.species.toLowerCase().includes('cat'));
        } else if (filter === 'other') {
            filtered = filtered.filter(animal => 
                !animal.species.includes('견') && 
                !animal.species.includes('고양이') && 
                !animal.species.toLowerCase().includes('dog') && 
                !animal.species.toLowerCase().includes('cat')
            );
        }
    }

    // 보호소 필터
    if (shelter_id && shelter_id !== 'all') {
        filtered = filtered.filter(animal => animal.shelter_id === parseInt(shelter_id));
    }

    // 페이지네이션
    const totalAnimals = filtered.length;
    const totalPages = Math.ceil(totalAnimals / limit);
    const offset = (page - 1) * limit;
    const paginatedAnimals = filtered.slice(offset, offset + limit);

    return {
        animals: paginatedAnimals,
        totalPages,
        totalAnimals
    };
};

const getAnimalById = (id) => {
    const animal = mockAnimals.find(a => a.animal_id === parseInt(id));
    if (!animal) return null;

    // 보호소 정보 추가
    const shelter = mockShelters.find(s => s.shelter_id === animal.shelter_id);
    return {
        ...animal,
        shelter_name: shelter?.shelter_name || '알 수 없음',
        shelter_address: shelter?.address || '주소 없음',
        shelter_contact_number: shelter?.contact_number || '연락처 없음'
    };
};

const getOldestAnimals = () => {
    const sorted = [...mockAnimals].sort((a, b) => new Date(a.rescued_at) - new Date(b.rescued_at));
    return sorted.slice(0, 12);
};

module.exports = {
    mockAnimals,
    mockShelters,
    filterAnimals,
    getAnimalById,
    getOldestAnimals
};