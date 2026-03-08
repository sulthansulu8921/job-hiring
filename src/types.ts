export interface User {
    id: string | number;
    name: string;
    email: string;
    role?: string;
    avatar?: string;
    cover_photo?: string;
    bio?: string;
    location?: string;
    title?: string;
    skills?: string[];
    verified?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    followers_count?: number;
    following_count?: number;
    connection_status?: 'none' | 'pending' | 'received' | 'accepted';
    total_connections?: number;
}

export type PostType = 'JOB' | 'SERVICE' | 'NORMAL';

export interface Group {
    id: number;
    name: string;
    description: string;
    image?: string;
    banner?: string;
    members_count?: number;
    is_member?: boolean;
    created_by?: number | User;
    created_at?: string;
}

export interface BasePost {
    id: number | string;
    title: string;
    description?: string;
    location: string;
    postedAt: string;
    verified?: boolean;
    images?: string[]; // Array of image URLs
    type: PostType;
    user?: User; // Author
    group?: Group; // Optional group link
    likes_count?: number;
    dislikes_count?: number;
    comments_count?: number;
    is_liked?: boolean;
    is_disliked?: boolean;
    is_saved?: boolean;
    is_interested?: boolean;
    is_hidden?: boolean;
    created_at?: string; // From backend
}

export interface JobPost extends BasePost {
    type: 'JOB';
    company: string;
    jobType: string; // Full-time, etc.
    salary: string;
}

export interface ServicePost extends BasePost {
    type: 'SERVICE';
    rate: string; // e.g. "₹500/hr"
    category: string; // e.g. "Plumbing"
    availability?: string; // e.g. "Weekends"
}

export interface NormalPost extends BasePost {
    type: 'NORMAL';
}

export type Post = JobPost | ServicePost | NormalPost;
