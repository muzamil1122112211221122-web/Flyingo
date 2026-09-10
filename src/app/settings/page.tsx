"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Storage, UserProfile } from "@/lib/storage";
import VerifiedBadge from "@/components/VerifiedBadge";

import {
  CHAT_THEMES,
  THEME_CATEGORIES,
  BUBBLE_GRADIENTS,
  RECEIVED_STYLES,
  getThemeContainerStyle,
  getThemeById,
  ChatTheme,
} from "@/lib/chatThemes";

export default function SettingsPage() {
  const router = useRouter();
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sentTheme, setSentTheme] = useState("sunset-glow");
  const [receivedTheme, setReceivedTheme] = useState("liquid-glass");
  const [wallpaper, setWallpaper] = useState("chat-doodles");
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState<string>("");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [saveToast, setSaveToast] = useState(false);

  // User Profile State (WITH REAL DP)
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: "u_default",
    handle: "user",
    name: "User",
    createdAt: Date.now(),
  });

  // Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    // 1. Load User Profile & Sync Real DP from Cloud
    const user = Storage.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      Storage.fetchRemoteUsers().then(users => {
        const fresh = users.find(u => u.handle.toLowerCase() === user.handle.toLowerCase());
        if (fresh) {
          setCurrentUser(prev => ({ ...prev, ...fresh }));
        }
      });
    }

    // 2. Load Saved Chat Settings
    const s = Storage.getSettings();
    setSentTheme(s.sentTheme || "electric-rose");
    setReceivedTheme(s.receivedTheme || "liquid-glass");
    setWallpaper(s.wallpaper || "frost");
    setCustomWallpaperUrl(s.customWallpaperUrl || "");
    const currentMode = s.themeMode || (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setThemeMode(currentMode);
  }, []);

  // Quick Auto-Save helper
  const triggerSave = (updates: Partial<{
    sentTheme: string;
    receivedTheme: string;
    wallpaper: string;
    customWallpaperUrl: string;
    themeMode: "light" | "dark";
  }>) => {
    const nextSettings = {
      sentTheme: updates.sentTheme ?? sentTheme,
      receivedTheme: updates.receivedTheme ?? receivedTheme,
      wallpaper: updates.wallpaper ?? wallpaper,
      customWallpaperUrl: updates.customWallpaperUrl ?? customWallpaperUrl,
      themeMode: updates.themeMode ?? themeMode,
    };
    Storage.saveSettings(nextSettings);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1800);
  };

  const handleSelectWallpaper = (wpId: string) => {
    setWallpaper(wpId);
    triggerSave({ wallpaper: wpId });
  };

  const handleSelectSentTheme = (themeId: string) => {
    setSentTheme(themeId);
    triggerSave({ sentTheme: themeId });
  };

  const handleSelectReceivedTheme = (themeId: string) => {
    setReceivedTheme(themeId);
    triggerSave({ receivedTheme: themeId });
  };

  const switchThemeMode = (mode: "light" | "dark") => {
    setThemeMode(mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    triggerSave({ themeMode: mode });
  };

  const onCustomWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          const url = loadEvt.target.result as string;
          setCustomWallpaperUrl(url);
          setWallpaper("custom");
          triggerSave({ wallpaper: "custom", customWallpaperUrl: url });
        }
      };
      reader.readAsDataURL(file);
    }
    if (wallpaperInputRef.current) wallpaperInputRef.current.value = "";
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

  // Active Wallpaper CSS & Style
  const activeWallpaperObj = getThemeById(wallpaper);
  const activeWallpaperStyle = getThemeContainerStyle(wallpaper, customWallpaperUrl);
  const activeWallpaperClass = wallpaper === "custom" ? "bg-surface" : (activeWallpaperObj?.containerClass || "");

  const activeSentGradient = BUBBLE_GRADIENTS.find(b => b.id === sentTheme)?.style || "from-[#ff512f] to-[#dd2476]";

  const filteredThemes = selectedCategory === "All"
    ? CHAT_THEMES
    : CHAT_THEMES.filter(t => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      <Sidebar />

      <div className="md:ml-[86px] ml-0 flex-1 relative flex flex-col items-center min-h-screen pb-32 md:pb-12 w-full overflow-y-auto">
        {/* Ambient background blur */}
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        {/* Main Content Column */}
        <div className="relative z-10 w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">

          {/* ── STICKY TOP HEADER ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-headline-md font-bold tracking-tight text-on-surface text-xl sm:text-2xl">
                Settings
              </h1>
              <p className="font-caption text-on-surface-variant text-xs">
                Customize chat wallpapers, theme & account
              </p>
            </div>

            {saveToast && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-label-md text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/20 shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Saved ✨</span>
              </motion.div>
            )}
          </div>

          {/* ── 1. USER PROFILE CARD (WITH REAL DP) ── */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Real DP Avatar with Accent Ring */}
              <div
                onClick={() => router.push("/profile")}
                className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden p-0.5 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
                style={{ border: `3px solid ${currentUser.borderColor || "#003973"}` }}
                title="View & Edit Profile"
              >
                {currentUser.avatar && currentUser.avatar !== "/default-avatar.jpg" ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name || currentUser.handle}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-user-gradient flex items-center justify-center text-white font-bold text-lg">
                    {(currentUser.name || currentUser.handle || "U").substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-surface-container-lowest" />
              </div>

              {/* User Name & Handle */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-title-md font-bold text-on-surface text-base truncate">
                    {currentUser.name || `@${currentUser.handle}`}
                  </span>
                  {currentUser.verifiedBadge?.enabled && (
                    <VerifiedBadge
                      icon={currentUser.verifiedBadge.icon || "verified"}
                      color={currentUser.verifiedBadge.color || "#00daf3"}
                      size={20}
                      title={currentUser.verifiedBadge.label || "Verified Account"}
                    />
                  )}
                </div>
                <span className="font-caption text-primary font-mono text-xs">
                  @{currentUser.handle}
                </span>
                <span className="font-caption text-on-surface-variant text-[11px] mt-0.5">
                  End-to-End Encrypted Account
                </span>
              </div>
            </div>

            {/* Edit Profile Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/profile")}
              className="px-3.5 py-2 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span className="hidden sm:inline">Edit Profile</span>
            </motion.button>
          </div>

          {/* ── 2. SYSTEM APPEARANCE (LIGHT / DARK) ── */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
                Appearance
              </h2>
              <p className="font-caption text-xs text-on-surface-variant">
                Switch overall application interface theme
              </p>
            </div>

            {/* iOS-style Segmented Toggle with Smooth Sliding Indicator */}
            <div className="relative flex items-center bg-surface-container p-1 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => switchThemeMode("light")}
                className={`relative flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer z-10 ${
                  themeMode === "light"
                    ? "text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {themeMode === "light" && (
                  <motion.div
                    layoutId="themeModeSliderPill"
                    className="absolute inset-0 rounded-xl bg-surface-container-lowest shadow-sm z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 material-symbols-outlined text-[16px]">light_mode</span>
                <span className="relative z-10">Light</span>
              </button>
              <button
                type="button"
                onClick={() => switchThemeMode("dark")}
                className={`relative flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer z-10 ${
                  themeMode === "dark"
                    ? "text-white"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {themeMode === "dark" && (
                  <motion.div
                    layoutId="themeModeSliderPill"
                    className="absolute inset-0 rounded-xl bg-[#131b2e] dark:bg-white/15 text-white shadow-sm z-0"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 material-symbols-outlined text-[16px]">dark_mode</span>
                <span className="relative z-10">Dark</span>
              </button>
            </div>
          </div>

          {/* ── 3. LIVE INTERACTIVE CHAT PREVIEW ── */}
          <div className="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 shadow-sm border border-outline-variant/10 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-caption text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Live Chat Theme Preview
              </span>
              <span className="font-caption text-primary text-[11px] font-medium">
                {activeWallpaperObj?.name || (wallpaper === "custom" ? "Custom Image" : "Wallpaper")}
              </span>
            </div>

            {/* Mini Chat Sandbox Screen */}
            <div
              className={`w-full rounded-2xl p-4 flex flex-col gap-2.5 overflow-hidden transition-all duration-300 min-h-[140px] justify-center ${activeWallpaperClass}`}
              style={activeWallpaperStyle}
            >
              {/* Received Message */}
              <div className="self-start max-w-[78%]">
                <div className={`px-3.5 py-2 rounded-2xl rounded-bl-xs text-xs ${RECEIVED_STYLES[receivedTheme] || "bg-white/80 text-on-surface"}`}>
                  Hey! Loving this new Instagram chat theme ✨
                </div>
              </div>

              {/* Sent Message */}
              <div className="self-end max-w-[78%]">
                <div className={`px-3.5 py-2 rounded-2xl rounded-br-xs text-xs text-white shadow-sm bg-gradient-to-br ${activeSentGradient}`}>
                  Looks super clean and aesthetic! 🔥
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. INSTAGRAM-STYLE CHAT WALLPAPERS GRID ── */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b border-outline-variant/10 pb-3">
              <div>
                <h2 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
                  Chat Wallpapers & Aesthetics
                </h2>
                <p className="font-caption text-xs text-on-surface-variant">
                  Select an Instagram-style backdrop for your conversations
                </p>
              </div>

              {/* Custom Image Upload Button */}
              <button
                type="button"
                onClick={() => wallpaperInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-label-md text-xs font-semibold cursor-pointer transition-colors mt-2 sm:mt-0"
              >
                <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                <span>Custom Image</span>
              </button>
              <input
                ref={wallpaperInputRef}
                type="file"
                accept="image/*"
                onChange={onCustomWallpaperUpload}
                className="hidden"
              />
            </div>

            {/* ── Category Filter Tabs with Smooth Sliding Background Pill ── */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
              {THEME_CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`relative px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "text-white"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="categoryFilterSlidePill"
                        className="absolute inset-0 rounded-full bg-primary shadow-sm z-0"
                        transition={{ type: "spring", stiffness: 440, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
            </div>

            {/* Wallpaper Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {filteredThemes.map(theme => {
                const isSelected = wallpaper === theme.id;
                return (
                  <motion.div
                    key={theme.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectWallpaper(theme.id)}
                    className={`relative rounded-2xl p-3 cursor-pointer transition-all border flex flex-col justify-between h-32 overflow-hidden shadow-xs ${
                      isSelected
                        ? "ring-2 ring-primary border-primary shadow-md"
                        : "border-outline-variant/15 hover:border-primary/40"
                    }`}
                    style={theme.containerStyle}
                  >
                    {/* Dark subtle overlay for text readability */}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                    {/* Top Tag & Checkmark */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-black/50 text-white font-caption text-[10px] backdrop-blur-sm">
                        {theme.badge || theme.category}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                      )}
                    </div>

                    {/* Mini simulated bubble */}
                    <div className="relative z-10 flex justify-end">
                      <span className="px-2 py-1 rounded-xl rounded-br-xs bg-white/90 dark:bg-black/80 text-black dark:text-white font-caption text-[9px] shadow-xs">
                        Hi 👋
                      </span>
                    </div>

                    {/* Bottom Theme Name */}
                    <div className="relative z-10">
                      <p className="font-title-md font-bold text-white text-xs drop-shadow-sm truncate">
                        {theme.name}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Custom Image Slot (if uploaded) */}
              {customWallpaperUrl && (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectWallpaper("custom")}
                  className={`relative rounded-2xl p-3 cursor-pointer transition-all border flex flex-col justify-between h-32 overflow-hidden shadow-xs ${
                    wallpaper === "custom"
                      ? "ring-2 ring-primary border-primary shadow-md"
                      : "border-outline-variant/15 hover:border-primary/40"
                  }`}
                  style={{ backgroundImage: `url(${customWallpaperUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
                >
                  <div className="absolute inset-0 bg-black/30 pointer-events-none" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-black/50 text-white font-caption text-[10px] backdrop-blur-sm">
                      Uploaded
                    </span>
                    {wallpaper === "custom" && (
                      <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </div>
                    )}
                  </div>
                  <div className="relative z-10">
                    <p className="font-title-md font-bold text-white text-xs drop-shadow-sm">
                      My Photo
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── 5. MESSAGE BUBBLE THEMES (INSTAGRAM DM GRADIENTS) ── */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-4">
            <div>
              <h2 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
                Sent Message Colors
              </h2>
              <p className="font-caption text-xs text-on-surface-variant">
                Vibrant gradient shades for your outbound message bubbles
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BUBBLE_GRADIENTS.map(b => {
                const isSelected = sentTheme === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectSentTheme(b.id)}
                    className={`p-3 rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-outline-variant/10 hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full bg-gradient-to-br ${b.style} shadow-xs flex-shrink-0`} />
                      <span className="font-title-md text-xs font-semibold text-on-surface truncate">
                        {b.name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Received Bubble Shade */}
            <div className="pt-3 border-t border-outline-variant/10 flex flex-col gap-2">
              <span className="font-caption text-xs font-semibold text-on-surface-variant">
                Incoming Bubble Tone
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "liquid-glass", label: "Glass" },
                  { id: "soft-slate", label: "Soft Slate" },
                  { id: "deep-obsidian", label: "Obsidian" },
                  { id: "lilac-mist", label: "Lilac" },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectReceivedTheme(r.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                      receivedTheme === r.id
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-surface-container bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 6. ACCOUNT & GATEWAY ── */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-3">
            <h2 className="font-headline-sm text-sm font-bold text-on-surface uppercase tracking-wider">
              Account & Security
            </h2>

            {/* Admin Gateway Card */}
            <div
              onClick={() => setShowAdminModal(true)}
              className="p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                </div>
                <div>
                  <p className="font-title-md font-semibold text-on-surface text-sm">Admin Gateway</p>
                  <p className="font-caption text-on-surface-variant text-xs">Access centralized moderation console</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
            </div>

            {/* Log Out Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                Storage.logoutUser();
                router.push("/");
              }}
              className="w-full py-3 px-4 rounded-2xl bg-error/10 hover:bg-error/15 text-error font-title-md text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors border border-error/20 mt-1"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Log Out of Account
            </motion.button>
          </div>

        </div>
      </div>

      {/* ── ADMIN CREDENTIALS MODAL ── */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={e => {
              if (e.target === e.currentTarget) {
                setShowAdminModal(false);
                setAdminError("");
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md p-6 rounded-3xl shadow-2xl flex flex-col gap-4 overflow-hidden bg-[#1e293b] text-white border border-white/10"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-white text-[22px]">security</span>
                  </div>
                  <div>
                    <h3 className="font-title-md font-semibold text-white text-base">Admin Gateway</h3>
                    <p className="font-caption text-white/60 text-xs">Root Controller Access</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminError("");
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="font-body-sm text-white/70 text-xs">
                Enter master credentials to access the central administration console.
              </p>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-white/80 text-xs">Master Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@flyingo.me"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-white/80 text-xs">Root Passkey</label>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-caption text-white/80 text-xs">4-Digit Security PIN</label>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value.slice(0, 4).replace(/\D/g, ""))}
                    placeholder="• • • •"
                    maxLength={4}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-primary tracking-[0.5em] text-center text-sm font-mono"
                  />
                </div>

                {adminError && (
                  <p className="font-caption text-red-400 text-xs text-center">{adminError}</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdminAuth}
                className="w-full py-2.5 rounded-xl text-white font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md bg-user-gradient cursor-pointer mt-1"
              >
                <span className="material-symbols-outlined text-[18px]">lock_open</span>
                Authenticate & Enter
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
