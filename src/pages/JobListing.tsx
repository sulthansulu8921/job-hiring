import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search, MapPin, Briefcase, Clock, Globe, Zap,
    Compass, X,
    Loader2, AlertCircle, Plus, SlidersHorizontal,
    ArrowRight
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { cn } from "../utils/cn";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { CreatePostModal } from "../components/feed/CreatePostModal";
import JobCard from "../components/feed/JobCard";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostsContext";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Job {
    id: number;
    title: string;
    company_name: string;
    company_logo?: string;
    location: string;
    salary_min?: number | null;
    salary_max?: number | null;
    job_type: string;
    is_urgent: boolean;
    experience?: string;
    description: string;
    created_at: string;
    created_by: number;
    user_name?: string;
    user_avatar?: string;
    user_id?: number;
    user?: number;
}

interface Service {
    id: number;
    title: string;
    description: string;
    location: string;
    price_min?: number;
    price_max?: number;
    category_name?: string;
    created_at: string;
    user_name?: string;
    user_avatar?: string;
    user_id?: number;
    user?: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full-Time",
    part_time: "Part-Time",
    remote: "Remote",
};

const INDIA_LOCATIONS = [
    // Kerala Districts
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
    "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad",

    // Tamil Nadu Districts
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
    "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
    "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",

    // Karnataka Districts
    "Bagalkot", "Ballari (Bellary)", "Belagavi (Belgaum)", "Bengaluru (Bangalore) Rural", "Bengaluru (Bangalore) Urban",
    "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru (Chikmagalur)", "Chitradurga", "Dakshina Kannada",
    "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi (Gulbarga)", "Kodagu", "Kolar", "Koppal",
    "Mandya", "Mysuru (Mysore)", "Raichur", "Ramanagara", "Shivamogga (Shimoga)", "Tumakuru (Tumkur)", "Udupi",
    "Uttara Kannada (Karwar)", "Vijayapura (Bijapur)", "Yadgir",

    // Other Major Indian Cities
    "Mumbai", "Delhi", "Hyderabad", "Ahmedabad", "Kolkata", "Surat", "Pune", "Jaipur",
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna",
    "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli",
    "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad",
    "Ranchi", "Howrah", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Raipur",
    "Kota", "Guwahati", "Chandigarh", "Solapur", "Bareilly",
    "Aligarh", "Gurgaon", "Moradabad", "Jalandhar", "Bhubaneswar", "Warangal", "Mira-Bhayandar",
    "Jalgaon", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Noida",
    "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", "Kochi", "Bhavnagar", "Dehradun", "Durgapur", "Asansol",
    "Nanded", "Kolhapur", "Ajmer", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar",
    "Jammu", "Sangli-Miraj & Kupwad", "Mangalore", "Kurnool", "Ambattur", "Rajahmundry",
    "Malegaon", "Gaya", "Udaipur", "Kakinada", "Maheshtala", "Rajpur Sonarpur",
    "Bokaro", "South Dumdum", "Patiala", "Gopalpur", "Agartala", "Bhagalpur", "Muzaffarnagar", "Bhatpara",
    "Panihati", "Latur", "Dhule", "Rohtak", "Korba", "Bhilwara", "Brahmapur", "Muzaffarpur", "Ahmednagar", "Mathura",
    "Avadi", "Kadapa", "Rajahmundry", "Bilaspur", "Shahjahanpur", "Kamhati",
    "Hisar", "Ozhukarai", "Bihar Sharif", "Darbhanga", "Farrukhabad", "Nizamabad", "Aizawl", "Parbhani", "Bathinda",
    "Purnia", "Anantapur", "Tirupati", "Ramagundam", "New Delhi", "Sri Ganganagar", "Karimnagar", "Panipat",
    "Hapur", "Arrah",

    // States
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",

    // Union Territories
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep",
    "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
].sort();

// ─────────────────────────────────────────────
// Nav modes
// ─────────────────────────────────────────────
type PageMode = "home" | "urgent" | "full_time" | "part_time" | "remote" | "explore";

const PATH_MODE_MAP: Record<string, PageMode> = {
    "/jobs/urgent": "urgent",
    "/jobs/full-time": "full_time",
    "/jobs/part-time": "part_time",
    "/jobs/remote": "remote",
    "/jobs": "explore",
};



