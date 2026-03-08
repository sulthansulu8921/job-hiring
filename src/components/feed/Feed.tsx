import { PostCard } from "./PostCard";
import { Loader2 } from "lucide-react";
import { usePosts } from "../../context/PostsContext";

interface FeedProps {
    filterType?: string;
}

export default function Feed({ filterType }: FeedProps) {
    const { posts, loading } = usePosts();

    const filteredPosts = filterType
        ? posts.filter(p => p.type?.toLowerCase() === filterType.toLowerCase()) // Basic filtering if needed
        : posts;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (filteredPosts.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                    <Loader2 className="h-full w-full" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No posts found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters or check back later.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {filteredPosts.map((post: any) => (
                <PostCard key={`${post.feed_type || post.type}-${post.id}`} post={post} />
            ))}
            <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 text-gray-500 text-sm font-medium">
                    You've reached the end! 🎉
                </div>
            </div>
        </div>
    );
}
