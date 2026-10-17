export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { resume, jobDescription } = req.body;
    if (!resume || !resume.trim()) return res.status(400).json({ error: "Resume is required" });
    if (!jobDescription || !jobDescription.trim()) return res.status(400).json({ error: "Job description is required" });
    const maxChars = 20000;
    if (resume.length > maxChars || jobDescription.length > maxChars) {
      return res.status(400).json({ error: `Resume or job description must be less than ${maxChars} characters` });
    }
    const { generateLecture } = await import("@/lib/ai/generateLecture");
    const { generateAudio } = await import("@/lib/tts/generateAudio");
    const lectureText = await generateLecture(resume, jobDescription);
    const audioUrl = await generateAudio(lectureText);
    return res.status(200).json({ lectureText, audioUrl });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Failed to generate training" });
  }
}
