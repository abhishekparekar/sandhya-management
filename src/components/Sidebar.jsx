import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FiHome, FiUsers, FiBriefcase, FiDollarSign, FiPhone,
    FiBox, FiFileText, FiAward, FiLogOut, FiSettings,
    FiTrendingUp, FiCheckSquare, FiCreditCard, FiBarChart2,
    FiUserPlus, FiActivity, FiList, FiFolder, FiChevronRight
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [logo, setLogo] = useState('/logo.jpg');

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'company'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.logoBase64) {
                    setLogo(data.logoBase64);
                } else {
                    setLogo('/logo.jpg');
                }
            }
        }, (error) => {
            console.error("Error fetching logo:", error);
            setLogo('/logo.jpg');
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const menuSections = [
        {
            title: 'Main',
            items: [
                {
                    path: '/',
                    label: 'Dashboard',
                    icon: FiHome,
                    badge: null
                },
            ]
        },
        {
            title: 'Business',
            items: [
                { path: '/projects', label: 'Projects', icon: FiBriefcase },
                { path: '/sales', label: 'Sales', icon: FiDollarSign },
                { path: '/telecalling', label: 'Telecalling', icon: FiPhone },
                { path: '/expenses', label: 'Expenses', icon: FiCreditCard },
                { path: '/inventory', label: 'Inventory', icon: FiBox },
            ]
        },
        {
            title: 'Team',
            items: [
                { path: '/employees', label: 'Employees', icon: FiUsers },
                { path: '/internship', label: 'Internship', icon: FiUserPlus },
                { path: '/tasks', label: 'Tasks', icon: FiCheckSquare },
                { path: '/progress', label: 'Progress', icon: FiActivity },
            ]
        },
        {
            title: 'Documents',
            items: [
                { path: '/certificates', label: 'Certificates', icon: FiAward },
                { path: '/id-cards', label: 'ID Cards', icon: FiCreditCard },
                { path: '/documents', label: 'Documents', icon: FiFolder },
            ]
        },
        {
            title: 'Analytics',
            items: [
                { path: '/reports', label: 'Reports', icon: FiBarChart2 },
            ]
        },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed md:relative bg-white text-gray-800 transition-all duration-300 ease-in-out h-full z-30 border-r border-gray-200 ${isSidebarOpen ? 'w-72 translate-x-0 shadow-2xl' : 'w-0 md:w-20 -translate-x-full md:translate-x-0'
                    } flex flex-col`}
            >
                {/* Logo Section */}
                <div className={`p-4 border-b border-gray-200 bg-gradient-to-br from-[#F47920] to-[#E06810] transition-all duration-300 ${isSidebarOpen ? 'min-h-[110px]' : 'md:min-h-[80px] min-h-[110px]'
                    }`}>
                    <div className={`transition-all duration-300 ${!isSidebarOpen && 'md:hidden'}`}>
                        <div className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <img
                                src={logo}
                                alt="Company Logo"
                                className="w-full h-auto max-w-[200px] max-h-[70px] object-contain mx-auto"
                                onError={(e) => {
                                    e.target.src = '/logo.jpg';
                                }}
                            />
                        </div>
                    </div>
                    {!isSidebarOpen && (
                        <div className="hidden md:flex items-center justify-center h-full">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-lg flex items-center justify-center hover:shadow-xl transition-all hover:scale-110">
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="w-full h-full object-contain p-1"
                                    onError={(e) => {
                                        e.target.src = '/logo.jpg';
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar bg-gray-50">
                    {menuSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
                            {/* Section Title */}
                            {isSidebarOpen && (
                                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {section.title}
                                </h3>
                            )}

                            {/* Section Items */}
                            <ul className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    const Icon = item.icon;

                                    return (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                onClick={() => setIsSidebarOpen(false)}
                                                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
                                                        ? 'bg-gradient-to-r from-[#F47920] to-[#E06810] text-white shadow-md'
                                                        : 'text-gray-700 hover:bg-white hover:shadow-sm'
                                                    }`}
                                            >
                                                {/* Icon */}
                                                <span className={`flex items-center justify-center transition-all ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-[#F47920]'
                                                    }`}>
                                                    <Icon className="w-5 h-5" />
                                                </span>

                                                {/* Label */}
                                                <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${!isSidebarOpen ? 'md:opacity-0 md:w-0 overflow-hidden' : 'opacity-100'
                                                    }`}>
                                                    {item.label}
                                                </span>

                                                {/* Active Indicator Arrow */}
                                                {isActive && isSidebarOpen && (
                                                    <span className="ml-auto">
                                                        <FiChevronRight className="w-4 h-4" />
                                                    </span>
                                                )}

                                                {/* Badge (if any) */}
                                                {item.badge && isSidebarOpen && (
                                                    <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                                                        {item.badge}
                                                    </span>
                                                )}

                                                {/* Tooltip for collapsed state */}
                                                {!isSidebarOpen && (
                                                    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-50 shadow-xl">
                                                        {item.label}
                                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                                    </div>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Settings & Logout Section */}
                <div className="p-3 border-t border-gray-200 bg-white space-y-1">
                    {/* Settings */}
                    <Link
                        to="/settings"
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${location.pathname === '/settings'
                                ? 'bg-gradient-to-r from-[#F47920] to-[#E06810] text-white shadow-md'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <FiSettings className={`w-5 h-5 ${location.pathname === '/settings' ? 'text-white' : 'text-gray-600 group-hover:text-[#F47920]'
                            }`} />
                        <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${!isSidebarOpen ? 'md:opacity-0 md:w-0 overflow-hidden' : 'opacity-100'
                            }`}>
                            Settings
                        </span>
                        {!isSidebarOpen && (
                            <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-50 shadow-xl">
                                Settings
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                        )}
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 group relative ${!isSidebarOpen ? 'justify-center' : ''
                            }`}
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${!isSidebarOpen ? 'md:opacity-0 md:w-0 overflow-hidden' : 'opacity-100'
                            }`}>
                            Logout
                        </span>
                        {!isSidebarOpen && (
                            <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-50 shadow-xl">
                                Logout
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-red-600"></div>
                            </div>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
