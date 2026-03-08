import { useState, useEffect } from 'react';
import { Bookmark, Loader2, Briefcase, FileText, Wrench } from 'lucide-react';
import { PostCard } from '../components/feed/PostCard';
import JobCard from '../components/feed/JobCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

type SavedTab = 'All' | 'Posts' | 'Jobs' | 'Services';

export default function Saved() {
    const { isAuthenticated, openAuthModal } = useAuth();
    const [activeTab, setActiveTab] = useState<SavedTab>('All');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            openAuthModal();
            return;
        }
        const fetchSaved = async () => {
            setLoading(true);
            try {
                const res = await api.get('/auth/user/saved/');
                setItems(Array.isArray(res.data) ? res.data : res.data.results || []);
            } catch (err) {
                console.error('Failed to fetch saved items:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSaved();
    }, [isAuthenticated]);

    const filtered = activeTab === 'All'
        ? items
        : activeTab === 'Posts'
            ? items.filter(i => i.feed_type === 'regular')
            : activeTab === 'Jobs'
                ? items.filter(i => i.feed_type === 'job')
                : items.filter(i => i.feed_type === 'service');

    const tabs: { label: SavedTab; icon: React.ElementType; count: number }[] = [
        { label: 'All', icon: Bookmark, count: items.length },
        { label: 'Posts', icon: FileText, count: items.filter(i => i.feed_type === 'regular').length },
        { label: 'Jobs', icon: Briefcase, count: items.filter(i => i.feed_type === 'job').length },
        { label: 'Services', icon: Wrench, count: items.filter(i => i.feed_type === 'service').length },
    ];

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Bookmark className="h-5 w-5 text-primary-600 fill-primary-100" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
                        <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
                    </div>
                </div>
            </div>

            {/* Tab Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                {tabs.map(({ label, icon: Icon, count }) => (
                    <button
                        key={label}
                        onClick={() => setActiveTab(label)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${activeTab === label
                                ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                            }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                        {count > 0 && (
                            <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === label ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                        <p className="text-sm text-gray-400">Loading saved items...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <Bookmark className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {activeTab === 'All' ? 'Nothing saved yet' : `No saved ${activeTab.toLowerCase()}`}
                    </h3>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">
                        Tap the bookmark icon on any post, job, or service to save it here for later.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((item: any) =>
                        item.feed_type === 'job' ? (
                            <JobCard key={`job-${item.id}`} job={item} />
                        ) : (
                            <PostCard key={`${item.feed_type}-${item.id}`} post={item} />
                        )
                    )}
                </div>
            )}
        </div>
    );
}
