import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Box, Package, Rss, BarChart2 } from "lucide-react";
import { Resource, Disaster } from "../App"; // Assuming types are in App.tsx

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

interface ResourceManagerProps {
  allResources: Resource[];
  disasters: Disaster[];
}

const ResourceManager: React.FC<ResourceManagerProps> = ({
  allResources,
  disasters,
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [socialMediaReports, setSocialMediaReports] = useState<any[]>([]);

  useEffect(() => {
    setResources(allResources);
  }, [allResources]);
  const fetchGeneralSocialMedia = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/social-media`);
      setSocialMediaReports(response.data.sample_recent_reports || []);
    } catch (error) {
      console.error("Error fetching social media:", error);
    }
  };

  const fetchResourcesForDisaster = async (disasterId: string) => {
    if (!disasterId) {
      setResources(allResources);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/resources/${disasterId}`
      );
      setResources(response.data);
    } catch (error) {
      console.error("Error fetching disaster resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialMediaForDisaster = async (disasterId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/social-media/${disasterId}`
      );
      setSocialMediaReports(response.data);
    } catch (error) {
      console.error("Error fetching social media for disaster:", error);
    }
  };

 const handleDisasterChange = (disasterId: string) => {
    setSelectedDisaster(disasterId);
    fetchResourcesForDisaster(disasterId);
  };

const getFilteredResources = () => {
    if (filterType === 'all') return resources;
    return resources.filter(resource => resource.type === filterType);
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "shelter":
        return "🏠";
      case "hospital":
        return "🏥";
      case "food":
        return "🍽️";
      case "water":
        return "💧";
      case "supplies":
        return "📦";
      case "transport":
        return "🚐";
      case "communication":
        return "📡";
      default:
        return "📍";
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case "shelter":
        return "#4CAF50";
      case "hospital":
        return "#F44336";
      case "food":
        return "#FF9800";
      case "water":
        return "#2196F3";
      case "supplies":
        return "#9C27B0";
      case "transport":
        return "#607D8B";
      case "communication":
        return "#795548";
      default:
        return "#999";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDisasterName = (disasterId: string) => {
    const disaster = disasters.find((d) => d.id === disasterId);
    return disaster ? disaster.title : "Unknown Disaster";
  };

  const resourceTypes = Array.from(new Set(resources.map((r) => r.type)));
  const filteredResources = getFilteredResources();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Resource Hub</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--neutral-medium)', marginTop: '0.5rem' }}>
          Monitor and manage all available resources for active incidents.
        </p>
      </motion.div>

      {/* Control Bar */}
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Filter by Incident</label>
            <select
              value={selectedDisaster}
              onChange={(e) => handleDisasterChange(e.target.value)}
              className="form-select"
            >
              <option value="">All Incidents</option>
              {disasters.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select"
            >
              <option value="all">All Types</option>
              {resourceTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Resources Panel */}
        <div className="card">
          <div className="card-header"><h2 className="card-title"><Package /> Resources ({filteredResources.length})</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {filteredResources.map(resource => (
              <motion.div key={resource.id} className="card" style={{ padding: '1rem' }} whileHover={{ transform: 'scale(1.03)' }}>
                <h4 style={{ margin: 0, fontWeight: 600 }}>{resource.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--neutral-medium)', margin: '0.25rem 0' }}>{resource.location_name}</p>
                <span className="tag">{resource.type}</span>
              </motion.div>
            ))}
          </div>
          {filteredResources.length === 0 && <div className="empty-state" style={{padding: '2rem'}}><p>No resources match filters.</p></div>}
        </div>
        
        {/* Social Media Panel */}
        <div className="card">
          <div className="card-header"><h2 className="card-title"><Rss /> Social Intelligence</h2></div>
            {socialMediaReports.slice(0, 4).map((report, index) => (
              <div key={index} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)'}}>
                 <p style={{ margin: 0, fontSize: '0.9rem' }}>{report.content || report.text}</p>
                 <small style={{ color: 'var(--neutral-medium)' }}>{report.platform} - {report.location || 'Unknown location'}</small>
              </div>
            ))}
            {socialMediaReports.length === 0 && <p>No social media reports available.</p>}
        </div>
      </div>
      <style>{`.tag { background-color: var(--neutral-lightest); color: var(--neutral-dark); padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 500; }`}</style>
    </div>
  );
};

export default ResourceManager;
function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}

