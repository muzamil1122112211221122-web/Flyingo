"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Storage, UserProfile, UserNote, AudioStorage } from "@/lib/storage";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function NotesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: "u_default",
    handle: "guest",
    name: "Guest",
    createdAt: Date.now(),
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [currentNote, setCurrentNote] = useState<UserNote | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string>("");
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioStartTime, setAudioStartTime] = useState<number>(0);
  const [audioClipLength, setAudioClipLength] = useState<number>(30);
  const [noteDurationDays, setNoteDurationDays] = useState<number>(1);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [playingHandle, setPlayingHandle] = useState<string | null>(null);
  const [isModalPreviewPlaying, setIsModalPreviewPlaying] = useState(false);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    const loadNotes = async () => {
      // First fetch latest remote users and their notes from cloud
      await Storage.fetchRemoteUsers();
      if (!isMounted) return;

      const user = Storage.getCurrentUser();
      setCurrentUser(user);

      if (user.note) {
        let noteAudio = user.note.audioDataUrl;
        if (!noteAudio || noteAudio === "[INDEXED_DB]" || noteAudio.startsWith("indexeddb:")) {
          const resolved = await AudioStorage.resolveNoteAudio(user.note, user.handle);
          if (resolved) {
            noteAudio = resolved;
            user.note.audioDataUrl = resolved;
          }
        }
        if (!isMounted) return;
        setCurrentNote({ ...user.note, audioDataUrl: noteAudio });
        setNoteText(user.note.text || "");
        setCustomAudioUrl(noteAudio || null);
        setCustomAudioName(user.note.songTitle || "");
        setAudioStartTime(user.note.startTime || 0);
        setAudioClipLength(user.note.durationSeconds || 30);
        setNoteDurationDays(user.note.durationDays || 1);
      }

      const users = Storage.getAllUsers().filter(
        u => u.handle.toLowerCase() !== user.handle.toLowerCase()
      );
      for (const u of users) {
        if (u.note && (!u.note.audioDataUrl || u.note.audioDataUrl === "[INDEXED_DB]")) {
          const resolved = await AudioStorage.resolveNoteAudio(u.note, u.handle);
          if (resolved) {
            u.note.audioDataUrl = resolved;
          }
        }
      }
      if (!isMounted) return;
      setAllUsers([...users]);
    };

    loadNotes();

    return () => {
      isMounted = false;
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const togglePlayAudio = async (note: UserNote, ownerHandle?: string) => {
    const handleKey = ownerHandle || "me";

    if (playingHandle === handleKey) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingHandle(null);
      setPlayingAudioUrl(null);
      return;
    }

    let audioUrl = note.audioDataUrl;
    if (!audioUrl || audioUrl === "[INDEXED_DB]") {
      audioUrl = (await AudioStorage.resolveNoteAudio(note, ownerHandle || currentUser.handle)) || undefined;
    }
    if (!audioUrl) return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    audio.currentTime = note.startTime || 0;
    audio.play().catch(() => {});
    setPlayingHandle(handleKey);
    setPlayingAudioUrl(audioUrl);

    audio.onended = () => {
      setPlayingHandle(null);
      setPlayingAudioUrl(null);
    };

    const clipLen = (note.durationSeconds || 30) * 1000;
    setTimeout(() => {
      if (audioPlayerRef.current === audio) {
        audio.pause();
        setPlayingHandle(null);
        setPlayingAudioUrl(null);
      }
    }, clipLen);
  };

  const toggleModalAudioPreview = () => {
    if (!customAudioUrl) return;

    if (isModalPreviewPlaying) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setIsModalPreviewPlaying(false);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(customAudioUrl);
    audioPlayerRef.current = audio;
    audio.currentTime = audioStartTime || 0;
    audio.play().catch(() => {});
    setIsModalPreviewPlaying(true);

    audio.onended = () => {
      setIsModalPreviewPlaying(false);
    };

    const clipLen = (audioClipLength || 30) * 1000;
    setTimeout(() => {
      if (audioPlayerRef.current === audio) {
        audio.pause();
        setIsModalPreviewPlaying(false);
      }
    }, clipLen);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomAudioName(file.name.replace(/\.[^/.]+$/, ""));
      const reader = new FileReader();
      reader.onload = loadEvt => {
        if (loadEvt.target?.result) {
          const dataUrl = loadEvt.target.result as string;
          setCustomAudioUrl(dataUrl);
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

    const type = noteText.trim() && customAudioUrl ? "both" : customAudioUrl ? "music" : "text";
    const audioKey = customAudioUrl ? `note_audio_${currentUser.handle.toLowerCase()}` : undefined;

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
    setPlayingHandle(null);
    setPlayingAudioUrl(null);
  };

  const handleClearNote = () => {
    if (currentUser.handle) {
      AudioStorage.deleteAudio(`note_audio_${currentUser.handle.toLowerCase()}`).catch(() => {});
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
    setPlayingHandle(null);
    setPlayingAudioUrl(null);
  };

  const usersWithNotes = allUsers.filter(u => !!u.note);

  return (
    <div className="min-h-screen bg-surface flex text-on-surface overflow-x-hidden">
      <Sidebar />

      <div className="md:ml-[86px] ml-0 flex-1 flex flex-col min-h-screen pb-28 md:pb-8">

        {/* ---- STICKY HEADER ---- */}
        <div className="sticky top-0 z-20 bg-surface/85 backdrop-blur-xl border-b border-surface-container px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-primary">sticky_note_2</span>
            <h1 className="font-headline-sm font-bold tracking-tight">Notes</h1>
            {usersWithNotes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                {usersWithNotes.length}
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNoteModal(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-label-md font-semibold flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer text-[13px]"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            {currentNote ? "Edit Note" : "Share Note"}
          </motion.button>
        </div>

        <div className="flex flex-col max-w-2xl mx-auto w-full px-4 md:px-6 pt-6 gap-6">

          {/* ---- YOUR NOTE ---- */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative">
            {/* floating note bubble above avatar */}
            {currentNote && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute -top-9 left-[68px] z-10"
              >
                <div className="relative bg-surface-container-highest text-on-surface rounded-2xl rounded-bl-none px-3 py-2 shadow-md border border-outline-variant/20 max-w-[220px]">
                  {currentNote.text && (
                    <p className="font-label-md text-[12px] font-semibold text-on-surface leading-snug line-clamp-2">{currentNote.text}</p>
                  )}
                  {currentNote.songTitle && (
                    <p className="font-caption text-[11px] text-secondary flex items-center gap-0.5 mt-0.5">
                      <span className="material-symbols-outlined text-[11px]">music_note</span>
                      {currentNote.songTitle}
                    </p>
                  )}
                  <span className="absolute -bottom-2 left-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-surface-container-highest" />
                </div>
              </motion.div>
            )}

            <div className="flex items-center gap-4 pt-10">
              {/* Avatar */}
              <button onClick={() => setShowNoteModal(true)} className="relative flex-shrink-0 group outline-none">
                <div className={`w-[62px] h-[62px] rounded-full p-[2.5px] ${currentNote ? "bg-gradient-to-tr from-primary via-secondary to-tertiary" : "bg-surface-container-high"} group-hover:scale-105 transition-transform shadow-md`}>
                  <div className="w-full h-full rounded-full bg-surface p-[2px]">
                    <img src={currentUser.avatar || "/default-avatar.jpg"} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                </div>
                <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full ${currentNote ? "bg-primary" : "bg-surface-container-high border border-outline-variant/30"} text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-surface`}>
                  {currentNote ? (
                    <span className="material-symbols-outlined text-[13px] leading-none">check</span>
                  ) : (
                    "+"
                  )}
                </span>
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-title-md font-bold text-on-surface truncate text-[15px]">{currentUser.name || `@${currentUser.handle}`}</p>
                  {currentUser.verifiedBadge?.enabled && (
                    <VerifiedBadge icon={currentUser.verifiedBadge.icon || "verified"} color={currentUser.verifiedBadge.color || "#00daf3"} size={16} />
                  )}
                </div>
                <p className="font-caption text-primary font-mono text-[11px]">@{currentUser.handle}</p>

                {currentNote ? (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {(currentNote.audioDataUrl || currentNote.audioKey) && (
                      <button
                        type="button"
                        onClick={() => togglePlayAudio(currentNote, "me")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${playingHandle === "me" ? "bg-secondary text-white" : "bg-secondary/10 text-secondary"}`}
                      >
                        <span className="material-symbols-outlined text-[13px]">{playingHandle === "me" ? "pause" : "play_arrow"}</span>
                        {playingHandle === "me" ? "Playing..." : "Play"}
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-caption text-[10px] font-bold">{currentNote.durationDays}d</span>
                    <button onClick={handleClearNote} className="text-error hover:underline font-caption text-[11px] cursor-pointer">Delete</button>
                  </div>
                ) : (
                  <button onClick={() => setShowNoteModal(true)} className="mt-1.5 text-[11px] text-on-surface-variant font-caption hover:text-primary cursor-pointer transition-colors">
                    Share what&apos;s on your mind...
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ---- DIVIDER ---- */}
          <div className="h-px bg-surface-container" />

          {/* ---- FRIENDS' NOTES ---- */}
          {usersWithNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">sticky_note_2</span>
              </div>
              <h3 className="font-title-md font-semibold text-on-surface">No Friends&apos; Notes Yet</h3>
              <p className="font-caption text-on-surface-variant mt-1 max-w-xs leading-relaxed text-[13px]">
                When friends share a thought or music snippet, it will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="font-caption text-[11px] text-on-surface-variant font-bold uppercase tracking-widest">Friends</p>

              {/* Horizontal bubble strip */}
              <div className="flex items-start gap-5 overflow-x-auto pb-2 scrollbar-none">
                {usersWithNotes.map(user => {
                  const note = user.note!;
                  const isPlaying = playingHandle === user.handle;
                  return (
                    <div key={user.handle} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      {/* Floating bubble */}
                      <div className="relative flex justify-center w-full mb-1">
                        <div className="relative bg-surface-container-highest text-on-surface rounded-2xl rounded-bl-none px-2.5 py-1.5 shadow-md border border-outline-variant/20 min-w-[90px] max-w-[140px]">
                          {note.text && <p className="font-label-md text-[11px] font-semibold text-on-surface leading-snug line-clamp-2">{note.text}</p>}
                          {note.songTitle && (
                            <p className="font-caption text-[10px] text-secondary flex items-center gap-0.5 mt-0.5 truncate">
                              <span className="material-symbols-outlined text-[10px]">music_note</span>
                              {note.songTitle}
                            </p>
                          )}
                          <span className="absolute -bottom-2 left-4 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-surface-container-highest" />
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="relative">
                        <button onClick={() => router.push(`/chat?user=${encodeURIComponent(user.handle)}`)} className="block group outline-none">
                          <div className="w-[58px] h-[58px] rounded-full p-[2px] bg-gradient-to-tr from-primary via-secondary to-tertiary group-hover:scale-105 transition-transform shadow-sm">
                            <div className="w-full h-full rounded-full bg-surface p-[2px]">
                              <img src={user.avatar || "/default-avatar.jpg"} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            </div>
                          </div>
                        </button>
                        {(note.audioDataUrl || note.audioKey) && (
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(note, user.handle)}
                            className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md ring-2 ring-surface cursor-pointer transition-colors ${isPlaying ? "bg-secondary" : "bg-primary"}`}
                          >
                            <span className="material-symbols-outlined text-[11px] text-white">{isPlaying ? "pause" : "play_arrow"}</span>
                          </button>
                        )}
                      </div>

                      <span className="font-caption text-[11px] text-on-surface text-center max-w-[70px] truncate leading-tight">
                        {user.name?.split(" ")[0] || user.handle}
                      </span>
                      <button
                        onClick={() => router.push(`/chat?user=${encodeURIComponent(user.handle)}`)}
                        className="text-primary text-[10px] font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        Reply<span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Detailed card list */}
              <div className="flex flex-col gap-3">
                {usersWithNotes.map(user => {
                  const note = user.note!;
                  const isPlaying = playingHandle === user.handle;
                  return (
                    <motion.div
                      key={`card-${user.handle}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 shadow-xs"
                    >
                      {/* Small avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-primary via-secondary to-tertiary shadow-sm">
                          <div className="w-full h-full rounded-full bg-surface p-[1px]">
                            <img src={user.avatar || "/default-avatar.jpg"} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-title-md text-[13px] font-bold text-on-surface truncate">{user.name}</p>
                          {user.verifiedBadge?.enabled && (
                            <VerifiedBadge icon={user.verifiedBadge.icon || "verified"} color={user.verifiedBadge.color || "#00daf3"} size={14} />
                          )}
                          <span className="font-caption text-[10px] text-on-surface-variant ml-auto flex-shrink-0">{note.durationDays}d</span>
                        </div>
                        <p className="font-caption text-primary font-mono text-[10px]">@{user.handle}</p>

                        {/* Note bubble */}
                        <div className="mt-2 p-2.5 rounded-xl bg-surface-container-highest border border-outline-variant/10 shadow-inner">
                          {note.text && (
                            <p className="font-body-sm text-[13px] text-on-surface font-semibold break-words">&ldquo;{note.text}&rdquo;</p>
                          )}
                          {(note.audioDataUrl || note.audioKey) && (
                            <div className={`flex items-center gap-2 ${note.text ? "mt-2 pt-2 border-t border-outline-variant/10" : ""}`}>
                              <button
                                type="button"
                                onClick={() => togglePlayAudio(note, user.handle)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shadow-xs flex-shrink-0 transition-colors ${isPlaying ? "bg-secondary" : "bg-primary"}`}
                              >
                                <span className="material-symbols-outlined text-[14px] text-white">{isPlaying ? "pause" : "play_arrow"}</span>
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="font-caption text-[11px] text-secondary font-bold truncate flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px]">music_note</span>
                                  <span>{note.songTitle || "Audio Snippet"}</span>
                                </p>
                                {isPlaying && (
                                  <div className="flex items-end gap-0.5 mt-0.5 h-3">
                                    {[1,2,3,4,5].map(i => (
                                      <motion.div key={i} className="w-0.5 bg-secondary rounded-full"
                                        animate={{ height: [3, 12, 3] }}
                                        transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                                      />
                                    ))}
                                    <span className="text-[10px] text-secondary ml-1">Playing</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reply button */}
                      <button
                        onClick={() => router.push(`/chat?user=${encodeURIComponent(user.handle)}`)}
                        className="flex-shrink-0 self-center w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[17px]">send</span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- MOBILE FAB ---- */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => setShowNoteModal(true)}
        className="sm:hidden fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-xl shadow-primary/30 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[24px]">edit_note</span>
      </motion.button>

      {/* ---- CREATE / EDIT NOTE MODAL (bottom sheet on mobile) ---- */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-end md:items-center justify-center md:p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowNoteModal(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="w-full md:max-w-md bg-surface-container-lowest md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 rounded-full bg-outline-variant/60" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">sticky_note_2</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">{currentNote ? "Update Note" : "Share a Note"}</h3>
                </div>
                <button onClick={() => setShowNoteModal(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

                {/* Live preview bubble */}
                {(noteText || customAudioName) && (
                  <div className="self-start relative ml-2 mb-1">
                    <div className="bg-surface-container-high rounded-2xl rounded-bl-none px-3 py-2 shadow-sm border border-outline-variant/20 max-w-[200px]">
                      {noteText && <p className="font-label-md text-[12px] font-semibold text-on-surface">{noteText}</p>}
                      {customAudioName && (
                        <p className="font-caption text-[10px] text-secondary flex items-center gap-0.5 mt-0.5">
                          <span className="material-symbols-outlined text-[10px]">music_note</span>
                          {customAudioName}
                        </p>
                      )}
                    </div>
                    <span className="absolute -bottom-2 left-3 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-surface-container-high" />
                  </div>
                )}

                {/* Text input */}
                <div className="flex flex-col gap-2">
                  <label className="font-caption text-[11px] font-bold text-on-surface uppercase tracking-wide">Your Thought</label>
                  <input
                    type="text"
                    maxLength={60}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="What's on your mind?..."
                    className="w-full px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface text-sm outline-none border border-outline-variant/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-wrap">
                      {["\u{1F525}", "\u{2764}\u{FE0F}", "\u{2728}", "\u{1F3B5}", "\u{1F3A7}", "\u{1F680}", "\u{1F634}", "\u{1F602}", "\u{2615}", "\u{1F30A}"].map(em => (
                        <button key={em} type="button" onClick={() => setNoteText(prev => (prev + " " + em).trim().slice(0, 60))}
                          className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-xs cursor-pointer transition-transform hover:scale-110">
                          {em}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-on-surface-variant flex-shrink-0">{noteText.length}/60</span>
                  </div>
                </div>

                {/* Audio section */}
                <div className="p-4 rounded-2xl bg-surface-container flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">music_note</span>
                      <span className="font-label-md text-on-surface font-bold text-[12px]">Add Song / Audio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {customAudioUrl && (
                        <button type="button" onClick={() => { audioPlayerRef.current?.pause(); setIsModalPreviewPlaying(false); setCustomAudioUrl(null); setCustomAudioName(""); }}
                          className="text-caption text-error hover:underline text-[11px] cursor-pointer">Remove</button>
                      )}
                      <button type="button" onClick={() => audioInputRef.current?.click()}
                        className="px-3 py-1 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary font-caption font-bold text-[11px] transition-colors cursor-pointer">
                        {customAudioUrl ? "Change" : "Upload"}
                      </button>
                    </div>
                  </div>

                  <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />

                  {customAudioUrl && (
                    <div className="flex flex-col gap-3 pt-2 border-t border-outline-variant/15">
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
                        <button type="button" onClick={toggleModalAudioPreview}
                          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-sm flex-shrink-0 transition-colors ${isModalPreviewPlaying ? "bg-primary text-white" : "bg-secondary text-white"}`}>
                          <span className="material-symbols-outlined text-[18px]">{isModalPreviewPlaying ? "stop" : "play_arrow"}</span>
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="font-caption text-secondary font-bold text-[12px] truncate flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">music_note</span>
                            <span>{customAudioName || "Custom Track"}</span>
                          </p>
                          {isModalPreviewPlaying ? (
                            <div className="flex items-end gap-0.5 mt-0.5 h-3">
                              {[1,2,3,4,5].map(i => (
                                <motion.div key={i} className="w-0.5 bg-secondary rounded-full"
                                  animate={{ height: [3, 10, 3] }}
                                  transition={{ duration: 0.5, delay: i * 0.09, repeat: Infinity }}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-on-surface-variant">Tap to preview</p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-caption font-semibold text-[10px]">{audioClipLength}s</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                          <span>Start: {audioStartTime}s</span>
                          <span>Clip: {audioClipLength}s</span>
                        </div>
                        <input type="range" min={0} max={Math.max(0, audioDuration - audioClipLength)} value={audioStartTime}
                          onChange={e => { const val = Number(e.target.value); setAudioStartTime(val); if (audioPlayerRef.current) audioPlayerRef.current.currentTime = val; }}
                          className="w-full accent-secondary cursor-pointer" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-2">
                  <label className="font-caption text-[11px] font-bold text-on-surface uppercase tracking-wide">Note Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(days => (
                      <button key={days} type="button" onClick={() => setNoteDurationDays(days)}
                        className={`py-2.5 rounded-xl font-label-md text-[12px] font-bold transition-all cursor-pointer ${noteDurationDays === days ? "bg-primary text-white shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                        {days} Day{days > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {currentNote && (
                    <button type="button" onClick={handleClearNote}
                      className="flex-1 py-3 rounded-2xl border border-error/30 text-error font-title-md font-bold text-[13px] hover:bg-error/5 transition-colors cursor-pointer">
                      Delete
                    </button>
                  )}
                  <button type="button" onClick={handleSaveNote}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-title-md font-bold text-[13px] shadow-md shadow-primary/20 cursor-pointer">
                    {currentNote ? "Update Note" : "Share Note"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
