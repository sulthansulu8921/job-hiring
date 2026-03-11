import { useState, useEffect } from "react";
import { Search, Briefcase, MapPin, DollarSign, Clock, ChevronRight, XCircle, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AppliedJobs() {
    const { isAuthenticated, requireAuth } = useAuth();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    useEffect(() => {
        if (isAuthenticated) {
            fetchApplications();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const res = await api.get('/applications/');
            const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setApplications(data);
        } catch (err) {
            console.error("Error fetching applications:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = (applicationId: string) => {
        requireAuth(async () => {
            if (!confirm("Are you sure you want to withdraw this application?")) return;

            try {
                await api.delete(`/applications/${applicationId}/`);
                setApplications(prev => prev.filter(app => app.id !== applicationId));
            } catch (err: any) {
                console.error("Error withdrawing application:", err);
                alert(err.response?.data?.detail || "Failed to withdraw application");
            }
        });
    };

    const filteredApplications = applications.filter(app => {
        const job = app.job_details;
        if (!job) return false;

        const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        const lowerStatus = status?.toLowerCase() || '';
        if (lowerStatus.includes('applied')) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (lowerStatus.includes('viewed')) return 'bg-purple-100 text-purple-700 border-purple-200';
        if (lowerStatus.includes('accept') || lowerStatus.includes('shortlist')) return 'bg-green-100 text-green-700 border-green-200';
        if (lowerStatus.includes('reject')) return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Fetching your applications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b border-gray-200 px-4 py-8 md:px-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Applied Jobs</h1>
                    <p className="text-gray-500 mt-2">Track and manage all your job applications in one place.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by job title or company..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {['All', 'Applied', 'Viewed', 'Accepted', 'Rejected'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status === 'Accepted' ? 'accepted' : status.toLowerCase() === 'all' ? 'All' : status.toLowerCase())}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${statusFilter === status
                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredApplications.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredApplications.map((app) => {
                            const job = app.job_details;
                            return (
                                <div key={app.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-300">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="h-16 w-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform">
                                                <img
                                                    src={job?.company_logo || `https://ui-avatars.com/api/?name=${job?.company_name || 'Job'}&background=random`}
                                                    alt={job?.company_name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
                                                    {job?.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                                    <span className="font-medium text-gray-700">{job?.company_name}</span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" /> {job?.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="h-3.5 w-3.5" /> ₹{job?.salary_min} - ₹{job?.salary_max}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <Badge variant="outline" className={`px-2.5 py-0.5 font-bold capitalize ${getStatusColor(app.status)}`}>
                                                        {app.status || 'Applied'}
                                                    </Badge>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> Applied on {new Date(app.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                            <Button
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium flex-1 sm:flex-none justify-center px-2"
                                                onClick={() => handleWithdraw(app.id)}
                                            >
                                                <XCircle className="h-4 w-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Withdraw</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="rounded-xl border-gray-200 group-hover:border-primary-300 flex-1 sm:flex-none justify-center px-2"
                                                onClick={() => {
                                                    const autoMsg = `Hi! I'm following up on my application for the "${job?.title}" role.`;
                                                    window.location.href = `/inbox?userId=${job?.created_by}&message=${encodeURIComponent(autoMsg)}`;
                                                }}
                                            >
                                                <MessageSquare className="h-4 w-4 sm:mr-2" />
                                                <span className="hidden sm:inline">Chat</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="rounded-xl border-gray-200 group-hover:border-primary-300 flex-1 sm:flex-none justify-center px-2"
                                                onClick={() => window.location.href = `/jobs/id/${job?.id}`}
                                            >
                                                <span className="hidden sm:inline">Details</span>
                                                <ChevronRight className="h-4 w-4 sm:ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
                            <Briefcase className="h-10 w-10" />
                        </div>
                        <div className="max-w-sm">
                            <h3 className="text-xl font-bold text-gray-900">No applications found</h3>
                            <p className="text-gray-500 mt-2">
                                You haven't applied to any jobs yet. Start exploring opportunities that match your skills.
                            </p>
                        </div>
                        <Button onClick={() => window.location.href = '/jobs'} size="lg" className="rounded-2xl px-8 shadow-lg shadow-primary-200">
                            Explore Jobs
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
