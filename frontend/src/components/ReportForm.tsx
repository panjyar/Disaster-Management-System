import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Image, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface ReportFormProps {
  disasterId: string;
}

interface VerificationResult {
  status: string;
  score: number;
  explanation: string;
}

const ReportForm: React.FC<ReportFormProps> = ({ disasterId }) => {
  const [formData, setFormData] = useState({
    content: '',
    image_url: '',
    user_id: 'citizen1'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setVerification(null);

    try {
      // Submit report
      await axios.post(`${API_URL}/api/disasters/${disasterId}/reports`, formData);
      
      // Verify image if provided
      if (formData.image_url) {
        try {
          const verifyResponse = await axios.post(`${API_URL}/api/verification/verify-image`, {
            image_url: formData.image_url,
            context: formData.content
          });
          setVerification(verifyResponse.data);
        } catch (verifyError) {
          console.error('Verification error:', verifyError);
        }
      }
      
      setMessage({ type: 'success', text: 'Report submitted successfully!' });
      setFormData({ content: '', image_url: '', user_id: 'citizen1' });
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: 'Failed to submit report. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-50 text-green-800 border-green-200';
      case 'suspicious': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Report Content *</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            required
            rows={4}
            placeholder="Describe what you're seeing..."
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Image URL (optional)</label>
          <input
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            className="form-input"
          />
        </div>

        <motion.button type="submit" disabled={loading} className="btn btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          {loading ? <div className="loading-spinner" /> : <Send size={16} />}
          {loading ? 'Submitting...' : 'Submit Report'}
        </motion.button>
      </form>

      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{marginTop: '1rem'}}>
          {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          <span>{message.text}</span>
        </div>
      )}

      {verification && (
        <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{marginTop: '1rem', padding: '1rem'}}>
          <h4 style={{margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Shield size={18}/> Image Verification</h4>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
            <span style={{fontWeight: 600}}>Status: {verification.status}</span>
            <span style={{fontWeight: 600}}>Score: {verification.score}/100</span>
          </div>
          <p style={{fontSize: '0.9rem', color: 'var(--neutral-medium)', margin: 0}}>{verification.explanation}</p>
        </motion.div>
      )}

      <style>{`
        .alert { padding: 0.8rem 1rem; border-radius: var(--border-radius-sm); display: flex; align-items: center; gap: 0.5rem; }
        .alert-success { background-color: #e3fcef; color: #006644; border: 1px solid #abf5d1; }
        .alert-error { background-color: #ffebe6; color: #bf2600; border: 1px solid #ffbdad; }
      `}</style>
    </div>
  );
};

export default ReportForm;