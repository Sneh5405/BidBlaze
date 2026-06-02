// transform a cloudinary URL with optimization params
const optimizeImage = (url, options = {}) => {
  if (!url) return null

  const {
    width = 'auto',
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options

  // build transformation string
  const transforms = [
    `f_${format}`,      // auto format — webp for chrome, jpg for safari
    `q_${quality}`,     // auto quality — cloudinary picks best compression
    width !== 'auto' ? `w_${width}` : null,
    height ? `h_${height}` : null,
    width && height ? `c_${crop}` : null
  ].filter(Boolean).join(',')

  // insert transforms after /upload/
  return url.replace('/upload/', `/upload/${transforms}/`)
}

// preset sizes for different use cases
const imagePresets = {
  // auction card thumbnail — small, fast loading
  thumbnail: (url) => optimizeImage(url, {
    width: 400,
    height: 300,
    quality: 'auto',
    format: 'auto',
    crop: 'fill'
  }),

  // auction detail main image — larger, still optimized
  detail: (url) => optimizeImage(url, {
    width: 800,
    quality: 'auto',
    format: 'auto'
  }),

  // dashboard small preview
  preview: (url) => optimizeImage(url, {
    width: 100,
    height: 100,
    quality: 'auto',
    format: 'auto',
    crop: 'fill'
  }),

  // chat room thumbnail
  chat: (url) => optimizeImage(url, {
    width: 60,
    height: 60,
    quality: 'auto',
    format: 'auto',
    crop: 'fill'
  })
}

module.exports = { optimizeImage, imagePresets }