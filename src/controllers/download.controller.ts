import { getSignedUrlForKey } from "../config/awssdk.js";
import {type Response} from "express"
import type { RoleBasedRequest } from "../utils/utils.js";

export const downloadProof = async (req: RoleBasedRequest, res: Response) => {
  try {
    const { key } = req.query;

    if (!key || typeof key !== "string") {
      return res.status(400).json({ message: "File key is required", ok: false });
    }

    const downloadUrl = await getSignedUrlForKey(key); // <-- await added

    return res.status(200).json({
      url: downloadUrl,
      message: "Link expires in 15 minutes",
      ok: true,
    });
  } catch (error: any) {
    console.error(error);
    if (res.headersSent) {
      console.warn("Headers were already sent. Skipping duplicate error response handling.");
      return;
    }
    return res.status(500).json({ message: "Error generating download link" });
  }
};