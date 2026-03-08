import { useParams, useNavigate } from "react-router-dom";
import { usePosts } from "../context/PostsContext";
import { PostCard } from "../components/feed/PostCard";
import { Button } from "../components/ui/Button";
import { ArrowLeft } from "lucide-react";
import CommentsSection from "../components/feed/CommentsSection";

export default function PostDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getPostById } = usePosts();

    const post = id ? getPostById(id) : undefined;

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h2>
                <p className="text-gray-500 mb-6">The post you are looking for doesn't exist or has been removed.</p>
                <Button onClick={() => navigate(-1)} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
            <Button
                variant="ghost"
                className="mb-4 pl-0 hover:bg-transparent hover:text-primary-600"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Feed
            </Button>

            <div className="space-y-6 pb-20"> {/* Added padding bottom for sticky input */}
                <PostCard post={post} />

                {/* Always show comments on details page */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <CommentsSection
                        postId={post.id.toString()}
                        type={post.type === 'JOB' ? 'job' : post.type === 'SERVICE' ? 'service' : 'post'}
                        isPage={true}
                    />
                </div>
            </div>
        </div>
    );
}
