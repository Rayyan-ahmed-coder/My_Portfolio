import type React from 'react';
import { useState, useTransition } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_ADDRESS = 'rayyan.workhost@gmail.com';
const WEB3FORMS_ENDPOINT = 'https://web3forms.com';

/* 🔑 Vite Context Hook mapping out secure background token declarations */
const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

export default function ContactSection(): React.JSX.Element {
    const [emailCopied, setEmailCopied] = useState<boolean>(false);
    const [formStatus, setFormStatus] = useState<FormStatus>('idle');
    const [messageLength, setMessageLength] = useState<number>(0);
    const [isPending, startTransition] = useTransition();

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
        if (formStatus === 'submitting' || isPending) return;

        const form = e.currentTarget;
        const formData = new FormData(form);

        /* 🛡️ HONEYPOT SPAM SHIELD */
        if (formData.get('_honeypot_clearance_')) {
            form.reset();
            setMessageLength(0);
            return;
        }

        /* Fallback logic handling message delivery if local env parameters fail */
        if (!ACCESS_KEY) {
            const name = String(formData.get('name') ?? '');
            const message = String(formData.get('message') ?? '');
            window.location.href = `mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(`Portfolio inquiry from ${name}`)}&body=${encodeURIComponent(message)}`;
            setFormStatus('success');
            return;
        }

        formData.set('access_key', ACCESS_KEY);
        formData.set('subject', `💼 Portfolio Inquiry from ${formData.get('name') ?? 'Visitor'}`);
        formData.set('from_name', 'Rayyan Portfolio Pipeline');

        setFormStatus('submitting');

        startTransition(async () => {
            try {
                const response = await fetch(WEB3FORMS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: formData,
                });
                const result: { success?: boolean } = await response.json();

                if (!response.ok || !result.success) throw new Error('Network validation failed');
                
                form.reset();
                setMessageLength(0);
                setFormStatus('success');
            } catch (error) {
                console.error('[Form Pipeline Exception]:', error);
                setFormStatus('error');
            }
        });
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
                        
                        <div hidden aria-hidden="true" style={{ display: 'none' }}>
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
                                    autoCapitalize='on' 
                                    id="user-name"  
                                    name="name" 
                                    required 
                                    placeholder="Your full name"
                                    autoComplete="name"
                                    disabled={formStatus === 'submitting' || isPending}
                                />
                            </div>
                            <div className="form-input-wrapper">
                                <label htmlFor="user-email">Email</label>
                                <input 
                                    type="email" 
                                    autoCapitalize='off'
                                    id="user-email" 
                                    name="email" 
                                    required 
                                    placeholder="your@email.com"
                                    autoComplete="email"
                                    disabled={formStatus === 'submitting' || isPending}
                                />
                            </div>
                        </div>

                        <div className="form-input-wrapper">
                            <div className="textarea-label-row">
                                <label htmlFor="user-message">Message</label>
                                <span className={`char-counter ${messageLength > 400 ? 'limit-near' : ''}`} aria-hidden="true">
                                    &#40;{messageLength} / 500&#41;
                                </span>
                            </div>
                            <textarea 
                                autoCapitalize='sentences'
                                id="user-message" 
                                name="message" 
                                spellCheck="true" 
                                rows={5} 
                                maxLength={500}
                                required 
                                placeholder="Tell me about your amazing project idea..."
                                onChange={(e) => setMessageLength(e.target.value.length)}
                                disabled={formStatus === 'submitting' || isPending}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className={`submit-form-btn ${formStatus === 'submitting' ? 'loading-state' : ''}`} 
                            disabled={formStatus === 'submitting' || isPending}
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