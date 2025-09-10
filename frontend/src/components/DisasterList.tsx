import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Tag,
  User,
  Clock,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RefreshCcw,
  Folder,
  CheckCircle,
  XCircle,
} from "lucide-react";

const API_URL = "http://localhost:5000";

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
  const [socialReports, setSocialReports] = useState<
    Record<string, SocialMediaReport[]>
  >({});
  const [loadingSocial, setLoadingSocial] = useState<Record<string, boolean>>(
    {}
  );
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
      const response = await axios.get(
        `${API_URL}/api/social-media/${disasterId}`
      );
      setSocialReports((prev) => ({ ...prev, [disasterId]: response.data }));
    } catch (error) {
      console.error("Error fetching social reports:", error);
      setSocialReports((prev) => ({ ...prev, [disasterId]: [] })); // Set empty array on error
    } finally {
      setLoadingSocial((prev) => ({ ...prev, [disasterId]: false }));
    }
  };

  const updateDisaster = async () => {
    if (!editingDisaster) return;
    try {
      await axios.put(`${API_URL}/api/disasters/${editingDisaster}`, {
        ...editForm,
        user_id: "reliefAdmin",
      });
      setEditingDisaster(null);
      setEditForm({});
      onRefresh();
    } catch (error) {
      console.error("Error updating disaster:", error);
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
              onClick={() => onSelectDisaster(disaster)}
              className="card"
              style={{
                cursor: "pointer",
                borderWidth: "2px",
                // Change this line
                borderColor:
                  selectedDisaster?.id === disaster.id
                    ? "var(--primary-blue)"
                    : "rgba(0, 82, 204, 0)", // Use transparent version of primary blue
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
              }} // Animate to a semi-transparent border
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
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <MapPin size={14} />{" "}
                  {disaster.location_name || "Location TBD"}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <Clock size={14} />{" "}
                  {new Date(disaster.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {disaster.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      <style>{`
        .btn-icon-danger { background: none; border: none; padding: 0.4rem; border-radius: 50%; cursor: pointer; color: var(--neutral-medium); transition: var(--transition-fast); }
        .btn-icon-danger:hover { background-color: #ffebe6; color: var(--alert-red); }
        .tag { background-color: var(--neutral-lightest); color: var(--neutral-dark); padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 500; }
        .tag:first-letter { text-transform: uppercase; }
      `}</style>
    </div>
  );
};

export default DisasterList;
