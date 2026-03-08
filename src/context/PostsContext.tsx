// Mock data removed in favor of API fetching

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Post, PostType, Group } from '../types';
import api from '../services/api';

interface PostsContextType {
    posts: Post[];
    groups: Group[];
    loading: boolean;
    addPost: (post: Post) => void;
    getPostsByType: (type: PostType | 'ALL') => Post[];
    createGroup: (group: { name: string; description: string; image?: File }) => Promise<void>;
    joinGroup: (groupId: number) => Promise<void>;
    leaveGroup: (groupId: number) => Promise<void>;
    getPostById: (id: string) => Post | undefined;
    refreshPosts: () => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    // Define fetchAllData inside PostsProvider to be accessible by refreshPosts
    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [feedRes, groupsRes] = await Promise.all([
                api.get('/feed/'),
                api.get('/groups/')
            ]);
            const feedData = Array.isArray(feedRes.data) ? feedRes.data : feedRes.data.results || [];
            const groupsData = Array.isArray(groupsRes.data) ? groupsRes.data : groupsRes.data.results || [];

            // Map backend data to frontend Post interface
            const mappedPosts: Post[] = feedData.map((item: any) => {
                const base = {
                    id: item.id,
                    title: item.title || item.content?.split('\n')[0].substring(0, 50) || "Untitled",
                    description: item.description || item.content || "",
                    location: item.location || "Remote",
                    postedAt: new Date(item.created_at).toLocaleDateString(),
                    user: {
                        id: item.user || item.created_by,
                        name: item.user_name || "Unknown",
                        avatar: item.user_avatar,
                        role: item.user_role || 'member',
                        connection_status: item.connection_status,
                        followers_count: item.followers_count,
                        following_count: item.following_count
                    },
                    images: item.image ? [item.image] : [],
                    likes_count: item.likes_count,
                    dislikes_count: item.dislikes_count,
                    comments_count: item.comments_count,
                    is_liked: item.is_liked,
                    is_disliked: item.is_disliked,
                    is_saved: item.is_saved,
                    is_interested: item.is_interested,
                    is_hidden: item.is_hidden,
                    created_at: item.created_at
                };

                if (item.feed_type === 'job') {
                    return {
                        ...base,
                        type: 'JOB',
                        company: item.company_name,
                        jobType: item.job_type || 'Full-Time',
                        salary: item.salary_min ? `₹${item.salary_min}${item.salary_max ? ' - ₹' + item.salary_max : ''}` : 'Competitive',
                        experience: item.experience
                    } as any;
                } else if (item.feed_type === 'service') {
                    return {
                        ...base,
                        type: 'SERVICE',
                        rate: item.price_min ? `₹${item.price_min}${item.price_max ? ' - ₹' + item.price_max : ''}` : 'Contact for price',
                        category: item.category_name,
                    } as any;
                } else {
                    return {
                        ...base,
                        type: 'NORMAL',
                    } as any;
                }
            });

            setGroups(groupsData);
            setPosts(mappedPosts);
        } catch (err) {
            console.error("Failed to fetch feed data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const refreshPosts = async () => {
        await fetchAllData();
    };

    const addPost = (newPost: Post) => {
        setPosts(prev => [newPost, ...prev]);
    };

    const getPostsByType = (type: PostType | 'ALL') => {
        if (type === 'ALL') return posts;
        return posts.filter(p => p.type === type);
    };

    const createGroup = async (newGroupData: { name: string; description: string; image?: File }) => {
        try {
            const formData = new FormData();
            formData.append('name', newGroupData.name);
            formData.append('description', newGroupData.description);
            if (newGroupData.image) {
                formData.append('image', newGroupData.image);
            }

            const res = await api.post('/groups/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setGroups(prev => [res.data, ...prev]);
        } catch (err) {
            console.error("Group creation failed:", err);
            throw err;
        }
    };

    const joinGroup = async (groupId: number) => {
        try {
            await api.post(`/groups/${groupId}/join/`);
            setGroups(prev => prev.map(g =>
                g.id === groupId
                    ? { ...g, is_member: true, members_count: (g.members_count || 0) + 1 }
                    : g
            ));
        } catch (err) {
            console.error("Join group failed:", err);
        }
    };

    const leaveGroup = async (groupId: number) => {
        try {
            await api.post(`/groups/${groupId}/leave/`);
            setGroups(prev => prev.map(g =>
                g.id === groupId
                    ? { ...g, is_member: false, members_count: Math.max(0, (g.members_count || 0) - 1) }
                    : g
            ));
        } catch (err) {
            console.error("Leave group failed:", err);
        }
    };

    const getPostById = (id: string) => {
        return posts.find(p => p.id.toString() === id);
    };

    return (
        <PostsContext.Provider value={{
            posts,
            groups,
            loading,
            addPost,
            getPostsByType,
            createGroup,
            joinGroup,
            leaveGroup,
            getPostById,
            refreshPosts
        }}>
            {children}
        </PostsContext.Provider>
    );
}

export function usePosts() {
    const context = useContext(PostsContext);
    if (context === undefined) {
        throw new Error('usePosts must be used within a PostsProvider');
    }
    return context;
}
