import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const FAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedFaqs, setExpandedFaqs] = useState(new Set());

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/faqs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFaqs(data.faqs || []);
        }
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (faqId) => {
    const newExpanded = new Set(expandedFaqs);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedFaqs(newExpanded);
  };

  // Get unique categories
  const categories = ['', ...new Set(faqs.map((faq) => faq.category).filter(Boolean))];

  // Filter FAQs
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory && faq.is_published;
  });

  // Sort by display_order
  const sortedFaqs = [...filteredFaqs].sort((a, b) => a.display_order - b.display_order);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <HelpCircle size={28} color="#D84040" />
          <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>Frequently Asked Questions</h2>
        </div>
        <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
          Find answers to common questions about MyHubCares
        </p>
      </div>

      {/* Search and Filter */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search
              size={18}
              color="#6c757d"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '10px 12px 10px 36px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
              }}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              minWidth: '150px',
              fontSize: '14px',
            }}
          >
            <option value="">All Categories</option>
            {categories
              .filter((cat) => cat !== '')
              .map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* FAQs List */}
      {loading ? (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ color: '#6c757d' }}>Loading FAQs...</p>
        </div>
      ) : sortedFaqs.length === 0 ? (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ color: '#6c757d' }}>
            {searchTerm || selectedCategory
              ? 'No FAQs found matching your search criteria.'
              : 'No FAQs available at the moment.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedFaqs.map((faq) => {
            const isExpanded = expandedFaqs.has(faq.faq_id);
            return (
              <div
                key={faq.faq_id}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => toggleFaq(faq.faq_id)}
                  style={{
                    width: '100%',
                    padding: '20px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '15px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <h3
                        style={{
                          margin: 0,
                          color: '#333',
                          fontSize: '16px',
                          fontWeight: 600,
                        }}
                      >
                        {faq.question}
                      </h3>
                      {faq.category && (
                        <span
                          style={{
                            padding: '4px 10px',
                            background: '#f0f0f0',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#6c757d',
                          }}
                        >
                          {faq.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ color: '#D84040' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 20px 20px 20px',
                      color: '#6c757d',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      borderTop: '1px solid #f0f0f0',
                      marginTop: '10px',
                      paddingTop: '20px',
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{faq.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FAQs;


