# 🚀 Modern Developer Portfolio

![Portfolio Preview](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop)

> A stunning, responsive, and interactive portfolio website built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**. Designed to showcase your projects, skills, and thoughts with a premium user experience.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Features

*   **🎨 Dynamic Theme System**: Seamless Dark/Light mode toggle with persistent state.
*   **📱 Fully Responsive**: Mobile-first design that looks great on all devices (Desktop, Tablet, Mobile).
*   **⚡ High Performance**: Built on Next.js App Router for optimal speed and SEO.
*   **🤖 AI Chat Widget**: Integrated AI assistant to answer visitor questions (Gemini API integration ready).
*   **💼 Project Showcase**: Beautiful carousel and grid layouts to display your work with image support.
*   **📝 Blog System**: Markdown-ready blog section to share your technical insights.
*   **contact Form**: Responsive contact form with validation and email integration readiness.
*   **🔐 Admin Dashboard**: Hidden admin route for managing content.

---

## 🛠️ Tech Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Theming**: [next-themes](https://github.com/pacocoursey/next-themes)
*   **Animations**: CSS Animations & Transitions

---

## 🚀 Getting Started

Follow these steps to get your portfolio up and running locally.

### Prerequisites

*   Node.js 18.17 or later
*   npm, yarn, pnpm, or bun

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/portfolio.git
    cd portfolio
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open your browser**
    Navigate to [http://localhost:3000](http://localhost:3000) to see your portfolio in action.

---

## 📂 Project Structure

```
portfolio/
├── app/                # Next.js App Router pages
│   ├── layout.tsx      # Root layout with ThemeProvider
│   ├── page.tsx        # Home page
│   └── ...
├── components/         # Reusable React components
│   ├── pages/          # Page-specific components (HomePage, AboutPage, etc.)
│   ├── Navbar.tsx      # Navigation bar
│   └── ...
├── data/               # Static data files
│   └── portfolioData.ts # Centralized data for the entire app
├── public/             # Static assets (images, fonts)
└── tailwind.config.js  # Tailwind CSS configuration
```

---

## ⚙️ Customization

This portfolio is designed to be easily customizable. You don't need to dive deep into the code to change the content.

1.  **Update Content**: Open `data/portfolioData.ts`. This file contains all the text, project details, skills, and profile information.
    ```typescript
    export const initialData = {
      profile: {
        name: "Your Name",
        role: "Full Stack Developer",
        // ...
      },
      projects: [
        // Add your projects here
      ],
      // ...
    }
    ```

2.  **Change Images**: Replace the images in the `public` folder or update the URLs in `portfolioData.ts`.

3.  **Styling**: Modify `app/globals.css` or `tailwind.config.js` to change the color scheme or fonts.

---

## 🤝 Contributing

Contributions are welcome! If you find a bug or want to add a new feature, feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/yourusername">Mohammed Jumaan</a>
</p>
