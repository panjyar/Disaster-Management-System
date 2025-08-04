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
  audit_trail?: any[];
}

interface AdminPanelProps {
  disasters: Disaster[];
  onRefresh: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ disasters, onRefresh }) => {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [apiTests, setApiTests] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [selectedDisasters, setSelectedDisasters] = useState<string[]>([]);
  const [filterOwner, setFilterOwner] = useState('');
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    checkSystemHealth();
    runApiTests();
  }, []);

  const checkSystemHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setSystemHealth(response.data);
    } catch (error) {
      setSystemHealth({ status: 'ERROR', error: 'Health check failed' });
    }
  };

  const runApiTests = async () => {
    setLoading(true);
    const tests = {
      disasters: { endpoint: '/api/disasters', status: 'testing' },
      resources: { endpoint: '/api/resources', status: 'testing' },
      socialMedia: { endpoint: '/api/social-media', status: 'testing' },
      geocode: { endpoint: '/api/geocode', status: 'testing' },
      verification: { endpoint: '/api/verification', status: 'testing' }
    };

    setApiTests(tests);

    // Test each endpoint
    for (const [key, test] of Object.entries(tests)) {
      try {
        const response = await axios.get(`${API_URL}${test.endpoint}`);
        setApiTests(prev => ({
          ...prev,
          [key]: { ...test, status: 'success', response: response.status }
        }));
      } catch (error) {
        setApiTests(prev => ({
          ...prev,
          [key]: { ...test, status: 'error', error: (error as any).message }
        }));
      }
    }

    setLoading(false);
  };

  const handleBulkAction = async () => {
    if (!bulkActionType || selectedDisasters.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${bulkActionType} ${selectedDisasters.length} disaster(s)?`
    );

    if (!confirmed) return;

    try {
      if (bulkActionType === 'delete') {
        await Promise.all(
          selectedDisasters.map(id => 
            axios.delete(`${API_URL}/api/disasters/${id}`, {
              data: { user_id: 'reliefAdmin' }
            })
          )
        );
      }
      
      setSelectedDisasters([]);
      setBulkActionType('');
      onRefresh();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const exportData = () => {
    const data = {
      disasters,
      exportDate: new Date().toISOString(),
      systemHealth,
      apiTests
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disaster-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFilteredDisasters = () => {
    return disasters.filter(disaster => {
      if (filterOwner && disaster.owner_id !== filterOwner) return false;
      if (filterTag && !disaster.tags.includes(filterTag)) return false;
      return true;
    });
  };

  const toggleDisasterSelection = (id: string) => {
    setSelectedDisasters(prev => 
      prev.includes(id) 
        ? prev.filter(disasterId => disasterId !== id)
        : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': case 'OK': return '#4CAF50';
      case 'error': case 'ERROR': return '#F44336';
      case 'testing': return '#FF9800';
      default: return '#607D8B';
    }
  };
const owners = disasters
  .map(d => d.owner_id)
  .filter((owner, index, self) => self.indexOf(owner) === index);

const tags = disasters
  .flatMap(d => d.tags)
  .filter((tag, index, self) => self.indexOf(tag) === index);

  const filteredDisasters = getFilteredDisasters();

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>⚙️ Administrative Dashboard</h2>
        <div className="admin-actions">
          <button onClick={checkSystemHealth} className="action-btn">
            🏥 Health Check
          </button>
          <button onClick={runApiTests} className="action-btn">
            🧪 Test APIs
          </button>
          <button onClick={exportData} className="action-btn">
            📥 Export Data
          </button>
          <button onClick={onRefresh} className="action-btn">
            🔄 Refresh All
          </button>
        </div>
      </div>

      <div className="system-status">
        <h3>🏥 System Health</h3>
        <div className="health-grid">
          <div className="health-card">
            <div className="health-indicator">
              <span 
                className="status-dot"
                style={{ backgroundColor: getStatusColor(systemHealth?.status) }}
              ></span>
              <strong>System Status:</strong> {systemHealth?.status || 'Unknown'}
            </div>
            {systemHealth?.timestamp && (
              <div className="health-time">
                Last Check: {new Date(systemHealth.timestamp).toLocaleString()}
              </div>
            )}
            {systemHealth?.error && (
              <div className="health-error">Error: {systemHealth.error}</div>
            )}
          </div>
        </div>
      </div>

      <div className="api-tests">
        <h3>🧪 API Endpoint Tests</h3>
        <div className="tests-grid">
          {Object.entries(apiTests).map(([key, test]) => (
            <div key={key} className="test-card">
              <div className="test-header">
                <span className="test-name">{key}</span>
                <span 
                  className="test-status"
                  style={{ backgroundColor: getStatusColor(test.status) }}
                >
                  {test.status}
                </span>
              </div>
              <div className="test-endpoint">
                <code>{test.endpoint}</code>
              </div>
              {test.response && (
                <div className="test-response">HTTP {test.response}</div>
              )}
              {test.error && (
                <div className="test-error">{test.error}</div>
              )}
            </div>
          ))}
        </div>
        {loading && <div className="testing-indicator">Running tests...</div>}
      </div>

      <div className="disaster-management">
        <h3>🚨 Disaster Management</h3>
        
        <div className="management-controls">
          <div className="filters">
            <div className="filter-group">
              <label>Filter by Owner:</label>
              <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
                <option value="">All Owners</option>
                {owners.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Filter by Tag:</label>
              <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bulk-actions">
            <select 
              value={bulkActionType} 
              onChange={(e) => setBulkActionType(e.target.value)}
            >
              <option value="">Select Bulk Action</option>
              <option value="delete">Delete Selected</option>
              <option value="export">Export Selected</option>
            </select>
            
            <button 
              onClick={handleBulkAction}
              disabled={!bulkActionType || selectedDisasters.length === 0}
              className="bulk-action-btn"
            >
              Apply to {selectedDisasters.length} Selected
            </button>
          </div>
        </div>

        <div className="disasters-table">
          <div className="table-header">
            <div className="header-cell">
              <input
                type="checkbox"
                checked={selectedDisasters.length === filteredDisasters.length && filteredDisasters.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDisasters(filteredDisasters.map(d => d.id));
                  } else {
                    setSelectedDisasters([]);
                  }
                }}
              />
            </div>
            <div className="header-cell">Title</div>
            <div className="header-cell">Location</div>
            <div className="header-cell">Owner</div>
            <div className="header-cell">Tags</div>
            <div className="header-cell">Created</div>
            <div className="header-cell">Actions</div>
          </div>

          {filteredDisasters.map(disaster => (
            <div key={disaster.id} className="table-row">
              <div className="table-cell">
                <input
                  type="checkbox"
                  checked={selectedDisasters.includes(disaster.id)}
                  onChange={() => toggleDisasterSelection(disaster.id)}
                />
              </div>
              <div className="table-cell">
                <strong>{disaster.title}</strong>
              </div>
              <div className="table-cell">
                {disaster.location_name || 'Unknown'}
              </div>
              <div className="table-cell">
                {disaster.owner_id}
              </div>
              <div className="table-cell">
                <div className="tags-list">
                  {disaster.tags.map(tag => (
                    <span key={tag} className="tag-mini">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="table-cell">
                {new Date(disaster.created_at).toLocaleDateString()}
              </div>
              <div className="table-cell">
                <div className="row-actions">
                  <button 
                    onClick={() => console.log('View audit trail for', disaster.id)}
                    className="action-btn-mini"
                    title="View Audit Trail"
                  >
                    📋
                  </button>
                  <button 
                    onClick={async () => {
                      if (window.confirm('Delete this disaster?')) {
                        await axios.delete(`${API_URL}/api/disasters/${disaster.id}`, {
                          data: { user_id: 'reliefAdmin' }
                        });
                        onRefresh();
                      }
                    }}
                    className="action-btn-mini delete"
                    title="Delete Disaster"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDisasters.length === 0 && (
          <div className="no-data">No disasters match the current filters.</div>
        )}
      </div>

      <div className="system-stats">
        <h3>📊 System Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{disasters.length}</div>
            <div className="stat-label">Total Disasters</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{owners.length}</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{tags.length}</div>
            <div className="stat-label">Unique Tags</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {Object.values(apiTests).filter(test => test.status === 'success').length}/
              {Object.keys(apiTests).length}
            </div>
            <div className="stat-label">APIs Online</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;