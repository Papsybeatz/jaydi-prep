export async function generateLecture(resume: string, jd: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return `Understanding the role\n\nResume vs role\n\nSkill gaps\n\nHow to think like this role\n\nHow to speak like this role\n\nInterview strategy\n\nEmbodiment exercises\n\n(This is a fallback because OPENAI_API_KEY is not set.)`;
  }
  const prompt = "You are a role embodiment coach. Generate a structured lecture with sections: Understanding the role, Resume vs role, Skill gaps, How to think like this role, How to speak like this role, Interview strategy, Embodiment exercises. Return plain text.";
  const userInput = `Resume:\n${resume}\n\nJob Description:\n${jd}`;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }, { role: "user", content: userInput }],
        temperature: 0.7,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error(error);
    return "Error generating lecture.";
  }
}
