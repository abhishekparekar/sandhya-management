import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiEdit2, FiTrash2, FiUsers, FiCalendar, FiCheckCircle,
    FiAward, FiTrendingUp, FiClock, FiFileText, FiUserPlus, FiUserCheck
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Card from '../components/Card';

const Internship = () => {
    const [interns, setInterns] = useState([]);
    const [internTasks, setInternTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingIntern, setEditingIntern] = useState(null);
    const [activeTab, setActiveTab] = useState('interns'); // interns, tasks, performance

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        college: '',
        course: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        mentor: '',
        performance: 0,
        status: 'Active'
    });

    const [taskData, setTaskData] = useState({
        internId: '',
        internName: '',
        date: new Date().toISOString().split('T')[0],
        task: '',
        submission: '',
        status: 'Pending'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const internsSnap = await getDocs(collection(db, 'interns'));
            const internsList = internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInterns(internsList);

            const tasksSnap = await getDocs(collection(db, 'internTasks'));
            const tasksList = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInternTasks(tasksList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const internData = {
                ...formData,
                createdAt: editingIntern ? editingIntern.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingIntern) {
                await updateDoc(doc(db, 'interns', editingIntern.id), internData);
            } else {
                await addDoc(collection(db, 'interns'), internData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving intern:", error);
            alert("Error saving intern. Please try again.");
        }
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'internTasks'), {
                ...taskData,
                createdAt: new Date().toISOString()
            });
            fetchData();
            setShowTaskModal(false);
            setTaskData({
                internId: '',
                internName: '',
                date: new Date().toISOString().split('T')[0],
                task: '',
                submission: '',
                status: 'Pending'
            });
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Error saving task. Please try again.");
        }
    };

    const handleTaskStatusUpdate = async (taskId, newStatus) => {
        try {
            await updateDoc(doc(db, 'internTasks', taskId), { status: newStatus });
            fetchData();
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    const handleGenerateCertificate = async (intern) => {
        if (window.confirm(`Generate completion certificate for ${intern.name}?`)) {
            try {
                // Update intern status to Completed
                await updateDoc(doc(db, 'interns', intern.id), {
                    status: 'Completed',
                    completionDate: new Date().toISOString()
                });
                fetchData();
                alert(`Certificate generated for ${intern.name}! Check Certificates module.`);

                // Add certificate record
                await addDoc(collection(db, 'certificates'), {
                    type: 'Internship',
                    recipientName: intern.name,
                    course: intern.course,
                    college: intern.college,
                    startDate: intern.startDate,
                    endDate: intern.endDate || new Date().toISOString().split('T')[0],
                    performance: intern.performance,
                    generatedAt: new Date().toISOString()
                });
            } catch (error) {
                console.error("Error generating certificate:", error);
                alert("Error generating certificate. Please try again.");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this intern?')) {
            try {
                await deleteDoc(doc(db, 'interns', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting intern:", error);
            }
        }
    };

    const handleEdit = (intern) => {
        setEditingIntern(intern);
        setFormData(intern);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingIntern(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            college: '',
            course: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            mentor: '',
            performance: 0,
            status: 'Active'
        });
    };

    // Calculate statistics
    const totalInterns = interns.length;
    const activeInterns = interns.filter(i => i.status === 'Active').length;
    const completedInterns = interns.filter(i => i.status === 'Completed').length;
    const todayTasks = internTasks.filter(t => t.date === new Date().toISOString().split('T')[0]).length;
    const pendingTasks = internTasks.filter(t => t.status === 'Pending').length;

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
                        <h1 className="text-2xl font-bold text-gray-800">Internship Management</h1>
                        <p className="text-gray-600 mt-1">Manage interns, tasks, and performance</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="flex items-center px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors shadow-md"
                    >
                        <FiFileText className="mr-2" /> Add Task
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                    >
                        <FiPlus className="mr-2" /> Add Intern
                    </button>
                </div>
            </div>

            {/* Stats Cards - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card
                    title="Total Interns"
                    value={totalInterns}
                    icon={FiUserPlus}
                    color="blue"
                />
                <Card
                    title="Active"
                    value={activeInterns}
                    icon={FiCheckCircle}
                    color="green"
                />
                <Card
                    title="Completed"
                    value={completedInterns}
                    icon={FiAward}
                    color="purple"
                />
                <Card
                    title="Today's Tasks"
                    value={todayTasks}
                    icon={FiCalendar}
                    color="orange"
                />
                <Card
                    title="Pending Tasks"
                    value={pendingTasks}
                    icon={FiClock}
                    color="red"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'interns', label: 'Interns' },
                    { key: 'tasks', label: 'Daily Tasks' },
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

            {/* Interns Tab */}
            {activeTab === 'interns' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interns.map((intern) => (
                        <div key={intern.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{intern.name}</h3>
                                    <p className="text-sm text-gray-600">{intern.college}</p>
                                    <p className="text-sm text-gray-600">{intern.course}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${intern.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {intern.status}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium text-gray-800">{intern.email}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="font-medium text-gray-800">{intern.phone}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Mentor:</span>
                                    <span className="font-medium text-gray-800">{intern.mentor || 'Not assigned'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Duration:</span>
                                    <span className="font-medium text-gray-800">{intern.startDate} to {intern.endDate || 'Ongoing'}</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Performance</span>
                                    <span className="font-bold text-[#F47920]">{intern.performance}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-[#F47920] h-2 rounded-full transition-all"
                                        style={{ width: `${intern.performance}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {intern.status === 'Active' && (
                                    <button
                                        onClick={() => handleGenerateCertificate(intern)}
                                        className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                    >
                                        <FiAward className="inline mr-1" /> Certificate
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEdit(intern)}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                                >
                                    <FiEdit2 />
                                </button>
                                <button
                                    onClick={() => handleDelete(intern.id)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tasks Tab - professional table layout */}
            {activeTab === 'tasks' && (
                <Table
                    headers={[
                        'Date',
                        'Intern',
                        'Task',
                        'Submission',
                        'Status',
                        'Actions',
                    ]}
                    dense
                >
                    {internTasks
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell>{task.date}</Table.Cell>
                                <Table.Cell className="font-medium text-gray-900">
                                    {task.internName}
                                </Table.Cell>
                                <Table.Cell className="text-gray-600 text-clamp-2">
                                    {task.task}
                                </Table.Cell>
                                <Table.Cell className="text-gray-600 text-clamp-2">
                                    {task.submission || '-'}
                                </Table.Cell>
                                <Table.Cell>
                                    <select
                                        value={task.status}
                                        onChange={(e) =>
                                            handleTaskStatusUpdate(task.id, e.target.value)
                                        }
                                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                                            task.status === 'Completed'
                                                ? 'bg-green-100 text-green-700'
                                                : task.status === 'In Progress'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </Table.Cell>
                                <Table.Cell>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Delete this task?')) {
                                                await deleteDoc(doc(db, 'internTasks', task.id));
                                                fetchData();
                                            }
                                        }}
                                        className="touch-target text-red-600 hover:text-red-800"
                                        title="Delete task"
                                    >
                                        <FiTrash2 className="icon icon-sm" />
                                    </button>
                                </Table.Cell>
                            </tr>
                        ))}
                </Table>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div className="space-y-4">
                    {interns.map((intern) => {
                        const internTasksList = internTasks.filter(t => t.internId === intern.id);
                        const completedTasks = internTasksList.filter(t => t.status === 'Completed').length;
                        const totalTasks = internTasksList.length;
                        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

                        return (
                            <div key={intern.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{intern.name}</h3>
                                        <p className="text-sm text-gray-600">{intern.course} - {intern.college}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-[#F47920]">{intern.performance}%</p>
                                        <p className="text-sm text-gray-600">Overall Performance</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Total Tasks</p>
                                        <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Completed</p>
                                        <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                                    </div>
                                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Completion Rate</p>
                                        <p className="text-2xl font-bold text-orange-600">{completionRate}%</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <p className="text-xs text-gray-600">Status</p>
                                        <p className="text-sm font-bold text-purple-600">{intern.status}</p>
                                    </div>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-[#1B5E7E] to-[#F47920] h-3 rounded-full transition-all"
                                        style={{ width: `${intern.performance}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Intern Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingIntern ? 'Edit Intern' : 'Add New Intern'}>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">College *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.college}
                                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                    placeholder="e.g., B.Tech CSE"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.mentor}
                                    onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Performance (%) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.performance}
                                    onChange={(e) => setFormData({ ...formData, performance: e.target.value })}
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
                                    <option value="Completed">Completed</option>
                                </select>
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
                                {editingIntern ? 'Update' : 'Add'} Intern
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Add Task Modal */}
            {showTaskModal && (
                <Modal onClose={() => setShowTaskModal(false)} title="Add Daily Task">
                    <form onSubmit={handleTaskSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Intern *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={taskData.internId}
                                    onChange={(e) => {
                                        const intern = interns.find(i => i.id === e.target.value);
                                        setTaskData({ ...taskData, internId: e.target.value, internName: intern?.name || '' });
                                    }}
                                >
                                    <option value="">Select Intern</option>
                                    {interns.filter(i => i.status === 'Active').map((intern) => (
                                        <option key={intern.id} value={intern.id}>{intern.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={taskData.date}
                                    onChange={(e) => setTaskData({ ...taskData, date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task *</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={taskData.task}
                                    onChange={(e) => setTaskData({ ...taskData, task: e.target.value })}
                                    placeholder="Task description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Submission</label>
                                <textarea
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B5E7E]"
                                    value={taskData.submission}
                                    onChange={(e) => setTaskData({ ...taskData, submission: e.target.value })}
                                    placeholder="Task submission details..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowTaskModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors"
                            >
                                Add Task
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Internship;
