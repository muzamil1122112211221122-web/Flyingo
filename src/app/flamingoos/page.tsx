"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Storage, FlamingooStory, UserProfile } from "@/lib/storage";
import { Realtime } from "@/lib/realtime";

export default function FlamingoosPage() {
  const router = useRouter();
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: "u_default",
    handle: "",
    name: "",
    createdAt: Date.now(),
  });
  const [stories, setStories] = useState<FlamingooStory[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New flamingoo form state
  const [storyType, setStoryType] = useState<"text" | "image" | "video">("text");
  const [newStoryText, setNewStoryText] = useState("");
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null);
  const [newStoryBg, setNewStoryBg] = useState("linear-gradient(135deg, #b70942, #7d2dce)");
  const [newStoryDuration, setNewStoryDuration] = useState(60);

  // Advanced Moveable & Free Drag Text state
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono" | "handwriting" | "impact">("sans");
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [textDeleted, setTextDeleted] = useState(false);
  const [textHighlight, setTextHighlight] = useState(true);

  // Flamingoo viewer state
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySentToast, setReplySentToast] = useState(false);
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const u = Storage.getCurrentUser();
    setCurrentUser(u);
    Storage.fetchRemoteUsers();

    // Initial load from local
    setStories(Storage.getStories());

    // Fetch live stories from Supabase cloud database
    Storage.fetchRemoteStories().then(fresh => {
      if (fresh) {
        setStories(fresh);
      }
    });
  }, []);

  // Group stories by authorHandle so multiple stories from one user appear grouped together
  const groupedStories = useMemo<FlamingooStory[][]>(() => {
    const map = new Map<string, FlamingooStory[]>();
    stories.forEach(s => {
      const key = (s.authorHandle || s.userId || "anonymous").toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.values());
  }, [stories]);

  const [activeUserHandle, setActiveUserHandle] = useState<string | null>(null);
  const activeUserStories = useMemo<FlamingooStory[]>(() => {
    if (!activeUserHandle) return [];
    const group = groupedStories.find((g: FlamingooStory[]) => (g[0]?.authorHandle || g[0]?.userId || "").toLowerCase() === activeUserHandle.toLowerCase());
    return group || [];
  }, [groupedStories, activeUserHandle]);

  const activeStory = activeStoryIndex !== null && activeUserStories[activeStoryIndex] ? activeUserStories[activeStoryIndex] : null;
  const isMyStory = !!(activeStory && (activeStory.authorHandle?.toLowerCase() === currentUser.handle?.toLowerCase() || activeStory.userId === currentUser.id));

  // Auto-progress in Viewer
  useEffect(() => {
    if (activeStoryIndex === null || isPaused || showViewersDrawer || !activeStory) return;

    const interval = 50;
    const totalDurationMs = (activeStory?.durationSeconds || 15) * 1000;
    const increment = (interval / totalDurationMs) * 100;

    timerRef.current = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          if (activeStoryIndex < activeUserStories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            // Check if there is a next user group
            const currentGroupIdx = groupedStories.findIndex((g: FlamingooStory[]) => (g[0]?.authorHandle || g[0]?.userId || "").toLowerCase() === activeUserHandle?.toLowerCase());
            if (currentGroupIdx !== -1 && currentGroupIdx < groupedStories.length - 1) {
              const nextGroup = groupedStories[currentGroupIdx + 1];
              const nextHandle = nextGroup[0]?.authorHandle || nextGroup[0]?.userId || "";
              setActiveUserHandle(nextHandle);
              setActiveStoryIndex(0);
              return 0;
            }
            closeStory();
            return 0;
          }
        }
        return prev + increment;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeStoryIndex, isPaused, showViewersDrawer, activeUserStories.length, activeStory, groupedStories, activeUserHandle]);

  const openStoryGroup = (group: FlamingooStory[], storyIdx = 0) => {
    if (!group || group.length === 0) return;
    const s = group[storyIdx] || group[0];
    if (s && currentUser.handle) {
      Storage.recordStoryView(s.id, currentUser.handle);
      setStories(Storage.getStories());
    }
    setActiveUserHandle(s.authorHandle || s.userId || "");
    setActiveStoryIndex(storyIdx);
    setStoryProgress(0);
    setIsPaused(false);
    setShowViewersDrawer(false);
  };

  const openStory = (index: number) => {
    const s = stories[index];
    if (!s) return;
    const handle = (s.authorHandle || s.userId || "").toLowerCase();
    const group = groupedStories.find((g: FlamingooStory[]) => (g[0]?.authorHandle || g[0]?.userId || "").toLowerCase() === handle);
    if (group) {
      const idxInGroup = group.findIndex((item: FlamingooStory) => item.id === s.id);
      openStoryGroup(group, Math.max(0, idxInGroup));
    } else {
      openStoryGroup([s], 0);
    }
  };

  const closeStory = () => {
    setActiveUserHandle(null);
    setActiveStoryIndex(null);
    setStoryProgress(0);
    setIsPaused(false);
    setShowViewersDrawer(false);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith("video/");
      setStoryType(isVideo ? "video" : "image");
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setMediaDataUrl(loadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateStory = () => {
    if (!newStoryText.trim() && !mediaDataUrl) return;
    const finalContent = textDeleted ? undefined : (newStoryText.trim() || undefined);
    const created = Storage.addStory({
      userId: currentUser.id,
      authorName: currentUser.name || `@${currentUser.handle}`,
      authorHandle: currentUser.handle,
      authorAvatar: (currentUser.name || currentUser.handle || "U").charAt(0).toUpperCase(),
      type: storyType,
      content: finalContent,
      mediaUrl: mediaDataUrl || undefined,
      background: newStoryBg,
      fontFamily,
      isBold,
      isItalic,
      isUnderline,
      textXOffset: dragOffset.x,
      textYOffset: dragOffset.y,
      durationSeconds: newStoryDuration,
    });
    setStories([created, ...stories]);
    setNewStoryText("");
    setMediaDataUrl(null);
    setDragOffset({ x: 0, y: 0 });
    setTextDeleted(false);
    setStoryType("text");
    setShowCreateModal(false);
  };

  const handleLike = (storyId: string) => {
    const updated = Storage.likeStory(storyId);
    setStories(updated);
    const target = updated.find(s => s.id === storyId);
    if (target && currentUser.handle) {
      Realtime.sendStoryLike(
        storyId,
        target.likes,
        !!target.hasLiked,
        currentUser.handle,
        target.authorHandle || ""
      );
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !activeStory) return;
    const cur = Storage.getCurrentUser();
    if (cur && cur.handle && activeStory.authorHandle && cur.handle.toLowerCase() !== activeStory.authorHandle.toLowerCase()) {
      const msg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: "me" as const,
        senderHandle: cur.handle,
        text: `↩ Story reply: ${replyText.trim()}`,
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        delivered: true,
      };
      Storage.saveDirectMessage(cur, activeStory.authorHandle, msg as any);
      Realtime.sendDirectMessage(cur, activeStory.authorHandle, msg as any);
    }
    setReplySentToast(true);
    setTimeout(() => {
      setReplySentToast(false);
      setReplyText("");
    }, 2000);
  };


  const gradientOptions = [
    { label: "Royal Dune", bg: "linear-gradient(135deg, #003973, #e5e5be)" },
    { label: "Neon Violet", bg: "linear-gradient(135deg, #7d2dce, #b70942)" },
    { label: "Cyber Cyan", bg: "linear-gradient(135deg, #008190, #00daf3)" },
    { label: "Midnight Velvet", bg: "linear-gradient(135deg, #283044, #131b2e)" },
    { label: "Emerald Pulse", bg: "linear-gradient(135deg, #00525c, #008190)" },
  ];

  const fontClasses: Record<string, string> = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono tracking-tight",
    handwriting: "italic font-serif tracking-wide",
    impact: "font-black uppercase tracking-wider",
  };

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      <Sidebar />

      {/* ---- MAIN CONTENT ---- */}
      <div className="md:ml-[86px] ml-0 flex-1 flex flex-col min-h-screen pb-28 md:pb-8">

        {/* ---- TOP HEADER ---- */}
        <div className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-surface-container px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-primary">auto_stories</span>
            <h1 className="font-headline-sm font-bold tracking-tight">Flamingoos</h1>
            {stories.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                {stories.length}
              </span>
            )}
          </div>
          {/* Desktop post button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="hidden sm:flex px-4 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-label-md font-semibold items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer text-[13px]"
          >
            <span className="material-symbols-outlined text-[17px]">add_photo_alternate</span>
            Post Flamingoo
          </motion.button>
        </div>

        <div className="flex flex-col gap-0 max-w-2xl mx-auto w-full">

          {/* ---- STORY TRAY (naked, Instagram-style) ---- */}
          <div className="px-2 pt-4 pb-2">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none px-2">
              {/* My Flamingoo Creator pill */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group outline-none"
              >
                <div className="relative">
                  <div className="w-[62px] h-[62px] rounded-full bg-gradient-to-tr from-surface-container to-surface-container-high flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm ring-2 ring-surface-container-high">
                    <div className="w-[54px] h-[54px] rounded-full bg-gradient-to-tr from-secondary to-primary flex items-center justify-center text-white font-bold text-base">
                      {(currentUser.name || currentUser.handle || "U").substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-surface">
                    +
                  </span>
                </div>
                <span className="font-caption text-on-surface text-[11px] text-center max-w-[64px] leading-tight">You</span>
              </button>

              {/* Grouped Stories */}
              {groupedStories.map((group) => {
                const firstStory = group[0];
                const storyCount = group.length;
                return (
                  <button
                    key={firstStory.id}
                    onClick={() => openStoryGroup(group, 0)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group outline-none"
                  >
                    <div className="relative">
                      <div className="w-[62px] h-[62px] rounded-full p-[2px] bg-gradient-to-tr from-primary via-secondary to-tertiary group-hover:scale-105 transition-transform shadow-sm">
                        <div className="w-full h-full rounded-full bg-surface p-[2px]">
                          {firstStory.type === "image" && firstStory.mediaUrl ? (
                            <img src={firstStory.mediaUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-base" style={{ background: firstStory.background }}>
                              {firstStory.authorAvatar}
                            </div>
                          )}
                        </div>
                      </div>
                      {storyCount > 1 && (
                        <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 rounded-full bg-secondary text-white text-[9px] font-bold shadow ring-2 ring-surface">
                          {storyCount}
                        </span>
                      )}
                    </div>
                    <span className="font-caption text-on-surface text-[11px] text-center max-w-[64px] truncate leading-tight">
                      {firstStory.authorName?.split(" ")[0] || firstStory.authorHandle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---- DIVIDER ---- */}
          <div className="h-px bg-surface-container mx-4 my-1" />

          {/* ---- FEED / EMPTY STATE ---- */}
          {stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-6 py-20">
              <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[40px] text-secondary">auto_stories</span>
              </div>
              <h3 className="font-headline-sm font-bold text-on-surface mb-2">No Flamingoos Yet</h3>
              <p className="font-body-md text-on-surface-variant max-w-xs mb-6">
                Share a photo, video or thought. Ephemeral 24h updates!
              </p>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2.5 rounded-full bg-primary text-white font-label-md font-semibold flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                Post First Flamingoo
              </motion.button>
            </div>
          ) : (
            /* ---- FEED CARDS â€” Instagram-style 2-col grid ---- */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 p-0.5">
              {stories.map((story, idx) => {
                const isMine = story.authorHandle?.toLowerCase() === currentUser.handle?.toLowerCase();
                return (
                  <motion.button
                    key={story.id}
                    whileHover={{ opacity: 0.88 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => openStory(idx)}
                    className="relative aspect-[3/4] overflow-hidden cursor-pointer group outline-none"
                    style={{ background: story.mediaUrl ? "#131b2e" : story.background }}
                  >
                    {/* Media */}
                    {story.type === "image" && story.mediaUrl ? (
                      <img src={story.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : story.type === "video" && story.mediaUrl ? (
                      <video src={story.mediaUrl} muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 w-full h-full" style={{ background: story.background }} />
                    )}

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                    {/* Content text preview */}
                    {story.content && (
                      <div className="absolute inset-0 flex items-center justify-center px-3">
                        <p className={`text-white text-center text-[13px] leading-snug drop-shadow-lg font-semibold line-clamp-4 ${fontClasses[story.fontFamily || "sans"]}`}>
                          {story.content}
                        </p>
                      </div>
                    )}

                    {/* Bottom info */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center font-bold text-[10px] text-white shadow-sm ring-1 ring-white/20">
                          {story.authorAvatar}
                        </div>
                        <span className="text-white text-[10px] font-semibold drop-shadow leading-none">
                          {story.authorName?.split(" ")[0] || story.authorHandle}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-white/90">
                        <span className="material-symbols-outlined text-[13px] text-red-400" style={{ fontVariationSettings: story.hasLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        <span className="text-[10px] font-semibold drop-shadow">{story.likes}</span>
                      </div>
                    </div>

                    {/* Mine badge */}
                    {isMine && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-primary/90 text-white text-[9px] font-bold backdrop-blur-sm">
                        You
                      </div>
                    )}

                    {/* Video badge */}
                    {story.type === "video" && (
                      <div className="absolute top-2 left-2">
                        <span className="material-symbols-outlined text-white text-[16px] drop-shadow-lg">videocam</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---- MOBILE FAB ---- */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setShowCreateModal(true)}
        className="sm:hidden fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-xl shadow-primary/30 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
      </motion.button>

      {/* ---- CREATE FLAMINGOO MODAL ---- */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-end md:items-center justify-center md:p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="w-full md:max-w-xl bg-surface-container-lowest md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[93vh]"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 rounded-full bg-outline-variant/60" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">auto_stories</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">Create Flamingoo</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-4">

                {/* Story Type Selector */}
                <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-2xl">
                  {([
                    { key: "text",  icon: "title",    label: "Text"  },
                    { key: "image", icon: "image",    label: "Image" },
                    { key: "video", icon: "videocam", label: "Video" },
                  ] as const).map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => { setStoryType(t.key); if (t.key === "image" || t.key === "video") fileUploadRef.current?.click(); }}
                      className={`flex-1 py-2 rounded-xl font-label-md text-[12px] transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        storyType === t.key ? "bg-primary text-white shadow-xs font-bold" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                <input ref={fileUploadRef} type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" />

                {/* Live Canvas Preview */}
                <div
                  className="w-full rounded-2xl p-4 flex flex-col justify-between text-white shadow-inner transition-all duration-300 relative overflow-hidden select-none touch-none"
                  style={{ background: mediaDataUrl ? "#131b2e" : newStoryBg, minHeight: "220px", height: "clamp(220px, 45vw, 280px)" }}
                >
                  {mediaDataUrl && storyType === "image" && (
                    <img src={mediaDataUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover -z-0" />
                  )}
                  {mediaDataUrl && storyType === "video" && (
                    <video src={mediaDataUrl} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover -z-0" />
                  )}

                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full">
                      <span className="font-label-md font-semibold text-[12px]">{currentUser.name || `@${currentUser.handle}`}</span>
                    </div>
                    {mediaDataUrl && (
                      <button type="button" onClick={() => { setMediaDataUrl(null); setStoryType("text"); }} className="px-2.5 py-1 rounded-xl bg-user-gradient text-white font-caption text-[11px] cursor-pointer shadow-sm">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="z-10 w-full flex-1 flex items-center justify-center relative overflow-visible">
                    {!textDeleted && newStoryText ? (
                      <motion.div
                        drag dragConstraints={{ left: -140, right: 140, top: -75, bottom: 75 }}
                        dragElastic={0.1} dragMomentum={false}
                        style={{ touchAction: "none" }}
                        onDragEnd={(_, info) => { setDragOffset(prev => ({ x: prev.x + info.offset.x, y: prev.y + info.offset.y })); }}
                        className="inline-flex items-center gap-2 cursor-grab active:cursor-grabbing select-none group"
                      >
                        <p className={`leading-relaxed inline-block p-3 rounded-2xl max-w-full break-words shadow-xl ${fontClasses[fontFamily]} ${isBold ? "font-bold" : "font-normal"} ${isItalic ? "italic" : ""} ${isUnderline ? "underline" : ""} ${textHighlight ? "bg-black/60 backdrop-blur-md" : "drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"}`} style={{ fontSize: "18px" }}>
                          {newStoryText}
                        </p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setTextDeleted(true); }} className="w-6 h-6 rounded-full bg-user-gradient text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </motion.div>
                    ) : textDeleted ? (
                      <button type="button" onClick={() => setTextDeleted(false)} className="px-3 py-1.5 rounded-xl bg-black/50 text-white/80 hover:text-white font-caption text-xs flex items-center gap-1 cursor-pointer">
                        <span className="material-symbols-outlined text-[14px]">restore</span>
                        Restore Text
                      </button>
                    ) : !mediaDataUrl ? (
                      <p className="font-body-md opacity-60 text-center text-sm">Type text or upload a photo/video...</p>
                    ) : null}
                  </div>

                  <div className="flex justify-between items-center text-caption opacity-90 text-[11px] z-10 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full">
                    <span>{fontFamily} style</span>
                    <span>{newStoryDuration}s duration</span>
                  </div>
                </div>

                {/* Text Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md font-semibold text-on-surface text-[13px]">Flamingoo Text</label>
                  <textarea
                    value={newStoryText} onChange={e => setNewStoryText(e.target.value)}
                    placeholder="Type your status, thought, or story..."
                    rows={2} maxLength={180}
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface font-body-md outline-none focus:ring-2 focus:ring-primary/20 resize-none text-[14px]"
                  />
                </div>

                {/* Style Controls */}
                <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-caption text-on-surface-variant font-bold uppercase text-[10px] shrink-0">Font:</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1">
                      {[
                        { id: "sans", label: "Modern" }, { id: "serif", label: "Serif" },
                        { id: "mono", label: "Cyber" }, { id: "handwriting", label: "Cursive" }, { id: "impact", label: "Impact" },
                      ].map(f => (
                        <button key={f.id} type="button" onClick={() => setFontFamily(f.id as any)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] whitespace-nowrap transition-all cursor-pointer shrink-0 ${fontFamily === f.id ? "bg-primary text-white font-bold shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setIsBold(!isBold)} className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer transition-colors ${isBold ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>B</button>
                      <button type="button" onClick={() => setIsItalic(!isItalic)} className={`w-8 h-8 rounded-xl flex items-center justify-center italic font-serif text-sm cursor-pointer transition-colors ${isItalic ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>I</button>
                      <button type="button" onClick={() => setIsUnderline(!isUnderline)} className={`w-8 h-8 rounded-xl flex items-center justify-center underline text-sm cursor-pointer transition-colors ${isUnderline ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`}>U</button>
                      <button type="button" onClick={() => setTextHighlight(!textHighlight)} className={`px-2.5 py-1 h-8 rounded-xl flex items-center gap-1 text-[11px] cursor-pointer transition-colors ${textHighlight ? "bg-secondary text-white" : "bg-surface-container text-on-surface-variant"}`}>
                        <span className="material-symbols-outlined text-[14px]">format_color_fill</span>Pill
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-caption text-[10px] text-on-surface-variant flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-primary">pan_tool</span>Drag text
                      </span>
                      {(dragOffset.x !== 0 || dragOffset.y !== 0) && (
                        <button type="button" onClick={() => setDragOffset({ x: 0, y: 0 })} className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-[10px] cursor-pointer">Reset</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload button */}
                <button type="button" onClick={() => fileUploadRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-label-md flex items-center justify-center gap-2 cursor-pointer transition-colors text-[13px]">
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  {mediaDataUrl ? "Change Media File" : "Upload Custom Photo / Video"}
                </button>

                {/* Atmospheric Shader */}
                {!mediaDataUrl && (
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md font-semibold text-on-surface text-[12px]">Atmospheric Shader</label>
                    <div className="grid grid-cols-5 gap-2">
                      {gradientOptions.map(g => (
                        <button key={g.label} onClick={() => setNewStoryBg(g.bg)}
                          className={`h-9 rounded-xl shadow-xs transition-transform cursor-pointer hover:scale-105 ${newStoryBg === g.bg ? "ring-2 ring-primary ring-offset-2" : ""}`}
                          style={{ background: g.bg }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration */}
                <div className="flex items-center justify-between">
                  <span className="font-label-md font-semibold text-on-surface text-[12px]">Duration</span>
                  <div className="flex gap-2">
                    {[30, 60, 120].map(d => (
                      <button key={d} type="button" onClick={() => setNewStoryDuration(d)}
                        className={`px-4 py-1.5 rounded-full font-label-md text-[11px] cursor-pointer ${newStoryDuration === d ? "bg-primary text-white font-bold" : "bg-surface-container text-on-surface-variant"}`}>
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Share button */}
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={handleCreateStory}
                  disabled={!newStoryText.trim() && !mediaDataUrl}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-title-md font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  Share to Flamingoos
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ---- FULLSCREEN STORY VIEWER ---- */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              className="relative w-full max-w-sm h-[88vh] max-h-[720px] rounded-3xl flex flex-col justify-between shadow-2xl overflow-hidden text-white select-none"
              style={{ background: activeStory.mediaUrl ? "#0c0d18" : activeStory.background }}
            >
              {/* Media */}
              {activeStory.type === "image" && activeStory.mediaUrl && (
                <img src={activeStory.mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover -z-0" />
              )}
              {activeStory.type === "video" && activeStory.mediaUrl && (
                <video src={activeStory.mediaUrl} autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover -z-0" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 z-0" />

              {/* Progress bars */}
              <div className="absolute top-3 left-4 right-4 flex gap-1 z-30">
                {activeUserStories.map((s: FlamingooStory, idx: number) => (
                  <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
                    <div className="h-full bg-white" style={{ width: idx < (activeStoryIndex || 0) ? "100%" : idx === activeStoryIndex ? `${storyProgress}%` : "0%", transition: "none" }} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mt-8 px-4 z-30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-sm shadow-inner ring-1 ring-white/20">
                    {activeStory.authorAvatar}
                  </div>
                  <div>
                    <p className="font-title-md font-bold drop-shadow text-sm leading-tight">{activeStory.authorName}</p>
                    <p className="font-caption text-white/75 text-[11px]">@{activeStory.authorHandle} Â· {activeStory.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsPaused(!isPaused)} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[17px]">{isPaused ? "play_arrow" : "pause"}</span>
                  </button>
                  <button onClick={closeStory} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[17px]">close</span>
                  </button>
                </div>
              </div>

              {/* Middle text canvas */}
              <div
                className="z-20 px-4 text-center my-auto"
                style={{ transform: (activeStory.textXOffset !== undefined || activeStory.textYOffset !== undefined) ? `translate(${activeStory.textXOffset || 0}px, ${activeStory.textYOffset || 0}px)` : "none" }}
              >
                {activeStory.content && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className={`leading-relaxed drop-shadow-lg bg-black/40 backdrop-blur-xs p-4 rounded-2xl inline-block max-w-full break-words ${fontClasses[activeStory.fontFamily || "sans"] || "font-sans"} ${activeStory.isBold ? "font-bold" : "font-normal"} ${activeStory.isItalic ? "italic" : ""} ${activeStory.isUnderline ? "underline" : ""}`}
                    style={{ fontSize: "20px" }}
                  >
                    {activeStory.content}
                  </motion.p>
                )}
              </div>

              {/* Next/Prev tap targets */}
              <div className="absolute left-0 top-20 bottom-28 w-1/3 z-20 cursor-pointer" onClick={() => {
                if ((activeStoryIndex || 0) > 0) { setActiveStoryIndex((activeStoryIndex || 0) - 1); setStoryProgress(0); }
                else {
                  const gi = groupedStories.findIndex((g: FlamingooStory[]) => (g[0]?.authorHandle || g[0]?.userId || "").toLowerCase() === activeUserHandle?.toLowerCase());
                  if (gi > 0) { const pg = groupedStories[gi - 1]; setActiveUserHandle(pg[0]?.authorHandle || pg[0]?.userId || ""); setActiveStoryIndex(pg.length - 1); setStoryProgress(0); }
                }
              }} />
              <div className="absolute right-0 top-20 bottom-28 w-1/3 z-20 cursor-pointer" onClick={() => {
                if ((activeStoryIndex || 0) < activeUserStories.length - 1) { setActiveStoryIndex((activeStoryIndex || 0) + 1); setStoryProgress(0); }
                else {
                  const gi = groupedStories.findIndex((g: FlamingooStory[]) => (g[0]?.authorHandle || g[0]?.userId || "").toLowerCase() === activeUserHandle?.toLowerCase());
                  if (gi !== -1 && gi < groupedStories.length - 1) { const ng = groupedStories[gi + 1]; setActiveUserHandle(ng[0]?.authorHandle || ng[0]?.userId || ""); setActiveStoryIndex(0); setStoryProgress(0); }
                  else closeStory();
                }
              }} />

              {/* Footer */}
              <div className="flex flex-col gap-2.5 z-30 px-4 pb-5">
                {replySentToast && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-2 rounded-xl bg-black/70 backdrop-blur-md text-center font-caption text-tertiary-fixed text-[12px] flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Reply sent to @{activeStory.authorHandle}&apos;s chat!</span>
                  </motion.div>
                )}

                {isMyStory && (
                  <div className="flex items-center justify-between bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <button type="button" onClick={() => setShowViewersDrawer(!showViewersDrawer)} className="flex items-center gap-1.5 text-[12px] font-semibold text-tertiary-fixed hover:underline cursor-pointer">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      <span>{(activeStory.viewers || []).length} viewers</span>
                    </button>
                    <span className="text-[12px] opacity-70">{activeStory.likes} likes</span>
                  </div>
                )}

                <AnimatePresence>
                  {isMyStory && showViewersDrawer && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-black/80 backdrop-blur-lg rounded-2xl max-h-36 overflow-y-auto flex flex-col gap-1.5 border border-white/10">
                      <p className="font-caption text-white/60 text-[10px] uppercase font-bold">People who viewed:</p>
                      {(activeStory.viewers || []).length === 0 ? (
                        <p className="font-caption text-white/50 text-[11px]">No views yet</p>
                      ) : (
                        (activeStory.viewers || []).map((vh: string) => (
                          <div key={vh} className="flex items-center gap-2 text-white text-[12px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />@{vh}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                  {!isMyStory ? (
                    <div className="flex-1 flex items-center bg-black/40 backdrop-blur-md rounded-full px-4 py-2.5 border border-white/20">
                      <input
                        type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                        onFocus={() => setIsPaused(true)} onBlur={() => setIsPaused(false)}
                        placeholder={`Reply to @${activeStory.authorHandle}...`}
                        className="w-full bg-transparent text-white placeholder:text-white/60 outline-none font-body-sm text-[13px]"
                      />
                      {replyText.trim() && (
                        <button onClick={handleSendReply} className="text-white hover:text-primary cursor-pointer ml-2">
                          <span className="material-symbols-outlined text-[18px]">send</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 text-center py-2 text-[12px] text-white/60 bg-black/40 rounded-full">
                      Your Flamingoo Â· Ephemeral 24h
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 1.3 }}
                    onClick={() => handleLike(activeStory.id)}
                    className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center transition-colors border border-white/20 cursor-pointer flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[24px] text-red-500" style={{ fontVariationSettings: activeStory.hasLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
