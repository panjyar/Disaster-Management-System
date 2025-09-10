// src/components/IncidentManagement.tsx
import React, { useState } from 'react';
import axios from 'axios';
import DisasterForm from './DisasterForm';
import DisasterList from './DisasterList';
import ReportForm from './ReportForm';
import ResourceMap from './ResourceMap';
import { Disaster } from '../App';

interface IncidentManagementProps {
  disasters: Disaster[];
  onRefresh: () => void;
}

const IncidentManagement: React.FC<IncidentManagementProps> = ({ disasters, onRefresh }) => {
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const deleteDisaster = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      try {
        await axios.delete(`http://localhost:5000/api/disasters/${id}`, {
          data: { user_id: 'reliefAdmin' }
        });
        if (selectedDisaster?.id === id) {
          setSelectedDisaster(null);
        }
        onRefresh(); // Let App.tsx handle state update via sockets or refresh
      } catch (error) {
        console.error('Error deleting disaster:', error);
        alert('Failed to delete incident.');
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'flex-start' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Report New Incident</h2></div>
          <DisasterForm />
        </div>
        {selectedDisaster && (
          <div className="card">
             <div className="card-header"><h2 className="card-title">Submit Field Report</h2></div>
            <ReportForm disasterId={selectedDisaster.id} />
          </div>
        )}
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Active Incident Feed</h2>
            <button onClick={onRefresh} className="btn btn-secondary">Refresh</button>
          </div>
          <DisasterList
            disasters={disasters}
            onSelectDisaster={setSelectedDisaster}
            selectedDisaster={selectedDisaster}
            onDeleteDisaster={deleteDisaster}
            onRefresh={onRefresh}
          />
        </div>
        
        {selectedDisaster && (
          <div className="card">
            <div className="card-header"><h2 className="card-title">Resource & Location Map</h2></div>
            <ResourceMap disaster={selectedDisaster} />
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentManagement;