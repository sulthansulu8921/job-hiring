import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../services/api';

interface Applicant {
    id: number;
    user: number;
    user_name: string;
    user_email: string;
    user_avatar: string | null;
    job: number;
    job_details: {
        title: string;
        company_name: string;
    };
    status: 'applied' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
    created_at: string;
}

export default function Applicants() {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchApplicants();
    }, []);

    const fetchApplicants = async () => {
        try {
            setLoading(true);
            const res = await api.get('/applications/employer/');
            const data = Array.isArray(res.data) ? res.data : res.data.results || [];
            setApplicants(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch applicants:', err);
            setError('Failed to load applicants.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await api.patch(`/applications/${id}/status/`, { status: newStatus });
            setApplicants(prev => prev.map(app =>
                app.id === id ? { ...app, status: newStatus as any } : app
            ));
        } catch (err: any) {
            console.error('Failed to update status:', err);
            const errorMsg = err.response?.data?.status?.[0] || err.response?.data?.detail || 'Failed to update status.';
            alert(`Error: ${errorMsg}`);
        }
    };

    const handleChat = (applicant: Applicant) => {
        const autoMsg = `Hi ${applicant.user_name}, I am reaching out regarding your application for the "${applicant.job_details?.title}" position.`;
        navigate(`/inbox?userId=${applicant.user}&message=${encodeURIComponent(autoMsg)}`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'shortlisted': case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Applicants</h1>
                    <p className="text-gray-500 mt-1">Manage users who have applied to your job postings.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {applicants.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="mx-auto w-24 h-24 mb-6 text-gray-200 flex items-center justify-center bg-gray-50 rounded-full">
                        <Clock className="w-12 h-12" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applicants yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        When users apply to your jobs, they will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {applicants.map((app) => (
                        <div key={app.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={app.user_avatar || `https://ui-avatars.com/api/?name=${app.user_name}&background=random`}
                                            alt={app.user_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{app.user_name}</h3>
                                            <p className="text-sm text-gray-500 mb-2">{app.user_email || "User Email"}</p>

                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span>Applied for: </span>
                                                <span className="font-medium truncate max-w-[150px] sm:max-w-[200px] block">{app.job_details?.title || 'Unknown Job'}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Applied {new Date(app.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-3 min-w-[140px] mt-4 sm:mt-0 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                        </span>

                                        <div className="flex gap-2">
                                            {app.status !== 'accepted' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(app.id, 'accepted')}
                                                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex-1 sm:flex-none flex justify-center"
                                                    title="Accept Applicant"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                            {app.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex-1 sm:flex-none flex justify-center"
                                                    title="Reject Applicant"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto flex items-center gap-2"
                                        onClick={() => handleChat(app)}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Chat with Applicant
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
