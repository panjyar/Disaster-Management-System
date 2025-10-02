import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';

// Import Components
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview'; 
import IncidentManagement from './components/IncidentManagement';
import ResourceManager from './components/ResourceManager';
import GeocodeTest from './components/GeocodeTest';
import VerificationTest from './components/VerificationTest';
import AdminPanel from './components/AdminPanel';

import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

// Interfaces
export interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
}
export interface Resource {
  id: string;
  disaster_id: string;
  name: string;
  location_name: string;
  type: string;
  created_at: string;
}

function App() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [activeView, setActiveView] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [disastersRes, resourcesRes, healthRes] = await Promise.all([
        axios.get(`${API_URL}/api/disasters`),
        axios.get(`${API_URL}/api/resources`),
        axios.get(`${API_URL}/health`)
      ]);
      
      // FIX: Extract disasters array from nested response object
      const disastersData = disastersRes.data.disasters || disastersRes.data || [];
      setDisasters(Array.isArray(disastersData) ? disastersData : []);
      
      // FIX: Handle resources response structure
      const resourcesData = resourcesRes.data.resources || resourcesRes.data || [];
      setAllResources(Array.isArray(resourcesData) ? resourcesData : []);
      
      setSystemHealth(healthRes.data);

    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setDisasters([]);
      setAllResources([]);
      setSystemHealth({ status: 'ERROR', error: 'API not responding' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('disaster_created', (newDisaster: Disaster) => {
      setDisasters(prev => [newDisaster, ...prev]);
    });
    socket.on('disaster_updated', (updatedDisaster: Disaster) => {
      setDisasters(prev => prev.map(d => d.id === updatedDisaster.id ? updatedDisaster : d));
    });
    socket.on('disaster_deleted', ({ id }: { id: string }) => {
      setDisasters(prev => prev.filter(d => d.id !== id));
    });
    socket.on('resources_updated', async () => {
      try {
        const res = await axios.get(`${API_URL}/api/resources`);
        const resourcesData = res.data.resources || res.data || [];
        setAllResources(Array.isArray(resourcesData) ? resourcesData : []);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disaster_created');
      socket.off('disaster_updated');
      socket.off('disaster_deleted');
      socket.off('resources_updated');
    };
  }, [fetchData]);

  const renderActiveView = () => {
    const viewProps = { disasters, allResources, onRefresh: fetchData };
    switch (activeView) {
      case 'overview':
        return <DashboardOverview {...viewProps} systemHealth={systemHealth} />;
      case 'incidents':
        return <IncidentManagement {...viewProps} />;
      case 'resources':
        return <ResourceManager allResources={allResources} disasters={disasters} />;
      case 'geocode':
        return <GeocodeTest />;
      case 'verification':
        return <VerificationTest />;
      case 'admin':
        return <AdminPanel disasters={disasters} onRefresh={fetchData} />;
      default:
        return <DashboardOverview {...viewProps} systemHealth={systemHealth} />;
    }
  };

  if (isLoading) {
    return (
      <div className="App" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading ResponseGrid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;