// ─────────────────────────────────────────────
// Service Card Component
// ─────────────────────────────────────────────
function ServiceCard({ service, onContact }: { service: Service; onContact: (posterId?: number) => void }) {
    const fmt = (n?: number) => n ? `₹${n.toLocaleString()}` : "";
    const rate = service.price_min || service.price_max
        ? `${fmt(service.price_min)}${service.price_max ? ` – ${fmt(service.price_max)}` : ""}`
        : "Contact for price";

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                        {service.user_avatar ? (
                            <img src={service.user_avatar} alt={service.user_name} className="h-full w-full object-cover rounded-xl" />
                        ) : (
                            <span className="text-lg font-bold text-teal-600">
                                {service.user_name?.[0]?.toUpperCase() || "S"}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 leading-tight">{service.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{service.user_name}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{service.location}</span>
                            {service.category_name && (
                                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100 font-medium">
                                    {service.category_name}
                                </span>
                            )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="font-bold text-gray-800 text-sm">{rate}</span>
                            <Button
                                size="sm"
                                className="rounded-full bg-teal-600 hover:bg-teal-700 text-white px-4 gap-1.5"
                                onClick={() => onContact(service.user || service.user_id)}
                            >
                                Contact <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function JobListing() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, requireAuth } = useAuth();
    const { refreshPosts } = usePosts();
    const [searchParams] = useSearchParams();

    // Derive mode from current URL path
    const pageMode: PageMode = PATH_MODE_MAP[location.pathname] || "explore";

    // State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ jobs: Job[], services: Service[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const searchTimeout = useRef<any>(null);

    // Filter State — initialized from URL params (set by right sidebar JobFilters)
    const [filterLocation, setFilterLocation] = useState(searchParams.get("location") || "");
    const [filterJobType, setFilterJobType] = useState<string[]>(
        searchParams.get("job_type") ? [searchParams.get("job_type")!] : []
    );
    const [filterSalaryMin, setFilterSalaryMin] = useState(searchParams.get("salary_min") || "");
    const [filterSalaryMax, setFilterSalaryMax] = useState(searchParams.get("salary_max") || "");
    const [filterExperience, setFilterExperience] = useState(searchParams.get("experience") || "");

    const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
    const locationRef = useRef<HTMLDivElement>(null);

    // Sync state when URL params change (from sidebar JobFilters)
    useEffect(() => {
        setFilterLocation(searchParams.get("location") || "");
        setFilterJobType(searchParams.get("job_type") ? [searchParams.get("job_type")!] : []);
        setFilterSalaryMin(searchParams.get("salary_min") || "");
        setFilterSalaryMax(searchParams.get("salary_max") || "");
        setFilterExperience(searchParams.get("experience") || "");
    }, [searchParams]);

    // Handle outside click for location dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
                setLocationDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isExplore = pageMode === "explore";

    // Build jobs API URL from mode and filters
    const buildJobsUrl = useCallback((p = 1) => {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("page_size", "10");

        if (pageMode === "urgent") params.set("is_urgent", "true");
        else if (pageMode === "full_time") params.set("job_type", "full_time");
        else if (pageMode === "part_time") params.set("job_type", "part_time");
        else if (pageMode === "remote") params.set("job_type", "remote");

        if (filterLocation) params.set("location", filterLocation);
        if (filterJobType.length === 1) params.set("job_type", filterJobType[0]);
        if (filterSalaryMin) params.set("salary_min", filterSalaryMin);
        if (filterSalaryMax) params.set("salary_max", filterSalaryMax);
        if (filterExperience) params.set("experience", filterExperience);

        return `/jobs/?${params.toString()}`;
    }, [pageMode, filterLocation, filterJobType, filterSalaryMin, filterSalaryMax, filterExperience]);

    // Fetch jobs or services
    const fetchData = useCallback(async (p = 1, append = false) => {
        setLoading(true);
        setError("");
        try {
            if (isExplore) {
                const [servicesRes, jobsRes] = await Promise.all([
                    api.get("/services/"),
                    api.get(buildJobsUrl(p))
                ]);

                const svcItems: Service[] = Array.isArray(servicesRes.data) ? servicesRes.data : servicesRes.data.results || [];
                setServices(svcItems);

                const data = jobsRes.data;
                const items: Job[] = Array.isArray(data) ? data : data.results || [];
                const count = data.count || items.length;

                if (append) {
                    setJobs(prev => [...prev, ...items]);
                } else {
                    setJobs(items);
                }
                setTotalCount(count);
                setHasMore(!!data.next);
            } else {
                const url = buildJobsUrl(p);
                const res = await api.get(url);
                const data = res.data;
                const items: Job[] = Array.isArray(data) ? data : data.results || [];
                const count = data.count || items.length;

                setServices([]); // Clear services for specific job tabs

                if (append) {
                    setJobs(prev => [...prev, ...items]);
                } else {
                    setJobs(items);
                }
                setTotalCount(count);
                setHasMore(!!data.next);
            }
        } catch (err) {
            console.error("Fetch failed:", err);
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [buildJobsUrl, isExplore]);

    // Fetch when mode or filters change
    useEffect(() => {
        setPage(1);
        setJobs([]);
        setSearchResults(null);
        setSearchQuery("");
        fetchData(1, false);
    }, [pageMode, filterLocation, filterJobType, filterSalaryMin, filterSalaryMax, filterExperience]);

    // Search debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }
        clearTimeout(searchTimeout.current);
        setIsSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await api.get(`/search/?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults({
                    jobs: res.data.jobs || [],
                    services: res.data.services || [],
                });
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsSearching(false);
            }
        }, 400);
    }, [searchQuery]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchData(next, true);
    };

    const handleApply = (id: number, posterId?: number) => {
        if (posterId) {
            requireAuth(() => navigate(`/inbox?userId=${posterId}`));
        } else {
            // Fallback for older data without posterId
            requireAuth(() => navigate(`/jobs/id/${id}`));
        }
    };

    const handleContact = (posterId?: number) => {
        if (posterId) {
            requireAuth(() => navigate(`/inbox?userId=${posterId}`));
        } else {
            requireAuth(() => navigate('/messages'));
        }
    };

    const handleCreatePost = async (data: any) => {
        try {
            if (data.type === "NORMAL") {
                const fd = new FormData();
                fd.append("content", data.description || "");
                fd.append("post_type", "regular");
                if (data.image) fd.append("image", data.image);
                await api.post("/posts/", fd, { headers: { "Content-Type": "multipart/form-data" } });
            } else if (data.type === "JOB") {
                await api.post("/jobs/", {
                    title: data.title, company_name: data.company,
                    description: data.description,
                    salary_min: parseFloat(data.salary) || 0,
                    location: data.location,
                    job_type: data.jobType?.toLowerCase().replace("-", "_") || "full_time",
                    experience: data.experience,
                });
            } else if (data.type === "SERVICE") {
                await api.post("/services/", {
                    title: data.title, description: data.description,
                    price_min: parseFloat(data.price) || 0,
                    location: data.location, category: data.category,
                });
            }
            await refreshPosts();
            fetchData(1, false);
            setIsPostModalOpen(false);
        } catch (err) {
            console.error("Create post failed", err);
            alert("Failed to create post. Please try again.");
            throw err;
        }
    };

    const clearFilters = () => {
        setFilterLocation("");
        setFilterJobType([]);
        setFilterSalaryMin("");
        setFilterSalaryMax("");
        setFilterExperience("");
    };

    const activeFilterCount = [
        filterLocation, ...filterJobType, filterSalaryMin, filterSalaryMax, filterExperience
    ].filter(Boolean).length;

    // Data to show
    const displayJobs: Job[] = searchResults?.jobs ?? jobs;
    const displayServices: Service[] = searchResults?.services ?? services;

    const PAGE_TITLES: Record<PageMode, { title: string; sub: string; icon: any }> = {
        home: { title: "Home", sub: "What's happening", icon: null },
        urgent: { title: "Urgent Openings", sub: "Hire immediately — high-priority roles", icon: Zap },
        full_time: { title: "Full-Time Jobs", sub: "Stable, committed positions", icon: Briefcase },
        part_time: { title: "Part-Time Jobs", sub: "Flexible part-time opportunities", icon: Clock },
        remote: { title: "Remote Jobs", sub: "Work from anywhere in Kerala", icon: Globe },
        explore: { title: "Explore All", sub: "Find jobs, skilled workers and contractors", icon: Compass },
    };

    const { title, sub, icon: PageIcon } = PAGE_TITLES[pageMode];

    return (
        <div className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    {PageIcon && <PageIcon className="h-6 w-6 text-primary-600" />}
                    <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
                    {!loading && (
                        <span className="text-sm font-medium px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {totalCount} jobs{isExplore ? " & services" : ""}
                        </span>
                    )}
                </div>
                <p className="text-gray-500 text-sm">{sub}</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="relative flex items-center">
                    <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search jobs, companies, or skills..."
                        className="w-full pl-12 pr-32 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    <div className="absolute right-2 flex items-center gap-1.5">
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        )}
                        {isSearching && <Loader2 className="h-4 w-4 text-primary-500 animate-spin mr-1" />}
                        <Button
                            size="sm"
                            variant="outline"
                            className={cn("rounded-xl gap-1.5 border-gray-200", activeFilterCount > 0 && "border-primary-600 text-primary-600")}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="h-4 w-4 flex items-center justify-center rounded-full bg-primary-600 text-white text-xs font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="mb-6 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Filter Jobs</h3>
                        <div className="flex items-center gap-2">
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="text-xs text-primary-600 font-semibold hover:underline">
                                    Clear all
                                </button>
                            )}
                            <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Location */}
                        <div ref={locationRef}>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="e.g. Kozhikode"
                                    value={filterLocation}
                                    onChange={e => {
                                        setFilterLocation(e.target.value);
                                        setLocationDropdownOpen(true);
                                    }}
                                    onFocus={() => setLocationDropdownOpen(true)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />

                                {/* Location Autocomplete Dropdown */}
                                {locationDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto overflow-x-hidden">
                                        {INDIA_LOCATIONS.filter(loc => loc.toLowerCase().includes(filterLocation.toLowerCase())).length > 0 ? (
                                            INDIA_LOCATIONS.filter(loc => loc.toLowerCase().includes(filterLocation.toLowerCase())).map((loc) => (
                                                <button
                                                    key={loc}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                                    onClick={() => {
                                                        setFilterLocation(loc);
                                                        setLocationDropdownOpen(false);
                                                    }}
                                                >
                                                    {loc}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No locations found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Job Type */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Job Type</label>
                            <div className="flex flex-wrap gap-2">
                                {["full_time", "part_time", "remote"].map(jt => (
                                    <button
                                        key={jt}
                                        onClick={() => setFilterJobType(prev =>
                                            prev.includes(jt) ? prev.filter(x => x !== jt) : [...prev, jt]
                                        )}
                                        className={cn(
                                            "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                                            filterJobType.includes(jt)
                                                ? "bg-primary-600 text-white border-primary-600"
                                                : "border-gray-200 text-gray-600 hover:border-primary-300"
                                        )}
                                    >
                                        {JOB_TYPE_LABELS[jt]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Salary */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Salary (₹)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filterSalaryMin}
                                    onChange={e => setFilterSalaryMin(e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-gray-400">–</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filterSalaryMax}
                                    onChange={e => setFilterSalaryMax(e.target.value)}
                                    className="w-full py-2 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        {/* Experience */}
                        <div>
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Experience</label>
                            <input
                                type="text"
                                placeholder="e.g. 2 years"
                                value={filterExperience}
                                onChange={e => setFilterExperience(e.target.value)}
                                className="w-full py-2 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Post Composer */}
            <div
                className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors group"
                onClick={() => setIsPostModalOpen(true)}
            >
                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm overflow-hidden flex-shrink-0">
                    {user?.avatar ? (
                        <img src={user.avatar} className="h-full w-full object-cover" alt="" />
                    ) : (user?.name?.[0] || "U")}
                </div>
                <div className="flex-1 h-10 bg-gray-100 group-hover:bg-gray-200/70 rounded-full flex items-center px-4 text-sm text-gray-500">
                    Post a job, offer a service, or share an update...
                </div>
                <Button size="sm" className="gap-1.5 rounded-full flex-shrink-0">
                    <Plus className="h-4 w-4" /> Create
                </Button>
            </div>

            <CreatePostModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                onSubmit={handleCreatePost}
            />

            {/* Search Result Banner */}
            {searchResults && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>
                        Showing results for <strong>"{searchQuery}"</strong> — {searchResults.jobs.length} jobs, {searchResults.services.length} services
                    </span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error}</p>
                    <Button size="sm" variant="outline" className="ml-auto" onClick={() => fetchData(1, false)}>Retry</Button>
                </div>
            )}

            {/* Loading Skeleton */}
            {loading && jobs.length === 0 && services.length === 0 && (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                            <div className="flex gap-4">
                                <div className="h-12 w-12 rounded-xl bg-gray-100" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Jobs List */}
            {displayJobs.length > 0 && (
                <div className="space-y-4">
                    {(isExplore || searchResults) && <h3 className="font-bold text-gray-700 text-sm">Jobs</h3>}
                    {displayJobs.map(job => (
                        <JobCard key={`job-${job.id}`} job={job} onApply={handleApply} />
                    ))}
                </div>
            )}

            {/* Services List */}
            {(isExplore || (searchResults && searchResults.services.length > 0)) && displayServices.length > 0 && (
                <div className="space-y-4 mt-8">
                    {(isExplore || searchResults) && <h3 className="font-bold text-gray-700 text-sm">Services</h3>}
                    {displayServices.map(s => (
                        <ServiceCard key={`service-${s.id}`} service={s} onContact={handleContact} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && displayJobs.length === 0 && displayServices.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-bold mb-2">No results found</h3>
                    <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or search query</p>
                    {activeFilterCount > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
                    )}
                </div>
            )}

            {/* Load More */}
            {hasMore && !loading && !searchResults && (
                <div className="mt-8 text-center">
                    <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        className="gap-2 px-8 rounded-full border-gray-200"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Load More
                    </Button>
                </div>
            )}
        </div>
    );
}
