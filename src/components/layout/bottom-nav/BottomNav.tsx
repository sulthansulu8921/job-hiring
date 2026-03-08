import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Plus, User, Bookmark } from "lucide-react";
import { cn } from "../../../utils/cn";
import { useAuth } from "../../../context/AuthContext";

const NAV_ITEMS = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/jobs" },
    { icon: Plus, label: "Post", path: "/post-job", isAction: true },
    { icon: Bookmark, label: "Saved", path: "/saved", requiresAuth: true },
    { icon: User, label: "Profile", path: "/profile", requiresAuth: true },
];

export default function BottomNav() {
    const location = useLocation();
    const { isAuthenticated, openAuthModal } = useAuth();

    const handleNavClick = (e: React.MouseEvent, item: any) => {
        if ((item.requiresAuth || item.isAction) && !isAuthenticated) {
            e.preventDefault();
            openAuthModal();
        }
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {NAV_ITEMS.map(item => {
                const isActive = location.pathname === item.path;

                if (item.isAction) {
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={(e) => handleNavClick(e, item)}
                            className="flex flex-col items-center justify-center -mt-6"
                        >
                            <div className="h-14 w-14 bg-primary-600 rounded-full flex items-center justify-center shadow-lg shadow-primary-600/30 text-white mb-1 transition-transform active:scale-95">
                                <Plus className="h-7 w-7" />
                            </div>
                        </Link>
                    )
                }

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={(e) => handleNavClick(e, item)}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                            isActive ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <item.icon className={cn("h-6 w-6 transition-colors", isActive && "fill-current")} />
                        <span className="text-[10px] font-medium mt-1">{item.label}</span>
                    </Link>
                )
            })}
        </div>
    );
}
