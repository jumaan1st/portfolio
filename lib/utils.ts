
export const extractFirstImage = (content?: string): string | null => {
    if (!content) return null;
    const match = content.match(/<img[^>]+src=["']([^"']+)["']/);
    return match ? match[1] : null;
};
