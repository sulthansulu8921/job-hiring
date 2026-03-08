import { useNavigate } from "react-router-dom";
import { CreatePostModal } from "../components/feed/CreatePostModal";
import { usePosts } from "../context/PostsContext";
import api from "../services/api";

export default function PostJob() {
    const navigate = useNavigate();
    const { refreshPosts } = usePosts();

    const handleSubmit = async (data: any) => {
        try {
            if (data.type === 'NORMAL') {
                const formData = new FormData();
                formData.append('content', data.description || '');
                formData.append('post_type', 'regular');
                if (data.image) formData.append('image', data.image);

                await api.post('/posts/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else if (data.type === 'JOB') {
                await api.post('/jobs/', {
                    title: data.title,
                    company_name: data.company,
                    description: data.description,
                    salary_min: parseFloat(data.salary) || 0,
                    location: data.location,
                    job_type: data.jobType.toLowerCase().replace('-', '_'),
                    experience: data.experience
                });
            } else if (data.type === 'SERVICE') {
                await api.post('/services/', {
                    title: data.title,
                    description: data.description,
                    price_min: parseFloat(data.price) || 0,
                    location: data.location,
                    category: data.category
                });
            }
            await refreshPosts();
            navigate('/jobs');
        } catch (err) {
            console.error("Create post failed", err);
            alert("Failed to create post. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <CreatePostModal
                isOpen={true}
                onClose={() => navigate('/jobs')}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
