import { CONFIG } from "../core/config";
import { Check, Clock3, Copy, Mail, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const EMAIL = CONFIG.PUBLIC_EMAIL;

// Explicitly accept a Date object to allow pure, testable deterministic formatting
const formatLocalTime = (date: Date): string => {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export default function AvailabilityCard(): React.JSX.Element {
  const [copied, setEmailCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [time, setTime] = useState(() => formatLocalTime(new Date()));

  // Clock Update Pipeline
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(formatLocalTime(new Date()));
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  // Cleanup timeout references safely on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const copyEmail = async (): Promise<void> => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(EMAIL);
      } else {
        // Fallback fallback abstraction wrapper fallback logic only if standard is blocked
        const textArea = document.createElement("textarea");
        textArea.value = EMAIL;
        textArea.style.position = "fixed"; // Prevents layout shifts
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setEmailCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setEmailCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.error("[Clipboard Pipeline Exception]:", error);
      setEmailCopied(false);
    }
  };

  return (
    <aside className="availability-card" id="availability-card" aria-label="Current availability" data-reveal>
      <div className="availability-card-header">
        <span className="availability-status">
          <span aria-hidden="true" /> Available for select projects
        </span>
        <Sparkles size={16} aria-hidden="true" />
      </div>
      <h2 className="availability-title">Have a thoughtful idea?</h2>
      <p className="availability-copy">
        I am currently open to focused frontend work, collaborations and ambitious experiments.
      </p>
      <div className="availability-meta">
        <span>
          <Clock3 size={14} aria-hidden="true" /> Local time {time}
        </span>
        <span>
          <Mail size={14} aria-hidden="true" /> Usually replies in 24h
        </span>
      </div>
      <button className="availability-copy-button" type="button" onClick={copyEmail} aria-live="polite">
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        <span>{copied ? "Email copied" : "Copy my email"}</span>
      </button>
    </aside>
  );
}
