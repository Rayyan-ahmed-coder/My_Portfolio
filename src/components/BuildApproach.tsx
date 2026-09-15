import { ArrowUpRight, Check, Compass, Code2, Rocket } from "lucide-react";
import { useState } from "react";

const phases = [
    {
        icon: Compass,
        number: "01",
        label: "Discover",
        title: "Start with the right questions.",
        text: "I turn a rough idea into a clear direction by understanding the audience, the problem and what success should feel like.",
        deliverables: ["Goals and constraints", "Content direction", "A focused first milestone"],
    },
    {
        icon: Code2,
        number: "02",
        label: "Build",
        title: "Make the experience feel inevitable.",
        text: "I build responsive interfaces in small, testable steps, keeping performance and accessibility in the room from the beginning.",
        deliverables: ["Responsive UI system", "Accessible interactions", "Performance-minded code"],
    },
    {
        icon: Rocket,
        number: "03",
        label: "Launch",
        title: "Ship, learn and make it sharper.",
        text: "A launch is a beginning, not a finish line. I leave behind a polished product and a practical path for its next iteration.",
        deliverables: ["Launch-ready details", "Useful handoff", "Next-step opportunities"],
    },
] as const;

export default function BuildApproach(): React.JSX.Element {
    const [activePhase, setActivePhase] = useState(0);
    const phase = phases[activePhase];
    const Icon = phase.icon;

    return (
        <section className="approach section" id="approach" aria-labelledby="approach-title">
            <div className="container">
                <div className="section-heading approach-heading">
                    <div>
                        <p className="eyebrow">HOW I WORK</p>
                        <h2 id="approach-title">From first thought to <span className="accent-text">real thing.</span></h2>
                    </div>
                    <p className="section-description">A simple, collaborative process that keeps the big picture visible while the details get better.</p>
                </div>

                <div className="approach-layout">
                    <div className="approach-tabs" role="tablist" aria-label="Project phases">
                        {phases.map(({ icon: TabIcon, number, label }, index) => (
                            <button
                                className={`approach-tab${activePhase === index ? " active" : ""}`} 
                                key={label} 
                                type="button" 
                                role="tab" 
                                aria-selected={activePhase === index} 
                                aria-controls={`approach-panel-${number}`} 
                                onClick={() => setActivePhase(index)}
                            >
                                <TabIcon size={18} aria-hidden="true" />
                                <span><b>{number}</b>{label}</span>
                                <ArrowUpRight className="approach-tab-arrow" size={16} aria-hidden="true" />
                            </button>
                        ))}
                    </div>

                    <div className="approach-panel" id={`approach-panel-${phase.number}`} role="tabpanel" aria-live="polite">
                        <div className="approach-panel-top">
                            <span className="approach-panel-icon"><Icon size={28} aria-hidden="true" /></span>
                            <span className="approach-progress">{phase.number} / 03</span>
                        </div>
                        <h3>{phase.title}</h3>
                        <p>{phase.text}</p>
                        <ul>
                            {phase.deliverables.map((deliverable) => <li key={deliverable}><Check size={15} aria-hidden="true" />{deliverable}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}