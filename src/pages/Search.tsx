import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Loader2, Search as SearchIcon, Briefcase, MapPin, ArrowRight, UserPlus, MessageCircle, Zap } from "lucide-react";
import { Button } from "../components/ui/Button";
import JobCard from "../components/feed/JobCard";
import { PostCard } from "../components/feed/PostCard";
import { useAuth } from "../context/AuthContext";

// Local ServiceCard Component for Search Results
function ServiceCard({ service, onContact }: { service: any; onContact: (posterId?: number) => void }) {
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

// UserCard Component for Search Results
function UserCard({ userNode, onMessage }: { userNode: any; onMessage: (posterId?: number) => void }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 flex items-center gap-4">
            <div
                className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer flex-shrink-0 overflow-hidden"
                onClick={() => navigate(`/profile/${userNode.id}`)}
            >
                {userNode.avatar ? (
                    <img src={userNode.avatar} alt={userNode.name} className="h-full w-full object-cover" />
                ) : (
                    <span className="text-xl font-bold text-gray-500">{userNode.name?.[0]?.toUpperCase() || "U"}</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3
                    className="font-bold text-gray-900 cursor-pointer hover:underline truncate"
                    onClick={() => navigate(`/profile/${userNode.id}`)}
                >
                    {userNode.name}
                </h3>
                <p className="text-sm text-gray-500 truncate">{userNode.role || "User"}</p>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate(`/profile/${userNode.id}`)}>
                    View
                </Button>
                <Button size="sm" className="rounded-full" onClick={() => onMessage(userNode.id)}>
                    <MessageCircle className="h-4 w-4 mr-1.5" /> Message
                </Button>
            </div>
        </div>
    );
}

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const navigate = useNavigate();
    const { requireAuth } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [results, setResults] = useState<{
        users: any[];
        jobs: any[];
        posts: any[];
        services: any[];
    }>({ users: [], jobs: [], posts: [], services: [] });

    // Tabs: 'all' | 'jobs' | 'services' | 'posts' | 'users'
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults({ users: [], jobs: [], posts: [], services: [] });
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const res = await api.get(`/search/?q=${encodeURIComponent(query)}`);
                setResults({
                    users: res.data.users || [],
                    jobs: res.data.jobs || [],
                    posts: res.data.posts || [],
                    services: res.data.services || []
                });
            } catch (err: any) {
                console.error("Search fetch failed:", err);
                setError("Failed to fetch search results. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    const handleApply = (id: number, posterId?: number) => {
        if (posterId) {
            requireAuth(() => navigate(`/inbox?userId=${posterId}`));
        } else {
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

    const totalResults = results.users.length + results.jobs.length + results.posts.length + results.services.length;

    return (
        <div className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <SearchIcon className="h-6 w-6 text-primary-600" />
                    <h1 className="text-2xl font-extrabold text-gray-900">Search Results</h1>
                </div>
                {!loading && (
                    <p className="text-gray-500 text-sm">
                        Found {totalResults} result(s) for <strong className="text-gray-900">"{query}"</strong>
                    </p>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                </div>
            )}

            {/* Content State */}
            {!loading && !error && (
                <>
                    {/* Tabs */}
                    {totalResults > 0 && (
                        <div className="flex overflow-x-auto scrollbar-hide gap-2 mb-6 border-b border-gray-100 pb-2">
                            <Button
                                variant={activeTab === 'all' ? 'default' : 'ghost'}
                                size="sm"
                                className="rounded-full"
                                onClick={() => setActiveTab('all')}
                            >
                                All Results
                            </Button>
                            {results.jobs.length > 0 && (
                                <Button
                                    variant={activeTab === 'jobs' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="rounded-full gap-1.5"
                                    onClick={() => setActiveTab('jobs')}
                                >
                                    <Briefcase className="h-4 w-4" /> Jobs ({results.jobs.length})
                                </Button>
                            )}
                            {results.services.length > 0 && (
                                <Button
                                    variant={activeTab === 'services' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="rounded-full gap-1.5"
                                    onClick={() => setActiveTab('services')}
                                >
                                    <Zap className="h-4 w-4" /> Services ({results.services.length})
                                </Button>
                            )}
                            {results.users.length > 0 && (
                                <Button
                                    variant={activeTab === 'users' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="rounded-full gap-1.5"
                                    onClick={() => setActiveTab('users')}
                                >
                                    <UserPlus className="h-4 w-4" /> People ({results.users.length})
                                </Button>
                            )}
                            {results.posts.length > 0 && (
                                <Button
                                    variant={activeTab === 'posts' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="rounded-full gap-1.5"
                                    onClick={() => setActiveTab('posts')}
                                >
                                    <MessageCircle className="h-4 w-4" /> Posts ({results.posts.length})
                                </Button>
                            )}
                        </div>
                    )}

                    {totalResults === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                                <SearchIcon className="h-8 w-8 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-bold mb-2">No results found</h3>
                            <p className="text-gray-400 text-sm">We couldn't find anything matching "{query}". Try checking your spelling or using different keywords.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-8">
                                {/* Jobs */}
                                {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
                                    <section>
                                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Jobs</h2>
                                        <div className="space-y-4">
                                            {results.jobs.map(job => (
                                                <JobCard key={`job-${job.id}`} job={job} onApply={handleApply} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Posts */}
                                {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                                    <section>
                                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Posts</h2>
                                        <div className="space-y-4">
                                            {results.posts.map(post => (
                                                <PostCard key={`post-${post.id}`} post={post} />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            <div className="space-y-8">
                                {/* Users Sidebar */}
                                {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                                    <section>
                                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">People</h2>
                                        <div className="space-y-3">
                                            {results.users.map(u => (
                                                <UserCard key={`user-${u.id}`} userNode={u} onMessage={handleContact} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Services Sidebar */}
                                {(activeTab === 'all' || activeTab === 'services') && results.services.length > 0 && (
                                    <section>
                                        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Services</h2>
                                        <div className="space-y-3">
                                            {results.services.map(s => (
                                                <ServiceCard key={`service-${s.id}`} service={s} onContact={handleContact} />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
