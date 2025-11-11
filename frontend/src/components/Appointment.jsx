import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Check, Trash2 } from 'lucide-react';

const Appointments = () => {
    const [activeTab, setActiveTab] = useState('calendar');
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [toast, setToast] = useState(null);

    // Dummy data
    const dummyAppointments = [
        {
            id: 1,
            patientName: "John Doe",
            appointmentDate: "2025-11-10",
            appointmentTime: "10:00",
            facilityName: "My Hub Cares Ortigas Main",
            providerName: "Dr. Maria Santos",
            type: "FOLLOW-UP CONSULTATION",
            status: "SCHEDULED"
        },
        {
            id: 2,
            patientName: "Maria Santos",
            appointmentDate: "2025-11-08",
            appointmentTime: "14:00",
            facilityName: "My Hub Cares Ortigas Main",
            providerName: "Dr. Maria Santos",
            type: "ART PICKUP",
            status: "SCHEDULED"
        },
        {
            id: 3,
            patientName: "Carlos Rodriguez",
            appointmentDate: "2025-11-05",
            appointmentTime: "09:00",
            facilityName: "My Hub Cares Ortigas Main",
            providerName: "Dr. Maria Santos",
            type: "INITIAL CONSULTATION",
            status: "COMPLETED"
        }
    ];

    useEffect(() => {
        setAppointments(dummyAppointments);
        setFilteredAppointments(dummyAppointments);
    }, []);

    useEffect(() => {
        filterAppointments();
    }, [searchTerm, statusFilter, appointments]);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const filterAppointments = () => {
        let filtered = [...appointments];

        if (searchTerm) {
            filtered = filtered.filter(apt => {
                const patientName = apt.patientName ? apt.patientName.toLowerCase() : '';
                return patientName.includes(searchTerm.toLowerCase()) ||
                       apt.type.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        setFilteredAppointments(filtered);
    };

    // Calendar functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            if (direction === 'prev') {
                newMonth.setMonth(prev.getMonth() - 1);
            } else {
                newMonth.setMonth(prev.getMonth() + 1);
            }
            return newMonth;
        });
    };

    const handleDayClick = (day) => {
        setSelectedDay(day);
    };

    const getAppointmentsForDay = (day) => {
        if (!day) return [];
        
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return appointments.filter(apt => apt.appointmentDate === dateStr);
    };

    const handleEditAppointment = (appointment) => {
        setSelectedAppointment(appointment);
        setShowEditModal(true);
    };

    const handleDeleteAppointment = (appointmentId) => {
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            const updatedAppointments = appointments.filter(apt => apt.id !== appointmentId);
            setAppointments(updatedAppointments);
            setToast({
                message: 'Appointment deleted successfully',
                type: 'error'
            });
        }
    };

    const handleAddAppointment = (newAppointment) => {
        const appointment = {
            id: appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1,
            ...newAppointment,
            status: 'SCHEDULED'
        };
        setAppointments([...appointments, appointment]);
        setShowAddModal(false);
        setToast({
            message: 'Appointment booked successfully',
            type: 'success'
        });
    };

    const handleUpdateAppointment = (updatedAppointment) => {
        const updatedAppointments = appointments.map(apt => 
            apt.id === selectedAppointment.id ? { ...apt, ...updatedAppointment } : apt
        );
        setAppointments(updatedAppointments);
        setShowEditModal(false);
        setSelectedAppointment(null);
        setToast({
            message: 'Appointment updated successfully',
            type: 'success'
        });
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && 
                             today.getFullYear() === currentMonth.getFullYear();
        const todayDate = today.getDate();
        
        const days = [];
        const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        
        // Add weekday headers
        const weekDayElements = weekDays.map(day => (
            <div key={day} style={{
                textAlign: 'center',
                fontWeight: 'bold',
                padding: '10px 0',
                color: '#6c757d',
                fontSize: '14px',
                borderBottom: '1px solid #e9ecef'
            }}>
                {day}
            </div>
        ));
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} style={{ padding: '15px 0' }}></div>);
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isCurrentMonth && day === todayDate;
            const isSelected = selectedDay === day;
            
            days.push(
                <div 
                    key={day} 
                    onClick={() => handleDayClick(day)}
                    style={{
                        padding: '10px',
                        height: '80px',
                        border: isToday ? '2px solid #007bff' : '1px solid #e9ecef',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#e7f3ff' : 'white',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (!isSelected) {
                            e.target.style.backgroundColor = '#f8f9fa';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isSelected) {
                            e.target.style.backgroundColor = 'white';
                        }
                    }}
                >
                    <div style={{
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: isToday ? '#007bff' : '#333',
                        marginBottom: '5px'
                    }}>
                        {day}
                    </div>
                    {dayAppointments.length > 0 && (
                        <div style={{
                            fontSize: '11px',
                            color: '#6c757d',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {dayAppointments.length > 1 ? 
                                `${dayAppointments.length} appointments` : 
                                dayAppointments[0].type
                            }
                        </div>
                    )}
                    {dayAppointments.length > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: '5px',
                            right: '5px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: dayAppointments.some(a => a.status === 'SCHEDULED') ? '#28a745' : '#dc3545'
                        }}></div>
                    )}
                </div>
            );
        }
        
        return [...weekDayElements, ...days];
    };

    const renderAppointmentList = (appointmentsList) => {
        if (appointmentsList.length === 0) {
            return <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>No appointments found</p>;
        }

        return appointmentsList.map(apt => {
            const date = new Date(apt.appointmentDate);

            return (
                <div key={apt.id} style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
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
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                            {apt.patientName || 'N/A'}
                        </h3>
                        <strong style={{ color: '#007bff' }}>
                            {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </strong>
                        <div style={{ marginTop: '8px', color: '#6c757d' }}>
                            <span style={{ marginRight: '15px' }}>🕐 {apt.appointmentTime}</span>
                            <span style={{ marginRight: '15px' }}>📍 {apt.facilityName || 'N/A'}</span>
                            <span>👨‍⚕️ {apt.providerName || 'N/A'}</span>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#17a2b8',
                                color: 'white',
                                fontSize: '12px',
                                marginRight: '8px'
                            }}>
                                {apt.type}
                            </span>
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: apt.status === 'SCHEDULED' ? '#007bff' : 
                                          apt.status === 'COMPLETED' ? '#28a745' : 
                                          apt.status === 'CANCELLED' ? '#dc3545' : '#6c757d',
                                color: 'white',
                                fontSize: '12px'
                            }}>
                                {apt.status}
                            </span>
                        </div>
                    </div>
                    <div>
                        {apt.status === 'SCHEDULED' && (
                            <>
                                <button 
                                    onClick={() => handleEditAppointment(apt)}
                                    style={{
                                        padding: '8px 16px',
                                        marginRight: '8px',
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
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteAppointment(apt.id)}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#c82333'}
                                    onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            );
        });
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* Header with Title */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Appointment Calendar</h2>
                <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>Manage and view your appointments</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #dee2e6', marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('calendar')}
                    style={{
                        padding: '12px 24px',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'calendar' ? '3px solid #007bff' : 'none',
                        fontWeight: activeTab === 'calendar' ? 'bold' : 'normal',
                        color: activeTab === 'calendar' ? '#007bff' : '#6c757d',
                        background: 'none',
                        border: 'none',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    Calendar View
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    style={{
                        padding: '12px 24px',
                        cursor: 'pointer',
                        borderBottom: activeTab === 'list' ? '3px solid #007bff' : 'none',
                        fontWeight: activeTab === 'list' ? 'bold' : 'normal',
                        color: activeTab === 'list' ? '#007bff' : '#6c757d',
                        background: 'none',
                        border: 'none',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    List View
                </button>
            </div>

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button 
                                onClick={() => navigateMonth('prev')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginRight: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px',
                                    borderRadius: '4px',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.background = 'none'}
                            >
                                <ChevronLeft size={20} color="#007bff" />
                            </button>
                            <h3 style={{ margin: 0, color: '#333' }}>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button 
                                onClick={() => navigateMonth('next')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginLeft: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px',
                                    borderRadius: '4px',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.background = 'none'}
                            >
                                <ChevronRight size={20} color="#007bff" />
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)}
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
                            Book Appointment
                        </button>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '5px'
                    }}>
                        {renderCalendar()}
                    </div>
                    {selectedDay && (
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h4 style={{ marginTop: 0, color: '#333' }}>
                                Appointments for {currentMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </h4>
                            {getAppointmentsForDay(selectedDay).length > 0 ? (
                                renderAppointmentList(getAppointmentsForDay(selectedDay))
                            ) : (
                                <p style={{ color: '#6c757d' }}>No appointments scheduled for this day</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* List Tab */}
            {activeTab === 'list' && (
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text"
                                placeholder="Search appointments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    width: '250px'
                                }}
                            />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px'
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)}
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
                            Book Appointment
                        </button>
                    </div>
                    <div>
                        {renderAppointmentList(filteredAppointments)}
                    </div>
                </div>
            )}

            {/* Add Appointment Modal */}
            {showAddModal && (
                <AppointmentModal
                    mode="add"
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddAppointment}
                />
            )}

            {/* Edit Appointment Modal */}
            {showEditModal && selectedAppointment && (
                <AppointmentModal
                    mode="edit"
                    appointment={selectedAppointment}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedAppointment(null);
                    }}
                    onSave={handleUpdateAppointment}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545',
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
                        <Trash2 size={20} />
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

