import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
    FiTrendingUp, FiUsers, FiAward, FiBriefcase, FiCheckCircle, FiUserPlus, FiList
} from 'react-icons/fi';
import Card from '../components/Card';

const Progress = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [interns, setInterns] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('projects'); // projects, employees, interns

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projectsSnap, employeesSnap, internsSnap, tasksSnap] = await Promise.all([
                getDocs(collection(db, 'projects')),
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'interns')),
                getDocs(collection(db, 'tasks'))
            ]);

            setProjects(projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setEmployees(employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setInterns(internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setTasks(tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
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
            <div className="flex items-center gap-3">
                <FiTrendingUp className="w-8 h-8 text-[#F47920]" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Progress Tracking</h1>
                    <p className="text-gray-600 mt-1">Monitor progress across projects, employees, and interns</p>
                </div>
            </div>

            {/* Stats - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card
                    title="Projects"
                    value={projects.length}
                    subtitle={`${projects.filter(p => p.status === 'Completed').length} completed`}
                    icon={FiBriefcase}
                    color="blue"
                />
                <Card
                    title="Employees"
                    value={employees.length}
                    subtitle={`${employees.filter(e => e.status === 'Active').length} active`}
                    icon={FiUsers}
                    color="purple"
                />
                <Card
                    title="Interns"
                    value={interns.length}
                    subtitle={`${interns.filter(i => i.status === 'Active').length} active`}
                    icon={FiUserPlus}
                    color="green"
                />
                <Card
                    title="Tasks"
                    value={tasks.length}
                    subtitle={`${tasks.filter(t => t.status === 'Completed').length} completed`}
                    icon={FiList}
                    color="orange"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'projects', label: 'Project Progress' },
                    { key: 'employees', label: 'Employee Progress' },
                    { key: 'interns', label: 'Intern Progress' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.key ? 'text-[#F47920] border-b-2 border-[#F47920]' : 'text-gray-600'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Project Progress */}
            {activeTab === 'projects' && (
                <div className="space-y-4">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{project.title}</h3>
                                    <p className="text-sm text-gray-600">{project.client}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-bold text-[#F47920]">{project.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-[#F47920] h-3 rounded-full transition-all"
                                    style={{ width: `${project.progress || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Employee Progress */}
            {activeTab === 'employees' && (
                <div className="space-y-4">
                    {employees.map((employee) => {
                        const empTasks = tasks.filter(t => t.assignedTo === employee.name);
                        const completedTasks = empTasks.filter(t => t.status === 'Completed').length;
                        const progress = empTasks.length > 0 ? ((completedTasks / empTasks.length) * 100).toFixed(1) : 0;

                        return (
                            <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{employee.name}</h3>
                                        <p className="text-sm text-gray-600">{employee.department} - {employee.designation}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${employee.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {employee.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center p-2 bg-blue-50 rounded">
                                        <p className="text-xs text-gray-600">Total Tasks</p>
                                        <p className="text-xl font-bold text-blue-600">{empTasks.length}</p>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded">
                                        <p className="text-xs text-gray-600">Completed</p>
                                        <p className="text-xl font-bold text-green-600">{completedTasks}</p>
                                    </div>
                                    <div className="text-center p-2 bg-orange-50 rounded">
                                        <p className="text-xs text-gray-600">Progress</p>
                                        <p className="text-xl font-bold text-orange-600">{progress}%</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-[#1B5E7E] to-[#F47920] h-3 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Intern Progress */}
            {activeTab === 'interns' && (
                <div className="space-y-4">
                    {interns.map((intern) => (
                        <div key={intern.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{intern.name}</h3>
                                    <p className="text-sm text-gray-600">{intern.course} - {intern.college}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${intern.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {intern.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Performance</span>
                                <span className="font-bold text-[#F47920]">{intern.performance || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-[#F47920] h-3 rounded-full transition-all"
                                    style={{ width: `${intern.performance || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Progress;
