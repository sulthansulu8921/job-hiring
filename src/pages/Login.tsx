import { Button } from "../components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Lock, Mail, ArrowRight } from "lucide-react";
import logo from "../assets/logo.png";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        await login('dummy_access_token', 'dummy_refresh_token', {
            id: "1",
            name: "Test User",
            email: "test@example.com",
            role: "jobseeker",
            avatar: "https://ui-avatars.com/api/?name=Test+User&background=random",
            title: "Full Stack Developer",
            location: "Chennai, India",
            verified: true
        });
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-100/50 blur-3xl"></div>
                <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-blue-100/50 blur-3xl"></div>
            </div>

            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden relative z-10 transition-all hover:shadow-2xl">
                <div className="bg-primary-600 p-8 text-center pattern-grid-lg text-white relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800 opacity-90"></div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-auto h-32 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner p-4">
                            <img src={logo} alt="Thozhilurappu logo" className="h-full w-auto object-contain" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
                        <p className="text-primary-100 mt-2 text-sm font-medium">Log in to your specialized job portal</p>
                    </div>
                </div>

                <div className="p-8">
                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between ml-1">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full py-6 text-base font-semibold shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-200/50 transition-all transform hover:-translate-y-0.5" loading={loading}>
                            Sign in <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 hover:underline">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 text-center w-full text-xs text-gray-400">
                &copy; 2024 Thozhilurappu. Secure Job Portal.
            </div>
        </div>
    );
}
