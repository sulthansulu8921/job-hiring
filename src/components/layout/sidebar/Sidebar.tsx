import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Briefcase,
    Home,
    Compass,
    MessageSquare,
    Bell,
    User,
    PlusCircle,
    Clock,
    Globe,
    Zap,
    Settings as SettingsIcon,
    Bookmark,
    Users,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { Button } from "../../ui/Button";
import { useAuth } from "../../../context/AuthContext";
import { useWebSocket } from "../../../hooks/useWebSocket";
import api from "../../../services/api";
import logo from "../../../assets/logo.png";
import { GroupsSidebar } from "./GroupsSidebar";

const NAV_ITEMS = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Zap, label: "Urgent Openings", path: "/jobs/urgent" },
    { icon: Briefcase, label: "Full-Time Jobs", path: "/jobs/full-time" },
    { icon: Clock, label: "Part-Time Jobs", path: "/jobs/part-time" },
    { icon: Globe, label: "Remote Jobs", path: "/jobs/remote" },
    { icon: Compass, label: "Explore All", path: "/jobs" },
];

const AUTH_ITEMS = [
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Bookmark, label: "Saved", path: "/saved" },
    { icon: Briefcase, label: "Applied Jobs", path: "/applied-jobs" },
    { icon: Users, label: "Applicants", path: "/applicants" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: SettingsIcon, label: "Settings", path: "/settings" },
];

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, openAuthModal } = useAuth();

    const handlePostJob = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault();
            openAuthModal();
            return;
        }
        navigate("/post-job");
    };

    const handleAuthItemClick = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault();
            openAuthModal();
        }
    };

    const [unreadNotifications, setUnreadNotifications] = React.useState(0);
    const { lastMessage: lastNotification } = useWebSocket('/ws/notifications/');

    // Fetch initial unread count
    React.useEffect(() => {
        if (isAuthenticated) {
            api.get('/notifications/')
                .then(res => {
                    const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
                    setUnreadNotifications(data.filter((n: any) => !n.is_read).length);
                })
                .catch(err => console.error("Failed to fetch unread notifications:", err));
        }
    }, [isAuthenticated]);

    // Listen for real-time notifications to increment badge
    React.useEffect(() => {
        if (lastNotification) {
            // When a new notification comes via WS, increment the badge
            setUnreadNotifications(prev => prev + 1);
        }
    }, [lastNotification]);

    // Optionally reset badge when user visits notifications page
    React.useEffect(() => {
        if (location.pathname === '/notifications') {
            setUnreadNotifications(0);
        }
    }, [location.pathname]);

    return (
        <aside className={cn(
            "fixed md:sticky top-0 left-0 h-screen bg-white border-r border-gray-100 p-4 shadow-2xl md:shadow-soft-xl z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
            {/* Logo */}
            {/* Logo */}
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-8 px-2 group">
                <img src={logo} alt="Thozhilurappu" className="h-32 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
            </Link>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                {/* Discover */}
                <div className="mb-6">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Discover
                    </p>

                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => onClose && onClose()}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group",
                                    isActive
                                        ? "bg-primary-50 text-primary-700 shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive
                                            ? "text-primary-600"
                                            : "text-gray-400 group-hover:text-gray-600"
                                    )}
                                />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Personal */}
                <div>
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Personal
                    </p>

                    {AUTH_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={(e) => {
                                    handleAuthItemClick(e);
                                    if (onClose) onClose();
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group",
                                    isActive
                                        ? "bg-primary-50 text-primary-700 shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <div className="relative">
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 transition-colors",
                                            isActive
                                                ? "text-primary-600"
                                                : "text-gray-400 group-hover:text-gray-600"
                                        )}
                                    />
                                    {item.label === 'Notifications' && unreadNotifications > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                                        </span>
                                    )}
                                </div>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Communities Section - Visible on mobile/tablet since right sidebar is hidden */}
                <div className="mt-8 xl:hidden">
                    <GroupsSidebar />
                </div>
            </nav>

            {/* Post Job */}
            <div className="pt-4 mt-4 border-t border-gray-100">
                <Button
                    onClick={handlePostJob}
                    className="w-full justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <PlusCircle className="h-5 w-5" />
                    Post a Job
                </Button>
            </div>
        </aside>
    );
}
