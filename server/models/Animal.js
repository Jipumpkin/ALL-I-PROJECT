const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Animal = sequelize.define('Animal', {
    animal_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    species: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'unknown'),
      defaultValue: 'unknown'
    },
    age: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    image_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shelter_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'shelters',
        key: 'shelter_id'
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'adopted', 'pending'),
      defaultValue: 'available'
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    rescued_at: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    // 외부 API용 필드들 (스키마에는 없지만 서비스에서 사용)
    ext_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'External API ID'
    },
    colorCd: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Color code from external API'
    },
    specialMark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Special marks from external API'
    }
  }, {
    tableName: 'animals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // 인덱스 설정 (기존 DB에 인덱스가 있어 임시 주석)
    // indexes: [
    //   {
    //     fields: ['shelter_id']
    //   },
    //   {
    //     fields: ['status']
    //   },
    //   {
    //     fields: ['region']
    //   },
    //   {
    //     fields: ['rescued_at']
    //   },
    //   {
    //     unique: true,
    //     fields: ['ext_id']
    //   }
    // ]
  });

  // 관계 설정
  Animal.associate = (models) => {
    // Animal -> Shelter (N:1)
    Animal.belongsTo(models.Shelter, {
      foreignKey: 'shelter_id',
      as: 'shelter',
      onDelete: 'SET NULL'
    });

    // Animal -> Prompts (1:N)
    Animal.hasMany(models.Prompt, {
      foreignKey: 'animal_id',
      as: 'prompts',
      onDelete: 'SET NULL'
    });
  };

  // 클래스 메소드들 (기존 Raw SQL 메소드를 Sequelize로 변환)

  /**
   * 가장 오래된 동물들 조회 (구조된지 가장 오래된)
   */
  Animal.findOldest = async function(limit = 3) {
    return await this.findAll({
      where: { status: 'available' },
      order: [['rescued_at', 'ASC']],
      limit: limit,
      include: [{
        model: this.sequelize.models.Shelter,
        as: 'shelter',
        attributes: ['shelter_name', 'region']
      }]
    });
  };

  /**
   * 리스트용 동물들 조회 (최신순)
   */
  Animal.findAllForList = async function(limit = 12) {
    return await this.findAll({
      attributes: ['animal_id', 'species', 'gender', 'age', 'image_url', 'region'],
      order: [['rescued_at', 'DESC']],
      limit: limit,
      include: [{
        model: this.sequelize.models.Shelter,
        as: 'shelter',
        attributes: ['shelter_name']
      }]
    });
  };

  /**
   * 랜덤 동물들 조회
   */
  Animal.findRandom = async function(limit = 6) {
    return await this.findAll({
      attributes: ['animal_id', 'species', 'gender', 'age', 'image_url', 'region'],
      order: this.sequelize.random(),
      limit: limit,
      include: [{
        model: this.sequelize.models.Shelter,
        as: 'shelter',
        attributes: ['shelter_name']
      }]
    });
  };

  /**
   * 페이지네이션된 동물 목록 조회
   */
  Animal.findAllPaginated = async function(page = 1, pageSize = 12, filters = {}) {
    const offset = (page - 1) * pageSize;
    const where = {};

    // 필터 적용
    if (filters.species) where.species = filters.species;
    if (filters.gender) where.gender = filters.gender;
    if (filters.region) where.region = filters.region;
    if (filters.status) where.status = filters.status;

    const { count, rows } = await this.findAndCountAll({
      where,
      order: [['rescued_at', 'DESC']],
      limit: pageSize,
      offset,
      include: [{
        model: this.sequelize.models.Shelter,
        as: 'shelter',
        attributes: ['shelter_name', 'region', 'contact_number']
      }]
    });

    return {
      animals: rows,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page
    };
  };

  /**
   * 상세 정보 포함 동물 조회
   */
  Animal.findByIdWithDetails = async function(animalId) {
    return await this.findByPk(animalId, {
      include: [{
        model: this.sequelize.models.Shelter,
        as: 'shelter',
        attributes: ['shelter_name', 'address', 'contact_number', 'email', 'region']
      }]
    });
  };

  /**
   * 외부 ID로 동물 조회 (API 동기화용)
   */
  Animal.findByExtId = async function(extId) {
    return await this.findOne({
      where: { ext_id: extId }
    });
  };

  /**
   * 동물 생성 또는 업데이트 (API 동기화용)
   */
  Animal.upsertByExtId = async function(animalData) {
    const [animal, created] = await this.findOrCreate({
      where: { ext_id: animalData.ext_id },
      defaults: animalData
    });

    if (!created) {
      // 이미 존재하는 경우 업데이트
      await animal.update(animalData);
    }

    return { animal, created };
  };

  /**
   * 통계 정보 조회
   */
  Animal.getStatistics = async function() {
    const totalCount = await this.count();
    const availableCount = await this.count({ where: { status: 'available' } });
    const adoptedCount = await this.count({ where: { status: 'adopted' } });

    const speciesStats = await this.findAll({
      attributes: [
        'species',
        [this.sequelize.fn('COUNT', this.sequelize.col('animal_id')), 'count']
      ],
      group: ['species'],
      order: [[this.sequelize.literal('count'), 'DESC']]
    });

    return {
      total: totalCount,
      available: availableCount,
      adopted: adoptedCount,
      pending: totalCount - availableCount - adoptedCount,
      speciesBreakdown: speciesStats
    };
  };

  return Animal;
};