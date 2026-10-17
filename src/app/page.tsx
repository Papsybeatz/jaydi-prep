export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>Jaydi - Interview Prep</h1>
      <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label htmlFor="resume" style={{ display: "block", marginBottom: 8 }}>Resume</label>
          <textarea id="resume" rows={8} style={{ width: "100%", padding: 8 }} />
        </div>
        <div>
          <label htmlFor="jd" style={{ display: "block", marginBottom: 8 }}>Job Description</label>
          <textarea id="jd" rows={8} style={{ width: "100%", padding: 8 }} />
        </div>
        <button type="submit">Generate Training</button>
      </form>
    </main>
  );
}
