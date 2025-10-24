import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
  disasters,
  onSelectDisaster,
  selectedDisaster,
  onDeleteDisaster,
  onRefresh,
}) => {
  const [socialReports, setSocialReports] = useState<Record<string, SocialMediaReport[]>>({});
  const [loadingSocial, setLoadingSocial] = useState<Record<string, boolean>>({});
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
    if (!socialReports[disasterId] && !loadingSocial[disasterId]) {
      fetchSocialReports(disasterId);
    }
  };

  const fetchSocialReports = async (disasterId: string) => {
    setLoadingSocial((prev) => ({ ...prev, [disasterId]: true }));
    try {
      const response = await axios.get(`${API_URL}/api/social-media/${disasterId}`);
      const reportsData = Array.isArray(response.data) ? response.data : [];
      setSocialReports((prev) => ({ ...prev, [disasterId]: reportsData }));
    } catch (error) {
      console.error("Error fetching social reports:", error);
      setSocialReports((prev) => ({ ...prev, [disasterId]: [] }));
    } finally {
      setLoadingSocial((prev) => ({ ...prev, [disasterId]: false }));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#de350b';
      case 'high': return '#ff7a00';
      case 'medium': return '#ffab00';
      default: return '#6b778c';
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {disasters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3 className="empty-state-title">No Incidents Reported</h3>
          <p className="empty-state-description">
            Use the form to report a new incident.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {disasters.map((disaster) => (
            <motion.div
              key={disaster.id}
              className="card"
              style={{
                cursor: "pointer",
                borderWidth: "2px",
                borderColor: selectedDisaster?.id === disaster.id
                  ? "var(--primary-blue)"
                  : "transparent",
                padding: "1.25rem",
                position: "relative",
              }}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              whileHover={{
                borderColor: "rgba(0, 82, 204, 0.5)",
                transform: "translateY(-3px)",
              }}
              onClick={() => onSelectDisaster(disaster)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.75rem",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "var(--neutral-darkest)",
                  }}
                >
                  {disaster.title}
                </h3>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReports(disaster.id);
                    }}
                    className="btn-icon"
                    title="Social Reports"
                  >
                    {expandedReports.includes(disaster.id) ? (
                      <ChevronUp size={16} />
                    ) : (
                      <MessageSquare size={16} />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDisaster(disaster.id);
                    }}
                    className="btn-icon-danger"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  color: "var(--neutral-medium)",
                  fontSize: "0.8rem",
                  marginBottom: "1rem",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <MapPin size={14} /> {disaster.location_name || "Location TBD"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Clock size={14} /> {new Date(disaster.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {disaster.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Social Reports Expansion */}
              {expandedReports.includes(disaster.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border-color)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                    Social Intelligence
                  </h4>
                  {loadingSocial[disaster.id] ? (
                    <div style={{ textAlign: "center", padding: "1rem" }}>
                      <div className="loading-spinner" style={{ margin: "0 auto" }} />
                    </div>
                  ) : socialReports[disaster.id]?.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {socialReports[disaster.id].slice(0, 3).map((report) => (
                        <div
                          key={report.id}
                          style={{
                            backgroundColor: "var(--neutral-lightest)",
                            padding: "0.75rem",
                            borderRadius: "var(--border-radius-sm)",
                            fontSize: "0.85rem",
                            borderLeft: `3px solid ${getPriorityColor(report.priority)}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                            <strong>@{report.user}</strong>
                            {report.verified && <CheckCircle size={14} color="var(--success-green)" />}
                          </div>
                          <p style={{ margin: "0.25rem 0", color: "var(--neutral-dark)" }}>
                            {report.content}
                          </p>
                          <span style={{ fontSize: "0.75rem", color: "var(--neutral-medium)" }}>
                            {new Date(report.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.85rem", color: "var(--neutral-medium)", fontStyle: "italic" }}>
                      No social media reports available
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      
      <style>{`
        .btn-icon {
          background: none;
          border: none;
          padding: 0.4rem;
          border-radius: 50%;
          cursor: pointer;
          color: var(--neutral-medium);
          transition: var(--transition-fast);
        }
        .btn-icon:hover {
          background-color: var(--neutral-lightest);
          color: var(--primary-blue);
        }
        .btn-icon-danger {
          background: none;
          border: none;
          padding: 0.4rem;
          border-radius: 50%;
          cursor: pointer;
          color: var(--neutral-medium);
          transition: var(--transition-fast);
        }
        .btn-icon-danger:hover {
          background-color: #ffebe6;
          color: var(--alert-red);
        }
        .tag {
          background-color: var(--neutral-lightest);
          color: var(--neutral-dark);
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default DisasterList;
