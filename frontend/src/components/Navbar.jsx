import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, FileText, Upload, User } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!token) return null;

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                            RelocateHer
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="text-gray-600 hover:text-pink-600 flex items-center gap-1 transition-colors">
                            <Home className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                        <Link to="/questionnaire" className="text-gray-600 hover:text-pink-600 flex items-center gap-1 transition-colors">
                            <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Roadmap</span>
                        </Link>
                        <Link to="/upload" className="text-gray-600 hover:text-pink-600 flex items-center gap-1 transition-colors">
                            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Upload</span>
                        </Link>

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700 hidden md:inline">Hi, {user.name}</span>
                            <Link to="/profile" className="text-gray-600 hover:text-pink-600 flex items-center gap-1 transition-colors">
                                <User className="h-4 w-4" /> <span className="hidden sm:inline">Profile</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
                            >
                                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
