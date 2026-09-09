"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Storage, UserProfile, ProfileVisit, VerifiedBadge as IVerifiedBadge } from "@/lib/storage";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [currentUser, setCurrentUser] = useState<UserProfile>({ id: "u_default", handle: "", name: "", createdAt: Date.now() });

  // Feature 1: Verified Badge Manager
  const [targetHandle, setTargetHandle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("crown");
  const [selectedColor, setSelectedColor] = useState("#eab308");
  const [badgeLabel, setBadgeLabel] = useState("Verified");
  const [badgeSuccessToast, setBadgeSuccessToast] = useState("");

  // Feature 2: Friends / Followers Count Modifier
  const [friendsHandle, setFriendsHandle] = useState("");
  const [customCountInput, setCustomCountInput] = useState("1M");
  const [friendsToast, setFriendsToast] = useState("");

  // Feature 3: 24h Profile Visitors
  const [visitors, setVisitors] = useState<ProfileVisit[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    // Admin panel is ALWAYS locked by default on open / navigation
    Storage.setAdminAuthenticated(false);
    setIsAuthenticated(false);
    const u = Storage.getCurrentUser();
    setCurrentUser(u);

    const lockAdmin = (reason?: string) => {
      Storage.setAdminAuthenticated(false);
      setIsAuthenticated(false);
      setAdminPass("");
      setAdminPin("");
      if (reason) {
        setErrorMsg(reason);
      }
    };

    // Auto-lock when user switches browser tabs or minimizes the window
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lockAdmin("🔒 Session auto-locked for security because you switched tabs.");
      }
    };

    const handleWindowBlur = () => {
      lockAdmin("🔒 Session auto-locked for security because you left or switched tabs.");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      Storage.setAdminAuthenticated(false);
    };
  }, []);

  const handleStrictAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      adminEmail.trim() === "muzamil1122112211221122@gmail.com" &&
      adminPass === "ProGangOP295" &&
      adminPin.trim() === "8585"
    ) {
      Storage.setAdminAuthenticated(true);
      setIsAuthenticated(true);
      setErrorMsg("");
      const u = Storage.getCurrentUser();
      setCurrentUser(u);
      setVisitors(Storage.getProfileVisits24h(u.handle));
      Storage.fetchRemoteUsers().then(users => setRegisteredUsers(users));
      setTargetHandle(u.handle);
      setFriendsHandle(u.handle);
    } else {
      setErrorMsg("❌ Invalid credentials. All 3 verification steps must match.");
    }
  };

  const handleLogout = () => {
    Storage.setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setAdminPin("");
  };

  const handleGrantBadge = (enable: boolean) => {
    if (!targetHandle.trim()) {
      setErrorMsg("Please enter a handle");
      return;
    }
    const clean = targetHandle.replace(/^@/, "").trim().toLowerCase();
    const badge: IVerifiedBadge = {
      enabled: enable,
      color: selectedColor,
      icon: selectedIcon,
      label: badgeLabel.trim() || undefined,
    };
    Storage.setUserBadge(clean, badge);
    setBadgeSuccessToast(enable ? `✓ Verified Badge granted to @${clean}!` : `✓ Badge removed from @${clean}`);
    setTimeout(() => setBadgeSuccessToast(""), 3000);
    Storage.fetchRemoteUsers().then(users => setRegisteredUsers(users));
  };

  const handleSetFriendsCount = () => {
    if (!friendsHandle.trim()) {
      setErrorMsg("Please enter a handle for friends count");
      return;
    }
    const clean = friendsHandle.replace(/^@/, "").trim().toLowerCase();
    Storage.setUserFriendsCount(clean, customCountInput.trim());
    setFriendsToast(`✓ Friends count for @${clean} set to ${customCountInput.trim()}!`);
    setTimeout(() => setFriendsToast(""), 3000);
    Storage.fetchRemoteUsers().then(users => setRegisteredUsers(users));
  };

  const formatTimeAgo = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const badgeIcons = [
    { id: "crown", label: "King Crown" },
    { id: "verified", label: "Checkmark" },
    { id: "workspace_premium", label: "Ribbon" },
    { id: "diamond", label: "Diamond" },
    { id: "star", label: "Star" },
    { id: "shield", label: "Shield" },
    { id: "bolt", label: "Lightning" },
    { id: "local_fire_department", label: "Flame" },
  ];

  const badgeColors = [
    { hex: "#eab308", name: "Gold" },
    { hex: "#00daf3", name: "Cyan" },
    { hex: "#ba0f44", name: "Rose" },
    { hex: "#7d2dce", name: "Violet" },
    { hex: "#10b981", name: "Emerald" },
    { hex: "#283044", name: "Obsidian" },
  ];

  const presetCounts = ["10k", "100k", "500k", "1M", "2.5M", "10M"];

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      <Sidebar />

      <div className="md:ml-[72px] ml-0 flex-1 flex flex-col p-4 md:p-6 lg:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-8">
        {!isAuthenticated ? (
          /* Secure 3-Step Master Gateway */
          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-surface-container-lowest shadow-2xl border border-outline-variant/15 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary" />
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-3 shadow-xs">
                <span className="material-symbols-outlined text-[30px]">admin_panel_settings</span>
              </div>
              <h2 className="font-headline-sm font-bold text-on-surface mb-1">Admin Central Gateway</h2>
              <p className="font-body-sm text-on-surface-variant mb-3">Enter 3-step master credentials to authorize access</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-medium mb-5 border border-outline-variant/15">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Auto-locks immediately on tab switch</span>
              </div>

              <form onSubmit={handleStrictAdminLogin} className="flex flex-col gap-3.5 text-left">
                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-on-surface text-xs">Step 1: Administrator Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="Enter admin email..."
                    className="w-full py-2.5 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-on-surface text-xs">Step 2: Root Passkey</label>
                  <input
                    type="password"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-label-md font-semibold text-on-surface text-xs">Step 3: Security Code (PIN)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value)}
                    placeholder="••••"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-surface-container-low text-on-surface text-sm font-bold tracking-widest outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>

                {errorMsg && (
                  <p className="text-error font-caption text-[12px] text-center font-medium bg-error/10 p-2 rounded-xl">{errorMsg}</p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-primary text-white font-title-md font-semibold shadow-md shadow-primary/20 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  Authorize & Unlock Admin
                </motion.button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* Admin Panel */
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
                </div>
                <div>
                  <h1 className="font-headline-sm font-bold text-on-surface">Flyingo Central Admin</h1>
                  <p className="font-caption text-on-surface-variant">
                    Logged in as <span className="font-bold text-primary font-mono">@{currentUser.handle}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/chat")}
                  className="px-4 py-2 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md transition-all cursor-pointer"
                >
                  Back to Chat
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-2xl bg-error/10 hover:bg-error/20 text-error font-label-md transition-all cursor-pointer"
                >
                  Lock
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT 7 COLS: Verified Badge + Friends Count Modifier */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* 1. Verified Badge Customizer (Always with Circular Background!) */}
                <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 flex flex-col gap-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <VerifiedBadge icon="crown" color="#ba0f44" size={24} title="Verified Badge Manager" />
                      <h2 className="font-title-md font-bold text-on-surface">Verified Badge Manager</h2>
                    </div>
                    <p className="font-caption text-on-surface-variant mt-0.5">
                      Grant custom circular badges (Crown, Checkmark, Star, etc.) by @handle
                    </p>
                  </div>

                  {badgeSuccessToast && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-2xl bg-tertiary/10 border border-tertiary/20 text-tertiary font-label-md text-[12px] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      {badgeSuccessToast}
                    </motion.div>
                  )}

                  {/* Handle selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md font-semibold text-on-surface">Target Account Handle</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-primary font-bold text-lg">@</span>
                      <input
                        type="text"
                        placeholder="e.g. muzamil or username"
                        value={targetHandle}
                        onChange={e => setTargetHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        className="w-full pl-9 pr-4 py-3 rounded-2xl bg-surface-container-low text-on-surface font-body-md outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {registeredUsers.slice(0, 4).map(u => (
                        <button
                          key={u.handle}
                          type="button"
                          onClick={() => setTargetHandle(u.handle)}
                          className="px-2.5 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high font-mono text-[11px] text-on-surface-variant transition-colors cursor-pointer"
                        >
                          @{u.handle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Badge Icon Selector with Verified Shape Rosette preview */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-semibold text-on-surface">Badge Icon (With Verified Rosette Shape)</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {badgeIcons.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedIcon(item.id)}
                          className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            selectedIcon === item.id
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-outline-variant/10 bg-surface-container-low hover:bg-surface-container"
                          }`}
                        >
                          {/* Verified Rosette shape badge */}
                          <VerifiedBadge
                            icon={item.id}
                            color={selectedColor}
                            size={24}
                            title={item.label}
                          />
                          <span className="font-caption text-[10px] text-on-surface-variant truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Badge Color Selector */}
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-semibold text-on-surface">Badge Rosette Background Color</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {badgeColors.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setSelectedColor(c.hex)}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform cursor-pointer ${
                            selectedColor === c.hex ? "ring-2 ring-on-surface ring-offset-2 scale-110" : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedColor === c.hex && (
                            <span className="material-symbols-outlined text-white text-[18px]">check</span>
                          )}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={e => setSelectedColor(e.target.value)}
                        className="w-10 h-10 rounded-2xl cursor-pointer bg-transparent border-0 outline-none"
                        title="Custom color hex"
                      />
                    </div>
                  </div>

                  {/* Optional Badge Label */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md font-semibold text-on-surface">Badge Label (Optional tooltip)</label>
                    <input
                      type="text"
                      placeholder="e.g. Verified, King, VIP, Founder"
                      value={badgeLabel}
                      onChange={e => setBadgeLabel(e.target.value)}
                      maxLength={15}
                      className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low text-on-surface font-body-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>

                  {/* Live Verified Rosette Badge Preview Box */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-between">
                    <span className="font-caption text-on-surface-variant font-medium">Verified Rosette Preview:</span>
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest shadow-sm">
                      <span className="font-title-md font-bold text-on-surface">
                        @{targetHandle || "username"}
                      </span>
                      {/* Verified Rosette badge */}
                      <VerifiedBadge
                        icon={selectedIcon}
                        color={selectedColor}
                        size={26}
                        title={badgeLabel || "Verified"}
                      />
                      {badgeLabel && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: selectedColor }}>
                          {badgeLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleGrantBadge(false)}
                      className="py-3 rounded-2xl bg-error/10 hover:bg-error/20 text-error font-title-md font-semibold transition-all cursor-pointer"
                    >
                      Revoke Badge
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleGrantBadge(true)}
                      className="py-3 rounded-2xl bg-primary hover:bg-primary-container text-white font-title-md font-semibold shadow-md shadow-primary/20 transition-all cursor-pointer"
                    >
                      Grant Circular Badge
                    </motion.button>
                  </div>
                </div>

                {/* 2. Friends / Followers Count Modifier */}
                <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[24px]">group</span>
                      <h2 className="font-title-md font-bold text-on-surface">Friends / Followers Count Modifier</h2>
                    </div>
                    <p className="font-caption text-on-surface-variant mt-0.5">
                      Set custom friends/followers count (e.g. 1M, 500k) for any account shown on profile view
                    </p>
                  </div>

                  {friendsToast && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-2xl bg-tertiary/10 border border-tertiary/20 text-tertiary font-label-md text-[12px] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      {friendsToast}
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md font-semibold text-on-surface">Target Handle</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-primary font-bold text-md">@</span>
                        <input
                          type="text"
                          placeholder="username"
                          value={friendsHandle}
                          onChange={e => setFriendsHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          className="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-surface-container-low text-on-surface font-body-sm outline-none focus:ring-2 focus:ring-secondary/30"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md font-semibold text-on-surface">Display Count</label>
                      <input
                        type="text"
                        placeholder="e.g. 1M, 500k, 2.4M"
                        value={customCountInput}
                        onChange={e => setCustomCountInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low text-on-surface font-body-sm font-bold outline-none focus:ring-2 focus:ring-secondary/30"
                      />
                    </div>
                  </div>

                  {/* Preset quick pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-caption text-on-surface-variant text-[11px]">Quick Presets:</span>
                    {presetCounts.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCustomCountInput(p)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          customCountInput === p ? "bg-secondary text-white shadow-xs" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleSetFriendsCount}
                    className="w-full py-3 rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-title-md font-semibold shadow-md shadow-secondary/20 transition-all cursor-pointer"
                  >
                    Set Friends Count on Profile
                  </motion.button>
                </div>

              </div>

              {/* RIGHT 5 COLS: 24h Profile Visitors Tracker */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[22px]">visibility</span>
                      <h2 className="font-title-md font-bold text-on-surface">Profile Visitors</h2>
                    </div>
                    <p className="font-caption text-on-surface-variant mt-0.5">
                      Users who visited <span className="font-semibold text-primary">@{currentUser.handle}</span>&apos;s profile within 24 hours
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-caption font-bold text-[11px]">
                    {visitors.length} Today
                  </span>
                </div>

                {/* Visitors list */}
                <div className="flex flex-col gap-2 mt-2 max-h-[550px] overflow-y-auto pr-1">
                  {visitors.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant/40 mb-3">
                        <span className="material-symbols-outlined text-[28px]">person_search</span>
                      </div>
                      <p className="font-title-md font-semibold text-on-surface">No profile views today</p>
                      <p className="font-caption text-on-surface-variant mt-1 max-w-xs leading-relaxed">
                        When other registered users open your profile in Flyingo, their handle and visit timestamp will appear here.
                      </p>
                    </div>
                  ) : (
                    visitors.map(v => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-secondary to-primary text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                            {(v.visitorName || v.visitorHandle).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-title-md text-[13px] font-semibold text-on-surface truncate">
                              {v.visitorName}
                            </p>
                            <p className="font-caption text-[11px] text-primary font-mono truncate">
                              @{v.visitorHandle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-caption text-on-surface-variant text-[10px]">
                            {formatTimeAgo(v.timestamp)}
                          </span>
                          <button
                            onClick={() => router.push("/chat")}
                            className="p-1.5 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-white text-on-surface-variant transition-colors cursor-pointer"
                            title="Message User"
                          >
                            <span className="material-symbols-outlined text-[16px]">chat</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
