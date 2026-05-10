import { reenrichAll } from "@/lib/server/gameStorage";
import { NextApiRequest, NextApiResponse } from "next";

// This can take tens of seconds for very large databases — disable Next's
// default response size cap to be safe.
export const config = {
  api: { responseLimit: false },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await reenrichAll();
    return res.status(200).json(result);
  } catch (err) {
    console.error("Reenrich failed", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Reenrich failed",
    });
  }
}
