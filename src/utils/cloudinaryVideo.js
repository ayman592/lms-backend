import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { stat } from "fs/promises";

import { sendProgress } from "./uploadProgress.js";

export const uploadVideoToCloudinary = async (filePath, uploadId) => {
  try {
    // ==========================================
    // GET FILE SIZE
    // ==========================================

    const fileStats = await stat(filePath);

    const totalBytes = fileStats.size;

    let uploadedBytes = 0;
    let lastProgress = -1;

    // ==========================================
    // CLOUDINARY UPLOAD
    // ==========================================

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "lms/videos",
        },

        (error, result) => {
          if (error) {
            console.error("Cloudinary error:", error);
            reject(error);
            return;
          }

          resolve(result);
        },
      );

      // ==========================================
      // FILE STREAM
      // ==========================================

      const fileStream = fs.createReadStream(filePath);

      // ==========================================
      // TRACK PROGRESS
      // ==========================================

      fileStream.on("data", (chunk) => {
        uploadedBytes += chunk.length;

        const progress = Math.min(
          99,
          Math.round((uploadedBytes / totalBytes) * 100),
        );

        // Don't spam SSE with same percentage
        if (progress !== lastProgress) {
          lastProgress = progress;

          sendProgress(uploadId, {
            stage: "cloudinary",
            progress,
            message: `Uploading video to Cloudinary... ${progress}%`,
          });
        }
      });

      // ==========================================
      // FILE ERROR
      // ==========================================

      fileStream.on("error", (error) => {
        console.error("File stream error:", error);

        reject(error);
      });

      // ==========================================
      // START UPLOAD
      // ==========================================

      fileStream.pipe(uploadStream);
    });

    // ==========================================
    // CLOUDINARY REALLY FINISHED
    // ==========================================

    sendProgress(uploadId, {
      stage: "cloudinary",
      progress: 100,
      message: "Video uploaded to Cloudinary successfully.",
    });

    return result;
  } catch (error) {
    console.error("Cloudinary video upload error:", error?.message || error);

    sendProgress(uploadId, {
      stage: "error",
      progress: 0,
      message: error?.message || "Cloudinary upload failed.",
    });

    throw error;
  }
};

// ==========================================
// IMAGE UPLOAD
// ==========================================

export const uploadImageToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
      folder: "lms/image",
    });

    return result;
  } catch (error) {
    console.error("Cloudinary image upload error:", error?.message || error);

    throw error;
  }
};
