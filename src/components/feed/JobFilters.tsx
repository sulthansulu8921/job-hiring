import { useState, useEffect, useRef } from "react";
import { MapPin, X, SlidersHorizontal } from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";

interface JobFiltersProps {
    className?: string;
    onClose?: () => void;
}

const JOB_TYPES = [
    { label: "Full-Time", value: "full_time" },
    { label: "Part-Time", value: "part_time" },
    { label: "Remote", value: "remote" },
];

const EXPERIENCE_OPTIONS = ["Fresher", "1-3 Years", "3-5 Years", "5+ Years"];

const INDIA_LOCATIONS = [
    // Kerala Districts
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
    "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad",

    // Tamil Nadu Districts
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
    "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
    "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet",
    "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",

    // Karnataka Districts
    "Bagalkot", "Ballari (Bellary)", "Belagavi (Belgaum)", "Bengaluru (Bangalore) Rural", "Bengaluru (Bangalore) Urban",
    "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru (Chikmagalur)", "Chitradurga", "Dakshina Kannada",
    "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi (Gulbarga)", "Kodagu", "Kolar", "Koppal",
    "Mandya", "Mysuru (Mysore)", "Raichur", "Ramanagara", "Shivamogga (Shimoga)", "Tumakuru (Tumkur)", "Udupi",
    "Uttara Kannada (Karwar)", "Vijayapura (Bijapur)", "Yadgir",

    // Other Major Indian Cities
    "Mumbai", "Delhi", "Hyderabad", "Ahmedabad", "Kolkata", "Surat", "Pune", "Jaipur",
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna",
    "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli",
    "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad",
    "Ranchi", "Howrah", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Raipur",
    "Kota", "Guwahati", "Chandigarh", "Solapur", "Bareilly",
    "Aligarh", "Gurgaon", "Moradabad", "Jalandhar", "Bhubaneswar", "Warangal", "Mira-Bhayandar",
    "Jalgaon", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Noida",
    "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", "Kochi", "Bhavnagar", "Dehradun", "Durgapur", "Asansol",
    "Nanded", "Kolhapur", "Ajmer", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar",
    "Jammu", "Sangli-Miraj & Kupwad", "Mangalore", "Kurnool", "Ambattur", "Rajahmundry",
    "Malegaon", "Gaya", "Udaipur", "Kakinada", "Maheshtala", "Rajpur Sonarpur",
    "Bokaro", "South Dumdum", "Patiala", "Gopalpur", "Agartala", "Bhagalpur", "Muzaffarnagar", "Bhatpara",
    "Panihati", "Latur", "Dhule", "Rohtak", "Korba", "Bhilwara", "Brahmapur", "Muzaffarpur", "Ahmednagar", "Mathura",
    "Avadi", "Kadapa", "Rajahmundry", "Bilaspur", "Shahjahanpur", "Kamhati",
    "Hisar", "Ozhukarai", "Bihar Sharif", "Darbhanga", "Farrukhabad", "Nizamabad", "Aizawl", "Parbhani", "Bathinda",
    "Purnia", "Anantapur", "Tirupati", "Ramagundam", "New Delhi", "Sri Ganganagar", "Karimnagar", "Panipat",
    "Hapur", "Arrah",

    // States
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",

    // Union Territories
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep",
    "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
].sort();

