// src/components/DashboardOverview.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Wrench, CheckCircle, Shield, Zap } from 'lucide-react';
import { Disaster, Resource } from '../App'; // Assuming types are exported from App.tsx

interface DashboardOverviewProps {
  disasters: Disaster[];
  allResources: Resource[];
  systemHealth: any;
  onRefresh: () => void;
}

const StatCard = ({ icon, title, value, color }: any) => (
  <motion.div 
    className="card"
    whileHover={{ transform: 'translateY(-5px)', boxShadow: 'var(--shadow-lg)'}}
    style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}
  >
    <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: `${color}20` }}>
      {React.createElement(icon, { color, size: 28 })}
    </div>
    <div>
      <h3 style={{ margin: 0, color: 'var(--neutral-medium)', fontSize: '1rem' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--neutral-darkest)' }}>
        {value}
      </p>
    </div>
  </motion.div>
);

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ disasters, allResources, systemHealth }) => {
  const urgentDisasters = disasters.filter(d => d.tags.includes('urgent')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Welcome, Coordinator</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--neutral-medium)', marginTop: '0.5rem' }}>
          Here's a real-time overview of the current operational status.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <StatCard icon={AlertTriangle} title="Active Incidents" value={disasters.length} color="var(--alert-red)" />
        <StatCard icon={Zap} title="Urgent Alerts" value={urgentDisasters} color="var(--accent-orange)" />
        <StatCard icon={Wrench} title="Total Resources" value={allResources.length} color="var(--primary-blue)" />
        <StatCard icon={Shield} title="System Status" value={systemHealth?.status || 'Unknown'} color="var(--success-green)" />
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        <motion.div 
          className="card" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <h2 className="card-title">Recent Incidents</h2>
          </div>
          {disasters.slice(0, 5).map(d => (
             <div key={d.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)'}}>
                <h4 style={{ margin: 0, fontWeight: 600 }}>{d.title}</h4>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>{d.location_name} - {new Date(d.created_at).toLocaleDateString()}</p>
             </div>
          ))}
          {disasters.length === 0 && <p>No active incidents.</p>}
        </motion.div>
        
        <motion.div 
          className="card"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <h2 className="card-title">System Health</h2>
          </div>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <CheckCircle size={20} color="var(--success-green)"/>
                <p><strong>API Status:</strong> {systemHealth?.status}</p>
            </div>
            <p style={{fontSize: '0.85rem', color: 'var(--neutral-medium)'}}>Last check: {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleString() : 'N/A'}</p>
          </div>
          <div style={{marginTop: '1rem'}}>
             <h4 style={{fontWeight: 600, margin: '0 0 0.5rem 0'}}>Resource Types</h4>
             <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                {Array.from(new Set(allResources.map(r => r.type))).map(type => (
                    <span key={type} style={{backgroundColor: 'var(--neutral-lightest)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem'}}>
                        {type}
                    </span>
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardOverview;