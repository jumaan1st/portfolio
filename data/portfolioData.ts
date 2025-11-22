// data/portfolioData.ts
import type {ComponentType, SVGProps} from "react";
import {
    Server,
    Database,
    FileText,
    Globe,
    Code,
    Cpu,
    Monitor,
    Terminal,
} from "lucide-react";


export interface Skill {
    name: string;
    icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
}


export interface Experience {
    id: number;
    role: string;
    company: string;
    period: string;
    description: string;
}

export interface Project {
    id: number;
    title: string;
    category: string;
    tech: string[];
    description: string;
    longDescription?: string;
    features?: string[];
    challenges?: string;
    link: string;
    color: string;
    image?: string;
}

export interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    tags: string[];
    content?: string;
}

export interface Education {
    id: number;
    degree: string;
    school: string;
    year: string;
    grade: string;
}

export interface Profile {
    name: string;
    roles: string[];
    currentRole: string;
    currentCompany: string;
    currentCompanyUrl: string;
    summary: string;
    location: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    twitter: string;
    resumeUrl: string;
}

export interface UIConfig {
    heroTagline: string;
    statusLabel: string;
    blogTitle: string;
    blogSubtitle: string;
    projectTitle: string;
    projectSubtitle: string;
}

export interface Config {
    adminEmail: string;
    adminPass: string;
    showWelcomeModal: boolean;
}

export interface PortfolioData {
    config: Config;
    ui: UIConfig;
    profile: Profile;
    experience: Experience[];
    projects: Project[];
    blogs: BlogPost[];
    education: Education[];
    skills: Skill[];
}

// ---- actual data ----

