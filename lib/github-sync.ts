
import { callAI } from "./ai-manager";
import { extractRepoDetails } from "./utils";

const SYSTEM_PROMPT = `
You are an expert technical writer. Generate a professional, comprehensive README.md for a software project.
The project details are provided below.
Structure the README with:
- Title & Badges
- Description
- Key Features (bullet points)
- Tech Stack (be specific)
- Getting Started / Installation
- Usage/Screenshots place holder
- Contributing
- License

Return ONLY the raw markdown string. Do not include \`\`\`markdown code fences.
`;

export async function generateProjectReadme(project: any): Promise<string> {
    const prompt = `
    Project Title: ${project.title}
    Category: ${project.category}
    Description: ${project.description}
    Long Description: ${project.longDescription || project.description}
    Tech Stack: ${Array.isArray(project.tech) ? project.tech.join(', ') : project.tech}
    Features: ${Array.isArray(project.features) ? project.features.join(', ') : project.features}
    Challenges: ${project.challenges || 'N/A'}
    Demo Link: ${project.link}
    GitHub Link: ${project.githubLink || 'N/A'}
    `;

    return await generateReadmeWithAI(prompt);
}

export async function pushProjectReadme(githubLink: string, content: string) {
    const { owner, repo } = extractRepoDetails(githubLink);
    if (!owner || !repo) {
        throw new Error(`Invalid GitHub Link: ${githubLink}. Must be a valid github.com URL.`);
    }

    await pushToGitHub(owner, repo, content);
}

async function generateReadmeWithAI(userPrompt: string): Promise<string> {
    const prompt = `PROJECT DETAILS:\n${userPrompt}`;
    const systemPrompt = SYSTEM_PROMPT;

    let text = await callAI(prompt, systemPrompt);

    // Clean up markdown fences if the AI adds them despite instructions
    text = text.replace(/^```markdown\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    return text;
}


async function pushToGitHub(owner: string, repo: string, content: string) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("Missing GITHUB_TOKEN");

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/README.md`;

    // Get existing SHA
    let sha;
    const getRes = await fetch(apiUrl, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Portfolio-App'
        }
    });

    if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
    }

    // Update
    const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Portfolio-App'
        },
        body: JSON.stringify({
            message: 'docs: update readme via portfolio-cloud admin',
            content: Buffer.from(content).toString('base64'),
            sha: sha
        })
    });

    if (!putRes.ok) {
        const errText = await putRes.text();
        if (putRes.status === 404) {
            throw new Error(`Repository not found or Access Denied using current GITHUB_TOKEN. Ensure the token has 'repo' scope and the repository '${owner}/${repo}' exists.`);
        } else if (putRes.status === 401) {
            throw new Error("GitHub Authentication Failed. Invalid GITHUB_TOKEN.");
        }
        throw new Error(`GitHub Error (${putRes.status}): ${errText}`);
    }
}
