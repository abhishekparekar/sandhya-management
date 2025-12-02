import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
    FiUsers, FiBriefcase, FiDollarSign, FiTrendingUp, FiActivity,
    FiPhone, FiBox, FiCreditCard, FiCheckCircle, FiClock, FiUserPlus,
    FiCalendar, FiAlertCircle, FiBarChart2
} from 'react-icons/fi';
import Card from '../components/Card';

const Dashboard = () => {
    const [stats, setStats] = useState({
        projects: { total: 0, android: 0, web: 0 },
        sales: { today: 0, thisMonth: 0, total: 0 },
        telecalling: { interested: 0, followUp: 0, notInterested: 0, total: 0 },
        expenses: { total: 0, thisMonth: 0, today: 0 },
        inventory: { total: 0, lowStock: 0 },
        employees: { total: 0 },
        interns: { total: 0, active: 0 },
        tasks: { total: 0, pending: 0, completed: 0, today: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const thisMonth = new Date().getMonth();

            // Projects
            const projectsSnap = await getDocs(collection(db, 'projects'));
            const projects = projectsSnap.docs.map(doc => doc.data());
            const androidProjects = projects.filter(p => p.type?.toLowerCase() === 'android').length;
            const webProjects = projects.filter(p => p.type?.toLowerCase() === 'web').length;

            // Sales
            const salesSnap = await getDocs(collection(db, 'sales'));
            const sales = salesSnap.docs.map(doc => doc.data());
            const totalSales = sales.reduce((acc, sale) => acc + Number(sale.amount || 0), 0);
            const salesToday = sales.filter(s => s.date === today).reduce((acc, s) => acc + Number(s.amount || 0), 0);
            const salesThisMonth = sales.filter(s => {
                const saleDate = new Date(s.date);
                return saleDate.getMonth() === thisMonth;
            }).reduce((acc, s) => acc + Number(s.amount || 0), 0);

            // Telecalling
            const leadsSnap = await getDocs(collection(db, 'leads'));
            const leads = leadsSnap.docs.map(doc => doc.data());
            const interested = leads.filter(l => l.status === 'Interested').length;
            const followUp = leads.filter(l => l.status === 'Follow-up').length;
            const notInterested = leads.filter(l => l.status === 'Not Interested').length;

            // Expenses
            const expensesSnap = await getDocs(collection(db, 'expenses'));
            const expenses = expensesSnap.docs.map(doc => doc.data());
            const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount || 0), 0);
            const expensesToday = expenses.filter(e => e.date === today).reduce((acc, e) => acc + Number(e.amount || 0), 0);
            const expensesThisMonth = expenses.filter(e => {
                const expDate = new Date(e.date);
                return expDate.getMonth() === thisMonth;
            }).reduce((acc, e) => acc + Number(e.amount || 0), 0);

            // Inventory
            const inventorySnap = await getDocs(collection(db, 'inventory'));
            const inventory = inventorySnap.docs.map(doc => doc.data());
            const lowStock = inventory.filter(i => Number(i.quantity || 0) < 10).length;

            // Employees
            const employeesSnap = await getDocs(collection(db, 'employees'));

            // Interns
            const internsSnap = await getDocs(collection(db, 'interns'));
            const interns = internsSnap.docs.map(doc => doc.data());
            const activeInterns = interns.filter(i => i.status === 'Active').length;

            // Tasks
            const tasksSnap = await getDocs(collection(db, 'tasks'));
            const tasks = tasksSnap.docs.map(doc => doc.data());
            const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
            const completedTasks = tasks.filter(t => t.status === 'Completed').length;
            const tasksToday = tasks.filter(t => t.date === today).length;

            setStats({
                projects: { total: projectsSnap.size, android: androidProjects, web: webProjects },
                sales: { today: salesToday, thisMonth: salesThisMonth, total: totalSales },
                telecalling: { interested, followUp, notInterested, total: leadsSnap.size },
                expenses: { total: totalExpenses, thisMonth: expensesThisMonth, today: expensesToday },
                inventory: { total: inventorySnap.size, lowStock },
                employees: { total: employeesSnap.size },
                interns: { total: internsSnap.size, active: activeInterns },
                tasks: { total: tasksSnap.size, pending: pendingTasks, completed: completedTasks, today: tasksToday }
            });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with Today's Date */}


            {/* Today's Summary Section */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <FiCalendar className="w-6 h-6 text-[#F47920]" />
                    <h2 className="text-xl font-bold text-gray-800">Today's Summary</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                        <div className="flex items-center justify-between mb-2">
                            <FiDollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">Sales</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">₹{stats.sales.today.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-1">Today's revenue</p>
                    </div>

                    <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
                        <div className="flex items-center justify-between mb-2">
                            <FiCreditCard className="w-5 h-5 text-red-600" />
                            <span className="text-xs font-semibold text-red-700">Expenses</span>
                        </div>
                        <p className="text-2xl font-bold text-red-900">₹{stats.expenses.today.toLocaleString()}</p>
                        <p className="text-xs text-red-600 mt-1">Today's spending</p>
                    </div>

                    <div className="p-4 rounded-lg bg-orange-50 border-2 border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                            <FiActivity className="w-5 h-5 text-orange-600" />
                            <span className="text-xs font-semibold text-orange-700">Tasks</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-900">{stats.tasks.today}</p>
                        <p className="text-xs text-orange-600 mt-1">Tasks for today</p>
                    </div>

                    <div className="p-4 rounded-lg bg-teal-50 border-2 border-teal-200">
                        <div className="flex items-center justify-between mb-2">
                            <FiPhone className="w-5 h-5 text-teal-600" />
                            <span className="text-xs font-semibold text-teal-700">Follow-ups</span>
                        </div>
                        <p className="text-2xl font-bold text-teal-900">{stats.telecalling.followUp}</p>
                        <p className="text-xs text-teal-600 mt-1">Pending calls</p>
                    </div>
                </div>
            </div>

            {/* Company Overview Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <FiBarChart2 className="w-6 h-6 text-[#F47920]" />
                    <h2 className="text-xl font-bold text-gray-800">Company Overview</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card
                        title="Total Projects"
                        value={stats.projects.total}
                        subtitle={`${stats.projects.android} Android • ${stats.projects.web} Web`}
                        icon={FiBriefcase}
                        color="purple"
                    />

                    <Card
                        title="Sales This Month"
                        value={`₹${stats.sales.thisMonth.toLocaleString()}`}
                        subtitle={`₹${stats.sales.total.toLocaleString()} total`}
                        icon={FiDollarSign}
                        color="green"
                        trend="up"
                        trendValue="8"
                    />

                    <Card
                        title="Total Employees"
                        value={stats.employees.total}
                        subtitle="Active team members"
                        icon={FiUsers}
                        color="blue"
                    />

                    <Card
                        title="Expenses This Month"
                        value={`₹${stats.expenses.thisMonth.toLocaleString()}`}
                        subtitle={`₹${stats.expenses.total.toLocaleString()} total`}
                        icon={FiCreditCard}
                        color="red"
                        trend="down"
                        trendValue="5"
                    />
                </div>
            </div>

            {/* Telecalling Status Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <FiPhone className="w-6 h-6 text-[#F47920]" />
                    <h2 className="text-xl font-bold text-gray-800">Telecalling Status</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card
                        title="Total Leads"
                        value={stats.telecalling.total}
                        subtitle="All telecalling leads"
                        icon={FiPhone}
                        color="teal"
                    />

                    <Card
                        title="Interested"
                        value={stats.telecalling.interested}
                        subtitle="Hot leads"
                        icon={FiCheckCircle}
                        color="green"
                    />

                    <Card
                        title="Follow-up Required"
                        value={stats.telecalling.followUp}
                        subtitle="Pending calls"
                        icon={FiClock}
                        color="orange"
                    />

                    <Card
                        title="Not Interested"
                        value={stats.telecalling.notInterested}
                        subtitle="Closed leads"
                        icon={FiAlertCircle}
                        color="red"
                    />
                </div>
            </div>

            {/* Inventory & Team Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory Overview */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <FiBox className="w-6 h-6 text-[#F47920]" />
                        <h2 className="text-xl font-bold text-gray-800">Inventory Overview</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Items</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.inventory.total}</p>
                            </div>
                            <FiBox className="w-12 h-12 text-orange-500" />
                        </div>
                        {stats.inventory.lowStock > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                                <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-red-900">{stats.inventory.lowStock} Low Stock Items</p>
                                    <p className="text-xs text-red-600">Reorder required</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Overview */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <FiUsers className="w-6 h-6 text-[#F47920]" />
                        <h2 className="text-xl font-bold text-gray-800">Team Overview</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <FiUsers className="w-8 h-8 text-blue-600 mb-2" />
                            <p className="text-2xl font-bold text-blue-900">{stats.employees.total}</p>
                            <p className="text-sm text-blue-600">Employees</p>
                        </div>
                        <div className="p-4 bg-pink-50 rounded-lg border-2 border-pink-200">
                            <FiUserPlus className="w-8 h-8 text-pink-600 mb-2" />
                            <p className="text-2xl font-bold text-pink-900">{stats.interns.active}</p>
                            <p className="text-sm text-pink-600">Active Interns</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks Overview */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <FiActivity className="w-6 h-6 text-[#F47920]" />
                    <h2 className="text-xl font-bold text-gray-800">Tasks Overview</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card
                        title="Total Tasks"
                        value={stats.tasks.total}
                        subtitle="All tasks"
                        icon={FiActivity}
                        color="indigo"
                    />

                    <Card
                        title="Pending Tasks"
                        value={stats.tasks.pending}
                        subtitle="Awaiting completion"
                        icon={FiClock}
                        color="orange"
                    />

                    <Card
                        title="Completed Tasks"
                        value={stats.tasks.completed}
                        subtitle="Successfully finished"
                        icon={FiCheckCircle}
                        color="green"
                        trend="up"
                        trendValue="15"
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all">
                        <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
                            <FiBriefcase className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">New Project</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all">
                        <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-green-600">
                            <FiDollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Add Sale</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                        <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                            <FiUsers className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Add Employee</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
                        <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
                            <FiActivity className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">New Task</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
