import cloudinary from "../config/cloudinary.js";

export const uploadVideoToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      folder: "lms/videos",
    });
    return result;
  } catch (error) {
    return { error: "Failed to upload video to Cloudinary" };
  }
};
