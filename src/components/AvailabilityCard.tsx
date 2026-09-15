import { Check, Clock3, Copy, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const EMAIL = "rayyan.workhost@gmail.com";

export default function AvailabilityCard(): React.JSX.Element {
    const [copied, setCopied] = useState(false);
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
        try {
            await navigator.clipboard.writeText(EMAIL);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            window.location.href = `mailto:${EMAIL}`;
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