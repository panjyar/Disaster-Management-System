import { Router } from "express";
import SocialMediaService from "../services/socialMediaService.js";
import supabase from "../utils/supabase.js";

const router = Router();

// NEW: GET /api/social-media - List recent social media reports or provide API info
router.get('/', async (req, res) => {
  try {
    // Return API information and recent reports
    const recentReports = await SocialMediaService.fetchDisasterReports('general', ['emergency']);
    
    res.json({
      message: 'Social Media API - Use /api/social-media/:disasterId to get reports for a specific disaster',
      endpoints: {
        'GET /api/social-media/:disasterId': 'Get social media reports for a specific disaster'
      },
      sample_recent_reports: recentReports.slice(0, 3) // Show 3 sample reports
    });
  } catch (error) {
    console.error('Social media fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// EXISTING: GET /api/social-media/:disasterId
router.get("/:disasterId", async (req, res) => {
  try {
    const { disasterId } = req.params;

    const { data: disaster } = await supabase
      .from("disasters")
      .select("tags")
      .eq("id", disasterId)
      .single();

    const tags = disaster?.tags || [];
    const reports = await SocialMediaService.fetchDisasterReports(disasterId, tags);

    const io = req.app.get("io");
    if (io) {
      io.to(`disaster_${disasterId}`).emit("social_media_updated", reports);
    }

    res.json(reports);
  } catch (error) {
    console.error("Social media fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;