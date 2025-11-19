import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return {
      valid: minLength && hasUpperCase && hasLowerCase && hasNumber,
      errors: [
        !minLength && 'Password must be at least 8 characters',
        !hasUpperCase && 'Password must contain at least one uppercase letter',
        !hasLowerCase && 'Password must contain at least one lowercase letter',
        !hasNumber && 'Password must contain at least one number',
      ].filter(Boolean),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setToast({
        message: 'Please fill in all fields',
        type: 'error',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setToast({
        message: 'New password and confirm password do not match',
        type: 'error',
      });
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setToast({
        message: 'New password must be different from current password',
        type: 'error',
      });
      return;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.valid) {
      setToast({
        message: passwordValidation.errors.join(', '),
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Password changed successfully',
          type: 'success',
        });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setToast({
          message: data.message || 'Failed to change password',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setToast({
        message: 'Failed to change password. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = formData.newPassword ? validatePassword(formData.newPassword) : null;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Lock size={28} color="#D84040" />
          <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>Change Password</h2>
        </div>
        <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
          Update your account password to keep your account secure
        </p>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          maxWidth: '600px',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#333',
              }}
            >
              Current Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                required
                style={{
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#333',
              }}
            >
              New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                style={{
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordValidation && (
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <div style={{ marginBottom: '4px', color: '#6c757d' }}>Password requirements:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { check: passwordValidation.valid && formData.newPassword.length >= 8, text: 'At least 8 characters' },
                    { check: passwordValidation.valid && /[A-Z]/.test(formData.newPassword), text: 'One uppercase letter' },
                    { check: passwordValidation.valid && /[a-z]/.test(formData.newPassword), text: 'One lowercase letter' },
                    { check: passwordValidation.valid && /[0-9]/.test(formData.newPassword), text: 'One number' },
                  ].map((req, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: req.check ? '#28a745' : '#6c757d',
                      }}
                    >
                      {req.check ? <Check size={14} /> : <div style={{ width: '14px' }} />}
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#333',
              }}
            >
              Confirm New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                style={{
                  padding: '10px 40px 10px 12px',
                  border:
                    formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                      ? '1px solid #dc3545'
                      : '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                }}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6c757d',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#dc3545' }}>
                Passwords do not match
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#D84040',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              width: '100%',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor:
              toast.type === 'success'
                ? '#28a745'
                : toast.type === 'error'
                ? '#dc3545'
                : '#17a2b8',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            zIndex: 9999,
          }}
        >
          {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ChangePassword;

