import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePosts } from '../context/PostsContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { type Group, type Post as PostType } from '../types';
import { PostCard } from '../components/feed/PostCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Users, MessageCircle, Newspaper, Send, ChevronLeft, Info, Mic, Square, Trash2, Volume2, Image as ImageIcon } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function GroupDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { joinGroup, leaveGroup } = usePosts();
    const { user } = useAuth();
    const [group, setGroup] = useState<Group | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'posts' | 'chat'>('posts');
    const [loading, setLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const { sendMessage, lastMessage, readyState } = useWebSocket('/ws/chat/');

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                if (!group) setLoading(true);
                const [groupRes, postsRes] = await Promise.all([
                    api.get(`/groups/${id}/`),
                    api.get(`/feed/?group_id=${id}`)
                ]);
                setGroup(groupRes.data);
                setPosts(postsRes.data);

                if (activeTab === 'chat' || groupRes.data.is_member) {
                    const msgsRes = await api.get(`/messages/?group_id=${id}`);
                    setMessages(msgsRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch group data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchGroupData();
    }, [id]);

    useEffect(() => {
        if (readyState === WebSocket.OPEN && id) {
            sendMessage({
                action: 'subscribe_group',
                group_id: parseInt(id)
            });
        }
    }, [readyState, id]);

    useEffect(() => {
        if (lastMessage && lastMessage.group_id?.toString() === id?.toString()) {
            setMessages(prev => [...prev, lastMessage]);
        }
    }, [lastMessage, id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !id) return;
        sendMessage({
            content: newMessage,
            group_id: parseInt(id),
            type: 'text'
        });
        setNewMessage('');
    };

    const handleDeleteGroup = async () => {
        if (!window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) return;

        try {
            await api.delete(`/groups/${id}/`);
            navigate('/');
        } catch (err: any) {
            console.error("Failed to delete group:", err);
            alert(err.response?.data?.error || "Failed to delete community.");
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('attachment', audioBlob, 'voice_message.webm');
                formData.append('message_type', 'audio');
                formData.append('group_id', id!);

                try {
                    // Send voice message via API as it contains binary data
                    // Let axios set the correct Content-Type with boundary automatically
                    await api.post('/messages/', formData);
                    // The backend will broadcast the message via WebSocket
                } catch (err: any) {
                    console.error("Failed to send voice message:", err.response?.data || err.message);
                    alert(`Could not send voice message: ${err.response?.data?.detail || "Please try again."}`);
                }
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Failed to access microphone:", err);
            alert("Microphone access is required for voice messages.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const cancelRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.onstop = null; // Prevent sending
            mediaRecorder.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        const formData = new FormData();
        formData.append('attachment', file);
        formData.append('message_type', 'image');
        formData.append('group_id', id);

        try {
            await api.post('/messages/', formData);
        } catch (err: any) {
            console.error("Failed to send image:", err.response?.data || err.message);
            alert("Could not send image. Please try again.");
        }

        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Community...</div>;
    if (!group) return <div className="p-8 text-center text-gray-500">Community not found.</div>;

    return (
        <div className="max-w-[800px] mx-auto pb-20">
            {/* Header */}
            <div className="bg-white rounded-b-2xl shadow-sm border-x border-b border-gray-100 overflow-hidden mb-6">
                <div className="h-32 md:h-48 bg-gradient-to-r from-primary-600 to-secondary-600 relative">
                    {group.banner && <img src={group.banner} className="w-full h-full object-cover" alt="Banner" />}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 text-white rounded-full"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </div>
                <div className="px-6 pb-6 relative">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12 mb-4">
                        <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg border-2 border-white">
                            <div className="h-full w-full rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden">
                                {group.image ? <img src={group.image} className="h-full w-full object-cover" alt={group.name} /> : <Users className="h-10 w-10 text-primary-600" />}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                            <p className="text-gray-500 flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4" />
                                {group.members_count} members
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {Number(user?.id) === Number(group.created_by) && (
                                <Button
                                    variant="outline"
                                    onClick={handleDeleteGroup}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Community
                                </Button>
                            )}
                            <Button
                                variant={group.is_member ? "outline" : "default"}
                                onClick={() => group.is_member ? leaveGroup(group.id) : joinGroup(group.id)}
                            >
                                {group.is_member ? "Joined" : "Join Community"}
                            </Button>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">{group.description}</p>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'posts' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            <Newspaper className="h-4 w-4" />
                            Feed
                        </button>
                        <button
                            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            <MessageCircle className="h-4 w-4" />
                            Live Chat
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-4">
                {activeTab === 'posts' ? (
                    <div className="space-y-4">
                        {posts.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl text-center border border-dashed border-gray-200">
                                <Info className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No posts in this community yet.</p>
                            </div>
                        ) : (
                            posts.map(post => <PostCard key={post.id} post={post} />)
                        )}
                    </div>
                ) : (
                    /* Chat Tab */
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px] overflow-hidden">
                        {!group.is_member ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                                <Users className="h-16 w-16 text-gray-200 mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Join to Chat</h3>
                                <p className="text-gray-500 text-sm max-w-xs mb-6">You must be a member of this community to participate in the live chat.</p>
                                <Button onClick={() => joinGroup(group.id)}>Join Community</Button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* Messages List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60 px-8">
                                            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                                <MessageCircle className="h-8 w-8 text-primary-400" />
                                            </div>
                                            <p className="text-gray-900 font-bold mb-1">Live Community Chat</p>
                                            <p className="text-xs text-gray-500">Be the first to start the conversation! Your messages will be seen by all members.</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, idx) => (
                                            <div key={idx} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.sender_id === user?.id ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                                    {msg.sender_id !== user?.id && <p className="text-[10px] font-bold opacity-70 mb-1">{msg.sender_name}</p>}
                                                    {msg.message_type === 'audio' ? (
                                                        <div className="flex items-center gap-2 py-1">
                                                            <Volume2 className="h-4 w-4" />
                                                            <audio src={msg.attachment || msg.audio} controls className="h-8 w-40 brightness-90 contrast-125" />
                                                        </div>
                                                    ) : msg.message_type === 'image' ? (
                                                        <div className="rounded-lg overflow-hidden mt-1">
                                                            <img src={msg.attachment || msg.content} alt="Shared" className="max-w-full h-auto" />
                                                        </div>
                                                    ) : (
                                                        msg.message || msg.content
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input Area */}
                                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                                    {isRecording ? (
                                        <div className="flex items-center gap-3 bg-red-50 p-2 rounded-full px-4 animate-pulse">
                                            <div className="h-2 w-2 rounded-full bg-red-500" />
                                            <span className="text-red-600 font-mono text-sm flex-1">{formatTime(recordingTime)}</span>
                                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-500 h-8 w-8" onClick={cancelRecording}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" className="bg-red-500 hover:bg-red-600 h-8 w-8 rounded-full" onClick={stopRecording}>
                                                <Square className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                ref={imageInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-primary-600 rounded-full flex-shrink-0" onClick={() => imageInputRef.current?.click()}>
                                                <ImageIcon className="h-5 w-5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-gray-400 hover:text-primary-600 rounded-full flex-shrink-0" onClick={startRecording}>
                                                <Mic className="h-5 w-5" />
                                            </Button>
                                            <Input
                                                placeholder="Message community..."
                                                className="rounded-full flex-1 bg-white"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            />
                                            <Button size="icon" className="rounded-full flex-shrink-0" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                                                <Send className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
