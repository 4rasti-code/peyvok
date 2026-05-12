/**
 * Compresses and resizes an image before upload to save bandwidth and storage.
 * @param {File} file - The original image file from the input.
 * @param {Object} options - Compression options.
 * @returns {Promise<Blob>} - The compressed image as a Blob.
 */
export const compressImage = async (file, { maxWidth = 256, maxHeight = 256, quality = 0.7 } = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while resizing
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob (JPEG for best compression)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas to Blob conversion failed"));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Crops and compresses an image based on user manipulation.
 */
export const getCroppedImage = async (imageSrc, crop, zoom, { size = 256, quality = 0.8 } = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Fill with black background in case of transparent images
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, size, size);

      // Calculate how to draw the image onto the canvas based on drag (crop) and scale (zoom)
      // Note: 'crop' contains x and y in pixels relative to the center of the viewport
      // 'zoom' is the scale factor
      
      const drawWidth = img.width * zoom;
      const drawHeight = img.height * zoom;
      
      // Calculate drawing coordinates to center the image and then apply the user's drag offset
      const x = (size / 2) - (drawWidth / 2) + crop.x;
      const y = (size / 2) - (drawHeight / 2) + crop.y;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to crop image"));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Creates an image element from a URL.
 */
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Extracts a cropped image blob using pixel coordinates from react-easy-crop.
 */
export const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Set fixed output size for profile optimization
  const targetSize = 256;
  canvas.width = targetSize;
  canvas.height = targetSize;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.8);
  });
};
