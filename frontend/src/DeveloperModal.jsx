import { useState } from "react";
import DEVELOPER_INFO from "./developerConfig";

export default function DeveloperModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
  try {
    await navigator.clipboard.writeText(DEVELOPER_INFO.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  } catch (error) {
    console.error("Unable to copy email:", error);
    alert("Could not copy email. Please copy it manually.");
  }
};
  return (
    <div className="dev-modal-overlay" onClick={onClose}>
      <div className="dev-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="dev-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="dev-modal-badge">
          <span className="pulse-dot"></span>
          PROJECT CREATOR & DEVELOPER
        </div>

        <div className="dev-modal-header">
          <div className="dev-modal-avatar">
            {DEVELOPER_INFO.name.charAt(0)}
          </div>
          <div className="dev-modal-headline">
            <h3>{DEVELOPER_INFO.name}</h3>
            <p className="dev-role">{DEVELOPER_INFO.title}</p>
            <span className="dev-location">📍 {DEVELOPER_INFO.location}</span>
          </div>
        </div>

        <p className="dev-bio">{DEVELOPER_INFO.bio}</p>

        <div className="dev-skills-section">
          <span className="dev-section-title">CORE TECHNOLOGIES USED IN THIS PROJECT</span>
          <div className="dev-skills-pills">
            {DEVELOPER_INFO.skills.map((skill, idx) => (
              <span key={idx} className="dev-skill-pill">{skill}</span>
            ))}
          </div>
        </div>

        <div className="dev-highlight-card">
          <div className="dev-highlight-icon">⚡</div>
          <div>
            <strong>{DEVELOPER_INFO.projectHighlight.name} {DEVELOPER_INFO.projectHighlight.version}</strong>
            <p>{DEVELOPER_INFO.projectHighlight.stack}</p>
          </div>
        </div>

        <div className="dev-actions">
          <button
            type="button"
            className="dev-action-btn primary"
            onClick={handleCopyEmail}
          >
            {copied ? "✓ Email Copied!" : "📋 Copy Email Address"}
          </button>

          <a
            href={`mailto:${DEVELOPER_INFO.email}?subject=Regarding%20INTERVIA%20Project`}
            className="dev-action-btn email"
          >
            ✉️ Send Direct Email
          </a>

          {DEVELOPER_INFO.socials.linkedin && (
            <a
              href={DEVELOPER_INFO.socials.linkedin}
              target="_blank"
              rel="noreferrer"
              className="dev-action-btn secondary"
            >
              💼 LinkedIn
            </a>
          )}

          {DEVELOPER_INFO.socials.github && (
            <a
              href={DEVELOPER_INFO.socials.github}
              target="_blank"
              rel="noreferrer"
              className="dev-action-btn secondary"
            >
              🐙 GitHub
            </a>
          )}

          {DEVELOPER_INFO.socials.portfolio && (
            <a
              href={DEVELOPER_INFO.socials.portfolio}
              target="_blank"
              rel="noreferrer"
              className="dev-action-btn secondary"
            >
              🌐 Portfolio
            </a>
          )}
        </div>

        <div className="dev-footer-note">
          Feel free to reach out for project inquiries, freelance work, or full-time opportunities.
        </div>
      </div>
    </div>
  );
}
