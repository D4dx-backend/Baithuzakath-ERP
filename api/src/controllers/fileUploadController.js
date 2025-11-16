const fileUploadService = require('../services/fileUploadService');
const ResponseHelper = require('../utils/responseHelper');

class FileUploadController {
  /**
   * Upload a single file
   * POST /api/upload/single
   */
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return ResponseHelper.error(res, 'No file provided', 400);
      }

      const folder = req.body.folder || 'uploads';
      const result = await fileUploadService.uploadFile(req.file, folder);

      return ResponseHelper.success(res, {
        message: 'File uploaded successfully',
        file: result
      });
    } catch (error) {
      console.error('❌ Upload Single File Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to upload file', 500);
    }
  }

  /**
   * Upload multiple files
   * POST /api/upload/multiple
   */
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return ResponseHelper.error(res, 'No files provided', 400);
      }

      const folder = req.body.folder || 'uploads';
      const result = await fileUploadService.uploadMultipleFiles(req.files, folder);

      return ResponseHelper.success(res, {
        message: `${result.count} file(s) uploaded successfully`,
        ...result
      });
    } catch (error) {
      console.error('❌ Upload Multiple Files Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to upload files', 500);
    }
  }

  /**
   * Upload form files (for form builder)
   * POST /api/upload/form
   */
  async uploadFormFiles(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return ResponseHelper.error(res, 'No files provided', 400);
      }

      const { formId, fieldName } = req.body;
      
      if (!formId) {
        return ResponseHelper.error(res, 'Form ID is required', 400);
      }

      // Upload to forms folder with formId subfolder
      const folder = `forms/${formId}/${fieldName || 'attachments'}`;
      const result = await fileUploadService.uploadMultipleFiles(req.files, folder);

      return ResponseHelper.success(res, {
        message: `${result.count} file(s) uploaded successfully`,
        formId,
        fieldName,
        ...result
      });
    } catch (error) {
      console.error('❌ Upload Form Files Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to upload form files', 500);
    }
  }

  /**
   * Delete a file
   * DELETE /api/upload/:fileKey
   */
  async deleteFile(req, res) {
    try {
      const fileKey = decodeURIComponent(req.params.fileKey);
      
      if (!fileKey) {
        return ResponseHelper.error(res, 'File key is required', 400);
      }

      const result = await fileUploadService.deleteFile(fileKey);

      return ResponseHelper.success(res, {
        message: 'File deleted successfully',
        ...result
      });
    } catch (error) {
      console.error('❌ Delete File Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to delete file', 500);
    }
  }

  /**
   * Delete multiple files
   * POST /api/upload/delete-multiple
   */
  async deleteMultiple(req, res) {
    try {
      const { fileKeys } = req.body;

      if (!fileKeys || !Array.isArray(fileKeys) || fileKeys.length === 0) {
        return ResponseHelper.error(res, 'File keys array is required', 400);
      }

      const result = await fileUploadService.deleteMultipleFiles(fileKeys);

      return ResponseHelper.success(res, {
        message: 'Files deleted successfully',
        ...result
      });
    } catch (error) {
      console.error('❌ Delete Multiple Files Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to delete files', 500);
    }
  }

  /**
   * Get file metadata
   * GET /api/upload/metadata/:fileKey
   */
  async getMetadata(req, res) {
    try {
      const fileKey = decodeURIComponent(req.params.fileKey);
      
      if (!fileKey) {
        return ResponseHelper.error(res, 'File key is required', 400);
      }

      const result = await fileUploadService.getFileMetadata(fileKey);

      return ResponseHelper.success(res, result);
    } catch (error) {
      console.error('❌ Get File Metadata Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to get file metadata', 500);
    }
  }

  /**
   * List files in a folder
   * GET /api/upload/list
   */
  async listFiles(req, res) {
    try {
      const { folder = '', maxKeys = 1000 } = req.query;

      const result = await fileUploadService.listFiles(folder, parseInt(maxKeys));

      return ResponseHelper.success(res, result);
    } catch (error) {
      console.error('❌ List Files Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to list files', 500);
    }
  }

  /**
   * Generate presigned URL for temporary access
   * POST /api/upload/presigned-url
   */
  async getPresignedUrl(req, res) {
    try {
      const { fileKey, expiresIn = 3600 } = req.body;

      if (!fileKey) {
        return ResponseHelper.error(res, 'File key is required', 400);
      }

      const result = await fileUploadService.getPresignedUrl(fileKey, parseInt(expiresIn));

      return ResponseHelper.success(res, result);
    } catch (error) {
      console.error('❌ Generate Presigned URL Error:', error);
      return ResponseHelper.error(res, error.message || 'Failed to generate presigned URL', 500);
    }
  }
}

module.exports = new FileUploadController();
