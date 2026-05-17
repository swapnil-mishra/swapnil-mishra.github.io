/*========================================================
  Swapnil Mishra — portfolio interactions
  Vanilla JS, no jQuery. IIFE keeps the global scope clean.
=========================================================*/
(() => {
    'use strict';

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    /* ===== BOOT SPLASH WITH LOAD PROGRESS =====
       Tracks real page-load progress from <img> load events + window.load,
       blended with a soft tick so the bar never feels stuck. Stays visible
       for a minimum duration so the user reads the percentage. */
    const splashEl = $('#boot-splash');
    if (splashEl) {
        const SPLASH_MIN_MS = 1100;          // min total visible time
        const HOLD_AFTER_100_MS = 320;       // brief beat after hitting 100%
        const RING_CIRC = 289;               // 2*pi*46
        const ringFill = $('.boot-progress-fill');
        const pctText  = $('#boot-percent');

        let displayedPct = 0;
        let targetPct = 0;

        const renderPct = () => {
            if (ringFill) ringFill.style.strokeDashoffset = String(RING_CIRC * (1 - displayedPct / 100));
            if (pctText)  pctText.textContent = String(Math.floor(displayedPct));
        };
        const setTarget = (p) => {
            targetPct = Math.max(targetPct, Math.min(100, p));
        };

        // ---- Real signal: image load progress (each image contributes equally) ----
        const images = Array.from(document.images);
        const totalImages = images.length;
        let loadedImages = 0;
        const IMG_RANGE = 75; // images contribute 10% → 85%

        const refreshFromImages = () => {
            if (totalImages === 0) return;
            const pct = 10 + (loadedImages / totalImages) * IMG_RANGE;
            setTarget(pct);
        };

        images.forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
                const done = () => { loadedImages++; refreshFromImages(); };
                img.addEventListener('load',  done, { once: true });
                img.addEventListener('error', done, { once: true });
            }
        });
        setTarget(10);          // JS has started → at least 10%
        refreshFromImages();    // count any already-cached images

        // ---- Soft tick: smoothly drift displayed toward target, never stalls ----
        let drift = 0; // ensures we creep even if no events fire for a while
        const tick = setInterval(() => {
            drift = Math.min(85, drift + 0.6); // organic creep up to 85% just in case
            setTarget(drift);
            // ease displayed toward target
            const delta = targetPct - displayedPct;
            if (Math.abs(delta) > 0.05) {
                displayedPct += delta * 0.2;
                renderPct();
            }
        }, 60);

        // ---- Finalize on window.load ----
        const splashStart = performance.now();
        const finalize = () => {
            setTarget(100);
            // Quickly snap displayed to 100
            const snap = setInterval(() => {
                displayedPct += Math.max(1, (100 - displayedPct) * 0.35);
                if (displayedPct >= 99.5) {
                    displayedPct = 100;
                    renderPct();
                    clearInterval(snap);
                    clearInterval(tick);
                    const elapsed = performance.now() - splashStart;
                    const wait = Math.max(HOLD_AFTER_100_MS, SPLASH_MIN_MS - elapsed);
                    setTimeout(() => {
                        splashEl.classList.add('boot-hidden');
                        setTimeout(() => splashEl.remove(), 650);
                    }, wait);
                } else {
                    renderPct();
                }
            }, 28);
        };

        if (document.readyState === 'complete') finalize();
        else window.addEventListener('load', finalize, { once: true });

        // First paint
        renderPct();
    }

    /* ===== MOBILE NAV ===== */
    const navMenu = $('#nav-menu');
    const navToggle = $('#nav-toggle');
    const navClose = $('#nav-close');

    navToggle?.addEventListener('click', () => navMenu.classList.add('show-menu'));
    navClose?.addEventListener('click', () => navMenu.classList.remove('show-menu'));
    $$('.nav_link').forEach(link =>
        link.addEventListener('click', () => navMenu.classList.remove('show-menu'))
    );

    /* ===== THEME TOGGLE ===== */
    const themeButton = $('#theme-button');
    const themeIcon = themeButton?.querySelector('i');
    const STORAGE_KEY = 'sm-theme';

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (themeIcon) {
            // Sun shown on dark theme (click → light), moon on light theme (click → dark)
            themeIcon.classList.remove('uil-sun', 'uil-moon');
            themeIcon.classList.add(theme === 'dark' ? 'uil-sun' : 'uil-moon');
        }
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
            'content',
            theme === 'dark' ? '#0a0e14' : '#f7f8fa'
        );
    };

    // Default to dark always; only user's explicit toggle (saved in
    // localStorage) can switch to light. System preference is ignored.
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    applyTheme(savedTheme === 'light' ? 'light' : 'dark');

    themeButton?.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
    });

    /* ===== TYPED HERO EFFECT ===== */
    const typedEl = $('#typed');
    const typedPhrases = [
        'distributed systems',
        'cloud-native APIs',
        'ASP.NET Core services',
        'CI/CD pipelines',
        'Azure platforms',
        'observable software',
    ];

    if (typedEl) {
        let phraseIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const tick = () => {
            const phrase = typedPhrases[phraseIndex];
            typedEl.textContent = phrase.slice(0, charIndex);

            if (!deleting && charIndex < phrase.length) {
                charIndex++;
                setTimeout(tick, 70 + Math.random() * 40);
            } else if (deleting && charIndex > 0) {
                charIndex--;
                setTimeout(tick, 35);
            } else {
                deleting = !deleting;
                if (!deleting) phraseIndex = (phraseIndex + 1) % typedPhrases.length;
                setTimeout(tick, deleting ? 1400 : 350);
            }
        };
        tick();
    }

    /* ===== KNOWLEDGE-BASE FLIP CARDS =====
       Hover triggers the 180° Y-axis flip via CSS. On touch devices
       (no hover), tap toggles an .is-flipped class. Escape unflips all. */
    const flipCards = $$('.services_content');
    flipCards.forEach(card => {
        const flipper = card.querySelector('.kb-flipper');
        if (!flipper) return;
        const toggle = (e) => {
            e.preventDefault();
            // Close other open cards
            flipCards.forEach(c => { if (c !== card) c.classList.remove('is-flipped'); });
            card.classList.toggle('is-flipped');
        };
        flipper.addEventListener('click', toggle);
        flipper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') toggle(e);
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') flipCards.forEach(c => c.classList.remove('is-flipped'));
    });

    /* ===== SKILLS ACCORDION ===== */
    $$('.skills_header').forEach(header => {
        header.addEventListener('click', () => {
            const parent = header.parentElement;
            const wasOpen = parent.classList.contains('skills_open');
            $$('.skills_content').forEach(c => {
                c.classList.remove('skills_open');
                c.classList.add('skills_close');
                c.querySelector('.skills_header')?.setAttribute('aria-expanded', 'false');
            });
            if (!wasOpen) {
                parent.classList.remove('skills_close');
                parent.classList.add('skills_open');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });

    /* ===== SKILL ICON TOOLTIP (single shared element) ===== */
    const tooltip = $('#tooltip');
    if (tooltip) {
        $$('.icon-skills').forEach(icon => {
            icon.addEventListener('mouseenter', (e) => {
                const text = e.currentTarget.dataset.tip;
                if (!text) return;
                tooltip.textContent = text;
                tooltip.style.display = 'block';
            });
            icon.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.clientX + 12) + 'px';
                tooltip.style.top = (e.clientY - 32) + 'px';
            });
            icon.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
        });
    }

    /* ===== QUALIFICATION TABS ===== */
    const qTabs = $$('[data-target]');
    const qPanels = $$('[data-content]');
    qTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = document.querySelector(tab.dataset.target);
            qPanels.forEach(p => p.classList.remove('qualification_active'));
            qTabs.forEach(t => {
                t.classList.remove('qualification_active');
                t.setAttribute('aria-selected', 'false');
            });
            target?.classList.add('qualification_active');
            tab.classList.add('qualification_active');
            tab.setAttribute('aria-selected', 'true');
        });
    });

    /* ===== PORTFOLIO — GITHUB API ===== */
    const USERNAME = 'swapnil-mishra';
    const repoList = $('#repo-list');
    const statsEl = $('#stats');
    let allRepos = [];

    const formatNumber = (n) => new Intl.NumberFormat().format(n);

    const renderRepos = () => {
        if (!repoList) return;
        repoList.innerHTML = '';
        if (allRepos.length === 0) {
            repoList.innerHTML = '<p style="text-align:center;color:var(--text-dim);font-family:var(--font-mono);padding:2rem">No repositories to show.</p>';
            return;
        }

        const frag = document.createDocumentFragment();
        allRepos.forEach(repo => {
            const card = document.createElement('article');
            card.className = 'repo-card';

            const title = document.createElement('h3');
            title.textContent = repo.name;

            const desc = document.createElement('p');
            desc.textContent = repo.description || 'No description available.';

            const meta = document.createElement('div');
            meta.className = 'repo-meta';
            const lang = repo.language ? `<span>● ${repo.language}</span>` : '';
            meta.innerHTML = `${lang}<span>★ ${formatNumber(repo.stargazers_count)}</span><span>⑂ ${formatNumber(repo.forks_count)}</span>`;

            const link = document.createElement('a');
            link.href = repo.html_url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'View repository';

            card.append(title, desc, meta, link);
            frag.appendChild(card);
        });
        repoList.appendChild(frag);
    };

    const fetchRepos = async () => {
        try {
            const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
            if (!res.ok) throw new Error(`GitHub API ${res.status}`);
            const data = await res.json();
            // Sort by stars desc, then updated desc
            allRepos = data.sort((a, b) =>
                b.stargazers_count - a.stargazers_count ||
                new Date(b.updated_at) - new Date(a.updated_at)
            );
            renderRepos();
        } catch (err) {
            console.warn('Could not fetch repos:', err);
            if (repoList) {
                repoList.innerHTML = '<p style="text-align:center;color:var(--text-dim);font-family:var(--font-mono)">Could not load repositories right now.</p>';
            }
        }
    };

    const fetchStats = async () => {
        if (!statsEl) return;
        try {
            const res = await fetch(`https://api.github.com/users/${USERNAME}`);
            if (!res.ok) throw new Error(`GitHub API ${res.status}`);
            const u = await res.json();
            statsEl.innerHTML = `
                <p>👥 ${formatNumber(u.followers)} followers · 🔄 ${formatNumber(u.following)} following</p>
                <p>📂 ${formatNumber(u.public_repos)} public repositories</p>
            `;
        } catch (err) {
            console.warn('Could not fetch user stats:', err);
        }
    };

    if (repoList) {
        fetchStats();
        fetchRepos();
    }

    /* ===== CERTIFICATIONS SWIPER =====
       Init-and-reinit wrapped in a function so the swiper can be
       refreshed after the slide content changes (e.g., loaded from JSON). */
    let certSwiper = null;
    const initCertSwiper = () => {
        if (typeof Swiper === 'undefined') return;
        certSwiper?.destroy?.(true, true);
        certSwiper = new Swiper('.certification_container', {
            loop: true,
            grabCursor: true,
            spaceBetween: 32,
            pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: true },
            breakpoints: {
                568: { slidesPerView: 2 },
                992: { slidesPerView: 2 },
            },
        });
    };
    initCertSwiper();

    /* ===== SCROLL: header bg, scroll-up, active link ===== */
    const header = $('#header');
    const scrollUp = $('#scroll-up');
    const sectionsWithId = $$('section[id]');

    const onScroll = () => {
        const y = window.scrollY;
        header?.classList.toggle('scroll-header', y >= 80);
        scrollUp?.classList.toggle('show-scroll', y >= 560);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Active link via IntersectionObserver (cheaper than scroll math) */
    if ('IntersectionObserver' in window) {
        const setActiveLink = (id) => {
            $$('.nav_menu a').forEach(a => a.classList.toggle('active-link', a.getAttribute('href') === `#${id}`));
        };
        const navObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActiveLink(entry.target.id);
            });
        }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
        sectionsWithId.forEach(s => navObs.observe(s));
    }

    /* ===== AOS-LIKE REVEAL =====
       Exposed via `observeAOS` so re-rendered sections can re-attach. */
    let aosObserver = null;
    if ('IntersectionObserver' in window) {
        aosObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        $$('[data-aos]').forEach(el => aosObserver.observe(el));
    } else {
        $$('[data-aos]').forEach(el => el.classList.add('aos-animate'));
    }
    const observeAOS = (root) => {
        if (!aosObserver) {
            (root || document).querySelectorAll('[data-aos]').forEach(el => el.classList.add('aos-animate'));
            return;
        }
        (root || document).querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));
    };

    /* ===== COUNT-UP (about stats) =====
       Counters with a `data-since="YYYY-MM-DD"` attribute compute their
       target dynamically as years elapsed since that date (rounded). */
    $$('.counting[data-since]').forEach(el => {
        const since = new Date(el.dataset.since);
        if (Number.isNaN(since.getTime())) return;
        const yearsElapsed = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        el.dataset.count = String(Math.round(yearsElapsed));
    });

    const animateCount = (el) => {
        const target = Number(el.dataset.count) || 0;
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        };
        requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
        const countObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        $$('.counting').forEach(el => countObs.observe(el));
    } else {
        $$('.counting').forEach(animateCount);
    }

    /* ===== EXPERIENCE ROAD — car follows scroll =====
       For each qualification panel, inject a road track + car. As the
       user scrolls past the section, --progress (0..1) is updated and
       the car slides down the road. */
    const carSvg = `
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="9" y="3" width="14" height="26" rx="4" fill="currentColor"/>
            <rect x="11" y="5" width="10" height="6" rx="1.5" fill="rgba(0,0,0,0.55)"/>
            <rect x="11" y="20" width="10" height="6" rx="1.5" fill="rgba(0,0,0,0.55)"/>
            <rect x="11" y="13" width="10" height="5" rx="0.5" fill="rgba(255,255,255,0.12)"/>
            <circle cx="7"  cy="9"  r="2" fill="#0a0e14"/>
            <circle cx="25" cy="9"  r="2" fill="#0a0e14"/>
            <circle cx="7"  cy="23" r="2" fill="#0a0e14"/>
            <circle cx="25" cy="23" r="2" fill="#0a0e14"/>
        </svg>`;

    const qualPanels = $$('.qualification_content');
    const injectRoad = (panel) => {
        if (panel.querySelector(':scope > .road-track')) return; // already injected
        const track = document.createElement('div');
        track.className = 'road-track';
        track.innerHTML = '<div class="road-fill"></div>';
        const car = document.createElement('div');
        car.className = 'road-car';
        car.innerHTML = carSvg;
        panel.prepend(track, car);
    };
    qualPanels.forEach(injectRoad);

    const updateRoadProgress = () => {
        const winH = window.innerHeight;
        qualPanels.forEach(panel => {
            if (panel.offsetParent === null) return; // hidden tab
            const rect = panel.getBoundingClientRect();
            // Progress = how much of the panel has scrolled past the viewport's mid-zone.
            // 0 when panel top reaches 70% of viewport, 1 when panel bottom reaches 30%.
            const startY = winH * 0.7;
            const endY   = winH * 0.3;
            const total = (rect.height) + (startY - endY);
            const traveled = startY - rect.top;
            const progress = Math.max(0, Math.min(1, traveled / total));
            panel.style.setProperty('--progress', progress.toFixed(3));
        });
    };

    window.addEventListener('scroll', updateRoadProgress, { passive: true });
    window.addEventListener('resize', updateRoadProgress);
    updateRoadProgress();
    // Re-run after tab switches between Experience/Achievements
    qTabs.forEach(tab => tab.addEventListener('click', () => setTimeout(updateRoadProgress, 50)));

    /* ===== HERO AVATAR INTRO =====
       Starts at viewport center, then slides to its final right-column
       position with a scale-down. Skipped on small viewports and when
       prefers-reduced-motion is set. */
    const allowMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heroAvatar = $('.home_avatar');
    if (heroAvatar) {
        if (window.innerWidth >= 900 && allowMotion) {
            requestAnimationFrame(() => {
                const rect = heroAvatar.getBoundingClientRect();
                const offsetX = (window.innerWidth / 2) - (rect.left + rect.width / 2);
                heroAvatar.style.transition = 'none';
                heroAvatar.style.transform = `translateX(${offsetX}px) scale(1.15)`;
                heroAvatar.classList.add('intro-ready');
                // Force reflow so the next transition kicks in
                heroAvatar.offsetHeight;
                requestAnimationFrame(() => {
                    heroAvatar.style.transition = 'transform 1.5s cubic-bezier(0.65, 0, 0.35, 1)';
                    heroAvatar.style.transform = '';
                });
                setTimeout(() => {
                    heroAvatar.style.transition = '';
                    heroAvatar.style.transform = '';
                }, 1700);
            });
        } else {
            heroAvatar.classList.add('intro-ready');
        }
    }

    /* ===== BACKGROUND CANVAS =====
       Dark theme: classic matrix rain (falling katakana/code).
       Light theme: gentle floating code symbols ({}, </>, =>, ...).
       Pauses on tab hidden, disabled on prefers-reduced-motion. */
    if (allowMotion) {
        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-rain';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const fontSize = 14;
        const rainPool = 'アイウエオカキクケコサシスセソタチツテト0123456789</>{}[];=+*&^%$#@!~?'.split('');
        const driftPool = ['{', '}', '</>', '()', '=>', '[]', ';', '//', '++', '<>', '&&', '||', '!==', '?.', '...', '/**/', '0x'];

        let columns = 0;
        let drops = [];
        let particles = [];

        const seedDrops = () => {
            columns = Math.ceil(canvas.width / fontSize);
            drops = Array.from({ length: columns }, () => Math.random() * (canvas.height / fontSize));
        };
        const seedParticles = () => {
            const count = Math.round((canvas.width * canvas.height) / 24000); // density ~ area
            particles = Array.from({ length: Math.max(40, Math.min(110, count)) }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25 - 0.05,
                size: 13 + Math.random() * 9,
                alpha: 0.18 + Math.random() * 0.32,
                symbol: driftPool[(Math.random() * driftPool.length) | 0],
            }));
        };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            seedDrops();
            seedParticles();
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

        const drawRain = () => {
            ctx.fillStyle = 'rgba(10, 14, 20, 0.075)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${fontSize}px JetBrains Mono, monospace`;
            ctx.fillStyle = '#00ff9d';
            for (let i = 0; i < drops.length; i++) {
                const ch = rainPool[(Math.random() * rainPool.length) | 0];
                ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.972) drops[i] = 0;
                drops[i] += 0.55;
            }
        };

        const drawParticles = () => {
            // Clear instead of fade — keeps the light background clean
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of particles) {
                ctx.font = `${p.size}px JetBrains Mono, monospace`;
                ctx.fillStyle = `rgba(0, 135, 90, ${p.alpha})`;
                ctx.fillText(p.symbol, p.x, p.y);
                p.x += p.vx;
                p.y += p.vy;
                // wrap around edges
                if (p.x < -30) p.x = canvas.width + 30;
                else if (p.x > canvas.width + 30) p.x = -30;
                if (p.y < -30) p.y = canvas.height + 30;
                else if (p.y > canvas.height + 30) p.y = -30;
            }
        };

        const draw = () => { isLight() ? drawParticles() : drawRain(); };

        let bgTimer = setInterval(draw, 48);
        document.addEventListener('visibilitychange', () => {
            clearInterval(bgTimer);
            if (!document.hidden) bgTimer = setInterval(draw, 48);
        });
        // Clear the canvas on theme switch so trails from the other mode don't linger
        new MutationObserver(() => ctx.clearRect(0, 0, canvas.width, canvas.height))
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    /* ===== 3D TILT ON CARDS =====
       Hover-capable, motion-allowed devices only. Applied to Knowledge
       Base cards immediately and to repo cards after each render. */
    const canHover = window.matchMedia('(hover: hover)').matches;

    function applyTilt(elements, intensity = 6) {
        if (!canHover || !allowMotion) return;
        elements.forEach(card => {
            if (card.dataset.tilted) return;
            card.dataset.tilted = '1';
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                const tiltX = (y - 0.5) * -intensity;
                const tiltY = (x - 0.5) * intensity;
                card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.04)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }
    // Knowledge Base cards use flip-on-hover now, so no cursor tilt there.
    applyTilt($$('.terminal'), 3.5); // softer tilt on the larger hero container
    // NOTE: .certification_content shares the .swiper-slide class —
    // applying inline transform would conflict with Swiper's slide positioning.

    /* Repo cards are rendered async after the GitHub fetch. Re-apply tilt
       whenever new cards arrive (initial fetch and Top-5 / More tab clicks). */
    if ('MutationObserver' in window && repoList) {
        new MutationObserver(() => applyTilt($$('.repo-card')))
            .observe(repoList, { childList: true });
    }

    /* ===== SKILLS BOOT-UP REVEAL ===== */
    if ('IntersectionObserver' in window) {
        const skillsSection = $('.skills');
        if (skillsSection) {
            new IntersectionObserver((entries, obs) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        skillsSection.classList.add('is-loaded');
                        obs.unobserve(skillsSection);
                    }
                });
            }, { threshold: 0.15 }).observe(skillsSection);
        }
    }

    /* ===== COMMAND PALETTE =====
       Press `/` (when not typing in an input) to open a faux-terminal
       command palette. Supports keyboard navigation. */
    (function initCmdK() {
        const goTo = (sel) => document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const openExt = (url) => window.open(url, '_blank', 'noopener,noreferrer');

        const commands = [
            { id: 'about',       label: 'Go to About',          desc: '#about',          action: () => goTo('#about') },
            { id: 'knowledge',   label: 'Go to Knowledge Base', desc: '#services',       action: () => goTo('#services') },
            { id: 'skills',      label: 'Go to Skills',         desc: '#skills',         action: () => goTo('#skills') },
            { id: 'experience',  label: 'Go to Experience',     desc: '#qualification',  action: () => goTo('#qualification') },
            { id: 'portfolio',   label: 'Go to Portfolio',      desc: '#portfolio',      action: () => goTo('#portfolio') },
            { id: 'certs',       label: 'Go to Certifications', desc: '#certifications', action: () => goTo('#certifications') },
            { id: 'contact',     label: 'Go to Contact',        desc: '#contact',        action: () => goTo('#contact') },
            { id: 'theme',       label: 'Toggle theme',         desc: 'dark ⇄ light',    action: () => themeButton?.click() },
            { id: 'github',      label: 'Open GitHub',          desc: 'github.com/swapnil-mishra', action: () => openExt('https://github.com/swapnil-mishra') },
            { id: 'linkedin',    label: 'Open LinkedIn',        desc: '/in/swapnil-mishra',       action: () => openExt('https://www.linkedin.com/in/swapnil-mishra/') },
            { id: 'email',       label: 'Send email',           desc: 'swapnil8mishra@gmail.com', action: () => { window.location.href = 'mailto:swapnil8mishra@gmail.com'; } },
            { id: 'top',         label: 'Scroll to top',        desc: '#home',           action: () => goTo('#home') },
        ];

        let root, input, list;
        let activeIndex = 0;
        let filtered = commands;
        let lastFocus = null;

        const create = () => {
            root = document.createElement('div');
            root.className = 'cmdk';
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-modal', 'true');
            root.setAttribute('aria-label', 'Command palette');
            root.innerHTML = `
                <div class="cmdk_box">
                    <div class="cmdk_input-wrap">
                        <span class="cmdk_prompt">❯</span>
                        <input type="text" class="cmdk_input" placeholder="Type a command…  (esc to close)" autocomplete="off" spellcheck="false" />
                    </div>
                    <ul class="cmdk_list" role="listbox"></ul>
                    <div class="cmdk_hint">
                        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                        <span><kbd>↵</kbd> execute</span>
                        <span><kbd>esc</kbd> close</span>
                        <span style="margin-left:auto"><kbd>/</kbd> open</span>
                    </div>
                </div>
            `;
            document.body.appendChild(root);
            input = root.querySelector('.cmdk_input');
            list = root.querySelector('.cmdk_list');

            input.addEventListener('input', render);
            input.addEventListener('keydown', onKey);
            root.addEventListener('click', (e) => { if (e.target === root) close(); });
        };

        const open = () => {
            if (!root) create();
            lastFocus = document.activeElement;
            root.classList.add('open');
            input.value = '';
            render();
            requestAnimationFrame(() => input.focus());
        };
        const close = () => {
            if (!root) return;
            root.classList.remove('open');
            lastFocus?.focus?.();
        };

        const render = () => {
            const q = (input.value || '').toLowerCase().trim();
            filtered = q
                ? commands.filter(c => c.id.includes(q) || c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
                : commands;
            activeIndex = 0;
            if (!filtered.length) {
                list.innerHTML = '<li class="cmdk_empty">No matches — try \'about\', \'skills\', \'theme\'…</li>';
                return;
            }
            list.innerHTML = filtered.map((c, i) => `
                <li class="cmdk_item${i === 0 ? ' active' : ''}" data-i="${i}" role="option">
                    <span class="cmdk_label">${c.label}</span>
                    <span class="cmdk_desc">${c.desc}</span>
                </li>
            `).join('');
            list.querySelectorAll('.cmdk_item').forEach(li => {
                li.addEventListener('click', () => exec(filtered[Number(li.dataset.i)]));
                li.addEventListener('mouseenter', () => {
                    activeIndex = Number(li.dataset.i);
                    updateActive();
                });
            });
        };

        const updateActive = () => {
            list.querySelectorAll('.cmdk_item').forEach((li, i) => li.classList.toggle('active', i === activeIndex));
            list.querySelector('.cmdk_item.active')?.scrollIntoView({ block: 'nearest' });
        };

        const onKey = (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filtered.length - 1); updateActive(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateActive(); }
            else if (e.key === 'Enter') { e.preventDefault(); if (filtered[activeIndex]) exec(filtered[activeIndex]); }
            else if (e.key === 'Escape') { e.preventDefault(); close(); }
        };

        const exec = (cmd) => { close(); setTimeout(() => cmd.action(), 60); };

        document.addEventListener('keydown', (e) => {
            const t = e.target;
            const isEditable = t && (
                t.tagName === 'INPUT' ||
                t.tagName === 'TEXTAREA' ||
                t.isContentEditable
            );
            if (e.key === '/' && !isEditable && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                open();
            }
        });
    })();

    /* ===== Footer year ===== */
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* =====================================================================
       PROFILE DATA SYNC — data/profile.json is the source of truth.
       Static HTML in index.html is the fallback. JSON-driven content
       overrides on successful fetch. Merge model: JSON entries fully
       replace the matching section. Static HTML stays if fetch fails.
       ===================================================================== */

    const escapeHtml = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const buildExperienceEntry = (item, i) => {
        const leftSide = i % 2 === 0;
        const content = `
            <div>
                ${item.logo ? `<img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.company)} logo" class="qualification_img" loading="lazy" />` : ''}
                <h3 class="qualification_title">${escapeHtml(item.company)}</h3>
                <span class="qualification_subtitle">${escapeHtml(item.role)}</span>
                <div class="qualification_calendar">
                    <i class="uil uil-calendar-alt" aria-hidden="true"></i> ${escapeHtml(item.from)} — ${escapeHtml(item.to)}
                </div>
            </div>`;
        const rounder = '<div><span class="qualification_rounder"></span></div>';
        const body = leftSide ? `${content}${rounder}` : `<div></div>${rounder}${content}`;
        return `<div class="qualification_data" data-aos>${body}</div>`;
    };

    const buildAchievementEntry = (item, i) => {
        const leftSide = i % 2 === 0;
        const subtitle = item.subtitle ? `<span class="qualification_subtitle">${escapeHtml(item.subtitle)}</span>` : '';
        const content = `
            <div>
                <h3 class="qualification_title">${escapeHtml(item.title)}</h3>
                ${subtitle}
                <div class="qualification_calendar"><i class="uil uil-calendar-alt" aria-hidden="true"></i> ${escapeHtml(item.dates)}</div>
            </div>`;
        const rounder = '<div><span class="qualification_rounder"></span></div>';
        const body = leftSide ? `${content}${rounder}` : `<div></div>${rounder}${content}`;
        return `<div class="qualification_data" data-aos>${body}</div>`;
    };

    const buildCertSlide = (c) => `
        <div class="certification_content swiper-slide">
            <div class="certification_header">
                <img src="${escapeHtml(c.img)}" alt="${escapeHtml(c.name)} badge" class="certification_img" loading="lazy" />
                <div>
                    <h3 class="certification_name">${escapeHtml(c.name)}</h3>
                    <span class="certification_client">${escapeHtml(c.issuer)}</span>
                </div>
            </div>
        </div>`;

    const renderTimeline = (panel, html) => {
        if (!panel) return;
        panel.innerHTML = html;
        injectRoad(panel);
        observeAOS(panel);
    };

    const applyProfile = (profile) => {
        if (!profile || typeof profile !== 'object') return;

        // About summary
        if (profile.meta?.summary) {
            const desc = $('#about-description');
            if (desc) desc.innerHTML = profile.meta.summary;
        }

        // Stats — sync data-count / data-since with JSON; count-up reads these.
        const setStat = (key, count, since) => {
            const el = $(`.counting[data-stat-key="${key}"]`);
            if (!el) return;
            if (since) el.dataset.since = since;
            if (count != null) el.dataset.count = String(count);
        };
        if (profile.stats) {
            setStat('projects', profile.stats.projects);
            setStat('companies', profile.stats.companies);
            setStat('experience', null, profile.stats.experienceSince);
        }
        // Re-run the date-based years calculation on counters with data-since
        $$('.counting[data-since]').forEach(el => {
            const since = new Date(el.dataset.since);
            if (Number.isNaN(since.getTime())) return;
            const yearsElapsed = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            el.dataset.count = String(Math.round(yearsElapsed));
        });

        // Experience timeline
        if (Array.isArray(profile.experience) && profile.experience.length) {
            const panel = document.getElementById('experience');
            renderTimeline(panel, profile.experience.map(buildExperienceEntry).join(''));
        }

        // Achievements timeline
        if (Array.isArray(profile.achievements) && profile.achievements.length) {
            const panel = document.getElementById('achievements');
            renderTimeline(panel, profile.achievements.map(buildAchievementEntry).join(''));
        }

        // Certifications — replace slides and re-init swiper
        if (Array.isArray(profile.certifications) && profile.certifications.length) {
            const wrap = $('#cert-wrapper');
            if (wrap) {
                wrap.innerHTML = profile.certifications.map(buildCertSlide).join('');
                initCertSwiper();
            }
        }

        // Last-synced badge
        const synced = $('#last-synced');
        if (synced && profile.meta?.lastSynced) synced.textContent = profile.meta.lastSynced;
    };

    fetch('data/profile.json', { cache: 'no-cache' })
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`profile.json ${r.status}`)))
        .then(applyProfile)
        .catch(err => console.warn('Profile sync failed; using static HTML fallback:', err));
})();
