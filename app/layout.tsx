import React from "react";
import "./globals.css";
import { Metadata } from 'next';
import { ClientLayout } from "@/components/ClientLayout";

export const metadata: Metadata = {
    metadataBase: new URL('https://www.jumaan.me'),
    title: {
        default: 'Mohammed Jumaan | Backend Developer & Portfolio',
        template: '%s | Mohammed Jumaan',
    },
    description: 'Portfolio of Mohammed Jumaan, an expert Backend Developer, Software Engineer, and Cloud Architect specializing in Node.js, Next.js, and Scalable Systems.',
    keywords: [
        'Mohammed Jumaan',
        'Mohammed Jumman',
        'Mohamed Jumaan',
        'Muhammed Jumaan',
        'Mohammad Jumaan',
        'Mahammed Jumaan',
        'Jumaan',
        'Juman',
        'Jumaan.me',
        'Jumaan me',
        'Backend Developer',
        'Full Stack Developer',
        'Software Engineer',
        'Cloud Engineer',
        'React Developer',
        'Next.js Expert',
        'Node.js Developer',
        'Hire Backend Developer',
        'Freelance Developer India',
        'Remote Software Engineer',
        'PostgreSQL Expert',
        'System Design',
        'API Development',
        'Jumaan Portfolio'
    ],
    authors: [{ name: 'Mohammed Jumaan' }],
    creator: 'Mohammed Jumaan',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://www.jumaan.me',
        title: 'Mohammed Jumaan | Backend Developer',
        description: 'Scalable systems, modern web apps, and cloud architecture by Mohammed Jumaan.',
        siteName: 'Mohammed Jumaan Portfolio',
        images: [
            {
                url: '/og-image.jpg', // You should ideally add an OG image to /public
                width: 1200,
                height: 630,
                alt: 'Mohammed Jumaan Portfolio',
            },
        ],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Mohammed Jumaan',
        url: 'https://www.jumaan.me',
        sameAs: [
            'https://www.linkedin.com/in/mohammed-jumaan',
            'https://github.com/jumaan1st',
            'https://twitter.com/jumaan1st'
        ],
        jobTitle: 'Backend Developer',
        worksFor: {
            '@type': 'Organization',
            name: 'Freelance / Open to Work'
        }
    };

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-300">
                <ClientLayout>
                    {children}
                </ClientLayout>
            </body>
        </html>
    );
}
