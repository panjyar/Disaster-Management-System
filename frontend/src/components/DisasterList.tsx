import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Tag, User, Clock, Edit, Trash2, ChevronDown, ChevronUp, MessageSquare, RefreshCcw, Folder, CheckCircle, XCircle
} from 'lucide-react';

const API_URL = 'http://localhost:5000';

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  owner_id: string;
  created_at: string;
}

interface SocialMediaReport {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  priority: string;
  verified: boolean;
}

interface DisasterListProps {
  disasters: Disaster[];
  onSelectDisaster: (disaster: Disaster) => void;
  selectedDisaster: Disaster | null;
  onDeleteDisaster: (id: string) => void;
  onRefresh: () => void;
}

const DisasterList: React.FC<DisasterListProps> = ({
  disasters, onSelectDisaster, selectedDisaster, onDeleteDisaster, onRefresh
}) => {
  const [socialReports, setSocialReports] = useState<Record<string, SocialMediaReport[]>>({});
  const [loadingSocial, setLoadingSocial] = useState<Record<string, boolean>>({});
  const [editingDisaster, setEditingDisaster] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Disaster>>({});
  const [expandedReports, setExpandedReports] = useState<string[]>([]);

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };
  
  const toggleReports = (disasterId: string) => {
    setExpandedReports((prev) =>
      prev.includes(disasterId)
        ? prev.filter((id) => id !== disasterId)
        : [...prev, disasterId]
    );
    if (!socialReports[disasterId]) {
      fetchSocialReports(disasterId);
    }
  };

  const fetchSocialReports = async (disasterId: string) => {
    if (loadingSocial[disasterId]) return;
    setLoadingSocial((prev) => ({ ...prev, [disasterId]: true }));
    try {
      const response = await axios.get(`${API_URL}/api/social-media/${disasterId}`);
      setSocialReports((prev) => ({ ...prev, [disasterId]: response.data }));
    } catch (error) {
      console.error('Error fetching social reports:', error);
      setSocialReports((prev) => ({...prev, [disasterId]: [] })); // Set empty array on error
    } finally {
      setLoadingSocial((prev) => ({ ...prev, [disasterId]: false }));
    }
  };

  const updateDisaster = async () => {
    if (!editingDisaster) return;
    try {
      await axios.put(`${API_URL}/api/disasters/${editingDisaster}`, {
        ...editForm,
        user_id: 'reliefAdmin',
      });
      setEditingDisaster(null);
      setEditForm({});
      onRefresh();
    } catch (error) {
      console.error('Error updating disaster:', error);
    }
  };

  const startEdit = (disaster: Disaster) => {
    setEditingDisaster(disaster.id);
    setEditForm({
      title: disaster.title,
      location_name: disaster.location_name,
      description: disaster.description,
      tags: disaster.tags,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {disasters.length === 0 ? (
        <motion.div
          className="card"
          style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Folder style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#ced4da' }} />
          <h3 style={{ margin: 0, color: 'var(--text-color)' }}>No Disasters Reported</h3>
          <p>Use the form to report a new disaster.</p>
        </motion.div>
      ) : (
        <AnimatePresence>
          {disasters.map((disaster) => (
            <motion.div
              key={disaster.id}
              className="card"
              style={{
                cursor: 'pointer',
                borderWidth: '2px',
                borderColor: selectedDisaster?.id === disaster.id ? 'var(--primary-color)' : 'var(--border-color)',
                padding: '1.25rem'
              }}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
            >
              {editingDisaster === disaster.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'default' }}>
                  <input value={editForm.title || ''} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="form-input" />
                  <textarea value={editForm.description || ''} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="form-input" rows={3}/>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button onClick={updateDisaster} className="btn btn-primary" style={{flex: 1}}>
                       <CheckCircle width={16} /> Save Changes
                     </button>
                     <button onClick={() => setEditingDisaster(null)} className="btn btn-secondary" style={{flex: 1}}>
                       <XCircle width={16} /> Cancel
                     </button>
                   </div>
                </div>
              ) : (
              <>
                <div onClick={() => onSelectDisaster(disaster)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-color)' }}>{disaster.title}</h3>
                      <div style={{ display: 'flex', gap: '0.25rem', cursor: 'auto' }}>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(disaster); }} className="btn-icon" title="Edit"><Edit size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteDisaster(disaster.id); }} className="btn-icon btn-icon-danger" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {disaster.location_name || 'Location TBD'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} /> {new Date(disaster.created_at).toLocaleString()}</span>
                    </div>

                    <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)' }}>{disaster.description}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {disaster.tags.map((tag) => (<span key={tag} className="tag">{tag}</span>))}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <User size={16} /> {disaster.owner_id}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); toggleReports(disaster.id); }} className="btn btn-secondary">
                      <MessageSquare size={16} /> Reports {expandedReports.includes(disaster.id) ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedReports.includes(disaster.id) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        style={{ overflow: 'hidden', cursor: 'default' }}
                    >
                      {loadingSocial[disaster.id] ? <p>Loading reports...</p> : 
                       socialReports[disaster.id]?.length > 0 ? (
                        socialReports[disaster.id].map(report => <div key={report.id}>{report.content}</div>)
                       ) : <p>No social media reports found.</p>
                      }
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      <style>{`
        .btn-icon { background: none; border: none; padding: 0.5rem; border-radius: 50%; cursor: pointer; color: var(--text-muted); line-height: 0; transition: all 0.2s; }
        .btn-icon:hover { background-color: #f1f3f5; color: var(--primary-color); }
        .btn-icon.btn-icon-danger:hover { background-color: #f8d7da; color: var(--error-color); }
        .tag { background-color: #e9ecef; color: var(--secondary-color); padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 500; }
      `}</style>
    </div>
  );
};

export default DisasterList;