import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiTrendingUp, FiUsers, FiCalendar, FiCheckCircle, FiClock, FiUserCheck } from 'react-icons/fi';
import Modal from '../components/Modal';
import Card from '../components/Card';
import Table from '../components/Table';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [leads, setLeads] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [editingSale, setEditingSale] = useState(null);
    const [editingLead, setEditingLead] = useState(null);
    const [activeTab, setActiveTab] = useState('sales'); // sales, leads, performance

    const [saleFormData, setSaleFormData] = useState({
        clientName: '',
        project: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentStatus: 'Pending',
        executive: '',
        description: ''
    });

    const [leadFormData, setLeadFormData] = useState({
        name: '',
        email: '',
        phone: '',
        source: '',
        status: 'New',
        followUpDate: '',
        executive: '',
        notes: '',
        convertedToSale: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const salesSnap = await getDocs(collection(db, 'sales'));
            const salesList = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSales(salesList);

            const leadsSnap = await getDocs(collection(db, 'leads'));
            const leadsList = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeads(leadsList);

            const employeesSnap = await getDocs(collection(db, 'employees'));
            const execList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExecutives(execList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSale) {
                await updateDoc(doc(db, 'sales', editingSale.id), saleFormData);
            } else {
                await addDoc(collection(db, 'sales'), { ...saleFormData, createdAt: new Date().toISOString() });
            }
            fetchData();
            handleCloseSaleModal();
        } catch (error) {
            console.error("Error saving sale:", error);
        }
    };

    const handleLeadSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLead) {
                await updateDoc(doc(db, 'leads', editingLead.id), leadFormData);
            } else {
                await addDoc(collection(db, 'leads'), { ...leadFormData, createdAt: new Date().toISOString() });
            }
            fetchData();
            handleCloseLeadModal();
        } catch (error) {
            console.error("Error saving lead:", error);
        }
    };

    const handleDeleteSale = async (id) => {
        if (window.confirm('Are you sure you want to delete this sale?')) {
            try {
                await deleteDoc(doc(db, 'sales', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting sale:", error);
            }
        }
    };

    const handleDeleteLead = async (id) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            try {
                await deleteDoc(doc(db, 'leads', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting lead:", error);
            }
        }
    };

    const convertLeadToSale = async (lead) => {
        try {
            await updateDoc(doc(db, 'leads', lead.id), { convertedToSale: true, status: 'Converted' });
            await addDoc(collection(db, 'sales'), {
                clientName: lead.name,
                project: 'Converted from Lead',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                paymentStatus: 'Pending',
                executive: lead.executive,
                description: `Converted from lead: ${lead.notes}`,
                createdAt: new Date().toISOString()
            });
            fetchData();
        } catch (error) {
            console.error("Error converting lead:", error);
        }
    };

    const handleEditSale = (sale) => {
        setEditingSale(sale);
        setSaleFormData(sale);
        setShowModal(true);
    };

    const handleEditLead = (lead) => {
        setEditingLead(lead);
        setLeadFormData(lead);
        setShowLeadModal(true);
    };

    const handleCloseSaleModal = () => {
        setShowModal(false);
        setEditingSale(null);
        setSaleFormData({
            clientName: '',
            project: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            paymentStatus: 'Pending',
            executive: '',
            description: ''
        });
    };

    const handleCloseLeadModal = () => {
        setShowLeadModal(false);
        setEditingLead(null);
        setLeadFormData({
            name: '',
            email: '',
            phone: '',
            source: '',
            status: 'New',
            followUpDate: '',
            executive: '',
            notes: '',
            convertedToSale: false
        });
    };

    // Calculate statistics
    const totalSales = sales.reduce((acc, sale) => acc + Number(sale.amount || 0), 0);
    const todaySales = sales.filter(s => s.date === new Date().toISOString().split('T')[0])
        .reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const convertedLeads = leads.filter(l => l.convertedToSale).length;
    const pendingFollowUps = leads.filter(l => l.followUpDate && !l.convertedToSale).length;

    // Executive performance
    const executivePerformance = executives.map(exec => {
        const execSales = sales.filter(s => s.executive === exec.name);
        const execLeads = leads.filter(l => l.executive === exec.name);
        const execConverted = leads.filter(l => l.executive === exec.name && l.convertedToSale).length;
        const totalAmount = execSales.reduce((acc, s) => acc + Number(s.amount || 0), 0);

        return {
            name: exec.name,
            salesCount: execSales.length,
            totalAmount,
            leadsCount: execLeads.length,
            convertedCount: execConverted,
            conversionRate: execLeads.length > 0 ? ((execConverted / execLeads.length) * 100).toFixed(1) : 0
        };
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
                    <FiDollarSign className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Sales Management</h1>
                        <p className="text-gray-600 mt-1">Track sales, manage leads, and monitor performance</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowLeadModal(true)}
                        className="flex items-center px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors shadow-md"
                    >
                        <FiPlus className="mr-2" /> Add Lead
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                    >
                        <FiPlus className="mr-2" /> Add Sale
                    </button>
                </div>
            </div>

            {/* Stats Cards - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Sales"
                    value={`₹${totalSales.toLocaleString()}`}
                    subtitle={`${sales.length} transactions`}
                    icon={FiDollarSign}
                    color="green"
                    trend="up"
                    trendValue="12"
                />
                <Card
                    title="Today's Sales"
                    value={`₹${todaySales.toLocaleString()}`}
                    icon={FiTrendingUp}
                    color="blue"
                />
                <Card
                    title="Converted Leads"
                    value={convertedLeads}
                    subtitle={`${leads.length} total leads`}
                    icon={FiUserCheck}
                    color="purple"
                />
                <Card
                    title="Pending Follow-ups"
                    value={pendingFollowUps}
                    icon={FiClock}
                    color="orange"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {['sales', 'leads', 'performance'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium transition-colors capitalize ${activeTab === tab
                            ? 'text-[#F47920] border-b-2 border-[#F47920]'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Sales Tab - professional table layout */}
            {activeTab === 'sales' && (
                <Table
                    headers={['Date', 'Client', 'Project', 'Amount', 'Status', 'Executive', 'Actions']}
                    dense
                >
                    {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                            <Table.Cell>{sale.date}</Table.Cell>
                            <Table.Cell className="font-medium text-gray-900">
                                {sale.clientName}
                            </Table.Cell>
                            <Table.Cell className="text-gray-600 text-truncate">
                                {sale.project}
                            </Table.Cell>
                            <Table.Cell align="right" className="font-bold text-[#F47920]">
                                ₹{Number(sale.amount).toLocaleString()}
                            </Table.Cell>
                            <Table.Cell>
                                <span
                                    className={`badge ${
                                        sale.paymentStatus === 'Paid'
                                            ? 'badge-success'
                                            : sale.paymentStatus === 'Partial'
                                            ? 'badge-warning'
                                            : 'badge-error'
                                    }`}
                                >
                                    {sale.paymentStatus}
                                </span>
                            </Table.Cell>
                            <Table.Cell className="text-gray-600">
                                {sale.executive || '-'}
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex gap-2 justify-start">
                                    <button
                                        onClick={() => handleEditSale(sale)}
                                        className="touch-target text-blue-600 hover:text-blue-800"
                                        title="Edit sale"
                                    >
                                        <FiEdit2 className="icon icon-sm" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSale(sale.id)}
                                        className="touch-target text-red-600 hover:text-red-800"
                                        title="Delete sale"
                                    >
                                        <FiTrash2 className="icon icon-sm" />
                                    </button>
                                </div>
                            </Table.Cell>
                        </tr>
                    ))}
                </Table>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {leads.map((lead) => (
                        <div key={lead.id} className={`bg-white rounded-xl shadow-sm border p-6 ${lead.convertedToSale ? 'border-green-300 bg-green-50' : 'border-gray-100'
                            }`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{lead.name}</h3>
                                    <p className="text-sm text-gray-600">{lead.email}</p>
                                    <p className="text-sm text-gray-600">{lead.phone}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${lead.status === 'Converted' ? 'bg-green-100 text-green-700' :
                                    lead.status === 'Interested' ? 'bg-blue-100 text-blue-700' :
                                        lead.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {lead.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiUsers className="mr-2" />
                                    <span>Executive: {lead.executive || 'Not assigned'}</span>
                                </div>
                                {lead.followUpDate && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <FiCalendar className="mr-2" />
                                        <span>Follow-up: {lead.followUpDate}</span>
                                    </div>
                                )}
                                {lead.notes && (
                                    <p className="text-sm text-gray-600 italic">{lead.notes}</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {!lead.convertedToSale && (
                                    <button
                                        onClick={() => convertLeadToSale(lead)}
                                        className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                    >
                                        <FiCheckCircle className="inline mr-1" /> Convert to Sale
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEditLead(lead)}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                >
                                    <FiEdit2 className="inline mr-1" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Sales Executive Performance</h3>
                        <div className="space-y-4">
                            {executivePerformance.map((exec, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-800">{exec.name}</h4>
                                        <span className="text-2xl font-bold text-[#F47920]">₹{exec.totalAmount.toLocaleString()}</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                        <div className="text-center p-2 bg-blue-50 rounded">
                                            <p className="text-xs text-gray-600">Sales</p>
                                            <p className="text-lg font-bold text-blue-600">{exec.salesCount}</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded">
                                            <p className="text-xs text-gray-600">Leads</p>
                                            <p className="text-lg font-bold text-green-600">{exec.leadsCount}</p>
                                        </div>
                                        <div className="text-center p-2 bg-purple-50 rounded">
                                            <p className="text-xs text-gray-600">Converted</p>
                                            <p className="text-lg font-bold text-purple-600">{exec.convertedCount}</p>
                                        </div>
                                        <div className="text-center p-2 bg-orange-50 rounded">
                                            <p className="text-xs text-gray-600">Conversion Rate</p>
                                            <p className="text-lg font-bold text-orange-600">{exec.conversionRate}%</p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-[#F47920] h-2 rounded-full transition-all"
                                            style={{ width: `${exec.conversionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Sale Modal */}
            {showModal && (
                <Modal onClose={handleCloseSaleModal} title={editingSale ? 'Edit Sale' : 'Add New Sale'}>
                    <form onSubmit={handleSaleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.clientName}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, clientName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.project}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, project: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.amount}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.date}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.paymentStatus}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, paymentStatus: e.target.value })}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Paid">Paid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Executive</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={saleFormData.executive}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, executive: e.target.value })}
                                >
                                    <option value="">Select Executive</option>
                                    {executives.map((exec) => (
                                        <option key={exec.id} value={exec.name}>{exec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                value={saleFormData.description}
                                onChange={(e) => setSaleFormData({ ...saleFormData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCloseSaleModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                            >
                                {editingSale ? 'Update' : 'Add'} Sale
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Lead Modal */}
            {showLeadModal && (
                <Modal onClose={handleCloseLeadModal} title={editingLead ? 'Edit Lead' : 'Add New Lead'}>
                    <form onSubmit={handleLeadSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.name}
                                    onChange={(e) => setLeadFormData({ ...leadFormData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.email}
                                    onChange={(e) => setLeadFormData({ ...leadFormData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.phone}
                                    onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.source}
                                    onChange={(e) => setLeadFormData({ ...leadFormData, source: e.target.value })}
                                    placeholder="e.g., Website, Referral"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.status}
                                    onChange={(e) => setLeadFormData({ ...leadFormData, status: e.target.value })}
                                >
                                    <option value="New">New</option>
                                    <option value="Interested">Interested</option>
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Not Interested">Not Interested</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.followUpDate}
                                    onChange={(e) => setLeadFormData({ ...leadFormData, followUpDate: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Executive</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={leadFormData.executive}
                                    onChange={(e) => setLeadFormData({ ...leadFormData, executive: e.target.value })}
                                >
                                    <option value="">Select Executive</option>
                                    {executives.map((exec) => (
                                        <option key={exec.id} value={exec.name}>{exec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                value={leadFormData.notes}
                                onChange={(e) => setLeadFormData({ ...leadFormData, notes: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCloseLeadModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors"
                            >
                                {editingLead ? 'Update' : 'Add'} Lead
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Sales;
