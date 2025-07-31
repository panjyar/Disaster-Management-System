import React, { useState } from 'react';
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
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.post(`${API_URL}/api/disasters`, {
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== '')
      });
      
      setMessage('Disaster reported successfully!');
      setFormData({
        title: '',
        location_name: '',
        description: '',
        tags: [],
        owner_id: 'netrunnerX'
      });
    } catch (error) {
      console.error('Error creating disaster:', error);
      setMessage('Failed to report disaster. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({ ...prev, tags }));
  };

  return (
    <form onSubmit={handleSubmit} className="disaster-form">
      <div className="form-group">
        <label htmlFor="title">Disaster Title *</label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
          placeholder="e.g., NYC Flooding Emergency"
        />
      </div>

      <div className="form-group">
        <label htmlFor="location_name">Location</label>
        <input
          type="text"
          id="location_name"
          value={formData.location_name}
          onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
          placeholder="e.g., Manhattan, NYC (optional - will extract from description)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
          rows={4}
          placeholder="Describe the disaster situation, including location if not specified above..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags (comma-separated)</label>
        <input
          type="text"
          id="tags"
          value={formData.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="e.g., flood, urgent, evacuation"
        />
      </div>

      <div className="form-group">
        <label htmlFor="owner_id">Reporter ID</label>
        <select
          id="owner_id"
          value={formData.owner_id}
          onChange={(e) => setFormData(prev => ({ ...prev, owner_id: e.target.value }))}
        >
          <option value="netrunnerX">netrunnerX</option>
          <option value="reliefAdmin">reliefAdmin</option>
          <option value="citizen1">citizen1</option>
          <option value="volunteer">volunteer</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Reporting...' : 'Report Disaster'}
      </button>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </form>
  );
};

export default DisasterForm;