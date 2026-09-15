import { Gauge, Layers3, WandSparkles } from "lucide-react";

const principles = [
    { icon: Gauge, label: "Performance minded", text: "Fast interactions and clean loading paths from the first click." },
    { icon: Layers3, label: "Built to adapt", text: "Responsive systems that stay useful across screens and devices." },
    { icon: WandSparkles, label: "Details that matter", text: "Small moments of motion and feedback that make products feel alive." },
] as const;

export default function ImpactStrip(): React.JSX.Element {
    return (
        <section className="impact-strip" aria-label="Working principles">
            <div className="container impact-strip-grid">
                {principles.map(({ icon: Icon, label, text }) => (
                    <article className="impact-item" key={label}>
                        <Icon className="impact-icon" size={20} aria-hidden="true" />
                        <div className='impact-content-wrapper'>
                            <h2>{label}</h2>
                            <p>{text}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}