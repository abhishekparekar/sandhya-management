import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiPackage, FiUsers, FiAlertTriangle,
    FiCheckCircle, FiTruck, FiDollarSign, FiCalendar
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Card from '../components/Card';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, assigned, damaged, vendors

    const [formData, setFormData] = useState({
        itemName: '',
        category: 'Electronics',
        quantity: 1,
        assignedTo: '',
        status: 'Available',
        vendor: '',
        vendorContact: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        price: '',
        notes: ''
    });

    const categories = ['Electronics', 'Furniture', 'Stationery', 'Accessories', 'Others'];
    const statuses = ['Available', 'Assigned', 'Damaged', 'Lost', 'Under Repair'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const itemsSnap = await getDocs(collection(db, 'inventory'));
            const itemsList = itemsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(itemsList);

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
            const itemData = {
                ...formData,
                createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingItem) {
                await updateDoc(doc(db, 'inventory', editingItem.id), itemData);
            } else {
                await addDoc(collection(db, 'inventory'), itemData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Error saving item. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteDoc(doc(db, 'inventory', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting item:", error);
            }
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData(item);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            itemName: '',
            category: 'Electronics',
            quantity: 1,
            assignedTo: '',
            status: 'Available',
            vendor: '',
            vendorContact: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            price: '',
            notes: ''
        });
    };

    // Calculate statistics
    const totalItems = items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
    const assignedItems = items.filter(i => i.status === 'Assigned').length;
    const damagedItems = items.filter(i => i.status === 'Damaged' || i.status === 'Lost').length;
    const availableItems = items.filter(i => i.status === 'Available').length;

    // Get unique vendors
    const vendors = [...new Set(items.map(i => i.vendor).filter(Boolean))];

    // Filter items based on active tab
    const filteredItems = items.filter(item => {
        if (activeTab === 'assigned') return item.status === 'Assigned';
        if (activeTab === 'damaged') return item.status === 'Damaged' || item.status === 'Lost';
        if (activeTab === 'vendors') return item.vendor;
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
                    <FiPackage className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                        <p className="text-gray-600 mt-1">Track office items, assignments, and vendors</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                >
                    <FiPlus className="mr-2" /> Add Item
                </button>
            </div>

            {/* Stats Cards - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Items"
                    value={totalItems}
                    subtitle={`${items.length} unique items`}
                    icon={FiPackage}
                    color="blue"
                />
                <Card
                    title="Assigned"
                    value={assignedItems}
                    icon={FiUsers}
                    color="purple"
                />
                <Card
                    title="Available"
                    value={availableItems}
                    icon={FiCheckCircle}
                    color="green"
                />
                <Card
                    title="Damaged/Lost"
                    value={damagedItems}
                    icon={FiAlertTriangle}
                    color="red"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'all', label: 'All Items' },
                    { key: 'assigned', label: 'Assigned' },
                    { key: 'damaged', label: 'Damaged/Lost' },
                    { key: 'vendors', label: 'Vendors' }
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

            {/* Items List - professional table layout */}
            {activeTab !== 'vendors' && (
                <Table
                    headers={[
                        'Item Name',
                        'Category',
                        'Quantity',
                        'Status',
                        'Assigned To',
                        'Vendor',
                        'Price',
                        'Actions',
                    ]}
                    dense
                >
                    {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <Table.Cell className="font-medium text-gray-900">
                                {item.itemName}
                            </Table.Cell>
                            <Table.Cell>
                                <span className="badge badge-info capitalize">
                                    {item.category}
                                </span>
                            </Table.Cell>
                            <Table.Cell className="text-gray-600">
                                {item.quantity}
                            </Table.Cell>
                            <Table.Cell>
                                <span
                                    className={`badge ${
                                        item.status === 'Available'
                                            ? 'badge-success'
                                            : item.status === 'Assigned'
                                            ? 'badge-info'
                                            : item.status === 'Damaged' || item.status === 'Lost'
                                            ? 'badge-error'
                                            : 'badge-warning'
                                    }`}
                                >
                                    {item.status}
                                </span>
                            </Table.Cell>
                            <Table.Cell className="text-gray-600">
                                {item.assignedTo || '-'}
                            </Table.Cell>
                            <Table.Cell className="text-gray-600">
                                {item.vendor || '-'}
                            </Table.Cell>
                            <Table.Cell align="right" className="font-bold text-[#F47920]">
                                {item.price ? `₹${Number(item.price).toLocaleString()}` : '-'}
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex gap-2 justify-start">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="touch-target text-blue-600 hover:text-blue-800"
                                        title="Edit item"
                                    >
                                        <FiEdit2 className="icon icon-sm" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="touch-target text-red-600 hover:text-red-800"
                                        title="Delete item"
                                    >
                                        <FiTrash2 className="icon icon-sm" />
                                    </button>
                                </div>
                            </Table.Cell>
                        </tr>
                    ))}
                </Table>
            )}

            {/* Vendors Tab */}
            {activeTab === 'vendors' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendors.map((vendor, index) => {
                        const vendorItems = items.filter(i => i.vendor === vendor);
                        const totalValue = vendorItems.reduce((acc, i) => acc + Number(i.price || 0) * Number(i.quantity || 0), 0);
                        const vendorContact = vendorItems[0]?.vendorContact;

                        return (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-[#1B5E7E] bg-opacity-10 rounded-lg">
                                        <FiTruck className="text-[#1B5E7E] text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{vendor}</h3>
                                        {vendorContact && <p className="text-sm text-gray-600">{vendorContact}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="text-sm text-gray-600">Items</span>
                                        <span className="font-bold text-gray-800">{vendorItems.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="text-sm text-gray-600">Total Value</span>
                                        <span className="font-bold text-[#F47920]">₹{totalValue.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Item Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingItem ? 'Edit Item' : 'Add New Item'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                    placeholder="e.g., Dell Laptop, Office Chair"
                                />
                            </div>

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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    {statuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                >
                                    <option value="">Not Assigned</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.vendor}
                                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                    placeholder="Vendor/Supplier name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Contact</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.vendorContact}
                                    onChange={(e) => setFormData({ ...formData, vendorContact: e.target.value })}
                                    placeholder="Phone/Email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Additional notes..."
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
                                {editingItem ? 'Update' : 'Add'} Item
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Inventory;
