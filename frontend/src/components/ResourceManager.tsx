import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface Resource {
  id: string;
  disaster_id: string;
  name: string;
  location_name: string;
  type: string;
  created_at: string;
}

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
}

interface ResourceManagerProps {
  allResources: Resource[];
  disasters: Disaster[];
}

const ResourceManager: React.FC<ResourceManagerProps> = ({ allResources, disasters }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [socialMediaReports, setSocialMediaReports] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [apiInfo, setApiInfo] = useState<any>(null);

  useEffect(() => {
    setResources(allResources);
    fetchApiInfo();
    fetchGeneralSocialMedia();
  }, [allResources]);

  const fetchApiInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/resources`);
      setApiInfo(response.data);
    } catch (error) {
      console.error('Error fetching API info:', error);
    }
  };

  const fetchGeneralSocialMedia = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/social-media`);
      setSocialMediaReports(response.data.sample_recent_reports || []);
    } catch (error) {
      console.error('Error fetching social media:', error);
    }
  };

  const fetchResourcesForDisaster = async (disasterId: string) => {
    if (!disasterId) {
      setResources(allResources);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/resources/${disasterId}`);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching disaster resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialMediaForDisaster = async (disasterId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/social-media/${disasterId}`);
      setSocialMediaReports(response.data);
    } catch (error) {
      console.error('Error fetching social media for disaster:', error);
    }
  };

  const handleDisasterChange = (disasterId: string) => {
    setSelectedDisaster(disasterId);
    fetchResourcesForDisaster(disasterId);
    if (disasterId) {
      fetchSocialMediaForDisaster(disasterId);
    } else {
      fetchGeneralSocialMedia();
    }
  };

  const getFilteredResources = () => {
    if (filterType === 'all') return resources;
    return resources.filter(resource => resource.type === filterType);
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'shelter': return '🏠';
      case 'hospital': return '🏥';
      case 'food': return '🍽️';
      case 'water': return '💧';
      case 'supplies': return '📦';
      case 'transport': return '🚐';
      case 'communication': return '📡';
      default: return '📍';
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case 'shelter': return '#4CAF50';
      case 'hospital': return '#F44336';
      case 'food': return '#FF9800';
      case 'water': return '#2196F3';
      case 'supplies': return '#9C27B0';
      case 'transport': return '#607D8B';
      case 'communication': return '#795548';
      default: return '#999';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisasterName = (disasterId: string) => {
    const disaster = disasters.find(d => d.id === disasterId);
    return disaster ? disaster.title : 'Unknown Disaster';
  };

  const resourceTypes = Array.from(new Set(resources.map(r => r.type)));
  const filteredResources = getFilteredResources();

  return (
    <div className="resource-manager">
      <div className="manager-header">
        <h2>🛠️ Resource Management Dashboard</h2>
        <p>Manage and monitor disaster response resources across all active incidents.</p>
      </div>

      {apiInfo && (
        <div className="api-info-banner">
          <div className="info-content">
            <h3>📡 Resource API Status</h3>
            <p>{apiInfo.message}</p>
            <div className="api-stats">
              <span>Total Resources: {apiInfo.total}</span>
              <span>Active Disasters: {disasters.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="resource-controls">
        <div className="control-group">
          <label htmlFor="disaster-filter">🎯 Filter by Disaster:</label>
          <select
            id="disaster-filter"
            value={selectedDisaster}
            onChange={(e) => handleDisasterChange(e.target.value)}
          >
            <option value="">All Disasters</option>
            {disasters.map(disaster => (
              <option key={disaster.id} value={disaster.id}>
                {disaster.title} - {disaster.location_name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="type-filter">🏷️ Filter by Type:</label>
          <select
            id="type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            {resourceTypes.map(type => (
              <option key={type} value={type}>
                {getResourceTypeIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => {
            handleDisasterChange(selectedDisaster);
            fetchGeneralSocialMedia();
          }}
          className="refresh-btn"
        >
          🔄 Refresh Data
        </button>
      </div>

      <div className="manager-content">
        <div className="resources-panel">
          <div className="panel-header">
            <h3>📦 Resources ({filteredResources.length})</h3>
            {selectedDisaster && (
              <div className="disaster-info">
                <span>
                  📍 {disasters.find(d => d.id === selectedDisaster)?.title || 'Unknown Disaster'}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading">Loading resources...</div>
          ) : filteredResources.length > 0 ? (
            <div className="resources-grid">
              {filteredResources.map(resource => (
                <div key={resource.id} className="resource-card">
                  <div className="resource-header">
                    <span 
                      className="resource-type-badge"
                      style={{ backgroundColor: getResourceTypeColor(resource.type) }}
                    >
                      {getResourceTypeIcon(resource.type)} {resource.type}
                    </span>
                    <span className="resource-id">#{resource.id}</span>
                  </div>
                  
                  <h4 className="resource-name">{resource.name}</h4>
                  <p className="resource-location">📍 {resource.location_name}</p>
                  
                  <div className="resource-meta">
                    <div className="disaster-link">
                      🎯 {getDisasterName(resource.disaster_id)}
                    </div>
                    <div className="resource-date">
                      🕒 Added {formatDate(resource.created_at)}
                    </div>
                  </div>

                  <div className="resource-actions">
                    <button 
                      onClick={() => setSelectedDisaster(resource.disaster_id)}
                      className="view-disaster-btn"
                    >
                      👁️ View Disaster
                    </button>
                    <button 
                      onClick={() => {
                        // Copy resource info to clipboard
                        navigator.clipboard.writeText(
                          `${resource.name} - ${resource.type} at ${resource.location_name}`
                        );
                      }}
                      className="copy-info-btn"
                    >
                      📋 Copy Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-resources">
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <h4>No resources found</h4>
                <p>
                  {selectedDisaster 
                    ? 'No resources have been reported for the selected disaster yet.'
                    : 'No resources match the current filters.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="social-media-panel">
          <div className="panel-header">
            <h3>📱 Social Media Intelligence</h3>
            <span className="report-count">({socialMediaReports.length} reports)</span>
          </div>

          <div className="social-media-content">
            {socialMediaReports.length > 0 ? (
              <div className="social-reports">
                {socialMediaReports.slice(0, 5).map((report, index) => (
                  <div key={index} className="social-report-card">
                    <div className="report-header">
                      <span className="platform-badge">
                        {report.platform === 'twitter' ? '🐦' : 
                         report.platform === 'facebook' ? '📘' : 
                         report.platform === 'instagram' ? '📷' : '📱'} 
                        {report.platform}
                      </span>
                      <span className="report-time">
                        {report.timestamp ? formatDate(report.timestamp) : 'Recent'}
                      </span>
                    </div>
                    
                    <div className="report-content">
                      <p>{report.content || report.text || 'Social media report content'}</p>
                      {report.location && (
                        <div className="report-location">
                          📍 {report.location}
                        </div>
                      )}
                      {report.urgency && (
                        <div 
                          className="urgency-badge"
                          style={{ 
                            backgroundColor: report.urgency === 'high' ? '#F44336' : 
                                           report.urgency === 'medium' ? '#FF9800' : '#4CAF50'
                          }}
                        >
                          {report.urgency} priority
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {socialMediaReports.length > 5 && (
                  <div className="more-reports">
                    <p>+ {socialMediaReports.length - 5} more reports available</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-social-media">
                <div className="empty-state">
                  <span className="empty-icon">📱</span>
                  <h4>No social media reports</h4>
                  <p>Social media intelligence data will appear here when available.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{filteredResources.length}</div>
            <div className="stat-label">Total Resources</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <div className="stat-number">{resourceTypes.length}</div>
            <div className="stat-label">Resource Types</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">{disasters.length}</div>
            <div className="stat-label">Active Disasters</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <div className="stat-number">{socialMediaReports.length}</div>
            <div className="stat-label">Social Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManager;