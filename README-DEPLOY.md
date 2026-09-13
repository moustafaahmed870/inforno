# 🍕 Inferno Pizza — دليل التحويل لـ Full-stack (Firebase + Cloudinary + Vercel)

المشروع بقى شغال بالمعمارية دي:
- **الواجهة (Frontend)**: نفس الكود القديم (Vanilla JS، Clean Architecture) — بيتصل بـ Firestore مباشرة من المتصفح
- **الباك إند (Backend)**: Serverless Function واحدة بس على Vercel (`/api/upload.js`) — مسؤولة عن رفع الصور على Cloudinary بأمان
- **قاعدة البيانات**: Firebase Firestore
- **الصور**: Cloudinary
- **الاستضافة**: Vercel
- **تسجيل الدخول للداشبورد**: Firebase Authentication (إيميل + باسورد)

---

## 1) إعداد Firebase

### أ) إنشاء المشروع
1. روح [console.firebase.google.com](https://console.firebase.google.com) واعمل مشروع جديد
2. من **Project settings → General → Your apps**، ضيف تطبيق ويب (Web App)
3. هياخدك كود فيه object اسمه `firebaseConfig` — انسخه كامل

### ب) الصقه في المشروع
افتح `src/infrastructure/config/firebaseConfig.js` واستبدل القيم الوهمية بالقيم الحقيقية اللي نسختها.
> ملحوظة: القيم دي **مش سرية** — أمان Firebase بيعتمد على الـ Security Rules مش على إخفاء المفاتيح دي، فمفيش مشكلة إنها تتحط في الكود.

### ج) تفعيل Authentication
1. من القائمة الجانبية: **Build → Authentication → Get started**
2. فعّل **Email/Password** كطريقة دخول
3. من تبويب **Users**، اعمل مستخدم يدوي بإيميلك وباسورد (ده حساب الأدمن بتاعك)
4. انسخ الـ **User UID** بتاعه (هتحتاجه في الخطوة الجاية)

### د) تفعيل Firestore
1. **Build → Firestore Database → Create database** (اختار وضع Production)
2. من تبويب **Rules**، الصق محتوى ملف `firestore.rules` الموجود في المشروع، واعمل Publish
3. اعمل collection اسمها `admins` يدويًا، وضيف فيها **document** الـ ID بتاعه هو نفس الـ **UID** اللي نسخته من الخطوة السابقة (المحتوى مش مهم، أي حقل زي `{ email: "your@email.com" }`)
   - ده اللي بيحدد مين "أدمن" فعليًا — أي حد يعمل تسجيل دخول بس مش موجود ليه document هنا، مش هيقدر يفتح `/admin` أو `/kitchen`

### هـ) مفتاح الـ Admin SDK (للباك إند بس)
1. **Project settings → Service accounts → Generate new private key**
2. هينزلّك ملف JSON — هتحتاجه في خطوة Vercel تحت (خليه في مكان آمن، ده فعلاً سري ومتشاركوش مع حد)

---

## 2) إعداد Cloudinary
1. اعمل حساب على [cloudinary.com](https://cloudinary.com) (فيه باقة مجانية كفاية للبداية)
2. من الـ Dashboard الرئيسي هتلاقي: **Cloud Name**, **API Key**, **API Secret** — احتفظ بيهم

---

## 3) رفع المشروع على GitHub
```bash
git init
git add .
git commit -m "Inferno Pizza - full stack"
git remote add origin <رابط الريبو بتاعك>
git push -u origin main
```

---

## 4) النشر على Vercel
1. روح [vercel.com](https://vercel.com) → **Add New Project** → اختار الريبو
2. Vercel هيكتشف تلقائيًا إن فيه مجلد `/api` (Serverless Functions) وهيشغلها، والباقي هيتنشر كملفات ثابتة — مفيش إعدادات إضافية مطلوبة
3. قبل الـ Deploy، روح لـ **Environment Variables** وضيف:

| المتغير | القيمة |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | من Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | من Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | من Cloudinary Dashboard |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | محتوى ملف الـ JSON اللي نزلته من Firebase (الصقه كامل كسطر واحد) |

4. اضغط **Deploy** 🚀

---

## 5) بعد النشر — أول حاجة تعملها
1. افتح الموقع وروح لـ `yourdomain.com/#/login`
2. سجّل دخول بالإيميل/الباسورد اللي عملتهم في Firebase Authentication
3. هتوصل للداشبورد `#/admin` — روح تبويب **"المنتجات"** واضغط **"استيراد ٨ أصناف تجريبية"** عشان تملأ القائمة بسرعة، أو ابدأ ضيف أصنافك بنفسك
4. من تبويب **"محتوى الصفحة الرئيسية"** غيّر النصوص والصورة زي ما تحب

---

## ملاحظات مهمة
- **رابط المطبخ والإدارة**: `#/kitchen` و `#/admin` مش ظاهرين في القائمة العلوية للعميل، بس أي حد يعرف الرابط ومسجل دخول بحساب أدمن هيقدر يدخلهم — الحماية الحقيقية جايه من فحص `admins` collection، مش من إخفاء الرابط
- **حجم الصور**: فيه حد أقصى تقريبي 4 ميجا للصورة الواحدة (حد منصة Vercel نفسها) — لو صورك أكبر من كده، صغّرها قبل الرفع
- **الحماية من الاستخدام الزائد (Rate limiting)**: كل أدمن مسموحله بـ 20 عملية رفع صورة كل 10 دقايق (تقدر تغيّر الرقمين في `api/upload.js` — `RATE_LIMIT_MAX_UPLOADS` و`RATE_LIMIT_WINDOW_MS`). العداد بيتسجل في Firestore في collection اسمها `rateLimits`، ومحدش غير السيرفر يقدر يوصله (متأمّن في `firestore.rules`)
- **"الأكثر طلبًا"**: مش قسم منفصل — دلوقتي الصنف اللي بيتباع أكتر من غيره فعليًا بياخد شارة "🔥 الأكثر طلباً" تلقائيًا على كارته في صفحة القائمة (`#/menu`) بس، بناءً على عدد مرات بيعه الحقيقي في الطلبات. بتتغيّر لوحدها كل ما البيانات تتحدث، من غير أي تدخل يدوي
- **تكاليف**: Firebase وCloudinary وVercel كلهم عندهم باقات مجانية كافية جدًا لمطعم بيتزا صغير أو متوسط، ومش هتحتاج تدفع غير لو الحركة كبرت جدًا
- **التطوير المحلي**: تقدر تفتح `index.html` مباشرة أو بأي static server بسيط، بس دوال `/api/upload` مش هتشتغل غير لو نشرت المشروع أو استخدمت `vercel dev` بعد تسجيل الدخول بـ Vercel CLI ووضع ملف `.env` (انسخه من `.env.example`)
