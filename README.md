# 🚀 Modern Developer Portfolio [Next.js 16 + AI Integration]

> A high-performance, interactive, and AI-powered developer portfolio built with the latest web technologies. Features a custom **DeepSeek AI Chat Assistant**, a robust **Blog Engine**, and a dynamic **Admin Dashboard**.

![Home Page](public/screenshots/home.png)

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Key Features

### 🤖 Intelligent AI Assistant
A custom-built, draggable Chat Widget powered by **DeepSeek AI** (or Gemini).
*   **Context-Aware**: Knows your skills, projects, and bio intimately.
*   **Smart Compression**: Reduces token usage by ~75% while maintaining context.
*   **Interactive UI**: Draggable window with smooth animations and markdown support.

### 📝 Full-Featured Blog Engine
A complete blogging platform built right into the portfolio.
*   **Rich Text Editor**: Integrated **Quill Editor** (React 19 compatible) with formatting, lists, and links.
*   **Media Support**: Drag & drop support for **Images** and **PDFs** directly in content.
*   **Auto-Cover**: Automatically extracts the first image from content if no cover is provided.
*   **Cloudflare R2**: High-performance object storage for all media assets.

![Blogs Page](public/screenshots/blogs.png)

### 🛡️ Protected Admin Portal
A comprehensive dashboard to manage your portfolio content dynamically.
*   **AI Resume Parsing**: Paste your resume text/PDF, and the AI extracts profile, skills, and experience to auto-fill the database.
*   **CMS**: Create, update, and delete **Projects**, **Blogs**, **Skills**, and **Experience** without touching code.
*   **Secure Access**: Protected routes with session-based authentication.

![Admin Portal](public/screenshots/admin.png)

### 📧 Smart Contact System
*   **Rate Limiting**: Limits users to **5 AI-drafted emails per day** to prevent abuse.
*   **Auto-Drafting**: AI drafts personalized email replies based on visitor messages.

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, TypeScript
*   **Styling**: Tailwind CSS v4, Lucide Icons, Framer Motion
*   **Backend**: Next.js Server Actions & API Routes
*   **Database**: PostgreSQL (via `pg` & connection pooling)
*   **Storage**: Cloudflare R2 (S3 Compatible)
*   **AI**: DeepSeek API / Google Gemini

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   PostgreSQL Database
*   Cloudflare R2 Bucket (optional, for images)

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/portfolio.git
    cd portfolio
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file:
    ```env
    # Database
    DATABASE_URL=postgres://user:pass@host:5432/db

    # AI Provider
    AI_PROVIDER=deepseek
    DEEPSEEK_API_KEY=sk-your-key
    GEMINI_API_KEY=abc-your-key

    # Cloudflare R2 (Storage)
    R2_ACCOUNT_ID=your_id
    R2_ACCESS_KEY_ID=your_access_key
    R2_SECRET_ACCESS_KEY=your_secret_key
    R2_BUCKET_NAME=your_bucket
    R2_PUBLIC_URL=https://pub-your-url.r2.dev

    # Auth
    ADMIN_PASSWORD=your_secure_password
    JWT_SECRET=your_jwt_secret
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

```
portfolio/
├── app/
│   ├── api/            # API Routes (Upload, AI, Blogs)
│   ├── (public)/       # Public pages (Home, Blog, Projects)
│   └── admin/          # Admin Dashboard
├── components/
│   ├── pages/          # Page-level components
│   ├── ui/             # Reusable UI elements (Toast, Modal)
│   └── RichTextEditor  # Custom Quill wrapper
├── lib/
│   ├── db.ts           # DB Connection
│   └── s3.ts           # R2 Storage Logic
└── public/
    └── screenshots/    # Project screenshots
```

---

## 📸 Screen Gallery

| **Projects** | **Contact** |
|:---:|:---:|
| ![Projects](public/screenshots/projects.png) | ![Contact](public/screenshots/contact.png) |

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/jumaan1st">Mohammed Jumaan</a>
</p>
