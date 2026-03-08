import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, Briefcase, Wrench, Send,
    MapPin, Building2, IndianRupee, Camera,
    Award
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}

type TemplateType = 'NORMAL' | 'JOB' | 'SERVICE';

const TEMPLATES = [
    {
        id: 'NORMAL',
        label: 'Regular Post',
        icon: User,
        description: 'Share updates, achievements, or announcements.',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        id: 'JOB',
        label: 'Post a Job',
        icon: Briefcase,
        description: 'Hire workers quickly.',
        color: 'text-primary-600',
        bg: 'bg-primary-50'
    },
    {
        id: 'SERVICE',
        label: 'Offer Service',
        icon: Wrench,
        description: 'Offer your skills and services.',
        color: 'text-teal-600',
        bg: 'bg-teal-50'
    },
];

export function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        description: '',
        title: '',
        location: '',
        company: '',
        salary: '',
        jobType: 'Full-Time',
        category: '',
        price: '',
        experience: '',
        image: null,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = {
                type: selectedTemplate,
                ...formData
            };
            await onSubmit(submitData);
            onClose();
            // Reset form
            setSelectedTemplate(null);
            setFormData({
                description: '',
                title: '',
                location: '',
                company: '',
                salary: '',
                jobType: 'Full-Time',
                category: '',
                price: '',
                experience: '',
                image: null,
            });
            setImagePreview(null);
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Create Post</h2>
                                <p className="text-gray-500 text-sm">Select what you'd like to share with the community</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Card Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {TEMPLATES.map((template) => {
                                    const Icon = template.icon;
                                    const isSelected = selectedTemplate === template.id;
                                    return (
                                        <button
                                            key={template.id}
                                            onClick={() => setSelectedTemplate(template.id as TemplateType)}
                                            className={cn(
                                                "flex flex-col items-start p-5 rounded-2xl border-2 transition-all duration-300 text-left group",
                                                isSelected
                                                    ? "border-primary-600 bg-primary-50/30 ring-4 ring-primary-50"
                                                    : "border-gray-100 hover:border-primary-200 hover:bg-gray-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-3 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110",
                                                template.bg,
                                                template.color
                                            )}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 mb-1">{template.label}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">{template.description}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Forms Section */}
                            <AnimatePresence mode="wait">
                                {selectedTemplate && (
                                    <motion.form
                                        key={selectedTemplate}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        onSubmit={handleFormSubmit}
                                        className="space-y-6"
                                    >
                                        <div className="h-px bg-gray-100 w-full" />

                                        {selectedTemplate === 'NORMAL' && (
                                            <div className="space-y-4">
                                                <textarea
                                                    required
                                                    autoFocus
                                                    className="w-full min-h-[150px] p-4 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 resize-none text-lg"
                                                    placeholder="What's on your mind? Share updates, achievements..."
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                />

                                                <div className="flex flex-wrap gap-4">
                                                    <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border border-gray-200 text-gray-600">
                                                        <Camera className="h-5 w-5 text-blue-600" />
                                                        <span className="text-sm font-medium">Add Photo</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                        />
                                                    </label>
                                                </div>

                                                {imagePreview && (
                                                    <div className="relative inline-block mt-2">
                                                        <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-xl border border-gray-200" />
                                                        <button
                                                            onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }}
                                                            className="absolute -top-2 -right-2 bg-white rounded-full shadow-md p-1 hover:bg-gray-100 border border-gray-100"
                                                        >
                                                            <X className="h-4 w-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {selectedTemplate === 'JOB' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                                                    <Input
                                                        required
                                                        placeholder="e.g. Senior Software Engineer"
                                                        value={formData.title}
                                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                                                    <div className="relative">
                                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            required
                                                            className="pl-10"
                                                            placeholder="Acme Inc."
                                                            value={formData.company}
                                                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            required
                                                            className="pl-10"
                                                            placeholder="Remote / City"
                                                            value={formData.location}
                                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Salary Range</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            className="pl-10"
                                                            placeholder="e.g. 50k - 80k"
                                                            value={formData.salary}
                                                            onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Type</label>
                                                    <select
                                                        className="w-full flex h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={formData.jobType}
                                                        onChange={e => setFormData({ ...formData, jobType: e.target.value })}
                                                    >
                                                        <option value="Full-Time">Full-Time</option>
                                                        <option value="Part-Time">Part-Time</option>
                                                        <option value="Remote">Remote</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Experience Required</label>
                                                    <div className="relative">
                                                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            className="pl-10"
                                                            placeholder="e.g. 2-3 years"
                                                            value={formData.experience}
                                                            onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Job Description</label>
                                                    <textarea
                                                        required
                                                        className="w-full min-h-[120px] p-4 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 resize-none"
                                                        placeholder="Describe the role, requirements, and benefits..."
                                                        value={formData.description}
                                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {selectedTemplate === 'SERVICE' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Service Title</label>
                                                    <Input
                                                        required
                                                        placeholder="e.g. Professional House Cleaning"
                                                        value={formData.title}
                                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                                    <select
                                                        className="w-full flex h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                                        value={formData.category}
                                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    >
                                                        <option value="Plumbing">Plumbing</option>
                                                        <option value="Electrical">Electrical</option>
                                                        <option value="Cleaning">Cleaning</option>
                                                        <option value="Carpentry">Carpentry</option>
                                                        <option value="Painting">Painting</option>
                                                        <option value="Photography">Photography</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price Range</label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            required
                                                            className="pl-10"
                                                            placeholder="e.g. 500 - 1000"
                                                            value={formData.price}
                                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            required
                                                            className="pl-10"
                                                            placeholder="City / Area"
                                                            value={formData.location}
                                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Service Description</label>
                                                    <textarea
                                                        required
                                                        className="w-full min-h-[120px] p-4 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 resize-none"
                                                        placeholder="What services do you provide? Describe your skills..."
                                                        value={formData.description}
                                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1 h-12 rounded-xl"
                                                onClick={() => setSelectedTemplate(null)}
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className={cn(
                                                    "flex-[2] h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary-200",
                                                    selectedTemplate === 'SERVICE' ? "bg-teal-600 hover:bg-teal-700" : "bg-primary-600 hover:bg-primary-700"
                                                )}
                                            >
                                                {loading ? 'Publishing...' :
                                                    selectedTemplate === 'JOB' ? 'Post Job' :
                                                        selectedTemplate === 'SERVICE' ? 'Publish Service' : 'Post Now'}
                                                {!loading && <Send className="ml-2 h-5 w-5" />}
                                            </Button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
