import React, { useState, useEffect } from "react";
import {
    User,
    Bell,
    Shield,
    Lock,
    Eye,
    Mail,
    Key,
    ChevronRight,
    Save,
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { cn } from "../utils/cn";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type TabType = "account" | "notifications" | "privacy" | "security";

export default function Settings() {
    const { user, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("account");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const [accountData, setAccountData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        location: user?.location || "",
        bio: user?.bio || "",
    });

    const [settingsData, setSettingsData] = useState({
        email_notifications: true,
        profile_visibility: "public",
        two_factor_auth: false,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get("/settings/");
                setSettingsData(res.data);
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleAccountUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");
        try {
            const res = await api.patch("/auth/me/", accountData);
            updateProfile(res.data);
            setSuccessMsg("Account updated successfully!");
        } catch (err) {
            setErrorMsg("Failed to update account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsUpdate = async (newSettings: Partial<typeof settingsData>) => {
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");
        try {
            const updated = { ...settingsData, ...newSettings };
            const res = await api.patch("/settings/update/", updated);
            setSettingsData(res.data);
            setSuccessMsg("Settings updated successfully!");
        } catch (err) {
            setErrorMsg("Failed to update settings.");
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: any }[] = [
        { id: "account", label: "Account", icon: User },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "privacy", label: "Privacy", icon: Eye },
        { id: "security", label: "Security", icon: Shield },
    ];

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
                <p className="text-gray-500">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 flex flex-col gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                                activeTab === tab.id
                                    ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon className="h-5 w-5" />
                                {tab.label}
                            </div>
                            <ChevronRight className={cn("h-4 w-4", activeTab === tab.id ? "opacity-100" : "opacity-0")} />
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                    {successMsg && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <p className="text-sm font-medium">{successMsg}</p>
                        </div>
                    )}
                    {errorMsg && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-sm font-medium">{errorMsg}</p>
                        </div>
                    )}

                    {activeTab === "account" && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
                                <p className="text-gray-500 text-sm">Update your basic profile details.</p>
                            </div>
                            <form onSubmit={handleAccountUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                        <Input
                                            value={accountData.name}
                                            onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                        <Input
                                            value={accountData.email}
                                            disabled
                                            className="bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Location</label>
                                    <Input
                                        value={accountData.location}
                                        onChange={(e) => setAccountData({ ...accountData, location: e.target.value })}
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Bio</label>
                                    <textarea
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all h-24"
                                        value={accountData.bio}
                                        onChange={(e) => setAccountData({ ...accountData, bio: e.target.value })}
                                        placeholder="Tell us a bit about yourself..."
                                    />
                                </div>
                                <Button type="submit" className="w-full sm:w-auto gap-2" loading={loading}>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </Button>
                            </form>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                                <p className="text-gray-500 text-sm">Manage how you receive updates.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Email Notifications</h4>
                                            <p className="text-xs text-gray-500">Receive summaries, job alerts, and messages via email.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSettingsUpdate({ email_notifications: !settingsData.email_notifications })}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                            settingsData.email_notifications ? "bg-primary-600" : "bg-gray-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            settingsData.email_notifications ? "translate-x-6" : "translate-x-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "privacy" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
                                <p className="text-gray-500 text-sm">Control who can see your profile and activity.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                            <Eye className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Profile Visibility</h4>
                                            <p className="text-xs text-gray-500">Determine if your profile is visible to everyone or only connections.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-xl">
                                        <button
                                            onClick={() => handleSettingsUpdate({ profile_visibility: "public" })}
                                            className={cn(
                                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                                settingsData.profile_visibility === "public" ? "bg-primary-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                                            )}
                                        >
                                            Public
                                        </button>
                                        <button
                                            onClick={() => handleSettingsUpdate({ profile_visibility: "private" })}
                                            className={cn(
                                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                                settingsData.profile_visibility === "private" ? "bg-primary-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50"
                                            )}
                                        >
                                            Connections Only
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Security</h2>
                                <p className="text-gray-500 text-sm">Keep your account safe and secure.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">2-Factor Authentication</h4>
                                            <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSettingsUpdate({ two_factor_auth: !settingsData.two_factor_auth })}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                            settingsData.two_factor_auth ? "bg-primary-600" : "bg-gray-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                            settingsData.two_factor_auth ? "translate-x-6" : "translate-x-1"
                                        )} />
                                    </button>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                            <Key className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Change Password</h4>
                                            <p className="text-xs text-gray-500">It's a good idea to use a strong password that you're not using elsewhere.</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto font-bold border-gray-200">Update Password</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
