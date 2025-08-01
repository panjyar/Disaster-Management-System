import { Router } from "express";
import SocialMediaService from "../services/socialMediaService.js";
import supabase from "../utils/supabase.js";

const router = Router();

router.get("/:disasterId", async (req, res) => {
  try {
    const { disasterId } = req.params;

    // Get disaster tags for context
    // Fix: Use ES6 import instead of require and correct method name
    const { data: disaster } = await supabase
      .from("disasters")
      .select("tags")
      .eq("id", disasterId)
      .single();

    const tags = disaster?.tags || [];
    // Fix: Use correct method name
    const reports = await SocialMediaService.fetchDisasterReports(
      disasterId,
      tags
    );

    // Emit real-time update
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