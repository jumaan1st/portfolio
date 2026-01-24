import { AboutPage } from "@/components/pages/AboutPage";
import { Metadata } from "next";
import pool from "@/lib/db";
import { unstable_cache } from "next/cache";

export const metadata: Metadata = {
    title: "About Me | Mohammed Jumaan",
    description: "Learn more about Mohammed Jumaan, his background in backend development, education, and career journey.",
};

const getExperience = unstable_cache(
    async () => {
        const { rows } = await pool.query('SELECT * FROM portfolio.experience ORDER BY start_date DESC NULLS LAST, id DESC');
        return rows;
    },
    ['experience-list'],
    { tags: ['experience'], revalidate: 3600 }
);

const getEducation = unstable_cache(
    async () => {
        const { rows } = await pool.query('SELECT * FROM portfolio.education ORDER BY start_date DESC NULLS LAST, id DESC');
        return rows;
    },
    ['education-list'],
    { tags: ['education'], revalidate: 3600 }
);

export default async function Page() {
    const [experience, education] = await Promise.all([
        getExperience(),
        getEducation()
    ]);

    return <AboutPage initialExperience={experience} initialEducation={education} />;
}
