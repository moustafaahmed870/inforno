import { authService } from '../../container.js';

const MAX_DIMENSION   = 1600; // px, longest side
const JPEG_QUALITY     = 0.82;

/**
 * Uploads a File to Cloudinary via the /api/upload serverless function.
 * The image is resized/compressed client-side first — phone photos are
 * often 4-10MB, which can exceed the server's request body size limit
 * and fail the upload; this keeps every upload comfortably small.
 * @param {File} file
 * @returns {Promise<string>} the resulting Cloudinary secure_url
 */
export async function uploadImage(file) {
  const token = await authService.getIdToken();
  if (!token) throw new Error('لازم تسجل دخول الأول');

  const base64 = await compressImage(file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ image: base64, fileName: file.name }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `فشل رفع الصورة (${res.status})`);
  }
  const { url } = await res.json();
  return url;
}

/**
 * Resizes an image to a max dimension and re-encodes it as compressed JPEG,
 * returning a data URL ready to send as JSON. Falls back to a plain base64
 * read if canvas processing fails for any reason (e.g. unsupported format).
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      } catch {
        fileToBase64(file).then(resolve).catch(reject);
      }
    };
    img.onerror = () => fileToBase64(file).then(resolve).catch(reject);
    img.src = objectUrl;
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('فشلت قراءة الملف'));
    reader.readAsDataURL(file);
  });
}
