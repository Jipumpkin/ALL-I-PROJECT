-- Add missing columns to user_images table to match the Sequelize model

USE alliproject;

ALTER TABLE user_images 
ADD COLUMN image_data LONGTEXT COMMENT 'Base64 encoded image data',
ADD COLUMN filename VARCHAR(255),
ADD COLUMN mime_type VARCHAR(100) COMMENT 'image/jpeg, image/png, etc.',
ADD COLUMN file_size INT COMMENT 'File size in bytes',
ADD COLUMN storage_type ENUM('url', 'base64', 'file') DEFAULT 'url' COMMENT 'Storage method used';

-- Show the updated table structure
DESCRIBE user_images;