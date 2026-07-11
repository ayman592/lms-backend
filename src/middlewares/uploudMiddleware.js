import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, "uploads/videos/");
    } else if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/images/");
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// أنواع الصور

const fileFilter = (req, file, cb) => {
  const isVideoAndImage =
    file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/");
  if (isVideoAndImage) {
    cb(null, true);
  } else {
    cb(new Error("Only video and image files are allowed!"), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB
  },
  fileFilter,
});
