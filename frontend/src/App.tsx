import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { motion } from 'framer-motion';
import DisasterForm from './components/DisasterFrom';
import DisasterList from './components/DisasterList';
import ReportForm from './components/ReportForm';
import ResourceMap from './components/ResourceMap';
import AdminPanel from './components/AdminPanel';
import GeocodeTest from './components/GeocodeTest';
import VerificationTest from './components/VerificationTest';
import ResourceManager from './components/ResourceManager';
import { Icon } from './components/ui/Icon';
import { Button } from './components/ui/Button';
import './styles/tokens.css';
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

  const tabConfig = [
    { id: 'dashboard', label: 'Dashboard', icon: 'BarChart3' as const },
    { id: 'resources', label: 'Resources', icon: 'Package' as const },
    { id: 'geocode', label: 'Geocoding', icon: 'MapPin' as const },
    { id: 'verification', label: 'Verification', icon: 'Shield' as const },
    { id: 'admin', label: 'Admin', icon: 'Settings' as const },
  ];

  const renderTabContent = () => {
    const contentVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            key="dashboard"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
            className="main-content"
          >
            <div className="sidebar">
              <section className="form-section">
                <h2>
                  <Icon name="AlertTriangle" size="md" />
                  Report New Disaster
                </h2>
                <DisasterForm />
              </section>
              
              {selectedDisaster && (
                <motion.section 
                  className="form-section"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2>
                    <Icon name="FileText" size="md" />
                    Submit Report
                  </h2>
                  <ReportForm disasterId={selectedDisaster.id} />
                </motion.section>
              )}

              <section className="form-section">
                <h2>
                  <Icon name="Filter" size="md" />
                  Quick Filters
                </h2>
                <div className="filter-buttons">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchDisasters()}
                    icon="RotateCcw"
                  >
                    All Disasters
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => filterDisastersByTag('flood')}
                    icon="Waves"
                  >
                    Floods
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => filterDisastersByTag('earthquake')}
                    icon="Mountain"
                  >
                    Earthquakes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => filterDisastersByTag('fire')}
                    icon="Flame"
                  >
                    Fires
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => filterDisastersByTag('urgent')}
                    icon="Zap"
                  >
                    Urgent
                  </Button>
                </div>
              </section>

              <section className="form-section">
                <h2>
                  <Icon name="Activity" size="md" />
                  System Status
                </h2>
                <div className={`health-status ${systemHealth?.status?.toLowerCase()}`}>
                  <span className="status-indicator">
                    <Icon 
                      name={systemHealth?.status === 'OK' ? 'CheckCircle' : 'XCircle'} 
                      size="sm" 
                    />
                  </span>
                  {systemHealth?.status || 'CHECKING...'}
                </div>
                <div className="stats">
                  <div>
                    <Icon name="AlertCircle" size="xs" className="inline mr-2" />
                    Active Disasters: {disasters.length}
                  </div>
                  <div>
                    <Icon name="Package" size="xs" className="inline mr-2" />
                    Total Resources: {allResources.length}
                  </div>
                  <div>
                    <Icon name="Clock" size="xs" className="inline mr-2" />
                    Last Updated: {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'N/A'}
                  </div>
                </div>
              </section>
            </div>
            
            <div className="content">
              <section className="disasters-section">
                <div className="section-header">
                  <h2>
                    <Icon name="AlertTriangle" size="md" />
                    Active Disasters
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchDisasters}
                    icon="RefreshCw"
                    loading={loading}
                  >
                    Refresh
                  </Button>
                </div>
                {loading ? (
                  <div className="loading">
                    <Icon name="Loader2" size="md" className="animate-spin" />
                    Loading disasters...
                  </div>
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
                <motion.section 
                  className="map-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2>
                    <Icon name="Map" size="md" />
                    Resources & Location
                  </h2>
                  <ResourceMap disaster={selectedDisaster} />
                </motion.section>
              )}
            </div>
          </motion.div>
        );

      case 'resources':
        return (
          <motion.div
            key="resources"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <ResourceManager allResources={allResources} disasters={disasters} />
          </motion.div>
        );

      case 'geocode':
        return (
          <motion.div
            key="geocode"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <GeocodeTest />
          </motion.div>
        );

      case 'verification':
        return (
          <motion.div
            key="verification"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <VerificationTest />
          </motion.div>
        );

      case 'admin':
        return (
          <motion.div
            key="admin"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3 }}
          >
            <AdminPanel disasters={disasters} onRefresh={fetchDisasters} />
          </motion.div>
        );

      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Icon name="Shield" size="lg" className="inline mr-3" />
          Disaster Response Coordination Platform
        </motion.h1>
        
        <nav className="tab-navigation">
          {tabConfig.map((tab, index) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                size="sm"
                icon={tab.icon}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'active' : ''}
              >
                {tab.label}
              </Button>
            </motion.div>
          ))}
        </nav>
      </header>
      
      <main>
        {renderTabContent()}
      </main>
    </div>
  );
}

export default App;