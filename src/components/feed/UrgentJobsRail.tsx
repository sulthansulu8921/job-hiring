import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Zap, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import api from "../../services/api";

export default function UrgentJobsRail() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [urgentJobs, setUrgentJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUrgentJobs = async () => {
            try {
                const res = await api.get('/jobs/urgent/');
                const jobData = Array.isArray(res.data) ? res.data : res.data.results || [];
                setUrgentJobs(jobData);
            } catch (err) {
                console.error("Failed to fetch urgent jobs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUrgentJobs();
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    if (loading || urgentJobs.length === 0) {
        return null;
    }

    return (
        <div className="relative mb-6 group">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <h2 className="text-lg font-bold text-gray-900">Urgent Openings</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-primary-600 transition-colors hidden md:flex"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-1.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-primary-600 transition-colors hidden md:flex"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            >
                {urgentJobs.map((job) => (
                    <Link
                        to={`/jobs/id/${job.id}`}
                        key={`urgent-${job.id}`}
                        className="min-w-[280px] md:min-w-[300px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 snap-center hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 -mr-10 -mt-10 pointer-events-none bg-gradient-to-br from-red-500 to-orange-600`}></div>

                        <div className="flex items-start justify-between mb-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm`}>
                                <img src={job.company_logo || `https://ui-avatars.com/api/?name=${job.company_name}&background=random`} alt={job.company_name} className="h-full w-full object-cover" />
                            </div>
                            <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">
                                Urgent
                            </span>
                        </div>

                        <h3 className="font-bold text-gray-900 mb-1 truncate">{job.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">{job.company_name}</p>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(job.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                            <span className="font-semibold text-primary-700 text-sm">₹{job.salary_min} - ₹{job.salary_max}</span>
                            <Button size="sm" className="h-8 text-xs rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-100 shadow-none text-center">
                                Apply
                            </Button>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
