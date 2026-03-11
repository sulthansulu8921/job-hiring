import type { ReactNode } from 'react';
import Sidebar from './sidebar/Sidebar';
import BottomNav from './bottom-nav/BottomNav';
import JobFilters from '../feed/JobFilters';
import { GroupsSidebar } from './sidebar/GroupsSidebar';
import Topbar from './Topbar';
import NotificationToast from './NotificationToast';
import { useState } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex bg-slate-50 min-h-screen font-sans relative">
            {/* Mobile Backdrop Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed justify-center z-[49] inset-0 md:hidden bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                <Topbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

                <main className="flex-1 w-full max-w-7xl mx-auto flex gap-6 pt-4 px-0 md:px-4 lg:px-6">
                    {/* Main Feed/Content Area */}
                    <div className="flex-1 min-w-0 pb-20 md:pb-8">
                        {children}
                    </div>

                    {/* Right Sidebar - Filters & Trending */}
                    <aside className="hidden xl:block w-80 sticky top-4 h-[calc(100vh-2rem)] space-y-4 overflow-y-auto pb-4 scrollbar-hide">
                        <JobFilters />
                        <GroupsSidebar />

                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mt-4">
                            <h3 className="font-bold text-gray-900 mb-4 text-sm">Suggested for you</h3>
                            <div className="text-sm text-gray-500">
                                Connect with verified employers to boost your trust score.
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 px-2 mt-4">
                            &copy; 2024 Thozhilurappu • Privacy • Terms
                        </div>
                    </aside>
                </main>
            </div>
            <BottomNav />

            {/* Global notification toast overlay */}
            <NotificationToast />
        </div>
    );
}

