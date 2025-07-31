import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface ReportFormProps {
  disasterId: string;
}

const ReportForm: React.FC<ReportFormProps> = ({ disasterId }) => {
  const [formData, setFormData] = useState({
    content: '',
    image_url: '',
    user_id: 'citizen1'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [verification, setVerification] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Submit report
      const reportResponse = await axios.post(`${API_URL}/api/disasters/${disasterId}/reports`, formData);
      
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
      
      setMessage('Report submitted successfully!');
      setFormData({ content: '', image_url: '', user_id: 'citizen1' });
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="report-form">
      <div className="form-group">
        <label htmlFor="content">Report Content *</label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          required
          rows={4}
          placeholder="Describe what you're seeing, needs, or resources available..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="image_url">Image URL (optional)</label>
        <input
          type="url"
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="form-group">
        <label htmlFor="user_id">Reporter</label>
        <select
          id="user_id"
          value={formData.user_id}
          onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
        >
          <option value="citizen1">citizen1</option>
          <option value="volunteer">volunteer</option>
          <option value="first_responder">first_responder</option>
          <option value="official">official</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Submitting...' : 'Submit Report'}
      </button>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {verification && (
        <div className="verification-result">
          <h4>🔍 Image Verification</h4>
          <div className={`verification-status ${verification.status}`}>
            Status: {verification.status} (Score: {verification.score}/100)
          </div>
          <p className="verification-explanation">{verification.explanation}</p>
        </div>
      )}
    </form>
  );
};

export default ReportForm;