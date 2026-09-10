// Comprehensive Instagram-Style Chat Wallpapers & Pattern Themes
import React from "react";

export interface ChatTheme {
  id: string;
  name: string;
  category: "Popular & Patterns" | "Romance & Hearts" | "Space & Sci-Fi" | "Anime & Gaming" | "Nature & Vibes" | "Retro & Neon" | "Luxury & Dark" | "Gradients & Minimal";
  badge?: string;
  isDark: boolean;
  preview: string; // CSS background / gradient for swatch in settings
  containerClass?: string; // Optional tailwind classes
  containerStyle?: React.CSSProperties; // SVG patterns, gradients, and styling
  description: string;
  suggestedSent?: string;
}

export const THEME_CATEGORIES = [
  "All",
  "Popular & Patterns",
  "Romance & Hearts",
  "Space & Sci-Fi",
  "Anime & Gaming",
  "Nature & Vibes",
  "Retro & Neon",
  "Luxury & Dark",
  "Gradients & Minimal",
] as const;

export const CHAT_THEMES: ChatTheme[] = [
  // ── 1. POPULAR & PATTERNS ──
  {
    id: "chat-doodles",
    name: "Instagram DMs",
    category: "Popular & Patterns",
    badge: "Most Popular",
    isDark: true,
    preview: "linear-gradient(135deg, #181926 0%, #24273a 100%)",
    containerStyle: {
      backgroundColor: "#181926",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%2389b4fa' fill-opacity='0.15'%3E%3Cpath d='M14 12c-4 0-7 3-7 7s3 7 7 7h4v4l6-4h5c4 0 7-3 7-7s-3-7-7-7H14zm44 4a5 5 0 0 0-5 5c0 3 5 8 5 8s5-5 5-8a5 5 0 0 0-5-5zm-34 38l-4 6 12-2-8-4zm36 2c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm-1 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm-3 4a3 3 0 0 1-2-1h4a3 3 0 0 1-2 1zM28 48l-2 3h4l-2-3zm20-30l2 4 4-2-2 4 4 2-4 2 2 4-4-2-2 4-2-4-4 2 2-4-4-2 4-2-2-4 4 2z'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(145deg, #13141f 0%, #222538 50%, #171827 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Official Instagram-style doodle wallpaper with chat bubbles, hearts, and airplanes.",
    suggestedSent: "sunset-glow",
  },
  {
    id: "memphis-art",
    name: "Memphis Pop Art",
    category: "Popular & Patterns",
    badge: "Trending",
    isDark: true,
    preview: "linear-gradient(135deg, #2b1055 0%, #7597de 100%)",
    containerStyle: {
      backgroundColor: "#1e0e38",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'%3E%3Cg stroke='%23f38ba8' stroke-width='1.5' fill='none' stroke-opacity='0.22'%3E%3Cpath d='M10 10l8 14-16 0z'/%3E%3Ccircle cx='55' cy='15' r='6' stroke='%2389dceb'/%3E%3Cpath d='M30 45q5-10 10 0t10 0' stroke='%23f9e2af'/%3E%3Cpath d='M15 55l6-6m0 6l-6-6' stroke='%23a6e3a1'/%3E%3Ccircle cx='35' cy='25' r='1.5' fill='%23f38ba8' stroke='none'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #1e0e38 0%, #351763 50%, #15092a 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Bold 90s Memphis design with vibrant geometric squiggles and pastel confetti.",
    suggestedSent: "royal-purple",
  },
  {
    id: "party-confetti",
    name: "Celebration Confetti",
    category: "Popular & Patterns",
    badge: "Festive",
    isDark: true,
    preview: "linear-gradient(135deg, #3d0522 0%, #a21255 100%)",
    containerStyle: {
      backgroundColor: "#2a0418",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M12 10l3 3-2 2-3-3zm36 2l-3 4 3 2 3-4zm-22 30l4 2-2 4-4-2zm28 8l2 3-3 2-2-3z' fill='%23f5c2e7' fill-opacity='0.25'/%3E%3Ccircle cx='25' cy='15' r='2' fill='%23f9e2af' fill-opacity='0.3'/%3E%3Ccircle cx='45' cy='35' r='2.5' fill='%2389dceb' fill-opacity='0.3'/%3E%3Ccircle cx='10' cy='45' r='1.5' fill='%23a6e3a1' fill-opacity='0.3'/%3E%3Cpath d='M35 5l2 4 4-2-2 4 4 2-4 2 2 4-4-2-2 4-2-4-4 2 2-4-4-2 4-2-2-4 4 2z' fill='%23cba6f7' fill-opacity='0.25'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #240214 0%, #4a0628 50%, #1d0110 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Carnival party streamers, metallic confetti flakes, and celebration sparkles.",
    suggestedSent: "sunset-glow",
  },
  {
    id: "polka-dots",
    name: "Chic Polka Dots",
    category: "Popular & Patterns",
    isDark: false,
    preview: "radial-gradient(#d64d7c 2px, #fff5f7 2px)",
    containerStyle: {
      backgroundColor: "#fff0f3",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='2.8' fill='%23ff758f' fill-opacity='0.32'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      color: "#1f1d2b",
    },
    description: "Playful strawberry polka dots with a soft, cheerful aesthetic.",
    suggestedSent: "sakura-rose",
  },

  // ── 2. ROMANCE & HEARTS ──
  {
    id: "floating-hearts",
    name: "Heart Strings",
    category: "Romance & Hearts",
    badge: "Lover",
    isDark: true,
    preview: "linear-gradient(135deg, #40051e 0%, #b8175c 100%)",
    containerStyle: {
      backgroundColor: "#2c0414",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='%23ff758f' fill-opacity='0.2'%3E%3Cpath d='M32 46s-16-10.2-16-19.4c0-5.3 4.2-9.6 9.5-9.6 3.4 0 6.5 1.8 8.1 4.6 1.6-2.8 4.7-4.6 8.1-4.6 5.3 0 9.5 4.3 9.5 9.6 0 9.2-16 19.4-16 19.4z'/%3E%3Ccircle cx='8' cy='12' r='1.5'/%3E%3Ccircle cx='54' cy='52' r='2'/%3E%3Cpath d='M50 16l1 2 2-1-1 2 2 1-2 1 1 2-2-1-1 2-1-2-2 1 1-2-2-1 2-1-1-2 2 1z'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(145deg, #240210 0%, #4d0726 50%, #1f010e 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Romantic floating hearts with subtle twinkling starbursts on velvet crimson.",
    suggestedSent: "sakura-rose",
  },
  {
    id: "sweet-crush",
    name: "Sweet Valentine",
    category: "Romance & Hearts",
    isDark: false,
    preview: "linear-gradient(135deg, #ffe5ec 0%, #ffb3c6 100%)",
    containerStyle: {
      backgroundColor: "#fff0f3",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Cpath d='M22 32s-10-6.5-10-12.5c0-3.5 2.8-6.3 6.3-6.3 2.3 0 4.3 1.2 5.3 3.1 1-1.9 3-3.1 5.3-3.1 3.5 0 6.3 2.8 6.3 6.3 0 6-10 12.5-10 12.5z' fill='%23fb6f92' fill-opacity='0.22'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      color: "#2b1020",
    },
    description: "Delicate soft blush pink background patterned with sweet mini heart stamps.",
    suggestedSent: "sakura-rose",
  },
  {
    id: "sunset-romance",
    name: "Rose Sunset",
    category: "Romance & Hearts",
    isDark: true,
    preview: "linear-gradient(135deg, #3d0c26 0%, #bd3a42 50%, #ff9a76 100%)",
    containerStyle: {
      backgroundColor: "#2e061b",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cg fill='%23ff9a76' fill-opacity='0.18'%3E%3Cpath d='M25 36s-12-7.5-12-14.5c0-4 3.2-7.2 7.2-7.2 2.6 0 4.9 1.4 6 3.5 1.1-2.1 3.4-3.5 6-3.5 4 0 7.2 3.2 7.2 7.2 0 7-12 14.5-12 14.5z'/%3E%3Ccircle cx='6' cy='40' r='1.5'/%3E%3Ccircle cx='42' cy='10' r='2'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(140deg, #2b0417 0%, #6e1039 50%, #b83344 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Golden hour sunset warm glow with floating silhouettes.",
    suggestedSent: "sunset-glow",
  },

  // ── 3. SPACE & SCI-FI ──
  {
    id: "cosmic-galaxy",
    name: "Cosmic Starfield",
    category: "Space & Sci-Fi",
    badge: "Space",
    isDark: true,
    preview: "linear-gradient(135deg, #0b0726 0%, #1f104d 50%, #4b1a80 100%)",
    containerStyle: {
      backgroundColor: "#070417",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Cg fill='%23cba6f7' fill-opacity='0.28'%3E%3Ccircle cx='15' cy='20' r='1.2'/%3E%3Ccircle cx='70' cy='18' r='1.5'/%3E%3Ccircle cx='45' cy='55' r='2'/%3E%3Ccircle cx='80' cy='75' r='1'/%3E%3Ccircle cx='20' cy='70' r='1.3'/%3E%3Cpath d='M45 55l25-37m-25 37l-30 15' stroke='%23cba6f7' stroke-width='0.5' stroke-opacity='0.16' fill='none'/%3E%3Cpath d='M30 15l1.5 3 3-1.5-1.5 3 3 1.5-3 1.5 1.5 3-3-1.5-1.5 3-1.5-3-3 1.5 1.5-3-3-1.5 3-1.5-1.5-3 3 1.5z'/%3E%3C/g%3E%3C/svg%3E"), radial-gradient(ellipse at 80% 20%, rgba(138, 43, 226, 0.28) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(0, 218, 243, 0.2) 0%, transparent 50%), linear-gradient(150deg, #080517 0%, #130a2a 50%, #060210 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Deep interstellar cosmos with star constellations and glowing nebula nebulas.",
    suggestedSent: "royal-purple",
  },
  {
    id: "zodiac-celestial",
    name: "Zodiac Moon Phases",
    category: "Space & Sci-Fi",
    isDark: true,
    preview: "linear-gradient(135deg, #091224 0%, #15294a 100%)",
    containerStyle: {
      backgroundColor: "#060d1b",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%2389dceb' stroke-width='1.2' stroke-opacity='0.2'%3E%3Ccircle cx='40' cy='20' r='8'/%3E%3Cpath d='M36 20a4 4 0 0 0 8 0'/%3E%3Cpath d='M15 60a6 6 0 1 1 6-6'/%3E%3Ccircle cx='65' cy='65' r='1.5' fill='%23f9e2af' stroke='none' fill-opacity='0.4'/%3E%3Cpath d='M65 55l1 2 2-1-1 2 2 1-2 1 1 2-2-1-1 2-1-2-2 1 1-2-2-1 2-1-1-2 2 1z' fill='%2389dceb' stroke='none' fill-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(145deg, #050a14 0%, #0e1e36 50%, #03070f 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Astrology star charts, crescent moon phases, and midnight blue aura.",
    suggestedSent: "ocean-cyan",
  },
  {
    id: "cyber-matrix",
    name: "Circuit Matrix",
    category: "Space & Sci-Fi",
    badge: "Cyber",
    isDark: true,
    preview: "linear-gradient(135deg, #031412 0%, #083c34 100%)",
    containerStyle: {
      backgroundColor: "#020f0e",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%2300ffcc' stroke-width='1' stroke-opacity='0.2'%3E%3Cpath d='M10 0v20h20v20h30'/%3E%3Ccircle cx='10' cy='20' r='3' fill='%2300ffcc' fill-opacity='0.3'/%3E%3Ccircle cx='30' cy='40' r='3' fill='%2300ffcc' fill-opacity='0.3'/%3E%3Cpath d='M40 0v10h10'/%3E%3Ccircle cx='50' cy='10' r='2' fill='%2300ffcc' fill-opacity='0.25'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(150deg, #020d0c 0%, #052420 50%, #010807 100%)`,
      backgroundRepeat: "repeat",
      color: "#00ffcc",
    },
    description: "Futuristic printed circuit board tracks, solder nodes, and cyber glow.",
    suggestedSent: "ocean-cyan",
  },

  // ── 4. ANIME & GAMING ──
  {
    id: "manga-halftone",
    name: "Manga Screentone",
    category: "Anime & Gaming",
    badge: "Anime",
    isDark: true,
    preview: "radial-gradient(#b4befe 1.5px, #1e1e2e 1.5px)",
    containerStyle: {
      backgroundColor: "#181825",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='1.8' fill='%23cdd6f4' fill-opacity='0.16'/%3E%3C/svg%3E"), linear-gradient(135deg, #11111b 0%, #1e1e2e 60%, #181825 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Classic Japanese comic screentone halftone dots with lo-fi dusk aesthetic.",
    suggestedSent: "royal-purple",
  },
  {
    id: "pixel-arcade",
    name: "8-Bit Arcade",
    category: "Anime & Gaming",
    badge: "Retro",
    isDark: true,
    preview: "linear-gradient(135deg, #120326 0%, #300854 100%)",
    containerStyle: {
      backgroundColor: "#100221",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='%23f5c2e7' fill-opacity='0.22'%3E%3Crect x='6' y='6' width='14' height='8' rx='2'/%3E%3Crect x='10' y='4' width='6' height='12' rx='2'/%3E%3Crect x='34' y='32' width='12' height='12' rx='1' fill='%2389dceb' fill-opacity='0.22'/%3E%3Crect x='38' y='28' width='4' height='4' fill='%2389dceb' fill-opacity='0.22'/%3E%3Crect x='8' y='38' width='4' height='4' fill='%23f9e2af' fill-opacity='0.3'/%3E%3Crect x='44' y='12' width='3' height='3' fill='%23a6e3a1' fill-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(145deg, #0d011c 0%, #250642 50%, #0a0117 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Nostalgic 8-bit arcade gamepads, pixel hearts, and retro gaming sprites.",
    suggestedSent: "royal-purple",
  },
  {
    id: "soundwave-beats",
    name: "Neon Equalizer",
    category: "Anime & Gaming",
    isDark: true,
    preview: "linear-gradient(135deg, #070926 0%, #1b0a40 100%)",
    containerStyle: {
      backgroundColor: "#08061a",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'%3E%3Cg fill='%2300daf3' fill-opacity='0.2'%3E%3Crect x='8' y='18' width='3' height='14' rx='1.5'/%3E%3Crect x='15' y='8' width='3' height='24' rx='1.5'/%3E%3Crect x='22' y='14' width='3' height='18' rx='1.5'/%3E%3Crect x='29' y='4' width='3' height='28' rx='1.5' fill='%23ff758f' fill-opacity='0.25'/%3E%3Crect x='36' y='10' width='3' height='22' rx='1.5'/%3E%3Crect x='43' y='16' width='3' height='16' rx='1.5'/%3E%3Crect x='50' y='22' width='3' height='10' rx='1.5'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(140deg, #050314 0%, #15082e 50%, #050212 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Audio waveform soundbars and rhythm equalizer peaks for music lovers.",
    suggestedSent: "ocean-cyan",
  },

  // ── 5. NATURE & VIBES ──
  {
    id: "tropical-monstera",
    name: "Botanical Monstera",
    category: "Nature & Vibes",
    badge: "Nature",
    isDark: true,
    preview: "linear-gradient(135deg, #041f17 0%, #0b4f3b 100%)",
    containerStyle: {
      backgroundColor: "#031711",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'%3E%3Cg fill='none' stroke='%23a6e3a1' stroke-width='1.2' stroke-opacity='0.22'%3E%3Cpath d='M35 15c-10 0-18 8-18 18 0 12 18 25 18 25s18-13 18-25c0-10-8-18-18-18z'/%3E%3Cpath d='M35 15v43m-10-30l10 8m0 4l-10 8m20-20l-10 8m0 4l10 8'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(150deg, #03140f 0%, #0a382b 50%, #020f0b 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Lush botanical Monstera leaf venation with serene rainforest emerald tones.",
    suggestedSent: "deep-obsidian",
  },
  {
    id: "ocean-seigaiha",
    name: "Seigaiha Waves",
    category: "Nature & Vibes",
    isDark: true,
    preview: "linear-gradient(135deg, #041d33 0%, #0c4a75 100%)",
    containerStyle: {
      backgroundColor: "#041525",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='30' viewBox='0 0 50 30'%3E%3Cg fill='none' stroke='%2389dceb' stroke-width='1' stroke-opacity='0.2'%3E%3Cpath d='M0 30c0-11 11-20 25-20s25 9 25 20m-42 0c0-7 8-13 17-13s17 6 17 13m-26 0c0-4 4-7 9-7s9 3 9 7'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(145deg, #03111e 0%, #09314f 50%, #020b14 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Traditional Japanese rolling ocean wave arches in calming deep sapphire.",
    suggestedSent: "ocean-cyan",
  },
  {
    id: "cozy-cafe",
    name: "Cozy Café",
    category: "Nature & Vibes",
    badge: "Warm",
    isDark: true,
    preview: "linear-gradient(135deg, #2b170e 0%, #593320 100%)",
    containerStyle: {
      backgroundColor: "#20110a",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23f9e2af' stroke-width='1.2' stroke-opacity='0.22'%3E%3Cpath d='M14 26h22v12a10 10 0 0 1-10 10 10 10 0 0 1-10-10V26zm22 4h4a4 4 0 0 1 0 8h-4m-12 18h8'/%3E%3Cpath d='M20 18q2-4 0-8m5 8q2-4 0-8' stroke-linecap='round'/%3E%3Cellipse cx='48' cy='20' rx='5' ry='3' transform='rotate(45 48 20)' fill='%23f9e2af' fill-opacity='0.15' stroke='none'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(145deg, #1c0e08 0%, #3d2215 50%, #170b06 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Warm roasted coffee mugs, fragrant beans, and cozy bakery aroma.",
    suggestedSent: "electric-rose",
  },
  {
    id: "cozy-cafe-light",
    name: "Cozy Café Cream",
    category: "Nature & Vibes",
    badge: "Latte ☕",
    isDark: false,
    preview: "linear-gradient(135deg, #fff9f2 0%, #faebd7 50%, #ecd6be 100%)",
    containerStyle: {
      backgroundColor: "#fdf8f2",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%238c5332' stroke-width='1.2' stroke-opacity='0.25'%3E%3Cpath d='M14 26h22v12a10 10 0 0 1-10 10 10 10 0 0 1-10-10V26zm22 4h4a4 4 0 0 1 0 8h-4m-12 18h8'/%3E%3Cpath d='M20 18q2-4 0-8m5 8q2-4 0-8' stroke-linecap='round'/%3E%3Cellipse cx='48' cy='20' rx='5' ry='3' transform='rotate(45 48 20)' fill='%238c5332' fill-opacity='0.18' stroke='none'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(145deg, #fffdfa 0%, #f7eee1 50%, #ede0cd 100%)`,
      backgroundRepeat: "repeat",
      color: "#3a1c0d",
    },
    description: "Creamy vanilla latte, sweet caramel foam, and delicate coffee doodle art.",
    suggestedSent: "electric-rose",
  },

  // ── 6. RETRO & NEON ──
  {
    id: "synthwave-grid",
    name: "80s Synthwave Grid",
    category: "Retro & Neon",
    badge: "Retro",
    isDark: true,
    preview: "linear-gradient(135deg, #1f0836 0%, #85186b 50%, #ff5277 100%)",
    containerStyle: {
      backgroundColor: "#160526",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg stroke='%23ff007f' stroke-width='0.8' stroke-opacity='0.25'%3E%3Cpath d='M0 40h40M0 0h40M0 0v40M40 0v40'/%3E%3C/g%3E%3C/svg%3E"), radial-gradient(circle at 50% 100%, rgba(255, 0, 127, 0.35) 0%, transparent 65%), linear-gradient(180deg, #10031c 0%, #27063d 60%, #470c4a 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Outrun retrowave horizon grid with neon magenta and cyan laser glow.",
    suggestedSent: "sunset-glow",
  },
  {
    id: "honeycomb-matrix",
    name: "Honeycomb Hex",
    category: "Retro & Neon",
    isDark: true,
    preview: "linear-gradient(135deg, #091a2e 0%, #15416b 100%)",
    containerStyle: {
      backgroundColor: "#071424",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='48' viewBox='0 0 28 48'%3E%3Cpath d='M14 0l14 8v16l-14 8-14-8V8zM0 32l14 8v16l-14 8-14-8V40zM28 32l14 8v16l-14 8-14-8V40z' fill='none' stroke='%2300daf3' stroke-width='0.8' stroke-opacity='0.18'/%3E%3C/svg%3E"), linear-gradient(145deg, #050e1a 0%, #0d2a47 50%, #040c17 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "High-tech futuristic hexagonal honeycomb tessellation grid.",
    suggestedSent: "ocean-cyan",
  },
  {
    id: "spooky-twilight",
    name: "Midnight Twilight",
    category: "Retro & Neon",
    isDark: true,
    preview: "linear-gradient(135deg, #190a2c 0%, #441763 100%)",
    containerStyle: {
      backgroundColor: "#130624",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'%3E%3Cg fill='%23cba6f7' fill-opacity='0.22'%3E%3Cpath d='M18 20a8 8 0 1 0 8 8 8.1 8.1 0 0 1-8-8z'/%3E%3Cpath d='M45 42c-2 0-4 1-5 3-1-2-3-3-5-3-2 0-4 2-4 4 0 5 9 10 9 10s9-5 9-10c0-2-2-4-4-4z'/%3E%3Cpath d='M55 15l2 3 3-2-2 3 3 2-3 1 1 3-3-2-2 3-1-3-3 1 2-3-3-2 3-2-1-3 3 2z'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(145deg, #0f041d 0%, #280b40 50%, #0b0214 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Eerie gothic crescent moon and mysterious twilight bats.",
    suggestedSent: "royal-purple",
  },

  // ── 7. LUXURY & DARK ──
  {
    id: "royal-moroccan",
    name: "Golden Lattice",
    category: "Luxury & Dark",
    badge: "Gold",
    isDark: true,
    preview: "linear-gradient(135deg, #09132b 0%, #1a2c59 50%, #7d6023 100%)",
    containerStyle: {
      backgroundColor: "#070e1f",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%23f5c542' stroke-width='0.9' stroke-opacity='0.22'%3E%3Cpath d='M24 0l12 12-12 12-12-12zM0 24l12 12-12 12-12-12zM48 24l12 12-12 12-12-12zM24 24l12 12-12 12-12-12z'/%3E%3Ccircle cx='24' cy='24' r='3' fill='%23f5c542' fill-opacity='0.25' stroke='none'/%3E%3C/g%3E%3C/svg%3E"), linear-gradient(140deg, #050a17 0%, #0d1e3d 50%, #261f0f 100%)`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Luxurious Islamic geometric trellis filigree with shimmering golden accents.",
    suggestedSent: "electric-rose",
  },
  {
    id: "carbon-mesh",
    name: "Tactical Carbon",
    category: "Luxury & Dark",
    isDark: true,
    preview: "linear-gradient(135deg, #0d0d0f 0%, #1e1f24 100%)",
    containerStyle: {
      backgroundColor: "#0d0d0f",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M0 0h6v6H0zm6 6h6v6H6z' fill='%2322242a'/%3E%3Cpath d='M6 0h6v6H6zm-6 6h6v6H0z' fill='%2317181c'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      color: "#ffffff",
    },
    description: "Ultra-sleek woven carbon fiber weave for tactical dark aesthetics.",
    suggestedSent: "deep-obsidian",
  },
  {
    id: "amoled-dark",
    name: "AMOLED Obsidian",
    category: "Luxury & Dark",
    badge: "OLED",
    isDark: true,
    preview: "linear-gradient(135deg, #000000 0%, #0a0b10 100%)",
    containerStyle: {
      backgroundColor: "#000000",
      color: "#ffffff",
    },
    description: "Pure true pitch-black background optimized for OLED displays and battery savings.",
    suggestedSent: "deep-obsidian",
  },

  // ── 8. GRADIENTS & MINIMAL ──
  {
    id: "insta-sunset",
    name: "Instagram Sunset",
    category: "Gradients & Minimal",
    badge: "Classic",
    isDark: true,
    preview: "linear-gradient(135deg, #2b0b3f 0%, #68185c 40%, #e84a5f 75%, #ff8468 100%)",
    containerStyle: {
      backgroundImage: "linear-gradient(135deg, #1f0d30 0%, #57164f 45%, #b63a56 80%, #df6951 100%)",
      color: "#ffffff",
    },
    description: "Iconic Instagram warm sunset gradient from deep plum to golden apricot.",
    suggestedSent: "sunset-glow",
  },
  {
    id: "insta-cyber",
    name: "Cyber Magenta",
    category: "Gradients & Minimal",
    isDark: true,
    preview: "linear-gradient(135deg, #050b1a 0%, #0d2850 50%, #1e5a96 100%)",
    containerStyle: {
      backgroundImage: "linear-gradient(135deg, #040917 0%, #0a2245 45%, #13467e 100%)",
      color: "#ffffff",
    },
    description: "Electric cyber blues and deep violet shadows from Instagram DM themes.",
    suggestedSent: "ocean-cyan",
  },
  {
    id: "insta-sakura",
    name: "Sakura Blossom",
    category: "Gradients & Minimal",
    isDark: false,
    preview: "linear-gradient(135deg, #fff0f3 0%, #fed7e2 50%, #fbb6ce 100%)",
    containerStyle: {
      backgroundImage: "linear-gradient(135deg, #fff0f3 0%, #fed7e2 50%, #fbb6ce 100%)",
      color: "#2d1223",
    },
    description: "Gentle spring cherry blossom pastels with peach underglow.",
    suggestedSent: "sakura-rose",
  },
  {
    id: "insta-aurora",
    name: "Northern Lights",
    category: "Gradients & Minimal",
    isDark: true,
    preview: "linear-gradient(135deg, #04141d 0%, #003b54 50%, #028090 100%)",
    containerStyle: {
      backgroundImage: "linear-gradient(135deg, #031017 0%, #00334a 50%, #027382 100%)",
      color: "#ffffff",
    },
    description: "Polar auroral ribbons over arctic midnight fjord.",
    suggestedSent: "ocean-cyan",
  },
  {
    id: "insta-lavender",
    name: "Lavender Dreams",
    category: "Gradients & Minimal",
    isDark: false,
    preview: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    containerStyle: {
      backgroundImage: "linear-gradient(135deg, #e0c3fc 0%, #b3c5fc 50%, #8ec5fc 100%)",
      color: "#1b1035",
    },
    description: "Dreamy lilac to periwinkle soft cloud gradient.",
    suggestedSent: "royal-purple",
  },
  {
    id: "frost",
    name: "Arctic Frost",
    category: "Gradients & Minimal",
    isDark: false,
    preview: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    containerStyle: {
      backgroundImage: "linear-gradient(to bottom, var(--surface), var(--surface-container-low))",
      color: "var(--on-surface)",
    },
    description: "Default subtle frosted glass canvas that blends with the app theme.",
    suggestedSent: "electric-rose",
  },
  {
    id: "clean-pure",
    name: "Minimal Pure",
    category: "Gradients & Minimal",
    isDark: false,
    preview: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
    containerStyle: {
      backgroundColor: "var(--surface)",
      color: "var(--on-surface)",
    },
    description: "Zero distractions, solid clean canvas focused purely on your conversations.",
    suggestedSent: "electric-rose",
  },
];

export const BUBBLE_GRADIENTS = [
  { id: "sunset-glow", name: "Sunset Flame", style: "from-[#ff512f] to-[#dd2476]" },
  { id: "electric-rose", name: "Flyingo Signature", style: "from-[#003973] to-[#e5e5be]" },
  { id: "sakura-rose", name: "Berry Sakura", style: "from-[#ff758c] to-[#ff7eb3]" },
  { id: "royal-purple", name: "Royal Violet", style: "from-[#8a2387] via-[#e94057] to-[#f27121]" },
  { id: "ocean-cyan", name: "Cyber Teal", style: "from-[#00daf3] to-[#007482]" },
  { id: "emerald-glow", name: "Neon Emerald", style: "from-[#00b09b] to-[#96c93d]" },
  { id: "deep-obsidian", name: "Deep Slate", style: "from-[#283044] to-[#131b2e]" },
];

export const RECEIVED_STYLES: Record<string, string> = {
  "liquid-glass": "bg-white/80 dark:bg-white/10 text-on-surface backdrop-blur-md shadow-sm border border-white/10",
  "soft-slate": "bg-[#eaedff] dark:bg-[#1e2640] text-on-surface shadow-sm",
  "deep-obsidian": "bg-[#1e293b] text-white shadow-md border border-white/5",
  "lilac-mist": "bg-[#f3e8ff] dark:bg-[#2e1a47] text-on-surface shadow-sm",
};

export function getThemeById(id: string): ChatTheme | undefined {
  return CHAT_THEMES.find(t => t.id === id);
}

export function getThemeContainerStyle(
  wallpaperId: string,
  customWallpaperUrl?: string
): React.CSSProperties {
  if (wallpaperId === "custom" && customWallpaperUrl) {
    return {
      backgroundImage: `url(${customWallpaperUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  const theme = getThemeById(wallpaperId);
  return theme?.containerStyle || {};
}
