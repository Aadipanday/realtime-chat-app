import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary and safely remove the local temporary file
 * @param {string} localFilePath - Path of the file on local disk
 * @returns {object|null} Cloudinary upload response or null on failure
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "chat_app",
    });

    // File uploaded successfully, remove the local temporary file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    // Remove the locally saved temporary file if the upload failed
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

/**
 * Delete an asset from Cloudinary by public ID
 * @param {string} publicId - Cloudinary asset public ID
 * @returns {object|null}
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error("Cloudinary asset deletion failed:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
