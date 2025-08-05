import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon, IconName } from './ui/Icon';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
}

const DisasterList: React.FC<DisasterListProps> = ({ 
  disasters, 
  onSelectDisaster, 
  selectedDisaster,
  onDeleteDisaster
}) => {
  const [socialReports, setSocialReports] = useState<Record<string, SocialMediaReport[]>>({});
  const [loadingSocial, setLoadingSocial] = useState<Record<string, boolean>>({});
  const [editingDisaster, setEditingDisaster] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Disaster>>({});

  const fetchSocialReports = async (disasterId: string) => {
    if (socialReports[disasterId] || loadingSocial[disasterId]) return;
    
    setLoadingSocial(prev => ({ ...prev, [disasterId]: true }));
    
    try {
      const response = await axios.get(`${API_URL}/api/social-media/${disasterId}`);
      setSocialReports(prev => ({ ...prev, [disasterId]: response.data }));
    } catch (error) {
      console.error('Error fetching social reports:', error);
    } finally {
      setLoadingSocial(prev => ({ ...prev, [disasterId]: false }));
    }
  };

  const updateDisaster = async (disaster: Disaster) => {
    try {
      await axios.put(`${API_URL}/api/disasters/${disaster.id}`, {
        ...editForm,
        user_id: 'reliefAdmin'
      });
      setEditingDisaster(null);
      setEditForm({});
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
      tags: disaster.tags
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTagConfig = (tag: string): { color: string; icon: IconName } => {
    switch (tag.toLowerCase()) {
      case 'flood': return { color: 'var(--color-flood)', icon: 'Waves' };
      case 'earthquake': return { color: 'var(--color-earthquake)', icon: 'Mountain' };
      case 'fire': return { color: 'var(--color-fire)', icon: 'Flame' };
      case 'urgent': return { color: 'var(--color-urgent)', icon: 'Zap' };
      case 'evacuation': return { color: 'var(--color-error)', icon: 'Users' };
      case 'medical': return { color: 'var(--color-success)', icon: 'Heart' };
      case 'shelter': return { color: 'var(--color-primary)', icon: 'Home' };
      default: return { color: 'var(--color-text-secondary)', icon: 'Tag' };
    }
  };

  const getPriorityConfig = (priority: string): { color: string; icon: IconName } => {
    switch (priority.toLowerCase()) {
      case 'critical': return { color: 'var(--color-error)', icon: 'AlertTriangle' };
      case 'high': return { color: 'var(--color-warning)', icon: 'AlertCircle' };
      case 'medium': return { color: 'var(--color-primary)', icon: 'Info' };
      default: return { color: 'var(--color-text-secondary)', icon: 'Circle' };
    }
  };

  if (disasters.length === 0) {
    return (
      <motion.div 
        className="empty-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Icon name="CloudDrizzle" size="xl" className="text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Disasters</h3>
        <p className="text-gray-500">When disasters are reported, they will appear here.</p>
      </motion.div>
    );
  }

  return (
    <div className="disaster-list space-y-4">
      {disasters.map((disaster, index) => (
        <motion.div
          key={disaster.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card
            variant="elevated"
            padding="lg"
            hover
            onClick={() => onSelectDisaster(disaster)}
            className={`cursor-pointer transition-all duration-200 ${
              selectedDisaster?.id === disaster.id 
                ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-500' 
                : 'hover:shadow-lg'
            }`}
          >
            {editingDisaster === disaster.id ? (
              <div className="edit-form space-y-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.location_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateDisaster(disaster)}
                    icon="Check"
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingDisaster(null)}
                    icon="X"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight">
                    {disaster.title}
                  </h3>
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(disaster);
                      }}
                      icon="Edit"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDisaster(disaster.id);
                      }}
                      icon="Trash2"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-gray-600">
                  <Icon name="MapPin" size="sm" />
                  <span className="text-sm">{disaster.location_name}</span>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                  {disaster.description}
                </p>

                {disaster.tags && disaster.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {disaster.tags.map((tag) => {
                      const { color, icon } = getTagConfig(tag);
                      return (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          <Icon name={icon} size="xs" />
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" size="xs" />
                    <span>{formatDate(disaster.created_at)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchSocialReports(disaster.id);
                      }}
                      icon={loadingSocial[disaster.id] ? "Loader2" : "MessageSquare"}
                      loading={loadingSocial[disaster.id]}
                    >
                      Reports
                    </Button>
                  </div>
                </div>

                {socialReports[disaster.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Icon name="MessageSquare" size="sm" />
                        Social Media Reports ({socialReports[disaster.id].length})
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchSocialReports(disaster.id);
                        }}
                        icon="RefreshCw"
                      />
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {socialReports[disaster.id].slice(0, 3).map((report) => {
                        const { color, icon } = getPriorityConfig(report.priority);
                        return (
                          <div
                            key={report.id}
                            className="bg-gray-50 rounded-lg p-3 text-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">@{report.user}</span>
                                {report.verified && (
                                  <Icon name="CheckCircle2" size="xs" className="text-green-600" />
                                )}
                              </div>
                              <div className="flex items-center gap-1" style={{ color }}>
                                <Icon name={icon} size="xs" />
                                <span className="text-xs">{report.priority}</span>
                              </div>
                            </div>
                            <p className="text-gray-700 line-clamp-2">{report.content}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Icon name="Clock" size="xs" />
                              {formatDate(report.timestamp)}
                            </div>
                          </div>
                        );
                      })}
                      
                      {socialReports[disaster.id].length > 3 && (
                        <div className="text-center">
                          <Button variant="ghost" size="sm">
                            View all {socialReports[disaster.id].length} reports
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default DisasterList;