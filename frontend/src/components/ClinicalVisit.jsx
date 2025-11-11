// web/src/pages/ClinicalVisits.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, Download, Plus, Search, Filter } from 'lucide-react';

const ClinicalVisits = () => {
    const [clinicalVisits, setClinicalVisits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [modalMode, setModalMode] = useState('add');
    const [toast, setToast] = useState(null);

    // Dummy clinical visits data
    const dummyClinicalVisits = [
        {
            id: 1,
            patientName: "John Doe",
            visitDate: "2025-10-15",
            visitType: "Follow-up",
            whoStage: "Stage 1",
            notes: "Patient doing well on current regimen. No complaints. Continue current treatment plan."
        },
        {
            id: 2,
            patientName: "Maria Santos",
            visitDate: "2025-10-10",
            visitType: "Follow-up",
            whoStage: "Stage 1",
            notes: "Discussed importance of adherence. Patient reports occasional missed doses. Reinforced counseling on medication adherence."
        }
    ];

    useEffect(() => {
        setClinicalVisits(dummyClinicalVisits);
    }, []);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleExportPDF = () => {
        // Show "Exporting..." toast
        setToast({
            message: 'Exporting...',
            type: 'info'
        });

        // Simulate export process
        setTimeout(() => {
            // Create PDF content
            const pdfContent = generatePDFContent();
            
            // Create a blob with content
            const blob = new Blob([pdfContent], { type: 'text/plain' });
            
            // Create a download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'clinical_visits.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show "Exported successfully" toast
            setToast({
                message: 'Exported successfully. clinical visits',
                type: 'success'
            });
        }, 1500); // Simulate processing time
    };

    const handleExportSinglePDF = (visit) => {
        // Show "Exporting..." toast
        setToast({
            message: 'Exporting...',
            type: 'info'
        });

        // Simulate export process
        setTimeout(() => {
            // Create PDF content for single visit
            const pdfContent = generateSinglePDFContent(visit);
            
            // Create a blob with content
            const blob = new Blob([pdfContent], { type: 'text/plain' });
            
            // Create a download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `clinical_visit_${visit.patientName.replace(/\s+/g, '_')}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show "Exported successfully" toast
            setToast({
                message: 'Exported successfully. clinical visits',
                type: 'success'
            });
        }, 1500); // Simulate processing time
    };

    // Generate PDF content for all visits
    const generatePDFContent = () => {
        let content = "CLINICAL VISITS REPORT\n\n";
        
        clinicalVisits.forEach((visit, index) => {
            content += `Visit ${index + 1}\n`;
            content += `Patient: ${visit.patientName}\n`;
            content += `Date: ${new Date(visit.visitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
            content += `Visit Type: ${visit.visitType}\n`;
            content += `WHO Stage: ${visit.whoStage}\n`;
            content += `Notes: ${visit.notes}\n\n`;
        });
        
        content += `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        
        return content;
    };

    // Generate PDF content for single visit
    const generateSinglePDFContent = (visit) => {
        let content = "CLINICAL VISIT REPORT\n\n";
        content += `Patient: ${visit.patientName}\n`;
        content += `Date: ${new Date(visit.visitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
        content += `Visit Type: ${visit.visitType}\n`;
        content += `WHO Stage: ${visit.whoStage}\n`;
        content += `Notes: ${visit.notes}\n\n`;
        content += `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        
        return content;
    };

    const handleViewDetails = (visit) => {
        setSelectedVisit(visit);
        setModalMode('view');
        setShowModal(true);
    };

    const handleRecordNewVisit = () => {
        setSelectedVisit(null);
        setModalMode('add');
        setShowModal(true);
    };

    const handleSaveVisit = (visitData) => {
        if (modalMode === 'add') {
            const newVisit = {
                id: clinicalVisits.length > 0 ? Math.max(...clinicalVisits.map(v => v.id)) + 1 : 1,
                ...visitData
            };
            setClinicalVisits([...clinicalVisits, newVisit]);
            setToast({
                message: 'Clinical visit recorded successfully',
                type: 'success'
            });
        }
        setShowModal(false);
        setSelectedVisit(null);
    };

    const renderClinicalVisitsList = () => {
        if (clinicalVisits.length === 0) {
            return <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>No clinical visits found</p>;
        }

        return clinicalVisits.map(visit => {
            const date = new Date(visit.visitDate);

            return (
                <div key={visit.id} style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                                {visit.patientName}
                            </h3>
                            <div style={{ marginBottom: '10px' }}>
                                <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                                    {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <span style={{ marginLeft: '15px', color: '#6c757d' }}>
                                    {visit.visitType}
                                </span>
                                <span style={{ marginLeft: '15px', color: '#6c757d' }}>
                                    WHO Stage: {visit.whoStage}
                                </span>
                            </div>
                            <div style={{ color: '#333', fontStyle: 'italic' }}>
                                "{visit.notes}"
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button 
                                onClick={() => handleExportSinglePDF(visit)}
                                style={{
                                    padding: '8px 16px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                                onMouseLeave={(e) => e.target.style.background = '#007bff'}
                            >
                                <Download size={16} />
                                Export PDF
                            </button>
                            <button 
                                onClick={() => handleViewDetails(visit)}
                                style={{
                                    padding: '8px 16px',
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                                onMouseLeave={(e) => e.target.style.background = '#6c757d'}
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div style={{ padding: '20px', paddingTop: '80px' }}>
            {/* Header with Title */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Clinical Visits</h2>
                <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>Record and manage patient consultations</p>
            </div>

            {/* Main Content */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#6c757d" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="text"
                                placeholder="Search clinical visits..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '8px 12px 8px 36px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    width: '250px'
                                }}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Filter size={18} color="#6c757d" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                            <select 
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                style={{
                                    padding: '8px 12px 8px 36px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    appearance: 'none'
                                }}
                            >
                                <option value="all">All Types</option>
                                <option value="initial">Initial Consultation</option>
                                <option value="follow-up">Follow-up</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={handleExportPDF}
                            style={{
                                padding: '8px 16px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                            onMouseLeave={(e) => e.target.style.background = '#007bff'}
                        >
                            <Download size={16} />
                            Export PDF
                        </button>
                        <button 
                            onClick={handleRecordNewVisit}
                            style={{
                                padding: '8px 16px',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#218838'}
                            onMouseLeave={(e) => e.target.style.background = '#28a745'}
                        >
                            <Plus size={16} />
                            Record New Visit
                        </button>
                    </div>
                </div>
                <div>
                    {renderClinicalVisitsList()}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <ClinicalVisitModal
                    mode={modalMode}
                    visit={selectedVisit}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedVisit(null);
                    }}
                    onSave={handleSaveVisit}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: toast.type === 'success' ? '#28a745' : 
                                     toast.type === 'error' ? '#dc3545' : '#17a2b8',
                    color: 'white',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '300px',
                    animation: 'slideIn 0.3s ease',
                    zIndex: 9999
                }}>
                    {toast.type === 'success' ? (
                        <Check size={20} />
                    ) : (
                        <Download size={20} />
                    )}
                    <span style={{ fontSize: '14px' }}>{toast.message}</span>
                </div>
            )}

            {/* Add keyframes for animation */}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

const ClinicalVisitModal = ({ mode, visit, onClose, onSave }) => {
    const [formData, setFormData] = useState(
        visit || {
            patientName: '',
            visitDate: '',
            visitType: '',
            whoStage: '',
            notes: ''
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            paddingTop: '64px'
        }}>
            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: 'calc(100vh - 104px)',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>
                        {mode === 'add' ? 'Record Clinical Visit' : 'Visit Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            borderRadius: '4px',
                            transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                        <X size={24} color="#6c757d" />
                    </button>
                </div>
                
                {mode === 'view' ? (
                    <div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#6c757d' }}>
                                Patient Name
                            </label>
                            <div style={{ padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                                {visit.patientName}
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#6c757d' }}>
                                Visit Date
                            </label>
                            <div style={{ padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                                {new Date(visit.visitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#6c757d' }}>
                                Visit Type
                            </label>
                            <div style={{ padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                                {visit.visitType}
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#6c757d' }}>
                                WHO Stage
                            </label>
                            <div style={{ padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                                {visit.whoStage}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#6c757d' }}>
                                Clinical Notes
                            </label>
                            <div style={{ padding: '8px', border: '1px solid #e9ecef', borderRadius: '4px', backgroundColor: '#f8f9fa', minHeight: '80px' }}>
                                {visit.notes}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '8px 16px',
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                                onMouseLeave={(e) => e.target.style.background = '#6c757d'}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Patient Name <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input 
                                type="text"
                                name="patientName"
                                value={formData.patientName}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Visit Date <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input 
                                type="date"
                                name="visitDate"
                                value={formData.visitDate}
                                onChange={handleChange}
                                required
                                max={new Date().toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Visit Type <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select 
                                name="visitType"
                                value={formData.visitType}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="">Select Type</option>
                                <option value="Initial Consultation">Initial Consultation</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="ART Pickup">ART Pickup</option>
                                <option value="Lab Review">Lab Review</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                WHO Stage <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select 
                                name="whoStage"
                                value={formData.whoStage}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="">Select Stage</option>
                                <option value="Stage 1">Stage 1</option>
                                <option value="Stage 2">Stage 2</option>
                                <option value="Stage 3">Stage 3</option>
                                <option value="Stage 4">Stage 4</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Clinical Notes <span style={{ color: 'red' }}>*</span>
                            </label>
                            <textarea 
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                required
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '8px 16px',
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                                onMouseLeave={(e) => e.target.style.background = '#6c757d'}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                style={{
                                    padding: '8px 16px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                                onMouseLeave={(e) => e.target.style.background = '#007bff'}
                            >
                                Save Visit
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ClinicalVisits;