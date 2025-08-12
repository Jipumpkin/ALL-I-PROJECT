-- MySQL 8 기준. 이미 있으면 에러 안 나게 IF NOT EXISTS 사용(버전에 따라 미지원이면 분리해 처리).
ALTER TABLE animals
  ADD COLUMN IF NOT EXISTS ext_id VARCHAR(32),
  ADD UNIQUE KEY uq_animals_ext_id (ext_id);

ALTER TABLE shelters
  ADD COLUMN IF NOT EXISTS ext_id VARCHAR(32),
  ADD UNIQUE KEY uq_shelters_ext_id (ext_id);