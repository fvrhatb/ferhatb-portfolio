window.FerbCV = window.FerbCV || {};

window.FerbCV.EffectsController = {
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  navPill: null,
  lastPillTop: 0,
  pillStretchTimer: null,
  isProgrammaticScroll: false,

  lenis: null,

  initLenis() {
    if (typeof Lenis === "undefined") return; // CDN erişilemezse normal scroll
    this.lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
    const raf = (time) => { this.lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  },

  init() {
    this.initLenis();
    this.initSlidingNavPill();
    this.initAppleSmoothScroll();
    this.initScrollRevealAndSpy();
    this.initCardTilt();
  },

  initAmbientSpotlight() {
    if (this.reducedMotion) return;
    let rafId = null;
    window.addEventListener(
      "mousemove",
      (e) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
          document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
          rafId = null;
        });
      },
      { passive: true }
    );
  },

  initSlidingNavPill() {
    const nav = document.querySelector(".sidebar-nav");
    if (!nav) return;

    let pill = nav.querySelector(".nav-active-pill");
    if (!pill) {
      pill = document.createElement("span");
      pill.className = "nav-active-pill";
      pill.setAttribute("aria-hidden", "true");
      nav.prepend(pill);
    }
    this.navPill = pill;

    const initialActive = nav.querySelector(".nav-link.is-active") || nav.querySelector(".nav-link");
    if (initialActive) {
      this.moveNavPill(initialActive, true);
    }

    window.addEventListener("resize", () => {
      const current = nav.querySelector(".nav-link.is-active");
      if (current) this.moveNavPill(current, true);
    });

    const sidebar = document.getElementById("sidebar-panel");
    if (sidebar) {
      const drawerObserver = new MutationObserver(() => {
        if (sidebar.classList.contains("is-open")) {
          const current = nav.querySelector(".nav-link.is-active");
          if (current) requestAnimationFrame(() => this.moveNavPill(current, true));
        }
      });
      drawerObserver.observe(sidebar, { attributes: true, attributeFilter: ["class"] });
    }
  },

  moveNavPill(targetLink, instant = false) {
    if (!this.navPill || !targetLink) return;
    const top = targetLink.offsetTop;
    const height = targetLink.offsetHeight;
    if (height === 0) return;

    this.navPill.style.height = `${height}px`;

    if (instant || this.reducedMotion) {
      const prevTransition = this.navPill.style.transition;
      this.navPill.style.transition = "none";
      this.navPill.style.transform = `translateY(${top}px) scaleY(1)`;
      this.navPill.offsetHeight;
      this.navPill.style.transition = prevTransition;
      this.lastPillTop = top;
      return;
    }

    const distance = Math.abs(top - this.lastPillTop);
    const stretch = Math.min(1.16, 1 + distance / 320);

    clearTimeout(this.pillStretchTimer);
    this.navPill.style.transform = `translateY(${top}px) scaleY(${stretch.toFixed(3)})`;
    this.pillStretchTimer = setTimeout(() => {
      if (this.navPill) {
        this.navPill.style.transform = `translateY(${top}px) scaleY(1)`;
      }
    }, 170);

    this.lastPillTop = top;
  },

  setActiveNavSection(sectionId) {
    const navLinks = document.querySelectorAll(".nav-link");
    let matchedLink = null;

    navLinks.forEach((link) => {
      const isMatch = link.dataset.section === sectionId;
      link.classList.toggle("is-active", isMatch);
      if (isMatch) matchedLink = link;
    });

    if (matchedLink) {
      this.moveNavPill(matchedLink, false);
    }
    this.updateTabbar(sectionId);

    document.querySelectorAll(".cv-section").forEach((section) => {
      section.classList.toggle("is-active-section", section.id === sectionId);
    });
  },

  updateTabbar(sectionId, instant) {
    const bar = document.getElementById("tabbar");
    if (!bar) return;
    const tabs = bar.querySelectorAll(".tab-link");
    let active = null;
    tabs.forEach((t) => {
      const on = t.dataset.section === sectionId;
      t.classList.toggle("is-active", on);
      if (on) active = t;
    });
    const lens = bar.querySelector(".tabbar-lens");
    if (!active || !lens || !active.offsetWidth) return;
    lens.style.width = active.offsetWidth + "px";
    lens.style.transform = `translate3d(${active.offsetLeft}px, 0, 0)`;
    if (!instant) {
      lens.classList.remove("is-moving");
      void lens.offsetWidth;
      lens.classList.add("is-moving");
    }
  },

  initAppleSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"], .tab-link[href^="#"]');
    const current = () => (document.querySelector(".tab-link.is-active") || {}).dataset?.section;
    window.addEventListener("resize", () => this.updateTabbar(current(), true));
    window.addEventListener("load", () => this.updateTabbar(current(), true));
    this.updateTabbar("hakkimda", true);

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        const sectionId = target.getAttribute("id");
        this.setActiveNavSection(sectionId);
        history.replaceState(null, "", href);

        if (this.reducedMotion && !this.lenis) {
          target.scrollIntoView();
          return;
        }

        this.smoothScrollToElement(target);
      });
    });
  },

  smoothScrollToElement(targetEl) {
    const isMobile = window.innerWidth <= 960;
    const offset = isMobile ? 76 : 32;
    if (this.lenis) {
      this.isProgrammaticScroll = true;
      this.lenis.scrollTo(targetEl, {
        offset: -offset,
        duration: 1.3,
        easing: (t) => 1 - Math.pow(1 - t, 5),
        onComplete: () => {
          this.isProgrammaticScroll = false;
          targetEl.classList.add("is-visible");
          targetEl.classList.remove("is-focus-target");
          void targetEl.offsetWidth;
          targetEl.classList.add("is-focus-target");
        }
      });
      return;
    }
    const startY = window.scrollY;
    const targetY = Math.max(0, targetEl.getBoundingClientRect().top + startY - offset);
    const diff = targetY - startY;
    const duration = Math.min(920, Math.max(480, Math.abs(diff) * 0.45));
    const startTime = performance.now();

    this.isProgrammaticScroll = true;

    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutQuint(progress);
      window.scrollTo(0, startY + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.isProgrammaticScroll = false;
        targetEl.classList.add("is-visible");
        targetEl.classList.remove("is-focus-target");
        void targetEl.offsetWidth;
        targetEl.classList.add("is-focus-target");
      }
    };

    requestAnimationFrame(step);
  },

  initCardTilt() {
    if (this.reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;

    const cards = document.querySelectorAll(".bento-card, .project-card");
    cards.forEach((card) => {
      if (card.dataset.tiltBound === "1") return;
      card.dataset.tiltBound = "1";

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--card-x", `${x}px`);
        card.style.setProperty("--card-y", `${y}px`);

        const rotateY = ((x / rect.width) - 0.5) * 4.5;
        const rotateX = ((y / rect.height) - 0.5) * -4.5;
        card.style.transition = "transform 120ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms ease";
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 340ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms ease";
        card.style.transform = "";
      });
    });
  },

  initScrollRevealAndSpy() {
    const sections = Array.from(document.querySelectorAll(".cv-section"));

    sections.forEach((section) => {
      const cards = section.querySelectorAll(".bento-card, .timeline-card, .cert-card, .project-card");
      cards.forEach((card, index) => {
        card.style.setProperty("--stagger", String(index));
      });
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            const cards = entry.target.querySelectorAll(".bento-card, .timeline-card, .cert-card, .project-card");
            setTimeout(() => {
              cards.forEach((c) => c.style.setProperty("--stagger", "0"));
            }, 950);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 }
    );

    sections.forEach((section) => revealObserver.observe(section));

    let spyTicking = false;
    const updateActiveByScroll = () => {
      spyTicking = false;
      if (this.isProgrammaticScroll) return;

      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 48;
      if (nearBottom && sections.length > 0) {
        this.setActiveNavSection(sections[sections.length - 1].id);
        return;
      }

      const triggerLine = window.innerHeight * 0.34;
      let currentSection = sections[0];

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= triggerLine) {
          currentSection = section;
        }
      }

      if (currentSection) {
        this.setActiveNavSection(currentSection.id);
      }
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!spyTicking) {
          spyTicking = true;
          requestAnimationFrame(updateActiveByScroll);
        }
      },
      { passive: true }
    );

    updateActiveByScroll();
    this.initScrollScrub(sections);
  },

  // Apple tarzı: bölümler scroll ile birlikte yumuşakça büyüyüp belirir, çıkarken küçülüp solar.
  initScrollScrub(sections) {
    if (!sections.length) return;
    // Hareketi azalt açıksa daha yumuşak (sadece belirme + çok hafif ölçek) çalışır.
    const k = this.reducedMotion ? 0.3 : 1;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const ease = (t) => t * t * (3 - 2 * t);
    sections.forEach((s) => s.classList.add("scrub"));

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      sections.forEach((section, i) => {
        const r = section.getBoundingClientRect();
        if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return;
        const enter = i === 0 && window.scrollY < 40 ? 1 : ease(clamp((vh - r.top) / (vh * 0.6)));
        const exit = ease(clamp((vh * 0.3 - r.bottom) / (vh * 0.3)));
        const scale = 1;
        const y = ((1 - enter) * 48 - exit * 16) * k;
        section.style.setProperty("--s-o", (enter * (1 - exit * 0.7)).toFixed(2));
        section.style.setProperty("--s-t", `translate3d(0, ${Math.round(y)}px, 0)`);
        section.style.setProperty("--s-origin", exit > 0 ? "50% 100%" : "50% 0%");
      });
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }
};