export const initialData: PortfolioData = {
    config: {
        adminEmail: "admin@jumaan.dev",
        adminPass: "password123",
        showWelcomeModal: true,
    },
    ui: {
        heroTagline: "Portfolio 2025",
        statusLabel: "Currently working as Java Backend Developer at",
        blogTitle: "Latest Thoughts",
        blogSubtitle: "Insights on Java, System Design, and AI",
        projectTitle: "Featured Work",
        projectSubtitle: "Swipe to see what I've been building",
    },
    profile: {
        name: "Mohammed Jumaan",
        roles: ["Java Backend Developer", "Backend Architect", "Spring Boot Expert"],
        currentRole: "Java Backend Developer",
        currentCompany: "Dyashin Technosoft",
        currentCompanyUrl: "#",
        summary:
            "Specializing in building robust and scalable backend services using Java, Spring Boot, and Hibernate. Proficient in designing RESTful APIs with secure JWT authentication and optimizing application performance.",
        location: "Bangalore, Karnataka",
        email: "mohammedjumaan01@gmail.com",
        phone: "+91-9886262303",
        linkedin: "linkedin.com/in/mohammedjumaan",
        github: "github.com/jumaanlst",
        twitter: "x.com/jumaanlst",
        resumeUrl: "/Mohammed_jumaan_cse.pdf",
    },
    experience: [
        {
            id: 1,
            role: "Java Backend Developer",
            company: "Dyashin Technosoft Private Limited",
            period: "Sep 2025 - Present",
            description:
                "Developing and maintaining Java-based web applications using Spring Boot, Hibernate, and REST APIs. Implementing secure authentication mechanisms including JWT. Collaborating with teams to enhance application scalability and performance.",
        },
        {
            id: 2,
            role: "Pre-Placement Trainee",
            company: "Dyashin Technosoft Private Limited",
            period: "Feb 2025 - Aug 2025",
            description:
                "Completed a four-month training program on software development methodologies, including Agile and Git. Enhanced professional skills through workshops on coding standards.",
        },
    ],
    projects: [
        {
            id: 1,
            title: "Student Management System",
            category: "Full Stack",
            tech: ["Java", "Spring Boot", "Hibernate", "React"],
            description:
                "Migrated legacy Servlets/JDBC system to modern Spring Boot architecture. Implemented REST APIs, JWT auth, and BCrypt hashing.",
            longDescription:
                "A comprehensive overhaul of a legacy student record system. The original system suffered from performance bottlenecks and security vulnerabilities due to raw SQL queries. I re-architected the backend using Spring Boot and Hibernate, introducing a layered architecture (Controller-Service-Repository).",
            features: [
                "Role-based Access Control (RBAC)",
                "Bulk Data Import/Export",
                "Automated Grade Calculation",
                "Real-time Attendance Tracking",
            ],
            challenges:
                "Migrating live data from the old schema to the new normalized PostgreSQL schema without downtime was critical. I used Flyway for version control and wrote custom migration scripts.",
            link: "#",
            color: "from-blue-500 to-cyan-500",
            image: "https://images.unsplash.com/photo-1545665277-5937489579f2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        },
        {
            id: 2,
            title: "Automated Trading Agent",
            category: "AI/ML",
            tech: ["Python", "Django", "NLP", "Next.js"],
            description:
                "Automated trading system integrating technical and sentiment analysis. Achieved 85% accuracy with NLP-based sentiment analysis.",
            longDescription:
                "This project bridges the gap between traditional technical analysis and modern sentiment analysis. By scraping financial news and tweets, the NLP model adjusts trading signals generated by moving averages.",
            features: [
                "Real-time Stock Ticker",
                "Sentiment Analysis Dashboard",
                "Backtesting Engine",
                "Telegram Alerts",
            ],
            challenges:
                "Handling the rate limits of social media APIs and processing streaming data in real-time required implementing a Redis message queue to decouple the scraper from the analyzer.",
            link: "#",
            color: "from-purple-500 to-pink-500",
            image: "https://images.unsplash.com/photo-1545665277-5937489579f2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        },
        {
            id: 3,
            title: "AI Code Converter",
            category: "AI Tool",
            tech: ["Python", "Gemini API"],
            description:
                "AI-powered code translation and optimization tool reducing conversion time by 30%.",
            longDescription:
                "A developer productivity tool that leverages Google's Gemini API to translate legacy code (e.g., COBOL, older Java) into modern Python or Java 17+. It also suggests optimizations.",
            features: [
                "Syntax Highlighting",
                "Side-by-side Diff View",
                "Complexity Analysis",
                "One-click Refactoring",
            ],
            challenges:
                "Ensuring the generated code was syntactically correct required a post-processing validation step that ran a linter against the AI output before presenting it to the user.",
            link: "#",
            color: "from-green-500 to-emerald-500",
            image: "https://images.unsplash.com/photo-1545665277-5937489579f2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        },
        {
            id: 4,
            title: "Career Catalyst",
            category: "Web App",
            tech: ["Express.js", "Gemini API"],
            description:
                "Job portal with ML-driven recommendations and résumé tools, improving job matching accuracy by 25%.",
            longDescription:
                "A job board that works for the candidate. It analyzes your uploaded resume and matches you with jobs based on skills similarity, not just keyword matching.",
            features: [
                "Resume Parser",
                "Skill Gap Analysis",
                "Auto-Apply Bot",
                "Interview Prep Mode",
            ],
            challenges:
                "Parsing diverse resume formats (PDF, DOCX) was tricky. I integrated a robust OCR solution to handle image-based PDFs.",
            link: "#",
            color: "from-orange-500 to-red-500",
            image: "https://images.unsplash.com/photo-1545665277-5937489579f2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        },
        {
            id: 5,
            title: "Skin Cancer Detection",
            category: "Healthcare AI",
            tech: ["Express.js", "Roboflow API"],
            description:
                "Real-time skin condition assessment app using Roboflow APIs, achieving 90% accuracy.",
            longDescription:
                "A mobile-first web app designed to help users screen skin lesions. It uses a computer vision model hosted on Roboflow to classify images as benign or malignant with high confidence.",
            features: [
                "Camera Integration",
                "History Tracking",
                "Doctor Export PDF",
                "Offline Mode",
            ],
            challenges:
                "Minimizing false negatives was the highest priority. We adjusted the confidence threshold to err on the side of caution, prompting users to see a doctor if even slightly unsure.",
            link: "#",
            color: "from-indigo-500 to-blue-600",
            image: "https://images.unsplash.com/photo-1545665277-5937489579f2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        },
    ],
    blogs: [
        {
            id: 1,
            title: "Optimizing Spring Boot Performance",
            excerpt:
                "Deep dive into JVM tuning, HikariCP configuration, and lazy loading strategies for high-scale apps.",
            date: "Nov 15, 2025",
            readTime: "5 min read",
            tags: ["Java", "Performance"],
            content: `
Performance tuning a Spring Boot app starts with understanding where the time is actually spent.

In this article I walk through:
- Choosing the right JVM flags for server workloads
- Configuring HikariCP for efficient connection pooling
- Reducing N+1 queries using Hibernate fetch strategies
- Caching expensive calls with Spring Cache

I also cover a small case study from my Student Management System project where optimizing a single report endpoint dropped the response time from 2.3s to 280ms.
        `.trim(),
        },
        {
            id: 2,
            title: "Why I moved from JDBC to Hibernate",
            excerpt:
                "A retrospective on the Student Management System migration and the benefits of ORM.",
            date: "Oct 22, 2025",
            readTime: "4 min read",
            tags: ["Database", "ORM"],
            content: `
Raw JDBC is powerful, but as your schema grows it becomes harder to maintain and reason about.

In this post I compare:
- Boilerplate CRUD code in JDBC vs Hibernate
- How entity mappings help you think in objects instead of tables
- Transaction management and lazy loading
- Migration strategies from legacy SQL to an ORM

I share some real lessons from migrating my Student Management System backend from handwritten SQL to Hibernate with a layered architecture.
        `.trim(),
        },
        {
            id: 3,
            title: "Integrating Gemini API for Code Analysis",
            excerpt:
                "How to use Google's Gemini API to build an automated code converter and optimizer.",
            date: "Sep 10, 2025",
            readTime: "6 min read",
            tags: ["AI", "API"],
            content: `
Gemini is a great fit for developer productivity tools.

Here I walk through:
- Designing a prompt for safe code transformation
- Building a small backend endpoint that calls Gemini
- Post-processing the AI output with a linter and formatter
- Handling rate limits and failures with retries

This post is based on my AI Code Converter project, where I use Gemini to translate legacy code into modern Java or Python and suggest refactors automatically.
        `.trim(),
        },
    ],
    education: [
        {
            id: 1,
            degree: "B.E. (Computer Science)",
            school: "Maharaja Institute of Technology Mysore",
            year: "Jan 2021 - Jul 2025",
            grade: "CGPA: 8.22/10",
        },
        {
            id: 2,
            degree: "Pre-University (Science)",
            school: "Aishwarya Independent PU College",
            year: "Jan 2020 - Jan 2021",
            grade: "Score: 94%",
        },
    ],
    skills: [
        {name: "Java", icon: Server},
        {name: "Spring Boot", icon: Database},
        {name: "Hibernate", icon: FileText},
        {name: "Microservices", icon: Globe},
        {name: "React", icon: Code},
        {name: "Docker", icon: Cpu},
        {name: "AWS", icon: Monitor},
        {name: "Python", icon: Terminal},
    ],
};
