import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiCalendar,
    FiUpload, FiDownload, FiTrendingUp, FiPieChart, FiFile
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Card from '../components/Card';
import Table from '../components/Table';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, reports, charts
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [uploadingBill, setUploadingBill] = useState(false);

    const [formData, setFormData] = useState({
        category: 'Others',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paidTo: '',
        paymentMethod: 'Cash',
        billUrl: '',
        billName: ''
    });

    const categories = ['Snacks', 'Rent', 'Salary Advance', 'Marketing', 'Others'];

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const expensesSnap = await getDocs(collection(db, 'expenses'));
            const expensesList = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExpenses(expensesList);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const expenseData = {
                ...formData,
                createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingExpense) {
                await updateDoc(doc(db, 'expenses', editingExpense.id), expenseData);
            } else {
                await addDoc(collection(db, 'expenses'), expenseData);
            }
            fetchExpenses();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving expense:", error);
            alert("Error saving expense. Please try again.");
        }
    };

    const handleBillUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingBill(true);
        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `expenses/${timestamp}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setFormData({
                ...formData,
                billUrl: downloadURL,
                billName: file.name
            });
            alert("Bill uploaded successfully!");
        } catch (error) {
            console.error("Error uploading bill:", error);
            alert("Error uploading bill. Please try again.");
        } finally {
            setUploadingBill(false);
        }
    };

    const handleDelete = async (id, billUrl) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                // Delete bill from storage if exists
                if (billUrl) {
                    try {
                        const billRef = ref(storage, billUrl);
                        await deleteObject(billRef);
                    } catch (error) {
                        console.log("Bill already deleted or doesn't exist");
                    }
                }

                await deleteDoc(doc(db, 'expenses', id));
                fetchExpenses();
            } catch (error) {
                console.error("Error deleting expense:", error);
            }
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData(expense);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingExpense(null);
        setFormData({
            category: 'Others',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            paidTo: '',
            paymentMethod: 'Cash',
            billUrl: '',
            billName: ''
        });
    };

    // Calculate statistics
    const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount || 0), 0);
    const todayExpenses = expenses
        .filter(e => e.date === new Date().toISOString().split('T')[0])
        .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const thisMonthExpenses = expenses
        .filter(e => e.date?.startsWith(new Date().toISOString().slice(0, 7)))
        .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    // Category-wise breakdown
    const categoryBreakdown = categories.map(cat => {
        const catExpenses = expenses.filter(e => e.category === cat);
        const total = catExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        return { category: cat, amount: total, count: catExpenses.length };
    }).filter(c => c.amount > 0);

    // Month-wise data for selected month
    const monthExpenses = expenses.filter(e => e.date?.startsWith(selectedMonth));
    const monthTotal = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

    // Date-wise breakdown for selected month
    const dateWiseBreakdown = monthExpenses.reduce((acc, exp) => {
        const date = exp.date;
        if (!acc[date]) {
            acc[date] = { date, amount: 0, count: 0 };
        }
        acc[date].amount += Number(exp.amount || 0);
        acc[date].count += 1;
        return acc;
    }, {});

    const dateWiseData = Object.values(dateWiseBreakdown).sort((a, b) => b.date.localeCompare(a.date));

    const BarChart = ({ data, title }) => {
        const maxValue = Math.max(...data.map(d => d.amount), 1);

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6">{title}</h3>
                <div className="space-y-4">
                    {data.map((item, index) => (
                        <div key={index}>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">{item.category || item.date}</span>
                                <span className="text-sm font-bold text-[#F47920]">₹{item.amount.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-[#F47920] h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${(item.amount / maxValue) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

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
                        <h1 className="text-2xl font-bold text-gray-800">Expenses Management</h1>
                        <p className="text-gray-600 mt-1">Track daily expenses with categories and reports</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                >
                    <FiPlus className="mr-2" /> Add Expense
                </button>
            </div>

            {/* Stats Cards - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Expenses"
                    value={`₹${totalExpenses.toLocaleString()}`}
                    subtitle={`${expenses.length} transactions`}
                    icon={FiDollarSign}
                    color="red"
                />
                <Card
                    title="Today's Expenses"
                    value={`₹${todayExpenses.toLocaleString()}`}
                    icon={FiCalendar}
                    color="orange"
                />
                <Card
                    title="This Month"
                    value={`₹${thisMonthExpenses.toLocaleString()}`}
                    icon={FiTrendingUp}
                    color="blue"
                />
                <Card
                    title="Categories"
                    value={categoryBreakdown.length}
                    subtitle="Active categories"
                    icon={FiPieChart}
                    color="purple"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'all', label: 'All Expenses' },
                    { key: 'reports', label: 'Reports' },
                    { key: 'charts', label: 'Charts' }
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

            {/* All Expenses Tab - professional table layout */}
            {activeTab === 'all' && (
                <Table
                    headers={[
                        'Date',
                        'Category',
                        'Description',
                        'Paid To',
                        'Amount',
                        'Bill',
                        'Actions',
                    ]}
                    dense
                >
                    {expenses
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell>{expense.date}</Table.Cell>
                                <Table.Cell>
                                    <span className="badge badge-info">
                                        {expense.category}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="text-gray-600 text-clamp-2">
                                    {expense.description}
                                </Table.Cell>
                                <Table.Cell className="text-gray-600">
                                    {expense.paidTo || '-'}
                                </Table.Cell>
                                <Table.Cell align="right" className="font-bold text-red-600">
                                    ₹{Number(expense.amount).toLocaleString()}
                                </Table.Cell>
                                <Table.Cell>
                                    {expense.billUrl ? (
                                        <a
                                            href={expense.billUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            <FiFile className="icon icon-sm" /> View
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-sm">No bill</span>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex gap-2 justify-start">
                                        <button
                                            onClick={() => handleEdit(expense)}
                                            className="touch-target text-blue-600 hover:text-blue-800"
                                            title="Edit expense"
                                        >
                                            <FiEdit2 className="icon icon-sm" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id, expense.billUrl)}
                                            className="touch-target text-red-600 hover:text-red-800"
                                            title="Delete expense"
                                        >
                                            <FiTrash2 className="icon icon-sm" />
                                        </button>
                                    </div>
                                </Table.Cell>
                            </tr>
                        ))}
                </Table>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="space-y-6">
                    {/* Month Selector */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-4">
                            <label className="font-medium text-gray-700">Select Month:</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                            />
                            <div className="ml-auto">
                                <p className="text-sm text-gray-600">Total for {selectedMonth}</p>
                                <p className="text-2xl font-bold text-[#F47920]">₹{monthTotal.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Date-wise Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Date-wise Breakdown</h3>
                        <div className="space-y-2">
                            {dateWiseData.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.date}</p>
                                        <p className="text-sm text-gray-600">{item.count} transaction(s)</p>
                                    </div>
                                    <p className="text-lg font-bold text-red-600">₹{item.amount.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category-wise for Month */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Category-wise Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categories.map(cat => {
                                const catMonthExpenses = monthExpenses.filter(e => e.category === cat);
                                const catTotal = catMonthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
                                if (catTotal === 0) return null;

                                return (
                                    <div key={cat} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-700">{cat}</span>
                                            <span className="text-lg font-bold text-[#F47920]">₹{catTotal.toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{catMonthExpenses.length} transaction(s)</p>
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-[#F47920] h-2 rounded-full"
                                                style={{ width: `${(catTotal / monthTotal) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Tab */}
            {activeTab === 'charts' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BarChart
                        title="Category-wise Expenses"
                        data={categoryBreakdown.sort((a, b) => b.amount - a.amount)}
                    />

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Expense Distribution</h3>
                        <div className="space-y-4">
                            {categoryBreakdown.sort((a, b) => b.amount - a.amount).map((cat, index) => {
                                const percentage = ((cat.amount / totalExpenses) * 100).toFixed(1);
                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                                            <span className="text-sm font-bold text-gray-800">{percentage}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-gradient-to-r from-[#F47920] to-[#FF8C42] h-3 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold text-[#F47920] min-w-[100px] text-right">
                                                ₹{cat.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Expense Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingExpense ? 'Edit Expense' : 'Add New Expense'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paid To</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.paidTo}
                                    onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                                    placeholder="Vendor/Person name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                <textarea
                                    required
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Expense details..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Bill</label>
                                {formData.billUrl ? (
                                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FiFile className="text-green-600" />
                                            <span className="text-sm font-medium text-green-700">{formData.billName}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={formData.billUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <FiDownload />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, billUrl: '', billName: '' })}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F47920] hover:bg-orange-50 transition-colors">
                                        <FiUpload className="text-[#F47920]" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {uploadingBill ? 'Uploading...' : 'Upload Bill'}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleBillUpload}
                                            disabled={uploadingBill}
                                            accept="image/*,.pdf"
                                        />
                                    </label>
                                )}
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
                                {editingExpense ? 'Update' : 'Add'} Expense
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Expenses;
