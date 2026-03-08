import { Plus } from "lucide-react";
import { Button } from "../ui/Button";
import { useState } from "react";
import { CreatePostModal } from "../feed/CreatePostModal";
import api from "../../services/api";
import { usePosts } from "../../context/PostsContext";

export default function CreatePostFloater() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { refreshPosts } = usePosts();

    const handleCreatePost = async (data: any) => {
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
            setIsModalOpen(false);
        } catch (err) {
            console.error("Create post failed", err);
            alert("Failed to create post. Please try again.");
            throw err;
        }
    };

    return (
        <>
            <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40">
                <Button
                    size="icon"
                    onClick={() => setIsModalOpen(true)}
                    className="h-14 w-14 rounded-full shadow-lg bg-primary-600 hover:bg-primary-700 text-white transition-transform hover:scale-105"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <CreatePostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreatePost}
            />
        </>
    );
}
