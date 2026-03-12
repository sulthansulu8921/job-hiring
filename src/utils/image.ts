export const getImageUrl = (url: string | null | undefined) => {
    if (!url) return 'https://placehold.co/600x400/f3f4f6/6b7280?text=Image+Not+Found';
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url; // Handle local previews

    const apiRoot = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    // Remove /api trailing part to get the base domain for media
    const baseUrl = apiRoot.endsWith('/api') ? apiRoot.slice(0, -4) : apiRoot;

    // Ensure we don't double up on slashes
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
};
