export const getImageUrl = (url: string | null | undefined) => {
    if (!url) return 'https://placehold.co/600x400/f3f4f6/6b7280?text=Image+Not+Found';
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url; // Handle local previews

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
