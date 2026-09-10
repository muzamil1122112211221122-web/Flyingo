"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Storage, UserProfile, UserNote, UserLink, AudioStorage } from "@/lib/storage";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<UserLink[]>([]);
  const [avatar, setAvatar] = useState("/default-avatar.jpg");
  const [borderColor, setBorderColor] = useState("#ba0f44");
  const [gender, setGender] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [userStoriesCount, setUserStoriesCount] = useState(0);
  const [verifiedBadge, setVerifiedBadge] = useState<{ enabled: boolean; color: string; icon: string; label?: string } | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);

  // ── Crop & Move DP Modal State ──
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentNote, setCurrentNote] = useState<UserNote | null>(null);
  const [noteText, setNoteText] = useState("");
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>("");
  const [audioDuration, setAudioDuration] = useState<number>(0); // Total audio length in seconds
  const [audioStartTime, setAudioStartTime] = useState<number>(0); // Selected starting point (Instagram style)
  const [audioClipLength, setAudioClipLength] = useState<number>(30); // Clip duration (e.g. 15s, 30s)
  const [noteDurationDays, setNoteDurationDays] = useState<number>(1);
  const [isNoteAudioPlaying, setIsNoteAudioPlaying] = useState(false);
  const [customFriendsCount, setCustomFriendsCount] = useState<string | null>(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  useEffect(() => {
    const u = Storage.getCurrentUser();
    if (u) {
      setDisplayName(u.name || "");
      setHandle(u.handle || "");
      setBio(u.bio || "");
      setAvatar(u.avatar || "/default-avatar.jpg");
      if (u.borderColor) setBorderColor(u.borderColor);
      setGender(u.gender || "");
      setPronouns(u.pronouns || "");
      setVerifiedBadge(u.verifiedBadge);
      if (u.customFriendsCount) {
        setCustomFriendsCount(u.customFriendsCount);
      } else {
        const convs = Storage.getSavedConversations(u.handle).filter(c => !c.isGroup);
        setCustomFriendsCount(convs.length > 0 ? String(convs.length) : "0");
      }

      // Fetch remote fresh profile from Supabase
      Storage.fetchRemoteUsers().then(users => {
        const fresh = users.find(x => x.handle.toLowerCase() === u.handle.toLowerCase());
        if (fresh) {
          if (fresh.avatar && fresh.avatar !== "/default-avatar.jpg") setAvatar(fresh.avatar);
          if (fresh.bio) setBio(fresh.bio);
          if (fresh.name) setDisplayName(fresh.name);
          if (fresh.links && fresh.links.length > 0) setLinks(fresh.links);
          if (fresh.verifiedBadge) setVerifiedBadge(fresh.verifiedBadge);
          if (fresh.customFriendsCount) setCustomFriendsCount(fresh.customFriendsCount);
        }
      });
      
      // Load multiple links
      if (u.links && u.links.length > 0) {
        setLinks(u.links);
      } else if (u.link) {
        setLinks([{ id: "link_1", title: "Website", url: u.link }]);
      } else {
        setLinks([]);
      }

      if (u.note) {
        AudioStorage.resolveNoteAudio(u.note, u.handle).then(resolved => {
          if (resolved) {
            u.note!.audioDataUrl = resolved;
            setCustomAudioUrl(resolved);
          }
        });
        setCurrentNote(u.note);
        setNoteText(u.note.text || "");
        setCustomAudioUrl(u.note.audioDataUrl || null);
        setCustomAudioName(u.note.songTitle || (u.note.audioDataUrl ? "Uploaded Track" : ""));
        setAudioStartTime(u.note.startTime || 0);
        setAudioClipLength(u.note.durationSeconds || 30);
        setNoteDurationDays(u.note.durationDays || 1);
      }
    }
    const stories = Storage.getStories();
    const myStories = stories.filter(s => s.userId === u?.id || s.authorHandle === u?.handle);
    setUserStoriesCount(myStories.length);

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  // ── Image Selection & Crop Flow ──
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRawImageSrc(event.target.result as string);
          setCropZoom(1);
          setCropPan({ x: 0, y: 0 });
          setShowCropModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPan.x, y: e.clientY - cropPan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleApplyCrop = () => {
    if (!rawImageSrc) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new (window as any).Image();
    img.src = rawImageSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, 400, 400);
      ctx.save();
      ctx.beginPath();
      ctx.arc(200, 200, 200, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      const baseWidth = 400;
      const baseHeight = (img.height / img.width) * 400;
      const drawW = baseWidth * cropZoom;
      const drawH = baseHeight * cropZoom;
      const drawX = 200 - drawW / 2 + cropPan.x * 1.5;
      const drawY = 200 - drawH / 2 + cropPan.y * 1.5;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      const croppedUrl = canvas.toDataURL("image/jpeg", 0.9);
      setAvatar(croppedUrl);
      setShowCropModal(false);
      setRawImageSrc(null);
    };
  };

  // ── Multiple Links Handlers ──
  const handleAddLink = () => {
    setLinks([...links, { id: `link_${Date.now()}`, title: "Link", url: "" }]);
  };

  const handleUpdateLink = (id: string, field: "title" | "url", value: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleRemoveLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  // ── Save Profile Flow ──
  const handleSaveProfile = () => {
    const cleanHandle = handle.replace(/[^a-zA-Z0-9_]/g, '').trim();
    const cleanLinks = links.filter(l => l.url.trim().length > 0);

    const updatedData: Partial<UserProfile> = {
      name: displayName.trim() || cleanHandle,
      handle: cleanHandle,
      bio: bio.trim(),
      link: cleanLinks[0]?.url || "",
      links: cleanLinks,
      avatar: avatar || "/default-avatar.jpg",
      borderColor,
      gender: gender.trim(),
      pronouns: pronouns.trim(),
      note: currentNote || Storage.getRealCurrentUser().note || undefined,
    };

    Storage.setCurrentUser(updatedData);
    setProfileSavedToast(true);
    setTimeout(() => {
      setProfileSavedToast(false);
      setIsEditing(false);
    }, 1200);
  };

  // ── Note Audio Upload Handler ──
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomAudioName(file.name.replace(/\.[^/.]+$/, ""));
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          const dataUrl = loadEvt.target.result as string;
          setCustomAudioUrl(dataUrl);
          // Measure audio length
          const tempAudio = new Audio(dataUrl);
          tempAudio.onloadedmetadata = () => {
            const dur = Math.floor(tempAudio.duration) || 60;
            setAudioDuration(dur);
            setAudioStartTime(0);
            setAudioClipLength(Math.min(30, dur));
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() && !customAudioUrl) {
      handleClearNote();
      return;
    }

    const cleanHandle = handle.replace(/^@/, "").toLowerCase() || "user";
    const type = (noteText.trim() && customAudioUrl) ? "both" : customAudioUrl ? "music" : "text";
    const audioKey = customAudioUrl ? `note_audio_${cleanHandle}` : undefined;

    if (customAudioUrl && audioKey) {
      await AudioStorage.saveAudio(audioKey, customAudioUrl);
    }

    const newNote: UserNote = {
      type,
      text: noteText.trim() || undefined,
      songTitle: customAudioName || undefined,
      artist: customAudioName ? "Uploaded Audio" : undefined,
      audioDataUrl: customAudioUrl || undefined,
      audioKey,
      startTime: customAudioUrl ? audioStartTime : undefined,
      durationSeconds: customAudioUrl ? audioClipLength : undefined,
      durationDays: noteDurationDays || 1,
      createdAt: Date.now(),
    };

    setCurrentNote(newNote);
    Storage.setCurrentUser({ note: newNote });
    setShowNoteModal(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsNoteAudioPlaying(false);
  };

  const handleClearNote = () => {
    const cleanHandle = handle.replace(/^@/, "").toLowerCase() || "user";
    if (cleanHandle) {
      AudioStorage.deleteAudio(`note_audio_${cleanHandle}`).catch(() => {});
    }
    setCurrentNote(null);
    setNoteText("");
    setCustomAudioUrl(null);
    setCustomAudioName("");
    setAudioDuration(0);
    setAudioStartTime(0);
    Storage.setCurrentUser({ note: undefined });
    setShowNoteModal(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsNoteAudioPlaying(false);
  };

  const togglePlayNoteSound = async () => {
    const cleanHandle = handle.replace(/^@/, "").toLowerCase() || "user";
    let audioUrl = currentNote?.audioDataUrl;
    if (!audioUrl || audioUrl === "[INDEXED_DB]") {
      audioUrl = (await AudioStorage.resolveNoteAudio(currentNote || undefined, cleanHandle)) || undefined;
    }
    if (!audioUrl) return;

    if (!audioPlayerRef.current || audioPlayerRef.current.src !== audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsNoteAudioPlaying(false);
    }

    if (audioPlayerRef.current) {
      if (isNoteAudioPlaying) {
        audioPlayerRef.current.pause();
        setIsNoteAudioPlaying(false);
      } else {
        if (currentNote?.startTime !== undefined) {
          audioPlayerRef.current.currentTime = currentNote.startTime;
        }
        audioPlayerRef.current.play().catch(e => console.warn(e));
        setIsNoteAudioPlaying(true);

        // Auto stop after clip length if set
        if (currentNote?.durationSeconds) {
          const stopAfterMs = currentNote.durationSeconds * 1000;
          setTimeout(() => {
            if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
              audioPlayerRef.current.pause();
              setIsNoteAudioPlaying(false);
            }
          }, stopAfterMs);
        }
      }
    }
  };

  const toggleModalAudioPreview = () => {
    if (!customAudioUrl) return;
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(customAudioUrl);
      audioPlayerRef.current.onended = () => setIsNoteAudioPlaying(false);
    } else {
      audioPlayerRef.current.src = customAudioUrl;
    }

    if (isNoteAudioPlaying) {
      audioPlayerRef.current.pause();
      setIsNoteAudioPlaying(false);
    } else {
      audioPlayerRef.current.currentTime = audioStartTime;
      audioPlayerRef.current.play().catch(e => console.warn(e));
      setIsNoteAudioPlaying(true);

      // Auto stop after preview clip duration
      setTimeout(() => {
        if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
          audioPlayerRef.current.pause();
          setIsNoteAudioPlaying(false);
        }
      }, audioClipLength * 1000);
    }
  };

  const borderColors = [
    { name: "Flyingo Pink", hex: "#ba0f44" },
    { name: "Cyan Pulse", hex: "#00daf3" },
    { name: "Royal Purple", hex: "#7d2dce" },
    { name: "Gold Crown", hex: "#eab308" },
    { name: "Obsidian", hex: "#283044" },
    { name: "Clean Minimal", hex: "#e2e7ff" },
  ];

  const quickEmojis = ["✨", "🔥", "🎧", "🌊", "☕", "🚀", "💫", "🖤", "😴", "⚡"];
  const pronounOptions = ["he / him", "she / her", "they / them", "custom"];
  const genderOptions = ["Male", "Female", "Custom", "Prefer not to say"];

  return (
    <div className="min-h-screen bg-surface flex text-on-surface">
      <Sidebar hideBottomNav={isEditing} />

      <div className="md:ml-[86px] ml-0 flex-1 relative flex flex-col items-center min-h-screen pb-32 md:pb-12 w-full">
        {/* Ambient background */}
        <div className="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        {/* Main Content Area: View Mode vs Edit Mode */}
        <div className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-8 h-full overflow-y-auto">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              /* ================= VIEW MODE ================= */
              <motion.div
                key="profile-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl mx-auto flex flex-col gap-6"
              >
                {/* Primary Identity Card */}
                <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-primary-container to-secondary" />
                  
                  <div className="flex items-center justify-between mb-5 pt-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center font-bold text-primary shadow-sm overflow-hidden p-1">
                        <img src="/logo.png" alt="Flyingo" className="w-full h-full object-cover rounded-xl" />
                      </div>
                      <div>
                        <span className="font-label-md uppercase tracking-wider font-bold block text-xs">Flyingo ID</span>
                        <span className="font-caption text-on-surface-variant text-[11px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Profile Active
                        </span>
                      </div>
                    </div>

                    {/* ✏️ PENCIL BUTTON TO OPEN EDIT MODE */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-user-gradient text-white font-label-md text-xs font-semibold shadow-md shadow-[#003973]/25 cursor-pointer hover:opacity-95 transition-all"
                      title="Edit Profile"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Edit Profile</span>
                    </motion.button>
                  </div>

              {/* Avatar with Cute Instagram Thought Bubble Note (Text + Emojis + Music) */}
              <div className="flex flex-col items-center text-center relative">
                
                {/* Floating Note Thought Bubble */}
                <AnimatePresence>
                  {currentNote && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      onClick={() => setShowNoteModal(true)}
                      className="mb-2 px-3.5 py-1.5 rounded-2xl bg-surface-container-lowest shadow-md border border-outline-variant/20 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform z-20 max-w-xs"
                    >
                      {currentNote.audioDataUrl && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); togglePlayNoteSound(); }}
                          className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center cursor-pointer shadow-xs flex-shrink-0"
                          title="Play / Pause Audio"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isNoteAudioPlaying ? "pause" : "play_arrow"}
                          </span>
                        </button>
                      )}

                      <div className="text-left leading-tight truncate">
                        {currentNote.text && (
                          <p className="font-label-md text-[11px] font-bold text-on-surface truncate">
                            {currentNote.text}
                          </p>
                        )}
                        {currentNote.songTitle && (
                          <p className="font-caption text-[9px] text-secondary flex items-center gap-1 truncate">
                            <span className="material-symbols-outlined text-[11px]">music_note</span>
                            {currentNote.songTitle}
                          </p>
                        )}
                        <span className="text-[8px] font-semibold text-on-surface-variant/70 block">
                          {currentNote.durationDays}d note
                        </span>
                      </div>

                      {isNoteAudioPlaying && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <span className="w-0.5 h-3 bg-secondary rounded-full animate-bounce" />
                          <span className="w-0.5 h-4 bg-primary rounded-full animate-bounce delay-75" />
                          <span className="w-0.5 h-2 bg-tertiary rounded-full animate-bounce delay-150" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Avatar with click-to-edit */}
                <div 
                  className="relative mb-4 group cursor-pointer" 
                  onClick={() => setIsEditing(true)}
                  title="Click to edit profile"
                >
                  <div 
                    className="relative w-28 h-28 rounded-full overflow-hidden p-1 shadow-md transition-all group-hover:scale-105"
                    style={{ border: `3px solid ${borderColor}` }}
                  >
                    <img
                      src={avatar || "/default-avatar.jpg"}
                      alt={displayName || "Profile"}
                      className="w-full h-full object-cover rounded-full"
                    />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 rounded-full flex flex-col items-center justify-center text-white transition-opacity">
                      <span className="material-symbols-outlined text-[24px]">edit</span>
                      <span className="text-[10px] font-semibold">Edit</span>
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-2 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-tertiary border-2 border-surface-container-lowest shadow-sm" />
                  </span>
                </div>

                {/* Display Name, Pronouns & Verified Badge */}
                <div className="flex items-center justify-center gap-1.5 mb-0.5 flex-wrap">
                  <h1 className="font-headline-md font-bold tracking-tight">
                    {displayName || (handle ? `@${handle}` : "Your Name")}
                  </h1>
                  {pronouns && (
                    <span className="text-caption font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full text-[11px]">
                      {pronouns}
                    </span>
                  )}
                  {verifiedBadge?.enabled && (
                    <VerifiedBadge
                      icon={verifiedBadge.icon}
                      color={verifiedBadge.color}
                      size={26}
                      title={verifiedBadge.label || "Verified Account"}
                    />
                  )}
                </div>
                
                <p className="font-body-sm text-primary font-semibold tracking-wide mb-3 font-mono">
                  @{handle || "handle"}
                </p>

                {/* Real Friends & Flamingoos Stats Bar */}
                <div className="grid grid-cols-2 gap-3 w-full p-3 bg-surface-container-low rounded-2xl mb-4">
                  <div 
                    onClick={() => setShowFriendsModal(true)}
                    className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="font-headline-sm text-primary font-bold">
                      {customFriendsCount || 0}
                    </span>
                    <span className="font-caption text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span> Friends
                    </span>
                  </div>
                  <div 
                    onClick={() => router.push("/flamingoos")}
                    className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="font-headline-sm text-secondary font-bold">{userStoriesCount}</span>
                    <span className="font-caption text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">auto_stories</span> Flamingoos
                    </span>
                  </div>
                </div>

                {/* Add/Edit Note button if no note exists */}
                {!currentNote && (
                  <button 
                    onClick={() => setShowNoteModal(true)}
                    className="cursor-pointer mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container/70 hover:bg-surface-container text-on-surface-variant text-[11px] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Leave a Note (Text, Emoji, Music)</span>
                  </button>
                )}

                {/* Bio Narrative */}
                <div className="w-full text-left bg-surface-container-lowest p-4 rounded-2xl border border-surface-container mt-1">
                  <p className="font-body-md leading-relaxed mb-3 break-words text-on-surface">
                    {bio ? (
                      bio
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-primary hover:underline font-semibold text-[13px] flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_circle</span>
                        add bio +
                      </button>
                    )}
                  </p>
                  
                  {/* Multiple Links Display */}
                  {links.length > 0 ? (
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container-low">
                      {links.map(l => (
                        <a 
                          key={l.id}
                          className="inline-flex items-center gap-2 font-body-sm text-primary hover:underline font-medium truncate py-0.5" 
                          href={l.url.startsWith("http") ? l.url : `https://${l.url}`} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          <span className="material-symbols-outlined text-[15px]">link</span>
                          <span className="font-bold text-[12px]">{l.title || "Link"}:</span>
                          <span className="truncate">{l.url}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-surface-container-low">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-primary hover:underline font-semibold text-[13px] flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add_link</span>
                        add link +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-container-lowest rounded-3xl p-4 shadow-sm flex flex-col gap-2">
              <motion.button 
                whileHover={{ scale: 1.09 }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowNoteModal(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high font-title-md font-medium transition-all cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">queue_music</span>
                  {currentNote ? "Update Note" : "Share a Note"}
                </span>
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.09 }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/flamingoos")}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-surface-container font-title-md font-medium transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[20px] group-hover:scale-110 transition-transform">auto_stories</span>
                  My Flamingoos
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-caption font-bold">
                  {userStoriesCount}
                </span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.09 }} 
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  Storage.logoutUser();
                  router.push("/");
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#003973]/10 hover:bg-[#003973]/20 text-[#003973] font-title-md font-medium transition-all group cursor-pointer mt-1"
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#003973] text-[20px] group-hover:translate-x-0.5 transition-transform">logout</span>
                  Log Out
                </span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </motion.button>
            </div>
            
          </motion.div>
        ) : (
          /* ================= EDIT MODE: STREAMLINED MOBILE-FIRST ================= */
          <motion.div
            key="profile-edit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl mx-auto flex flex-col gap-4 sm:gap-6 pb-20"
          >
            {/* Native-style Top Sticky Navigation Bar */}
            <div className="sticky top-0 z-30 flex items-center justify-between bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl p-3 sm:p-4 shadow-sm border border-outline-variant/10">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant font-label-md text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Cancel</span>
              </button>
              
              <div className="text-center">
                <h2 className="font-headline-sm font-bold text-on-surface text-sm sm:text-base">Edit Profile</h2>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={handleSaveProfile}
                className="px-4 sm:px-5 py-1.5 rounded-xl bg-user-gradient text-white font-label-md text-xs sm:text-sm font-bold shadow-md shadow-[#003973]/20 hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Done</span>
              </motion.button>
            </div>

            {profileSavedToast && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-3 rounded-2xl bg-green-500/10 text-green-700 dark:text-green-300 font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 border border-green-500/20 text-center"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Profile changes successfully saved!
              </motion.div>
            )}

            {/* 1. Hero Photo & Ring Customizer */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex flex-col items-center text-center">
              <div className="relative mb-3 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 shadow-md transition-transform hover:scale-105"
                  style={{ border: `3.5px solid ${borderColor}` }}
                >
                  <img
                    src={avatar || "/default-avatar.jpg"}
                    alt="avatar preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                    <span className="text-[10px] font-bold">Edit</span>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-user-gradient text-white shadow-md flex items-center justify-center pointer-events-none">
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                </div>
              </div>

              {/* Photo Actions */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-label-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">crop</span>
                  Change Photo
                </button>
                {avatar && avatar !== "/default-avatar.jpg" && (
                  <button
                    type="button"
                    onClick={() => setAvatar("/default-avatar.jpg")}
                    className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-caption text-xs cursor-pointer transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />

              {/* Ring Accent Color Palette */}
              <div className="w-full pt-4 border-t border-outline-variant/10 flex flex-col items-center gap-2">
                <span className="font-caption text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Avatar Ring Accent
                </span>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
                  {borderColors.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setBorderColor(c.hex)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                        borderColor === c.hex ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-sm" : "hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {borderColor === c.hex && (
                        <span className="material-symbols-outlined text-white text-[14px]">check</span>
                      )}
                    </button>
                  ))}
                  {/* Custom color picker */}
                  <label 
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full cursor-pointer flex items-center justify-center border-2 border-dashed border-outline hover:scale-105 transition-transform relative overflow-hidden ${
                      !borderColors.some(c => c.hex === borderColor) ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    title="Custom Color"
                    style={{ backgroundColor: !borderColors.some(c => c.hex === borderColor) ? borderColor : "transparent" }}
                  >
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">palette</span>
                    <input
                      type="color"
                      value={borderColor}
                      onChange={e => setBorderColor(e.target.value)}
                      className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Public Profile Information */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-4">
              <div className="border-b border-outline-variant/10 pb-2">
                <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">Identity Details</h3>
              </div>

              {/* Display Name */}
              <div className="flex flex-col gap-1">
                <label className="font-caption text-xs font-semibold text-on-surface-variant">Display Name</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-2xl font-body-md outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface"
                />
              </div>

              {/* Username Handle */}
              <div className="flex flex-col gap-1">
                <label className="font-caption text-xs font-semibold text-on-surface-variant">Username Handle</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant font-semibold text-sm">@</span>
                  <input 
                    type="text" 
                    value={handle} 
                    onChange={e => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                    placeholder="username"
                    className="w-full bg-surface-container-low pl-8 pr-4 py-2.5 rounded-2xl font-body-md outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono text-on-surface"
                  />
                </div>
              </div>

              {/* Bio Narrative */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="font-caption text-xs font-semibold text-on-surface-variant">Bio</label>
                  <span className={`font-caption text-[11px] ${bio.length > 160 ? "text-error font-bold" : "text-on-surface-variant/70"}`}>
                    {bio.length} / 160
                  </span>
                </div>
                <textarea 
                  ref={bioInputRef}
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  rows={3}
                  maxLength={160}
                  placeholder="Tell your friends about yourself..."
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-2xl font-body-md outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none text-on-surface"
                />
              </div>
            </div>

            {/* 3. Custom Links */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                <div>
                  <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">Links & Socials</h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-3 py-1 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-label-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  Add Link
                </button>
              </div>

              {links.length === 0 ? (
                <p className="font-caption text-on-surface-variant/70 italic text-xs py-2 text-center">
                  No links added yet. Tap &apos;Add Link&apos; to add website, Instagram, YouTube, etc.
                </p>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  {links.map((l) => (
                    <div key={l.id} className="p-2.5 rounded-2xl bg-surface-container-low flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-outline-variant/10">
                      <input
                        type="text"
                        value={l.title}
                        onChange={e => handleUpdateLink(l.id, "title", e.target.value)}
                        placeholder="Label (e.g. Website)"
                        className="w-full sm:w-1/3 bg-surface-container-lowest px-3 py-2 rounded-xl font-body-sm outline-none focus:ring-2 focus:ring-primary/20 text-xs text-on-surface"
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="text"
                          value={l.url}
                          onChange={e => handleUpdateLink(l.id, "url", e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 min-w-0 bg-surface-container-lowest px-3 py-2 rounded-xl font-body-sm outline-none focus:ring-2 focus:ring-primary/20 text-xs text-on-surface"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(l.id)}
                          className="w-7 h-7 rounded-xl bg-error/10 hover:bg-error/20 text-error flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
                          title="Remove link"
                        >
                          <span className="material-symbols-outlined text-[15px]">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Personal Info (Pronouns & Gender) */}
            <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-sm border border-outline-variant/10 flex flex-col gap-4">
              <div className="border-b border-outline-variant/10 pb-2">
                <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">Personal Info</h3>
              </div>

              {/* Pronouns */}
              <div className="flex flex-col gap-1.5">
                <label className="font-caption text-xs font-semibold text-on-surface-variant">Pronouns</label>
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  {pronounOptions.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPronouns(pronouns === p ? "" : p)}
                      className={`px-3 py-1 rounded-full font-caption text-[11px] transition-all cursor-pointer ${
                        pronouns === p ? "bg-primary text-white font-semibold shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={pronouns} 
                  onChange={e => setPronouns(e.target.value)}
                  placeholder="e.g. he / him, they / them"
                  maxLength={30}
                  className="w-full bg-surface-container-low px-4 py-2 rounded-2xl font-body-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-xs text-on-surface"
                />
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <label className="font-caption text-xs font-semibold text-on-surface-variant">Gender</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {genderOptions.map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(gender === g ? "" : g)}
                      className={`py-2 px-3 rounded-2xl border font-caption text-xs font-medium transition-all cursor-pointer text-center ${
                        gender === g 
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs" 
                          : "border-surface-container bg-surface-container-low hover:bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-sm cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveProfile}
                className="px-6 py-2.5 rounded-2xl bg-user-gradient text-white font-label-md text-sm font-semibold shadow-md shadow-[#003973]/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Changes
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>

      {/* ── DP CROP & MOVE / AREA SELECTION MODAL ── */}
      <AnimatePresence>
        {showCropModal && rawImageSrc && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">crop</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">Move and Scale Profile Picture</h3>
                </div>
                <button onClick={() => { setShowCropModal(false); setRawImageSrc(null); }} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="font-caption text-on-surface-variant text-center">
                Drag to move the image inside the circle. Use the slider to zoom in or out.
              </p>

              {/* Crop Box with Circular Viewport Mask */}
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative w-64 h-64 mx-auto rounded-full overflow-hidden bg-black/90 cursor-move border-4 border-primary shadow-2xl select-none"
              >
                <img
                  src={rawImageSrc}
                  alt="to crop"
                  draggable={false}
                  className="absolute pointer-events-none transition-transform"
                  style={{
                    transform: `translate(${cropPan.x}px, ${cropPan.y}px) scale(${cropZoom})`,
                    transformOrigin: "center center",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    top: "20%",
                    left: "20%",
                  }}
                />
                <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-full" />
              </div>

              {/* Zoom Controls */}
              <div className="flex flex-col gap-1.5 px-4">
                <div className="flex justify-between text-caption text-on-surface-variant">
                  <span>Zoom Out</span>
                  <span>{Math.round(cropZoom * 100)}%</span>
                  <span>Zoom In</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">zoom_out</span>
                  <input
                    type="range"
                    min="0.8"
                    max="3"
                    step="0.05"
                    value={cropZoom}
                    onChange={e => setCropZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">zoom_in</span>
                </div>
              </div>

              {/* Reset Center button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => { setCropPan({ x: 0, y: 0 }); setCropZoom(1); }}
                  className="text-caption text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                  Reset Position & Zoom
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => { setShowCropModal(false); setRawImageSrc(null); }}
                  className="py-2.5 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="py-2.5 rounded-2xl bg-primary hover:bg-primary-container text-white font-label-md shadow-md shadow-primary/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Apply & Set DP
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IN-DEPTH INSTAGRAM NOTE MODAL (TEXT + EMOJIS + USER'S OWN MUSIC + DAYS DURATION) ── */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowNoteModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 15 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">queue_music</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">Share a Note</h3>
                </div>
                <button onClick={() => setShowNoteModal(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <p className="font-caption text-on-surface-variant text-[12px]">
                Add your thought, emojis, and upload your own favorite music from your files/downloads!
              </p>

              {/* Text & Thought Input */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md font-semibold text-on-surface">Your Thought / Status</label>
                <input
                  type="text"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Share a thought (e.g. Vibes on repeat...)"
                  maxLength={60}
                  className="w-full px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface font-body-md outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Quick Emojis row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-caption text-on-surface-variant text-[11px] mr-1">Emojis:</span>
                {quickEmojis.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNoteText(prev => (prev + " " + em).trim().slice(0, 60))}
                    className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-sm cursor-pointer transition-transform hover:scale-110"
                  >
                    {em}
                  </button>
                ))}
              </div>

              {/* User Custom Audio Upload from Downloads/Files */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">music_note</span>
                    <span className="font-label-md font-semibold text-on-surface">Attach Music / Audio</span>
                  </div>
                  {customAudioUrl && (
                    <button
                      type="button"
                      onClick={() => { setCustomAudioUrl(null); setCustomAudioName(""); }}
                      className="text-caption text-error hover:underline text-[11px] cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />

                {customAudioUrl ? (
                  <div className="flex flex-col gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/15">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={toggleModalAudioPreview}
                          className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center cursor-pointer shadow-xs flex-shrink-0"
                          title="Preview Selected Audio Part"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isNoteAudioPlaying ? "pause" : "play_arrow"}
                          </span>
                        </button>
                        <div className="min-w-0">
                          <p className="font-title-md font-bold text-on-surface text-[12px] truncate">{customAudioName}</p>
                          <p className="font-caption text-secondary font-semibold text-[10px]">
                            Playing from {Math.floor(audioStartTime / 60)}:{String(audioStartTime % 60).padStart(2, "0")} ({audioClipLength}s clip)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-caption text-[11px] cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {/* Instagram-Style Audio Part / Segment Selector */}
                    <div className="p-3 rounded-xl bg-surface-container-low/70 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-caption text-[11px] font-semibold text-on-surface">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-secondary">tune</span>
                          Select Music Part / Segment
                        </span>
                        <span className="font-mono text-secondary">
                          {Math.floor(audioStartTime / 60)}:{String(audioStartTime % 60).padStart(2, "0")} - {Math.floor((audioStartTime + audioClipLength) / 60)}:{String((audioStartTime + audioClipLength) % 60).padStart(2, "0")}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, (audioDuration || 60) - audioClipLength)}
                        step="1"
                        value={audioStartTime}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setAudioStartTime(val);
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.currentTime = val;
                          }
                        }}
                        className="w-full accent-secondary cursor-pointer h-2 bg-surface-container rounded-lg"
                      />

                      <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70 font-mono">
                        <span>0:00 (Start)</span>
                        <div className="flex items-center gap-1.5">
                          <span>Clip:</span>
                          {[15, 30].map(len => (
                            <button
                              key={len}
                              type="button"
                              onClick={() => setAudioClipLength(len)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                audioClipLength === len
                                  ? "bg-secondary text-white"
                                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                              }`}
                            >
                              {len}s
                            </button>
                          ))}
                        </div>
                        <span>{Math.floor((audioDuration || 60) / 60)}:{String((audioDuration || 60) % 60).padStart(2, "0")} (End)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="py-3 px-4 rounded-2xl border border-dashed border-secondary/40 bg-secondary/5 hover:bg-secondary/10 text-secondary font-label-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">upload_file</span>
                    Upload Audio from Downloads / Files
                  </button>
                )}
              </div>

              {/* Note Duration Selector in DAYS: 1, 2, or 3 Days */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-label-md font-semibold text-on-surface">Duration</span>
                <div className="flex gap-2">
                  {[1, 2, 3].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNoteDurationDays(d)}
                      className={`px-3 py-1.5 rounded-full font-label-md text-[12px] cursor-pointer transition-all ${
                        noteDurationDays === d ? "bg-primary text-white font-bold shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {d} {d === 1 ? "Day" : "Days"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={handleClearNote}
                  className="py-2.5 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md cursor-pointer"
                >
                  Clear Note
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="py-2.5 rounded-2xl bg-user-gradient text-white font-label-md shadow-md shadow-[#003973]/20 cursor-pointer"
                >
                  Share Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FRIENDS LIST OVERVIEW MODAL ── */}
      <AnimatePresence>
        {showFriendsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowFriendsModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 15 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">group</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">Connections & Friends</h3>
                </div>
                <button onClick={() => setShowFriendsModal(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <p className="font-caption text-on-surface-variant font-medium">Total Network Friends</p>
                  <p className="font-display-lg font-bold text-primary">{customFriendsCount || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">verified_user</span>
                </div>
              </div>

              <p className="font-caption text-on-surface-variant text-[12px] leading-relaxed">
                Zero-knowledge encrypted friend network. Your connections can send end-to-end encrypted messages and view your ephemeral flamingoos updates.
              </p>

              <button
                type="button"
                onClick={() => { setShowFriendsModal(false); router.push("/chat"); }}
                className="w-full py-3 rounded-2xl bg-primary text-white font-title-md font-semibold shadow-xs cursor-pointer"
              >
                Open Chats & Connect
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
