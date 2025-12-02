import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { FiMenu, FiBell, FiUser, FiLogOut } from 'react-icons/fi';

const Navbar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        const titles = {
            '/': 'Dashboard',
            '/projects': 'Projects',
            '/sales': 'Sales',
            '/telecalling': 'Telecalling',
            '/employees': 'Employees',
            '/expenses': 'Expenses',
            '/inventory': 'Inventory',
            '/internship': 'Internship',
            '/certificates': 'Certificates',
            '/id-cards': 'ID Cards',
            '/documents': 'Documents',
            '/progress': 'Progress',
            '/tasks': 'Tasks',
            '/reports': 'Reports',
            '/settings': 'Settings'
        };
        return titles[path] || 'Dashboard';
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-[#F47920]"
                        aria-label="Toggle Sidebar"
                    >
                        <FiMenu className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                        {getPageTitle()}
                    </h1>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-[#F47920]"
                        aria-label="Notifications"
                    >
                        <FiBell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
                        <div className="hidden md:block text-right">
                            <p className="text-sm font-medium text-gray-800">
                                {currentUser?.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#F47920] to-[#E06810] flex items-center justify-center text-white font-bold shadow-md">
                                <FiUser className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-700 hover:text-red-600"
                                aria-label="Logout"
                                title="Logout"
                            >
                                <FiLogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
