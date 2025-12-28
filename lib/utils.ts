
export const extractFirstImage = (content?: string): string | null => {
    if (!content) return null;
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/);
    return match ? match[1] : null;
};

export function extractRepoDetails(url: string): { owner: string | null, repo: string | null } {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== 'github.com') return { owner: null, repo: null };
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length < 2) return { owner: null, repo: null };
        const repo = parts[1].replace(/\.git$/, '');
        return { owner: parts[0], repo: repo };
    } catch (e) {
        return { owner: null, repo: null };
    }
}
