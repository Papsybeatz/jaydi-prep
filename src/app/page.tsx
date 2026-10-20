"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import AccountControls from "@/app/auth/account-controls";
import { LEGAL } from "@/lib/legal";
import styles from "./page.module.css";

type TrainResponse = {
  id?: string;
  error?: string;
};

type ParseResumeResponse = {
  text?: string;
  fileName?: string;
  error?: string;
};

const MAX_RESUME_FILE_SIZE = 4 * 1024 * 1024;

const coachNotes = [
  {
    label: "A note from your coach",
    title: "Specific stories make strong answers.",
    body: "Bring one moment where you made a difference. We’ll connect it to what this role needs.",
  },
  {
    label: "A note from your coach",
    title: "You don’t need to memorize a script.",
    body: "Know your key points, then let your experience sound like you.",
  },
  {
    label: "A note from your coach",
    title: "The job description is a set of clues.",
    body: "Look for the problems they need solved, not just the list of requirements.",
  },
];

function Icon({
  name,
  size = 20,
}: {
  name: "spark" | "document" | "briefcase" | "clock" | "lock" | "arrow" | "check";
  size?: number;
}) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "document":
      return <svg {...shared}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></svg>;
    case "briefcase":
      return <svg {...shared}><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></svg>;
    case "clock":
      return <svg {...shared}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "lock":
      return <svg {...shared}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" /></svg>;
    case "arrow":
      return <svg {...shared}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
    case "check":
      return <svg {...shared}><path d="m5 12 4 4L19 6" /></svg>;
    default:
      return <svg {...shared}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /></svg>;
  }
}

