const path = require('path');
const fs = require('fs').promises;

class ImageController {
  // 이미지 업로드 처리
  static async uploadUserImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '업로드할 이미지가 없습니다.'
        });
      }

      // 업로드된 파일 정보 처리
      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/user-images/${file.filename}`
      }));

      res.status(200).json({
        success: true,
        message: '이미지가 성공적으로 업로드되었습니다.',
        data: {
          files: uploadedFiles
        }
      });

    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      res.status(500).json({
        success: false,
        message: '이미지 업로드 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  // 업로드된 이미지 삭제
  static async deleteUserImage(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../uploads/user-images', filename);

      // 파일 존재 확인
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: '파일을 찾을 수 없습니다.'
        });
      }

      // 파일 삭제
      await fs.unlink(filePath);

      res.status(200).json({
        success: true,
        message: '이미지가 삭제되었습니다.'
      });

    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      res.status(500).json({
        success: false,
        message: '이미지 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }
}

module.exports = ImageController;