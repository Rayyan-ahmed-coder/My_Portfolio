import type React from 'react';
import { useState } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_ADDRESS = 'rayyan.workhost@gmail.com';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

export default function ContactSection(): React.JSX.Element {
    const [emailCopied, setEmailCopied] = useState(false);
    const [formStatus, setFormStatus] = useState<FormStatus>('idle');
    const [messageLength, setMessageLength] = useState(0);

    const handleCopyEmail = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(EMAIL_ADDRESS);
            setEmailCopied(true);
            setTimeout(() => setEmailCopied(false), 2000);
        } catch {
            setEmailCopied(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (formStatus === 'submitting') return;

        const form = e.currentTarget;
        const formData = new FormData(form);
        if (formData.get('_honeypot_clearance_')) {
            form.reset();
            setMessageLength(0);
            return;
        }

        setFormStatus('submitting');
        if (!ACCESS_KEY) {
            const name = String(formData.get('name') ?? '');
            const message = String(formData.get('message') ?? '');
            window.location.href = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(`Portfolio inquiry from ${name}`)}&body=${encodeURIComponent(message)}`;
            setFormStatus('success');
            return;
        }

        formData.set('access_key', ACCESS_KEY);
        formData.set('subject', `Portfolio inquiry from ${formData.get('name') ?? 'website visitor'}`);
        formData.set('from_name', 'Rayyan Portfolio');

        try {
            const response = await fetch(WEB3FORMS_ENDPOINT, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
            });
            const result: { success?: boolean } = await response.json();

            if (!response.ok || !result.success) throw new Error('Contact submission failed');
            form.reset();
            setMessageLength(0);
            setFormStatus('success');
        } catch (error) {
            console.error('Contact form submission failed', error);
            setFormStatus('error');
        }
    };

    return (
        <section className="contact section" id="contact" aria-labelledby="contact-title">
            <div className="container contact-container">
                
                <div className="contact-info-block">
                    <div className="contact-heading">
                        <p className="eyebrow">CONTACT</p>
                        <h2 id="contact-title">
                            Have an idea?<br />Let's build it.
                        </h2>
                    </div>
                    
                    <div className="contact-content">
                        <p className="contact-lead">
                            Whether it's a project, collaboration,
                            question or just a conversation about
                            development — I'd love to hear from you.
                        </p>

                        <div className="email-interactive-wrapper">
                            <a 
                                className="contact-email" 
                                href={`mailto:${EMAIL_ADDRESS}`}
                                aria-label={`Email Rayyan at ${EMAIL_ADDRESS}`}
                            >
                                {EMAIL_ADDRESS}
                            </a>
                            <button
                                type="button"
                                className="copy-email-btn"
                                onClick={handleCopyEmail}
                                aria-label={emailCopied ? "Email copied to clipboard" : "Copy email address to clipboard"}
                            >
                                {emailCopied ? 'Copied! ✓' : 'Copy'}
                            </button>
                        </div>

                        <nav className="contact-links" aria-label="Social profiles and channels">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                GitHub <span aria-hidden="true" className="arrow-icon">↗</span>
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
                                LinkedIn <span aria-hidden="true" className="arrow-icon">↗</span>
                            </a>
                        </nav>
                    </div>
                </div>

                <div className="contact-form-block" data-reveal>
                    <form onSubmit={handleFormSubmit} className="interactive-contact-form" noValidate={false}>
                        {/* Invisible field to trap spam bots */}
                        <div hidden aria-hidden="true">
                            <input 
                                type="text" 
                                name="_honeypot_clearance_" 
                                tabIndex={-1} 
                                autoComplete="off" 
                            />
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
                                    disabled={formStatus === 'submitting'}
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
                                    disabled={formStatus === 'submitting'}
                                />
                            </div>
                        </div>

                        <div className="form-input-wrapper">
                            <div className="textarea-label-row">
                                <label htmlFor="user-message">Message</label> 
                                {/* 📊 LIVE CHARACTER COUNTER: Tracks composition layout sizes in real time */}
                                <span className={`char-counter ${messageLength > 400 ? 'limit-near' : ''}`} aria-hidden="true">
                                    {messageLength} / 500
                                </span>
                            </div>
                            <textarea 
                                id="user-message" 
                                name="message" 
                                spellCheck="true" 
                                rows={5} 
                                maxLength={500}
                                required 
                                placeholder="Tell me about your amazing project idea..."
                                onChange={(e) => setMessageLength(e.target.value.length)}
                                disabled={formStatus === 'submitting'}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className={`submit-form-btn ${formStatus === 'submitting' ? 'loading-state' : ''}`} 
                            disabled={formStatus === 'submitting'}
                        >
                            {formStatus === 'submitting' ? 'Sending Message...' : 'Send Message ↗'}
                        </button>

                        {formStatus === 'success' && (
                            <p className="form-alert alert-success" role="alert">
                                Thanks. Your message is on its way.
                            </p>
                        )}
                        {formStatus === 'error' && (
                            <p className="form-alert alert-error" role="alert">
                                Something went wrong. Please click my email link directly!
                            </p>
                        )}
                    </form>
                </div>

            </div>
        </section>
    );
}