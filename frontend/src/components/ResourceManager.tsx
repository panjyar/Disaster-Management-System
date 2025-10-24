import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Wrench, Plus, Filter } from 'lucide-react';
import { Resource, Disaster } from '../App';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface ResourceManagerProps {
  allResources: Resource[];
  disasters: Disaster[];
}

const ResourceManager: React.FC<ResourceManagerProps> = ({ allResources, disasters }) => {
  const [filterType, setFilterType] = useState('');
  const [filterDisaster, setFilterDisaster] = useState('');

  const filteredResources = allResources.filter(resource => {
    if (filterType && resource.type !== filterType) return false;
    if (filterDisaster && resource.disaster_id !== filterDisaster) return false;
    return true;
  });

  const resourceTypes = Array.from(new Set(allResources.map(r => r.type)));

  return (
    <div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Resource Hub</h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--neutral-medium)', marginTop: '0.5rem', marginBottom: '2rem' }}>
        Manage and track all disaster response resources across incidents.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Filters */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><Filter size={20} /> Filters</h2>
          </div>
          
          <div className="form-group">
            <label className="form-label">Resource Type</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select"
            >
              <option value="">All Types</option>
              {resourceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Incident</label>
            <select 
              value={filterDisaster} 
              onChange={(e) => setFilterDisaster(e.target.value)}
              className="form-select"
            >
              <option value="">All Incidents</option>
              {disasters.map(disaster => (
                <option key={disaster.id} value={disaster.id}>{disaster.title}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => {
              setFilterType('');
              setFilterDisaster('');
            }}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            Clear Filters
          </button>
        </div>

        {/* Resources List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Resources ({filteredResources.length})</h2>
          </div>

          {filteredResources.length === 0 ? (
            <div className="empty-state">
              <p>No resources found matching filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredResources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--neutral-lightest)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 600 }}>{resource.name}</h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>
                        {resource.location_name}
                      </p>
                    </div>
                    <span style={{
                      backgroundColor: 'var(--primary-blue)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {resource.type}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceManager;