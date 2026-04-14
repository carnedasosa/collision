import gsap from 'gsap';
import { Visualizer } from './visualizer.js';
import { AudioEngine } from './audio.js';
import { initAnimations } from './animations.js';
import { initBooking } from './booking.js';

class App {
    constructor() {
        this.visualizer = new Visualizer('canvas-container');
        this.audio = new AudioEngine();
        this.currentPath = window.location.pathname;
        this.pageContext = null; // Used for GSAP scope cleanup during navigation
        
        this.init();
        this.initRouter();
    }

    init() {
        // Initialize GSAP Animations using a context for easy cleanup
        this.pageContext = gsap.context(() => {
            initAnimations(this.visualizer);
        });

        // Start Animation Loop
        this.animate();

        // Add Transition Overlay to DOM if it doesn't exist
        this.createTransitionOverlay();

        // If starting on booking page, init booking logic
        if (this.currentPath.includes('booking.html')) {
            initBooking();
        }

        console.log('COLLISION | System Initialized');
    }

    createTransitionOverlay() {
        if (document.querySelector('.transition-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        overlay.innerHTML = `
            <div class="glitch-bar"></div>
            <div class="glitch-bar"></div>
            <div class="glitch-bar"></div>
            <img src="/assets/WHITE.svg" class="transition-logo" alt="COLLISION">
            <div class="loading-status" style="font-family: var(--font-body); font-size: 0.7rem; letter-spacing: 0.2rem; color: var(--accent-cyan); text-transform: uppercase; margin-top: 1rem;">Initializing Wave...</div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    initRouter() {
        // Intercept clicks on internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                // Ignore if it's a direct file link that's not HTML (like .pdf or .mp3)
                const url = new URL(link.href);
                const path = url.pathname;
                
                if (path !== this.currentPath && (path.endsWith('.html') || path === '/' || !path.includes('.'))) {
                    e.preventDefault();
                    this.navigateTo(link.href);
                }
            }
        });

        // Handle back/forward buttons
        window.addEventListener('popstate', () => {
            this.navigateTo(window.location.href, false);
        });
    }

    async navigateTo(url, addState = true) {
        const targetPath = new URL(url).pathname;
        this.currentPath = targetPath;

        // 1. Kick off Glitch Transition (Aggressive Tech Style)
        await this.startTransition();

        try {
            // 2. Fetch new content
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');
            const newMain = newDoc.querySelector('main');
            const newTitle = newDoc.querySelector('title').innerText;

            if (newMain) {
                // 3. Update DOM
                const currentMain = document.querySelector('main');
                currentMain.innerHTML = newMain.innerHTML;
                currentMain.className = newMain.className;

                // 3.1. Update Navbar content (to refresh 'back home' vs 'page' links)
                const newNav = newDoc.querySelector('.navbar');
                const currentNav = document.querySelector('.navbar');
                if (newNav && currentNav) {
                    currentNav.innerHTML = newNav.innerHTML;
                }

                document.title = newTitle;

                // 3.5. Inject missing stylesheets from the new page
                this.updateStyles(newDoc);

                if (addState) {
                    history.pushState({}, '', url);
                }

                // 4. Re-initialize page-specific logic
                window.scrollTo(0, 0);
                
                // Cleanup old animations before starting new ones
                if (this.pageContext) {
                    this.pageContext.revert();
                }

                // Re-run standard animations
                this.pageContext = gsap.context(() => {
                    initAnimations(this.visualizer);
                });
                
                // Re-init audio if the new page has a waveform and the old instance is broken
                if (document.querySelector('#waveform')) {
                    if (this.audio && this.audio.wavesurfer) {
                        this.audio.wavesurfer.destroy();
                    }
                    this.audio = new AudioEngine();
                }

                // If it's the booking page, run the form logic
                if (targetPath.includes('booking.html')) {
                    initBooking();
                }
                
                // Update active nav links
                this.updateActiveLinks();
            }
        } catch (error) {
            console.error('Navigation failed:', error);
            
            // Visual feedback of error before hard redirect
            const status = this.overlay.querySelector('.loading-status');
            if (status) {
                status.textContent = "Sync Error. Redirecting...";
                status.style.color = "var(--accent-purple)";
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            window.location.href = url;
        }

        // 5. End Transition
        await this.endTransition();
    }

    startTransition() {
        return new Promise((resolve) => {
            const bars = this.overlay.querySelectorAll('.glitch-bar');
            const logo = this.overlay.querySelector('.transition-logo');
            
            gsap.set(this.overlay, { pointerEvents: 'all' });
            
            const tl = gsap.timeline({ onComplete: resolve });
            
            tl.to(this.overlay, { opacity: 1, duration: 0.2 });
            tl.to(logo, { opacity: 1, duration: 0.1, yoyo: true, repeat: 5, ease: "steps(2)" });
            
            bars.forEach((bar, i) => {
                tl.fromTo(bar, 
                    { top: `${Math.random() * 100}%`, opacity: 0 },
                    { 
                        opacity: 0.8, 
                        duration: 0.1, 
                        repeat: 3, 
                        yoyo: true,
                        top: `${Math.random() * 100}%`,
                        ease: "none"
                    }, 0.1 * i);
            });
            
            // Fade out current content
            tl.to('main', { opacity: 0, scale: 0.98, duration: 0.3 }, 0);
        });
    }

    endTransition() {
        return new Promise((resolve) => {
            const logo = this.overlay.querySelector('.transition-logo');
            
            const tl = gsap.timeline({ 
                onComplete: () => {
                    gsap.set(this.overlay, { pointerEvents: 'none' });
                    resolve();
                }
            });
            
            tl.to('main', { 
                opacity: 1, 
                scale: 1, 
                duration: 0.5, 
                ease: "power4.out",
                clearProps: "all" // CRITICAL: Remove inline styles to restore backdrop-filter and z-index behavior
            });
            tl.to(this.overlay, { opacity: 0, duration: 0.4 }, "-=0.2");
            tl.to(logo, { opacity: 0, duration: 0.2, scale: 1.2 }, "-=0.4");
        });
    }

    updateActiveLinks() {
        document.querySelectorAll('.nav-item').forEach(link => {
            if (link.getAttribute('href') === this.currentPath.split('/').pop()) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    updateStyles(newDoc) {
        const newLinks = newDoc.head.querySelectorAll('link[rel="stylesheet"]');
        const currentLinks = document.head.querySelectorAll('link[rel="stylesheet"]');
        const currentHrefs = Array.from(currentLinks).map(link => link.getAttribute('href'));

        newLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!currentHrefs.includes(href)) {
                console.log(`COLLISION | Injecting missing style: ${href}`);
                const newLink = link.cloneNode(true);
                document.head.appendChild(newLink);
            }
        });
    }

    animate() {
        // Get audio data for reactive visuals
        const freqData = this.audio.getFrequencyData();
        
        // Update visualizer
        this.visualizer.update(freqData);

        requestAnimationFrame(() => this.animate());
    }
}

// Bootstrap App
window.addEventListener('DOMContentLoaded', () => {
    window.collisionApp = new App();
});
