import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Activity,
  Download,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Database,
  Users,
  Tag,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  MoreVertical
} from 'lucide-react';
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
  const [disasterDetails, setDisasterDetails] = useState<Disaster | null>(null);

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
      } else if (bulkActionType === 'export') {
        const selectedData = disasters.filter(d => selectedDisasters.includes(d.id));
        const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `disaster-data-selected-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'OK':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'testing':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <Server className="w-5 h-5 text-gray-500" />;
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
      <motion.div
        className="admin-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="admin-title">
          <Settings className="w-8 h-8" />
          Administrative Dashboard
        </h1>
        <div className="admin-actions">
          <motion.button
            onClick={checkSystemHealth}
            className="btn btn-secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Activity className="w-4 h-4" />
            Health Check
          </motion.button>
          <motion.button
            onClick={runApiTests}
            className="btn btn-secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Server className="w-4 h-4" />
            Test APIs
          </motion.button>
          <motion.button
            onClick={exportData}
            className="btn btn-secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-4 h-4" />
            Export Data
          </motion.button>
          <motion.button
            onClick={onRefresh}
            className="btn btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh All
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="system-status"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Activity className="w-5 h-5" />
              System Health
            </h2>
          </div>
          <div className="status-grid">
            <div className="status-card">
              <div className="status-indicator">
                {getStatusIcon(systemHealth?.status)}
                <div>
                  <div className="font-semibold">System Status</div>
                  <div className="text-sm text-gray-600">
                    {systemHealth?.status || 'Unknown'}
                  </div>
                </div>
              </div>
              {systemHealth?.timestamp && (
                <div className="status-details">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Last Check: {new Date(systemHealth.timestamp).toLocaleString()}
                </div>
              )}
              {systemHealth?.error && (
                <div className="notification notification-error">
                  <AlertCircle className="notification-icon" />
                  <div className="notification-content">
                    <div className="notification-message">
                      {systemHealth.error}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="api-tests"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Server className="w-5 h-5" />
              API Endpoint Tests
            </h2>
          </div>
          <div className="tests-grid">
            <AnimatePresence>
              {Object.entries(apiTests).map(([key, test], index) => (
                <motion.div
                  key={key}
                  className="test-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <div className="test-card-header">
                    <div className="test-name">{key}</div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <span className={`status-badge ${
                        test.status === 'success' ? 'status-success' :
                        test.status === 'error' ? 'status-error' : 'status-warning'
                      }`}>
                        <span className="status-dot"></span>
                        {test.status}
                      </span>
                    </div>
                  </div>
                  <div className="test-endpoint">
                    {test.endpoint}
                  </div>
                  {test.response && (
                    <div className="test-result success">
                      HTTP {test.response}
                    </div>
                  )}
                  {test.error && (
                    <div className="test-result error">
                      {test.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {loading && (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <div className="loading-spinner mr-2"></div>
              Running tests...
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="disaster-management"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Database className="w-5 h-5" />
              Disaster Management
            </h2>
          </div>

          <div className="management-controls">
            <div className="filters">
              <div className="form-group">
                <label className="form-label">
                  <Users className="w-4 h-4 inline mr-1" />
                  Filter by Owner
                </label>
                <select
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                  className="form-input form-select"
                >
                  <option value="">All Owners</option>
                  {owners.map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Filter by Tag
                </label>
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="form-input form-select"
                >
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
                className="form-input form-select"
              >
                <option value="">Select Bulk Action</option>
                <option value="delete">Delete Selected</option>
                <option value="export">Export Selected</option>
              </select>

              <motion.button
                onClick={handleBulkAction}
                disabled={!bulkActionType || selectedDisasters.length === 0}
                className="btn btn-error"
                whileHover={{ scale: bulkActionType && selectedDisasters.length > 0 ? 1.02 : 1 }}
                whileTap={{ scale: bulkActionType && selectedDisasters.length > 0 ? 0.98 : 1 }}
              >
                <Trash2 className="w-4 h-4" />
                Apply to {selectedDisasters.length} Selected
              </motion.button>
            </div>
          </div>

          <div className="management-table">
            <div className="table-header">
              <div className="table-grid">
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
                  className="table-checkbox"
                />
                <div className="table-cell">Title</div>
                <div className="table-cell">Location</div>
                <div className="table-cell">Owner</div>
                <div className="table-cell">Tags</div>
                <div className="table-cell">Created</div>
                <div className="table-cell">Actions</div>
              </div>
            </div>

            <AnimatePresence>
              {filteredDisasters.map((disaster, index) => (
                <motion.div
                  key={disaster.id}
                  className="table-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="table-grid">
                    <input
                      type="checkbox"
                      checked={selectedDisasters.includes(disaster.id)}
                      onChange={() => toggleDisasterSelection(disaster.id)}
                      className="table-checkbox"
                    />
                    <div className="table-cell">
                      <div className="font-semibold text-gray-900 truncate">
                        {disaster.title}
                      </div>
                    </div>
                    <div className="table-cell text-gray-600">
                      {disaster.location_name || 'Unknown'}
                    </div>
                    <div className="table-cell">
                      <div className="tag tag-primary">
                        <Users className="w-3 h-3" />
                        {disaster.owner_id}
                      </div>
                    </div>
                    <div className="table-cell">
                      <div className="table-tags">
                        {disaster.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="table-tag">
                            {tag}
                          </span>
                        ))}
                        {disaster.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{disaster.tags.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="table-cell text-gray-600">
                      {new Date(disaster.created_at).toLocaleDateString()}
                    </div>
                    <div className="table-cell">
                      <div className="table-actions">
                        <motion.button
                          onClick={() => setDisasterDetails(disaster)}
                          className="btn-icon btn-ghost"
                          title="View Audit Trail"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FileText className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={async () => {
                            if (window.confirm('Delete this disaster?')) {
                              await axios.delete(`${API_URL}/api/disasters/${disaster.id}`, {
                                data: { user_id: 'reliefAdmin' }
                              });
                              onRefresh();
                            }
                          }}
                          className="btn-icon btn-ghost hover:text-red-600"
                          title="Delete Disaster"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredDisasters.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Database className="w-16 h-16" />
              </div>
              <div className="empty-state-title">
                No disasters match the current filters
              </div>
              <div className="empty-state-description">
                Try adjusting your filters or add new disasters.
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {disasterDetails && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDisasterDetails(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">
                  <FileText className="w-5 h-5" />
                  Audit Trail for {disasterDetails.title}
                </h3>
                <button onClick={() => setDisasterDetails(null)} className="btn-close">
                  &times;
                </button>
              </div>
              <div className="modal-body">
                {disasterDetails.audit_trail && disasterDetails.audit_trail.length > 0 ? (
                  <div className="audit-trail-list">
                    {disasterDetails.audit_trail.map((entry, index) => (
                      <div key={index} className="audit-entry">
                        <div className="audit-timestamp">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div className="audit-action">
                          <strong>Action:</strong> {entry.action}
                        </div>
                        <div className="audit-user">
                          <strong>User:</strong> {entry.user_id}
                        </div>
                        <div className="audit-details">
                          <strong>Details:</strong>
                          <pre className="audit-code">{JSON.stringify(entry.details, null, 2)}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No audit trail data available.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
