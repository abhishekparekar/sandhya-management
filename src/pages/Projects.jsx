import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    FiPlus, FiEdit2, FiTrash2, FiUpload, FiDownload, FiUsers,
    FiCalendar, FiDollarSign, FiFileText, FiCheckCircle, FiClock,
    FiTrendingUp, FiX, FiFile, FiSmartphone, FiMonitor, FiBriefcase
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Card from '../components/Card';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        client: '',
        clientEmail: '',
        clientPhone: '',
        budget: '',
        type: 'Web',
        assignedTeam: [],
        requirements: '',
        progress: 0,
        deadline: '',
        notes: '',
        paymentStatus: 'Pending',
        paymentReceived: 0,
        status: 'In Progress',
        files: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const projectsSnap = await getDocs(collection(db, 'projects'));
            const projectsList = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsList);

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
            const projectData = {
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingProject) {
                await updateDoc(doc(db, 'projects', editingProject.id), projectData);
            } else {
                await addDoc(collection(db, 'projects'), projectData);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving project:", error);
            alert("Error saving project. Please try again.");
        }
    };

    const handleFileUpload = async (e, projectId) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const storageRef = ref(storage, `projects/${projectId}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const project = projects.find(p => p.id === projectId);
            const updatedFiles = [...(project.files || []), {
                name: file.name,
                url: downloadURL,
                uploadedAt: new Date().toISOString()
            }];

            await updateDoc(doc(db, 'projects', projectId), { files: updatedFiles });
            fetchData();
            alert("File uploaded successfully!");
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Error uploading file. Please try again.");
        } finally {
            setUploadingFile(false);
        }
    };

    const handleDeleteFile = async (projectId, fileIndex) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        try {
            const project = projects.find(p => p.id === projectId);
            const file = project.files[fileIndex];

            // Delete from storage
            const storageRef = ref(storage, `projects/${projectId}/${file.name}`);
            await deleteObject(storageRef);

            // Update Firestore
            const updatedFiles = project.files.filter((_, index) => index !== fileIndex);
            await updateDoc(doc(db, 'projects', projectId), { files: updatedFiles });

            fetchData();
            alert("File deleted successfully!");
        } catch (error) {
            console.error("Error deleting file:", error);
            alert("Error deleting file. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await deleteDoc(doc(db, 'projects', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData(project);
        setShowModal(true);
    };

    const handleViewDetails = (project) => {
        setSelectedProject(project);
        setShowDetailModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({
            title: '',
            client: '',
            clientEmail: '',
            clientPhone: '',
            budget: '',
            type: 'Web',
            assignedTeam: [],
            requirements: '',
            progress: 0,
            deadline: '',
            notes: '',
            paymentStatus: 'Pending',
            paymentReceived: 0,
            status: 'In Progress',
            files: []
        });
    };

    const handleTeamSelection = (employeeName) => {
        const currentTeam = formData.assignedTeam || [];
        if (currentTeam.includes(employeeName)) {
            setFormData({ ...formData, assignedTeam: currentTeam.filter(name => name !== employeeName) });
        } else {
            setFormData({ ...formData, assignedTeam: [...currentTeam, employeeName] });
        }
    };

    // Calculate statistics
    const totalProjects = projects.length;
    const androidProjects = projects.filter(p => p.type === 'Android').length;
    const webProjects = projects.filter(p => p.type === 'Web').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const totalBudget = projects.reduce((acc, p) => acc + Number(p.budget || 0), 0);
    const totalReceived = projects.reduce((acc, p) => acc + Number(p.paymentReceived || 0), 0);

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
                    <FiBriefcase className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Project Management</h1>
                        <p className="text-gray-600 mt-1">Manage Android & Web projects with full tracking</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                >
                    <FiPlus className="mr-2" /> Create Project
                </button>
            </div>

            {/* Stats Cards - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Projects"
                    value={totalProjects}
                    subtitle={`${completedProjects} completed`}
                    icon={FiBriefcase}
                    color="purple"
                />
                <Card
                    title="Android Projects"
                    value={androidProjects}
                    icon={FiSmartphone}
                    color="green"
                />
                <Card
                    title="Web Projects"
                    value={webProjects}
                    icon={FiMonitor}
                    color="blue"
                />
                <Card
                    title="Total Budget"
                    value={`₹${totalBudget.toLocaleString()}`}
                    subtitle={`₹${totalReceived.toLocaleString()} received`}
                    icon={FiDollarSign}
                    color="green"
                    trend="up"
                    trendValue="10"
                />
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{project.title}</h3>
                                <p className="text-sm text-gray-600">Client: {project.client}</p>
                            </div>
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.type === 'Android' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {project.type}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-bold text-[#F47920]">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-[#F47920] h-2 rounded-full transition-all"
                                    style={{ width: `${project.progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                                <FiDollarSign className="mr-2 text-[#F47920]" />
                                <span>₹{Number(project.budget).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <FiCalendar className="mr-2 text-[#1B5E7E]" />
                                <span>{project.deadline || 'No deadline'}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <FiUsers className="mr-2 text-green-600" />
                                <span>{project.assignedTeam?.length || 0} members</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <FiFile className="mr-2 text-blue-600" />
                                <span>{project.files?.length || 0} files</span>
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Payment</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${project.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                    project.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {project.paymentStatus}
                                </span>
                            </div>
                            <div className="text-sm text-gray-800 mt-1">
                                ₹{Number(project.paymentReceived || 0).toLocaleString()} / ₹{Number(project.budget).toLocaleString()}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleViewDetails(project)}
                                className="flex-1 px-3 py-2 bg-[#1B5E7E] text-white rounded-lg hover:bg-[#164A5E] transition-colors text-sm font-medium"
                            >
                                View Details
                            </button>
                            <button
                                onClick={() => handleEdit(project)}
                                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                            >
                                <FiEdit2 />
                            </button>
                            <button
                                onClick={() => handleDelete(project.id)}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Project Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title={editingProject ? 'Edit Project' : 'Create New Project'}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.client}
                                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.clientEmail}
                                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Phone</label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.clientPhone}
                                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (₹) *</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Web">Web</option>
                                    <option value="Android">Android</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.progress}
                                    onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Planning">Planning</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Testing">Testing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="On Hold">On Hold</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Paid">Paid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Received (₹)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.paymentReceived}
                                    onChange={(e) => setFormData({ ...formData, paymentReceived: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Team Members</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                                    {employees.map((emp) => (
                                        <label key={emp.id} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedTeam?.includes(emp.name) || false}
                                                onChange={() => handleTeamSelection(emp.name)}
                                                className="rounded text-[#F47920] focus:ring-[#F47920]"
                                            />
                                            <span className="text-sm text-gray-700">{emp.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    placeholder="Project requirements and specifications..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Notes</label>
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
                                {editingProject ? 'Update' : 'Create'} Project
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Project Details Modal */}
            {showDetailModal && selectedProject && (
                <Modal onClose={() => setShowDetailModal(false)} title={selectedProject.title}>
                    <div className="space-y-6">
                        {/* Client Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-bold text-gray-800 mb-3">Client Information</h4>
                            <div className="space-y-2">
                                <p className="text-sm"><span className="font-medium">Name:</span> {selectedProject.client}</p>
                                {selectedProject.clientEmail && (
                                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedProject.clientEmail}</p>
                                )}
                                {selectedProject.clientPhone && (
                                    <p className="text-sm"><span className="font-medium">Phone:</span> {selectedProject.clientPhone}</p>
                                )}
                            </div>
                        </div>

                        {/* Project Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Type</p>
                                <p className="font-bold text-gray-800">{selectedProject.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <p className="font-bold text-gray-800">{selectedProject.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Budget</p>
                                <p className="font-bold text-[#F47920]">₹{Number(selectedProject.budget).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Deadline</p>
                                <p className="font-bold text-gray-800">{selectedProject.deadline || 'Not set'}</p>
                            </div>
                        </div>

                        {/* Team Members */}
                        {selectedProject.assignedTeam && selectedProject.assignedTeam.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">Team Members</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProject.assignedTeam.map((member, index) => (
                                        <span key={index} className="px-3 py-1 bg-[#1B5E7E] bg-opacity-10 text-[#1B5E7E] rounded-full text-sm">
                                            {member}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {selectedProject.requirements && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">Requirements</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedProject.requirements}</p>
                            </div>
                        )}

                        {/* Notes */}
                        {selectedProject.notes && (
                            <div>
                                <h4 className="font-bold text-gray-800 mb-2">Notes</h4>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedProject.notes}</p>
                            </div>
                        )}

                        {/* File Upload */}
                        <div>
                            <h4 className="font-bold text-gray-800 mb-3">Project Files</h4>
                            <div className="space-y-2">
                                {selectedProject.files && selectedProject.files.length > 0 ? (
                                    selectedProject.files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <FiFile className="text-[#1B5E7E]" />
                                                <span className="text-sm font-medium">{file.name}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <FiDownload />
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteFile(selectedProject.id, index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No files uploaded yet</p>
                                )}

                                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#F47920] hover:bg-orange-50 transition-colors">
                                    <FiUpload className="text-[#F47920]" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {uploadingFile ? 'Uploading...' : 'Upload File'}
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, selectedProject.id)}
                                        disabled={uploadingFile}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Projects;
