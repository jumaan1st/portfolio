
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unstable_cache, revalidateTag } from 'next/cache';

const getProfile = unstable_cache(
  async () => {
    const { rows } = await pool.query(`
      SELECT 
        id,
        name,
        roles,
        role AS "currentRole",
        current_company AS "currentCompany",
        current_company_url AS "currentCompanyUrl",
        summary,
        location,
        email,
        phone,
        linkedin,
        github,
        twitter,
        resume_url AS "resumeUrl",
        photo_light_url AS "photoLightUrl",
        photo_dark_url AS "photoDarkUrl"
      FROM portfolio.profile
      LIMIT 1
    `);
    return rows[0] || {};
  },
  ['profile-data'],
  { tags: ['profile'], revalidate: 3600 }
);

export async function GET() {
  try {
    const data = await getProfile();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      roles,
      currentRole,
      currentCompany,
      currentCompanyUrl,
      summary,
      location,
      email,
      phone,
      linkedin,
      github,
      twitter,
      resumeUrl,
      photoLightUrl,
      photoDarkUrl
    } = body;

    // Assuming id=1 is the only profile for now, or fetch the first one
    const { rows } = await pool.query(`
            UPDATE portfolio.profile
            SET
                name = COALESCE($1, name),
                roles = COALESCE($2, roles),
                role = COALESCE($3, role),
                current_company = COALESCE($4, current_company),
                current_company_url = COALESCE($5, current_company_url),
                summary = COALESCE($6, summary),
                location = COALESCE($7, location),
                email = COALESCE($8, email),
                phone = COALESCE($9, phone),
                linkedin = COALESCE($10, linkedin),
                github = COALESCE($11, github),
                twitter = COALESCE($12, twitter),
                resume_url = COALESCE($13, resume_url),
                photo_light_url = COALESCE($14, photo_light_url),
                photo_dark_url = COALESCE($15, photo_dark_url)
            WHERE id = (SELECT id FROM portfolio.profile LIMIT 1)
            RETURNING 
                id, name, roles, role as "currentRole", current_company as "currentCompany", 
                current_company_url as "currentCompanyUrl", summary, location, email, phone, 
                linkedin, github, twitter, resume_url as "resumeUrl", 
                photo_light_url as "photoLightUrl", photo_dark_url as "photoDarkUrl"
        `, [
      name, JSON.stringify(roles), currentRole, currentCompany, currentCompanyUrl, summary,
      location, email, phone, linkedin, github, twitter, resumeUrl,
      photoLightUrl, photoDarkUrl
    ]);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  } finally {
    revalidateTag('profile', 'max');
  }
}
