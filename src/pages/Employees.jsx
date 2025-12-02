import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    FiPlus, FiEdit2, FiTrash2, FiUsers, FiCalendar, FiDollarSign,
    FiFileText, FiUpload, FiDownload, FiCheckCircle, FiClock, FiUserCheck
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Card from '../components/Card';
import Table from '../components/Table';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState('employees'); // employees, attendance, leaves, salary
    const [uploadingDoc, setUploadingDoc] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: 'Web',
        designation: '',
        joiningDate: new Date().toISOString().split('T')[0],
        salary: '',
        status: 'Active',
        documents: []
    });

    const [attendanceData, setAttendanceData] = useState({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        checkIn: '',
        checkOut: ''
    });

    const [leaveData, setLeaveData] = useState({
        employeeId: '',
        employeeName: '',
        startDate: '',
        endDate: '',
        reason: '',
        status: 'Pending'
    });

    const departments = ['Android', 'Web', 'Sales', 'Telecalling', 'HR'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const employeesSnap = await getDocs(collection(db, 'employees'));
            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(employeesList);

            const attendanceSnap = await getDocs(collection(db, 'attendance'));
            const attendanceList = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAttendance(attendanceList);

            const leavesSnap = await getDocs(collection(db, 'leaves'));
            const leavesList = leavesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeaves(leavesList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const employeeData = {
                ...formData,
                createdAt: editingEmployee ? editingEmployee.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingEmployee) {
                await updateDoc(doc(db, 'employees', editingEmployee.id), employeeData);
            } else {
                await addDoc(collection(db, 'employees'), employeeData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving employee:", error);
            alert("Error saving employee. Please try again.");
        }
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingDoc(true);
        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `employees/${formData.name}/${timestamp}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const newDoc = {
                name: file.name,
                url: downloadURL,
                uploadedAt: new Date().toISOString()
            };

            setFormData({
                ...formData,
                documents: [...(formData.documents || []), newDoc]
            });
            alert("Document uploaded successfully!");
        } catch (error) {
            console.error("Error uploading document:", error);
            alert("Error uploading document. Please try again.");
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleAttendanceSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'attendance'), {
                ...attendanceData,
                createdAt: new Date().toISOString()
            });
            fetchData();
            setShowAttendanceModal(false);
            setAttendanceData({
                employeeId: '',
                date: new Date().toISOString().split('T')[0],
                status: 'Present',
                checkIn: '',
                checkOut: ''
            });
        } catch (error) {
            console.error("Error saving attendance:", error);
            alert("Error saving attendance. Please try again.");
        }
    };

    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'leaves'), {
                ...leaveData,
                createdAt: new Date().toISOString()
            });
            fetchData();
            setShowLeaveModal(false);
            setLeaveData({
                employeeId: '',
                employeeName: '',
                startDate: '',
                endDate: '',
                reason: '',
                status: 'Pending'
            });
        } catch (error) {
            console.error("Error saving leave:", error);
            alert("Error saving leave request. Please try again.");
        }
    };

    const handleLeaveStatusUpdate = async (leaveId, newStatus) => {
        try {
            await updateDoc(doc(db, 'leaves', leaveId), { status: newStatus });
            fetchData();
        } catch (error) {
            console.error("Error updating leave status:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await deleteDoc(doc(db, 'employees', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting employee:", error);
            }
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData(employee);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            department: 'Web',
            designation: '',
            joiningDate: new Date().toISOString().split('T')[0],
            salary: '',
            status: 'Active',
            documents: []
        });
    };

    // Calculate statistics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'Active').length;
    const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split('T')[0]);
    const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

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
                    <FiUsers className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
                        <p className="text-gray-600 mt-1">Manage employees, attendance, salary, and leaves</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAttendanceModal(true)}
                        className="flex items-center px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors shadow-md"
                    >
                        <FiCalendar className="mr-2" /> Mark Attendance
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                    >
                        <FiPlus className="mr-2" /> Add Employee
                    </button>
                </div>
            </div>

            {/* Stats Cards - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Employees"
                    value={totalEmployees}
                    subtitle={`${activeEmployees} active`}
                    icon={FiUsers}
                    color="blue"
                />
                <Card
                    title="Present Today"
                    value={presentToday}
                    subtitle={`Out of ${totalEmployees}`}
                    icon={FiUserCheck}
                    color="green"
                />
                <Card
                    title="Pending Leaves"
                    value={pendingLeaves}
                    icon={FiClock}
                    color="orange"
                />
                <Card
                    title="Total Salary"
                    value={`₹${employees.reduce((acc, e) => acc + Number(e.salary || 0), 0).toLocaleString()}`}
                    subtitle="Monthly"
                    icon={FiDollarSign}
                    color="purple"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'employees', label: 'Employees' },
                    { key: 'attendance', label: 'Attendance' },
                    { key: 'leaves', label: 'Leave Requests' },
                    { key: 'salary', label: 'Salary' }
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

            {/* Employees Tab - professional table layout */}
            {activeTab === 'employees' && (
                <Table
                    headers={[
                        'Name',
                        'Email',
                        'Department',
                        'Designation',
                        'Salary',
                        'Status',
                        'Documents',
                        'Actions',
                    ]}
                    dense
                >
                    {employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                            <Table.Cell className="font-medium text-gray-900">
                                {employee.name}
                            </Table.Cell>
                            <Table.Cell className="text-gray-600 text-truncate">
                                {employee.email}
                            </Table.Cell>
                            <Table.Cell>
                                <span className="badge badge-info capitalize">
                                    {employee.department}
                                </span>
                            </Table.Cell>
                            <Table.Cell className="text-gray-600 text-truncate">
                                {employee.designation}
                            </Table.Cell>
                            <Table.Cell align="right" className="font-bold text-[#F47920]">
                                ₹{Number(employee.salary).toLocaleString()}
                            </Table.Cell>
                            <Table.Cell>
                                <span
                                    className={`badge ${
                                        employee.status === 'Active'
                                            ? 'badge-success'
                                            : 'badge-warning'
                                    }`}
                                >
                                    {employee.status}
                                </span>
                            </Table.Cell>
                            <Table.Cell align="center" className="text-gray-600">
                                {employee.documents?.length || 0} files
                            </Table.Cell>
                            <Table.Cell>
                                <div className="flex gap-2 justify-start">
                                    <button
                                        onClick={() => handleEdit(employee)}
                                        className="touch-target text-blue-600 hover:text-blue-800"
                                        title="Edit employee"
                                    >
                                        <FiEdit2 className="icon icon-sm" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(employee.id)}
                                        className="touch-target text-red-600 hover:text-red-800"
                                        title="Delete employee"
                                    >
                                        <FiTrash2 className="icon icon-sm" />
                                    </button>
                                </div>
                            </Table.Cell>
                        </tr>
                    ))}
                </Table>
            )}

            {/* Attendance Tab - professional table layout */}
            {activeTab === 'attendance' && (
                <Table
                    headers={['Date', 'Employee', 'Status', 'Check In', 'Check Out']}
                    dense
                >
                    {attendance
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((record) => {
                            const emp = employees.find((e) => e.id === record.employeeId);
                            return (
                                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                    <Table.Cell>{record.date}</Table.Cell>
                                    <Table.Cell className="font-medium text-gray-900">
                                        {emp?.name || 'Unknown'}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <span
                                            className={`badge ${
                                                record.status === 'Present'
                                                    ? 'badge-success'
                                                    : record.status === 'Absent'
                                                    ? 'badge-error'
                                                    : 'badge-warning'
                                            }`}
                                        >
                                            {record.status}
                                        </span>
                                    </Table.Cell>
                                    <Table.Cell className="text-gray-600">
                                        {record.checkIn || '-'}
                                    </Table.Cell>
                                    <Table.Cell className="text-gray-600">
                                        {record.checkOut || '-'}
                                    </Table.Cell>
                                </tr>
                            );
                        })}
                </Table>
            )}

            {/* Leaves Tab */}
            {activeTab === 'leaves' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setShowLeaveModal(true)}
                        className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                    >
                        <FiPlus className="mr-2" /> Request Leave
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {leaves.sort((a, b) => b.createdAt?.localeCompare(a.createdAt)).map((leave) => (
                            <div key={leave.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{leave.employeeName}</h3>
                                        <p className="text-sm text-gray-600">{leave.startDate} to {leave.endDate}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                        leave.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {leave.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">{leave.reason}</p>
                                {leave.status === 'Pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleLeaveStatusUpdate(leave.id, 'Approved')}
                                            className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleLeaveStatusUpdate(leave.id, 'Rejected')}
                                            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Salary Tab */}
            {activeTab === 'salary' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Salary Overview</h3>
                    <div className="space-y-4">
                        {departments.map(dept => {
                            const deptEmployees = employees.filter(e => e.department === dept);
                            const deptTotal = deptEmployees.reduce((acc, e) => acc + Number(e.salary || 0), 0);

                            if (deptEmployees.length === 0) return null;

                            return (
                                <div key={dept} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-800">{dept} Department</h4>
                                        <span className="text-2xl font-bold text-[#F47920]">₹{deptTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {deptEmployees.map(emp => (
                                            <div key={emp.id} className="text-center p-2 bg-gray-50 rounded">
                                                <p className="text-xs text-gray-600">{emp.name}</p>
                                                <p className="text-sm font-bold text-gray-800">₹{Number(emp.salary).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add/Edit Employee Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                >
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    placeholder="e.g., Senior Developer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.joiningDate}
                                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.salary}
                                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
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
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Documents (Aadhar, Resume, etc.)</label>
                                {formData.documents && formData.documents.length > 0 && (
                                    <div className="mb-3 space-y-2">
                                        {formData.documents.map((doc, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{doc.name}</span>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                    <FiDownload />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F47920] hover:bg-orange-50 transition-colors">
                                    <FiUpload className="text-[#F47920]" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleDocumentUpload}
                                        disabled={uploadingDoc}
                                    />
                                </label>
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
                                {editingEmployee ? 'Update' : 'Add'} Employee
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Attendance Modal */}
            {showAttendanceModal && (
                <Modal onClose={() => setShowAttendanceModal(false)} title="Mark Attendance">
                    <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={attendanceData.employeeId}
                                    onChange={(e) => setAttendanceData({ ...attendanceData, employeeId: e.target.value })}
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={attendanceData.date}
                                    onChange={(e) => setAttendanceData({ ...attendanceData, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={attendanceData.status}
                                    onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value })}
                                >
                                    <option value="Present">Present</option>
                                    <option value="Absent">Absent</option>
                                    <option value="Leave">Leave</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Check In</label>
                                    <input
                                        type="time"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                        value={attendanceData.checkIn}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, checkIn: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Check Out</label>
                                    <input
                                        type="time"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                        value={attendanceData.checkOut}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, checkOut: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowAttendanceModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors"
                            >
                                Mark Attendance
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Leave Request Modal */}
            {showLeaveModal && (
                <Modal onClose={() => setShowLeaveModal(false)} title="Request Leave">
                    <form onSubmit={handleLeaveSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={leaveData.employeeId}
                                    onChange={(e) => {
                                        const emp = employees.find(e => e.id === e.target.value);
                                        setLeaveData({ ...leaveData, employeeId: e.target.value, employeeName: emp?.name || '' });
                                    }}
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={leaveData.startDate}
                                        onChange={(e) => setLeaveData({ ...leaveData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={leaveData.endDate}
                                        onChange={(e) => setLeaveData({ ...leaveData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={leaveData.reason}
                                    onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                                    placeholder="Reason for leave..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowLeaveModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors"
                            >
                                Submit Request
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Employees;
