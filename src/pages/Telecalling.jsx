import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiPhone, FiUpload, FiCalendar,
    FiCheckCircle, FiX, FiClock, FiTrendingUp, FiUsers, FiAlertCircle, FiPhoneOff
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Card from '../components/Card';

const Telecalling = () => {
    const [leads, setLeads] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, today, followups, performance
    const [bulkData, setBulkData] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        company: '',
        source: '',
        status: 'Not Picked',
        followUpDate: '',
        notes: '',
        telecaller: '',
        lastCallDate: new Date().toISOString().split('T')[0],
        callCount: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const leadsSnap = await getDocs(collection(db, 'leads'));
            const leadsList = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeads(leadsList);

            const employeesSnap = await getDocs(collection(db, 'employees'));
            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(employeesList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const leadData = {
                ...formData,
                createdAt: editingLead ? editingLead.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingLead) {
                await updateDoc(doc(db, 'leads', editingLead.id), leadData);
            } else {
                await addDoc(collection(db, 'leads'), leadData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving lead:", error);
            alert("Error saving lead. Please try again.");
        }
    };

    const handleBulkUpload = async () => {
        try {
            const lines = bulkData.trim().split('\n');
            const leads = lines.map(line => {
                const [name, phone, email, company] = line.split(',').map(s => s.trim());
                return {
                    name: name || '',
                    phone: phone || '',
                    email: email || '',
                    company: company || '',
                    source: 'Bulk Upload',
                    status: 'Not Picked',
                    followUpDate: '',
                    notes: '',
                    telecaller: '',
                    lastCallDate: new Date().toISOString().split('T')[0],
                    callCount: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            });

            for (const lead of leads) {
                if (lead.name && lead.phone) {
                    await addDoc(collection(db, 'leads'), lead);
                }
            }

            fetchData();
            setShowBulkUploadModal(false);
            setBulkData('');
            alert(`Successfully uploaded ${leads.length} leads!`);
        } catch (error) {
            console.error("Error bulk uploading:", error);
            alert("Error uploading leads. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await deleteDoc(doc(db, 'leads', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting lead:", error);
            }
        }
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setFormData(lead);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingLead(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            company: '',
            source: '',
            status: 'Not Picked',
            followUpDate: '',
            notes: '',
            telecaller: '',
            lastCallDate: new Date().toISOString().split('T')[0],
            callCount: 0
        });
    };

    const handleQuickStatusUpdate = async (leadId, newStatus) => {
        try {
            await updateDoc(doc(db, 'leads', leadId), {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            fetchData();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const totalLeads = leads.length;
    const todayCalls = leads.filter(l => l.lastCallDate === today).length;
    const interestedLeads = leads.filter(l => l.status === 'Interested').length;
    const followUpLeads = leads.filter(l => l.followUpDate && l.followUpDate >= today && l.status !== 'Interested').length;
    const notPickedLeads = leads.filter(l => l.status === 'Not Picked').length;

    // Telecaller performance
    const telecallerPerformance = employees.map(emp => {
        const empLeads = leads.filter(l => l.telecaller === emp.name);
        const empInterested = empLeads.filter(l => l.status === 'Interested').length;
        const empTodayCalls = empLeads.filter(l => l.lastCallDate === today).length;
        const totalCalls = empLeads.reduce((acc, l) => acc + (l.callCount || 0), 0);

        return {
            name: emp.name,
            totalLeads: empLeads.length,
            interested: empInterested,
            todayCalls: empTodayCalls,
            totalCalls,
            conversionRate: empLeads.length > 0 ? ((empInterested / empLeads.length) * 100).toFixed(1) : 0
        };
    }).filter(p => p.totalLeads > 0);

    // Filter leads based on active tab
    const filteredLeads = leads.filter(lead => {
        if (activeTab === 'today') return lead.lastCallDate === today;
        if (activeTab === 'followups') return lead.followUpDate && lead.followUpDate >= today;
        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <FiPhone className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Telecalling Management</h1>
                        <p className="text-gray-600 mt-1">Track calls, manage leads, and monitor performance</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowBulkUploadModal(true)}
                        className="flex items-center px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors shadow-md"
                    >
                        <FiUpload className="mr-2" /> Upload List
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                    >
                        <FiPlus className="mr-2" /> Add Lead
                    </button>
                </div>
            </div>

            {/* Stats Cards - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card
                    title="Total Leads"
                    value={totalLeads}
                    icon={FiUsers}
                    color="blue"
                />
                <Card
                    title="Today's Calls"
                    value={todayCalls}
                    icon={FiPhone}
                    color="orange"
                />
                <Card
                    title="Interested"
                    value={interestedLeads}
                    icon={FiCheckCircle}
                    color="green"
                />
                <Card
                    title="Follow-ups"
                    value={followUpLeads}
                    icon={FiClock}
                    color="purple"
                />
                <Card
                    title="Not Picked"
                    value={notPickedLeads}
                    icon={FiPhoneOff}
                    color="red"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'all', label: 'All Leads' },
                    { key: 'today', label: "Today's Calls" },
                    { key: 'followups', label: 'Follow-ups' },
                    { key: 'performance', label: 'Performance' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.key
                            ? 'text-[#F47920] border-b-2 border-[#F47920]'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Leads List - professional table layout */}
            {activeTab !== 'performance' && (
                <Table
                    headers={[
                        'Name',
                        'Phone',
                        'Company',
                        'Status',
                        'Telecaller',
                        'Follow-up',
                        'Last Call',
                        'Actions',
                    ]}
                    dense
                >
                    {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                            <Table.Cell className="font-medium text-gray-900">
                                {lead.name}
                            </Table.Cell>
                            <Table.Cell className="text-gray-600">{lead.phone}</Table.Cell>
                            <Table.Cell className="text-gray-600 text-truncate">
                                {lead.company || '-'}
                            </Table.Cell>
                            <Table.Cell>
                                <select
                                    value={lead.status}
                                    onChange={(e) =>
                                        handleQuickStatusUpdate(lead.id, e.target.value)
                                    }
                                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                                        lead.status === 'Interested'
                                            ? 'bg-green-100 text-green-700'
                                            : lead.status === 'Follow-up'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : lead.status === 'Not Interested'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    <option value="Not Picked">Not Picked</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Not Interested">Not Interested</option>
                                </select>
                            </Table.Cell>
                            <Table.Cell className="text-gray-600">
                                {lead.telecaller || 'Unassigned'}
                            </Table.Cell>
                            <Table.Cell className="text-gray-600">
                                {lead.followUpDate ? (
                                    <span
                                        className={
                                            lead.followUpDate < today
                                                ? 'text-red-600 font-medium'
                                                : ''
                                        }
                                    >
                                        {lead.followUpDate}
                                    </span>
                                ) : (
                                    '-'
                                )}
                            </Table.Cell>
                            <Table.Cell className="text-gray-600">
                                {lead.lastCallDate || '-'}
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex gap-2 justify-start">
                                    <button
                                        onClick={() => handleEdit(lead)}
                                        className="touch-target text-blue-600 hover:text-blue-800"
                                        title="Edit lead"
                                    >
                                        <FiEdit2 className="icon icon-sm" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lead.id)}
                                        className="touch-target text-red-600 hover:text-red-800"
                                        title="Delete lead"
                                    >
                                        <FiTrash2 className="icon icon-sm" />
                                    </button>
                                </div>
                            </Table.Cell>
                        </tr>
                    ))}
                </Table>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Telecaller Performance</h3>
                        <div className="space-y-4">
                            {telecallerPerformance.map((perf, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-800">{perf.name}</h4>
                                        <span className="text-2xl font-bold text-[#F47920]">{perf.conversionRate}%</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                        <div className="text-center p-2 bg-blue-50 rounded">
                                            <p className="text-xs text-gray-600">Total Leads</p>
                                            <p className="text-lg font-bold text-blue-600">{perf.totalLeads}</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded">
                                            <p className="text-xs text-gray-600">Interested</p>
                                            <p className="text-lg font-bold text-green-600">{perf.interested}</p>
                                        </div>
                                        <div className="text-center p-2 bg-orange-50 rounded">
                                            <p className="text-xs text-gray-600">Today's Calls</p>
                                            <p className="text-lg font-bold text-orange-600">{perf.todayCalls}</p>
                                        </div>
                                        <div className="text-center p-2 bg-purple-50 rounded">
                                            <p className="text-xs text-gray-600">Total Calls</p>
                                            <p className="text-lg font-bold text-purple-600">{perf.totalCalls}</p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-[#F47920] h-2 rounded-full transition-all"
                                            style={{ width: `${perf.conversionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Lead Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingLead ? 'Edit Lead' : 'Add New Lead'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    placeholder="e.g., Website, Referral"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Call Status</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Not Picked">Not Picked</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Not Interested">Not Interested</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Telecaller</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.telecaller}
                                    onChange={(e) => setFormData({ ...formData, telecaller: e.target.value })}
                                >
                                    <option value="">Select Telecaller</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.followUpDate}
                                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Call Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.lastCallDate}
                                    onChange={(e) => setFormData({ ...formData, lastCallDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Call Count</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.callCount}
                                    onChange={(e) => setFormData({ ...formData, callCount: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Call notes, requirements, etc..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                            >
                                {editingLead ? 'Update' : 'Add'} Lead
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Bulk Upload Modal */}
            {showBulkUploadModal && (
                <Modal onClose={() => setShowBulkUploadModal(false)} title="Upload Customer List">
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Format Instructions:</h4>
                            <p className="text-sm text-blue-700 mb-2">Enter one customer per line in this format:</p>
                            <code className="text-xs bg-blue-100 px-2 py-1 rounded">Name, Phone, Email, Company</code>
                            <p className="text-xs text-blue-600 mt-2">Example: John Doe, 9876543210, john@example.com, ABC Corp</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Data</label>
                            <textarea
                                rows="10"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E] font-mono text-sm"
                                value={bulkData}
                                onChange={(e) => setBulkData(e.target.value)}
                                placeholder="John Doe, 9876543210, john@example.com, ABC Corp&#10;Jane Smith, 9876543211, jane@example.com, XYZ Ltd"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowBulkUploadModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkUpload}
                                className="flex-1 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors"
                                disabled={!bulkData.trim()}
                            >
                                Upload Leads
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Telecalling;
