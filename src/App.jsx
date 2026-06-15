import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Design System Constants
const colors = {
  obsidian: "#0A0A0A", // primary background
  forge: "#111111",    // card backgrounds
  steel: "#1A1A1A",    // section alternates
  ember: "#FF4500",    // primary accent — fire/energy
  emberSoft: "#FF6B35",// hover states
  emberGlow: "rgba(255, 69, 0, 0.15)", // glow overlays
  iron: "#888888",     // muted text
  chrome: "#CCCCCC",   // body text
  titanium: "#FFFFFF", // headings
  gold: "#FFD700",     // star ratings only
};

const fonts = {
  display: "'Bebas Neue', sans-serif",
  body: "'Inter', sans-serif",
  accent: "'Oswald', sans-serif",
};

// Custom Hook to track window size
function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    // Call immediately on mount to ensure size is accurate
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// Custom Hook for Autoplay / Drag Carousel on Mobile & Tablet
function useAutoplayCarousel(isActive, autoplayInterval = 3000, scrollStep = 340) {
  const ref = useRef(null);
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, scrollLeft: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = (e) => {
    if (!isActive) return;
    const el = ref.current;
    if (!el) return;
    setDragState({
      isDragging: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
    });
  };

  const handleMouseMove = (e) => {
    if (!isActive) return;
    const { isDragging, startX, scrollLeft } = dragState;
    if (!isDragging) return;
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (!isActive) return;
    setDragState((prev) => ({ ...prev, isDragging: false }));
  };

  const handleScroll = () => {
    if (!isActive) return;
    const el = ref.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }
    setScrollProgress((el.scrollLeft / maxScroll) * 100);
  };

  const scroll = (direction) => {
    const el = ref.current;
    if (!el) return;
    const offset = direction === "left" ? -scrollStep : scrollStep;
    el.scrollTo({
      left: el.scrollLeft + offset,
      behavior: "smooth",
    });
  };

  // Autoplay Logic
  useEffect(() => {
    if (!isActive) return;
    if (isHovered || dragState.isDragging) return;

    const el = ref.current;
    const timer = setInterval(() => {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      let nextScroll = el.scrollLeft + scrollStep;
      if (el.scrollLeft >= maxScroll - 10) {
        nextScroll = 0;
      }

      el.scrollTo({
        left: nextScroll,
        behavior: "smooth",
      });
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [isActive, isHovered, dragState.isDragging, autoplayInterval, scrollStep]);

  return {
    ref,
    scrollProgress,
    handleMouseDown,
    handleMouseMove,
    handleMouseUpOrLeave,
    handleScroll,
    scroll,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setDragState((prev) => ({ ...prev, isDragging: false }));
    },
    isDragging: dragState.isDragging,
  };
}

// Custom Counter component using GSAP ScrollTrigger
const AnimatedCounter = ({ endValue, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: endValue,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 95%",
          toggleActions: "play none none none",
        },
        onUpdate: () => {
          setCount(Math.floor(obj.val));
        },
      });
    }, el);

    return () => ctx.revert();
  }, [endValue]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Shimmer CTA Button Component
