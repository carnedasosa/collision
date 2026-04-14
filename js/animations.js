import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
    // Kill existing ScrollTriggers to prevent duplicates on navigation
    ScrollTrigger.getAll().forEach(t => t.kill());

    // Hero Text Animation - Character splitting for maximum fluidity
    const title = document.getElementById('duo-name');
    if (title) {
        const text = title.innerText;
        title.innerHTML = text.split('').map(char => `<span class="char">${char}</span>`).join('');
        
        gsap.from('#duo-name .char', {
            duration: 1.2,
            y: 30,
            autoAlpha: 0,
            skewY: 3,
            ease: 'power4.out',
            stagger: 0.04,
            force3D: true,
            clearProps: "transform" // Clean up after animation for better scrolling performance
        });
    }

    const subtitle = document.querySelector('.hero-subtitle');
    if (subtitle) {
        gsap.from(subtitle, {
            duration: 1.5,
            autoAlpha: 0,
            y: 20,
            delay: 0.8,
            ease: 'power2.out',
            force3D: true
        });
    }

    // Reveal elements on scroll
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el) => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out'
        });
    });

    // Skew sections on fast scroll
    const eventCards = document.querySelectorAll('.event-card');
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
    initAboutAnimations();
    
    // Interactive Covers Carousel
    initCoversCarousel();
    
    // Refresh ScrollTrigger to ensure correct positions for new content
    ScrollTrigger.refresh();
}

function initAboutAnimations() {
    const bios = document.querySelectorAll('.dj-bio');
    if (bios.length === 0) return;

    // 1. Split text into words for bio animation
    bios.forEach(bio => {
        // Only split if not already split
        if (!bio.querySelector('.word')) {
            const words = bio.innerText.split(' ');
            bio.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');
        }
    });

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
                scrub: 1,
                invalidateOnRefresh: true,
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
            opacity: 0.3,
            scale: 0.9,
            ease: "none"
        }, 0);

        tl.to(cards[1], {
            opacity: 1,
            scale: 1,
            ease: "none"
        }, 0);
    });
}

function initCoversCarousel() {
    const stream = document.querySelector('.covers-stream');
    let items = document.querySelectorAll('.cover-item');
    if (!stream || items.length === 0) return;

    // Clone items once to ensure smooth looping
    items.forEach(item => {
        let clone = item.cloneNode(true);
        stream.appendChild(clone);
    });

    const allItems = document.querySelectorAll('.cover-item');
    
    // Add floating effect (meteorites) with random phases
    allItems.forEach((item) => {
        gsap.to(item, {
            y: "+=15",
            duration: gsap.utils.random(2, 4),
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            delay: gsap.utils.random(0, 2)
        });
    });

    // Calculate width for seamless wrapping
    const itemWidth = items[0].offsetWidth;
    const computedStyle = getComputedStyle(items[0]);
    const marginRight = parseFloat(computedStyle.marginRight) || 0;
    // Total width of the original set of items
    const totalSetWidth = (itemWidth + marginRight) * items.length;

    let progress = 0;
    let speed = 1.2; // Auto-scroll speed
    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    // Ticker logic to manage continuous movement & wrap
    gsap.ticker.add(() => {
        if (!isDragging) {
            progress -= speed;
        } 
        
        // Wrap around logic
        if (progress <= -totalSetWidth) {
            progress += totalSetWidth;
        } else if (progress > 0) {
            progress -= totalSetWidth;
        }
        
        gsap.set(stream, { x: progress });
    });

    // Pointer events for Drag to Scroll
    const band = document.querySelector('.covers-band');
    
    band.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        currentX = progress;
        band.setPointerCapture(e.pointerId);
        // Optional: pause floating effects slightly when dragging for more "focus"
        gsap.globalTimeline.timeScale(0.8);
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
            gsap.globalTimeline.timeScale(1);
        }
    };

    band.addEventListener('pointerup', endDrag);
    band.addEventListener('pointercancel', endDrag);
}

