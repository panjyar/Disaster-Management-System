import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import DisasterForm from './components/DisasterFrom';
import DisasterList from './components/DisasterList';
import ReportForm from './components/ReportForm';
import ResourceMap from './components/ResourceMap';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
}

function App() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDisasters();

    // Socket event listeners
    socket.on('disaster_created', (disaster: Disaster) => {
      setDisasters(prev => [disaster, ...prev]);
    });

    socket.on('disaster_updated', (disaster: Disaster) => {
      setDisasters(prev => prev.map(d => d.id === disaster.id ? disaster : d));
    });

    socket.on('disaster_deleted', ({ id }: { id: string }) => {
      setDisasters(prev => prev.filter(d => d.id !== id));
    });

    return () => {
      socket.off('disaster_created');
      socket.off('disaster_updated');
      socket.off('disaster_deleted');
    };
  }, []);

  const fetchDisasters = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/disasters`);
      setDisasters(response.data);
    } catch (error) {
      console.error('Error fetching disasters:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚨 Disaster Response Coordination Platform</h1>
      </header>
      
      <main className="main-content">
        <div className="sidebar">
          <section className="form-section">
            <h2>Report New Disaster</h2>
            <DisasterForm />
          </section>
          
          {selectedDisaster && (
            <section className="form-section">
              <h2>Submit Report</h2>
              <ReportForm disasterId={selectedDisaster.id} />
            </section>
          )}
        </div>
        
        <div className="content">
          <section className="disasters-section">
            <h2>Active Disasters</h2>
            {loading ? (
              <div className="loading">Loading disasters...</div>
            ) : (
              <DisasterList 
                disasters={disasters} 
                onSelectDisaster={setSelectedDisaster}
                selectedDisaster={selectedDisaster}
              />
            )}
          </section>
          
          {selectedDisaster && (
            <section className="map-section">
              <h2>Resources & Location</h2>
              <ResourceMap disaster={selectedDisaster} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;