# Class Links Portal

A modern, fast, and responsive study resources & lecture portal built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

Ready for 1-click deployment to **Vercel** or **Cloudflare Pages**!

---

## 🚀 Features

- 📚 **Subjects & Chapters Management**: Group all lectures, Zoom sessions, videos, and PDFs neatly by subject and chapter.
- 🔗 **Smart Link Detection**: Automatically tags links with badges and icons for **Zoom**, **Google Meet**, **Microsoft Teams**, **YouTube**, **Google Drive**, and **PDF** documents.
- ⚡ **Instant Real-Time Search**: Search across lecture titles, subjects, chapters, notes, and meeting links.
- 🎓 **Teacher / Student Modes**:
  - Switch between **Student View** (clean, read-only link hub) and **Teacher Mode** (create, edit, reorder, delete).
  - Add links one-by-one or use **Batch Paste** (`Title | URL`).
- 💾 **Data Persistence & Backups**:
  - Automatically persists to local browser storage.
  - **Export to JSON** backup anytime and **Import** on any device.
- 🎨 **Modern Aesthetics**: Glassmorphism design, clean typography (Plus Jakarta Sans), smooth micro-interactions, and vibrant color-coded subjects.

---

## 🛠️ Deploying to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework Preset will automatically detect **Vite**.
5. Build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Click **Deploy**! 🚀

---

## ☁️ Deploying to Cloudflare Pages

1. Push this folder to a GitHub or GitLab repository.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. In build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**! ⚡

---

## 💻 Local Development

```bash
# Run locally
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
