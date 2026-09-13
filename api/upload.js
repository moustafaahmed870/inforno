/**
 * POST /api/upload
 * Body: { image: 'data:image/...;base64,...', fileName?: string }
 * Header: Authorization: Bearer <Firebase ID token>
 *
 * Verifies the caller is a signed-in admin (checked against the `admins`
 * Firestore collection), then uploads the image to Cloudinary and returns
 * its secure_url. Cloudinary + Firebase Admin secrets never reach the client.
 */
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getFirebaseAdmin() {
  if (getApps().length) return getApps()[0];
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  return initializeApp({ credential: cert(serviceAccount) });
}

const RATE_LIMIT_MAX_UPLOADS = 20;     // per window, per admin
const RATE_LIMIT_WINDOW_MS   = 10 * 60 * 1000; // 10 minutes

/**
 * Fixed-window rate limit backed by Firestore (survives across cold starts,
 * unlike an in-memory counter — serverless functions don't share memory).
 * Throws if the caller has exceeded the limit for the current window.
 */
async function enforceRateLimit(app, uid) {
  const ref = getFirestore(app).collection('rateLimits').doc(uid);
  const now = Date.now();

  await getFirestore(app).runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : null;

    const windowExpired = !data || (now - data.windowStart) > RATE_LIMIT_WINDOW_MS;
    if (windowExpired) {
      tx.set(ref, { windowStart: now, count: 1 });
      return;
    }
    if (data.count >= RATE_LIMIT_MAX_UPLOADS) {
      const secondsLeft = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - data.windowStart)) / 1000);
      const err = new Error(`تجاوزت الحد المسموح لرفع الصور، حاول تاني بعد ${secondsLeft} ثانية`);
      err.statusCode = 429;
      throw err;
    }
    tx.update(ref, { count: data.count + 1 });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const app = getFirebaseAdmin();

    // ── 1. Verify the caller is a signed-in admin ──────────────────────────
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'مفقود توكن الدخول' });

    const decoded = await getAuth(app).verifyIdToken(token);
    const adminDoc = await getFirestore(app).collection('admins').doc(decoded.uid).get();
    if (!adminDoc.exists) return res.status(403).json({ error: 'الحساب غير مصرح له' });

    // ── 2. Rate limit ────────────────────────────────────────────────────
    try {
      await enforceRateLimit(app, decoded.uid);
    } catch (err) {
      if (err.statusCode === 429) return res.status(429).json({ error: err.message });
      throw err;
    }

    // ── 3. Upload to Cloudinary ─────────────────────────────────────────────
    const { image } = req.body ?? {};
    if (!image) return res.status(400).json({ error: 'لا توجد صورة' });

    const result = await cloudinary.uploader.upload(image, {
      folder: 'inferno-pizza',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return res.status(200).json({ url: result.secure_url });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'فشل رفع الصورة، حاول تاني' });
  }
}
