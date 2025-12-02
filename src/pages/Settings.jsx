import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import {
    FiSave, FiUpload, FiSettings, FiBriefcase, FiUsers, FiShield, FiEye, FiTrash2, FiEdit
} from 'react-icons/fi';
import Toast from '../components/Toast';
import Table from '../components/Table';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [activeTab, setActiveTab] = useState('company');
    const [users, setUsers] = useState([]);
    const [toast, setToast] = useState(null);

    const [settings, setSettings] = useState({
        companyName: 'Sandhya Softtech',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        logoBase64: '',
        primaryColor: '#F47920',
        secondaryColor: '#1B5E7E'
    });

    const roles = ['Admin', 'HR', 'Employee'];

    const permissions = {
        Admin: {
            dashboard: true,
            projects: true,
            sales: true,
            telecalling: true,
            expenses: true,
            inventory: true,
            employees: true,
            internship: true,
            certificates: true,
            idCards: true,
            documents: true,
            progress: true,
            tasks: true,
            reports: true,
            settings: true
        },
        HR: {
            dashboard: true,
            projects: false,
            sales: false,
            telecalling: false,
            expenses: false,
            inventory: false,
            employees: true,
            internship: true,
            certificates: true,
            idCards: true,
            documents: true,
            progress: true,
            tasks: true,
            reports: true,
            settings: false
        },
        Employee: {
            dashboard: true,
            projects: true,
            sales: true,
            telecalling: true,
            expenses: false,
            inventory: true,
            employees: false,
            internship: false,
            certificates: false,
            idCards: false,
            documents: true,
            progress: false,
            tasks: true,
            reports: false,
            settings: false
        }
    };

    const [rolePermissions, setRolePermissions] = useState(permissions);

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const fetchData = async () => {
        try {
            const [settingsSnap, usersSnap] = await Promise.all([
                getDocs(collection(db, 'settings')),
                getDocs(collection(db, 'users'))
            ]);

            if (!settingsSnap.empty) {
                const companyDoc = settingsSnap.docs.find(d => d.id === 'company');
                if (companyDoc) {
                    const settingsData = companyDoc.data();
                    setSettings(prev => ({ ...prev, ...settingsData }));
                    if (settingsData.rolePermissions) {
                        setRolePermissions(settingsData.rolePermissions);
                    }
                }
            }

            const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList);
        } catch (error) {
            console.error("Error fetching data:", error);
            showToast("Failed to load settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'company'), {
                ...settings,
                rolePermissions,
                updatedAt: new Date().toISOString()
            });
            showToast("✅ Settings saved successfully!", "success");
        } catch (error) {
            console.error("Error saving settings:", error);
            showToast("❌ Error saving settings. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            showToast("❌ Invalid file type! Please upload JPG, PNG, GIF, or WebP images only.", "error");
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast("❌ File too large! Image size must be less than 2MB.", "error");
            return;
        }

        setUploadingLogo(true);
        showToast("📤 Processing and saving image...", "info");

        // Convert to Base64 (No Firebase Storage, No CORS!)
        const reader = new FileReader();

        reader.onloadend = async () => {
            try {
                const base64String = reader.result;

                // Update local state
                setSettings(prev => ({
                    ...prev,
                    logoBase64: base64String
                }));

                // Auto-save to Firestore immediately
                await setDoc(doc(db, 'settings', 'company'), {
                    ...settings,
                    logoBase64: base64String,
                    rolePermissions,
                    updatedAt: new Date().toISOString()
                });

                showToast("✅ Logo uploaded and saved successfully!", "success");
                setUploadingLogo(false);
            } catch (error) {
                console.error("Error saving logo:", error);
                showToast("❌ Failed to save logo. Please try again.", "error");
                setUploadingLogo(false);
            }
        };

        reader.onerror = () => {
            showToast("❌ Failed to read file. Please try again.", "error");
            setUploadingLogo(false);
        };

        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = async () => {
        if (!window.confirm('Are you sure you want to remove the company logo?')) {
            return;
        }

        try {
            setUploadingLogo(true);

            // Update local state
            setSettings(prev => ({
                ...prev,
                logoBase64: ''
            }));

            // Save to Firestore
            await setDoc(doc(db, 'settings', 'company'), {
                ...settings,
                logoBase64: '',
                rolePermissions,
                updatedAt: new Date().toISOString()
            });

            showToast("✅ Logo removed successfully!", "success");
        } catch (error) {
            console.error("Error removing logo:", error);
            showToast("❌ Failed to remove logo. Please try again.", "error");
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleUserRoleChange = async (userId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showToast("✅ User role updated successfully!", "success");
        } catch (error) {
            console.error("Error updating user role:", error);
            showToast("❌ Error updating user role. Please try again.", "error");
        }
    };

    const handlePermissionToggle = (role, module) => {
        setRolePermissions({
            ...rolePermissions,
            [role]: {
                ...rolePermissions[role],
                [module]: !rolePermissions[role][module]
            }
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="flex items-center gap-3">
                <FiSettings className="w-8 h-8 text-[#F47920]" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage company profile, roles, permissions, and theme</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                {[
                    { key: 'company', label: 'Company Profile', icon: <FiBriefcase /> },
                    { key: 'roles', label: 'User Roles', icon: <FiUsers /> },
                    { key: 'permissions', label: 'Permissions', icon: <FiShield /> },
                    { key: 'theme', label: 'Theme', icon: <FiSettings /> }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === tab.key
                            ? 'text-[#F47920] border-b-2 border-[#F47920]'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Company Profile Tab */}
            {activeTab === 'company' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Company Information</h2>

                    <div className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-32 border border-gray-200 rounded-lg p-2 flex items-center justify-center bg-gray-50 overflow-hidden">
                                    {settings.logoBase64 ? (
                                        <img
                                            src={settings.logoBase64}
                                            alt="Company Logo"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-gray-400 text-sm">No Logo</span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {settings.logoBase64 ? (
                                        <>
                                            <label className={`flex items-center gap-2 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg cursor-pointer hover:bg-[#164A5E] transition-colors ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <FiEdit />
                                                {uploadingLogo ? 'Processing...' : 'Change Logo'}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    disabled={uploadingLogo}
                                                />
                                            </label>
                                            <button
                                                onClick={handleRemoveLogo}
                                                disabled={uploadingLogo}
                                                className={`flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <FiTrash2 />
                                                Remove Logo
                                            </button>
                                        </>
                                    ) : (
                                        <label className={`flex items-center gap-2 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg cursor-pointer hover:bg-[#164A5E] transition-colors ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <FiUpload />
                                            {uploadingLogo ? 'Processing...' : 'Upload Logo'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                disabled={uploadingLogo}
                                            />
                                        </label>
                                    )}
                                    <p className="text-xs text-gray-500">PNG or JPG, max 2MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyName}
                                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyEmail}
                                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyPhone}
                                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                                <input
                                    type="url"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyWebsite}
                                    onChange={(e) => setSettings({ ...settings, companyWebsite: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={settings.companyAddress}
                                    onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                                    placeholder="Company address..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Roles Tab */}
            {activeTab === 'roles' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">User Role Management</h2>

                    <div className="mb-6">
                        <h3 className="font-medium text-gray-700 mb-3">Available Roles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {roles.map(role => (
                                <div key={role} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${role === 'Admin' ? 'bg-red-100 text-red-600' :
                                            role === 'HR' ? 'bg-blue-100 text-blue-600' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                            <FiUsers />
                                        </div>
                                        <h4 className="font-bold text-gray-800">{role}</h4>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {role === 'Admin' && 'Full system access'}
                                        {role === 'HR' && 'Employee & HR management'}
                                        {role === 'Employee' && 'Limited access'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-700 mb-3">Assign User Roles</h3>
                        <Table
                            headers={['User', 'Email', 'Current Role', 'Change Role']}
                            dense
                        >
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell className="font-medium text-gray-900">
                                        {user.name || 'N/A'}
                                    </Table.Cell>
                                    <Table.Cell className="text-gray-600 text-truncate">
                                        {user.email}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span
                                            className={`badge ${
                                                user.role === 'Admin'
                                                    ? 'badge-error'
                                                    : user.role === 'HR'
                                                    ? 'badge-info'
                                                    : 'badge-success'
                                            }`}
                                        >
                                            {user.role || 'Employee'}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <select
                                            className="form-select text-sm"
                                            value={user.role || 'Employee'}
                                            onChange={(e) =>
                                                handleUserRoleChange(user.id, e.target.value)
                                            }
                                        >
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </Table.Cell>
                                </tr>
                            ))}
                        </Table>
                    </div>
                </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Permission Management</h2>
                    <p className="text-sm text-gray-600 mb-6">Configure module access for each role</p>

                    <div className="overflow-x-auto">
                        <Table
                            headers={['Module', 'Admin', 'HR', 'Employee']}
                            dense
                            className="min-w-[700px]"
                        >
                            {Object.keys(rolePermissions.Admin).map((module) => (
                                <tr key={module} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell className="font-medium text-gray-900 capitalize">
                                        {module.replace(/([A-Z])/g, ' $1').trim()}
                                    </Table.Cell>
                                    {roles.map((role) => (
                                        <Table.Cell key={role} align="center">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-[#F47920] border-gray-300 rounded focus:ring-[#F47920]"
                                                    checked={rolePermissions[role][module]}
                                                    onChange={() =>
                                                        handlePermissionToggle(role, module)
                                                    }
                                                />
                                            </label>
                                        </Table.Cell>
                                    ))}
                                </tr>
                            ))}
                        </Table>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                            <FiEye className="text-blue-600 mt-1" />
                            <div>
                                <h4 className="font-medium text-blue-900 mb-1">Permission Guide</h4>
                                <p className="text-sm text-blue-700">
                                    Check the boxes to grant access to specific modules for each role.
                                    Admin should have full access, HR manages people-related modules,
                                    and Employees have limited operational access.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Theme Settings</h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color (Orange)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color (Teal)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                                        value={settings.secondaryColor}
                                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={settings.secondaryColor}
                                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 mb-3">Color Preview</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-lg text-white text-center font-medium shadow-sm transition-transform hover:scale-105" style={{ backgroundColor: settings.primaryColor }}>
                                    Primary Color
                                    <div className="text-sm mt-2 opacity-90">{settings.primaryColor}</div>
                                </div>
                                <div className="p-6 rounded-lg text-white text-center font-medium shadow-sm transition-transform hover:scale-105" style={{ backgroundColor: settings.secondaryColor }}>
                                    Secondary Color
                                    <div className="text-sm mt-2 opacity-90">{settings.secondaryColor}</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Theme changes will be applied after saving and refreshing the page.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end sticky bottom-6 z-10">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                >
                    <FiSave />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