export default function Home() {
  const router = useRouter();
  const [resume, setResume] = useState("");
  const [resumePreview, setResumePreview] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [coachNoteIndex, setCoachNoteIndex] = useState(0);
  const coachNote = coachNotes[coachNoteIndex];

  async function handleResumeUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) {
      return;
    }

    setUploadError("");
    setResumePreview("");
    setResumeFileName("");

    if (file.size > MAX_RESUME_FILE_SIZE) {
      setUploadError("The file is too large. Please choose a file smaller than 4 MB.");
      return;
    }

    setIsParsing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const result: ParseResumeResponse = await response.json();

      if (!response.ok || !result.text || !result.fileName) {
        throw new Error(result.error || "We couldn't read this resume file.");
      }

      setResume(result.text);
      setResumePreview(result.text);
      setResumeFileName(result.fileName);
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "We couldn't read this resume file. Please try another PDF or DOCX.",
      );
    } finally {
      setIsParsing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          jobDescription: form.get("jobDescription"),
        }),
      });
      const result: TrainResponse = await response.json();

      if (!response.ok || !result.id) {
        throw new Error(result.error || "Failed to generate training.");
      }

      router.push(`/training/${result.id}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to generate training.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeCoachNote(direction: number) {
    setCoachNoteIndex(
      (current) => (current + direction + coachNotes.length) % coachNotes.length,
    );
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="Jaydi workspace">
        <Link className={styles.brand} href="/" aria-label="Jaydi home">
          <span className={styles.brandMark}><Icon name="spark" size={21} /></span>
          <span>jaydi<span className={styles.brandDot}>.</span></span>
        </Link>

        <div className={styles.workspaceLabel}>YOUR WORKSPACE</div>
        <Link className={`${styles.sideLink} ${styles.sideLinkActive}`} href="#start-training">
          <Icon name="spark" size={18} />
          <span>New training</span>
        </Link>
        <Link className={styles.sideLink} href="/history">
          <Icon name="clock" size={18} />
          <span>Training history</span>
        </Link>

        <div className={styles.sideSection}>
          <div className={styles.sideSectionTitle}>YOUR LIBRARY</div>
          <div className={styles.upcomingLink}>
            <Icon name="document" size={17} />
            <span>Saved resumes</span>
            <span className={styles.comingSoon}>SOON</span>
          </div>
          <div className={styles.upcomingLink}>
            <Icon name="briefcase" size={17} />
            <span>Saved roles</span>
            <span className={styles.comingSoon}>SOON</span>
          </div>
          <div className={styles.upcomingLink}>
            <Icon name="spark" size={17} />
            <span>AI feedback</span>
            <span className={styles.comingSoon}>SOON</span>
          </div>
        </div>

        <AccountControls />

        <div className={styles.sidebarSpacer} />
        <section className={styles.coachCard}>
          <div className={styles.coachAvatar}><Icon name="spark" size={19} /></div>
          <p className={styles.coachOverline}>IN YOUR CORNER</p>
          <h2>My Interview Coach</h2>
          <p>Thoughtful prep, built around your experience and the role ahead.</p>
          <span className={styles.coachAvailability}><span /> Ready when you are</span>
        </section>
        <div className={styles.sidebarFoot}>A little more ready, every day.</div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>Workspace <span>/</span> New training</div>
          <Link className={styles.topbarHistory} href="/history">
            <Icon name="clock" size={17} />
            <span>History</span>
          </Link>
        </header>

        <main className={styles.content}>
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroCopy}>
              <p className={styles.heroEyebrow}><span /> YOUR NEXT CHAPTER STARTS HERE</p>
              <h1 id="hero-title">Show up <span>ready.</span></h1>
              <p className={styles.heroDescription}>
                Bring your experience. I’ll help you connect the dots, find your
                stories, and walk into the conversation feeling ready.
              </p>
              <a className={styles.heroCta} href="#start-training">
                Start training <Icon name="arrow" size={18} />
              </a>
              <div className={styles.heroNote}>
                <span className={styles.heroNoteIcon}><Icon name="check" size={15} /></span>
                Made for your experience. Not a one-size-fits-all script.
              </div>
            </div>
            <div className={styles.heroArt} aria-hidden="true">
              <div className={`${styles.artOrbit} ${styles.artOrbitOuter}`} />
              <div className={`${styles.artOrbit} ${styles.artOrbitInner}`} />
              <div className={`${styles.artSpark} ${styles.artSparkOne}`}><Icon name="spark" size={21} /></div>
              <div className={`${styles.artSpark} ${styles.artSparkTwo}`}><Icon name="spark" size={15} /></div>
              <div className={styles.artCard}>
                <div className={styles.artCardTop}><span /><span /><span /></div>
                <div className={styles.artAvatar}>J</div>
                <div className={styles.artNameLine} />
                <div className={styles.artRoleLine} />
                <div className={styles.artDivider} />
                <div className={styles.artSkillRow}><span /><i /><span /><i /></div>
                <div className={styles.artSkillRow}><span /><i /><span /><i /></div>
                <div className={styles.artSkillRow}><span /><i /><span /><i /></div>
                <div className={styles.artCardBottom}><Icon name="spark" size={14} /> Your story, in focus</div>
              </div>
              <div className={styles.artBubble}>
                <span className={styles.bubbleIcon}><Icon name="check" size={15} /></span>
                <span><b>Your strengths</b><small>Ready to shine</small></span>
              </div>
            </div>
            <div className={styles.heroGlow} />
          </section>

          <section className={styles.coachNote} aria-label={coachNote.label}>
            <div className={styles.noteIcon}><Icon name="spark" size={18} /></div>
            <div className={styles.noteCopy} aria-live="polite">
              <span>{coachNote.label}</span>
              <h2>{coachNote.title}</h2>
              <p>{coachNote.body}</p>
            </div>
            <div className={styles.noteControls}>
              <span className={styles.noteCount}>{coachNoteIndex + 1} / {coachNotes.length}</span>
              <button type="button" onClick={() => changeCoachNote(-1)} aria-label="Previous coach note">←</button>
              <button type="button" onClick={() => changeCoachNote(1)} aria-label="Next coach note">→</button>
            </div>
          </section>

          <section className={styles.formSection} id="start-training">
            <div className={styles.formHeading}>
              <div>
                <p className={styles.sectionEyebrow}>YOUR FIRST STEP</p>
                <h2>Let’s make this role feel closer.</h2>
                <p>Start with your story and the opportunity in front of you.</p>
              </div>
              <div className={styles.stepBadge}><span>01</span><i /> BUILD YOUR BRIEF</div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <section className={styles.inputCard}>
                <div className={styles.cardHeading}>
                  <span className={`${styles.cardIcon} ${styles.resumeIcon}`}><Icon name="document" size={19} /></span>
                  <div>
                    <label htmlFor="resumeFile">Your experience</label>
                    <p>Upload your resume — I’ll extract your strongest achievements.</p>
                  </div>
                  <span className={styles.cardNumber}>01</span>
                </div>

                <div className={styles.uploadPanel}>
                  <div className={styles.uploadIcon}><Icon name="document" size={21} /></div>
                  <div className={styles.uploadText}>
                    <label className={styles.uploadButton} htmlFor="resumeFile">
                      {isParsing ? "Reading your resume…" : "Choose a file"}
                    </label>
                    <span> · PDF or DOCX</span>
                    <small>Maximum 4 MB · Your file is parsed, not stored</small>
                  </div>
                  <input
                    id="resumeFile"
                    className={styles.fileInput}
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResumeUpload}
                    disabled={isParsing || isSubmitting}
                    aria-label="Upload a PDF or DOCX resume"
                  />
                </div>

                {isParsing && <p className={styles.statusMessage} role="status">Reading your resume…</p>}
                {uploadError && <p className={styles.error} role="alert">{uploadError}</p>}
                {resumePreview && (
                  <section className={styles.preview} aria-label="Extracted resume preview">
                    <div className={styles.previewHeading}>
                      <span className={styles.previewCheck}><Icon name="check" size={14} /></span>
                      Text extracted from {resumeFileName}
                    </div>
                    <pre>{resumePreview}</pre>
                  </section>
                )}

                <label className={styles.textareaLabel} htmlFor="resumeText">Or paste / edit your resume text</label>
                <textarea
                  id="resumeText"
                  name="resume"
                  rows={6}
                  maxLength={20000}
                  placeholder="Add your experience, achievements, and the work you’re proud of…"
                  required
                  value={resume}
                  onChange={(event) => setResume(event.target.value)}
                />
              </section>

              <section className={styles.inputCard}>
                <div className={styles.cardHeading}>
                  <span className={`${styles.cardIcon} ${styles.roleIcon}`}><Icon name="briefcase" size={19} /></span>
                  <div>
                    <label htmlFor="jobDescription">The opportunity</label>
                    <p>Paste the job description — I’ll break down what they’re really looking for.</p>
                  </div>
                  <span className={styles.cardNumber}>02</span>
                </div>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  rows={7}
                  maxLength={20000}
                  placeholder="Paste the job description here…"
                  required
                />
              </section>

              {error && (
                <p className={styles.error} role="alert">
                  {error}{" "}
                  {error.toLowerCase().includes("sign in") && (
                    <Link href="/auth?next=%2F">Sign in to continue.</Link>
                  )}
                </p>
              )}
              <div className={styles.submitRow}>
                <p><Icon name="lock" size={15} /> Your details shape your training.</p>
                <button className={styles.submit} disabled={isSubmitting || isParsing} type="submit">
                  <Icon name="spark" size={17} />
                  {isSubmitting ? "Building your training…" : "Generate training"}
                  {!isSubmitting && <Icon name="arrow" size={17} />}
                </button>
              </div>
              <p className={styles.submitHint}>Let’s sharpen your answers.</p>
            </form>
          </section>

          <section className={styles.bottomPrompt} aria-label="Encouragement">
            <div className={styles.bottomPromptIcon}><Icon name="spark" size={20} /></div>
            <p>You already have the experience.<br /><span>Let’s help you bring it into the room.</span></p>
            <a href="#start-training" aria-label="Start preparing">↑</a>
          </section>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <Link className={styles.brand} href="/">
                <span className={styles.brandMark}><Icon name="spark" size={18} /></span>
                <span>jaydi<span className={styles.brandDot}>.</span></span>
              </Link>
              <p>A thoughtful coach for the next step in your career.</p>
            </div>
            <nav className={styles.footerLinks} aria-label="Footer">
              <a href="#about">About Jaydi</a>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="#contact">Contact</a>
            </nav>
            <div className={styles.socials} aria-label="Social links">
              <span>Follow along</span>
              <span className={styles.socialSoon}>Socials coming soon</span>
            </div>
          </div>
          <div className={styles.footerDetails}>
            <p id="about"><b>About Jaydi</b> — Interview preparation shaped around your experience and the role you’re pursuing.</p>
            <p id="privacy"><b>Privacy</b> — Your trainings are private to your account. Uploading a resume parses it in memory without keeping the file; generating a training saves the extracted resume text, the job description, and the generated lecture and audio to your account. Read the <Link href="/privacy">Privacy Policy</Link> for what we store, who processes it, and how to have it deleted.</p>
            <p id="terms"><b>Terms</b> — Jaydi provides preparation guidance, not a promise of interview or employment outcomes. See our <Link href="/terms">Terms of Service</Link>.</p>
            <p id="contact"><b>Contact</b> — <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a></p>
          </div>
          <div className={styles.footerBottom}>
            <span>© {new Date().getFullYear()} Jaydi</span>
            <span>Powered by Gee Oh Dee (Tech) LLC</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