const ShimmerButton = ({ children, onClick, style = {} }) => {
  const glowRef = useRef(null);

  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
    tl.fromTo(
      el,
      { left: "-30%" },
      { left: "130%", duration: 1.2, ease: "power2.inOut" }
    );
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: colors.ember,
        color: colors.titanium,
        fontFamily: fonts.accent,
        fontSize: "14px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "2px",
        padding: "18px 40px",
        border: "none",
        cursor: "pointer",
        borderRadius: "2px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.emberSoft;
        e.currentTarget.style.boxShadow = `0 0 25px ${colors.ember}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.ember;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          top: 0,
          left: "-30%",
          width: "25%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          transform: "skewX(-25deg)",
          pointerEvents: "none",
        }}
      />
      {children}
    </motion.button>
  );
};

// Skill bar component animated with GSAP ScrollTrigger
const SkillBar = ({ label, percentage }) => {
  const fillRef = useRef(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { width: "0%" },
        {
          width: `${percentage}%`,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [percentage]);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontFamily: fonts.body,
          fontSize: "12px",
          color: colors.chrome,
        }}
      >
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: fonts.accent, color: colors.ember, fontWeight: 600 }}>{percentage}%</span>
      </div>
      <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
        <div
          ref={fillRef}
          style={{
            height: "100%",
            backgroundColor: colors.ember,
            width: "0%",
          }}
        />
      </div>
    </div>
  );
};

// Count-up price indicator with spring feel on plan toggle
const SpringPrice = ({ value }) => {
  const [displayPrice, setDisplayPrice] = useState(value);

  useEffect(() => {
    const obj = { val: displayPrice };
    const tween = gsap.to(obj, {
      val: value,
      duration: 0.5,
      ease: "back.out(1.5)",
      onUpdate: () => {
        setDisplayPrice(Math.floor(obj.val));
      },
    });
    return () => tween.kill();
  }, [value]);

  return <span>₹{displayPrice}</span>;
};

// Interactive Before/After reveal slider using clip-path
const BeforeAfterSlider = ({ beforeStats, beforeLabel, afterStats, afterLabel }) => {
  const [sliderVal, setSliderVal] = useState(50);
  
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "160px",
        backgroundColor: colors.steel,
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "2px",
        overflow: "hidden",
        marginBottom: "20px",
        userSelect: "none",
      }}
    >
      {/* BEFORE LAYER (underneath) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: colors.steel,
          clipPath: `inset(0 0 0 ${sliderVal}%)`,
          transition: "clip-path 0.05s ease-out",
        }}
      >
        {/* Centered in the right half of the slider, width matches 50% */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            width: "50%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <span style={{ fontFamily: fonts.accent, fontSize: "11px", color: colors.iron, fontWeight: 700, letterSpacing: "2px" }}>BEFORE</span>
          <span style={{ fontFamily: fonts.display, fontSize: "32px", color: colors.iron, marginTop: "4px" }}>
            {beforeStats}
          </span>
          <span style={{ fontFamily: fonts.body, fontSize: "10px", color: colors.iron, marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "normal" }}>
            {beforeLabel}
          </span>
        </div>
      </div>

      {/* AFTER LAYER (overlay, clipped) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: colors.emberGlow,
          clipPath: `inset(0 ${100 - sliderVal}% 0 0)`,
          borderRight: `2px solid ${colors.ember}`,
          transition: "clip-path 0.05s ease-out",
        }}
      >
        {/* Centered in the left half of the slider, width matches 50% */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: "50%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          <span style={{ fontFamily: fonts.accent, fontSize: "11px", color: colors.ember, fontWeight: 700, letterSpacing: "2px" }}>AFTER</span>
          <span style={{ fontFamily: fonts.display, fontSize: "32px", color: colors.titanium, marginTop: "4px", textShadow: `0 0 15px ${colors.ember}` }}>
            {afterStats}
          </span>
          <span style={{ fontFamily: fonts.body, fontSize: "10px", color: colors.chrome, marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px", whiteSpace: "normal" }}>
            {afterLabel}
          </span>
        </div>
      </div>

      {/* DRAG HANDLE BAR */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sliderVal}%`,
          width: "2px",
          backgroundColor: colors.ember,
          boxShadow: `0 0 10px ${colors.ember}`,
          pointerEvents: "none",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            backgroundColor: colors.ember,
            color: colors.titanium,
            fontFamily: fonts.accent,
            fontSize: "10px",
            fontWeight: "bold",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 10px ${colors.ember}`,
            border: `2px solid ${colors.titanium}`,
          }}
        >
          ↔
        </div>
      </div>

      {/* SLIDER INPUT CONTROLLER */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderVal}
        onChange={(e) => setSliderVal(Number(e.target.value))}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "ew-resize",
          zIndex: 4,
          margin: 0,
        }}
      />
    </div>
  );
};

// Premium SVG Icon Loader for Gym Programs
const getProgramIcon = (name) => {
  const props = {
    width: "38",
    height: "38",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: colors.ember,
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { 
      filter: `drop-shadow(0 0 6px ${colors.ember}55)`,
      transition: "stroke 0.3s ease, filter 0.3s ease" 
    }
  };

  switch (name) {
    case "Personal Training":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" stroke={colors.emberSoft} />
          <circle cx="12" cy="12" r="2" fill={colors.ember} />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeWidth="1" />
        </svg>
      );
    case "Weight Loss":
      return (
        <svg {...props}>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          <path d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill={colors.emberSoft} stroke="none" />
        </svg>
      );
    case "Muscle Building":
      return (
        <svg {...props}>
          <path d="M6 5.5h12M6 18.5h12M3 5.5h3v13H3zM18 5.5h3v13h-3zM6 12h12" strokeWidth="2" />
          <path d="M9 12v-3M15 12v-3" strokeWidth="1" stroke={colors.emberSoft} />
        </svg>
      );
    case "Nutrition Consulting":
      return (
        <svg {...props}>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
          <path d="M12 6c-2 0-3 1.5-3 3.5s2 4.5 3 6.5c1-2 3-4.5 3-6.5S14 6 12 6z" fill={colors.emberGlow} />
          <circle cx="12" cy="10" r="1.5" fill={colors.ember} />
        </svg>
      );
    case "Functional Training":
      return (
        <svg {...props}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.5" fill={colors.emberGlow} />
        </svg>
      );
    case "HIIT Classes":
      return (
        <svg {...props}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill={colors.emberGlow} />
        </svg>
      );
    case "CrossFit Training":
      return (
        <svg {...props}>
          <path d="M12 3a4 4 0 0 0-4 4v2H6v12h12V9h-2V7a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v2H10V7a2 2 0 0 1 2-2z" />
          <rect x="9" y="13" width="6" height="4" rx="1" fill={colors.emberSoft} stroke="none" />
        </svg>
      );
    case "Kickboxing":
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 7v6M9 10h6" strokeWidth="1" stroke={colors.emberSoft} />
        </svg>
      );
    case "Aerobics":
      return (
        <svg {...props}>
          <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
          <path d="M6 13a6 6 0 0 0 12 0" />
          <path d="M12 10v9M9 22h6" />
        </svg>
      );
    case "Dance Fitness":
      return (
        <svg {...props}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" fill={colors.emberGlow} />
          <circle cx="18" cy="16" r="3" fill={colors.emberGlow} />
        </svg>
      );
    default:
      return null;
  }
};

export default function App() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width < 1024;
  const { scrollYProgress } = useScroll();

  const [activeSection, setActiveSection] = useState("hero");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Section Refs for GSAP ScrollTrigger
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const programsRef = useRef(null);
  const whyChooseRef = useRef(null);
  const trainersRef = useRef(null);
  const membershipRef = useRef(null);
  const transformationRef = useRef(null);
  const reviewsRef = useRef(null);
  const bmiRef = useRef(null);
  const galleryRef = useRef(null);
  const contactRef = useRef(null);
  const footerRef = useRef(null);

  const dumbbellParentRef = useRef(null);

  // Carousel instances for mobile/tablet auto-scrolling
  const programsCarousel = useAutoplayCarousel(isTablet, 3500, 340);
  const whyChooseCarousel = useAutoplayCarousel(isTablet, 4000, 300);
  const trainersCarousel = useAutoplayCarousel(isTablet, 4500, 360);
  const storyCarousel = useAutoplayCarousel(isTablet, 5000, 360);
  const reviewsCarousel = useAutoplayCarousel(isTablet, 3800, 360);
  const galleryCarousel = useAutoplayCarousel(isTablet, 3000, 300);

  // State for tracking focused input elements (focus glows)
  const [activeInput, setActiveInput] = useState("");

  // Reusable styles for carousel buttons
  const btnStyleLeft = {
    position: "absolute",
    left: "-16px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: colors.forge,
    border: `1px solid ${colors.ember}33`,
    color: colors.titanium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
    transition: "border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
  };

  const btnStyleRight = {
    position: "absolute",
    right: "-16px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: colors.forge,
    border: `1px solid ${colors.ember}33`,
    color: colors.titanium,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
    transition: "border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease",
  };

  const btnHover = (e) => {
    e.currentTarget.style.borderColor = colors.ember;
    e.currentTarget.style.backgroundColor = colors.steel;
    e.currentTarget.style.boxShadow = `0 0 20px ${colors.ember}55`;
  };

  const btnLeave = (e) => {
    e.currentTarget.style.borderColor = `${colors.ember}33`;
    e.currentTarget.style.backgroundColor = colors.forge;
    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.6)";
  };


  // Load Google Fonts
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap');`;
    document.head.appendChild(style);

    // Document title
    document.title = "TFS Gym — Tarun's Fitness Solutions | Premium Fitness Eluru";

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const sections = ["about", "programs", "why-choose", "trainers", "membership", "gallery", "contact"];
    const observers = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.15, rootMargin: "-10% 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push({ obs, el });
    });

    return () => {
      observers.forEach(({ obs, el }) => obs.unobserve(el));
    };
  }, []);

  // GSAP Particle System in Hero with Mouse Parallax
  const heroContainerRef = useRef(null);
  useEffect(() => {
    const container = heroContainerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const dots = container.querySelectorAll(".ember-particle");
      dots.forEach((dot) => {
        // Assign depth for parallax effect
        const depth = gsap.utils.random(0.1, 0.45);
        dot.setAttribute("data-depth", depth.toString());
        gsap.set(dot, {
          x: gsap.utils.random(0, window.innerWidth),
          y: gsap.utils.random(window.innerHeight * 0.4, window.innerHeight * 1.1),
          scale: gsap.utils.random(0.4, 1.2),
          opacity: gsap.utils.random(0.2, 0.6),
        });

        gsap.to(dot, {
          y: -100,
          x: `+=${gsap.utils.random(-80, 80)}`,
          opacity: 0,
          duration: gsap.utils.random(4, 7),
          repeat: -1,
          ease: "none",
          delay: gsap.utils.random(0, 5),
        });
      });
    }, container);

    // Mouse movement parallax for particles
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dots = container.querySelectorAll(".ember-particle");
      dots.forEach((dot) => {
        const factor = parseFloat(dot.getAttribute("data-depth") || "0.2");
        const xVal = (clientX - centerX) * factor;
        const yVal = (clientY - centerY) * factor;
        gsap.to(dot, {
          xPercent: xVal,
          yPercent: yVal,
          duration: 1.5,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // GSAP dumbbell floating and rotation + Mouse Parallax on parent
  const dumbbellRef = useRef(null);
  useEffect(() => {
    if (!dumbbellRef.current) return;
    
    // Float and sway rotation animation
    const floatTween = gsap.fromTo(
      dumbbellRef.current,
      { y: -12, rotate: -4 },
      {
        y: 12,
        rotate: 4,
        duration: 3.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      }
    );

    // Mouse movement parallax for parent container
    const handleMouseMove = (e) => {
      if (!dumbbellParentRef.current) return;
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const xVal = (clientX - centerX) * -0.04;
      const yVal = (clientY - centerY) * -0.04;

      gsap.to(dumbbellParentRef.current, {
        x: xVal,
        y: yVal,
        duration: 1.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      floatTween.kill();
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Setup GSAP ScrollTrigger animations for all sections
  useEffect(() => {
    // 1. Hero Entrance Animations (Immediate)
    const heroCtx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(".hero-eyebrow", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" })
        .from(".hero-title-line", { y: 60, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.15 }, "-=0.4")
        .from(".hero-subline", { opacity: 0, duration: 0.6 }, "-=0.4")
        .from(".hero-stat-item", { y: 30, opacity: 0, duration: 0.6, ease: "power2.out", stagger: 0.12 }, "-=0.4")
        .from(".hero-btn-wrap", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.3");
    }, heroRef);

    // 2. About Entrance (ScrollTrigger)
    const aboutCtx = gsap.context(() => {
      gsap.from(".about-left-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".about-right-card", {
        scale: 0.95,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, aboutRef);

    // 3. Programs Entrance (ScrollTrigger)
    const programsCtx = gsap.context(() => {
      gsap.from(".program-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: programsRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".program-card", {
        y: 25,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: {
          trigger: programsRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, programsRef);

    // 4. Why Choose US Entrance (ScrollTrigger)
    const whyCtx = gsap.context(() => {
      gsap.from(".why-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: whyChooseRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".usp-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: whyChooseRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, whyChooseRef);

    // 5. Trainers Entrance (ScrollTrigger)
    const trainersCtx = gsap.context(() => {
      gsap.from(".trainers-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: trainersRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".trainer-card", {
        scale: 0.95,
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: trainersRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, trainersRef);

    // 6. Membership Entrance (ScrollTrigger)
    const memberCtx = gsap.context(() => {
      gsap.from(".member-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: membershipRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".member-toggle-container", {
        y: 10,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
        scrollTrigger: {
          trigger: membershipRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".member-card", {
        y: 25,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: membershipRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, membershipRef);

    // 7. Transformation Stories Entrance (ScrollTrigger)
    const storiesCtx = gsap.context(() => {
      gsap.from(".stories-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: transformationRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".story-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: {
          trigger: transformationRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, transformationRef);

    // 8. Reviews Entrance (ScrollTrigger)
    const reviewsCtx = gsap.context(() => {
      gsap.from(".reviews-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: reviewsRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, reviewsRef);

    // 9. BMI Entrance (ScrollTrigger)
    const bmiCtx = gsap.context(() => {
      gsap.from(".bmi-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: bmiRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".bmi-left", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: bmiRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".bmi-right-empty", {
        scale: 0.97,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: bmiRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, bmiRef);

    // 10. Gallery Entrance (ScrollTrigger)
    const galleryCtx = gsap.context(() => {
      gsap.from(".gallery-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: galleryRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".gallery-card", {
        scale: 0.95,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.04,
        scrollTrigger: {
          trigger: galleryRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, galleryRef);

    // 11. Contact Entrance (ScrollTrigger)
    const contactCtx = gsap.context(() => {
      gsap.from(".contact-header-el", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: contactRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".contact-left-card", {
        x: -20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: contactRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
      gsap.from(".contact-right-form", {
        x: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: contactRef.current,
          start: "top 92%",
          toggleActions: "play none none none",
        }
      });
    }, contactRef);

    // 12. Footer Entrance (ScrollTrigger)
    const footerCtx = gsap.context(() => {
      gsap.from(".footer-col", {
        y: 15,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 95%",
          toggleActions: "play none none none",
        }
      });
    }, footerRef);

    return () => {
      heroCtx.revert();
      aboutCtx.revert();
      programsCtx.revert();
      whyCtx.revert();
      trainersCtx.revert();
      memberCtx.revert();
      storiesCtx.revert();
      reviewsCtx.revert();
      bmiCtx.revert();
      galleryCtx.revert();
      contactCtx.revert();
      footerCtx.revert();
      // Master ScrollTrigger cleanup
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Membership plans toggle state & pricing values
  const [membershipPeriod, setMembershipPeriod] = useState("monthly"); // monthly, quarterly, annual
  const starterPrice = membershipPeriod === "monthly" ? 999 : membershipPeriod === "quarterly" ? 899 : 799;
  const proPrice = membershipPeriod === "monthly" ? 1499 : membershipPeriod === "quarterly" ? 799 : 699;
  const elitePrice = membershipPeriod === "monthly" ? 2499 : membershipPeriod === "quarterly" ? 1499 : 599;

  // Reviews list data
  const reviews = [
    { text: "Best gym in Eluru! The trainers are incredibly dedicated and my transformation has been unreal.", name: "Sai K.", loc: "Powerpet, Eluru" },
    { text: "TFS changed my life. Lost 15kg with proper guidance and never felt judged once.", name: "Ramya P.", loc: "D-Mart Road, Eluru" },
    { text: "Modern equipment, clean environment, expert coaches. Worth every rupee.", name: "Vikram T.", loc: "RR Pet, Eluru" },
    { text: "Tarun sir's approach is scientific and personal. 10/10 recommend to everyone.", name: "Anjali M.", loc: "Powerpet, Eluru" },
    { text: "The nutrition + training combo here is exceptional. Results speak for themselves.", name: "Karthik R.", loc: "Eluru" },
    { text: "Best community I've been part of. Everyone here motivates each other.", name: "Preethi S.", loc: "Vatluru, Eluru" }
  ];



  // BMI Calculator State & calculation logic
  const [bmiInputs, setBmiInputs] = useState({ name: "", height: "", weight: "", age: "", gender: "Male" });
  const [bmiResult, setBmiResult] = useState(null);

  const calculateBmi = () => {
    const { height, weight } = bmiInputs;
    if (!height || !weight) return;
    const hMeters = parseFloat(height) / 100;
    const wKg = parseFloat(weight);
    const score = wKg / (hMeters * hMeters);
    const rounded = Math.round(score * 10) / 10;

    let category = "Healthy";
    let color = "#4CAF50";
    let message = "Great job! Maintain a balanced diet and regular exercise to stay in this healthy range.";

    if (rounded < 18.5) {
      category = "Underweight";
      color = "#4FC3F7";
      message = "You may need to fuel your body with more nutrient-dense calories and focus on strength workouts.";
    } else if (rounded >= 25 && rounded <= 29.9) {
      category = "Overweight";
      color = "#FFA726";
      message = "Focus on a calorie deficit and high-intensity workouts to support healthy weight management.";
    } else if (rounded >= 30) {
      category = "Obese";
      color = colors.ember;
      message = "We recommend a personalized fitness and dietary protocol. Consult with our coaches today!";
    }

    setBmiResult({ score: rounded, category, color, message });
  };

  // Gallery items and Lightbox details
  const galleryItems = [
    { title: "Cardio Zone", img: "/images/cardio.png", height: 200 },
    { title: "Strength Area", img: "/images/weights.png", height: 280 },
    { title: "Group Classes", img: "/images/crossfit.png", height: 240 },
    { title: "Personal Training", img: "/images/cardio.png", height: 260 },
    { title: "Nutrition Zone", img: "/images/weights.png", height: 210 },
    { title: "Functional Training", img: "/images/crossfit.png", height: 290 },
    { title: "Kickboxing", img: "/images/cardio.png", height: 230 },
    { title: "CrossFit", img: "/images/weights.png", height: 270 },
    { title: "Community", img: "/images/crossfit.png", height: 220 },
  ];
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(null);

  // Claim trial form state
  const [claimForm, setClaimForm] = useState({ name: "", phone: "", email: "", goal: "Weight Loss", message: "" });
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const handleClaimSubmit = () => {
    if (!claimForm.name || !claimForm.phone || !claimForm.email) {
      setFormError("Please fill out all required fields (*).");
      return;
    }
    setFormError("");
    setClaimSuccess(true);
  };

  const navLinks = [
    { label: "About", id: "about" },
    { label: "Programs", id: "programs" },
    { label: "Why Choose Us", id: "why-choose" },
    { label: "Trainers", id: "trainers" },
    { label: "Membership", id: "membership" },
    { label: "Gallery", id: "gallery" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <div style={{ backgroundColor: colors.obsidian, minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      
      {/* Scroll Progress Bar */}
      <motion.div
        style={{
          scaleX: scrollYProgress,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: colors.ember,
          transformOrigin: "0%",
          zIndex: 101,
          boxShadow: `0 0 10px ${colors.ember}`,
        }}
      />

      {/* SECTION 1 — STICKY NAVBAR */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "70px",
          backgroundColor: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: activeSection !== "hero" ? `1px solid ${colors.ember}33` : "1px solid rgba(255, 255, 255, 0.06)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          transition: "border-bottom 0.3s ease",
        }}
      >
        {/* Logo */}
        <a href="#hero" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{ fontFamily: fonts.display, fontSize: "28px", color: colors.ember, letterSpacing: "1px" }}>TFS</span>
          <span style={{ fontFamily: fonts.display, fontSize: "28px", color: colors.titanium, marginLeft: "4px", letterSpacing: "1px" }}>GYM</span>
        </a>

        {/* Desktop Links */}
        {!isTablet && (
          <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                style={{
                  fontFamily: fonts.body,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: activeSection === link.id ? colors.ember : colors.chrome,
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  position: "relative",
                  transition: "color 0.3s ease",
                  padding: "6px 0",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.ember)}
                onMouseLeave={(e) => {
                  if (activeSection !== link.id) {
                    e.currentTarget.style.color = colors.chrome;
                  }
                }}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="activeUnderline"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      backgroundColor: colors.ember,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </div>
        )}

        {/* Desktop CTA */}
        {!isTablet && (
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            href="#contact"
            style={{
              backgroundColor: colors.ember,
              color: colors.titanium,
              fontFamily: fonts.accent,
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "2px",
              padding: "10px 24px",
              textDecoration: "none",
              borderRadius: "2px",
              transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.emberSoft;
              e.currentTarget.style.boxShadow = `0 0 15px ${colors.ember}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.ember;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            JOIN NOW
          </motion.a>
        )}

        {/* Mobile Hamburger */}
        {isTablet && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "8px",
            }}
          >
            <span
              style={{
                width: "24px",
                height: "2px",
                backgroundColor: colors.titanium,
                transform: isMobileMenuOpen ? "rotate(45deg) translate(5px, 6px)" : "none",
                transition: "transform 0.3s ease",
              }}
            />
            <span
              style={{
                width: "24px",
                height: "2px",
                backgroundColor: colors.titanium,
                opacity: isMobileMenuOpen ? 0 : 1,
                transition: "opacity 0.3s ease",
              }}
            />
            <span
              style={{
                width: "24px",
                height: "2px",
                backgroundColor: colors.titanium,
                transform: isMobileMenuOpen ? "rotate(-45deg) translate(5px, -6px)" : "none",
                transition: "transform 0.3s ease",
              }}
            />
          </button>
        )}
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && isTablet && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              top: "70px",
              left: 0,
              right: 0,
              backgroundColor: "rgba(10, 10, 10, 0.98)",
              backdropFilter: "blur(20px)",
              borderBottom: `1px solid ${colors.ember}55`,
              zIndex: 99,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  fontFamily: fonts.body,
                  fontSize: "16px",
                  fontWeight: 600,
                  color: activeSection === link.id ? colors.ember : colors.chrome,
                  textDecoration: "none",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                backgroundColor: colors.ember,
                color: colors.titanium,
                fontFamily: fonts.accent,
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "2px",
                padding: "12px",
                textAlign: "center",
                textDecoration: "none",
                borderRadius: "2px",
              }}
            >
              JOIN NOW
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 2 — HERO SECTION */}
      <section
        id="hero"
        ref={heroRef}
        style={{
          minHeight: "100vh",
          backgroundColor: colors.obsidian,
          position: "relative",
          display: "flex",
          alignItems: "center",
          padding: isMobile ? "90px 16px 60px" : "120px 24px",
          overflow: "hidden",
        }}
      >
        {/* Background Grid Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 75% 50%, rgba(255, 69, 0, 0.12) 0%, transparent 60%),
              linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 40px 40px, 40px 40px",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Floating Ember Particles */}
        <div ref={heroContainerRef} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="ember-particle"
              style={{
                position: "absolute",
                width: `${gsap.utils.random(3, 6)}px`,
                height: `${gsap.utils.random(3, 6)}px`,
                backgroundColor: colors.ember,
                borderRadius: "50%",
                pointerEvents: "none",
                filter: `blur(1px) drop-shadow(0 0 8px ${colors.ember})`,
              }}
            />
          ))}
        </div>

        {/* Content Box */}
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
            display: "grid",
            gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.4fr 1.1fr",
            gap: "64px",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", textAlign: isMobile ? "center" : "left" }}>
            <div className="hero-eyebrow">
              <span
                style={{
                  fontFamily: fonts.accent,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "4px",
                  color: colors.iron,
                  textTransform: "uppercase",
                }}
              >
                ELURU'S #1 FITNESS CENTER
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <h1
                className="hero-title-line"
                style={{
                  fontFamily: fonts.display,
                  fontSize: "clamp(56px, 9vw, 110px)",
                  color: colors.titanium,
                  lineHeight: 0.9,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  willChange: "transform, opacity",
                }}
              >
                FORGE YOUR
              </h1>
              <h1
                className="hero-title-line"
                style={{
                  fontFamily: fonts.display,
                  fontSize: "clamp(56px, 9vw, 110px)",
                  background: `linear-gradient(90deg, ${colors.ember} 0%, ${colors.emberSoft} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 0.9,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  filter: `drop-shadow(0 0 10px rgba(255, 69, 0, 0.35))`,
                  willChange: "transform, opacity",
                }}
              >
                BEST SELF
              </h1>
            </div>

            <p
              className="hero-subline"
              style={{
                fontFamily: fonts.body,
                fontSize: "18px",
                color: colors.iron,
                maxWidth: isMobile ? "none" : "500px",
                lineHeight: 1.6,
              }}
            >
              Premium Training • Expert Coaching • Real Results
            </p>

            {/* Stats Cards Row */}
            <div
              className="hero-stat-item"
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: "16px",
                marginTop: "16px",
                width: "100%",
              }}
            >
              {[
                { val: "4.9★", label: "GOOGLE RATING", desc: "Based on 300+ reviews" },
                { val: "300+", label: "HAPPY MEMBERS", desc: "Eluru's most trusted" },
                { val: "8+", label: "ACTIVE PROGRAMS", desc: "Tailored conditioning" },
              ].map((stat, sidx) => (
                <motion.div
                  key={sidx}
                  whileHover={{ y: -5, borderColor: colors.ember, boxShadow: `0 8px 24px ${colors.ember}22` }}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    padding: "16px 20px",
                    borderRadius: "2px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontFamily: fonts.accent, fontSize: "26px", fontWeight: 700, color: colors.ember, lineHeight: 1 }}>{stat.val}</span>
                  <span style={{ fontFamily: fonts.body, fontSize: "10px", fontWeight: 700, color: colors.titanium, letterSpacing: "1px", textTransform: "uppercase" }}>{stat.label}</span>
                  <span style={{ fontFamily: fonts.body, fontSize: "10px", color: colors.iron }}>{stat.desc}</span>
                </motion.div>
              ))}
            </div>

            {/* Buttons Row */}
            <div
              className="hero-btn-wrap"
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: isMobile ? "center" : "flex-start",
                gap: "16px",
                marginTop: "12px",
                width: "100%",
              }}
            >
              <ShimmerButton onClick={() => (window.location.href = "#contact")}>
                START YOUR JOURNEY
              </ShimmerButton>

              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                href="#programs"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "18px 40px",
                  border: `1px solid ${colors.ember}`,
                  color: colors.ember,
                  fontFamily: fonts.accent,
                  fontSize: "14px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  textDecoration: "none",
                  borderRadius: "2px",
                  transition: "background-color 0.3s ease, color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.ember;
                  e.currentTarget.style.color = colors.titanium;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = colors.ember;
                }}
              >
                EXPLORE PROGRAMS
              </motion.a>
            </div>
          </div>

          {/* Right Column (SVG rotating dumbbell) */}
          {!isMobile && !isTablet && (
            <motion.div
              ref={dumbbellParentRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <div ref={dumbbellRef} style={{ width: "380px", height: "380px" }}>
                <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ overflow: "visible" }}>
                  <defs>
                    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="25%" stopColor="#D8D8D8" />
                      <stop offset="50%" stopColor="#787878" />
                      <stop offset="75%" stopColor="#C8C8C8" />
                      <stop offset="100%" stopColor="#282828" />
                    </linearGradient>
                    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FF6B35" />
                      <stop offset="100%" stopColor="#FF4500" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Outer rotating dashed ring */}
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={colors.ember}
                    strokeWidth="1.5"
                    strokeDasharray="4, 6"
                    opacity="0.25"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    style={{ transformOrigin: "60px 60px" }}
                  />

                  {/* Inner opposite rotating ring with dots */}
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    strokeDasharray="1, 8"
                    strokeLinecap="round"
                    opacity="0.4"
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    style={{ transformOrigin: "60px 60px" }}
                  />

                  {/* Tech HUD crosshairs */}
                  <line x1="60" y1="5" x2="60" y2="15" stroke={colors.ember} strokeWidth="1" opacity="0.4" />
                  <line x1="60" y1="105" x2="60" y2="115" stroke={colors.ember} strokeWidth="1" opacity="0.4" />
                  <line x1="5" y1="60" x2="15" y2="60" stroke={colors.ember} strokeWidth="1" opacity="0.4" />
                  <line x1="105" y1="60" x2="115" y2="60" stroke={colors.ember} strokeWidth="1" opacity="0.4" />

                  {/* Floating Dumbbell Core Group */}
                  <motion.g
                    animate={{
                      y: [-4, 4, -4],
                      rotate: [-3, 3, -3]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 5,
                      ease: "easeInOut"
                    }}
                    style={{ transformOrigin: "60px 60px" }}
                  >
                    {/* Central bar (Grip) */}
                    <rect x="35" y="56" width="50" height="8" fill="url(#metalGrad)" rx="1" />
                    {/* Grip knurling textures */}
                    <line x1="45" y1="56" x2="45" y2="64" stroke="#000" strokeWidth="0.8" opacity="0.3" />
                    <line x1="50" y1="56" x2="50" y2="64" stroke="#000" strokeWidth="0.8" opacity="0.3" />
                    <line x1="55" y1="56" x2="55" y2="64" stroke="#000" strokeWidth="0.8" opacity="0.3" />
                    <line x1="60" y1="56" x2="60" y2="64" stroke="#000" strokeWidth="0.8" opacity="0.3" />
                    <line x1="65" y1="56" x2="65" y2="64" stroke="#000" strokeWidth="0.8" opacity="0.3" />
                    <line x1="70" y1="56" x2="70" y2="64" stroke="#000" strokeWidth="0.8" opacity="0.3" />
                    <line x1="75" y1="56" x2="75" y2="64" stroke="#000" strokeWidth="0.8" opacity="0.3" />

                    {/* Left Plates */}
                    {/* Outer small plate */}
                    <rect x="27" y="44" width="8" height="32" fill="url(#metalGrad)" rx="1.5" />
                    {/* Middle plate with neon edge */}
                    <rect x="19" y="36" width="8" height="48" fill="#111111" stroke="url(#neonGrad)" strokeWidth="1.5" rx="2" style={{ filter: "url(#glow)" }} />
                    {/* Inner large plate */}
                    <rect x="11" y="26" width="8" height="68" fill="url(#metalGrad)" rx="2.5" />
                    {/* Collar ring */}
                    <rect x="32" y="52" width="3" height="16" fill="url(#metalGrad)" rx="0.5" />

                    {/* Right Plates */}
                    {/* Collar ring */}
                    <rect x="85" y="52" width="3" height="16" fill="url(#metalGrad)" rx="0.5" />
                    {/* Inner large plate */}
                    <rect x="101" y="26" width="8" height="68" fill="url(#metalGrad)" rx="2.5" />
                    {/* Middle plate with neon edge */}
                    <rect x="93" y="36" width="8" height="48" fill="#111111" stroke="url(#neonGrad)" strokeWidth="1.5" rx="2" style={{ filter: "url(#glow)" }} />
                    {/* Outer small plate */}
                    <rect x="85" y="44" width="8" height="32" fill="url(#metalGrad)" rx="1.5" />
                  </motion.g>
                </svg>
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll Chevron */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ cursor: "pointer" }}
            onClick={() => (window.location.href = "#about")}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.ember} strokeWidth="3">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — ABOUT TFS */}
      <section
        id="about"
        ref={aboutRef}
        style={{
          backgroundColor: colors.steel,
          position: "relative",
          padding: isMobile ? "80px 16px" : "120px 24px",
          clipPath: "polygon(0 0, 100% 60px, 100% 100%, 0 100%)",
          marginTop: "-60px",
          zIndex: 5,
        }}
      >
        {/* Glow Strip Transition Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: `linear-gradient(to bottom, ${colors.ember}11, transparent)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.2fr 1fr",
              gap: "64px",
              alignItems: "center",
            }}
          >
            {/* Left Column Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
              <span
                className="about-left-el"
                style={{
                  fontFamily: fonts.accent,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "4px",
                  color: colors.ember,
                  textTransform: "uppercase",
                }}
              >
                WHO WE ARE
              </span>
              <h2
                className="about-left-el"
                style={{
                  fontFamily: fonts.display,
                  fontSize: "clamp(36px, 6vw, 72px)",
                  color: colors.titanium,
                  lineHeight: 1.0,
                  textTransform: "uppercase",
                }}
              >
                More Than A Gym. <br />
                <span style={{ color: colors.ember }}>A TRANSFORMATION HUB.</span>
              </h2>
              <p
                className="about-left-el"
                style={{
                  fontFamily: fonts.body,
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: colors.chrome,
                  margin: "10px 0",
                }}
              >
                Founded in the heart of Eluru's Powerpet neighborhood, TFS Gym – Tarun's Fitness Solutions has become
                Andhra Pradesh's benchmark for premium fitness. We combine modern equipment, science-backed training,
                and genuine human coaching to help every member — from first-timers to competitive athletes — reach goals
                they once thought impossible.
              </p>

              {/* 2x2 Feature Pills */}
              <div
                className="about-left-el"
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "16px",
                  marginTop: "16px",
                  width: "100%",
                }}
              >
                {[
                  { icon: "🏋️", text: "Modern Equipment" },
                  { icon: "🥗", text: "Nutrition Guidance" },
                  { icon: "👥", text: "Expert Trainers" },
                  { icon: "📍", text: "Powerpet, Eluru" },
                ].map((pill, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      backgroundColor: colors.forge,
                      border: `1px solid ${colors.ember}22`,
                      borderRadius: "2px",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{pill.icon}</span>
                    <span style={{ fontFamily: fonts.body, fontSize: "14px", fontWeight: 600, color: colors.titanium }}>
                      {pill.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column Stats Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "16px",
                width: "100%",
              }}
            >
              {[
                {
                  value: 4.9,
                  suffix: "",
                  label: "Google Rating",
                  sub: (
                    <div style={{ display: "flex", gap: "2px", color: colors.gold, marginTop: "6px" }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ fontSize: "14px" }}>★</span>
                      ))}
                    </div>
                  ),
                },
                { value: 300, suffix: "+", label: "5-Star Reviews", sub: <span style={{ color: colors.iron, fontSize: "11px" }}>Verified</span> },
                { value: 10, suffix: "+", label: "Training Programs", sub: <span style={{ color: colors.iron, fontSize: "11px" }}>Tailored</span> },
                { value: 100, suffix: "%", label: "Personalized Plans", sub: <span style={{ color: colors.iron, fontSize: "11px" }}>Goal Centered</span> },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="about-right-card"
                  whileHover={{ y: -5 }}
                  style={{
                    backgroundColor: colors.forge,
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "2px",
                    padding: "32px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  <span style={{ fontFamily: fonts.accent, fontSize: "48px", fontWeight: 700, color: colors.ember, lineHeight: 1.1 }}>
                    <AnimatedCounter endValue={stat.value} suffix={stat.suffix} />
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.titanium, marginTop: "8px", fontWeight: 600 }}>
                    {stat.label}
                  </span>
                  {stat.sub}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — PROGRAMS / SERVICES */}
      <section
        id="programs"
        ref={programsRef}
        style={{
          backgroundColor: colors.obsidian,
          padding: isMobile ? "80px 16px" : "120px 24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span
              className="program-header-el"
              style={{
                fontFamily: fonts.accent,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: colors.ember,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              OUR PROGRAMS
            </span>
            <h2
              className="program-header-el"
              style={{
                fontFamily: fonts.display,
                fontSize: "clamp(36px, 6vw, 72px)",
                color: colors.titanium,
                textTransform: "uppercase",
                marginTop: "12px",
                display: "block",
              }}
            >
              UNLEASH YOUR POTENTIAL
            </h2>
            <p
              className="program-header-el"
              style={{
                fontFamily: fonts.body,
                fontSize: "16px",
                color: colors.iron,
                marginTop: "12px",
                display: "block",
              }}
            >
              8 specialized programs designed for every fitness goal
            </p>
          </div>

          {/* Carousel Wrapper */}
          <div style={{ position: "relative", width: "100%" }}>
            
            {/* Left Scroll Control */}
            {isTablet && !isMobile && (
              <button
                onClick={() => programsCarousel.scroll("left")}
                style={btnStyleLeft}
                onMouseEnter={btnHover}
                onMouseLeave={btnLeave}
              >
                <span style={{ fontSize: "20px", fontWeight: "bold" }}>←</span>
              </button>
            )}

            {/* Right Scroll Control */}
            {isTablet && !isMobile && (
              <button
                onClick={() => programsCarousel.scroll("right")}
                style={btnStyleRight}
                onMouseEnter={btnHover}
                onMouseLeave={btnLeave}
              >
                <span style={{ fontSize: "20px", fontWeight: "bold" }}>→</span>
              </button>
            )}

            {/* Scrollable Container (Carousel Mode) or Grid Container (Desktop Mode) */}
            <div
              ref={programsCarousel.ref}
              onMouseDown={programsCarousel.handleMouseDown}
              onMouseMove={programsCarousel.handleMouseMove}
              onMouseUp={programsCarousel.handleMouseUpOrLeave}
              onMouseLeave={programsCarousel.handleMouseUpOrLeave}
              onScroll={programsCarousel.handleScroll}
              onMouseEnter={programsCarousel.onMouseEnter}
              onMouseLeave={programsCarousel.onMouseLeave}
              style={
                isTablet
                  ? {
                      display: "flex",
                      gap: "20px",
                      overflowX: "scroll",
                      scrollbarWidth: "none", // Firefox
                      msOverflowStyle: "none", // IE
                      cursor: programsCarousel.isDragging ? "grabbing" : "grab",
                      paddingBottom: "24px",
                      width: "100%",
                      scrollSnapType: "x mandatory",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      boxSizing: "border-box",
                    }
                  : {
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "28px",
                      width: "100%",
                    }
              }
            >
              {isTablet && <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />}

              {[
                { name: "Personal Training", features: ["One-on-one coaching", "Customized plans", "Goal tracking"] },
                { name: "Weight Loss", features: ["Fat loss training", "Calorie management", "Progress monitoring"] },
                { name: "Muscle Building", features: ["Strength training", "Hypertrophy programs", "Advanced lifting"] },
                { name: "Nutrition Consulting", features: ["Diet planning", "Meal recommendations", "Nutrition support"] },
                { name: "Functional Training", features: ["Agility workouts", "Conditioning", "Athletic performance"] },
                { name: "HIIT Classes", features: ["High-intensity intervals", "Fat-burning sessions", "Cardio boost"] },
                { name: "CrossFit Training", features: ["Functional movements", "Strength & endurance", "Team energy"] },
                { name: "Kickboxing", features: ["Cardio conditioning", "Self-defense fundamentals", "Power training"] },
              ].map((program, idx) => (
                <motion.div
                  key={idx}
                  className="program-card"
                  whileHover={{ y: -12, scale: 1.03, rotate: idx % 2 === 0 ? 0.6 : -0.6 }}
                  whileTap={{ scale: 0.98 }}
                  whileHover="hover"
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  style={{
                    flex: isTablet ? "0 0 auto" : "unset",
                    width: isTablet ? (isMobile ? "calc(100vw - 64px)" : "340px") : "100%",
                    scrollSnapAlign: "center",
                    backgroundColor: colors.forge,
                    border: "1px solid rgba(255, 255, 255, 0.04)",
                    borderRadius: "2px",
                    padding: "40px 28px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.ember;
                    e.currentTarget.style.boxShadow = `0 20px 40px rgba(255, 69, 0, 0.2)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Visual Icon Container */}
                  <motion.div
                    variants={{
                      hover: {
                        scale: 1.08,
                        backgroundColor: "rgba(255, 69, 0, 0.08)",
                        borderColor: colors.ember,
                        boxShadow: `0 0 20px ${colors.ember}33`,
                      }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    style={{
                      width: "76px",
                      height: "76px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "28px",
                      alignSelf: "center",
                      transition: "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    {getProgramIcon(program.name)}
                  </motion.div>

                  <h3 style={{ fontFamily: fonts.accent, fontSize: "20px", fontWeight: 600, color: colors.titanium, textAlign: "center", marginBottom: "20px", letterSpacing: "1px" }}>
                    {program.name}
                  </h3>

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: "12px", flexGrow: 1 }}>
                    {program.features.map((feat, fidx) => (
                      <li key={fidx} style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.chrome, display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.ember} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <motion.a
                    href="#contact"
                    style={{
                      fontFamily: fonts.accent,
                      fontSize: "12px",
                      fontWeight: 700,
                      color: colors.ember,
                      textDecoration: "none",
                      letterSpacing: "2px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "auto",
                      alignSelf: "center",
                      textTransform: "uppercase",
                    }}
                  >
                    <span>LEARN MORE</span>
                    <motion.span
                      variants={{
                        hover: { x: 5 }
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      →
                    </motion.span>
                  </motion.a>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Carousel Scroll Progress Bar */}
          {isTablet && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "24px",
                gap: "12px",
              }}
            >
              <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.iron, letterSpacing: "1px", textTransform: "uppercase" }}>
                {isMobile ? "Swipe to browse programs" : "Drag or use controls to browse programs"}
              </span>
              <div
                style={{
                  width: "120px",
                  height: "2px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  position: "relative",
                  borderRadius: "1px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${programsCarousel.scrollProgress}%`,
                    backgroundColor: colors.ember,
                    boxShadow: `0 0 8px ${colors.ember}`,
                    borderRadius: "1px",
                    transition: "width 0.15s ease-out",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5 — WHY CHOOSE TFS */}
      <section
        id="why-choose"
        ref={whyChooseRef}
        style={{
          backgroundColor: colors.steel,
          padding: isMobile ? "80px 16px" : "120px 24px",
          position: "relative",
          clipPath: "polygon(0 0, 100% 60px, 100% 100%, 0 100%)",
          marginTop: "-60px",
          zIndex: 5,
        }}
      >
        {/* Glow Strip Transition Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: `linear-gradient(to bottom, ${colors.ember}11, transparent)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span
              className="why-header-el"
              style={{
                fontFamily: fonts.accent,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: colors.ember,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              WHY MEMBERS LOVE US
            </span>
            <h2
              className="why-header-el"
              style={{
                fontFamily: fonts.display,
                fontSize: "clamp(36px, 6vw, 72px)",
                color: colors.titanium,
                textTransform: "uppercase",
                marginTop: "12px",
                display: "block",
              }}
            >
              THE TFS DIFFERENCE
            </h2>
          </div>

          {/* Cards Carousel/Grid Wrapper */}
          <div style={{ position: "relative", width: "100%" }}>
            {isTablet && !isMobile && (
              <>
                <button
                  onClick={() => whyChooseCarousel.scroll("left")}
                  style={btnStyleLeft}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                >
                  ←
                </button>
                <button
                  onClick={() => whyChooseCarousel.scroll("right")}
                  style={btnStyleRight}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                >
                  →
                </button>
              </>
            )}

            <div
              ref={whyChooseCarousel.ref}
              onMouseDown={whyChooseCarousel.handleMouseDown}
              onMouseMove={whyChooseCarousel.handleMouseMove}
              onMouseUp={whyChooseCarousel.handleMouseUpOrLeave}
              onMouseLeave={whyChooseCarousel.handleMouseUpOrLeave}
              onScroll={whyChooseCarousel.handleScroll}
              onMouseEnter={whyChooseCarousel.onMouseEnter}
              onMouseLeave={whyChooseCarousel.onMouseLeave}
              style={
                isTablet
                  ? {
                      display: "flex",
                      gap: "20px",
                      overflowX: "scroll",
                      scrollbarWidth: "none", // Firefox
                      msOverflowStyle: "none", // IE
                      cursor: whyChooseCarousel.isDragging ? "grabbing" : "grab",
                      paddingBottom: "24px",
                      width: "100%",
                      scrollSnapType: "x mandatory",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      boxSizing: "border-box",
                    }
                  : {
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "24px",
                      width: "100%",
                    }
              }
            >
              {isTablet && <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />}

              {[
                { num: "01", title: "Personalized Plans", desc: "Workout routines customized to your specific body type and goals" },
                { num: "02", title: "Diet Guidance", desc: "Nutrition planning integrated seamlessly alongside your training program" },
                { num: "03", title: "Dedicated Zones", desc: "Separate areas for cardio, strength, and functional training" },
                { num: "04", title: "Expert Trainers", desc: "Coaches who correct your form, track your progress, and keep you motivated" },
                { num: "05", title: "4.9★ Satisfaction", desc: "300+ verified reviews — Eluru's most trusted fitness destination" },
                { num: "06", title: "Positive Community", desc: "A supportive, non-judgmental environment for all fitness levels" },
              ].map((usp, idx) => (
                <motion.div
                  key={idx}
                  className="usp-card"
                  whileHover={{ scale: 1.02 }}
                  style={{
                    backgroundColor: colors.forge,
                    borderLeft: `4px solid ${colors.ember}`,
                    borderRadius: "2px",
                    padding: "36px 30px",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    flex: isTablet ? "0 0 auto" : "unset",
                    width: isTablet ? (isMobile ? "calc(100vw - 64px)" : "320px") : "100%",
                    scrollSnapAlign: "center",
                  }}
                >
                  {/* Background Watermark number */}
                  <div
                    style={{
                      position: "absolute",
                      right: "-10px",
                      bottom: "-15px",
                      fontFamily: fonts.accent,
                      fontSize: "80px",
                      fontWeight: 900,
                      color: colors.ember,
                      opacity: 0.08,
                      pointerEvents: "none",
                    }}
                  >
                    {usp.num}
                  </div>

                  <h3
                    style={{
                      fontFamily: fonts.accent,
                      fontSize: "20px",
                      fontWeight: 600,
                      color: colors.titanium,
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {usp.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: colors.chrome,
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {usp.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Carousel Scroll Progress Bar */}
          {isTablet && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "24px",
                gap: "12px",
              }}
            >
              <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.iron, letterSpacing: "1px", textTransform: "uppercase" }}>
                {isMobile ? "Swipe to see highlights" : "Drag or use controls to see highlights"}
              </span>
              <div
                style={{
                  width: "120px",
                  height: "2px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  position: "relative",
                  borderRadius: "1px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${whyChooseCarousel.scrollProgress}%`,
                    backgroundColor: colors.ember,
                    boxShadow: `0 0 8px ${colors.ember}`,
                    borderRadius: "1px",
                    transition: "width 0.15s ease-out",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6 — MEET THE TRAINERS */}
      <section
        id="trainers"
        ref={trainersRef}
        style={{
          backgroundColor: colors.obsidian,
          padding: isMobile ? "80px 16px" : "120px 24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span
              className="trainers-header-el"
              style={{
                fontFamily: fonts.accent,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: colors.ember,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              MEET THE TEAM
            </span>
            <h2
              className="trainers-header-el"
              style={{
                fontFamily: fonts.display,
                fontSize: "clamp(36px, 6vw, 72px)",
                color: colors.titanium,
                textTransform: "uppercase",
                marginTop: "12px",
                display: "block",
              }}
            >
              ELURU'S BEST COACHES
            </h2>
          </div>

          {/* Trainers Cards Carousel/Grid Wrapper */}
          <div style={{ position: "relative", width: "100%" }}>
            {isTablet && !isMobile && (
              <>
                <button
                  onClick={() => trainersCarousel.scroll("left")}
                  style={btnStyleLeft}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                >
                  ←
                </button>
                <button
                  onClick={() => trainersCarousel.scroll("right")}
                  style={btnStyleRight}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                >
                  →
                </button>
              </>
            )}

            <div
              ref={trainersCarousel.ref}
              onMouseDown={trainersCarousel.handleMouseDown}
              onMouseMove={trainersCarousel.handleMouseMove}
              onMouseUp={trainersCarousel.handleMouseUpOrLeave}
              onMouseLeave={trainersCarousel.handleMouseUpOrLeave}
              onScroll={trainersCarousel.handleScroll}
              onMouseEnter={trainersCarousel.onMouseEnter}
              onMouseLeave={trainersCarousel.onMouseLeave}
              style={
                isTablet
                  ? {
                      display: "flex",
                      gap: "20px",
                      overflowX: "scroll",
                      scrollbarWidth: "none", // Firefox
                      msOverflowStyle: "none", // IE
                      cursor: trainersCarousel.isDragging ? "grabbing" : "grab",
                      paddingBottom: "24px",
                      width: "100%",
                      scrollSnapType: "x mandatory",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      boxSizing: "border-box",
                    }
                  : {
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "32px",
                      width: "100%",
                    }
              }
            >
              {isTablet && <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />}

              {[
                {
                  initials: "TK",
                  name: "Tarun K.",
                  role: "Head Trainer & Founder",
                  speciality: "Strength & Conditioning",
                  skills: [
                    { label: "Strength", percentage: 95 },
                    { label: "Nutrition", percentage: 90 },
                    { label: "Motivation", percentage: 100 },
                  ],
                },
                {
                  initials: "PM",
                  name: "Priya M.",
                  role: "Nutrition Coach",
                  speciality: "Weight Loss & Diet Planning",
                  skills: [
                    { label: "Diet Formulation", percentage: 98 },
                    { label: "Fat Burn Program", percentage: 92 },
                    { label: "Guidance", percentage: 95 },
                  ],
                },
                {
                  initials: "RS",
                  name: "Ravi S.",
                  role: "CrossFit Coach",
                  speciality: "HIIT & Functional Training",
                  skills: [
                    { label: "Agility", percentage: 94 },
                    { label: "High Intensity", percentage: 96 },
                    { label: "Athletic Conditioning", percentage: 90 },
                  ],
                },
              ].map((trainer, idx) => (
                <motion.div
                  key={idx}
                  className="trainer-card"
                  whileHover={{ y: -12, scale: 1.03, rotate: idx % 2 === 0 ? 0.8 : -0.8 }}
                  whileTap={{ scale: 0.98 }}
                  whileHover="hover"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    backgroundColor: colors.forge,
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "2px",
                    padding: "40px 32px",
                    flex: isTablet ? "0 0 auto" : "unset",
                    width: isTablet ? (isMobile ? "calc(100vw - 64px)" : "340px") : "100%",
                    scrollSnapAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.ember;
                    e.currentTarget.style.boxShadow = `0 15px 35px rgba(255, 69, 0, 0.25)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Avatar Initials Circle */}
                  <motion.div
                    variants={{
                      hover: {
                        scale: 1.1,
                        boxShadow: `0 12px 28px ${colors.ember}66`,
                        transition: { duration: 0.4 }
                      }
                    }}
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${colors.ember}, ${colors.emberSoft})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "24px",
                      boxShadow: `0 8px 20px ${colors.ember}33`,
                    }}
                  >
                    <span style={{ fontFamily: fonts.display, fontSize: "32px", color: colors.titanium, letterSpacing: "1px" }}>
                      {trainer.initials}
                    </span>
                  </motion.div>

                  <h3 style={{ fontFamily: fonts.accent, fontSize: "20px", fontWeight: 600, color: colors.titanium }}>
                    {trainer.name}
                  </h3>
                  <span
                    style={{
                      fontFamily: fonts.body,
                      fontSize: "13px",
                      color: colors.ember,
                      fontWeight: 500,
                      marginTop: "4px",
                      marginBottom: "12px",
                    }}
                  >
                    {trainer.role}
                  </span>

                  <div
                    style={{
                      backgroundColor: colors.obsidian,
                      borderRadius: "2px",
                      padding: "8px 16px",
                      fontFamily: fonts.body,
                      fontSize: "12px",
                      color: colors.emberSoft,
                      fontWeight: 600,
                      marginBottom: "32px",
                    }}
                  >
                    {trainer.speciality}
                  </div>

                  {/* Skill Bars */}
                  <div style={{ width: "100%", textAlign: "left", marginBottom: "24px" }}>
                    {trainer.skills.map((skill, sidx) => (
                      <SkillBar key={sidx} label={skill.label} percentage={skill.percentage} />
                    ))}
                  </div>

                  {/* Social icons placeholder */}
                  <div style={{ display: "flex", gap: "16px", marginTop: "auto" }}>
                    <span style={{ fontSize: "18px", color: colors.iron, cursor: "pointer" }}>📸</span>
                    <span style={{ fontSize: "18px", color: colors.iron, cursor: "pointer" }}>💬</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Carousel Scroll Progress Bar */}
          {isTablet && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "24px",
                gap: "12px",
              }}
            >
              <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.iron, letterSpacing: "1px", textTransform: "uppercase" }}>
                {isMobile ? "Swipe to browse trainers" : "Drag or use controls to browse trainers"}
              </span>
              <div
                style={{
                  width: "120px",
                  height: "2px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  position: "relative",
                  borderRadius: "1px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${trainersCarousel.scrollProgress}%`,
                    backgroundColor: colors.ember,
                    boxShadow: `0 0 8px ${colors.ember}`,
                    borderRadius: "1px",
                    transition: "width 0.15s ease-out",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 7 — MEMBERSHIP PLANS */}
      <section
        id="membership"
        ref={membershipRef}
        style={{
          backgroundColor: colors.steel,
          padding: isMobile ? "80px 16px" : "120px 24px",
          position: "relative",
          clipPath: "polygon(0 0, 100% 60px, 100% 100%, 0 100%)",
          marginTop: "-60px",
          zIndex: 5,
        }}
      >
        {/* Glow Strip Transition Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: `linear-gradient(to bottom, ${colors.ember}11, transparent)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span
              className="member-header-el"
              style={{
                fontFamily: fonts.accent,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: colors.ember,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              CHOOSE YOUR PLAN
            </span>
            <h2
              className="member-header-el"
              style={{
                fontFamily: fonts.display,
                fontSize: "clamp(36px, 6vw, 72px)",
                color: colors.titanium,
                textTransform: "uppercase",
                marginTop: "12px",
                display: "block",
              }}
            >
              MEMBERSHIP PLANS
            </h2>
            <p
              className="member-header-el"
              style={{
                fontFamily: fonts.body,
                fontSize: "16px",
                color: colors.iron,
                marginTop: "12px",
                display: "block",
              }}
            >
              Flexible memberships for every commitment level
            </p>
          </div>

          {/* Toggle pill */}
          <div className="member-toggle-container" style={{ display: "flex", justifyContent: "center", marginBottom: "56px" }}>
            <div
              style={{
                backgroundColor: colors.forge,
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "4px",
                display: "flex",
                gap: "4px",
                borderRadius: "2px",
              }}
            >
              {["monthly", "quarterly", "annual"].map((period) => (
                <button
                  key={period}
                  onClick={() => setMembershipPeriod(period)}
                  style={{
                    backgroundColor: membershipPeriod === period ? colors.ember : "transparent",
                    color: colors.titanium,
                    fontFamily: fonts.accent,
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    padding: "10px 24px",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  {period}
                  {period === "annual" && (
                    <span
                      style={{
                        backgroundColor: colors.titanium,
                        color: colors.ember,
                        fontSize: "9px",
                        fontWeight: 900,
                        padding: "2px 6px",
                        borderRadius: "1px",
                      }}
                    >
                      SAVE 20%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plans cards row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px",
              alignItems: "stretch",
              width: "100%",
            }}
          >
            {/* Card 1 — Starter */}
            <motion.div
              className="member-card"
              whileHover={{ y: -12, scale: 1.03, boxShadow: `0 20px 45px rgba(255, 69, 0, 0.18)` }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                backgroundColor: colors.forge,
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "2px",
                padding: "48px 36px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                width: "100%",
                maxWidth: isMobile ? "400px" : "none",
                margin: "0 auto",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ fontFamily: fonts.accent, fontSize: "20px", color: colors.iron, textTransform: "uppercase" }}>STARTER</h3>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: "16px", marginBottom: "32px" }}>
                  <span style={{ fontFamily: fonts.accent, fontSize: "56px", fontWeight: 700, color: colors.titanium }}>
                    <SpringPrice value={starterPrice} />
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, marginLeft: "4px" }}>/mo</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Gym Access (All Hours)</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Locker Room Access</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Group Classes</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.iron, textDecoration: "line-through" }}>✗ Personal Trainer Sessions</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.iron, textDecoration: "line-through" }}>✗ Nutrition Consultation</li>
                </ul>
              </div>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#contact"
                style={{
                  backgroundColor: "transparent",
                  color: colors.titanium,
                  border: `1px solid ${colors.ember}`,
                  fontFamily: fonts.accent,
                  fontSize: "14px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  padding: "16px 0",
                  textAlign: "center",
                  textDecoration: "none",
                  borderRadius: "2px",
                  transition: "background-color 0.3s ease",
                  marginTop: "auto",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.ember)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                GET STARTED
              </motion.a>
            </motion.div>

            {/* Card 2 — Pro (Popular) */}
            <motion.div
              className="member-card"
              whileHover={{ y: -12, scale: 1.05, boxShadow: `0 25px 50px rgba(255, 69, 0, 0.35)` }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                backgroundColor: colors.forge,
                border: `2px solid ${colors.ember}`,
                borderRadius: "2px",
                padding: "60px 36px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                zIndex: 2,
                width: "100%",
                maxWidth: isMobile ? "400px" : "none",
                margin: "0 auto",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Popular Tag */}
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: colors.ember,
                    color: colors.titanium,
                    fontFamily: fonts.accent,
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    padding: "4px 16px",
                    borderRadius: "1px",
                  }}
                >
                  MOST POPULAR
                </div>

                <h3 style={{ fontFamily: fonts.accent, fontSize: "20px", color: colors.ember, textTransform: "uppercase" }}>PRO</h3>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: "16px", marginBottom: "32px" }}>
                  <span style={{ fontFamily: fonts.accent, fontSize: "64px", fontWeight: 700, color: colors.titanium }}>
                    <SpringPrice value={proPrice} />
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, marginLeft: "4px" }}>/mo</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Gym Access (All Hours)</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Locker Room Access</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Group Classes</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Personal Trainer Sessions (2/month)</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Nutrition Consultation</li>
                </ul>
              </div>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#contact"
                style={{
                  backgroundColor: colors.ember,
                  color: colors.titanium,
                  fontFamily: fonts.accent,
                  fontSize: "14px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  padding: "16px 0",
                  textAlign: "center",
                  textDecoration: "none",
                  borderRadius: "2px",
                  transition: "background-color 0.3s ease, box-shadow 0.3s ease",
                  marginTop: "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.emberSoft;
                  e.currentTarget.style.boxShadow = `0 0 15px ${colors.ember}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.ember;
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                GET STARTED
              </motion.a>
            </motion.div>

            {/* Card 3 — Elite */}
            <motion.div
              className="member-card"
              whileHover={{ y: -12, scale: 1.03, boxShadow: `0 20px 45px rgba(255, 69, 0, 0.18)` }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                backgroundColor: colors.forge,
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "2px",
                padding: "48px 36px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                width: "100%",
                maxWidth: isMobile ? "400px" : "none",
                margin: "0 auto",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Value Tag */}
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#333",
                    color: colors.titanium,
                    fontFamily: fonts.accent,
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    padding: "4px 16px",
                    borderRadius: "1px",
                  }}
                >
                  BEST VALUE
                </div>

                <h3 style={{ fontFamily: fonts.accent, fontSize: "20px", color: colors.iron, textTransform: "uppercase" }}>ELITE</h3>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: "16px", marginBottom: "32px" }}>
                  <span style={{ fontFamily: fonts.accent, fontSize: "56px", fontWeight: 700, color: colors.titanium }}>
                    <SpringPrice value={elitePrice} />
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, marginLeft: "4px" }}>/mo</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 40px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Gym Access (All Hours)</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Locker Room Access</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Group Classes</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Unlimited Trainer Support</li>
                  <li style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome }}>✓ Guest Passes (2/month)</li>
                </ul>
              </div>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#contact"
                style={{
                  backgroundColor: "transparent",
                  color: colors.titanium,
                  border: `1px solid ${colors.ember}`,
                  fontFamily: fonts.accent,
                  fontSize: "14px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  padding: "16px 0",
                  textAlign: "center",
                  textDecoration: "none",
                  borderRadius: "2px",
                  transition: "background-color 0.3s ease",
                  marginTop: "auto",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.ember)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                GET STARTED
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — TRANSFORMATION STORIES */}
      <section
        id="transformation"
        ref={transformationRef}
        style={{
          backgroundColor: colors.obsidian,
          padding: isMobile ? "80px 16px" : "120px 24px",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span
              className="stories-header-el"
              style={{
                fontFamily: fonts.accent,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: colors.ember,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              REAL RESULTS. REAL PEOPLE.
            </span>
            <h2
              className="stories-header-el"
              style={{
                fontFamily: fonts.display,
                fontSize: "clamp(36px, 6vw, 72px)",
                color: colors.titanium,
                textTransform: "uppercase",
                marginTop: "12px",
                display: "block",
              }}
            >
              TRANSFORMATION STORIES
            </h2>
            <p className="stories-header-el" style={{ color: colors.iron, fontFamily: fonts.body, fontSize: "14px", marginTop: "8px", display: "block" }}>
              {isTablet ? "Swipe left or right to scroll through our members' journeys" : "Real results from real members at Eluru's premium training center"}
            </p>
          </div>

          {/* Stories Carousel/Grid Wrapper */}
          <div style={{ position: "relative", width: "100%" }}>
            {isTablet && !isMobile && (
              <>
                <button
                  onClick={() => storyCarousel.scroll("left")}
                  style={btnStyleLeft}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                >
                  ←
                </button>
                <button
                  onClick={() => storyCarousel.scroll("right")}
                  style={btnStyleRight}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                >
                  →
                </button>
              </>
            )}

            <div
              ref={storyCarousel.ref}
              onMouseDown={storyCarousel.handleMouseDown}
              onMouseMove={storyCarousel.handleMouseMove}
              onMouseUp={storyCarousel.handleMouseUpOrLeave}
              onMouseLeave={storyCarousel.handleMouseUpOrLeave}
              onScroll={storyCarousel.handleScroll}
              onMouseEnter={storyCarousel.onMouseEnter}
              onMouseLeave={storyCarousel.onMouseLeave}
              style={
                isTablet
                  ? {
                      display: "flex",
                      gap: "20px",
                      overflowX: "scroll",
                      scrollbarWidth: "none", // Firefox
                      msOverflowStyle: "none", // IE
                      cursor: storyCarousel.isDragging ? "grabbing" : "grab",
                      paddingBottom: "20px",
                      width: "100%",
                      scrollSnapType: "x mandatory",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      boxSizing: "border-box",
                    }
                  : {
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "28px",
                      width: "100%",
                    }
              }
            >
              {isTablet && <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />}

              {[
                {
                  name: "Arun",
                  age: 28,
                  goal: "Lost 18kg in 4 months",
                  desc: "TFS completely reprogrammed my lifestyle. The trainers built a science-backed diet plan that saved my life.",
                  beforeStats: "102 KG",
                  beforeLabel: "32% Body Fat • Low Energy",
                  afterStats: "84 KG",
                  afterLabel: "14% Body Fat • Peak Fit"
                },
                {
                  name: "Sneha",
                  age: 34,
                  goal: "Built lean muscle in 3 months",
                  desc: "The expert coaches corrected my form. I went from lifting zero weights to benching my bodyweight!",
                  beforeStats: "0 KG BENCH",
                  beforeLabel: "Poor Form • Back Pain",
                  afterStats: "60 KG BENCH",
                  afterLabel: "Benching Bodyweight • Strong Core"
                },
                {
                  name: "Kiran",
                  age: 22,
                  goal: "Lost 12kg fat, gained muscle",
                  desc: "TFS powerlifting and CrossFit functional training zones kept me highly motivated every single day.",
                  beforeStats: "28% FAT",
                  beforeLabel: "Sedentary • Zero Lift",
                  afterStats: "14% FAT",
                  afterLabel: "Deadlift 180kg • Powerlifter"
                },
                {
                  name: "Deepa",
                  age: 40,
                  goal: "Reversed metabolic issues",
                  desc: "Diet guidance integrated with custom strength plans. My blood markers are normal again after years.",
                  beforeStats: "HbA1c: 7.2",
                  beforeLabel: "High Sugar • Low Stamina",
                  afterStats: "HbA1c: 5.4",
                  afterLabel: "Normal Biomarkers • Energized"
                },
              ].map((story, idx) => (
                <motion.div
                  key={idx}
                  className="story-card"
                  whileHover={{ scale: 1.03, boxShadow: `0 15px 35px rgba(255, 69, 0, 0.15)` }}
                  style={{
                    flex: isTablet ? "0 0 auto" : "unset",
                    width: isTablet ? (isMobile ? "calc(100vw - 64px)" : "360px") : "100%",
                    scrollSnapAlign: "center",
                    backgroundColor: colors.forge,
                    border: "1px solid rgba(255,255,256,0.06)",
                    borderRadius: "2px",
                    padding: "24px",
                    userSelect: "none",
                  }}
                >
                  {/* Before / After interactive slider */}
                  <BeforeAfterSlider
                    beforeStats={story.beforeStats}
                    beforeLabel={story.beforeLabel}
                    afterStats={story.afterStats}
                    afterLabel={story.afterLabel}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px", marginTop: "20px" }}>
                    <h4 style={{ fontFamily: fonts.accent, fontSize: "20px", color: colors.titanium }}>
                      {story.name}, {story.age}
                    </h4>
                    <div style={{ display: "flex", gap: "2px", color: colors.gold }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ fontSize: "12px" }}>★</span>
                      ))}
                    </div>
                  </div>

                  <span style={{ fontFamily: fonts.body, fontSize: "13px", fontWeight: 700, color: colors.ember, display: "block", marginBottom: "12px", textTransform: "uppercase" }}>
                    {story.goal}
                  </span>

                  <p style={{ fontFamily: fonts.body, fontSize: "14px", lineHeight: 1.6, color: colors.chrome }}>
                    "{story.desc}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Carousel Scroll Progress Bar */}
          {isTablet && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "24px",
                gap: "12px",
              }}
            >
              <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.iron, letterSpacing: "1px", textTransform: "uppercase" }}>
                {isMobile ? "Swipe to see results" : "Drag or use controls to see results"}
              </span>
              <div
                style={{
                  width: "120px",
                  height: "2px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  position: "relative",
                  borderRadius: "1px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${storyCarousel.scrollProgress}%`,
                    backgroundColor: colors.ember,
                    boxShadow: `0 0 8px ${colors.ember}`,
                    borderRadius: "1px",
                    transition: "width 0.15s ease-out",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 9 — REVIEWS & TESTIMONIALS */}
      <section
        id="reviews"
        ref={reviewsRef}
        style={{
          backgroundColor: colors.steel,
          padding: isMobile ? "80px 16px" : "120px 24px",
          position: "relative",
          clipPath: "polygon(0 0, 100% 60px, 100% 100%, 0 100%)",
          marginTop: "-60px",
          zIndex: 5,
        }}
      >
        {/* Glow Strip Transition Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: `linear-gradient(to bottom, ${colors.ember}11, transparent)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isTablet ? "1fr" : "1fr 2fr",
              gap: isTablet ? "32px" : "64px",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Left Column Rating */}
            <div
              className="reviews-left"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isTablet ? "center" : "flex-start",
                gap: "16px",
                textAlign: isTablet ? "center" : "left",
                width: "100%",
              }}
            >
              <span
                className="reviews-header-el"
                style={{
                  fontFamily: fonts.accent,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "4px",
                  color: colors.ember,
                  textTransform: "uppercase",
                }}
              >
                300+ HAPPY MEMBERS
              </span>
              <h2
                className="reviews-header-el"
                style={{
                  fontFamily: fonts.display,
                  fontSize: isMobile ? "36px" : "48px",
                  color: colors.titanium,
                  lineHeight: 1,
                }}
              >
                GOOGLE TRUSTED
              </h2>

              <div
                className="reviews-header-el"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isTablet ? "center" : "flex-start",
                  gap: "8px",
                  marginTop: "16px",
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.accent,
                    fontSize: isMobile ? "72px" : "96px",
                    fontWeight: 700,
                    color: colors.ember,
                    lineHeight: 0.9,
                  }}
                >
                  4.9
                </span>
                <div style={{ display: "flex", gap: "4px", color: colors.gold }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ fontSize: "24px" }}>★</span>
                  ))}
                </div>
                <span style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, marginTop: "8px" }}>
                  Based on 300+ Google Reviews
                </span>
              </div>
            </div>

            {/* Right Column: Carousel on Mobile/Tablet, Grid on Desktop */}
            <div className="reviews-right" style={{ position: "relative", width: "100%", overflow: "visible" }}>
              {isTablet && !isMobile && (
                <>
                  <button
                    onClick={() => reviewsCarousel.scroll("left")}
                    style={btnStyleLeft}
                    onMouseEnter={btnHover}
                    onMouseLeave={btnLeave}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => reviewsCarousel.scroll("right")}
                    style={btnStyleRight}
                    onMouseEnter={btnHover}
                    onMouseLeave={btnLeave}
                  >
                    →
                  </button>
                </>
              )}

              <div
                ref={reviewsCarousel.ref}
                onMouseDown={reviewsCarousel.handleMouseDown}
                onMouseMove={reviewsCarousel.handleMouseMove}
                onMouseUp={reviewsCarousel.handleMouseUpOrLeave}
                onMouseLeave={reviewsCarousel.handleMouseUpOrLeave}
                onScroll={reviewsCarousel.handleScroll}
                onMouseEnter={reviewsCarousel.onMouseEnter}
                onMouseLeave={reviewsCarousel.onMouseLeave}
                style={
                  isTablet
                    ? {
                        display: "flex",
                        gap: "20px",
                        overflowX: "scroll",
                        scrollbarWidth: "none", // Firefox
                        msOverflowStyle: "none", // IE
                        cursor: reviewsCarousel.isDragging ? "grabbing" : "grab",
                        paddingBottom: "20px",
                        width: "100%",
                        scrollSnapType: "x mandatory",
                        paddingLeft: "24px",
                        paddingRight: "24px",
                        boxSizing: "border-box",
                      }
                    : {
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "24px",
                        width: "100%",
                      }
                }
              >
                {isTablet && <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />}

                {reviews.map((rev, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5, scale: 1.02 }}
                    style={{
                      backgroundColor: colors.forge,
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "2px",
                      padding: "32px",
                      position: "relative",
                      flex: isTablet ? "0 0 auto" : "unset",
                      width: isTablet ? (isMobile ? "calc(100vw - 64px)" : "330px") : "100%",
                      scrollSnapAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Quote watermark background */}
                    <div
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "-15px",
                        fontFamily: fonts.display,
                        fontSize: "90px",
                        color: colors.ember,
                        opacity: 0.06,
                        pointerEvents: "none",
                      }}
                    >
                      “
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontFamily: fonts.accent, fontSize: "16px", fontWeight: 600, color: colors.titanium }}>
                            {rev.name}
                          </span>
                          <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.iron }}>
                            {rev.loc}
                          </span>
                        </div>
                        
                        {/* Google G logo badge */}
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: fonts.accent,
                            fontSize: "12px",
                            color: "#4285F4",
                            fontWeight: 900,
                          }}
                        >
                          G
                        </div>
                      </div>
                      <p style={{ fontFamily: fonts.body, fontSize: "14px", lineHeight: 1.6, color: colors.chrome, fontStyle: "italic", marginBottom: "16px" }}>
                        "{rev.text}"
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "2px", color: colors.gold }}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ fontSize: "12px" }}>★</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar (Mobile Only) */}
              {isTablet && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: "24px",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontFamily: fonts.body, fontSize: "11px", color: colors.iron, letterSpacing: "1px", textTransform: "uppercase" }}>
                    {isMobile ? "Swipe to read more reviews" : "Drag or use controls to read more reviews"}
                  </span>
                  <div
                    style={{
                      width: "120px",
                      height: "2px",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      position: "relative",
                      borderRadius: "1px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: `${reviewsCarousel.scrollProgress}%`,
                        backgroundColor: colors.ember,
                        boxShadow: `0 0 8px ${colors.ember}`,
                        borderRadius: "1px",
                        transition: "width 0.15s ease-out",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — BMI CALCULATOR */}
      <section
        id="bmi"
        ref={bmiRef}
        style={{
          backgroundColor: colors.obsidian,
          padding: isMobile ? "80px 16px" : "120px 24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span
              className="bmi-header-el"
              style={{
                fontFamily: fonts.accent,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: colors.ember,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              CHECK YOUR BMI
            </span>
            <h2
              className="bmi-header-el"
              style={{
                fontFamily: fonts.display,
                fontSize: "clamp(36px, 6vw, 72px)",
                color: colors.titanium,
                textTransform: "uppercase",
                marginTop: "12px",
                display: "block",
              }}
            >
              FITNESS CALCULATOR
            </h2>
            <p
              className="bmi-header-el"
              style={{
                fontFamily: fonts.body,
                fontSize: "16px",
                color: colors.iron,
                marginTop: "12px",
                display: "block",
              }}
            >
              Get an instant health check — powered by science
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1fr",
              gap: "48px",
              alignItems: "start",
              width: "100%",
            }}
          >
            {/* Left Column Form */}
            <div className="bmi-left" style={{ backgroundColor: colors.forge, padding: isMobile ? "24px 16px" : "40px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.chrome }}>Your Name</label>
                  <input
                    type="text"
                    value={bmiInputs.name}
                    onChange={(e) => setBmiInputs({ ...bmiInputs, name: e.target.value })}
                    placeholder="Enter name"
                    onFocus={() => setActiveInput("bmiName")}
                    onBlur={() => setActiveInput("")}
                    style={{
                      backgroundColor: colors.steel,
                      border: activeInput === "bmiName" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "4px", // Spec: BMI fields get 4px rounded corners
                      padding: "12px 16px",
                      color: colors.titanium,
                      fontFamily: fonts.body,
                      fontSize: "16px",
                      outline: "none",
                      boxShadow: activeInput === "bmiName" ? `0 0 10px ${colors.ember}66` : "none",
                      transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.chrome }}>Height (cm)</label>
                    <input
                      type="number"
                      value={bmiInputs.height}
                      onChange={(e) => setBmiInputs({ ...bmiInputs, height: e.target.value })}
                      placeholder="e.g. 175"
                      onFocus={() => setActiveInput("bmiHeight")}
                      onBlur={() => setActiveInput("")}
                      style={{
                        backgroundColor: colors.steel,
                        border: activeInput === "bmiHeight" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "4px", // Spec: BMI fields get 4px rounded corners
                        padding: "12px 16px",
                        color: colors.titanium,
                        fontFamily: fonts.body,
                        fontSize: "16px",
                        outline: "none",
                        boxShadow: activeInput === "bmiHeight" ? `0 0 10px ${colors.ember}66` : "none",
                        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.chrome }}>Weight (kg)</label>
                    <input
                      type="number"
                      value={bmiInputs.weight}
                      onChange={(e) => setBmiInputs({ ...bmiInputs, weight: e.target.value })}
                      placeholder="e.g. 70"
                      onFocus={() => setActiveInput("bmiWeight")}
                      onBlur={() => setActiveInput("")}
                      style={{
                        backgroundColor: colors.steel,
                        border: activeInput === "bmiWeight" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "4px", // Spec: BMI fields get 4px rounded corners
                        padding: "12px 16px",
                        color: colors.titanium,
                        fontFamily: fonts.body,
                        fontSize: "16px",
                        outline: "none",
                        boxShadow: activeInput === "bmiWeight" ? `0 0 10px ${colors.ember}66` : "none",
                        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.chrome }}>Age</label>
                    <input
                      type="number"
                      value={bmiInputs.age}
                      onChange={(e) => setBmiInputs({ ...bmiInputs, age: e.target.value })}
                      placeholder="e.g. 24"
                      onFocus={() => setActiveInput("bmiAge")}
                      onBlur={() => setActiveInput("")}
                      style={{
                        backgroundColor: colors.steel,
                        border: activeInput === "bmiAge" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "4px", // Spec: BMI fields get 4px rounded corners
                        padding: "12px 16px",
                        color: colors.titanium,
                        fontFamily: fonts.body,
                        fontSize: "16px",
                        outline: "none",
                        boxShadow: activeInput === "bmiAge" ? `0 0 10px ${colors.ember}66` : "none",
                        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.chrome }}>Gender</label>
                    <div style={{ display: "flex", gap: "4px", backgroundColor: colors.steel, padding: "4px", borderRadius: "4px" }}>
                      {["Male", "Female"].map((g) => (
                        <button
                          key={g}
                          onClick={() => setBmiInputs({ ...bmiInputs, gender: g })}
                          style={{
                            flex: 1,
                            padding: "10px",
                            backgroundColor: bmiInputs.gender === g ? colors.ember : "transparent",
                            color: colors.titanium,
                            border: "none",
                            borderRadius: "2px",
                            cursor: "pointer",
                            fontFamily: fonts.accent,
                            fontSize: "12px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                          }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={calculateBmi}
                  style={{
                    backgroundColor: colors.ember,
                    color: colors.titanium,
                    border: "none",
                    borderRadius: "2px",
                    padding: "16px",
                    fontFamily: fonts.accent,
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    cursor: "pointer",
                    marginTop: "12px",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.emberSoft)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.ember)}
                >
                  CALCULATE BMI
                </motion.button>
              </div>
            </div>

            {/* Right Column Results Display */}
            <div style={{ minHeight: "380px", width: "100%" }}>
              <AnimatePresence mode="wait">
                {bmiResult ? (
                  <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      backgroundColor: colors.forge,
                      padding: isMobile ? "24px 16px" : "40px",
                      border: `1px solid ${bmiResult.color}44`,
                      borderRadius: "2px",
                      height: "100%",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <span style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, textTransform: "uppercase", letterSpacing: "2px" }}>
                      YOUR RESULT {bmiInputs.name ? `(${bmiInputs.name})` : ""}
                    </span>

                    <div style={{ display: "flex", alignItems: "baseline", gap: "16px", margin: "20px 0 10px" }}>
                      <span style={{ fontFamily: fonts.accent, fontSize: "80px", fontWeight: 700, color: bmiResult.color, lineHeight: 1 }}>
                        {bmiResult.score}
                      </span>
                      <span style={{ fontFamily: fonts.display, fontSize: "32px", color: colors.titanium }}>
                        {bmiResult.category}
                      </span>
                    </div>

                    {/* Scale bar with animated pointer */}
                    <div style={{ margin: "24px 0" }}>
                      <div
                        style={{
                          height: "12px",
                          background: "linear-gradient(90deg, #4FC3F7 0%, #4CAF50 35%, #FFA726 70%, #FF4500 100%)",
                          borderRadius: "6px",
                          position: "relative",
                        }}
                      >
                        {/* Scale Slider Pointer */}
                        <motion.div
                          animate={{ left: `${Math.min(Math.max(((bmiResult.score - 15) / (35 - 15)) * 100, 0), 100)}%` }}
                          transition={{ type: "spring", stiffness: 120 }}
                          style={{
                            position: "absolute",
                            top: "-6px",
                            width: "24px",
                            height: "24px",
                            backgroundColor: colors.titanium,
                            border: `3px solid ${bmiResult.color}`,
                            borderRadius: "50%",
                            transform: "translateX(-12px)",
                            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontFamily: fonts.body, fontSize: "11px", color: colors.iron }}>
                        <span>15 (Underweight)</span>
                        <span>25 (Overweight)</span>
                        <span>35 (Obese)</span>
                      </div>
                    </div>

                    <p style={{ fontFamily: fonts.body, fontSize: "15px", lineHeight: 1.6, color: colors.chrome, marginBottom: "32px" }}>
                      {bmiResult.message}
                    </p>

                    <motion.a
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href="#contact"
                      style={{
                        backgroundColor: colors.ember,
                        color: colors.titanium,
                        fontFamily: fonts.accent,
                        fontSize: "14px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        padding: "16px",
                        textAlign: "center",
                        textDecoration: "none",
                        borderRadius: "2px",
                        transition: "background-color 0.3s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.emberSoft)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.ember)}
                    >
                      Book a Free Consultation
                    </motion.a>
                  </motion.div>
                ) : (
                  <div
                    className="bmi-right-empty"
                    style={{
                      border: "2px dashed rgba(255, 255, 255, 0.06)",
                      height: "100%",
                      borderRadius: "2px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: isMobile ? "24px 16px" : "40px",
                      textAlign: "center",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <span style={{ fontSize: "48px", marginBottom: "16px" }}>📊</span>
                    <h4 style={{ fontFamily: fonts.accent, fontSize: "20px", color: colors.titanium }}>Calculate Your Status</h4>
                    <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, maxWidth: "280px", marginTop: "8px" }}>
                      Enter your stats on the left to review your personalized BMI assessment and workout insights.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11 — GALLERY */}
      <section
        id="gallery"
        ref={galleryRef}
        style={{
          backgroundColor: colors.steel,
          padding: isMobile ? "80px 16px" : "120px 24px",
          position: "relative",
          clipPath: "polygon(0 0, 100% 60px, 100% 100%, 0 100%)",
          marginTop: "-60px",
          zIndex: 5,
        }}
      >
        {/* Glow Strip Transition Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: `linear-gradient(to bottom, ${colors.ember}11, transparent)`,
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span
              className="gallery-header-el"
              style={{
                fontFamily: fonts.accent,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: colors.ember,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              INSIDE TFS GYM
            </span>
            <h2
              className="gallery-header-el"
              style={{
                fontFamily: fonts.display,
                fontSize: "clamp(36px, 6vw, 72px)",
                color: colors.titanium,
                textTransform: "uppercase",
                marginTop: "12px",
                display: "block",
              }}
            >
              OUR FACILITY GALLERY
            </h2>
          </div>

          {/* Carousel/Masonry Wrapper */}
          <div style={{ position: "relative", width: "100%" }}>
            {isTablet && !isMobile && (
              <>
                <button
                  onClick={() => galleryCarousel.scroll("left")}
                  style={btnStyleLeft}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                >
                  ←
                </button>
                <button
                  onClick={() => galleryCarousel.scroll("right")}
                  style={btnStyleRight}
                  onMouseEnter={btnHover}
                  onMouseLeave={btnLeave}
                >
                  →
                </button>
              </>
            )}

            <div
              ref={galleryCarousel.ref}
              onMouseDown={galleryCarousel.handleMouseDown}
              onMouseMove={galleryCarousel.handleMouseMove}
              onMouseUp={galleryCarousel.handleMouseUpOrLeave}
              onMouseLeave={galleryCarousel.handleMouseUpOrLeave}
              onScroll={galleryCarousel.handleScroll}
              onMouseEnter={galleryCarousel.onMouseEnter}
              onMouseLeave={galleryCarousel.onMouseLeave}
              style={
                isTablet
                  ? {
                      display: "flex",
                      gap: "20px",
                      overflowX: "scroll",
                      scrollbarWidth: "none", // Firefox
                      msOverflowStyle: "none", // IE
                      cursor: galleryCarousel.isDragging ? "grabbing" : "grab",
                      paddingBottom: "20px",
                      width: "100%",
                      scrollSnapType: "x mandatory",
                      paddingLeft: "24px",
                      paddingRight: "24px",
                      boxSizing: "border-box",
                    }
                  : {
                      columnCount: 3,
                      columnGap: "16px",
                      width: "100%",
                    }
              }
            >
              {isTablet && <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />}

              {galleryItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  className="gallery-card"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveGalleryIndex(idx)}
                  style={{
                    backgroundColor: colors.forge,
                    height: isTablet ? "240px" : `${item.height}px`,
                    flex: isTablet ? "0 0 auto" : "unset",
                    width: isTablet ? (isMobile ? "calc(100vw - 64px)" : "300px") : "100%",
                    scrollSnapAlign: "center",
                    marginBottom: isTablet ? "0" : "16px",
                    borderRadius: "2px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    backgroundImage: `url(${item.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.06)",
                    transition: "border-color 0.3s ease",
                    breakInside: isTablet ? "unset" : "avoid",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.ember;
                    const overlay = e.currentTarget.querySelector(".gallery-overlay");
                    if (overlay) overlay.style.opacity = 1;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    const overlay = e.currentTarget.querySelector(".gallery-overlay");
                    if (overlay) overlay.style.opacity = 0;
                  }}
                >

                  {/* Hover overlay */}
                  <div
                    className="gallery-overlay"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(255, 69, 0, 0.9)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.3s ease",
                      padding: "20px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontFamily: fonts.accent, fontSize: "24px", color: colors.titanium, fontWeight: 700, textTransform: "uppercase" }}>
                      {item.title}
                    </span>
                    <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.titanium, marginTop: "8px", letterSpacing: "1px", textTransform: "uppercase" }}>
                      CLICK TO VIEW
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Carousel Scroll Progress Bar */}
          {isTablet && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "24px",
                gap: "12px",
              }}
            >
              <span style={{ fontFamily: fonts.body, fontSize: "12px", color: colors.iron, letterSpacing: "1px", textTransform: "uppercase" }}>
                {isMobile ? "Swipe to browse gallery" : "Drag or use controls to browse gallery"}
              </span>
              <div
                style={{
                  width: "120px",
                  height: "2px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  position: "relative",
                  borderRadius: "1px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${galleryCarousel.scrollProgress}%`,
                    backgroundColor: colors.ember,
                    boxShadow: `0 0 8px ${colors.ember}`,
                    borderRadius: "1px",
                    transition: "width 0.15s ease-out",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {activeGalleryIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveGalleryIndex(null)}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(10, 10, 10, 0.95)",
                zIndex: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "800px",
                  width: "100%",
                  backgroundColor: colors.forge,
                  border: `2px solid ${colors.ember}`,
                  borderRadius: "2px",
                  position: "relative",
                  padding: "48px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backgroundImage: `linear-gradient(rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.9)), url(${galleryItems[activeGalleryIndex].img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setActiveGalleryIndex(null)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    backgroundColor: "transparent",
                    border: "none",
                    color: colors.titanium,
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "8px",
                  }}
                >
                  ✕
                </button>

                <span style={{ fontSize: "64px", marginBottom: "20px" }}>🏋️</span>
                <h3 style={{ fontFamily: fonts.display, fontSize: "48px", color: colors.titanium, marginBottom: "16px", textTransform: "uppercase" }}>
                  {galleryItems[activeGalleryIndex].title}
                </h3>
                <p style={{ fontFamily: fonts.body, fontSize: "16px", color: colors.chrome, maxWidth: "500px", lineHeight: 1.6 }}>
                  Our premium {galleryItems[activeGalleryIndex].title.toLowerCase()} zone is equipped with commercial-grade strength training, cardio mechanisms, and customized biomechanical machines built to forge results.
                </p>

                <button
                  onClick={() => setActiveGalleryIndex(null)}
                  style={{
                    marginTop: "32px",
                    backgroundColor: colors.ember,
                    color: colors.titanium,
                    border: "none",
                    fontFamily: fonts.accent,
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    padding: "12px 32px",
                    cursor: "pointer",
                    borderRadius: "2px",
                  }}
                >
                  CLOSE VIEW
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* SECTION 12 — CONTACT & JOIN NOW */}
      <section
        id="contact"
        ref={contactRef}
        style={{
          backgroundColor: colors.obsidian,
          padding: isMobile ? "80px 16px" : "120px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial Center Accent Glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "500px",
            height: "500px",
            background: `radial-gradient(circle, ${colors.emberGlow} 0%, transparent 60%)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ maxWidth: "1280px", margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span
              className="contact-header-el"
              style={{
                fontFamily: fonts.accent,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: colors.ember,
                textTransform: "uppercase",
                display: "block",
              }}
            >
              READY TO TRANSFORM?
            </span>
            <h2
              className="contact-header-el"
              style={{
                fontFamily: fonts.display,
                fontSize: "clamp(36px, 6vw, 72px)",
                color: colors.titanium,
                textTransform: "uppercase",
                marginTop: "12px",
                display: "block",
              }}
            >
              CLAIM YOUR FREE TRIAL
            </h2>
            <p
              className="contact-header-el"
              style={{
                fontFamily: fonts.body,
                fontSize: "16px",
                color: colors.iron,
                marginTop: "12px",
                display: "block",
              }}
            >
              Join Eluru's highest-rated gym today
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 1.2fr",
              gap: "48px",
              alignItems: "start",
              width: "100%",
            }}
          >
            {/* Left Column Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
              {[
                { label: "📍 ADDRESS", val: "First Floor, Sannivasa Complex, D-Mart Road, Opposite Sivalayam, Powerpet, Eluru – 534002" },
                { label: "📞 PHONE", val: "+91 96760 39944" },
                { label: "⏰ OPEN HOURS", val: "Open Daily | 5:00 AM – 10:00 PM" },
              ].map((info, idx) => (
                <div
                  key={idx}
                  className="contact-left-card"
                  style={{
                    backgroundColor: colors.forge,
                    borderLeft: `4px solid ${colors.ember}`,
                    padding: "24px",
                    borderRadius: "2px",
                    width: "100%",
                  }}
                >
                  <span style={{ fontFamily: fonts.accent, fontSize: "12px", fontWeight: 700, letterSpacing: "2px", color: colors.ember, display: "block", marginBottom: "8px" }}>
                    {info.label}
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.titanium, lineHeight: 1.5 }}>
                    {info.val}
                  </span>
                </div>
              ))}

              {/* 4 Action Buttons Grid */}
              <div
                className="contact-left-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "12px",
                  marginTop: "12px",
                  width: "100%",
                }}
              >
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  href="tel:+919676039944"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                    border: `1px solid ${colors.ember}`,
                    color: colors.ember,
                    fontFamily: fonts.accent,
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    textDecoration: "none",
                    borderRadius: "2px",
                    transition: "background-color 0.3s ease, color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.ember;
                    e.currentTarget.style.color = colors.titanium;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.ember;
                  }}
                >
                  📞 Call Now
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://wa.me/919676039944"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                    border: `1px solid ${colors.ember}`,
                    color: colors.ember,
                    fontFamily: fonts.accent,
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    textDecoration: "none",
                    borderRadius: "2px",
                    transition: "background-color 0.3s ease, color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.ember;
                    e.currentTarget.style.color = colors.titanium;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.ember;
                  }}
                >
                  💬 WhatsApp
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  href="https://maps.google.com/?q=First+Floor,+Sannivasa+Complex,+D-Mart+Road,+Opposite+Sivalayam,+Powerpet,+Eluru+–+534002"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                    border: `1px solid ${colors.ember}`,
                    color: colors.ember,
                    fontFamily: fonts.accent,
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    textDecoration: "none",
                    borderRadius: "2px",
                    transition: "background-color 0.3s ease, color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.ember;
                    e.currentTarget.style.color = colors.titanium;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.ember;
                  }}
                >
                  📍 Directions
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  href="#instagram"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "16px",
                    border: `1px solid ${colors.ember}`,
                    color: colors.ember,
                    fontFamily: fonts.accent,
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    textDecoration: "none",
                    borderRadius: "2px",
                    transition: "background-color 0.3s ease, color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.ember;
                    e.currentTarget.style.color = colors.titanium;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.ember;
                  }}
                >
                  📸 Instagram
                </motion.a>
              </div>
            </div>

            {/* Right Column Claim Trial Form */}
            <div className="contact-right-form" style={{ backgroundColor: colors.forge, padding: isMobile ? "24px 16px" : "40px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "2px", width: "100%", boxSizing: "border-box" }}>
              <AnimatePresence mode="wait">
                {claimSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "40px 0",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        border: `3px solid ${colors.ember}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "36px",
                        color: colors.ember,
                        marginBottom: "24px",
                      }}
                    >
                      ✓
                    </div>
                    <h3 style={{ fontFamily: fonts.display, fontSize: "32px", color: colors.titanium, textTransform: "uppercase" }}>
                      SESSION RESERVED!
                    </h3>
                    <p style={{ fontFamily: fonts.body, fontSize: "15px", color: colors.chrome, marginTop: "12px", maxWidth: "340px", lineHeight: 1.6 }}>
                      Thank you {claimForm.name}. We have registered your goals. Our head coach Tarun will call you shortly to lock in your free slot!
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setClaimForm({ name: "", phone: "", email: "", goal: "Weight Loss", message: "" });
                        setClaimSuccess(false);
                      }}
                      style={{
                        marginTop: "32px",
                        backgroundColor: "transparent",
                        border: `1px solid ${colors.ember}`,
                        color: colors.ember,
                        fontFamily: fonts.accent,
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        padding: "10px 24px",
                        cursor: "pointer",
                        borderRadius: "2px",
                      }}
                    >
                      SUBMIT ANOTHER REQUEST
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                  >
                    <h3 style={{ fontFamily: fonts.accent, fontSize: "20px", color: colors.titanium, textTransform: "uppercase", marginBottom: "8px" }}>
                      CLAIM FREE TRIAL SESSION
                    </h3>

                    {formError && (
                      <div style={{ backgroundColor: "rgba(255, 69, 0, 0.1)", border: `1px solid ${colors.ember}`, padding: "12px", borderRadius: "2px", color: colors.ember, fontSize: "13px", fontFamily: fonts.body }}>
                        {formError}
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.chrome }}>Name *</label>
                      <input
                        type="text"
                        value={claimForm.name}
                        onChange={(e) => setClaimForm({ ...claimForm, name: e.target.value })}
                        placeholder="Your full name"
                        onFocus={() => setActiveInput("contactName")}
                        onBlur={() => setActiveInput("")}
                        style={{
                          backgroundColor: colors.steel,
                          border: activeInput === "contactName" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "2px",
                          padding: "12px 16px",
                          color: colors.titanium,
                          fontFamily: fonts.body,
                          fontSize: "15px",
                          outline: "none",
                          boxShadow: activeInput === "contactName" ? `0 0 10px ${colors.ember}66` : "none",
                          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.chrome }}>Phone *</label>
                        <input
                          type="tel"
                          value={claimForm.phone}
                          onChange={(e) => setClaimForm({ ...claimForm, phone: e.target.value })}
                          placeholder="Phone number"
                          onFocus={() => setActiveInput("contactPhone")}
                          onBlur={() => setActiveInput("")}
                          style={{
                            backgroundColor: colors.steel,
                            border: activeInput === "contactPhone" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "2px",
                            padding: "12px 16px",
                            color: colors.titanium,
                            fontFamily: fonts.body,
                            fontSize: "15px",
                            outline: "none",
                            boxShadow: activeInput === "contactPhone" ? `0 0 10px ${colors.ember}66` : "none",
                            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.chrome }}>Email *</label>
                        <input
                          type="email"
                          value={claimForm.email}
                          onChange={(e) => setClaimForm({ ...claimForm, email: e.target.value })}
                          placeholder="Email address"
                          onFocus={() => setActiveInput("contactEmail")}
                          onBlur={() => setActiveInput("")}
                          style={{
                            backgroundColor: colors.steel,
                            border: activeInput === "contactEmail" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "2px",
                            padding: "12px 16px",
                            color: colors.titanium,
                            fontFamily: fonts.body,
                            fontSize: "15px",
                            outline: "none",
                            boxShadow: activeInput === "contactEmail" ? `0 0 10px ${colors.ember}66` : "none",
                            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.chrome }}>Your Main Goal</label>
                      <select
                        value={claimForm.goal}
                        onChange={(e) => setClaimForm({ ...claimForm, goal: e.target.value })}
                        onFocus={() => setActiveInput("contactGoal")}
                        onBlur={() => setActiveInput("")}
                        style={{
                          backgroundColor: colors.steel,
                          border: activeInput === "contactGoal" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "2px",
                          padding: "12px 16px",
                          color: colors.titanium,
                          fontFamily: fonts.body,
                          fontSize: "15px",
                          outline: "none",
                          boxShadow: activeInput === "contactGoal" ? `0 0 10px ${colors.ember}66` : "none",
                          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                        }}
                      >
                        <option value="Weight Loss">Weight Loss / Fat Burn</option>
                        <option value="Muscle Building">Muscle Building / Strength</option>
                        <option value="CrossFit">CrossFit / HIIT</option>
                        <option value="Aerobics">Aerobics / Dance Fitness</option>
                        <option value="Personal Training">1-on-1 Personal Coaching</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <label style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.chrome }}>Message (Optional)</label>
                      <textarea
                        value={claimForm.message}
                        onChange={(e) => setClaimForm({ ...claimForm, message: e.target.value })}
                        placeholder="Tell us about your fitness targets"
                        rows="3"
                        onFocus={() => setActiveInput("contactMessage")}
                        onBlur={() => setActiveInput("")}
                        style={{
                          backgroundColor: colors.steel,
                          border: activeInput === "contactMessage" ? `1px solid ${colors.ember}` : "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "2px",
                          padding: "12px 16px",
                          color: colors.titanium,
                          fontFamily: fonts.body,
                          fontSize: "15px",
                          outline: "none",
                          resize: "none",
                          boxShadow: activeInput === "contactMessage" ? `0 0 10px ${colors.ember}66` : "none",
                          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                        }}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClaimSubmit}
                      style={{
                        backgroundColor: colors.ember,
                        color: colors.titanium,
                        border: "none",
                        borderRadius: "2px",
                        padding: "18px",
                        fontFamily: fonts.accent,
                        fontSize: "14px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                        marginTop: "8px",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.emberSoft)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.ember)}
                    >
                      CLAIM FREE TRIAL SESSION
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        ref={footerRef}
        style={{
          backgroundColor: "#050505",
          borderTop: `1px solid ${colors.ember}`,
          padding: "80px 24px 32px",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 1fr 1.5fr",
            gap: "48px",
            paddingBottom: "48px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Column 1: Brand */}
          <div className="footer-col" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <span style={{ fontFamily: fonts.display, fontSize: "36px", color: colors.ember, letterSpacing: "1px" }}>
              TFS <span style={{ color: colors.titanium }}>GYM</span>
            </span>
            <span style={{ fontFamily: fonts.accent, fontSize: "14px", fontWeight: 700, color: colors.titanium, letterSpacing: "2px", textTransform: "uppercase" }}>
              Forge Your Best Self
            </span>
            <p style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, lineHeight: 1.6, maxWidth: "360px" }}>
              TFS Gym — Tarun's Fitness Solutions is Eluru's premium destination for fitness and physical transformation. Build strength, lose fat, and reform your body under scientific guidance.
            </p>
            {/* Social icons row */}
            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              <span style={{ fontSize: "20px", cursor: "pointer" }}>📸</span>
              <span style={{ fontSize: "20px", cursor: "pointer" }}>💬</span>
              <span style={{ fontSize: "20px", cursor: "pointer" }}>📍</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="footer-col" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ fontFamily: fonts.accent, fontSize: "18px", color: colors.titanium, textTransform: "uppercase" }}>Company</h4>
            <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <a href="#about" style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, textDecoration: "none" }} onMouseEnter={(e) => (e.currentTarget.style.color = colors.ember)} onMouseLeave={(e) => (e.currentTarget.style.color = colors.iron)}>About Us</a>
              <a href="#programs" style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, textDecoration: "none" }} onMouseEnter={(e) => (e.currentTarget.style.color = colors.ember)} onMouseLeave={(e) => (e.currentTarget.style.color = colors.iron)}>Our Programs</a>
              <a href="#membership" style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, textDecoration: "none" }} onMouseEnter={(e) => (e.currentTarget.style.color = colors.ember)} onMouseLeave={(e) => (e.currentTarget.style.color = colors.iron)}>Membership Plans</a>
              <a href="#gallery" style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, textDecoration: "none" }} onMouseEnter={(e) => (e.currentTarget.style.color = colors.ember)} onMouseLeave={(e) => (e.currentTarget.style.color = colors.iron)}>Facility Gallery</a>
              <a href="#contact" style={{ fontFamily: fonts.body, fontSize: "14px", color: colors.iron, textDecoration: "none" }} onMouseEnter={(e) => (e.currentTarget.style.color = colors.ember)} onMouseLeave={(e) => (e.currentTarget.style.color = colors.iron)}>Contact & Join</a>
            </nav>
          </div>

          {/* Column 3: Directions and Google Maps embed placeholder */}
          <div className="footer-col" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ fontFamily: fonts.accent, fontSize: "18px", color: colors.titanium, textTransform: "uppercase" }}>Our Location</h4>
            <motion.div
              whileHover={{ scale: 1.02 }}
              style={{
                backgroundColor: colors.forge,
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "2px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                cursor: "pointer",
                backgroundImage: "radial-gradient(rgba(255, 69, 0, 0.1) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
                height: "150px",
              }}
              onClick={() => window.open("https://maps.google.com/?q=First+Floor,+Sannivasa+Complex,+D-Mart+Road,+Opposite+Sivalayam,+Powerpet,+Eluru+–+534002", "_blank")}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.ember)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)")}
            >
              <span style={{ fontSize: "28px", marginBottom: "8px" }}>📍</span>
              <span style={{ fontFamily: fonts.accent, fontSize: "14px", color: colors.titanium, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
                VIEW ON MAPS
              </span>
              <span style={{ fontFamily: fonts.body, fontSize: "11px", color: colors.iron, marginTop: "4px" }}>
                Opposite Sivalayam, Powerpet, Eluru
              </span>
            </motion.div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <span style={{ fontFamily: fonts.body, fontSize: "13px", color: colors.iron }}>
            © 2025 TFS Gym – Tarun's Fitness Solutions | Powerpet, Eluru, AP
          </span>

          <span style={{ fontFamily: fonts.body, fontSize: "10px", color: colors.iron, letterSpacing: "1px" }}>
            Best Gym in Eluru | Personal Trainer Eluru | Fitness Center Eluru
          </span>
        </div>
      </footer>
    </div>
  );
}