export default function JobFilters({ className, onClose }: JobFiltersProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [location_, setLocation] = useState(searchParams.get("location") || "");
    const [jobTypes, setJobTypes] = useState<string[]>(
        searchParams.get("job_type") ? searchParams.get("job_type")!.split(",") : []
    );
    const [salaryMin, setSalaryMin] = useState(searchParams.get("salary_min") || "");
    const [salaryMax, setSalaryMax] = useState(searchParams.get("salary_max") || "");
    const [experience, setExperience] = useState(searchParams.get("experience") || "");

    const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
    const locationRef = useRef<HTMLDivElement>(null);

    const isJobPage = location.pathname.startsWith("/jobs");

    const isMounted = useRef(false);

    // Handle outside click for location dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
                setLocationDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        const timer = setTimeout(() => {
            const basePath = isJobPage ? location.pathname : "/jobs";

            const params = new URLSearchParams(searchParams);

            // Start context from page 1 on new filters
            params.delete("page");

            if (location_) params.set("location", location_);
            else params.delete("location");

            if (jobTypes.length > 0) params.set("job_type", jobTypes.join(","));
            else params.delete("job_type");

            if (salaryMin) params.set("salary_min", salaryMin);
            else params.delete("salary_min");

            if (salaryMax) params.set("salary_max", salaryMax);
            else params.delete("salary_max");

            if (experience) params.set("experience", experience);
            else params.delete("experience");

            navigate(`${basePath}?${params.toString()}`, { replace: true });
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location_, jobTypes, salaryMin, salaryMax, experience]);

    const clearFilters = () => {
        setLocation("");
        setJobTypes([]);
        setSalaryMin("");
        setSalaryMax("");
        setExperience("");
        if (isJobPage) {
            setSearchParams({});
        }
    };

    const toggleJobType = (value: string) => {
        setJobTypes(prev =>
            prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
        );
    };

    const hasFilters = location_ || jobTypes.length || salaryMin || salaryMax || experience;

    return (
        <div className={cn("bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary-600" />
                    <h3 className="font-bold text-gray-900 text-sm">Filters</h3>
                </div>
                <div className="flex items-center gap-1">
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-primary-600 font-semibold hover:underline"
                        >
                            Clear all
                        </button>
                    )}
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 md:hidden">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5" ref={locationRef}>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Location</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="e.g. Kozhikode"
                        value={location_}
                        onChange={e => {
                            setLocation(e.target.value);
                            setLocationDropdownOpen(true);
                        }}
                        onFocus={() => setLocationDropdownOpen(true)}
                        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                    />

                    {/* Location Autocomplete Dropdown */}
                    {locationDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto overflow-x-hidden">
                            {INDIA_LOCATIONS.filter(loc => loc.toLowerCase().includes(location_.toLowerCase())).length > 0 ? (
                                INDIA_LOCATIONS.filter(loc => loc.toLowerCase().includes(location_.toLowerCase())).map((loc) => (
                                    <button
                                        key={loc}
                                        type="button"
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                                        onClick={() => {
                                            setLocation(loc);
                                            setLocationDropdownOpen(false);
                                        }}
                                    >
                                        {loc}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    No locations found
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Job Type */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Job Type</label>
                <div className="space-y-1.5">
                    {JOB_TYPES.map(({ label, value }) => (
                        <label key={value} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-gray-900 group">
                            <div
                                onClick={() => toggleJobType(value)}
                                className={cn(
                                    "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer",
                                    jobTypes.includes(value)
                                        ? "bg-primary-600 border-primary-600"
                                        : "border-gray-300 group-hover:border-primary-400"
                                )}
                            >
                                {jobTypes.includes(value) && (
                                    <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            {label}
                        </label>
                    ))}
                </div>
            </div>

            {/* Salary */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Salary (₹)</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={salaryMin}
                        onChange={e => setSalaryMin(e.target.value)}
                        className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={salaryMax}
                        onChange={e => setSalaryMax(e.target.value)}
                        className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                    />
                </div>
            </div>

            {/* Experience */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Experience</label>
                <div className="space-y-1.5">
                    {EXPERIENCE_OPTIONS.map(exp => (
                        <label key={exp} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            <input
                                type="radio"
                                name="experience"
                                checked={experience === exp}
                                onChange={() => setExperience(exp === experience ? "" : exp)}
                                className="text-primary-600 border-gray-300 focus:ring-primary-500"
                            />
                            {exp}
                        </label>
                    ))}
                </div>
            </div>

        </div>
    );
}
