import { useEffect, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Toast {
    id: number;
    message: string;
    sender_id?: number;
}

export default function NotificationToast() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { lastMessage } = useWebSocket('/ws/notifications/');
    const [toasts, setToasts] = useState<Toast[]>([]);

    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            // A pleasant soft "pop" sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    useEffect(() => {
        if (!lastMessage) return;
        // Handle new_message type notifications
        if (lastMessage.type === 'new_message' && lastMessage.message) {
            const toast: Toast = {
                id: Date.now(),
                message: lastMessage.message,
                sender_id: lastMessage.sender_id,
            };
            setToasts(prev => [...prev, toast]);
            playNotificationSound();

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 5000);
        }
    }, [lastMessage]);

    const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    if (!user || toasts.length === 0) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="flex items-start gap-3 bg-white border border-gray-200 shadow-lg rounded-xl p-3 pr-4 w-72 animate-in slide-in-from-right-4 duration-300 cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => {
                        if (toast.sender_id) navigate(`/inbox?userId=${toast.sender_id}`);
                        dismiss(toast.id);
                    }}
                >
                    <div className="bg-purple-100 text-purple-600 h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Message</p>
                        <p className="text-sm text-gray-800 mt-0.5 leading-snug line-clamp-2">{toast.message}</p>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); dismiss(toast.id); }}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
