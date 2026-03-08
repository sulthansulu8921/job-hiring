import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Github, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function AuthModal() {
    const { isAuthModalOpen, closeAuthModal, login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError("");
            try {
                const res = await api.post('/auth/google/', {
                    access_token: tokenResponse.access_token
                });
                const { tokens, user } = res.data;
                login(tokens.access, tokens.refresh, user);
                closeAuthModal();
            } catch (err: any) {
                setError("Google login failed. Please try again.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError("Google login failed")
    });

    if (!isAuthModalOpen) return null;

    const handleSubmit = async () => {
        setError("");
        setLoading(true);
        try {
            if (isLogin) {
                const res = await api.post('/auth/login/', {
                    email: form.email,
                    password: form.password
                });
                const { access, refresh } = res.data;

                // Fetch user data
                api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
                const userRes = await api.get('/auth/me/');

                login(access, refresh, userRes.data);
            } else {
                if (!form.name || !form.email || !form.password) {
                    throw new Error("All fields are required");
                }
                await api.post('/auth/register/', {
                    name: form.name,
                    email: form.email,
                    password: form.password
                });
                // Assuming register returns user data, but we need to login after
                // Let's just switch to login mode or show success
                setIsLogin(true);
                setError("");
                alert("Account created successfully! Please log in.");
                return;
            }
            closeAuthModal();
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.error || err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isLogin ? "Welcome Back" : "Join Thozhilurappu"}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={closeAuthModal} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <p className="text-gray-600 mb-2">
                                {isLogin
                                    ? "Sign in to apply for jobs and interact with posts."
                                    : "Create an account to build your professional profile."}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                    <Input
                                        type="text"
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                            </div>

                            <Button
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLogin ? "Sign In" : "Create Account"}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="w-full">
                                    <Github className="mr-2 h-4 w-4" /> GitHub
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => handleGoogleLogin()}>
                                    <Mail className="mr-2 h-4 w-4" /> Google
                                </Button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 text-center text-sm">
                            <span className="text-gray-600">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                            </span>
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                                className="font-semibold text-primary-600 hover:text-primary-700"
                            >
                                {isLogin ? "Sign up" : "Log in"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
