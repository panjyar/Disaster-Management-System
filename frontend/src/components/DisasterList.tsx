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
}

const DisasterList: React.FC<DisasterListProps> = ({ 
  disasters, 
  onSelectDisaster, 
  selectedDisaster 
}) => {
  const [socialReports, setSocialReports] = useState<Record<string, SocialMediaReport[]>>({});
  const [loadingSocial, setLoadingSocial] = useState<Record<string, boolean>>({});

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

  return (
    <div className="disaster-list">
      {disasters.length === 0 ? (
        <div className="no-disasters">No disasters reported yet.</div>
      ) : (
        disasters.map(disaster => (
          <div 
            key={disaster.id} 
            className={`disaster-card ${selectedDisaster?.id === disaster.id ? 'selected' : ''}`}
            onClick={() => {
              onSelectDisaster(disaster);
              fetchSocialReports(disaster.id);
            }}
          >
            <div className="disaster-header">
              <h3>{disaster.title}</h3>
              <div className="disaster-meta">
                <span className="location">📍 {disaster.location_name || 'Location TBD'}</span>
                <span className="date">{formatDate(disaster.created_at)}</span>
              </div>
            </div>
            
            <p className="disaster-description">{disaster.description}</p>
            
            <div className="disaster-tags">
              {disaster.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            
            <div className="disaster-footer">
              <span className="owner">By: {disaster.owner_id}</span>
            </div>

            {selectedDisaster?.id === disaster.id && (
              <div className="social-reports">
                <h4>📱 Social Media Reports</h4>
                {loadingSocial[disaster.id] ? (
                  <div className="loading-social">Loading reports...</div>
                ) : socialReports[disaster.id]?.length > 0 ? (
                  <div className="reports-list">
                    {socialReports[disaster.id].map(report => (
                      <div key={report.id} className="social-report">
                        <div className="report-header">
                          <span className="user">@{report.user}</span>
                          <span 
                            className="priority"
                            style={{ color: getPriorityColor(report.priority) }}
                          >
                            {report.priority.toUpperCase()}
                          </span>
                          {report.verified && <span className="verified">✓</span>}
                        </div>
                        <p className="report-content">{report.content}</p>
                        <span className="report-time">
                          {formatDate(report.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-reports">No social media reports found.</div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default DisasterList;