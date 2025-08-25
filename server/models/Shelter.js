const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Shelter = sequelize.define('Shelter', {
    shelter_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    shelter_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    contact_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // 외부 API용 필드
    ext_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: 'External API ID'
    }
  }, {
    tableName: 'shelters',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // 스키마에 updated_at이 없음
    
    // 인덱스 설정 (기존 DB에 인덱스가 있어 임시 주석)
    // indexes: [
    //   {
    //     fields: ['region']
    //   },
    //   {
    //     unique: true,
    //     fields: ['ext_id']
    //   }
    // ]
  });

  // 관계 설정
  Shelter.associate = (models) => {
    // Shelter -> Animals (1:N)
    Shelter.hasMany(models.Animal, {
      foreignKey: 'shelter_id',
      as: 'animals',
      onDelete: 'SET NULL'
    });
  };

  // 클래스 메소드들

  /**
   * 모든 보호소 조회
   */
  Shelter.findAllShelters = async function() {
    return await this.findAll({
      order: [['shelter_name', 'ASC']]
    });
  };

  /**
   * 지역별 보호소 조회
   */
  Shelter.findByRegion = async function(region) {
    return await this.findAll({
      where: { region },
      order: [['shelter_name', 'ASC']]
    });
  };

  /**
   * 보호소와 동물 정보 함께 조회
   */
  Shelter.findByIdWithDetails = async function(shelterId) {
    return await this.findByPk(shelterId, {
      include: [{
        model: this.sequelize.models.Animal,
        as: 'animals',
        where: { status: 'available' },
        required: false
      }]
    });
  };

  /**
   * 외부 ID로 보호소 조회 (API 동기화용)
   */
  Shelter.findByExtId = async function(extId) {
    return await this.findOne({
      where: { ext_id: extId }
    });
  };

  /**
   * 보호소 생성 또는 업데이트 (API 동기화용)
   */
  Shelter.upsertByExtId = async function(shelterData) {
    const [shelter, created] = await this.findOrCreate({
      where: { ext_id: shelterData.ext_id },
      defaults: shelterData
    });

    if (!created) {
      // 이미 존재하는 경우 업데이트
      await shelter.update(shelterData);
    }

    return { shelter, created };
  };

  /**
   * 보호소별 동물 통계
   */
  Shelter.getAnimalStatistics = async function() {
    return await this.findAll({
      attributes: [
        'shelter_id',
        'shelter_name',
        'region',
        [this.sequelize.fn('COUNT', this.sequelize.col('animals.animal_id')), 'animalCount']
      ],
      include: [{
        model: this.sequelize.models.Animal,
        as: 'animals',
        attributes: [],
        where: { status: 'available' },
        required: false
      }],
      group: ['shelter_id'],
      order: [[this.sequelize.literal('animalCount'), 'DESC']]
    });
  };

  return Shelter;
};