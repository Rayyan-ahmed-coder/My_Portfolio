import { CONFIG } from "../core/config";
import { Check, Clock3, Copy, Mail, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const EMAIL = CONFIG.EMAIL;

export default function AvailabilityCard(): React.JSX.Element {
    const [copied, setEmailCopied] = useState(false);
    const [time, setTime] = useState(() => new Intl.DateTimeFormat([], {
        hour: "numeric",
        minute: "2-digit",
    }).format());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setTime(new Intl.DateTimeFormat([], {
                hour: "numeric",
                minute: "2-digit",
            }).format());
        }, 60_000);

        return () => window.clearInterval(timer);
    }, []);

    const copyEmail = async (): Promise<void> => {
        const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        // Clear any active running timer to handle rapid/double clicks flawlessly
        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(EMAIL);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = EMAIL;
                textArea.style.position = "absolute";
                textArea.style.opacity = "0";
                textArea.style.pointerEvents = "none";
                document.body.appendChild(textArea);
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
        <aside className="availability-card" id="availability-card" aria-label="Current availability">
            <div className="availability-card-header">
                <span className="availability-status"><span aria-hidden="true" /> Available for select projects</span>
                <Sparkles size={16} aria-hidden="true"/>
            </div>
            <p className="availability-title">Have a thoughtful idea?</p>
            <p className="availability-copy">I am currently open to focused frontend work, collaborations and ambitious experiments.</p>
            <div className="availability-meta">
                <span><Clock3 size={14} aria-hidden="true" /> Local time {time}</span>
                <span><Mail size={14} aria-hidden="true" /> Usually replies in 24h</span>
            </div>
            <button className="availability-copy-button" type="button" onClick={copyEmail}>
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? "Email copied" : "Copy my email"}
            </button>
        </aside>
    );
}