import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Global ScrollTrigger Optimization: Normalize scroll on touch and ignore resize jumps
if (ScrollTrigger.isTouch === 1) {
    ScrollTrigger.normalizeScroll(true);
}
ScrollTrigger.config({ ignoreMobileResize: true });

// Helper to split text into interactive spans (chars/words)
function splitText(element, type = 'char') {
    if (!element) return [];
    // Ensure we don't split multiple times
    if (element.querySelector('.gsap-split')) return element.querySelectorAll('.gsap-split');
    
    const text = element.innerText.trim();
    let splitElements;
    
    if (type === 'char') {
        element.innerHTML = text.split('').map(char => 
            `<span class="char gsap-split" style="display:inline-block">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
        splitElements = element.querySelectorAll('.char');
    } else {
        element.innerHTML = text.split(/\s+/).map(word => 
            `<span class="word gsap-split" style="display:inline-block">${word}</span>`
        ).join(' ');
        splitElements = element.querySelectorAll('.word');
    }
    return splitElements;
}

export function initAnimations(visualizer) {
    // Note: ScrollTrigger.kill() is now handled by gsap.context().revert() in main.js
    // to allow for cleaner SPA transitions and scope-specific cleanup.

    // Hero Master Timeline - Orchestrating the entry sequence
    const title = document.getElementById('duo-name');
    const subtitle = document.querySelector('.hero-subtitle');
    
    if (title || subtitle) {
        const heroTl = gsap.timeline({
            defaults: { ease: 'power4.out', force3D: true }
        });

        if (title) {
            const chars = splitText(title, 'char');
            heroTl.from(chars, {
                duration: 1.2,
                y: 30,
                autoAlpha: 0,
                skewY: 3,
                stagger: 0.04,
                clearProps: "transform"
            });
        }

        if (subtitle) {
            heroTl.from(subtitle, {
                duration: 1.5,
                autoAlpha: 0,
                y: 20,
                ease: 'power2.out'
            }, "-=0.8"); // Overlap with title stagger
        }
    }

    // Reveal elements on scroll - Using ScrollTrigger.batch for massive performance gains
    const reveals = gsap.utils.toArray('.reveal');
    if (reveals.length > 0) {
        // Optimization: Pre-set will-change for these elements
        gsap.set(reveals, { willChange: "transform, opacity" });
        
        ScrollTrigger.batch(reveals, {
            onEnter: batch => gsap.to(batch, { 
                autoAlpha: 1, 
                y: 0, 
                stagger: 0.15, 
                duration: 1, 
                ease: 'power3.out',
                overwrite: true 
            }),
            onLeaveBack: batch => gsap.set(batch, { autoAlpha: 0, y: 30, overwrite: true }),
            start: 'top 85%'
        });
    }

    // Skew sections on fast scroll - Performance optimized with quickSetter
    const eventCards = gsap.utils.toArray('.event-card');
    if (eventCards.length > 0) {
        let proxy = { skew: 0 },
            skewSetter = gsap.quickSetter(".event-card", "skewY", "deg"), // fast
            clamp = gsap.utils.clamp(-20, 20);

        ScrollTrigger.create({
            onUpdate: (self) => {
                let skew = clamp(self.getVelocity() / -300);
                if (Math.abs(skew) > Math.abs(proxy.skew)) {
                    proxy.skew = skew;
                    gsap.to(proxy, {
                        skew: 0,
                        duration: 0.8,
                        ease: "power3",
                        overwrite: true,
                        onUpdate: () => skewSetter(proxy.skew)
                    });
                }
            }
        });
    }

    // Parallax effect on Three.js container
    if (document.getElementById('canvas-container')) {
        gsap.to('#canvas-container', {
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: true
            },
            y: 100,
            ease: 'none'
        });
    }

    // About Section Animations
    initAboutAnimations(visualizer);
    
    // Interactive Covers Carousel
    initCoversCarousel();
    
    // Refresh ScrollTrigger to ensure correct positions for new content
    ScrollTrigger.refresh();
}

function initAboutAnimations(visualizer) {
    const bios = document.querySelectorAll('.dj-bio');
    if (bios.length === 0) return;

    // 1. Split text into words for bio animation using helper
    bios.forEach(bio => splitText(bio, 'word'));

    let mm = gsap.matchMedia();

    // Desktop: Entry animations
    mm.add("(min-width: 769px)", () => {
        const leftPhoto = document.querySelector('.dj-photo-left');
        const rightPhoto = document.querySelector('.dj-photo-right');

        if (leftPhoto) {
            gsap.set(leftPhoto, { x: -80, opacity: 0 });
            gsap.to(leftPhoto, {
                scrollTrigger: {
                    trigger: leftPhoto,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                x: 0,
                opacity: 1,
                duration: 1.2,
                ease: 'power3.out'
            });
        }

        if (rightPhoto) {
            gsap.set(rightPhoto, { x: 80, opacity: 0 });
            gsap.to(rightPhoto, {
                scrollTrigger: {
                    trigger: rightPhoto,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                x: 0,
                opacity: 1,
                duration: 1.2,
                ease: 'power3.out'
            });
        }

        // Bio word reveals
        bios.forEach(bio => {
            const words = bio.querySelectorAll('.word');
            gsap.set(words, { y: 10, opacity: 0 });
            gsap.to(words, {
                scrollTrigger: {
                    trigger: bio,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 0,
                opacity: 1,
                stagger: 0.05,
                duration: 0.8,
                ease: 'power2.out'
            });
        });
    });

    // Mobile: Card Swap on scroll
    mm.add("(max-width: 768px)", () => {
        const container = document.querySelector('.about-container');
        const cards = document.querySelectorAll('.dj-card');
        
        if (!container || cards.length < 2) return;

        // Reset and establish clean initial states for mobile
        gsap.set(['.dj-photo-left', '.dj-photo-right'], { x: 0, opacity: 1, scale: 1 });
        gsap.set('.word', { y: 0, opacity: 1 });
        gsap.set(container, { x: 0 });
        gsap.set(cards[0], { opacity: 1, scale: 1 });
        gsap.set(cards[1], { opacity: 0.3, scale: 0.9 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".about",
                pin: true,
                start: "top top",
                end: () => "+=" + window.innerHeight,
                scrub: 0.5, // Reduced from 1 for tighter tracking on touch
                invalidateOnRefresh: true,
                anticipatePin: 1,
                snap: {
                    snapTo: 1,
                    duration: { min: 0.2, max: 0.5 }, // Faster snapping
                    delay: 0, // Snap instantly when scroll stops
                    ease: "power2.out"
                },
                onUpdate: (self) => {
                    // Trigger glitch and theme swap at 50% scroll
                    if (visualizer) {
                        const prog = self.progress;
                        if (prog > 0.45 && prog < 0.55 && !self._glitched) {
                            visualizer.triggerGlitch();
                            self._glitched = true;
                        } else if ((prog < 0.4 || prog > 0.6) && self._glitched) {
                            self._glitched = false;
                        }
                        
                        // Shift visualizer theme based on active card
                        if (prog < 0.5) visualizer.setTheme(0);
                        else visualizer.setTheme(1);
                    }
                }
            }
        });

        tl.to(container, {
            x: () => {
                const cardWidth = cards[0].offsetWidth;
                const gap = parseFloat(window.getComputedStyle(container).gap);
                return -(cardWidth + gap);
            },
            ease: "none"
        }, 0);

        tl.to(cards[0], {
            opacity: 0.2,
            scale: 0.8,
            rotateY: -15, // 3D rotation away
            ease: "none"
        }, 0);

        tl.to(cards[1], {
            opacity: 1,
            scale: 1,
            rotateY: 0, // 3D rotation to center
            ease: "none"
        }, 0);
        
        // Inner image parallax (moving opposite to card)
        tl.to('.dj-photo-left', { x: 30, ease: "none" }, 0);
        tl.to('.dj-photo-right', { x: -30, ease: "none" }, 0);
    });
}

function initCoversCarousel() {
    const stream = document.querySelector('.covers-stream');
    let items = document.querySelectorAll('.cover-item');
    if (!stream || items.length === 0) return;

    // Clone items once to ensure smooth looping (using dataset as guard)
    if (stream.dataset.cloned) {
        // Just kill existing floating tweens before re-initializing
        gsap.killTweensOf('.cover-item');
    } else {
        items.forEach(item => {
            let clone = item.cloneNode(true);
            stream.appendChild(clone);
        });
        stream.dataset.cloned = "true";
    }

    const allItems = document.querySelectorAll('.cover-item');
    
    // Add floating effect (meteorites) with random phases
    // We store them to scope the timeScale later
    const floatingTweens = [];
    allItems.forEach((item) => {
        floatingTweens.push(
            gsap.to(item, {
                y: "+=15",
                duration: gsap.utils.random(2, 4),
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
                delay: gsap.utils.random(0, 2)
            })
        );
    });

    // Calculate width for seamless wrapping
    const itemWidth = items[0].offsetWidth;
    const computedStyle = getComputedStyle(items[0]);
    const marginRight = parseFloat(computedStyle.marginRight) || 0;
    const totalSetWidth = (itemWidth + marginRight) * items.length;

    let progress = 0;
    let speed = 1.2; // Auto-scroll speed
    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    // Total width for wrapping
    const wrap = gsap.utils.wrap(-totalSetWidth, 0);

    // Ticker logic to manage continuous movement & wrap
    gsap.ticker.add(() => {
        if (!isDragging) {
            progress -= speed;
        } 
        
        // Wrap around logic using utility
        progress = wrap(progress);
        
        gsap.set(stream, { x: progress });
    });

    // Pointer events for Drag to Scroll
    const band = document.querySelector('.covers-band');
    if (band) {
        band.addEventListener('pointerdown', (e) => {
            isDragging = true;
            startX = e.clientX;
            currentX = progress;
            band.setPointerCapture(e.pointerId);
            // Optimization: slow down only the carousel's floating effects during drag
            floatingTweens.forEach(t => t.timeScale(0.3));
        });

        band.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            // Multiply dx slightly for more responsive swipe feel
            progress = currentX + (dx * 1.5);
        });

        const endDrag = (e) => {
            if(isDragging) {
                isDragging = false;
                band.releasePointerCapture(e.pointerId);
                floatingTweens.forEach(t => t.timeScale(1));
            }
        };

        band.addEventListener('pointerup', endDrag);
        band.addEventListener('pointercancel', endDrag);
    }
}

