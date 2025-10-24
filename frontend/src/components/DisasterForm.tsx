import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Send, CheckCircle, AlertCircle, Tag } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface DisasterFormData {
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  owner_id: string;
}

const DisasterForm: React.FC = () => {
  const [formData, setFormData] = useState<DisasterFormData>({
    title: '',
    location_name: '',
    description: '',
    tags: [],
    owner_id: 'netrunnerX'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${API_URL}/api/disasters`, {
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== '')
      });
      
      setMessage({ type: 'success', text: 'Disaster reported successfully!' });
      setFormData({
        title: '', location_name: '', description: '', tags: [], owner_id: 'netrunnerX'
      });
    } catch (error) {
      console.error('Error creating disaster:', error);
      setMessage({ type: 'error', text: 'Failed to report disaster. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({ ...prev, tags }));
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        📢 Report New Disaster
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label htmlFor="title" className="form-label">Title *</label>
        <input id="title" type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required placeholder="e.g., Downtown Power Outage" className="form-input" />
      </div>

      <div className="form-group">
        <label htmlFor="location" className="form-label">Location</label>
        <div style={{ position: 'relative' }}>
          <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', color: '#9ca3af' }} />
          <input id="location" type="text" value={formData.location_name} onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))} placeholder="e.g., Manhattan, NYC" className="form-input" style={{ paddingLeft: '2.5rem' }} />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="tags" className="form-label">Tags</label>
        <div style={{ position: 'relative' }}>
          <Tag style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', color: '#9ca3af' }} />
          <input id="tags" type="text" value={formData.tags.join(', ')} onChange={handleTagsChange} placeholder="urgent, power, infrastructure" className="form-input" style={{ paddingLeft: '2.5rem' }} />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">Description *</label>
        <textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} required rows={3} placeholder="Describe the situation..." className="form-input" />
      </div>

      <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-accent" style={{marginTop: '0.5rem'}}>
        {loading ? <div className="loading-spinner"></div> : <Send width={16} />}
        {loading ? 'Submitting...' : 'Report Incident'}
      </motion.button>

        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
          >
            {message.type === 'success' ? <CheckCircle width={18} /> : <AlertCircle width={18} />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </form>
    </div>
  );
};

export default DisasterForm;