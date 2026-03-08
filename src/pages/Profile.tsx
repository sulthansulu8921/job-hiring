import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import type { User, Post, JobPost } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { MapPin, Calendar, Edit2, LogOut, CheckCircle2, Camera, X, Save, Users, Plus } from "lucide-react";
import { usePosts } from "../context/PostsContext";
import { PostCard } from "../components/feed/PostCard";
import JobCard from "../components/feed/JobCard";
import { useParams } from "react-router-dom";

export default function Profile() {
    const { id } = useParams<{ id: string }>();
    const { user: authUser, logout, updateProfile } = useAuth();
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({});

    const { createGroup } = usePosts();
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroup, setNewGroup] = useState<{ name: string; description: string; image: File | null }>({ name: '', description: '', image: null });

    // Profile Tab States
    const [activeTab, setActiveTab] = useState<'Activity' | 'Jobs' | 'Saved'>('Activity');
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [userJobs, setUserJobs] = useState<JobPost[]>([]);
    const [savedPosts, setSavedPosts] = useState<(Post | JobPost)[]>([]);
    const [loadingTabs, setLoadingTabs] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const isOwnProfile = !id || id === authUser?.id?.toString();

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            setLoadingProfile(true);
            try {
                if (isOwnProfile) {
                    const res = await api.get('/auth/me/');
                    setProfileUser(res.data);
                    updateProfile(res.data);
                } else {
                    const res = await api.get(`/auth/user/${id}/`);
                    setProfileUser(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [id, isOwnProfile]);

    // Fetch tab data when activeTab or profileUser changes
    useEffect(() => {
        if (!profileUser) return;
        const fetchTabData = async () => {
            setLoadingTabs(true);
            try {
                if (activeTab === 'Activity') {
                    const res = await api.get(`/feed/?user_id=${profileUser.id}`);
                    setUserPosts(Array.isArray(res.data) ? res.data : res.data.results || []);
                } else if (activeTab === 'Jobs') {
                    const res = await api.get(`/jobs/?created_by_id=${profileUser.id}`);
                    setUserJobs(Array.isArray(res.data) ? res.data : res.data.results || []);
                } else if (activeTab === 'Saved' && isOwnProfile) {
                    const res = await api.get(`/auth/user/saved/`);
                    setSavedPosts(Array.isArray(res.data) ? res.data : res.data.results || []);
                }
            } catch (err) {
                console.error(`Failed to fetch ${activeTab}:`, err);
            } finally {
                setLoadingTabs(false);
            }
        };
        fetchTabData();
    }, [activeTab, profileUser?.id, isOwnProfile]);

    if (loadingProfile) {
        return (
            <div className="flex justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!profileUser) {
        return <div className="p-8 text-center text-gray-500">User not found.</div>;
    }

    const handleEdit = () => {
        setFormData({
            name: profileUser.name,
            title: profileUser.title,
            location: profileUser.location,
            bio: profileUser.bio,
            avatar: profileUser.avatar
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const res = await api.patch('/auth/me/', formData);
            updateProfile(res.data);
            setProfileUser(res.data);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
            alert("Failed to update profile.");
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('avatar', file);

        try {
            const res = await api.patch('/auth/me/', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateProfile(res.data);
            setProfileUser(res.data);
            setFormData(prev => ({ ...prev, avatar: res.data.avatar }));
        } catch (err) {
            console.error("Avatar upload failed", err);
            alert("Failed to upload avatar.");
        }
    };

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('cover_photo', file);

        try {
            const res = await api.patch('/auth/me/', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateProfile(res.data);
            setProfileUser(res.data);
        } catch (err) {
            console.error("Cover upload failed", err);
            alert("Failed to upload cover photo.");
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroup.name || !newGroup.description) return;
        try {
            await createGroup({
                name: newGroup.name,
                description: newGroup.description,
                image: newGroup.image || undefined
            });
            setShowCreateGroup(false);
            setNewGroup({ name: '', description: '', image: null });
            alert("Group created successfully! You are now a member.");
        } catch (err) {
            alert("Failed to create group.");
        }
    };

    const tabs = isOwnProfile ? (['Activity', 'Jobs', 'Saved'] as const) : (['Activity', 'Jobs'] as const);

    return (
        <div className="bg-gray-50 min-h-[calc(100vh-4rem)] pb-20 md:pb-8">
            {/* Cover Image */}
            <div className="h-32 md:h-48 bg-gradient-to-r from-primary-600 to-secondary-600 relative overflow-hidden">
                {profileUser.cover_photo && (
                    <img src={profileUser.cover_photo} className="absolute inset-0 w-full h-full object-cover" alt="Cover" />
                )}
                {isEditing && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
                            <Camera className="h-6 w-6 mr-2" /> Change Cover
                            <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                        </label>
                    </div>
                )}
            </div>

            {/* Profile Info */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                        <div className="relative group">
                            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md relative">
                                <img
                                    src={(isEditing ? formData.avatar : profileUser.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name)}&background=random`}
                                    alt={profileUser.name}
                                    className="h-full w-full object-cover"
                                />
                                {isEditing && (
                                    <label
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity"
                                    >
                                        <Camera className="h-8 w-8 text-white opacity-80" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                )}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1 border-2 border-white">
                                <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 mb-2 w-full">
                            <div>
                                {isEditing ? (
                                    <div className="space-y-3 max-w-md">
                                        <Input
                                            value={formData.name || ""}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Full Name"
                                            label="Full Name"
                                        />
                                        <Input
                                            value={formData.title || ""}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Professional Title"
                                            label="Title (e.g. UX Designer)"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                            {profileUser.name}
                                            {(profileUser.verified || (profileUser as any).is_verified) && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 font-medium">Verified</span>}
                                        </h1>
                                        <p className="text-gray-600">{profileUser.title || profileUser.role || "Member"}</p>
                                    </>
                                )}
                            </div>

                            {!isEditing && (
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                                    {profileUser.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {profileUser.location}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-primary-600 font-semibold">
                                        <Users className="h-4 w-4" />
                                        {profileUser.total_connections || 0} Connections
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Joined Recently
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div className="mt-2">
                                    <Input
                                        value={formData.location || ""}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Location (e.g. Chennai)"
                                        label="Location"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 w-full md:w-auto self-start mt-4 md:mt-0">
                            {isEditing ? (
                                <>
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                                        <X className="h-4 w-4 mr-2" /> Cancel
                                    </Button>
                                    <Button onClick={handleSave} className="bg-primary-600 text-white">
                                        <Save className="h-4 w-4 mr-2" /> Save Changes
                                    </Button>
                                </>
                            ) : isOwnProfile ? (
                                <>
                                    <Button variant="outline" className="flex-1 md:flex-none" onClick={handleEdit}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                    <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
                                        <LogOut className="h-5 w-5" />
                                    </Button>
                                </>
                            ) : (
                                <Button className="bg-primary-600 text-white flex-1 md:flex-none px-8">
                                    Connect
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bio & Skills */}
                    <div className="mt-8 grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-4">
                            <h3 className="font-semibold text-gray-900">About</h3>
                            {isEditing ? (
                                <textarea
                                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Tell us about yourself..."
                                    value={formData.bio || ""}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            ) : (
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                    {profileUser.bio || "No bio added yet."}
                                </p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {(profileUser.skills || ['React', 'JavaScript']).map(skill => (
                                    <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Feed */}
                <div className="space-y-4">
                    {loadingTabs ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    ) : activeTab === 'Activity' && userPosts.length > 0 ? (
                        userPosts.map(post => (
                            post.type === 'JOB' ?
                                <JobCard key={`act-${post.id}`} job={post as JobPost} /> :
                                <PostCard key={`act-${post.id}`} post={post as Post} />
                        ))
                    ) : activeTab === 'Jobs' && userJobs.length > 0 ? (
                        userJobs.map(job => <JobCard key={job.id} job={job} />)
                    ) : activeTab === 'Saved' && savedPosts.length > 0 ? (
                        savedPosts.map(post => (
                            post.type === 'JOB' ?
                                <JobCard key={`saved-${post.id}`} job={post as JobPost} /> :
                                <PostCard key={`saved-${post.id}`} post={post as Post} />
                        ))
                    ) : (
                        <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500">
                            <p>No {activeTab.toLowerCase()} found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Group Modal/Section */}
            {isOwnProfile && showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Create a New Group</h2>
                            <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                <Input
                                    placeholder="e.g. Kerala Electricians"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Image</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setNewGroup({ ...newGroup, image: e.target.files?.[0] || null })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                    placeholder="What is this group about?"
                                    value={newGroup.description}
                                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                />
                            </div>
                            <Button className="w-full bg-primary-600 hover:bg-primary-700" onClick={handleCreateGroup}>
                                Create Group
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button for Create Group */}
            {isOwnProfile && (
                <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-30">
                    <Button
                        className="rounded-full shadow-lg h-14 w-14 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                        onClick={() => setShowCreateGroup(true)}
                        title="Create Group"
                    >
                        <Users className="h-6 w-6" />
                        <span className="sr-only">Create Group</span>
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                            <Plus className="h-4 w-4 text-indigo-600" />
                        </div>
                    </Button>
                </div>
            )}
        </div>
    );
}
