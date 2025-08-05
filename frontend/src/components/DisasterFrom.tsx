import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

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
        title: '',
        location_name: '',
        description: '',
        tags: [],
        owner_id: 'netrunnerX'
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

  const presetTags = [
    { label: 'Flood', value: 'flood', icon: 'Waves' as const },
    { label: 'Earthquake', value: 'earthquake', icon: 'Mountain' as const },
    { label: 'Fire', value: 'fire', icon: 'Flame' as const },
    { label: 'Medical', value: 'medical', icon: 'Heart' as const },
    { label: 'Shelter', value: 'shelter', icon: 'Home' as const },
    { label: 'Urgent', value: 'urgent', icon: 'Zap' as const },
  ];

  const addPresetTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <Icon 
            name={message.type === 'success' ? 'CheckCircle' : 'AlertCircle'} 
            size="sm" 
          />
          {message.text}
        </motion.div>
      )}

      <div className="form-group">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          <Icon name="FileText" size="xs" className="inline mr-1" />
          Disaster Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Brief description of the disaster"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="form-group">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          <Icon name="MapPin" size="xs" className="inline mr-1" />
          Location *
        </label>
        <input
          type="text"
          id="location"
          value={formData.location_name}
          onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
          placeholder="City, region, or specific address"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          <Icon name="AlignLeft" size="xs" className="inline mr-1" />
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detailed description of the situation, affected areas, and immediate needs"
          required
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
        />
      </div>

      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Icon name="Tag" size="xs" className="inline mr-1" />
          Categories
        </label>
        
        <div className="mb-3">
          <div className="grid grid-cols-2 gap-2">
            {presetTags.map((tag) => (
              <Button
                key={tag.value}
                type="button"
                variant={formData.tags.includes(tag.value) ? 'primary' : 'ghost'}
                size="sm"
                icon={tag.icon}
                onClick={() => addPresetTag(tag.value)}
                className="justify-start"
              >
                {tag.label}
              </Button>
            ))}
          </div>
        </div>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                >
                  <Icon name="X" size="xs" />
                </button>
              </motion.span>
            ))}
          </div>
        )}

        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={handleTagsChange}
          placeholder="Or type custom tags separated by commas"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use tags like: flood, urgent, evacuation, medical, shelter
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-2">
          <Icon name="User" size="xs" className="inline mr-1" />
          Reporter ID
        </label>
        <input
          type="text"
          id="owner"
          value={formData.owner_id}
          onChange={(e) => setFormData(prev => ({ ...prev, owner_id: e.target.value }))}
          placeholder="Your identifier"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon="Send"
          loading={loading}
          className="flex-1"
        >
          Report Disaster
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="lg"
          icon="RotateCcw"
          onClick={() => setFormData({
            title: '',
            location_name: '',
            description: '',
            tags: [],
            owner_id: 'netrunnerX'
          })}
        >
          Clear
        </Button>
      </div>
    </motion.form>
  );
};

export default DisasterForm;