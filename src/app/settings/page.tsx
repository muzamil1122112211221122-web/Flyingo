"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Storage, UserProfile } from "@/lib/storage";
import VerifiedBadge from "@/components/VerifiedBadge";

type Section = "aesthetics" | "privacy" | "flamingoos" | "notifications" | "storage";

const Toggle = ({ label, sublabel, checked, onChange }: { label: string; sublabel?: string; checked: boolean; onChange: () => void }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low/60 transition-colors">
    <div>
      <p className="font-title-md text-on-surface">{label}</p>
      {sublabel && <p className="font-caption text-on-surface-variant mt-0.5">{sublabel}</p>}
    </div>
    <motion.button whileTap={{ scale: 0.9 }} onClick={onChange} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${checked ? "bg-primary" : "bg-surface-container-high"}`}>
      <motion.span
        animate={{ x: checked ? 24 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
      />
    </motion.button>
  </div>
);

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("aesthetics");

  // Aesthetics state
  const [sentTheme, setSentTheme] = useState("electric-rose");
  const [receivedTheme, setReceivedTheme] = useState("liquid-glass");
  const [wallpaper, setWallpaper] = useState("frost");
  const [fontFamily, setFontFamily] = useState("plus-jakarta");
  const [fontSize, setFontSize] = useState(15);
  const [sentOpacity, setSentOpacity] = useState(100);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Privacy state
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [lastSeen, setLastSeen] = useState(false);
  const [screenLock, setScreenLock] = useState(true);
  const [autoLock, setAutoLock] = useState("5min");

  // Flamingoos state
  const [storyDuration, setStoryDuration] = useState("60s");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [storyQuality, setStoryQuality] = useState("HD");
  const [allowReplies, setAllowReplies] = useState(true);
  const [whoCanSee, setWhoCanSee] = useState("friends");

  // Notifications state
  const [msgNotif, setMsgNotif] = useState(true);
  const [storyAlerts, setStoryAlerts] = useState(true);
  const [callRing, setCallRing] = useState(true);
  const [soundFx, setSoundFx] = useState(false);
  const [vibration, setVibration] = useState(true);

  // Admin modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCredsDrawer, setShowCredsDrawer] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile>({ id: "u_default", handle: "muzamil_op", name: "Muzamil Sky ✨", createdAt: Date.now() });
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    const user = Storage.getCurrentUser();
    setCurrentUser(user);
    const s = Storage.getSettings();
    setSentTheme(s.sentTheme || "electric-rose");
    setReceivedTheme(s.receivedTheme || "liquid-glass");
    setWallpaper(s.wallpaper || "frost");
    setFontSize(s.fontSize || 15);
    setSentOpacity(s.sentOpacity ?? 100);
    const currentMode = s.themeMode || (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setThemeMode(currentMode);
  }, []);

  const switchThemeMode = (mode: "light" | "dark") => {
    setThemeMode(mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    Storage.saveSettings({ themeMode: mode });
  };

  const handleSave = () => {
    Storage.saveSettings({
      sentTheme,
      receivedTheme,
      wallpaper,
      fontSize,
      sentOpacity,
      themeMode,
    });
    if (themeMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleReset = () => {
    setSentTheme("electric-rose");
    setReceivedTheme("liquid-glass");
    setWallpaper("frost");
    setFontSize(15);
    setSentOpacity(100);
    setThemeMode("light");
    document.documentElement.classList.remove("dark");
    Storage.saveSettings({
      sentTheme: "electric-rose",
      receivedTheme: "liquid-glass",
      wallpaper: "frost",
      fontSize: 15,
      sentOpacity: 100,
      themeMode: "light",
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleAdminAuth = () => {
    if (adminEmail.trim() === "muzamil1122112211221122@gmail.com" && adminPass === "ProGangOP295" && adminPin === "8585") {
      Storage.setAdminAuthenticated(true);
      setShowAdminModal(false);
      setAdminError("");
      router.push("/admin");
    } else {
      setAdminError("❌ Invalid master credentials. Access denied.");
    }
  };

  const sentGradients: Record<string, string> = {
    "electric-rose": "from-[#b70942] to-[#da2e59]",
    "midnight-violet": "from-[#7d2dce] to-[#51138f]",
    "emerald-glow": "from-[#008190] to-[#00525c]",
    "ocean-cyan": "from-[#00daf3] to-[#007482]",
    "deep-obsidian": "from-[#283044] to-[#131b2e]",
  };

  const wallpaperClass: Record<string, string> = {
    frost: "bg-gradient-to-br from-[#faf8ff] via-[#f2f3ff] to-[#dae2fd]",
    nebula: "bg-gradient-to-br from-[#0c0d18] via-[#1a1233] to-[#09182b]",
    "coral-sunset": "bg-gradient-to-br from-[#ffd9dc] via-[#eaedff] to-[#efdbff]",
    "clean-pure": "bg-white",
  };

  const receivedBubbleClass: Record<string, string> = {
    "liquid-glass": "bg-white/80 text-[#131b2e]",
    "soft-slate": "bg-[#eaedff] text-[#131b2e]",
    "deep-obsidian": "bg-[#283044] text-white",
    "lilac-mist": "bg-[#efdbff]/60 text-[#131b2e]",
  };

  const navItems: { key: Section; icon: string; label: string; sub: string }[] = [
    { key: "aesthetics", icon: "format_paint", label: "Chat Aesthetics", sub: "Bubbles, wallpapers & typography" },
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />

      <div className="md:ml-[72px] ml-0 flex-1 relative overflow-hidden pb-24 md:pb-0">
        {/* Ambient blobs */}
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-[28rem] h-[28rem] rounded-full bg-secondary/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row gap-6 p-4 md:p-6 max-w-[1600px] mx-auto">

          {/* ── LEFT SIDEBAR ── */}
          <aside className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-4">

            {/* Profile card */}
            <div className="p-5 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-xl shadow-md flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl p-0.5 shadow-md" style={{ background: "linear-gradient(135deg, #b70942, #7d2dce)" }}>
                  <div className="w-full h-full rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                    {(currentUser.name || currentUser.handle || "U").substring(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-title-md font-semibold text-on-surface truncate">
                      {currentUser.name || `@${currentUser.handle}`}
                    </span>
                    {currentUser.verifiedBadge?.enabled ? (
                      <VerifiedBadge
                        icon={currentUser.verifiedBadge.icon || "verified"}
                        color={currentUser.verifiedBadge.color || "#00daf3"}
                        size={22}
                        title={currentUser.verifiedBadge.label || "Verified"}
                      />
                    ) : (
                      <VerifiedBadge size={22} />
                    )}
                  </div>
                  <span className="font-caption text-primary font-mono font-semibold">@{currentUser.handle}</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-surface-container-low/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">palette</span>
                  <span className="font-label-md text-on-surface">Active Theme Engine</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-caption font-semibold">Liquid Rose v4.2</span>
              </div>
            </div>

            {/* Nav */}
            <nav className="p-3 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-xl shadow-md flex flex-col gap-1">
              <span className="px-3 py-1 font-caption text-on-surface-variant/70 uppercase tracking-widest font-semibold text-[10px]">Workspace Settings</span>
              {navItems.map(item => (
                <motion.button
                  key={item.key}
                  whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                    activeSection === item.key
                      ? "bg-gradient-to-r from-primary-container/20 to-secondary/10 shadow-sm"
                      : "hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      activeSection === item.key
                        ? "bg-primary-container text-on-primary-container shadow-sm"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-title-md text-on-surface">{item.label}</span>
                      <span className="font-caption text-on-surface-variant">{item.sub}</span>
                    </div>
                  </div>
                  {activeSection === item.key
                    ? <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    : <span className="material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0">chevron_right</span>
                  }
                </motion.button>
              ))}
            </nav>

            {/* Admin gateway */}
            <div className="p-5 rounded-3xl shadow-xl flex flex-col gap-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #283044, #131b2e)" }}>
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-secondary/30 blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-white text-[22px]">admin_panel_settings</span>
                  </div>
                  <div>
                    <p className="font-title-md text-white font-semibold flex items-center gap-1.5">
                      Admin Gateway <span className="w-2 h-2 rounded-full bg-[#00daf3] animate-ping" />
                    </p>
                    <p className="font-caption text-white/60">Restricted Root Cluster</p>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => {
                  Storage.logoutUser();
                  router.push("/");
                }}
                className="w-full py-3 px-4 rounded-2xl bg-error/10 hover:bg-error/20 text-error font-title-md font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-error/20 shadow-xs"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Log Out of Account
              </motion.button>
            </div>
          </aside>

          {/* ── RIGHT: Dynamic Section Content ── */}
          <section className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Section header */}
            <div className="p-5 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="font-caption uppercase tracking-wider text-primary font-semibold">Customization Engine</span>
                <h1 className="font-headline-md font-bold tracking-tight text-on-surface">
                  {navItems.find(n => n.key === activeSection)?.label}
                </h1>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto relative">
                {saveToast && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-10 right-0 px-3 py-1.5 rounded-xl bg-tertiary text-white font-label-md text-[12px] shadow-lg flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Chat Aesthetics Saved!
                  </motion.div>
                )}
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-2xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>Reset
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-container text-white font-label-md flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>Save
                </motion.button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ═══ AESTHETICS ═══ */}
              {activeSection === "aesthetics" && (
                <motion.div key="aesthetics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-7 flex flex-col gap-4">

                    {/* App Theme: Light & Dark Theme Switcher */}
                    <div className="p-5 rounded-3xl bg-surface-container-lowest/90 shadow-sm flex flex-col gap-4 border border-outline-variant/15">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">
                              {themeMode === "dark" ? "dark_mode" : "light_mode"}
                            </span>
                          </div>
                          <div>
                            <h2 className="font-title-md text-on-surface">Interface Appearance</h2>
                            <span className="font-caption text-on-surface-variant">Switch between Light and Dark mode</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-caption font-bold capitalize">
                          {themeMode} Mode
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => switchThemeMode("light")}
                          className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                            themeMode === "light"
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-outline-variant/20 bg-surface-container hover:bg-surface-container-high"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-center text-amber-500">
                            <span className="material-symbols-outlined text-[22px]">light_mode</span>
                          </div>
                          <div className="text-left">
                            <p className="font-title-md font-bold text-on-surface text-[13px]">Light Theme</p>
                            <p className="font-caption text-on-surface-variant text-[11px]">Clean bright style</p>
                          </div>
                          {themeMode === "light" && (
                            <span className="material-symbols-outlined text-primary ml-auto text-[20px]">check_circle</span>
                          )}
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => switchThemeMode("dark")}
                          className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                            themeMode === "dark"
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-outline-variant/20 bg-surface-container hover:bg-surface-container-high"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#0d1117] border border-gray-700 shadow-xs flex items-center justify-center text-sky-400">
                            <span className="material-symbols-outlined text-[22px]">dark_mode</span>
                          </div>
                          <div className="text-left">
                            <p className="font-title-md font-bold text-on-surface text-[13px]">Dark Theme</p>
                            <p className="font-caption text-on-surface-variant text-[11px]">OLED modern dark</p>
                          </div>
                          {themeMode === "dark" && (
                            <span className="material-symbols-outlined text-primary ml-auto text-[20px]">check_circle</span>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Sent bubble */}
                    <div className="p-5 rounded-3xl bg-surface-container-lowest/90 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">outgoing_mail</span>
                          </div>
                          <div>
                            <h2 className="font-title-md text-on-surface">Sent Message Bubble</h2>
                            <span className="font-caption text-on-surface-variant">Active outbound gradient</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-caption font-semibold">#b70942</span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { key: "electric-rose", from: "#b70942", to: "#da2e59" },
                          { key: "midnight-violet", from: "#7d2dce", to: "#51138f" },
                          { key: "emerald-glow", from: "#008190", to: "#00525c" },
                          { key: "ocean-cyan", from: "#00daf3", to: "#007482" },
                          { key: "deep-obsidian", from: "#283044", to: "#131b2e" },
                        ].map(s => (
                          <motion.button key={s.key} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setSentTheme(s.key)}
                            className="h-12 rounded-2xl shadow-sm flex items-center justify-center"
                            style={{ background: `linear-gradient(to right, ${s.from}, ${s.to})`, outline: sentTheme === s.key ? "2px solid white" : "none", outlineOffset: 2 }}>
                            {sentTheme === s.key && <span className="material-symbols-outlined text-white text-[18px]">check</span>}
                          </motion.button>
                        ))}
                      </div>
                      <div className="p-3 rounded-2xl bg-surface-container-low flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-xl flex-1">
                          <span className="font-caption text-on-surface-variant font-mono">HEX</span>
                          <input type="text" defaultValue="#b70942" maxLength={7} className="w-full bg-transparent font-title-md text-on-surface uppercase focus:outline-none" />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-caption text-on-surface-variant whitespace-nowrap">Alpha: {sentOpacity}%</span>
                          <input type="range" min={40} max={100} value={sentOpacity} onChange={e => setSentOpacity(+e.target.value)} className="w-full accent-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Received bubble */}
                    <div className="p-5 rounded-3xl bg-surface-container-lowest/90 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">move_to_inbox</span>
                        </div>
                        <div>
                          <h2 className="font-title-md text-on-surface">Received Message Bubble</h2>
                          <span className="font-caption text-on-surface-variant">Incoming conversation tone</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: "liquid-glass", bg: "bg-white/70 backdrop-blur-md", dot: "bg-surface-container-lowest/90", label: "Liquid Glass", text: "text-on-surface" },
                          { key: "soft-slate", bg: "bg-surface-container-low", dot: "bg-surface-container-high", label: "Soft Slate", text: "text-on-surface" },
                          { key: "deep-obsidian", bg: "bg-[#283044]", dot: "bg-[#131b2e]", label: "Deep Obsidian", text: "text-white" },
                          { key: "lilac-mist", bg: "bg-[#efdbff]/40", dot: "bg-[#efdbff]", label: "Lilac Mist", text: "text-on-surface" },
                        ].map(s => (
                          <motion.button key={s.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setReceivedTheme(s.key)}
                            className={`p-3 rounded-2xl ${s.bg} shadow-sm flex flex-col items-center gap-1.5 ${receivedTheme === s.key ? "ring-2 ring-primary" : ""}`}>
                            <div className={`w-6 h-6 rounded-full ${s.dot} shadow-inner`} />
                            <span className={`font-caption font-semibold ${s.text}`}>{s.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Wallpaper */}
                    <div className="p-5 rounded-3xl bg-surface-container-lowest/90 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">wallpaper</span>
                        </div>
                        <div>
                          <h2 className="font-title-md text-on-surface">Chat Wallpaper Canvas</h2>
                          <span className="font-caption text-on-surface-variant">Atmospheric backdrop & texture</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { key: "frost", bg: "bg-gradient-to-br from-[#faf8ff] via-[#f2f3ff] to-[#dae2fd]", label: "Frost Glass", text: "text-[#131b2e]" },
                          { key: "nebula", bg: "bg-gradient-to-br from-[#0c0d18] via-[#1a1233] to-[#09182b]", label: "Dark Nebula", text: "text-white" },
                          { key: "coral-sunset", bg: "bg-gradient-to-br from-[#ffd9dc] via-[#eaedff] to-[#efdbff]", label: "Sunset Aura", text: "text-[#131b2e]" },
                          { key: "clean-pure", bg: "bg-white", label: "Pure Clean", text: "text-[#131b2e]" },
                        ].map(w => (
                          <motion.button key={w.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setWallpaper(w.key)}
                            className={`relative h-28 rounded-2xl overflow-hidden shadow-sm text-left p-2 flex flex-col justify-end ${w.bg} ${wallpaper === w.key ? "ring-2 ring-primary" : ""}`}>
                            <div className="flex items-center justify-between w-full">
                              <span className={`font-caption font-semibold text-[10px] ${w.text}`}>{w.label}</span>
                              {wallpaper === w.key && <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low/60">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">add_photo_alternate</span>
                          <span className="font-body-sm text-on-surface">Upload custom image (PNG, WEBP, up to 8K)</span>
                        </div>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high font-caption font-semibold text-on-surface transition-colors">Browse</motion.button>
                      </div>
                    </div>

                    {/* Typography */}
                    <div className="p-5 rounded-3xl bg-surface-container-lowest/90 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">match_case</span>
                        </div>
                        <div>
                          <h2 className="font-title-md text-on-surface">Typography & Density</h2>
                          <span className="font-caption text-on-surface-variant">Typeface and message scale</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: "plus-jakarta", label: "Plus Jakarta" },
                          { key: "inter", label: "Inter Modern" },
                          { key: "outfit", label: "Outfit Geo" },
                          { key: "mono", label: "Mono Terminal" },
                        ].map(f => (
                          <motion.button key={f.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setFontFamily(f.key)}
                            className={`p-2.5 rounded-2xl text-center font-body-md transition-all ${fontFamily === f.key ? "bg-primary/10 text-primary ring-2 ring-primary shadow-sm" : "bg-surface-container-low hover:bg-surface-container text-on-surface"}`}>
                            {f.label}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between font-caption text-on-surface-variant">
                          <span>Compact (13px)</span>
                          <span className="font-semibold text-primary">{fontSize === 13 ? "Compact" : fontSize === 15 ? "Balanced" : "Spacious"} ({fontSize}px)</span>
                          <span>Spacious (17px)</span>
                        </div>
                        <input type="range" min={13} max={17} step={1} value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full accent-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="lg:col-span-5 flex flex-col gap-3 lg:sticky lg:top-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" />
                        <span className="font-caption uppercase tracking-wider text-on-surface-variant font-semibold text-[10px]">Interactive Live Sandbox</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-caption text-[10px]">60 FPS</span>
                    </div>
                    <div className={`relative w-full h-[540px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between transition-all duration-500 ${wallpaperClass[wallpaper]}`}>
                      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
                      {/* Preview header */}
                      <div className="relative z-10 px-4 py-3 bg-surface-container-lowest/80 backdrop-blur-xl shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center font-semibold text-secondary">AS
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" />
                          </div>
                          <div>
                            <p className="font-title-md text-on-surface leading-tight">Aria Stark</p>
                            <p className="font-caption text-tertiary font-medium">typing audio memo...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          {["call", "videocam", "more_vert"].map(i => <span key={i} className="material-symbols-outlined text-[18px]">{i}</span>)}
                        </div>
                      </div>
                      {/* Preview messages */}
                      <div className="relative z-10 flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                        <div className="flex justify-center">
                          <span className="px-3 py-1 rounded-full bg-surface-container-lowest/70 text-on-surface-variant font-caption shadow-sm text-[11px]">Today • 14:32</span>
                        </div>
                        {/* Received */}
                        <div className={`p-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[80%] transition-all duration-300 ${receivedBubbleClass[receivedTheme]}`}>
                          <p className="font-body-sm leading-relaxed" style={{ fontSize: `${fontSize}px` }}>Absolutely! The new fluid glass shaders are verified. 🌊</p>
                          <p className="font-caption text-right opacity-60 mt-1 text-[10px]">14:34</p>
                        </div>
                        {/* Sent */}
                        <div className={`p-3 rounded-2xl rounded-tr-sm text-white shadow-md self-end max-w-[80%] bg-gradient-to-r ${sentGradients[sentTheme]} transition-all duration-300`} style={{ opacity: sentOpacity / 100 }}>
                          <p className="font-body-sm leading-relaxed" style={{ fontSize: `${fontSize}px` }}>Incredible! Encryption keys synced. 🚀</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-white/80 text-[10px]">14:35</span>
                            <span className="material-symbols-outlined text-[13px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                          </div>
                        </div>
                        {/* Voice note */}
                        <div className={`p-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[80%] flex items-center gap-3 transition-all duration-300 ${receivedBubbleClass[receivedTheme]}`}>
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          </div>
                          <div className="flex items-center gap-[3px] h-6">
                            {[3, 6, 4, 7, 2, 5, 7, 3, 6, 2].map((h, i) => (
                              <span key={i} className="w-1 rounded-full bg-primary" style={{ height: `${h * 2.5}px`, opacity: i < 5 ? 1 : 0.4 }} />
                            ))}
                          </div>
                          <span className="font-caption text-on-surface-variant font-mono text-[11px]">0:18</span>
                        </div>
                      </div>
                      {/* Composer */}
                      <div className="relative z-20 p-3">
                        <div className="w-full h-11 px-3 rounded-full bg-surface-container-lowest/85 backdrop-blur-xl shadow-lg flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">sentiment_satisfied</span>
                          <span className="font-body-sm text-on-surface-variant/70 flex-1 truncate text-[12px]">Message Aria...</span>
                          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[14px]">send</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-surface-container-lowest/80 shadow-sm flex items-center justify-between">
                      <span className="font-caption text-on-surface-variant text-[11px]">Theme: <b className="text-on-surface">Flamingo Midnight Glass</b></span>
                      <div className="flex gap-1">
                        {["bg-primary", "bg-secondary", "bg-tertiary"].map(c => <span key={c} className={`w-2 h-2 rounded-full ${c}`} />)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </section>
        </div>
      </div>

      {/* ── ADMIN MODAL ── */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) { setShowAdminModal(false); setAdminError(""); } }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative w-full max-w-md p-6 rounded-3xl shadow-2xl flex flex-col gap-4 overflow-hidden" style={{ background: "#283044", color: "white" }}>
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: "linear-gradient(to right, #b70942, #7d2dce, #006672)" }} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-white text-[22px]">security</span>
                  </div>
                  <div>
                    <h3 className="font-title-md font-semibold">Central Admin Gateway</h3>
                    <p className="font-caption text-white/60">Flyingo Root Controller</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setShowAdminModal(false); setAdminError(""); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </motion.button>
              </div>
              <p className="font-body-sm text-white/80">Enter master credentials to access the unrestricted administration console.</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Master Email", type: "email", val: adminEmail, set: setAdminEmail, ph: "admin@flyingo.me" },
                  { label: "Root Passkey", type: "password", val: adminPass, set: setAdminPass, ph: "••••••••" },
                ].map(f => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <label className="font-label-md text-white/80">{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="w-full px-4 py-2.5 rounded-2xl bg-white/10 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-secondary transition-all font-body-md" />
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-white/80">4-Digit Security PIN</label>
                  <input type="password" value={adminPin} onChange={e => setAdminPin(e.target.value.slice(0, 4).replace(/\D/g, ""))} placeholder="• • • •" maxLength={4} className="w-full px-4 py-2.5 rounded-2xl bg-white/10 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-secondary tracking-[0.5em] text-center font-body-md" />
                </div>
                {adminError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-caption text-red-400 text-center">{adminError}</motion.p>}
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleAdminAuth} className="w-full py-3 rounded-2xl text-white font-label-md flex items-center justify-center gap-2 shadow-md" style={{ background: "linear-gradient(to right, #b70942, #7d2dce)" }}>
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                Authenticate & Access Portal
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
