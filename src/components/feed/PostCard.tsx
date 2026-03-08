import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, MessageCircle, ThumbsUp, ThumbsDown, Share2, MapPin, CheckCircle2, Building2, Wrench, Check, X, Clock, Flag, UserX, Bookmark, Bell, Info, Code, PlusCircle, MinusCircle, Edit, Trash2, Save, Undo } from 'lucide-react';
import type { Post, JobPost, ServicePost } from '../../types';
import { usePosts } from "../../context/PostsContext";
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { ShareDialog } from './ShareDialog';
import CommentsSection from './CommentsSection';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    const navigate = useNavigate();
    const { requireAuth, user: currentUser } = useAuth();
    const isJob = post.type === 'JOB';
    const isService = post.type === 'SERVICE';
    const isNormal = post.type === 'NORMAL';

    const { joinGroup } = usePosts();
    // State for interactions
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(post.is_disliked || false);
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'received' | 'accepted' | 'self'>(
        (post as any).connection_status || post.user?.connection_status || 'none'
    );
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [dislikesCount, setDislikesCount] = useState(post.dislikes_count || 0);
    const [showMenu, setShowMenu] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [saved, setSaved] = useState(post.is_saved || false);
    const [interested, setInterested] = useState(post.is_interested || false);
    const [isHidden, setIsHidden] = useState(post.is_hidden || false);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.description || (post as any).content || '');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showReportPanel, setShowReportPanel] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportDone, setReportDone] = useState(false);

    const postOwnerId = post.user?.id || (post as any).created_by || (post as any).user_id;
    const isOwner = currentUser?.id?.toString() === postOwnerId?.toString();
    const isAdmin = currentUser?.is_staff || currentUser?.is_superuser;
    const canManage = isOwner || isAdmin;


    const menuRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(menuRef, () => setShowMenu(false));

    useEffect(() => {
        setLiked(post.is_liked || false);
        setDisliked(post.is_disliked || false);
        setLikesCount(post.likes_count || 0);
        setDislikesCount(post.dislikes_count || 0);
        setConnectionStatus((post as any).connection_status || post.user?.connection_status || 'none');
        setSaved(post.is_saved || false);
        setInterested(post.is_interested || false);
        setIsHidden(post.is_hidden || false);
    }, [post]);

    const getBaseUrl = () => {
        if (isJob) return `jobs/${post.id}`;
        if (isService) return `services/${post.id}`;
        return `posts/${post.id}`;
    };

    const handleLike = async () => {
        requireAuth(async () => {
            try {
                const response = await api.post(`${getBaseUrl()}/like/`);
                setLiked(response.data.status === 'liked');
                setDisliked(false);
                setLikesCount(response.data.likes_count);
                setDislikesCount(response.data.dislikes_count);
            } catch (err) {
                console.error("Like failed:", err);
            }
        });
    };

    const handleDislike = async () => {
        requireAuth(async () => {
            try {
                const response = await api.post(`${getBaseUrl()}/dislike/`);
                setDisliked(response.data.status === 'disliked');
                setLiked(false);
                setLikesCount(response.data.likes_count);
                setDislikesCount(response.data.dislikes_count);
            } catch (err) {
                console.error("Dislike failed:", err);
            }
        });
    };

    const toggleConnect = async () => {
        requireAuth(async () => {
            if (!post.user?.id) return;

            if (connectionStatus === 'pending') {
                setShowWithdrawConfirm(true);
                return;
            }

            try {
                if (connectionStatus === 'received') {
                    // Accept connection
                    await api.post(`/ profiles / user / ${post.user.id} /accept/`);
                    setConnectionStatus('accepted');
                } else {
                    // Toggle pending/connected state
                    const res = await api.post(`/ profiles / user / ${post.user.id} /connect/`);
                    setConnectionStatus(res.data.status === 'disconnected' ? 'none' : res.data.status);
                }
            } catch (err) {
                console.error("Connect failed:", err);
            }
        });
    };

    const confirmWithdraw = async () => {
        if (!post.user?.id) return;
        try {
            const res = await api.post(`/ profiles / user / ${post.user.id} /connect/`);
            setConnectionStatus(res.data.status === 'disconnected' ? 'none' : res.data.status);
            setShowWithdrawConfirm(false);
        } catch (err) {
            console.error("Withdraw failed:", err);
        }
    };

    const handleSave = async () => {
        requireAuth(async () => {
            try {
                const response = await api.post(`${getBaseUrl()}/save/`);
                setSaved(response.data.status === 'saved');
            } catch (err) {
                console.error("Save failed:", err);
            }
        });
    };

    const handleInterested = async () => {
        requireAuth(async () => {
            try {
                const response = await api.post(`${getBaseUrl()}/interested/`);
                setInterested(response.data.status === 'interested');
            } catch (err) {
                console.error("Interested failed:", err);
            }
        });
    };

    const handleHide = async () => {
        requireAuth(async () => {
            try {
                const response = await api.post(`${getBaseUrl()}/hide/`);
                setIsHidden(response.data.status === 'hidden');
                setShowMenu(false);
            } catch (err) {
                console.error("Hide failed:", err);
            }
        });
    };

    const handleSnooze = async () => {
        requireAuth(async () => {
            const userId = (post as any).created_by || (post as any).user_id || (typeof post.user === 'object' ? post.user?.id : post.user);
            if (!userId) return;
            try {
                await api.post(`/profiles/user/${userId}/snooze/`);
                setIsHidden(true); // Treat as hidden for current session
                setShowMenu(false);
            } catch (err) {
                console.error("Snooze failed:", err);
            }
        });
    };

    const handleBlock = async () => {
        requireAuth(async () => {
            const userId = (post as any).created_by || (post as any).user_id || (typeof post.user === 'object' ? post.user?.id : post.user);
            if (!userId) return;
            try {
                await api.post(`/accounts/user/${userId}/block/`);
                setIsHidden(true);
                setShowMenu(false);
            } catch (err) {
                console.error("Block failed:", err);
            }
        });
    };

    const handleReport = () => {
        requireAuth(() => {
            setShowReportPanel(true);
            setShowMenu(false);
        });
    };

    const submitReport = async () => {
        if (!reportReason) return;
        setReportSubmitting(true);
        const contentTypeParam = isJob ? 'job' : isService ? 'service' : 'post';
        try {
            await api.post(`${getBaseUrl()}/report/`, { reason: reportReason, content_type: contentTypeParam });
            setReportDone(true);
            setTimeout(() => {
                setShowReportPanel(false);
                setReportDone(false);
                setReportReason('');
            }, 2000);
        } catch (err) {
            console.error('Report failed:', err);
        } finally {
            setReportSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;

        setIsDeleting(true);
        try {
            await api.delete(`${getBaseUrl()}/`);
            setIsHidden(true); // Effectively remove from view
            setShowMenu(false);
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete post. Please try again.");
            setIsDeleting(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            const data = isJob || isService ? { description: editedContent } : { content: editedContent };
            await api.patch(`${getBaseUrl()}/`, data);

            // Update local state (in a real app, you might want to refresh the feed or use a global store)
            if (isNormal) (post as any).content = editedContent;
            else post.description = editedContent;

            setIsEditing(false);
            setShowMenu(false);
        } catch (err) {
            console.error("Edit failed:", err);
            alert("Failed to save changes. Please try again.");
        }
    };


    if (isHidden) {
        return (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between animate-in fade-in duration-300">
                <p className="text-sm text-gray-500 italic">Post hidden based on your preference.</p>
                <Button variant="ghost" size="sm" onClick={handleHide} className="text-primary-600 font-bold">Undo</Button>
            </div>
        );
    }


    if (showReportPanel) {
        const REPORT_REASONS = [
            { value: 'spam', label: 'Spam', desc: 'Irrelevant or misleading content' },
            { value: 'harassment', label: 'Harassment', desc: 'Bullying or threatening behaviour' },
            { value: 'hate_speech', label: 'Hate Speech', desc: 'Promotes hatred or discrimination' },
            { value: 'inappropriate', label: 'Inappropriate', desc: 'Violates community standards' },
            { value: 'other', label: 'Other', desc: 'Something else' },
        ];

        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-in fade-in duration-200">
                {reportDone ? (
                    <div className="flex flex-col items-center py-4 gap-3">
                        <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Report submitted</p>
                        <p className="text-xs text-gray-500">Thank you. We'll review this post.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">Report this post</h3>
                            <button onClick={() => setShowReportPanel(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Why are you reporting this?</p>
                        <div className="space-y-2 mb-4">
                            {REPORT_REASONS.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => setReportReason(r.value)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 ${reportReason === r.value
                                        ? 'border-red-400 bg-red-50'
                                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <p className={`text-sm font-semibold ${reportReason === r.value ? 'text-red-700' : 'text-gray-900'}`}>{r.label}</p>
                                    <p className="text-xs text-gray-500">{r.desc}</p>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowReportPanel(false); setReportReason(''); }} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={submitReport}
                                disabled={!reportReason || reportSubmitting}
                                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 relative">
            {/* Header */}
            <div className="p-4 flex items-start justify-between">
                <div className="flex gap-3">
                    <div
                        className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 cursor-pointer"
                        onClick={() => {
                            const uid = post.user?.id || (post as any).user_id || (post as any).created_by;
                            if (uid) navigate(`/profile/${uid}`);
                        }}
                    >
                        {(post.user?.avatar || (post as any).user_avatar) ? (
                            <img src={post.user?.avatar || (post as any).user_avatar} alt={post.user?.name || (post as any).user_name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm font-bold">
                                {(post.user?.name?.[0] || (post as any).user_name?.[0]) || 'U'}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex flex-col">
                            {post.group || (post as any).group_details ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="font-bold text-gray-900 text-sm hover:underline cursor-pointer"
                                            onClick={() => {
                                                const gid = post.group?.id || (post as any).group_details?.id;
                                                if (gid) navigate(`/groups/${gid}`);
                                            }}
                                        >
                                            {(post.group?.name || (post as any).group_details?.name)}
                                        </span>
                                        {/* Join Button for Group */}
                                        {!(post.group?.is_member || (post as any).group_details?.is_member) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const gid = post.group?.id || (post as any).group_details?.id;
                                                    if (gid) joinGroup(gid);
                                                }}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full"
                                            >
                                                Join
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <span>{post.user?.name || (post as any).user_name}</span>
                                        {(post.user?.verified || (post as any).is_verified) && <CheckCircle2 className="h-3 w-3 text-blue-500 fill-blue-50" />}
                                        <span>•</span>
                                        <span>{post.postedAt || ((post as any).created_at ? new Date((post as any).created_at).toLocaleDateString() : '')}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h3
                                        className="font-semibold text-gray-900 text-sm hover:underline cursor-pointer"
                                        onClick={() => {
                                            const uid = post.user?.id || (post as any).user_id || (post as any).created_by;
                                            if (uid) navigate(`/profile/${uid}`);
                                        }}
                                    >
                                        {post.user?.name || (post as any).user_name || "Unknown User"}
                                    </h3>
                                    {(post.user?.verified || (post as any).is_verified) && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-50" />}

                                    {/* Connect Button — hide for own posts */}
                                    {connectionStatus !== 'self' && (
                                        <button
                                            onClick={toggleConnect}
                                            className={cn(
                                                "text-xs font-semibold transition-colors duration-200 ml-1 flex items-center gap-0.5",
                                                connectionStatus === 'accepted' ? "text-green-600" :
                                                    connectionStatus === 'pending' ? "text-gray-500 hover:text-gray-700" :
                                                        "text-blue-600 hover:text-blue-800"
                                            )}
                                        >
                                            {connectionStatus === 'accepted' ? <><Check className="h-3 w-3" /> Connected</> :
                                                connectionStatus === 'pending' ? <><Clock className="h-3 w-3" /> Withdraw</> :
                                                    connectionStatus === 'received' ? "Accept" : "• Connect"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            {((post.user?.role) || (post as any).user_role) && (
                                <span className={cn(
                                    "hidden sm:inline-block px-1.5 py-0.5 rounded-full font-medium border mr-1",
                                    (post.user?.role || (post as any).user_role) === 'worker' ? "bg-teal-50 text-teal-700 border-teal-100" :
                                        (post.user?.role || (post as any).user_role) === 'employer' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                            "bg-gray-50 text-gray-600 border-gray-100"
                                )}>
                                    {post.user?.role || (post as any).user_role}
                                </span>
                            )}
                            {!post.group && <span>{post.postedAt || ((post as any).created_at ? new Date((post as any).created_at).toLocaleDateString() : '')}</span>}
                            {post.location && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {post.location}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="relative" ref={menuRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-600 relative z-10"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="py-2">
                                {/* Interest Group */}
                                <div className="px-2 pb-2 border-b border-gray-100">
                                    <div
                                        className={cn("rounded-lg transition-colors cursor-pointer group", interested ? "bg-blue-50" : "hover:bg-gray-50")}
                                        onClick={handleInterested}
                                    >
                                        <div className="flex items-start gap-3 p-2">
                                            <PlusCircle className={cn("h-5 w-5 mt-0.5", interested ? "text-blue-600 fill-blue-50" : "text-gray-800")} strokeWidth={2.5} />
                                            <div>
                                                <h4 className={cn("text-sm font-semibold", interested ? "text-blue-700" : "text-gray-900")}>Interested</h4>
                                                <p className="text-xs text-gray-500">More of your posts will be like this.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group mt-1"
                                        onClick={handleHide}
                                    >
                                        <div className="flex items-start gap-3 p-2">
                                            <MinusCircle className="h-5 w-5 text-gray-800 mt-0.5" strokeWidth={2.5} />
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900">Not interested</h4>
                                                <p className="text-xs text-gray-500">Fewer of your posts will be like this.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Group */}
                                <div className="px-2 py-2 border-b border-gray-100">
                                    <button
                                        className={cn("w-full text-left flex items-start gap-3 p-2 rounded-lg transition-colors", saved ? "bg-amber-50" : "hover:bg-gray-50")}
                                        onClick={handleSave}
                                    >
                                        <Bookmark className={cn("h-5 w-5 mt-0.5", saved ? "text-amber-600 fill-amber-600" : "text-gray-800 fill-current")} />
                                        <div>
                                            <h4 className={cn("text-sm font-semibold", saved ? "text-amber-700" : "text-gray-900")}>{saved ? "Saved" : "Save Post"}</h4>
                                            <p className="text-xs text-gray-500">Add this to your saved items.</p>
                                        </div>
                                    </button>
                                    <button className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors mt-1">
                                        <Bell className="h-5 w-5 text-gray-800 fill-current" />
                                        <h4 className="text-sm font-semibold text-gray-900">Turn on notifications for this post</h4>
                                    </button>
                                    <button className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors mt-1">
                                        <Info className="h-5 w-5 text-gray-800 fill-current" />
                                        <h4 className="text-sm font-semibold text-gray-900">Why am I seeing this post?</h4>
                                    </button>
                                    <button className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors mt-1">
                                        <Code className="h-5 w-5 text-gray-800" />
                                        <h4 className="text-sm font-semibold text-gray-900">Embed</h4>
                                    </button>
                                </div>

                                {/* Moderation Group */}
                                <div className="px-2 pt-2 bg-gray-50/50">
                                    <button
                                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        onClick={handleHide}
                                    >
                                        <div className="bg-gray-800 rounded-sm p-0.5">
                                            <X className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Hide post</h4>
                                            <p className="text-xs text-gray-500">See fewer posts like this.</p>
                                        </div>
                                    </button>
                                    <button
                                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors mt-1"
                                        onClick={handleSnooze}
                                    >
                                        <Clock className="h-5 w-5 text-gray-800 mt-0.5 fill-current" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Snooze {post.user?.name || (post as any).user_name || 'User'} for 30 days</h4>
                                            <p className="text-xs text-gray-500">Temporarily stop seeing posts.</p>
                                        </div>
                                    </button>
                                    <button
                                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors mt-1"
                                        onClick={toggleConnect}
                                    >
                                        <div className="bg-gray-800 rounded-sm p-0.5 mt-0.5">
                                            <X className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                {connectionStatus === 'accepted' ? 'Disconnect' :
                                                    connectionStatus === 'pending' ? 'Cancel Request' :
                                                        connectionStatus === 'received' ? 'Accept Request' :
                                                            'Connect with User'}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {connectionStatus === 'accepted' ? 'Remove from your network.' :
                                                    connectionStatus === 'pending' ? 'Withdraw your request.' :
                                                        connectionStatus === 'received' ? 'Accept their request.' :
                                                            'Add to your relationships.'}
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors mt-1"
                                        onClick={handleReport}
                                    >
                                        <Flag className="h-5 w-5 text-gray-800 mt-0.5 fill-current" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Report post</h4>
                                            <p className="text-xs text-gray-500">We won't let {post.user?.name || (post as any).user_name || 'User'} know.</p>
                                        </div>
                                    </button>
                                    <button
                                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors mt-1"
                                        onClick={handleBlock}
                                    >
                                        <UserX className="h-5 w-5 text-gray-800 mt-0.5 fill-current" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Block {post.user?.name || (post as any).user_name || 'User'}'s profile</h4>
                                            <p className="text-xs text-gray-500">You won't be able to see or contact each other.</p>
                                        </div>
                                    </button>
                                </div>

                                {/* Management Actions for Owner/Admin */}
                                {canManage && (
                                    <div className="px-2 py-2 bg-red-50/30">
                                        <button
                                            className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                            onClick={() => {
                                                setIsEditing(true);
                                                setShowMenu(false);
                                            }}
                                        >
                                            <Edit className="h-5 w-5 text-blue-600" />
                                            <h4 className="text-sm font-semibold text-blue-700">Edit Post</h4>
                                        </button>
                                        <button
                                            className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors mt-1"
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-5 w-5 text-red-600" />
                                            <h4 className="text-sm font-semibold text-red-600">{isDeleting ? "Deleting..." : "Delete Post"}</h4>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Content */}
            <div className="px-4 pb-2">
                {/* Title & Badges for structured posts */}
                {!isNormal && (
                    <div className="mb-3">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">{post.title}</h2>
                                {isJob && (
                                    <p className="flex items-center gap-1.5 text-sm text-gray-600">
                                        <Building2 className="h-4 w-4 text-gray-400" />
                                        {(post as JobPost).company || (post as any).company_name}
                                    </p>
                                )}
                                {isService && (
                                    <p className="flex items-center gap-1.5 text-sm text-teal-700 font-medium">
                                        <Wrench className="h-4 w-4" />
                                        {(post as ServicePost).category || (post as any).category}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant={isJob ? 'secondary' : 'default'} className={isService ? "bg-teal-100 text-teal-800" : ""}>
                                {isJob ? ((post as JobPost).jobType || (post as any).job_type) : ((post as ServicePost).rate || (post as any).salary_min)}
                            </Badge>
                            {isJob && <Badge variant="outline" className="text-gray-600 border-gray-200">{(post as JobPost).salary || (post as any).salary_min}</Badge>}
                        </div>
                    </div>
                )}

                {/* Normal Post Title/Text */}
                {isNormal && post.title && (
                    <h2 className="text-base font-medium text-gray-900 mb-2">{post.title}</h2>
                )}

                {/* Description */}
                {(post.description || (post as any).content) && !isEditing && (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed mb-3">
                        {post.description || (post as any).content}
                    </p>
                )}

                {/* Edit Form */}
                {isEditing && (
                    <div className="mb-4 animate-in fade-in duration-200">
                        <textarea
                            className="w-full p-3 border border-blue-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] mb-2"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            placeholder="Edit your post..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditing(false)}
                                className="text-gray-500 hover:bg-gray-100 rounded-full px-4"
                            >
                                <Undo className="h-4 w-4 mr-1.5" />
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 shadow-sm"
                            >
                                <Save className="h-4 w-4 mr-1.5" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Images */}
            {(post.images || (post as any).image) && (
                <div className={cn("mt-2", (post.images?.length || 0) > 1 ? "grid grid-cols-2 gap-0.5" : "")}>
                    {post.images ? post.images.map((img, idx) => (
                        <div key={idx} className={cn("relative bg-gray-100", post.images!.length === 1 ? "aspect-video" : "aspect-square")}>
                            <img
                                src={img}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/6b7280?text=Image+Not+Found';
                                }}
                            />
                        </div>
                    )) : (post as any).image && (
                        <div className="relative bg-gray-100 aspect-video">
                            <img
                                src={(post as any).image}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/6b7280?text=Image+Not+Found';
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Likes Count (FB Style) */}
            <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="bg-blue-500 rounded-full p-1 text-white">
                        <ThumbsUp className="h-2 w-2 fill-white" />
                    </div>
                    <span>{likesCount} likes</span>
                </div>
                <span>{(post as any).comments_count || 0} comments</span>
            </div>

            {/* Footer / Actions */}
            <div className="px-2 py-1 border-t border-gray-100 flex items-center justify-between mt-0">
                <div className="flex gap-1 flex-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLike}
                        className={cn(
                            "flex-1 gap-2 hover:bg-gray-50 transition-colors",
                            (liked || (post as any).is_liked) ? "text-blue-600 font-medium" : "text-gray-600"
                        )}
                    >
                        <ThumbsUp className={cn("h-5 w-5", (liked || (post as any).is_liked) && "fill-current")} />
                        <span className="text-sm font-medium">Like</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDislike}
                        className={cn("flex-1 gap-2 hover:bg-gray-50", disliked ? "text-red-600 font-medium" : "text-gray-600")}
                    >
                        <ThumbsDown className={cn("h-5 w-5", disliked ? "fill-current" : "")} />
                        <span className="text-sm font-medium">Dislike {dislikesCount > 0 && `(${dislikesCount})`}</span>
                    </Button>

                    {/* Comment Button - Desktop (Toggle) */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("hidden md:flex flex-1 gap-2 hover:bg-gray-50", showComments ? "text-blue-600 bg-blue-50" : "text-gray-600")}
                        onClick={() => setShowComments(!showComments)}
                    >
                        <MessageCircle className={cn("h-5 w-5", showComments && "fill-current")} />
                        <span className="text-sm font-medium">Comment</span>
                    </Button>

                    {/* Comment Button - Mobile (Navigate) */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex md:hidden flex-1 gap-2 text-gray-600 hover:bg-gray-50"
                        onClick={() => navigate(`/post/${post.id}`)}
                    >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Comment</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-gray-600 hover:bg-gray-50"
                        onClick={() => setShowShareDialog(true)}
                    >
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Share</span>
                    </Button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-3 pt-0 flex justify-end gap-2">
                {isJob && (
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm px-5 rounded-full flex-1 sm:flex-none" onClick={() => {
                        const userId = (post as any).created_by || (post as any).user_id || (typeof post.user === 'object' ? post.user?.id : post.user);
                        const jobTitle = post.title || 'this position';
                        const autoMsg = `Hi! I'm interested in the "${jobTitle}" role. Can you share more details?`;
                        requireAuth(() => navigate(`/inbox?userId=${userId}&message=${encodeURIComponent(autoMsg)}`));
                    }}>
                        Apply Now
                    </Button>
                )}
                {isService && (
                    <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm px-5 rounded-full flex-1 sm:flex-none"
                        onClick={() => {
                            const userId = (post as any).created_by || (post as any).user_id || (typeof post.user === 'object' ? post.user?.id : post.user);
                            const serviceTitle = post.title || 'your service';
                            const autoMsg = `Hi! I'm interested in "${serviceTitle}". Can we discuss availability and pricing?`;
                            requireAuth(() => navigate(`/inbox?userId=${userId}&message=${encodeURIComponent(autoMsg)}`));
                        }}
                    >
                        Contact
                    </Button>
                )}
                {isNormal && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-primary-200 text-primary-700 hover:bg-primary-50 px-5 rounded-full flex-1 sm:flex-none"
                        onClick={() => {
                            const userId = (post as any).created_by || (post as any).user_id || (typeof post.user === 'object' ? post.user?.id : post.user);
                            const autoMsg = `Hi! I saw your post and wanted to reach out.`;
                            requireAuth(() => navigate(`/inbox?userId=${userId}&message=${encodeURIComponent(autoMsg)}`));
                        }}
                    >
                        Message
                    </Button>
                )}
            </div>

            <ShareDialog isOpen={showShareDialog} onClose={() => setShowShareDialog(false)} post={post} />

            {/* Comments Section */}
            {showComments && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                    <CommentsSection
                        postId={post.id.toString()}
                        type={isJob ? 'job' : isService ? 'service' : 'post'}
                    />
                </div>
            )}

            {/* Withdraw Confirmation Modal */}
            {showWithdrawConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full mb-4">
                                <UserX className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Withdraw Request?</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Are you sure you want to withdraw your connection request to <span className="font-semibold text-gray-700">{post.user?.name || (post as any).user_name}</span>?
                            </p>
                            <div className="flex gap-3 w-full">
                                <Button variant="outline" className="flex-1" onClick={() => setShowWithdrawConfirm(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmWithdraw}>
                                    Withdraw
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
