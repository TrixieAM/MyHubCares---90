import React from 'react';
import { Info, Heart, Users, Shield, Phone, Mail, Globe } from 'lucide-react';

const About = () => {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Info size={28} color="#D84040" />
          <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>About MyHubCares</h2>
        </div>
        <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
          Learn more about our healthcare management system
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Mission Section */}
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Heart size={24} color="#D84040" />
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Our Mission</h3>
          </div>
          <p style={{ color: '#6c757d', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
            "It's my hub, and it's yours" - MyHubCares is your partner in sexual health and wellness.
            We are committed to providing comprehensive, compassionate, and confidential healthcare
            services to improve the lives of our patients and communities.
          </p>
        </div>

        {/* Vision Section */}
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Users size={24} color="#D84040" />
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Our Vision</h3>
          </div>
          <p style={{ color: '#6c757d', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
            To be the leading healthcare management system that empowers patients and healthcare
            providers with innovative technology, ensuring accessible, quality healthcare for all.
            We strive to create a supportive environment where every individual can take control of
            their health journey.
          </p>
        </div>

        {/* Features Section */}
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Shield size={24} color="#D84040" />
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Key Features</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>Patient Management</h4>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                Comprehensive patient records with UIC tracking and ARPA risk assessment
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>Clinical Care</h4>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                Complete clinical visit documentation with vital signs and diagnoses
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>Medication Management</h4>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                Prescription management with adherence tracking and reminders
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>Lab Test Management</h4>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                Lab orders, results entry, and critical value alerts
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>Appointment Scheduling</h4>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                Easy appointment booking with automated reminders
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>Care Coordination</h4>
              <p style={{ color: '#6c757d', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
                Referrals, counseling sessions, and HTS management
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Phone size={24} color="#D84040" />
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Contact Us</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Globe size={20} color="#6c757d" />
              <div>
                <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>Website</div>
                <a
                  href="https://www.myhubcares.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#D84040', textDecoration: 'none', fontSize: '14px' }}
                >
                  www.myhubcares.com
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={20} color="#6c757d" />
              <div>
                <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>Email</div>
                <a
                  href="mailto:info@myhubcares.com"
                  style={{ color: '#D84040', textDecoration: 'none', fontSize: '14px' }}
                >
                  info@myhubcares.com
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone size={20} color="#6c757d" />
              <div>
                <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>Phone</div>
                <div style={{ color: '#6c757d', fontSize: '14px' }}>Contact your facility for support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div
          style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
            MyHubCares Healthcare Management System
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '12px' }}>
            Version 1.0.0 | © {new Date().getFullYear()} MyHubCares. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;


