import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import {
    FiPlus, FiTrash2, FiDownload, FiAward, FiCheckCircle, FiBookOpen, FiStar
} from 'react-icons/fi';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // all, internship, completion

    const [formData, setFormData] = useState({
        type: 'Internship',
        recipientName: '',
        course: '',
        college: '',
        startDate: '',
        endDate: '',
        performance: '',
        internId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [certsSnap, internsSnap] = await Promise.all([
                getDocs(collection(db, 'certificates')),
                getDocs(collection(db, 'interns'))
            ]);

            setCertificates(certsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setInterns(internsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateQRCode = async (certificateId) => {
        try {
            const verificationUrl = `https://sandhya-softtech.com/verify/${certificateId}`;
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                width: 200,
                margin: 1
            });
            return qrDataUrl;
        } catch (error) {
            console.error("Error generating QR code:", error);
            return null;
        }
    };

    const generatePDF = async (certificate) => {
        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Background
            doc.setFillColor(255, 249, 245);
            doc.rect(0, 0, 297, 210, 'F');

            // Border
            doc.setDrawColor(244, 121, 32);
            doc.setLineWidth(2);
            doc.rect(10, 10, 277, 190);

            // Inner border
            doc.setDrawColor(27, 94, 126);
            doc.setLineWidth(0.5);
            doc.rect(15, 15, 267, 180);

            // Title
            doc.setFontSize(40);
            doc.setTextColor(244, 121, 32);
            doc.setFont('helvetica', 'bold');
            doc.text('CERTIFICATE', 148.5, 40, { align: 'center' });

            // Subtitle
            doc.setFontSize(16);
            doc.setTextColor(27, 94, 126);
            doc.setFont('helvetica', 'normal');
            doc.text(`of ${certificate.type}`, 148.5, 50, { align: 'center' });

            // Divider
            doc.setDrawColor(244, 121, 32);
            doc.setLineWidth(0.5);
            doc.line(60, 55, 237, 55);

            // Content
            doc.setFontSize(14);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');
            doc.text('This is to certify that', 148.5, 70, { align: 'center' });

            // Recipient Name
            doc.setFontSize(28);
            doc.setTextColor(27, 94, 126);
            doc.setFont('helvetica', 'bold');
            doc.text(certificate.recipientName, 148.5, 85, { align: 'center' });

            // Details
            doc.setFontSize(12);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'normal');

            if (certificate.type === 'Internship') {
                doc.text(`has successfully completed an internship in ${certificate.course}`, 148.5, 100, { align: 'center' });
                doc.text(`at Sandhya Softtech from ${certificate.startDate} to ${certificate.endDate}`, 148.5, 110, { align: 'center' });
                if (certificate.performance) {
                    doc.text(`with a performance rating of ${certificate.performance}%`, 148.5, 120, { align: 'center' });
                }
            } else {
                doc.text(`has successfully completed the ${certificate.course} program`, 148.5, 100, { align: 'center' });
                doc.text(`from ${certificate.startDate} to ${certificate.endDate}`, 148.5, 110, { align: 'center' });
            }

            // QR Code
            const qrCode = await generateQRCode(certificate.id);
            if (qrCode) {
                doc.addImage(qrCode, 'PNG', 20, 150, 30, 30);
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Scan to verify', 35, 185, { align: 'center' });
            }

            // Company Info
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'bold');
            doc.text('Sandhya Softtech', 148.5, 160, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('Software Development Company', 148.5, 167, { align: 'center' });

            // Date
            doc.setFontSize(10);
            doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 250, 180, { align: 'right' });

            // Certificate ID
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Certificate ID: ${certificate.id}`, 148.5, 195, { align: 'center' });

            // Save PDF
            doc.save(`${certificate.recipientName}_${certificate.type}_Certificate.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error generating PDF. Please try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const certData = {
                ...formData,
                generatedAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'certificates'), certData);
            fetchData();
            handleCloseModal();
            alert("Certificate created successfully!");
        } catch (error) {
            console.error("Error creating certificate:", error);
            alert("Error creating certificate. Please try again.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this certificate?')) {
            try {
                await deleteDoc(doc(db, 'certificates', id));
                fetchData();
            } catch (error) {
                console.error("Error deleting certificate:", error);
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({
            type: 'Internship',
            recipientName: '',
            course: '',
            college: '',
            startDate: '',
            endDate: '',
            performance: '',
            internId: ''
        });
    };

    const filteredCertificates = certificates.filter(cert => {
        if (activeTab === 'internship') return cert.type === 'Internship';
        if (activeTab === 'completion') return cert.type === 'Completion';
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <FiAward className="w-8 h-8 text-[#F47920]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Certificate Management</h1>
                        <p className="text-gray-600 mt-1">Generate and manage certificates with QR verification</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-[#F47920] text-white rounded-lg hover:bg-[#E06810] transition-colors shadow-md"
                >
                    <FiPlus className="mr-2" /> Create Certificate
                </button>
            </div>

            {/* Stats - using shared Dashboard Card component */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    title="Total Certificates"
                    value={certificates.length}
                    icon={FiAward}
                    color="purple"
                />
                <Card
                    title="Internship"
                    value={certificates.filter(c => c.type === 'Internship').length}
                    icon={FiBookOpen}
                    color="blue"
                />
                <Card
                    title="Completion"
                    value={certificates.filter(c => c.type === 'Completion').length}
                    icon={FiStar}
                    color="green"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { key: 'all', label: 'All Certificates' },
                    { key: 'internship', label: 'Internship' },
                    { key: 'completion', label: 'Completion' }
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

            {/* Certificates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCertificates.map((certificate) => (
                    <div key={certificate.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-[#F47920] bg-opacity-10 rounded-lg">
                                    <FiAward className="text-[#F47920] text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{certificate.recipientName}</h3>
                                    <span className="text-xs px-2 py-1 bg-[#1B5E7E] bg-opacity-10 text-[#1B5E7E] rounded-full">
                                        {certificate.type}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="text-sm">
                                <span className="text-gray-600">Course:</span>
                                <span className="font-medium text-gray-800 ml-2">{certificate.course}</span>
                            </div>
                            {certificate.college && (
                                <div className="text-sm">
                                    <span className="text-gray-600">College:</span>
                                    <span className="font-medium text-gray-800 ml-2">{certificate.college}</span>
                                </div>
                            )}
                            <div className="text-sm">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium text-gray-800 ml-2">
                                    {certificate.startDate} to {certificate.endDate}
                                </span>
                            </div>
                            {certificate.performance && (
                                <div className="text-sm">
                                    <span className="text-gray-600">Performance:</span>
                                    <span className="font-bold text-[#F47920] ml-2">{certificate.performance}%</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => generatePDF(certificate)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                            >
                                <FiDownload /> Download PDF
                            </button>
                            <button
                                onClick={() => handleDelete(certificate.id)}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Certificate Modal */}
            {showModal && (
                <Modal onClose={handleCloseModal} title="Create Certificate">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Internship">Internship Certificate</option>
                                    <option value="Completion">Completion Certificate</option>
                                </select>
                            </div>

                            {formData.type === 'Internship' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Intern</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={formData.internId}
                                        onChange={(e) => {
                                            const intern = interns.find(i => i.id === e.target.value);
                                            if (intern) {
                                                setFormData({
                                                    ...formData,
                                                    internId: e.target.value,
                                                    recipientName: intern.name,
                                                    course: intern.course,
                                                    college: intern.college,
                                                    startDate: intern.startDate,
                                                    endDate: intern.endDate || '',
                                                    performance: intern.performance
                                                });
                                            }
                                        }}
                                    >
                                        <option value="">Manual Entry</option>
                                        {interns.filter(i => i.status === 'Completed').map((intern) => (
                                            <option key={intern.id} value={intern.id}>{intern.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course/Program *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                    value={formData.course}
                                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                    placeholder="e.g., Web Development, B.Tech CSE"
                                />
                            </div>

                            {formData.type === 'Internship' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={formData.college}
                                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {formData.type === 'Internship' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Performance (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]"
                                        value={formData.performance}
                                        onChange={(e) => setFormData({ ...formData, performance: e.target.value })}
                                    />
                                </div>
                            )}
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
                                Create Certificate
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Certificates;
