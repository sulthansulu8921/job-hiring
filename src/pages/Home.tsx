import { useState } from "react";
import Feed from "../components/feed/Feed";
import UrgentJobsRail from "../components/feed/UrgentJobsRail";
import { Button } from "../components/ui/Button";
import { SlidersHorizontal } from "lucide-react";
import JobFilters from "../components/feed/JobFilters";
import { AnimatePresence, motion } from "framer-motion";
import CreatePostFloater from "../components/social/CreatePostFloater";

export default function Home() {
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    return (
        <div className="relative max-w-[600px] mx-auto pb-20">
            {/* Mobile Filters Drawer */}
            <AnimatePresence>
                {showMobileFilters && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 md:hidden"
                            onClick={() => setShowMobileFilters(false)}
                        />
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-80 bg-white z-50 md:hidden overflow-y-auto shadow-2xl"
                        >
                            <div className="p-4">
                                <JobFilters onClose={() => setShowMobileFilters(false)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating Mobile Filter Button */}
            <div className="fixed bottom-20 right-4 z-40 md:hidden">
                <Button
                    variant="default"
                    size="icon"
                    className="rounded-full h-12 w-12 shadow-lg bg-primary-600"
                    onClick={() => setShowMobileFilters(true)}
                >
                    <SlidersHorizontal className="h-6 w-6 text-white" />
                </Button>
            </div>

            {/* Urgent Openings */}
            <UrgentJobsRail />

            {/* Main Feed */}
            <Feed />

            {/* Floating Create Button */}
            <CreatePostFloater />
        </div>
    );
}
