const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT || 'blr1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
  secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
  region: process.env.REGION || 'blr1'
});

const bucketName = process.env.SPACES_BUCKET_NAME || 'baithuzakath';

/**
 * Upload file to DigitalOcean Spaces
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder path in bucket
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadToSpaces = async (file, folder = 'uploads', options = {}) => {
  try {
    if (!file) throw new Error('No file provided');

    let fileContent = file.buffer || fs.readFileSync(file.path);
    const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileContent,
      ACL: 'public-read',
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000'
    };

    const result = await s3.upload(params).promise();

    // Clean up local file if exists
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return {
      success: true,
      fileUrl: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      size: fileContent.length
    };
  } catch (error) {
    console.error('❌ S3 Upload Error:', error);
    throw error;
  }
};

/**
 * Delete file from DigitalOcean Spaces
 * @param {string} fileKey - File key in bucket
 * @returns {Promise<boolean>} Success status
 */
const deleteFromSpaces = async (fileKey) => {
  try {
    if (!fileKey) return false;
    await s3.deleteObject({ Bucket: bucketName, Key: fileKey }).promise();
    return true;
  } catch (error) {
    console.error('❌ S3 Delete Error:', error);
    throw error;
  }
};

/**
 * Extract file key from full URL
 * @param {string} fileUrl - Full file URL
 * @returns {string} File key
 */
const extractKeyFromUrl = (fileUrl) => {
  try {
    if (!fileUrl) return '';
    const url = new URL(fileUrl);
    return url.pathname.substring(1);
  } catch (error) {
    return fileUrl;
  }
};

module.exports = {
  uploadToSpaces,
  deleteFromSpaces,
  extractKeyFromUrl,
  s3
};
