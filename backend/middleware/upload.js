const multer = require('multer')

// store files in memory temporarily before sending to cloudinary
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  // only allow image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per image
    files: 5                    // max 5 images
  }
})

module.exports = upload