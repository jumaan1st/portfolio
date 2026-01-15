
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

export const formatDateRange = ({ start, end }: { start?: string, end?: string }) => {
    if (!start) return "";
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) return "";

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-GB', options);

    if (!end) return `${startStr} - Present`;

    const endDate = new Date(end);
    if (isNaN(endDate.getTime())) return startStr;

    const endStr = endDate.toLocaleDateString('en-GB', options);
    return `${startStr} - ${endStr}`;
};

export const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};
