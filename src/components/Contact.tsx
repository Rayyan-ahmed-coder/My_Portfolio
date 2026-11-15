import { CONFIG } from "../core/config";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Copy, GitBranch, Mail, Send } from "lucide-react";

type FormStatus = "idle" | "submitting" | "success" | "email" | "error";
type CopyStatus = "idle" | "copied" | "error";

const EMAIL_ADDRESS = CONFIG.PUBLIC_EMAIL;
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY;
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

export default function ContactSection(): React.JSX.Element {
  const copyTimeoutRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [messageLength, setMessageLength] = useState<number>(0);

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    },
    [],
  );

  const handleCopyEmail = async (): Promise<void> => {
    if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);

    let nextCopyStatus: CopyStatus;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(EMAIL_ADDRESS);
      } else {
        const previouslyFocused = document.activeElement;
        const textArea = document.createElement("textarea");
        textArea.value = EMAIL_ADDRESS;
        textArea.setAttribute("readonly", "");
        Object.assign(textArea.style, { position: "fixed", opacity: "0" });
        document.body.appendChild(textArea);
        try {
          textArea.select();
          if (!document.execCommand("copy")) throw new Error("The browser denied clipboard access.");
        } finally {
          document.body.removeChild(textArea);
          if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        }
      }

      nextCopyStatus = "copied";
    } catch (error) {
      console.error("[Clipboard Pipeline Exception]:", error);
      nextCopyStatus = "error";
    }

    setCopyStatus(nextCopyStatus);
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
      copyTimeoutRef.current = null;
    }, 2_000);
  };

  const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const form = e.currentTarget;
    const nameInput = (form.elements.namedItem("name") as HTMLInputElement | null)?.value.trim() || "Visitor";
    const emailInput = (form.elements.namedItem("email") as HTMLInputElement | null)?.value.trim() || "";
    const messageInput = (form.elements.namedItem("message") as HTMLTextAreaElement | null)?.value.trim() || "";
    const honeypot = (form.elements.namedItem("_honeypot_clearance_") as HTMLInputElement | null)?.value;

    if (honeypot) {
      form.reset();
      setMessageLength(0);
      return;
    }

    if (!nameInput || !emailInput || !messageInput) {
      setFormStatus("error");
      form.reportValidity();
      return;
    }

    if (!ACCESS_KEY) {
      const subject = encodeURIComponent(`Portfolio inquiry from ${nameInput}`);
      const body = encodeURIComponent(`Name: ${nameInput}\nEmail: ${emailInput}\n\n${messageInput}`);

      window.location.href = `mailto:${EMAIL_ADDRESS}?subject=${subject}&body=${body}`;
      form.reset();
      setMessageLength(0);
      setFormStatus("email");
      return;
    }

    isSubmittingRef.current = true;
    setFormStatus("submitting");

    try {
      const data = new FormData();
      data.append("access_key", ACCESS_KEY.trim());
      data.append("name", nameInput);
      data.append("email", emailInput);
      data.append("message", messageInput);
      data.append("subject", `💼 Portfolio Inquiry from ${nameInput}`);
      data.append("from_name", "Rayyan Portfolio");
      data.append("replyto", emailInput);

      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        body: data,
      });

      const result: { success?: boolean | string; message?: string; status?: string } = await response.json();
      const isSubmissionSuccessful =
        result.success === true ||
        result.success === "true" ||
        result.status === "success" ||
        result.success === "success";

      if (!response.ok || !isSubmissionSuccessful) {
        throw new Error(result.message || result.status || `HTTP Error Status: ${response.status}`);
      }

      form.reset();
      setMessageLength(0);
      isSubmittingRef.current = false;
      setFormStatus("success");
    } catch (error) {
      console.error("[Form Pipeline Exception]:", error);
      isSubmittingRef.current = false;
      setFormStatus("error");
    }
  };

  return (
    <section className="contact section" id="contact" aria-labelledby="contact-title">
      <div className="container contact-container">
        <div className="contact-info-block">
          <div className="contact-heading">
            <p className="eyebrow">
              <span className="contact-eyebrow-dot" aria-hidden="true" /> OPEN TO GOOD IDEAS
            </p>
            <h2 id="contact-title">
              Let{`\u2019`}s make
              <br />
              <span>something</span>
              <br />
              matter.
            </h2>
          </div>

          <div className="contact-content">
            <p className="contact-lead">
              Have a project, a collaboration in mind, or just want to talk web? My inbox is open.
            </p>

            <div className="contact-email-card">
              <span className="contact-email-icon" aria-hidden="true">
                <Mail size={18} />
              </span>
              <div className="contact-email-copy">
                <span>DROP ME A LINE</span>
                <a
                  className="contact-email"
                  href={`mailto:${EMAIL_ADDRESS}`}
                  aria-label={`Email Rayyan at ${EMAIL_ADDRESS}`}
                >
                  {EMAIL_ADDRESS}
                </a>
              </div>
              <button
                type="button"
                className="copy-email-btn"
                onClick={() => void handleCopyEmail()}
                aria-label={copyStatus === "copied" ? "Email copied to clipboard" : "Copy email address to clipboard"}
              >
                {copyStatus === "copied" ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Copy size={16} aria-hidden="true" />
                )}
                <span>{copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Failed" : "Copy"}</span>
              </button>
              <span className="visually-hidden" role="status" aria-live="polite">
                {copyStatus === "copied"
                  ? "Email copied to clipboard."
                  : copyStatus === "error"
                    ? "Could not copy email address."
                    : ""}
              </span>
            </div>

            <div className="contact-response-note">
              <span className="contact-response-mark" aria-hidden="true">
                ↳
              </span>
              <span>
                Tell me what you{`\u2019`}re making. I{`\u2019`}ll get back to you as soon as I can.
              </span>
            </div>

            <nav className="contact-links" aria-label="Social profiles and channels">
              <a
                href="https://github.com/Rayyan-ahmed-coder"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <GitBranch size={16} aria-hidden="true" />
                GitHub
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>

        <div className="contact-form-block" data-reveal>
          <div className="contact-form-heading">
            <span className="contact-form-kicker">YOUR NEXT BIG THING</span>
            <h3>Start a conversation.</h3>
            <p>A few details are all I need to get back to you.</p>
          </div>
          <form onSubmit={handleFormSubmit} className="interactive-contact-form">
            <div className="contact-honeypot" aria-hidden="true">
              <input type="text" name="_honeypot_clearance_" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="form-group-row">
              <div className="form-input-wrapper">
                <label htmlFor="user-name">Name</label>
                <input
                  type="text"
                  id="user-name"
                  name="name"
                  required
                  placeholder="Your full name"
                  autoComplete="name"
                  autoCapitalize="words"
                  disabled={formStatus === "submitting"}
                />
              </div>
              <div className="form-input-wrapper">
                <label htmlFor="user-email">Email</label>
                <input
                  type="email"
                  id="user-email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  disabled={formStatus === "submitting"}
                />
              </div>
            </div>

            <div className="form-input-wrapper">
              <div className="textarea-label-row">
                <label htmlFor="user-message">Message</label>
                <span id="user-message-counter" className={`char-counter ${messageLength > 400 ? "limit-near" : ""}`}>
                  ({messageLength} / 500)
                </span>
              </div>
              <textarea
                id="user-message"
                name="message"
                spellCheck="true"
                rows={5}
                maxLength={500}
                required
                aria-describedby="user-message-counter"
                placeholder="Tell me about your amazing project idea..."
                autoCapitalize="sentences"
                onChange={(e) => setMessageLength(e.target.value.length)}
                disabled={formStatus === "submitting"}
              />
            </div>

            <button
              type="submit"
              className={`submit-form-btn ${formStatus === "submitting" ? "loading-state" : ""}`}
              disabled={formStatus === "submitting"}
              aria-busy={formStatus === "submitting"}
            >
              {formStatus === "submitting" ? "Sending message…" : "Send my message"}
              {formStatus === "submitting" ? (
                <span className="submit-spinner" aria-hidden="true" />
              ) : (
                <Send size={16} aria-hidden="true" />
              )}
            </button>

            {formStatus === "success" && (
              <p className="form-alert alert-success" role="status">
                Thanks. Your message is on its way.
              </p>
            )}
            {formStatus === "email" && (
              <p className="form-alert alert-success" role="status">
                Your email app should open with a draft. If it didn{`\u2019`}t, use the email link on the left.
              </p>
            )}
            {formStatus === "error" && (
              <p className="form-alert alert-error" role="alert">
                Your message couldn{`\u2019`}t be sent. Please try again or email me directly.
              </p>
            )}
          </form>
          <div className="contact-form-footnote">
            <ArrowDownRight size={15} aria-hidden="true" />
            No spam, just a reply about your idea.
          </div>
        </div>
      </div>
    </section>
  );
}
