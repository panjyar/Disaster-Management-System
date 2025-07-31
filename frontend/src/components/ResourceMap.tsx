import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface Resource {
  id: string;
  name: string;
  location_name: string;
  type: string;
  created_at: string;
}

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
}

interface ResourceMapProps {
  disaster: Disaster;
}

const ResourceMap: React.FC<ResourceMapProps> = ({ disaster }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<any>(null);

  useEffect(() => {
    fetchResources();
    geocodeLocation();
  }, [disaster.id]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/resources/${disaster.id}`);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeLocation = async () => {
    if (!disaster.location_name) return;
    
    try {
      const response = await axios.post(`${API_URL}/api/geocode`, {
        location_name: disaster.location_name
      });
      setCoordinates(response.data.coordinates);
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'shelter': return '🏠';
      case 'hospital': return '🏥';
      case 'food': return '🍽️';
      case 'water': return '💧';
      case 'supplies': return '📦';
      default: return '📍';
    }
  };

  return (
    <div className="resource-map">
      <div className="location-info">
        <h3>📍 {disaster.location_name || 'Location Unknown'}</h3>
        {coordinates && (
          <div className="coordinates">
            Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}
          </div>
        )}
        <div className="formatted-address">
          {coordinates?.formatted_address}
        </div>
      </div>

      <div className="resources-section">
        <h4>🛠️ Available Resources</h4>
        {loading ? (
          <div className="loading">Loading resources...</div>
        ) : resources.length > 0 ? (
          <div className="resources-list">
            {resources.map(resource => (
              <div key={resource.id} className="resource-item">
                <div className="resource-header">
                  <span className="resource-icon">
                    {getResourceIcon(resource.type)}
                  </span>
                  <span className="resource-name">{resource.name}</span>
                  <span className="resource-type">{resource.type}</span>
                </div>
                <div className="resource-location">
                  📍 {resource.location_name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-resources">
            No resources mapped yet. Resources will appear here as they are reported.
          </div>
        )}
      </div>

      {/* Simple map placeholder - in real implementation, integrate with Leaflet */}
      <div className="map-placeholder">
        <div className="map-content">
          🗺️ Interactive Map
          <br />
          <small>
            {coordinates 
              ? `Showing ${disaster.location_name}` 
              : 'Location data not available'
            }
          </small>
        </div>
      </div>
    </div>
  );
};

export default ResourceMap;