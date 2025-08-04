import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import DisasterForm from './components/DisasterFrom';
import DisasterList from './components/DisasterList';
import ReportForm from './components/ReportForm';
import ResourceMap from './components/ResourceMap';
import AdminPanel from './components/AdminPanel';
import GeocodeTest from './components/GeocodeTest';
import VerificationTest from './components/VerificationTest';
import ResourceManager from './components/ResourceManager';
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

interface Resource {
  id: string;
  disaster_id: string;
  name: string;
  location_name: string;
  type: string;
  created_at: string;
}

function App() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    fetchDisasters();
    fetchAllResources();
    checkSystemHealth();

    // Socket event listeners
    socket.on('disaster_created', (disaster: Disaster) => {
      setDisasters(prev => [disaster, ...prev]);
    });

    socket.on('disaster_updated', (disaster: Disaster) => {
      setDisasters(prev => prev.map(d => d.id === disaster.id ? disaster : d));
    });

    socket.on('disaster_deleted', ({ id }: { id: string }) => {
      setDisasters(prev => prev.filter(d => d.id !== id));
      if (selectedDisaster?.id === id) {
        setSelectedDisaster(null);
      }
    });

    socket.on('resources_updated', () => {
      fetchAllResources();
    });

    return () => {
      socket.off('disaster_created');
      socket.off('disaster_updated');
      socket.off('disaster_deleted');
      socket.off('resources_updated');
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

  const fetchAllResources = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/resources`);
      setAllResources(response.data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setSystemHealth(response.data);
    } catch (error) {
      console.error('System health check failed:', error);
      setSystemHealth({ status: 'ERROR', error: 'API not responding' });
    }
  };

  const filterDisastersByTag = async (tag: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/disasters?tag=${tag}`);
      setDisasters(response.data);
    } catch (error) {
      console.error('Error filtering disasters:', error);
    }
  };

  const deleteDisaster = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this disaster?')) {
      try {
        await axios.delete(`${API_URL}/api/disasters/${id}`, {
          data: { user_id: 'reliefAdmin' }
        });
      } catch (error) {
        console.error('Error deleting disaster:', error);
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="sidebar">
              <section className="form-section">
                <h2>🚨 Report New Disaster</h2>
                <DisasterForm />
              </section>
              
              {selectedDisaster && (
                <section className="form-section">
                  <h2>📝 Submit Report</h2>
                  <ReportForm disasterId={selectedDisaster.id} />
                </section>
              )}

              <section className="form-section">
                <h2>🔍 Quick Filters</h2>
                <div className="filter-buttons">
                  <button onClick={() => fetchDisasters()}>All Disasters</button>
                  <button onClick={() => filterDisastersByTag('flood')}>🌊 Floods</button>
                  <button onClick={() => filterDisastersByTag('earthquake')}>🏗️ Earthquakes</button>
                  <button onClick={() => filterDisastersByTag('fire')}>🔥 Fires</button>
                  <button onClick={() => filterDisastersByTag('urgent')}>⚡ Urgent</button>
                </div>
              </section>

              <section className="form-section">
                <h2>📊 System Status</h2>
                <div className={`health-status ${systemHealth?.status?.toLowerCase()}`}>
                  <span className="status-indicator">●</span>
                  {systemHealth?.status || 'CHECKING...'}
                </div>
                <div className="stats">
                  <div>Active Disasters: {disasters.length}</div>
                  <div>Total Resources: {allResources.length}</div>
                  <div>Last Updated: {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'N/A'}</div>
                </div>
              </section>
            </div>
            
            <div className="content">
              <section className="disasters-section">
                <div className="section-header">
                  <h2>🚨 Active Disasters</h2>
                  <button onClick={fetchDisasters} className="refresh-btn">
                    🔄 Refresh
                  </button>
                </div>
                {loading ? (
                  <div className="loading">Loading disasters...</div>
                ) : (
                  <DisasterList 
                    disasters={disasters} 
                    onSelectDisaster={setSelectedDisaster}
                    selectedDisaster={selectedDisaster}
                    onDeleteDisaster={deleteDisaster}
                  />
                )}
              </section>
              
              {selectedDisaster && (
                <section className="map-section">
                  <h2>🗺️ Resources & Location</h2>
                  <ResourceMap disaster={selectedDisaster} />
                </section>
              )}
            </div>
          </>
        );

      case 'resources':
        return <ResourceManager allResources={allResources} disasters={disasters} />;

      case 'geocode':
        return <GeocodeTest />;

      case 'verification':
        return <VerificationTest />;

      case 'admin':
        return <AdminPanel disasters={disasters} onRefresh={fetchDisasters} />;

      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚨 Disaster Response Coordination Platform</h1>
        <nav className="tab-navigation">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={activeTab === 'resources' ? 'active' : ''}
            onClick={() => setActiveTab('resources')}
          >
            🛠️ Resources
          </button>
          <button 
            className={activeTab === 'geocode' ? 'active' : ''}
            onClick={() => setActiveTab('geocode')}
          >
            🌍 Geocoding
          </button>
          <button 
            className={activeTab === 'verification' ? 'active' : ''}
            onClick={() => setActiveTab('verification')}
          >
            🔍 Verification
          </button>
          <button 
            className={activeTab === 'admin' ? 'active' : ''}
            onClick={() => setActiveTab('admin')}
          >
            ⚙️ Admin
          </button>
        </nav>
      </header>
      
      <main className="main-content">
        {renderTabContent()}
      </main>
    </div>
  );
}

export default App;