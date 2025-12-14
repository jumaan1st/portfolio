# 🚀 Modern Developer Portfolio [Next.js 16 + AI Integration]

> A high-performance, interactive, and AI-powered developer portfolio built with the latest web technologies. Features a custom **DeepSeek AI Chat Assistant**, a smart email rate-limiting system, and a dynamic project showcase.

![Home Page](file:///C:/Users/moham/.gemini/antigravity/brain/a5f22c7d-9fa0-4b0e-8c63-d781d20d76eb/home_page_top_1765696403743.png)

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

---

## ✨ Key Features

### 🤖 Intelligent AI Assistant
A custom-built, draggable Chat Widget powered by **DeepSeek AI**.
*   **Context-Aware**: Knows your skills, projects, and bio intimately.
*   **Cost-Optimized**: Uses a "Smart Compression" algorithm to reduce token usage by ~75% without losing context.
*   **Interactive UI**: Draggable window with an app-like feel and smooth animations.

![AI Chat Widget](file:///C:/Users/moham/.gemini/antigravity/brain/a5f22c7d-9fa0-4b0e-8c63-d781d20d76eb/chat_widget_open_1765696444414.png)

### 📧 Smart Contact System
More than just a form.
*   **Rate Limiting**: Limits users to **5 AI-drafted emails per day** to prevent abuse and manage costs (backed by Postgres).
*   **Auto-Drafting**: AI reads the visitor's message and drafts a hyper-personalized email reply on your behalf.
*   **Fallback Logic**: Automatically switches to generic templates if limits are hit or APIs fail.

![Contact Page](file:///C:/Users/moham/.gemini/antigravity/brain/a5f22c7d-9fa0-4b0e-8c63-d781d20d76eb/contact_page_1765696583255.png)

### 💼 Dynamic Project Showcase
*   **Rich Details**: Dedicated pages for each project with "AI Insights" (Elevator Pitch & Tech Critique generator).
*   **Tabs**: Organized views for Overview, Tech Stack, and Outcomes.

![Projects Page](file:///C:/Users/moham/.gemini/antigravity/brain/a5f22c7d-9fa0-4b0e-8c63-d781d20d76eb/projects_page_1765696532545.png)

---

## 🛠️ Tech Stack

*   **Frontend**: Next.js 16 (App Router), React 19, TypeScript
*   **Styling**: Tailwind CSS v4, Lucide Icons, Framer Motion (animations)
*   **Backend**: Next.js API Routes (Serverless)
*   **Database**: PostgreSQL (via `pg`)
*   **AI**: DeepSeek API (or Gemini fallback)
*   **Email**: Nodemailer (SMTP)

---

## 🚀 Getting Started

Follow these steps to deploy your own version.

### Prerequisites
*   Node.js 18+
*   PostgreSQL Database

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/jumaan1st/portfolio.git
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

    # AI Provider (gemini | deepseek)
    AI_PROVIDER=deepseek
    DEEPSEEK_API_KEY=sk-your-key
    GEMINI_API_KEY=abc-your-key

    # Email
    EMAIL_USER=your@gmail.com
    EMAIL_PASS=your-app-password
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

---

## 📂 Project Structure

```
portfolio/
├── app/
│   ├── api/            # Serverless functions (Chat, Contact, DB)
│   ├── (public)/       # Public routes (Home, About, Projects)
│   └── admin/          # Protected Admin Dashboard
├── components/
│   ├── AIChatWidget.tsx # Core AI Chat Logic
│   └── pages/          # Page specific components
├── lib/
│   ├── ai-manager.ts   # Central AI routing logic
│   └── db.ts           # Postgres connection pool
└── data/               # Static fallback data
```

---

## 📸 More Screens

### About Page
![About Page](file:///C:/Users/moham/.gemini/antigravity/brain/a5f22c7d-9fa0-4b0e-8c63-d781d20d76eb/about_page_1765696610390.png)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/jumaan1st">Mohammed Jumaan</a>
</p>
