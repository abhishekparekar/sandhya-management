import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiClock, FiAlertCircle,
    FiUpload, FiDownload, FiFile, FiCalendar, FiUser, FiList, FiActivity
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Card from '../components/Card';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, pending, inprogress, completed, today
    const [uploadingFile, setUploadingFile] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedTo: '',
        assignedToType: 'Employee',
        assignedBy: 'Admin',
        deadline: '',
        status: 'Pending',
        priority: 'Medium',
        attachments: []
    });

    const statuses = ['Pending', 'In Progress', 'Completed', 'On Hold'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const tasksSnap = await getDocs(collection(db, 'tasks'));
            const tasksList = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(tasksList);

            const employeesSnap = await getDocs(collection(db, 'employees'));
            const employeesList = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(employeesList);

            const internsSnap = await getDocs(collection(db, 'interns'));
            const internsList = internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setInterns(internsList);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const taskData = {
                ...formData,
                createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingTask) {
                await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
            } else {
                await addDoc(collection(db, 'tasks'), taskData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Error saving task. Please try again.");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `tasks/${timestamp}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const newAttachment = {
                name: file.name,
                url: downloadURL,
                uploadedAt: new Date().toISOString()
            };

            setFormData({
                ...formData,
                attachments: [...(formData.attachments || []), newAttachment]
            });
            alert("File uploaded successfully!");
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Error uploading file. Please try again.");
        } finally {
            setUploadingFile(false);
        }
    };

    const handleQuickStatusUpdate = async (taskId, newStatus) => {
        try {
            await updateDoc(doc(db, 'tasks', taskId), {
                status: newStatus,
                updatedAt: new Date().toISOString()
            });
            fetchData();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteDoc(doc(db, 'tasks', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setFormData(task);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            assignedTo: '',
            assignedToType: 'Employee',
            assignedBy: 'Admin',
            deadline: '',
            status: 'Pending',
            priority: 'Medium',
            attachments: []
        });
    };

    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const todayTasks = tasks.filter(t => t.deadline === today).length;
    const overdueTasks = tasks.filter(t => t.deadline < today && t.status !== 'Completed').length;

    // Filter tasks based on active tab
    const filteredTasks = tasks.filter(task => {
        if (activeTab === 'pending') return task.status === 'Pending';
        if (activeTab === 'inprogress') return task.status === 'In Progress';
        if (activeTab === 'completed') return task.status === 'Completed';
        if (activeTab === 'today') return task.deadline === today;
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
                    <FiCheckCircle className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
                        <p className="text-gray-600 mt-1">Assign and track tasks for employees and interns</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                >
                    <FiPlus className="mr-2" /> Create Task
                </button>
            </div>

            {/* Stats Cards - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card
                    title="Total Tasks"
                    value={totalTasks}
                    icon={FiList}
                    color="indigo"
                />
                <Card
                    title="Pending"
                    value={pendingTasks}
                    icon={FiClock}
                    color="orange"
                />
                <Card
                    title="In Progress"
                    value={inProgressTasks}
                    icon={FiActivity}
                    color="blue"
                />
                <Card
                    title="Completed"
                    value={completedTasks}
                    icon={FiCheckCircle}
                    color="green"
                />
                <Card
                    title="Due Today"
                    value={todayTasks}
                    subtitle={`${overdueTasks} overdue`}
                    icon={FiCalendar}
                    color="red"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'all', label: 'All Tasks' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'inprogress', label: 'In Progress' },
                    { key: 'completed', label: 'Completed' },
                    { key: 'today', label: 'Due Today' }
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

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTasks.sort((a, b) => a.deadline?.localeCompare(b.deadline)).map((task) => {
                    const isOverdue = task.deadline < today && task.status !== 'Completed';

                    return (
                        <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">{task.title}</h3>
                                    <p className="text-sm text-gray-600">{task.description}</p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(task)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <FiEdit2 />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiUser className="mr-2 text-[#1B5E7E]" />
                                    <span>{task.assignedTo}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <FiCalendar className="mr-2 text-[#F47920]" />
                                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                        {task.deadline || 'No deadline'}
                                    </span>
                                </div>
                            </div>

                            {/* Priority & Status */}
                            <div className="flex gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                    task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {task.priority}
                                </span>
                                <select
                                    value={task.status}
                                    onChange={(e) => handleQuickStatusUpdate(task.id, e.target.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            task.status === 'On Hold' ? 'bg-gray-100 text-gray-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}
                                >
                                    {statuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Attachments */}
                            {task.attachments && task.attachments.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiFile className="text-[#1B5E7E]" />
                                    <span>{task.attachments.length} attachment(s)</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Create/Edit Task Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingTask ? 'Edit Task' : 'Create New Task'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Complete project documentation"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Task details and requirements..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To Type *</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={formData.assignedToType}
                                        onChange={(e) => setFormData({ ...formData, assignedToType: e.target.value, assignedTo: '' })}
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="Intern">Intern</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To *</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={formData.assignedTo}
                                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    >
                                        <option value="">Select {formData.assignedToType}</option>
                                        {formData.assignedToType === 'Employee'
                                            ? employees.map((emp) => (
                                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                                            ))
                                            : interns.map((intern) => (
                                                <option key={intern.id} value={intern.name}>{intern.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        {priorities.map(priority => (
                                            <option key={priority} value={priority}>{priority}</option>
                                        ))}
                                    </select>
                                </div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                                {formData.attachments && formData.attachments.length > 0 && (
                                    <div className="mb-3 space-y-2">
                                        {formData.attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <FiFile className="text-[#1B5E7E]" />
                                                    <span className="text-sm">{file.name}</span>
                                                </div>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                    <FiDownload />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F47920] hover:bg-orange-50 transition-colors">
                                    <FiUpload className="text-[#F47920]" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {uploadingFile ? 'Uploading...' : 'Upload File'}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploadingFile}
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
                                {editingTask ? 'Update' : 'Create'} Task
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Tasks;
