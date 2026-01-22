const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');

const { getOptionalEnvVar } = require('../config/validateEnv');

class FileUploadService {
  constructor() {
    // Configure DigitalOcean Spaces (S3-compatible)
    // All values must come from environment variables - no fallbacks
    const spacesEndpointValue = getOptionalEnvVar('SPACES_ENDPOINT');
    const regionValue = getOptionalEnvVar('REGION');
    const bucketNameValue = getOptionalEnvVar('SPACES_BUCKET_NAME');

    if (!spacesEndpointValue || !process.env.SPACES_ACCESS_KEY_ID || !process.env.SPACES_SECRET_ACCESS_KEY || !bucketNameValue) {
      throw new Error('DigitalOcean Spaces configuration incomplete. Required: SPACES_ENDPOINT, SPACES_ACCESS_KEY_ID, SPACES_SECRET_ACCESS_KEY, SPACES_BUCKET_NAME');
    }

    this.spacesEndpoint = new AWS.Endpoint(spacesEndpointValue);
    
    this.s3 = new AWS.S3({
      endpoint: this.spacesEndpoint,
      accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
      secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
      region: regionValue || 'blr1'
    });

    this.bucketName = bucketNameValue;
  }

  /**
   * Upload a file to DigitalOcean Spaces
   * @param {Object} file - Multer file object
   * @param {String} folder - Folder path in the bucket (e.g., 'forms', 'documents')
   * @returns {Promise<Object>} Upload result with file URL
   */
  async uploadFile(file, folder = 'uploads') {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}-${sanitizedName}`;
      const fileKey = `${folder}/${fileName}`;

      // Read file buffer
      const fileContent = fs.readFileSync(file.path);

      // Upload parameters
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
        Body: fileContent,
        ACL: 'public-read', // Make file publicly accessible
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      };

      // Upload to Spaces
      const result = await this.s3.upload(params).promise();

      // Clean up local file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        success: true,
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        fileName: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('❌ File Upload Error:', error);
      
      // Clean up local file on error
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      throw error;
    }
  }

  /**
   * Upload multiple files
   * @param {Array} files - Array of multer file objects
   * @param {String} folder - Folder path in the bucket
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadMultipleFiles(files, folder = 'uploads') {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const uploadPromises = files.map(file => this.uploadFile(file, folder));
      const results = await Promise.all(uploadPromises);

      return {
        success: true,
        files: results,
        count: results.length
      };
    } catch (error) {
      console.error('❌ Multiple Files Upload Error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from DigitalOcean Spaces
   * @param {String} fileKey - The key/path of the file in the bucket
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(fileKey) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey
      };

      await this.s3.deleteObject(params).promise();

      return {
        success: true,
        message: 'File deleted successfully',
        key: fileKey
      };
    } catch (error) {
      console.error('❌ File Delete Error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple files
   * @param {Array} fileKeys - Array of file keys to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMultipleFiles(fileKeys) {
    try {
      if (!fileKeys || fileKeys.length === 0) {
        throw new Error('No file keys provided');
      }

      const objects = fileKeys.map(key => ({ Key: key }));

      const params = {
        Bucket: this.bucketName,
        Delete: {
          Objects: objects,
          Quiet: false
        }
      };

      const result = await this.s3.deleteObjects(params).promise();

      return {
        success: true,
        deleted: result.Deleted,
        errors: result.Errors
      };
    } catch (error) {
      console.error('❌ Multiple Files Delete Error:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param {String} fileKey - The key/path of the file in the bucket
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(fileKey) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey
      };

      const metadata = await this.s3.headObject(params).promise();

      return {
        success: true,
        metadata: {
          size: metadata.ContentLength,
          contentType: metadata.ContentType,
          lastModified: metadata.LastModified,
          etag: metadata.ETag,
          customMetadata: metadata.Metadata
        }
      };
    } catch (error) {
      console.error('❌ Get File Metadata Error:', error);
      throw error;
    }
  }

  /**
   * List files in a folder
   * @param {String} folder - Folder path to list
   * @param {Number} maxKeys - Maximum number of files to return
   * @returns {Promise<Object>} List of files
   */
  async listFiles(folder = '', maxKeys = 1000) {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: folder,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjectsV2(params).promise();

      const files = result.Contents.map(file => ({
        key: file.Key,
        size: file.Size,
        lastModified: file.LastModified,
        url: `https://${this.bucketName}.${this.spacesEndpoint.hostname}/${file.Key}`
      }));

      return {
        success: true,
        files,
        count: files.length,
        isTruncated: result.IsTruncated
      };
    } catch (error) {
      console.error('❌ List Files Error:', error);
      throw error;
    }
  }

  /**
   * Generate a presigned URL for temporary file access
   * @param {String} fileKey - The key/path of the file
   * @param {Number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {Promise<String>} Presigned URL
   */
  async getPresignedUrl(fileKey, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);

      return {
        success: true,
        url,
        expiresIn
      };
    } catch (error) {
      console.error('❌ Generate Presigned URL Error:', error);
      throw error;
    }
  }
}

module.exports = new FileUploadService();
