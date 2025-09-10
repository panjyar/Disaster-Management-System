import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Activity, Server, Download, RefreshCw, CheckCircle, AlertCircle, Clock, Database, Users, Tag, Trash2, FileText } from 'lucide-react';
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
        return <CheckCircle className="w-5 h-5" style={{ color: 'var(--success-green)' }} />;
      case 'error':
      case 'ERROR':
        return <AlertCircle className="w-5 h-5" style={{ color: 'var(--alert-red)' }} />;
      case 'testing':
        return <Clock className="w-5 h-5" style={{ color: 'var(--warning-yellow)' }} />;
      default:
        return <Server className="w-5 h-5" style={{ color: 'var(--neutral-medium)' }} />;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Admin Panel</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--neutral-medium)', marginTop: '0.5rem' }}>
            System monitoring, data management, and administrative tools.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onRefresh} className="btn btn-primary"><RefreshCw size={16}/> Refresh All</button>
          <button onClick={exportData} className="btn btn-secondary"><Download size={16}/> Export Data</button>
        </div>
      </div>

      {/* System Status & API Tests */}
      <div className="card">
        <div className="card-header"><h2 className="card-title"><Activity /> System Status & API Tests</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {/* Health Card */}
          <div className="status-card">
              {getStatusIcon(systemHealth?.status)}
              <div>
                  <div className="status-title">System Health</div>
                  <div className={`status-badge ${systemHealth?.status?.toLowerCase()}`}>{systemHealth?.status || 'Unknown'}</div>
              </div>
          </div>
          {/* API Test Cards */}
          {Object.entries(apiTests).map(([key, test]) => (
             <div className="status-card" key={key}>
                {getStatusIcon(test.status)}
                <div>
                  <div className="status-title">{key} API</div>
                  <div className={`status-badge ${test.status}`}>{test.status}</div>
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disaster Management */}
      <div className="card">
        <div className="card-header"><h2 className="card-title"><Database /> Incident Management</h2></div>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
            {/* Filters */}
            <div style={{display: 'flex', gap: '1rem'}}>
              {/* Filter by Owner */}
              {/* Filter by Tag */}
            </div>
            {/* Bulk Actions */}
            <div style={{display: 'flex', gap: '0.5rem'}}>
                <select value={bulkActionType} onChange={(e) => setBulkActionType(e.target.value)} className="form-select">
                    <option value="">Bulk Action...</option>
                    <option value="delete">Delete Selected</option>
                    <option value="export">Export Selected</option>
                </select>
                <button onClick={handleBulkAction} disabled={!bulkActionType || selectedDisasters.length === 0} className="btn btn-secondary">
                    Apply
                </button>
            </div>
        </div>

        {/* Data Table */}
        <div className="table-container">
            <div className="table-header">
                <div className="table-cell checkbox-cell"><input type="checkbox"/></div>
                <div className="table-cell">Title</div>
                <div className="table-cell">Owner</div>
                <div className="table-cell">Tags</div>
                <div className="table-cell">Created</div>
                <div className="table-cell">Actions</div>
            </div>
            {filteredDisasters.map(disaster => (
                <div className="table-row" key={disaster.id}>
                    <div className="table-cell checkbox-cell"><input type="checkbox" checked={selectedDisasters.includes(disaster.id)} onChange={() => toggleDisasterSelection(disaster.id)}/></div>
                    <div className="table-cell" style={{fontWeight: 600}}>{disaster.title}</div>
                    <div className="table-cell">{disaster.owner_id}</div>
                    <div className="table-cell">
                        {disaster.tags.slice(0,2).map(tag => <span key={tag} className="table-tag">{tag}</span>)}
                    </div>
                    <div className="table-cell">{new Date(disaster.created_at).toLocaleDateString()}</div>
                    <div className="table-cell action-cell">
                        <button className="btn-icon" title="View Audit Trail"><FileText size={16}/></button>
                        <button className="btn-icon btn-icon-danger" title="Delete"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>
         {filteredDisasters.length === 0 && <div className="empty-state" style={{marginTop: '1rem'}}><p>No incidents found.</p></div>}
      </div>

       <style>{`
        .status-card { display: flex; align-items: center; gap: 1rem; background-color: var(--neutral-lightest); padding: 1rem; border-radius: var(--border-radius-md); border: 1px solid var(--border-color); }
        .status-title { font-weight: 600; color: var(--neutral-darkest); }
        .status-badge { text-transform: capitalize; font-size: 0.8rem; font-weight: 600; }
        .status-badge.ok, .status-badge.success { color: var(--success-green); }
        .status-badge.error { color: var(--alert-red); }
        .status-badge.testing { color: var(--warning-yellow); }

        .table-container { border: 1px solid var(--border-color); border-radius: var(--border-radius-md); overflow: hidden; }
        .table-header, .table-row { display: grid; grid-template-columns: 40px 2fr 1fr 1.5fr 1fr 100px; align-items: center; padding: 0 1rem; }
        .table-header { background-color: var(--neutral-lightest); font-weight: 600; border-bottom: 1px solid var(--border-color); }
        .table-row { border-bottom: 1px solid var(--border-color); transition: background-color 0.2s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background-color: var(--neutral-lightest); }
        .table-cell { padding: 0.85rem 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .checkbox-cell { padding-left: 0; }
        .action-cell { display: flex; gap: 0.5rem; }
        .table-tag { background-color: var(--neutral-light); color: var(--neutral-darkest); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.25rem; }
        .btn-icon { background: none; border: none; padding: 0.4rem; border-radius: 50%; cursor: pointer; color: var(--neutral-medium); transition: var(--transition-fast); }
        .btn-icon:hover { background-color: #e2e8f0; }
        .btn-icon-danger:hover { background-color: #ffebe6; color: var(--alert-red); }
      `}</style>
    </div>
  );
};

export default AdminPanel;
