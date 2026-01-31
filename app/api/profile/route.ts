
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profile } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache, revalidateTag } from 'next/cache';

const getProfile = unstable_cache(
  async () => {
    const rows = await db.select({
      id: profile.id,
      name: profile.name,
      roles: profile.roles,
      currentRole: profile.role,
      currentCompany: profile.current_company,
      currentCompanyUrl: profile.current_company_url,
      summary: profile.summary,
      location: profile.location,
      email: profile.email,
      phone: profile.phone,
      linkedin: profile.linkedin,
      github: profile.github,
      twitter: profile.twitter,
      resumeUrl: profile.resume_url,
      photoLightUrl: profile.photo_light_url,
      photoDarkUrl: profile.photo_dark_url,
      currentlyLearning: profile.currently_learning
    }).from(profile).limit(1);

    return rows[0] || {};
  },
  ['profile-data'],
  { tags: ['profile'], revalidate: 3600 }
);

export async function GET() {
  try {
    const data = await getProfile();
    // Ensure currentlyLearning is parsed if stored as string
    if (typeof data.currentlyLearning === 'string') {
      try { data.currentlyLearning = JSON.parse(data.currentlyLearning); } catch (e) { data.currentlyLearning = []; }
    }
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
      photoDarkUrl,
      currentlyLearning
    } = body;

    // Assuming id=1 is the only profile for now, or fetch the first one
    // In Drizzle, we need to know the ID for 'where'. We can assume ID 1 or fetch it.
    // However, clean update would be:

    const updateData: any = {};
    // Only update if provided (COALESCE logic)
    if (name !== undefined) updateData.name = name;
    if (roles !== undefined) updateData.roles = roles;
    if (currentRole !== undefined) updateData.role = currentRole;
    if (currentCompany !== undefined) updateData.current_company = currentCompany;
    if (currentCompanyUrl !== undefined) updateData.current_company_url = currentCompanyUrl;
    if (summary !== undefined) updateData.summary = summary;
    if (location !== undefined) updateData.location = location;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (linkedin !== undefined) updateData.linkedin = linkedin;
    if (github !== undefined) updateData.github = github;
    if (twitter !== undefined) updateData.twitter = twitter;
    if (resumeUrl !== undefined) updateData.resume_url = resumeUrl;
    if (photoLightUrl !== undefined) updateData.photo_light_url = photoLightUrl;
    if (photoDarkUrl !== undefined) updateData.photo_dark_url = photoDarkUrl;
    if (currentlyLearning !== undefined) updateData.currently_learning = currentlyLearning;

    // Use a subquery logic or just hardcode ID 1 if we know it. 
    // To be safe and mimic SQL 'SELECT id FROM profile LIMIT 1', we can do:
    const ids = await db.select({ id: profile.id }).from(profile).limit(1);
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const targetId = ids[0].id;

    const rows = await db.update(profile)
      .set(updateData)
      .where(eq(profile.id, targetId))
      .returning({
        id: profile.id,
        name: profile.name,
        roles: profile.roles,
        currentRole: profile.role,
        currentCompany: profile.current_company,
        currentCompanyUrl: profile.current_company_url,
        summary: profile.summary,
        location: profile.location,
        email: profile.email,
        phone: profile.phone,
        linkedin: profile.linkedin,
        github: profile.github,
        twitter: profile.twitter,
        resumeUrl: profile.resume_url,
        photoLightUrl: profile.photo_light_url,
        photoDarkUrl: profile.photo_dark_url,
        currentlyLearning: profile.currently_learning
      });

    const updated = rows[0];
    if (typeof updated.currentlyLearning === 'string') {
      try { updated.currentlyLearning = JSON.parse(updated.currentlyLearning); } catch (e) { updated.currentlyLearning = []; }
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  } finally {
    revalidateTag('profile', { expire: 0 });
  }
}
