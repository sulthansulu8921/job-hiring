import { useNavigate } from "react-router-dom";
import { Building2, Zap, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full-Time",
    part_time: "Part-Time",
    remote: "Remote",
};

const JOB_TYPE_COLORS: Record<string, string> = {
    full_time: "bg-blue-50 text-blue-700 border-blue-100",
    part_time: "bg-amber-50 text-amber-700 border-amber-100",
    remote: "bg-teal-50 text-teal-700 border-teal-100",
};

function formatSalary(min?: number | null, max?: number | null): string {
    if (!min && !max) return "Competitive";
    const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString()}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

export function JobCard({ job, onApply }: { job: any; onApply?: (id: number, posterId?: number) => void }) {
    const navigate = useNavigate();

    const handleApplyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onApply) {
            onApply(job.id, job.created_by || job.user || job.user_id);
        } else {
            navigate(`/jobs/id/${job.id}`);
        }
    };

    return (
        <div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer group"
            onClick={() => navigate(`/jobs/id/${job.id}`)}
        >
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Company Logo */}
                    <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {job.company_logo ? (
                            <img src={job.company_logo} alt={job.company_name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                                <Building2 className="h-6 w-6 text-primary-600" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors leading-tight">
                                    {job.title}
                                </h3>
                                <p
                                    className="text-sm text-gray-500 mt-0.5 hover:underline cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const uid = job.created_by || job.user || job.user_id;
                                        if (uid) navigate(`/profile/${uid}`);
                                    }}
                                >
                                    {job.company_name}
                                </p>
                            </div>
                            {job.is_urgent && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full">
                                    <Zap className="h-3 w-3 fill-red-500" />
                                    Urgent
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                {timeAgo(job.created_at)}
                            </span>
                            {job.experience && (
                                <span className="text-gray-500">{job.experience} exp.</span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className={cn(
                                "text-xs font-semibold px-2.5 py-1 rounded-full border",
                                JOB_TYPE_COLORS[job.job_type] || "bg-gray-50 text-gray-600 border-gray-100"
                            )}>
                                {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                            </span>
                            <span className="text-sm font-semibold text-gray-800">
                                {formatSalary(job.salary_min, job.salary_max)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-gray-400 truncate max-w-[70%]">{job.description}</p>
                    <Button
                        size="sm"
                        className="rounded-full bg-primary-600 hover:bg-primary-700 text-white px-5 gap-1.5 flex-shrink-0"
                        onClick={handleApplyClick}
                    >
                        Apply <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default JobCard;
