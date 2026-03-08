import { useState, useEffect } from "react";
import { Bell, Briefcase, MessageSquare, CheckCircle, Clock, Loader2, Users, Check, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import api from "../services/api";
import { useWebSocket } from "../hooks/useWebSocket";

interface NotificationData {
    id: number;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

const NOTIFICATION_CONFIG: Record<string, { icon: any, color: string }> = {
    'job_alert': { icon: Briefcase, color: "bg-blue-100 text-blue-600" },
    'new_message': { icon: MessageSquare, color: "bg-purple-100 text-purple-600" },
    'application_update': { icon: CheckCircle, color: "bg-green-100 text-green-600" },
    'profile_reminder': { icon: Clock, color: "bg-orange-100 text-orange-600" },
    'default': { icon: Bell, color: "bg-gray-100 text-gray-600" }
};

export default function Notifications() {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [pendingConnections, setPendingConnections] = useState<any[]>([]);

    const { lastMessage } = useWebSocket('/ws/notifications/');

    useEffect(() => {
        fetchNotifications();
        fetchPendingConnections();
    }, []);

    const fetchPendingConnections = async () => {
        try {
            const res = await api.get('/profiles/connections/pending/');
            setPendingConnections(Array.isArray(res.data) ? res.data : (res.data.results || []));
        } catch (err) {
            console.error("Failed to fetch pending connections:", err);
        }
    };

    const handleAcceptRequest = async (userId: number) => {
        try {
            await api.post(`/profiles/user/${userId}/accept/`);
            setPendingConnections(prev => prev.filter(p => p.user !== userId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRejectRequest = async (userId: number) => {
        try {
            await api.post(`/profiles/user/${userId}/reject/`);
            setPendingConnections(prev => prev.filter(p => p.user !== userId));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (lastMessage) {
            setNotifications(prev => [lastMessage, ...prev]);
        }
    }, [lastMessage]);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(Array.isArray(res.data) ? res.data : (res.data.results || []));
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-read/');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const clearAll = async () => {
        try {
            await api.delete('/notifications/clear/');
            setNotifications([]);
        } catch (err) {
            console.error("Failed to clear notifications:", err);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.post('/notifications/mark-read/', { notification_id: id });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 p-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>Mark all as read</Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={clearAll}>Clear all</Button>
                </div>
            </div>

            {pendingConnections.length > 0 && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary-600" /> Connection Requests
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{pendingConnections.length}</span>
                    </h2>
                    <div className="space-y-3">
                        {pendingConnections.map((profile) => (
                            <div key={profile.id} className="flex gap-4 p-4 rounded-xl border bg-gradient-to-r from-white to-primary-50/10 border-primary-100 shadow-sm items-center hover:shadow-md transition-shadow">
                                <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 border-2 border-white shadow-sm">
                                    <img src={profile.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user_name)}`} alt={profile.user_name} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-gray-900 leading-tight truncate">
                                        {profile.user_name}
                                    </h3>
                                    <p className="text-xs text-primary-600 font-medium truncate mt-0.5">Wants to connect with you</p>
                                </div>
                                <div className="flex gap-2 self-center">
                                    <Button size="sm" onClick={() => handleAcceptRequest(profile.user)} className="bg-primary-600 hover:bg-primary-700 text-white h-8 px-3 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Accept</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleRejectRequest(profile.user)} className="h-8 w-8 p-0 rounded-lg shrink-0 border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-700"><X className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => {
                        const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.default;
                        const Icon = config.icon;

                        return (
                            <div
                                key={notification.id}
                                className={`flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${notification.is_read ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100'}`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-sm font-semibold ${notification.is_read ? 'text-gray-900' : 'text-blue-900'}`}>
                                            {notification.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </h3>
                                        <span className="text-xs text-gray-500">{getTimeAgo(notification.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notification.message}</p>
                                </div>
                                {!notification.is_read && (
                                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && notifications.length === 0 && (
                <div className="text-center py-10">
                    <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-gray-900 font-medium">No notifications yet</h3>
                    <p className="text-gray-500 text-sm mt-1">We'll notify you when something important happens.</p>
                </div>
            )}
        </div>
    );
}
