import multer from "multer";

const storageVideos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/videos"); // Specify the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilterVideos = (req, file, cb) => {
  const isVideo = file.mimetype.startsWith("video/");
  if (isVideo) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed!"), false);
  }
};

export const uploadVideo = multer({
  storage: storageVideos,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB
  },
  fileFilter: fileFilterVideos,
});

const storageImage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/image"); // Specify the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const fileFilterImages = (req, file, cb) => {
  const isImage =
    file.mimetype.endsWith("jpeg") ||
    file.mimetype.endsWith("jpg") ||
    file.mimetype.endsWith("png") ||
    file.mimetype.endsWith("gif");
  if (isImage) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};
export const uploadImage = multer({
  storage: storageImage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
  },
  fileFilter: fileFilterImages,
});
