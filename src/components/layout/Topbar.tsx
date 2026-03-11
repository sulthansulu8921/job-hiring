import { Search, Menu, ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import logo from "../../assets/logo.png";
import { cn } from "../../utils/cn";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsMobileSearchOpen(false);
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    useEffect(() => {
        if (isMobileSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isMobileSearchOpen]);

    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40 w-full relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between gap-4">

                    {/* Mobile Menu & Logo Area - Hidden on Desktop because Sidebar has logo */}
                    <div className={cn("items-center gap-3 shrink-0 md:hidden", isMobileSearchOpen ? "hidden" : "flex")}>
                        <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden -ml-2">
                            <Menu className="h-6 w-6 text-gray-700" />
                        </Button>
                        <Link to="/" className="flex items-center shrink-0">
                            <img
                                src={logo}
                                alt="Thozhilurappu"
                                className="h-16 sm:h-20 w-auto object-contain transition-transform hover:scale-105"
                            />
                        </Link>
                    </div>


                    {/* Search Bar - Desktop hidden on mobile unless isMobileSearchOpen is true */}
                    <form
                        onSubmit={handleSearch}
                        className={cn(
                            "flex-1 md:max-w-lg relative",
                            isMobileSearchOpen ? "flex items-center gap-2" : "hidden md:block"
                        )}
                    >
                        {isMobileSearchOpen && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileSearchOpen(false)}
                                className="md:hidden -ml-2 shrink-0"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </Button>
                        )}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search jobs, companies, or skills..."
                                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </form>

                    {/* Quick Page Switches & Actions (Hidden when Mobile Search Open) */}
                    <div className={cn("flex items-center gap-2 md:gap-6", isMobileSearchOpen ? "hidden md:flex" : "flex")}>
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                            <Link to="/jobs?type=Remote" className="hover:text-primary-600 transition-colors">Remote</Link>
                            <Link to="/jobs?type=Part-time" className="hover:text-primary-600 transition-colors">Part-time</Link>
                            <Link to="/about" className="hover:text-primary-600 transition-colors">About Us</Link>
                            <Link to="/contact" className="hover:text-primary-600 transition-colors">Contact</Link>
                        </nav>

                        {/* Mobile: Search Icon Toggle */}
                        <div className="flex md:hidden">
                            <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(true)}>
                                <Search className="h-5 w-5 text-gray-600" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile Sub-header for Categories (Optional, if requested 'switch pages on top bar') */}
                <div className="md:hidden py-2 flex gap-3 overflow-x-auto scrollbar-hide border-t border-gray-50">
                    <Link to="/jobs?type=Remote" className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600 whitespace-nowrap">Remote</Link>
                    <Link to="/jobs?type=Part-time" className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600 whitespace-nowrap">Part-time</Link>
                    <Link to="/about" className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600 whitespace-nowrap">About</Link>
                    <Link to="/contact" className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600 whitespace-nowrap">Contact</Link>
                </div>
            </div>
        </header>
    );
}
