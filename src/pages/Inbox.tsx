import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import ChatWindow from "../components/chat/ChatWindow";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

interface Conversation {
    id: number;
    user: { id: number; name: string; avatar: string; role: string; online: boolean };
    lastMessage: string;
    time: string;
    unread: number;
}

export default function Inbox() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChat, setSelectedChat] = useState<number | null>(null);
    const [initialMessage, setInitialMessage] = useState<string>("");
    const [searchParams, setSearchParams] = useSearchParams();
    const userIdParam = searchParams.get('userId');
    const messageParam = searchParams.get('message');
    const { user: currentUser } = useAuth();
    const { lastMessage } = useWebSocket('/ws/chat/');

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await api.get('/messages/conversations/');
                const data = res.data;
                setConversations(data);

                // If userId param is present, try to find and select that chat
                if (userIdParam) {
                    const posterId = parseInt(userIdParam);
                    if (isNaN(posterId)) {
                        console.error("Invalid userId parameter:", userIdParam);
                        return;
                    }

                    const existingChat = data.find((c: Conversation) => Number(c.user.id) === posterId);
                    if (existingChat) {
                        setSelectedChat(Number(existingChat.id));
                    } else {
                        // Create a temporary conversation object for a new chat
                        try {
                            const userRes = await api.get(`/profiles/user/${posterId}/`);
                            const newUser = userRes.data;
                            // The profile model has user_name from the serializer, or name if it's the User object
                            const name = newUser.user_name || newUser.name || 'Unknown User';
                            const avatar = newUser.user_avatar || newUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

                            const tempConv: Conversation = {
                                id: posterId,
                                user: {
                                    id: posterId,
                                    name: name,
                                    avatar: avatar,
                                    role: newUser.role || 'Member',
                                    online: false
                                },
                                lastMessage: "Start a new conversation",
                                time: "Now",
                                unread: 0
                            };
                            setConversations(prev => {
                                // Double check it wasn't added already
                                if (prev.find(c => c.user.id === posterId)) return prev;
                                return [tempConv, ...prev];
                            });
                            setSelectedChat(posterId);
                        } catch (err) {
                            console.error("Failed to fetch user for new chat:", err);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch conversations:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, [userIdParam]);

    // When a message param comes in from URL, pre-fill it then remove from URL
    useEffect(() => {
        if (messageParam && selectedChat !== null) {
            setInitialMessage(decodeURIComponent(messageParam));
            // Clean up the URL so refreshing doesn't re-trigger
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.delete('message');
                return next;
            }, { replace: true });
        }
    }, [messageParam, selectedChat, setSearchParams]);

    // Handle real-time incoming messages for the inbox list
    useEffect(() => {
        if (lastMessage) {
            const senderId = Number(lastMessage.sender_id);
            const myId = currentUser?.id ? Number(currentUser.id) : null;

            setConversations(prev => {
                const isSentByMe = myId !== null && senderId === myId;
                const relevantUserId = isSentByMe ? Number(lastMessage.receiver_id) : senderId;

                // If we don't know this user yet, we could trigger a refetch, but for now just update if exists
                if (!prev.find(c => c.user.id === relevantUserId)) {
                    return prev;
                }

                // If the message is from someone else AND we are NOT currently chatting with them, increment unread
                const shouldIncrementUnread = !isSentByMe && selectedChat !== relevantUserId;

                const mapped = prev.map(c => {
                    if (c.user.id === relevantUserId) {
                        return {
                            ...c,
                            lastMessage: lastMessage.message,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            unread: shouldIncrementUnread ? c.unread + 1 : c.unread
                        };
                    }
                    return c;
                });

                // Move updated conversation to top
                const updatedConv = mapped.find(c => c.user.id === relevantUserId);
                if (updatedConv) {
                    return [updatedConv, ...mapped.filter(c => c.user.id !== relevantUserId)];
                }
                return mapped;
            });
        }
    }, [lastMessage, selectedChat, currentUser]);

    const activeChat = conversations.find(c => Number(c.id) === Number(selectedChat)) || null;

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-4rem)] flex bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm m-4 md:m-0">
            {/* Sidebar / Chat List */}
            <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col bg-white ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Chats</h1>
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                            <Search className="h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Messenger"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all text-gray-700 placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            No conversations yet.
                        </div>
                    ) : (
                        conversations.map((chat: Conversation) => (
                            <div
                                key={chat.id}
                                onClick={() => {
                                    setSelectedChat(Number(chat.id));
                                    if (chat.unread > 0) {
                                        // Mark as read in backend
                                        api.post('/messages/read/', { user_id: chat.id }).catch(console.error);
                                        // Update local state instantly
                                        setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                                    }
                                }}
                                className={`p-3 flex gap-3 cursor-pointer rounded-xl transition-all duration-200 group ${Number(selectedChat) === Number(chat.id) ? 'bg-blue-50' : 'hover:bg-gray-100/80'}`}
                            >
                                <div className="relative flex-shrink-0">
                                    <img src={chat.user.avatar} alt={chat.user.name} className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                    {chat.user.online && <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className={`font-semibold text-[15px] truncate ${chat.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{chat.user.name}</h3>
                                        <span className={`text-xs whitespace-nowrap ml-2 ${chat.unread > 0 ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{chat.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-[13px] truncate pr-2 ${chat.unread > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                            {chat.lastMessage}
                                        </p>
                                        {chat.unread > 0 && (
                                            <div className="h-4 w-4 bg-primary-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 shadow-sm shadow-primary-200">
                                                {chat.unread}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <ChatWindow
                    conversation={activeChat}
                    onBack={() => setSelectedChat(null)}
                    initialMessage={initialMessage}
                    onInitialMessageUsed={() => setInitialMessage("")}
                />
            </div>
        </div>
    );
}
