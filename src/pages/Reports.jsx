import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { FiDownload, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiBriefcase, FiCalendar, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import Card from '../components/Card';
import Table from '../components/Table';

const Reports = () => {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalExpenses: 0,
        profit: 0,
        totalProjects: 0,
        completedProjects: 0,
        totalEmployees: 0,
        totalInterns: 0,
        totalTasks: 0
    });

    const [companySettings, setCompanySettings] = useState({
        companyName: 'Sandhya Softtech',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        logoUrl: ''
    });

    const [salesData, setSalesData] = useState([]);
    const [expensesData, setExpensesData] = useState([]);
    const [projectsData, setProjectsData] = useState([]);
    const [employeesData, setEmployeesData] = useState([]);
    const [internsData, setInternsData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const COLORS = ['#F47920', '#1B5E7E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch Company Settings
            const settingsDoc = await getDoc(doc(db, 'settings', 'company'));
            if (settingsDoc.exists()) {
                setCompanySettings(settingsDoc.data());
            }

            const [salesSnap, expensesSnap, projectsSnap, employeesSnap, internsSnap, attendanceSnap, tasksSnap] = await Promise.all([
                getDocs(collection(db, 'sales')),
                getDocs(collection(db, 'expenses')),
                getDocs(collection(db, 'projects')),
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'interns')),
                getDocs(collection(db, 'attendance')),
                getDocs(collection(db, 'tasks'))
            ]);

            const sales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const employees = employeesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const interns = internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const attendance = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setSalesData(sales);
            setExpensesData(expenses);
            setProjectsData(projects);
            setEmployeesData(employees);
            setInternsData(interns);
            setAttendanceData(attendance);

            const totalSales = sales.reduce((acc, doc) => acc + Number(doc.amount || 0), 0);
            const totalExpenses = expenses.reduce((acc, doc) => acc + Number(doc.amount || 0), 0);

            setStats({
                totalSales,
                totalExpenses,
                profit: totalSales - totalExpenses,
                totalProjects: projects.length,
                completedProjects: projects.filter(p => p.status === 'Completed').length,
                totalEmployees: employees.length,
                totalInterns: interns.length,
                totalTasks: tasksSnap.size
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to load image from URL for PDF
    const getDataUri = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Try to request CORS access

            const timeout = setTimeout(() => {
                console.warn("Logo load timed out (likely CORS issue)");
                resolve(null);
            }, 3000); // 3s timeout

            img.onload = function () {
                clearTimeout(timeout);
                const canvas = document.createElement('canvas');
                canvas.width = this.naturalWidth;
                canvas.height = this.naturalHeight;
                try {
                    canvas.getContext('2d').drawImage(this, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) {
                    console.warn("Canvas tainted (CORS issue):", e);
                    resolve(null);
                }
            };

            img.onerror = (error) => {
                clearTimeout(timeout);
                console.warn("Could not load logo for PDF:", error);
                resolve(null);
            };

            // Append a random query param to avoid cache-based CORS issues
            img.src = url + (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        });
    };

    const exportToPDF = async (title, data, columns) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // --- Professional Header Section ---

            // Add Logo if available
            let logoData = null;
            if (companySettings.logoBase64) {
                logoData = companySettings.logoBase64;
            } else if (companySettings.logoUrl) {
                logoData = await getDataUri(companySettings.logoUrl);
            }

            let logoHeight = 0;
            if (logoData) {
                try {
                    // Professional logo sizing with aspect ratio preservation
                    const logoWidth = 40;
                    const logoMaxHeight = 20;

                    // Add white background box for logo
                    doc.setFillColor(255, 255, 255);
                    doc.roundedRect(12, 8, logoWidth + 4, logoMaxHeight + 4, 2, 2, 'F');

                    // Add logo with border
                    doc.setDrawColor(230, 230, 230);
                    doc.setLineWidth(0.5);
                    doc.roundedRect(12, 8, logoWidth + 4, logoMaxHeight + 4, 2, 2, 'S');

                    // Add logo image
                    doc.addImage(logoData, 'PNG', 14, 10, logoWidth, logoMaxHeight);
                    logoHeight = logoMaxHeight + 4;
                } catch (err) {
                    console.warn("Failed to add image to PDF:", err);
                }
            }

            // Company Name & Title - Professional Header
            const headerStartY = Math.max(15, logoHeight + 5);

            doc.setFontSize(24);
            doc.setTextColor(244, 121, 32); // Primary Orange
            doc.setFont('helvetica', 'bold');
            doc.text(companySettings.companyName || 'Sandhya Softtech', pageWidth - 14, headerStartY, { align: 'right' });

            doc.setFontSize(14);
            doc.setTextColor(27, 94, 126); // Secondary Teal
            doc.setFont('helvetica', 'bold');
            doc.text(title.toUpperCase(), pageWidth - 14, headerStartY + 8, { align: 'right' });

            // Decorative line under header
            doc.setDrawColor(244, 121, 32);
            doc.setLineWidth(1);
            doc.line(14, headerStartY + 12, pageWidth - 14, headerStartY + 12);

            // Company Details - Compact and Professional
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.setFont('helvetica', 'normal');

            let yPos = headerStartY + 18;
            const detailsX = pageWidth - 14;

            if (companySettings.companyAddress) {
                const addressLines = doc.splitTextToSize(companySettings.companyAddress, 70);
                doc.text(addressLines, detailsX, yPos, { align: 'right' });
                yPos += (addressLines.length * 3.5);
            }

            if (companySettings.companyEmail) {
                doc.text(`Email: ${companySettings.companyEmail}`, detailsX, yPos, { align: 'right' });
                yPos += 4;
            }

            if (companySettings.companyPhone) {
                doc.text(`Phone: ${companySettings.companyPhone}`, detailsX, yPos, { align: 'right' });
                yPos += 4;
            }

            if (companySettings.companyWebsite) {
                doc.setTextColor(27, 94, 126);
                doc.text(`Web: ${companySettings.companyWebsite}`, detailsX, yPos, { align: 'right' });
            }

            // Report metadata
            const metaStartY = Math.max(yPos + 8, headerStartY + 35);
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'italic');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, metaStartY);

            // Table starts after header
            const tableStartY = metaStartY + 6;

            // --- Table Section ---
            autoTable(doc, {
                startY: tableStartY,
                head: [columns],
                body: data,
                theme: 'grid',
                headStyles: {
                    fillColor: [244, 121, 32],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    textColor: 50
                },
                alternateRowStyles: {
                    fillColor: [250, 245, 240]
                },
                didDrawPage: (data) => {
                    // Footer
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text(`Page ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
                    doc.text('Confidential Report - Internal Use Only', 14, doc.internal.pageSize.height - 10);
                }
            });

            doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert(`Failed to export PDF: ${error.message}`);
        }
    };

    const exportToCSV = (data, filename) => {
        try {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            console.error("Error exporting CSV:", error);
            alert("Failed to export CSV. Please try again.");
        }
    };

    // Chart Data Helpers
    const getSalesChartData = () => {
        const monthlyData = {};
        salesData.forEach(sale => {
            const month = sale.date ? sale.date.substring(0, 7) : 'Unknown';
            monthlyData[month] = (monthlyData[month] || 0) + Number(sale.amount || 0);
        });
        return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })).slice(-6);
    };

    const getExpensesByCategoryData = () => {
        const categoryData = {};
        expensesData.forEach(expense => {
            const category = expense.category || 'Others';
            categoryData[category] = (categoryData[category] || 0) + Number(expense.amount || 0);
        });
        return Object.entries(categoryData).map(([name, value]) => ({ name, value }));
    };

    const getProjectStatusData = () => [
        { name: 'Completed', value: stats.completedProjects },
        { name: 'In Progress', value: stats.totalProjects - stats.completedProjects }
    ];

    const getDepartmentData = () => {
        const deptData = {};
        employeesData.forEach(emp => {
            const dept = emp.department || 'Others';
            deptData[dept] = (deptData[dept] || 0) + 1;
        });
        return Object.entries(deptData).map(([name, count]) => ({ name, count }));
    };

    const getAttendanceData = () => {
        const last7Days = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days[dateStr] = { date: dateStr, present: 0, absent: 0 };
        }
        attendanceData.forEach(record => {
            if (last7Days[record.date]) {
                if (record.status === 'Present') last7Days[record.date].present++;
                else last7Days[record.date].absent++;
            }
        });
        return Object.values(last7Days);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F47920]"></div>
            </div>
        );
    }

    const profitMargin = stats.totalSales > 0 ? ((stats.profit / stats.totalSales) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <FiBarChart2 className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
                        <p className="text-gray-600 mt-1">Comprehensive business insights for {companySettings.companyName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => exportToCSV(salesData, 'Sales_Report')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md text-sm font-medium"
                    >
                        <FiDownload className="mr-2" /> Export CSV
                    </button>
                    <button
                        onClick={() => exportToPDF('Complete Business Report',
                            salesData.map(s => [s.date, s.client, s.amount, s.paymentStatus]),
                            ['Date', 'Client', 'Amount', 'Status']
                        )}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md text-sm font-medium"
                    >
                        <FiDownload className="mr-2" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1">
                {[
                    { key: 'overview', label: 'Overview', icon: <FiBarChart2 /> },
                    { key: 'sales', label: 'Sales', icon: <FiDollarSign /> },
                    { key: 'expenses', label: 'Expenses', icon: <FiTrendingDown /> },
                    { key: 'projects', label: 'Projects', icon: <FiBriefcase /> },
                    { key: 'attendance', label: 'Attendance', icon: <FiUsers /> },
                    { key: 'internship', label: 'Internship', icon: <FiUsers /> }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap rounded-t-lg ${activeTab === tab.key
                            ? 'bg-white text-[#F47920] border-b-2 border-[#F47920] shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Financial Stats - using shared Dashboard Card component */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card
                            title="Total Revenue"
                            value={`₹${stats.totalSales.toLocaleString()}`}
                            subtitle="Income"
                            icon={FiDollarSign}
                            color="green"
                            trend="up"
                            trendValue="12"
                        />
                        <Card
                            title="Total Expenses"
                            value={`₹${stats.totalExpenses.toLocaleString()}`}
                            subtitle="Outflow"
                            icon={FiTrendingDown}
                            color="red"
                        />
                        <Card
                            title="Net Profit"
                            value={`₹${stats.profit.toLocaleString()}`}
                            subtitle={`Margin: ${profitMargin}%`}
                            icon={FiTrendingUp}
                            color="purple"
                        />
                    </div>

                    {/* Operational Stats - using shared Dashboard Card component */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card
                            title="Projects"
                            value={stats.totalProjects}
                            subtitle={`${stats.completedProjects} completed`}
                            icon={FiBriefcase}
                            color="blue"
                        />
                        <Card
                            title="Employees"
                            value={stats.totalEmployees}
                            icon={FiUsers}
                            color="indigo"
                        />
                        <Card
                            title="Interns"
                            value={stats.totalInterns}
                            icon={FiUsers}
                            color="orange"
                        />
                        <Card
                            title="Tasks"
                            value={stats.totalTasks}
                            icon={FiCalendar}
                            color="teal"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sales Trend */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiTrendingUp className="text-[#F47920]" /> Sales Trend (Last 6 Months)
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={getSalesChartData()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="amount" stroke="#F47920" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Expenses by Category */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiPieChart className="text-red-500" /> Expenses by Category
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={getExpensesByCategoryData()} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {getExpensesByCategoryData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Department Distribution */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiUsers className="text-[#1B5E7E]" /> Employees by Department
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={getDepartmentData()}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="count" fill="#1B5E7E" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Project Status */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBriefcase className="text-blue-500" /> Project Status
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={getProjectStatusData()} cx="50%" cy="50%" labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={100} fill="#8884d8" dataKey="value">
                                        {getProjectStatusData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales Report Tab - professional table layout */}
            {activeTab === 'sales' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Sales Report</h3>
                        <div className="flex gap-2">
                            <button onClick={() => exportToCSV(salesData, 'Sales_Report')} className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><FiDownload className="mr-2" /> CSV</button>
                            <button onClick={() => exportToPDF('Sales Report', salesData.map(s => [s.date || '', s.client || '', `₹${s.amount || 0}`, s.paymentStatus || '']), ['Date', 'Client', 'Amount', 'Payment Status'])} className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><FiDownload className="mr-2" /> PDF</button>
                        </div>
                    </div>
                    <Table
                        headers={['Date', 'Client', 'Project', 'Amount', 'Status']}
                        dense
                    >
                        {salesData.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell>{sale.date}</Table.Cell>
                                <Table.Cell className="font-medium text-gray-900">
                                    {sale.client}
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
                                                : 'badge-warning'
                                        }`}
                                    >
                                        {sale.paymentStatus}
                                    </span>
                                </Table.Cell>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Expenses Report Tab - professional table layout */}
            {activeTab === 'expenses' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Expenses Report</h3>
                        <div className="flex gap-2">
                            <button onClick={() => exportToCSV(expensesData, 'Expenses_Report')} className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><FiDownload className="mr-2" /> CSV</button>
                            <button onClick={() => exportToPDF('Expenses Report', expensesData.map(e => [e.date || '', e.category || '', `₹${e.amount || 0}`, e.paidTo || '']), ['Date', 'Category', 'Amount', 'Paid To'])} className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><FiDownload className="mr-2" /> PDF</button>
                        </div>
                    </div>
                    <Table
                        headers={['Date', 'Category', 'Amount', 'Paid To', 'Method']}
                        dense
                    >
                        {expensesData.map((expense) => (
                            <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell>{expense.date}</Table.Cell>
                                <Table.Cell>
                                    <span className="badge badge-info">
                                        {expense.category}
                                    </span>
                                </Table.Cell>
                                <Table.Cell align="right" className="font-bold text-red-600">
                                    ₹{Number(expense.amount).toLocaleString()}
                                </Table.Cell>
                                <Table.Cell className="text-gray-600">
                                    {expense.paidTo || '-'}
                                </Table.Cell>
                                <Table.Cell className="text-gray-600">
                                    {expense.paymentMethod}
                                </Table.Cell>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Projects Report Tab - professional table layout */}
            {activeTab === 'projects' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Projects Report</h3>
                        <div className="flex gap-2">
                            <button onClick={() => exportToCSV(projectsData, 'Projects_Report')} className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><FiDownload className="mr-2" /> CSV</button>
                            <button onClick={() => exportToPDF('Projects Report', projectsData.map(p => [p.title || '', p.client || '', `${p.progress || 0}%`, p.status || '']), ['Project', 'Client', 'Progress', 'Status'])} className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><FiDownload className="mr-2" /> PDF</button>
                        </div>
                    </div>
                    <Table
                        headers={['Project', 'Client', 'Budget', 'Progress', 'Status']}
                        dense
                    >
                        {projectsData.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell className="font-medium text-gray-900">
                                    {project.title}
                                </Table.Cell>
                                <Table.Cell className="text-gray-600">
                                    {project.client}
                                </Table.Cell>
                                <Table.Cell align="right" className="font-bold text-[#F47920]">
                                    ₹{Number(project.budget || 0).toLocaleString()}
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-[#F47920] h-2 rounded-full"
                                                style={{ width: `${project.progress || 0}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {project.progress || 0}%
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <span
                                        className={`badge ${
                                            project.status === 'Completed'
                                                ? 'badge-success'
                                                : project.status === 'In Progress'
                                                ? 'badge-info'
                                                : 'badge-warning'
                                        }`}
                                    >
                                        {project.status}
                                    </span>
                                </Table.Cell>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Attendance Report Tab */}
            {activeTab === 'attendance' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Attendance Report (Last 7 Days)</h3>
                        <div className="flex gap-2">
                            <button onClick={() => exportToCSV(attendanceData, 'Attendance_Report')} className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><FiDownload className="mr-2" /> CSV</button>
                            <button onClick={() => exportToPDF('Attendance Report', attendanceData.map(a => [a.date || '', a.employeeId || '', a.status || '', a.checkIn || '', a.checkOut || '']), ['Date', 'Employee ID', 'Status', 'Check In', 'Check Out'])} className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><FiDownload className="mr-2" /> PDF</button>
                        </div>
                    </div>
                    <div className="mb-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={getAttendanceData()}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="present" fill="#10B981" name="Present" radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="absent" fill="#EF4444" name="Absent" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Internship Report Tab - professional table layout */}
            {activeTab === 'internship' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Internship Report</h3>
                        <div className="flex gap-2">
                            <button onClick={() => exportToCSV(internsData, 'Internship_Report')} className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><FiDownload className="mr-2" /> CSV</button>
                            <button onClick={() => exportToPDF('Internship Report', internsData.map(i => [i.name || '', i.college || '', i.course || '', `${i.performance || 0}%`, i.status || '']), ['Name', 'College', 'Course', 'Performance', 'Status'])} className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"><FiDownload className="mr-2" /> PDF</button>
                        </div>
                    </div>
                    <Table
                        headers={['Name', 'College', 'Course', 'Performance', 'Status']}
                        dense
                    >
                        {internsData.map((intern) => (
                            <tr key={intern.id} className="hover:bg-gray-50 transition-colors">
                                <Table.Cell className="font-medium text-gray-900">
                                    {intern.name}
                                </Table.Cell>
                                <Table.Cell className="text-gray-600 text-truncate">
                                    {intern.college}
                                </Table.Cell>
                                <Table.Cell className="text-gray-600 text-truncate">
                                    {intern.course}
                                </Table.Cell>
                                <Table.Cell>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                            <div
                                                className="bg-[#F47920] h-2 rounded-full"
                                                style={{
                                                    width: `${intern.performance || 0}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {intern.performance || 0}%
                                        </span>
                                    </div>
                                </Table.Cell>
                                <Table.Cell>
                                    <span
                                        className={`badge ${
                                            intern.status === 'Active'
                                                ? 'badge-success'
                                                : 'badge-info'
                                        }`}
                                    >
                                        {intern.status}
                                    </span>
                                </Table.Cell>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}
        </div>
    );
};

export default Reports;
