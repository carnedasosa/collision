import gsap from 'gsap';

export function initBooking() {
    const form = document.getElementById('booking-form');
    
    if (form) {
        // Prevent duplicate initializations if needed
        if (form.dataset.initialized) return;
        form.dataset.initialized = "true";

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = form.querySelector('.submit-btn');
            const originalText = btn.innerText;
            
            btn.innerText = 'TRANSMITTING...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            setTimeout(() => {
                gsap.to(form, {
                    opacity: 0,
                    y: -20,
                    duration: 0.8,
                    ease: 'power3.in',
                    onComplete: () => {
                        form.innerHTML = `
                            <div class="success-message" style="text-align: center; padding: 4rem 0;">
                                <h2 style="color: var(--accent-cyan); font-size: 2.5rem; margin-bottom: 1.5rem;">Transmission Received</h2>
                                <p style="color: var(--text-dim); font-size: 1.2rem; line-height: 1.6;">Your request has been cast into the void. <br> COLLISION will review and respond soon.</p>
                                <a href="index.html" class="submit-btn" style="display: inline-block; margin-top: 3rem; text-decoration: none;">Return Home</a>
                            </div>
                        `;
                        gsap.from('.success-message', {
                            opacity: 0,
                            y: 20,
                            duration: 1,
                            ease: 'power3.out'
                        });
                        gsap.to(form, { opacity: 1, y: 0 });
                    }
                });
            }, 2000);
        });

        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                const label = input.parentElement.querySelector('label');
                if (label) {
                    gsap.to(label, { color: '#bf5fff', x: 5, duration: 0.3 });
                }
            });
            input.addEventListener('blur', () => {
                const label = input.parentElement.querySelector('label');
                if (label) {
                    gsap.to(label, { color: '#00f5ff', x: 0, duration: 0.3 });
                }
            });
        });
    }
}

// Keep the event listener for initial direct page hit
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBooking);
} else {
    initBooking();
}
