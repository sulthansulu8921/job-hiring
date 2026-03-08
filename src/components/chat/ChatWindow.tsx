import { Button } from "../ui/Button";
import { ArrowLeft, Send, Loader2, Image as ImageIcon, Mic, Smile, MoreVertical, ThumbsUp, MessageCircle as MessageCircleIcon, Edit2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface Message {
    id: string;
    text?: string;
    content?: string;
    type: 'text' | 'image' | 'audio' | 'sticker';
    isMe: boolean;
    time: string;
}

interface ChatWindowProps {
    conversation: {
        id: number;
        user: { id: number; name: string; avatar: string; role: string; online: boolean };
    } | null;
    onBack?: () => void;
    initialMessage?: string;
    onInitialMessageUsed?: () => void;
}

const STICKERS = ["👍", "👋", "❤️", "😂", "😮", "😢", "🎉", "🔥"];

export default function ChatWindow({ conversation, onBack, initialMessage = "", onInitialMessageUsed }: ChatWindowProps) {
    const { user: currentUser } = useAuth();
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showStickers, setShowStickers] = useState(false);

    // Edit/Delete features
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editInput, setEditInput] = useState("");
    const [activeMsgId, setActiveMsgId] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { sendMessage, lastMessage } = useWebSocket('/ws/chat/');

    // Fetch message history
    useEffect(() => {
        if (conversation) {
            setMessages([]); // Clear messages when conversation changes
            const fetchMessages = async () => {
                setLoading(true);
                try {
                    const res = await api.get(`/messages/?user_id=${conversation.user.id}`);
                    const myId = currentUser?.id ? Number(currentUser.id) : null;

                    // Handle both paginated and non-paginated responses gracefully
                    const messageList = Array.isArray(res.data) ? res.data : (res.data.results || []);

                    const mappedMessages: Message[] = messageList.map((m: any) => ({
                        id: m.id.toString(),
                        text: m.content,
                        content: m.attachment || m.content,
                        type: m.message_type || 'text',
                        isMe: myId !== null ? Number(m.sender_id) === myId : Number(m.sender_id) !== Number(conversation.user.id),
                        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }));
                    setMessages(mappedMessages);
                } catch (err) {
                    console.error("Failed to fetch message history:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchMessages();
        }
    }, [conversation, currentUser]);

    // Handle incoming real-time messages via WebSocket
    useEffect(() => {
        if (!lastMessage || !conversation) return;

        const myId = currentUser?.id ? Number(currentUser.id) : null;
        const msgSenderId = Number(lastMessage.sender_id);
        const msgReceiverId = Number(lastMessage.receiver_id);
        const otherUserId = Number(conversation.user.id);

        // Accept messages that are part of this conversation
        const isRelevant =
            (msgSenderId === otherUserId) || // They sent to me
            (myId !== null && msgSenderId === myId && msgReceiverId === otherUserId); // I sent to them (echo)

        if (isRelevant) {
            if (lastMessage.event_type === 'message_deleted') {
                setMessages(prev => prev.filter(m => m.id !== lastMessage.message_id?.toString()));
                return;
            }
            if (lastMessage.event_type === 'message_edited') {
                setMessages(prev => prev.map(m => m.id === lastMessage.message_id?.toString() ? { ...m, text: lastMessage.message, content: lastMessage.message } : m));
                return;
            }

            const isMe = myId !== null && msgSenderId === myId;
            const incomingMsg: Message = {
                id: lastMessage.message_id ? lastMessage.message_id.toString() : Date.now().toString(),
                text: lastMessage.message,
                content: lastMessage.attachment || lastMessage.message,
                type: lastMessage.message_type || 'text',
                isMe,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => {
                // Prevent duplicate echoes if message_id exists
                if (incomingMsg.id && prev.some(m => m.id === incomingMsg.id)) return prev;
                return [...prev, incomingMsg];
            });
        }
    }, [lastMessage, conversation, currentUser]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isRecording]);

    // Pre-fill input with auto-generated message if provided
    useEffect(() => {
        if (initialMessage) {
            setInput(initialMessage);
            onInitialMessageUsed?.();
        }
    }, [initialMessage]);

    const handleSend = async (type: 'text' | 'image' | 'audio' | 'sticker' = 'text', content: string = input) => {
        if (!content.trim() && (type === 'text' || type === 'sticker')) return;
        if (!conversation) return;

        if (type === 'text' || type === 'sticker') {
            if (type === 'text') setInput("");
            setShowStickers(false);
            // Send via WebSocket — the echo back will add the message to the UI
            sendMessage({
                content: content,
                receiver_id: conversation.user.id
            });
        } else {
            // For images/audio, add optimistically (not fully implemented in backend yet)
            const newMessage: Message = {
                id: Date.now().toString(),
                content: content,
                type: type,
                isMe: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, newMessage]);
            setShowStickers(false);
        }
    };


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && conversation) {
            const formData = new FormData();
            formData.append('receiver', conversation.user.id.toString());
            formData.append('message_type', 'image');
            formData.append('attachment', file);

            try {
                await api.post('/messages/send/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                // Success: The WebSocket will broadcast the message back to us to render it.
            } catch (err) {
                console.error("Failed to upload image:", err);
            }

            // clear the input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });

                if (conversation) {
                    const formData = new FormData();
                    formData.append('receiver', conversation.user.id.toString());
                    formData.append('message_type', 'audio');
                    formData.append('attachment', file);

                    try {
                        await api.post('/messages/send/', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    } catch (err) {
                        console.error("Failed to send audio:", err);
                    }
                }

                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Microphone access denied or error:", err);
            alert("Please allow microphone permissions to send voice messages.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        try {
            await api.delete(`/messages/${msgId}/`);
            // UI will update via WebSocket broadcast
        } catch (err) {
            console.error("Failed to delete message:", err);
        }
    };

    const handleStartEdit = (msgId: string, text: string) => {
        setEditingMsgId(msgId);
        setEditInput(text);
    };

    const handleSaveEdit = async () => {
        if (!editingMsgId || !editInput.trim()) return;
        try {
            await api.put(`/messages/${editingMsgId}/`, { content: editInput });
            setEditingMsgId(null);
            setEditInput("");
        } catch (err) {
            console.error("Failed to edit message:", err);
        }
    };

    const handleClearChat = async () => {
        if (!conversation || !window.confirm("Are you sure you want to clear this entire chat history?")) return;
        try {
            await api.delete(`/messages/conversations/${conversation.user.id}/`);
            setMessages([]);
            setShowMenu(false);
        } catch (err) {
            console.error("Failed to clear chat:", err);
        }
    };

    if (!conversation) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white">
                <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <MessageCircleIcon className="h-10 w-10 text-primary-200" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your Messages</h3>
                <p className="max-w-xs text-center text-sm text-gray-500">Select a chat from the sidebar to start messaging or finding new jobs.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center shadow-sm z-20 bg-white/90 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2 text-primary-600">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    )}
                    <div className="relative group cursor-pointer">
                        <div className="h-10 w-10 rounded-full overflow-hidden relative ring-2 ring-gray-100">
                            <img src={conversation.user.avatar} alt={conversation.user.name} className="h-full w-full object-cover" />
                        </div>
                        {conversation.user.online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-[15px] leading-tight cursor-pointer hover:underline">{conversation.user.name}</h3>
                        <p className="text-xs text-gray-500 font-medium">{conversation.user.online ? 'Active now' : conversation.user.role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative">
                    <button onClick={() => setShowMenu(!showMenu)}>
                        <MoreVertical className="h-6 w-6 text-primary-600 cursor-pointer hover:text-primary-700 transition-colors" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                            <button
                                onClick={handleClearChat}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white scrollbar-thin scrollbar-thumb-gray-200">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                        <img src={conversation.user.avatar} className="h-20 w-20 rounded-full mb-2" />
                        <div>
                            <p className="text-lg font-medium text-gray-900">{conversation.user.name}</p>
                            <p className="text-sm text-gray-500">You're friends on Thozhilurappu</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => {
                            const isSequence = idx > 0 && messages[idx - 1].isMe === msg.isMe;
                            return (
                                <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                                    {!msg.isMe && !isSequence && (
                                        <img src={conversation.user.avatar} className="h-7 w-7 rounded-full mr-2 self-end mb-1" />
                                    )}
                                    {!msg.isMe && isSequence && <div className="w-9" />} {/* Spacer for avatar alignment */}

                                    <div
                                        className={`max-w-[70%] ${msg.type === 'text' ? `px-4 py-2 text-[15px]` : 'p-0 overflow-hidden'} rounded-[20px] shadow-sm relative transition-all duration-200 cursor-pointer select-none
                                        ${msg.isMe
                                                ? 'bg-primary-600 text-white rounded-br-sm'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-sm'}
                                        ${msg.type === 'sticker' ? 'bg-transparent shadow-none !p-0 !text-4xl' : ''}
                                    `}
                                        onTouchStart={() => {
                                            if (msg.isMe && msg.type === 'text' && msg.id !== editingMsgId) {
                                                longPressTimerRef.current = setTimeout(() => {
                                                    setActiveMsgId(msg.id);
                                                }, 500); // 500ms hold
                                            }
                                        }}
                                        onTouchEnd={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                                        onTouchMove={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}

                                        onMouseDown={() => {
                                            if (msg.isMe && msg.type === 'text' && msg.id !== editingMsgId) {
                                                longPressTimerRef.current = setTimeout(() => {
                                                    setActiveMsgId(msg.id);
                                                }, 500);
                                            }
                                        }}
                                        onMouseUp={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                                        onMouseLeave={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                                    >
                                        {msg.type === 'text' && (
                                            msg.id === editingMsgId ? (
                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    <input
                                                        autoFocus
                                                        value={editInput}
                                                        onChange={e => setEditInput(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleSaveEdit();
                                                            if (e.key === 'Escape') setEditingMsgId(null);
                                                        }}
                                                        className="text-gray-900 px-2 py-1 rounded text-sm w-full"
                                                    />
                                                    <div className="flex justify-end gap-2 text-xs">
                                                        <button onClick={(e) => { e.stopPropagation(); setEditingMsgId(null); setActiveMsgId(null); }} className="text-gray-300 hover:text-white z-10 relative">Cancel</button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); setActiveMsgId(null); }} className="text-white font-medium hover:underline z-10 relative">Save</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p>{msg.text}</p>
                                            )
                                        )}

                                        {msg.type === 'image' && (
                                            <div className="relative group cursor-pointer">
                                                <img src={msg.content} alt="Attachment" className="max-w-full h-auto rounded-lg" />
                                            </div>
                                        )}

                                        {msg.type === 'audio' && (
                                            <div className={`flex items-center gap-2 p-2 rounded-xl overflow-hidden ${msg.isMe ? 'bg-primary-700/20' : 'bg-gray-200'} `}>
                                                <audio controls src={msg.content} className="h-10 w-[220px]" />
                                            </div>
                                        )}

                                        {msg.type === 'sticker' && (
                                            <div className="text-6xl animate-bounce-in">
                                                {msg.content}
                                            </div>
                                        )}
                                    </div>

                                    {/* Edit / Delete Long Press Actions */}
                                    {msg.id === activeMsgId && msg.id !== editingMsgId && (
                                        <div className="animate-in fade-in slide-in-from-left-2 flex items-center gap-1 mr-2 bg-gray-50/90 backdrop-blur-md rounded-xl px-2 shadow-md border border-gray-200 z-10">
                                            <button onClick={() => { handleStartEdit(msg.id, msg.text || ""); setActiveMsgId(null); }} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit message">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => { handleDeleteMessage(msg.id); setActiveMsgId(null); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete message">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => setActiveMsgId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium">
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {isRecording && (
                            <div className="flex justify-end mt-2 animate-in slide-in-from-bottom-2">
                                <div className="bg-red-500 text-white px-5 py-2.5 rounded-2xl rounded-br-none shadow-md flex items-center gap-3">
                                    <div className="h-2 w-2 bg-white rounded-full animate-ping"></div>
                                    <span className="font-medium text-sm">
                                        Recording ({Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')})
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 sticky bottom-0 z-30">
                {showStickers && (
                    <div className="absolute bottom-full left-4 mb-2 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 grid grid-cols-4 gap-4 animate-in slide-in-from-bottom-2">
                        {STICKERS.map(sticker => (
                            <button
                                key={sticker}
                                onClick={() => setInput(prev => prev + sticker)}
                                className="text-3xl hover:scale-125 transition-transform"
                            >
                                {sticker}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                    <div className="flex gap-1 mb-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-primary-600 hover:bg-primary-50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageIcon className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-primary-600 hover:bg-primary-50"
                            onClick={() => setShowStickers(!showStickers)}
                        >
                            <Smile className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full hover:bg-primary-50 transition-all ${isRecording ? 'bg-red-50 text-red-600 animate-pulse' : 'text-primary-600'}`}
                            onClick={toggleRecording}
                        >
                            <Mic className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="flex-1 relative bg-gray-100 rounded-2xl flex items-end">
                        <textarea
                            placeholder="Aa"
                            value={input}
                            rows={1}
                            onChange={e => {
                                setInput(e.target.value);
                                // Auto-resize up to 5 rows
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            style={{ resize: 'none', minHeight: '44px', maxHeight: '120px' }}
                            className="bg-transparent border-none focus:outline-none focus:ring-0 shadow-none py-3 px-4 text-[15px] placeholder-gray-500 w-full overflow-y-scroll scrollbar-hide leading-snug"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowStickers(!showStickers)}
                            className="mr-1 mb-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                            <Smile className="h-5 w-5" />
                        </Button>
                    </div>

                    {input.trim() ? (
                        <Button
                            size="icon"
                            onClick={() => handleSend()}
                            className="rounded-full bg-primary-600 hover:bg-primary-700 text-white h-10 w-10 mb-1 shadow-md transition-transform active:scale-95"
                        >
                            <Send className="h-5 w-5 ml-0.5" />
                        </Button>
                    ) : (
                        <Button
                            size="icon"
                            onClick={() => handleSend('sticker', '👍')}
                            className="rounded-full bg-transparent text-primary-600 hover:bg-blue-50 h-10 w-10 mb-1"
                        >
                            <ThumbsUp className="h-6 w-6" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