const AppointmentModal = ({ mode, appointment, onClose, onSave }) => {
    const [formData, setFormData] = useState(
        appointment || {
            patientName: '',
            appointmentDate: '',
            appointmentTime: '',
            facilityName: '',
            providerName: '',
            type: '',
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
                        {mode === 'add' ? 'Book Appointment' : 'Edit Appointment'}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Date <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input 
                                type="date"
                                name="appointmentDate"
                                value={formData.appointmentDate}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Time <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input 
                                type="time"
                                name="appointmentTime"
                                value={formData.appointmentTime}
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
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Facility <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input 
                            type="text"
                            name="facilityName"
                            value={formData.facilityName}
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
                            Provider <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input 
                            type="text"
                            name="providerName"
                            value={formData.providerName}
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
                            Appointment Type <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select 
                            name="type"
                            value={formData.type}
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
                            <option value="INITIAL CONSULTATION">Initial Consultation</option>
                            <option value="FOLLOW-UP CONSULTATION">Follow-up Consultation</option>
                            <option value="ART PICKUP">ART Pickup</option>
                            <option value="Lab Test">Lab Test</option>
                            <option value="Counseling">Counseling</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Notes
                        </label>
                        <textarea 
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
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
                            {mode === 'add' ? 'Book Appointment' : 'Update Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Appointments;