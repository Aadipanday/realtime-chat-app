import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp + random + sanitized original name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimePrefixes = ["image/", "audio/"];
  const isAllowed = allowedMimePrefixes.some((prefix) =>
    file.mimetype.startsWith(prefix)
  );

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type. Only safe images (jpg, png, webp) and audio files are allowed."
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
