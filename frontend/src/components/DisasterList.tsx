import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
}

interface SocialMediaReport {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  priority: string;
  verified: boolean;
}

interface DisasterListProps {
  disasters: Disaster[];
  onSelectDisaster: (disaster: Disaster) => void;
  selectedDisaster: Disaster | null;
  onDeleteDisaster: (id: string) => void;
}

const DisasterList: React.FC<DisasterListProps> = ({ 
  disasters, 
  onSelectDisaster, 
  selectedDisaster,
  onDeleteDisaster
}) => {
  const [socialReports, setSocialReports] = useState<Record<string, SocialMediaReport[]>>({});
  const [loadingSocial, setLoadingSocial] = useState<Record<string, boolean>>({});
  const [editingDisaster, setEditingDisaster] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Disaster>>({});

  const fetchSocialReports = async (disasterId: string) => {
    if (socialReports[disasterId] || loadingSocial[disasterId]) return;
    
    setLoadingSocial(prev => ({ ...prev, [disasterId]: true }));
    
    try {
      const response = await axios.get(`${API_URL}/api/social-media/${disasterId}`);
      setSocialReports(prev => ({ ...prev, [disasterId]: response.data }));
    } catch (error) {
      console.error('Error fetching social reports:', error);
    } finally {
      setLoadingSocial(prev => ({ ...prev, [disasterId]: false }));
    }
  };

  const updateDisaster = async (disaster: Disaster) => {
    try {
      await axios.put(`${API_URL}/api/disasters/${disaster.id}`, {
        ...editForm,
        user_id: 'reliefAdmin'
      });
      setEditingDisaster(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating disaster:', error);
    }
  };

  const startEdit = (disaster: Disaster) => {
    setEditingDisaster(disaster.id);
    setEditForm({
      title: disaster.title,
      location_name: disaster.location_name,
      description: disaster.description,
      tags: disaster.tags
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      default: return '#888';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'flood': return '#4A90E2';
      case 'earthquake': return '#8B4513';
      case 'fire': return '#FF4444';
      case 'urgent': return '#FF8800';
      case 'evacuation': return '#FF0000';
      default: return '#667eea';
    }
  };

  return (
    <div className="disaster-list">
      {disasters.length === 0 ? (
        <div className="no-disasters">
          <div className="empty-state">
            <h3>📝 No disasters reported yet</h3>
            <p>Use the form on the left to report a new disaster.</p>
          </div>
        </div>
      ) : (
        disasters.map(disaster => (
          <div 
            key={disaster.id} 
            className={`disaster-card ${selectedDisaster?.id === disaster.id ? 'selected' : ''}`}
          >
            {editingDisaster === disaster.id ? (
              <div className="edit-form">
                <input
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title"
                  className="edit-input"
                />
                <input
                  value={editForm.location_name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location_name: e.target.value }))}
                  placeholder="Location"
                  className="edit-input"
                />
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  className="edit-textarea"
                  rows={3}
                />
                <input
                  value={editForm.tags?.join(', ') || ''}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                  }))}
                  placeholder="Tags (comma separated)"
                  className="edit-input"
                />
                <div className="edit-actions">
                  <button onClick={() => updateDisaster(disaster)} className="save-btn">
                    💾 Save
                  </button>
                  <button 
                    onClick={() => setEditingDisaster(null)} 
                    className="cancel-btn"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="disaster-header">
                  <div className="title-section">
                    <h3 onClick={() => {
                      onSelectDisaster(disaster);
                      fetchSocialReports(disaster.id);
                    }}>{disaster.title}</h3>
                    <div className="action-buttons">
                      <button 
                        onClick={() => startEdit(disaster)}
                        className="edit-btn"
                        title="Edit disaster"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onDeleteDisaster(disaster.id)}
                        className="delete-btn"
                        title="Delete disaster"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="disaster-meta">
                    <span className="location">📍 {disaster.location_name || 'Location TBD'}</span>
                    <span className="date">{formatDate(disaster.created_at)}</span>
                  </div>
                </div>
                
                <p className="disaster-description">{disaster.description}</p>
                
                <div className="disaster-tags">
                  {disaster.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="tag"
                      style={{ backgroundColor: getTagColor(tag) }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="disaster-footer">
                  <span className="owner">👤 {disaster.owner_id}</span>
                  <button 
                    onClick={() => {
                      onSelectDisaster(disaster);
                      fetchSocialReports(disaster.id);
                    }}
                    className="view-details-btn"
                  >
                    📱 View Reports
                  </button>
                </div>

                {selectedDisaster?.id === disaster.id && (
                  <div className="social-reports">
                    <div className="reports-header">
                      <h4>📱 Social Media Reports</h4>
                      <button 
                        onClick={() => fetchSocialReports(disaster.id)}
                        className="refresh-reports-btn"
                      >
                        🔄
                      </button>
                    </div>
                    {loadingSocial[disaster.id] ? (
                      <div className="loading-social">Loading reports...</div>
                    ) : socialReports[disaster.id]?.length > 0 ? (
                      <div className="reports-list">
                        {socialReports[disaster.id].map(report => (
                          <div key={report.id} className="social-report">
                            <div className="report-header">
                              <span className="user">@{report.user}</span>
                              <div className="report-meta">
                                <span 
                                  className="priority"
                                  style={{ color: getPriorityColor(report.priority) }}
                                >
                                  {report.priority.toUpperCase()}
                                </span>
                                {report.verified && <span className="verified">✅ Verified</span>}
                              </div>
                            </div>
                            <p className="report-content">{report.content}</p>
                            <div className="report-footer">
                              <span className="report-time">
                                {formatDate(report.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-reports">
                        <p>📭 No social media reports found for this disaster.</p>
                        <small>Reports are automatically collected from social media platforms.</small>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default DisasterList;