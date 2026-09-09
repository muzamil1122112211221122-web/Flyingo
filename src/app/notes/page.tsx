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

      <div className="md:ml-[72px] ml-0 flex-1 flex flex-col p-4 md:p-6 lg:p-10 max-w-6xl mx-auto w-full pb-24 md:pb-8">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[30px] text-primary">sticky_note_2</span>
              <h1 className="font-display-lg font-bold tracking-tight">Notes</h1>
            </div>
            <p className="font-body-md text-on-surface-variant mt-1">
              Share a thought or music snippet with friends. Notes disappear after chosen duration.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNoteModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-title-md font-semibold flex items-center gap-2 shadow-lg shadow-primary/25 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {currentNote ? "Update Note" : "Share a Note"}
          </motion.button>
        </div>

        {/* Your Note Section */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest shadow-sm mb-8 border border-outline-variant/15">
          <h2 className="font-title-md font-bold text-on-surface mb-4 flex items-center gap-2">
            <span>Your Active Note</span>
          </h2>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative cursor-pointer flex-shrink-0" onClick={() => setShowNoteModal(true)}>
              <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary shadow-md flex items-center justify-center">
                <img
                  src={currentUser.avatar || "/default-avatar.jpg"}
                  alt={currentUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-surface-container-lowest">
                {currentNote ? "✓" : "+"}
              </span>
            </div>

            {/* Info + note bubble inline */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-title-md font-bold text-on-surface truncate">{currentUser.name || `@${currentUser.handle}`}</p>
                {currentUser.verifiedBadge?.enabled && (
                  <VerifiedBadge
                    icon={currentUser.verifiedBadge.icon || "verified"}
                    color={currentUser.verifiedBadge.color || "#00daf3"}
                    size={18}
                  />
                )}
              </div>
              <p className="font-caption text-primary font-mono text-[12px]">@{currentUser.handle}</p>

              {currentNote ? (
                <>
                  {/* Note content bubble — inline, no overflow */}
                  <div
                    className="mt-2 px-3 py-2 rounded-2xl bg-surface-container-high border border-outline-variant/20 shadow-sm flex items-center gap-2 w-full cursor-pointer"
                    onClick={() => setShowNoteModal(true)}
                  >
                    {(currentNote.audioDataUrl || currentNote.audioKey) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlayAudio(currentNote, "me");
                        }}
                        className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center cursor-pointer shadow-xs flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {playingHandle === "me" ? "pause" : "play_arrow"}
                        </span>
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      {currentNote.text && (
                        <p className="font-label-md text-[12px] font-bold truncate">{currentNote.text}</p>
                      )}
                      {currentNote.songTitle && (
                        <p className="font-caption text-[10px] text-secondary flex items-center gap-0.5 truncate">
                          <span className="material-symbols-outlined text-[11px]">music_note</span>
                          {currentNote.songTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-caption text-[11px] font-bold">
                      Active for {currentNote.durationDays} day(s)
                    </span>
                    <button
                      onClick={handleClearNote}
                      className="text-error hover:underline font-caption text-[11px] cursor-pointer"
                    >
                      Delete Note
                    </button>
                  </div>
                </>
              ) : (
                <p className="font-caption text-on-surface-variant text-[12px] mt-1">
                  You haven&apos;t shared a note yet. Tap your photo or &quot;Share a Note&quot; above.
                </p>
              )}
            </div>
          </div>
        </div>


        {/* Friends' Notes Feed */}
        <div className="p-6 rounded-3xl bg-surface-container-lowest shadow-sm border border-outline-variant/15 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-title-md font-bold text-on-surface flex items-center gap-2">
              <span>Friends&apos; Notes</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-caption text-[11px] font-bold">
                {usersWithNotes.length}
              </span>
            </h2>
          </div>

          {usersWithNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/40 mb-3">
                <span className="material-symbols-outlined text-[32px]">sticky_note_2</span>
              </div>
              <h3 className="font-title-md font-semibold text-on-surface">No Friends&apos; Notes Right Now</h3>
              <p className="font-caption text-on-surface-variant mt-1 max-w-sm leading-relaxed">
                When your friends share a thought or music snippet, they will appear right here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {usersWithNotes.map(user => {
                const note = user.note!;
                const isPlaying = playingHandle === user.handle;
                return (
                  <motion.div
                    key={user.handle}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-3 shadow-xs relative"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar || "/default-avatar.jpg"}
                        alt={user.name}
                        className="w-11 h-11 rounded-full object-cover border border-outline-variant/20 shadow-xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-title-md text-[13px] font-bold text-on-surface truncate">{user.name}</p>
                          {user.verifiedBadge?.enabled && (
                            <VerifiedBadge
                              icon={user.verifiedBadge.icon || "verified"}
                              color={user.verifiedBadge.color || "#00daf3"}
                              size={16}
                            />
                          )}
                        </div>
                        <p className="font-caption text-primary font-mono text-[11px]">@{user.handle}</p>
                      </div>
                    </div>

                    {/* Note Content Bubble */}
                    <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 shadow-inner flex flex-col gap-1.5">
                      {note.text && (
                        <p className="font-body-sm text-[13px] text-on-surface font-semibold break-words">
                          &ldquo;{note.text}&rdquo;
                        </p>
                      )}

                      {(note.audioDataUrl || note.audioKey) && (
                        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="material-symbols-outlined text-[15px] text-secondary">music_note</span>
                            <span className="font-caption text-[11px] text-secondary font-bold truncate">
                              {note.songTitle || "Audio Snippet"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(note, user.handle)}
                            className="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center cursor-pointer shadow-xs flex-shrink-0"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {isPlaying ? "pause" : "play_arrow"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-semibold px-1">
                      <span>{note.durationDays}d note</span>
                      <button
                        onClick={() => router.push(`/chat?user=${encodeURIComponent(user.handle)}`)}
                        className="text-primary hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>Reply</span>
                        <span className="material-symbols-outlined text-[12px]">send</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT NOTE MODAL ── */}
      <AnimatePresence>
        {showNoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={e => {
              if (e.target === e.currentTarget) setShowNoteModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">sticky_note_2</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">Share a Note</h3>
                </div>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Text Thought Input */}
              <div className="flex flex-col gap-1.5">
                <label className="font-caption text-[11px] font-bold text-on-surface uppercase tracking-wide">
                  Your Thought (up to 60 characters)
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="What's on your mind?..."
                  className="w-full px-4 py-3 rounded-2xl bg-surface-container-low text-on-surface text-sm outline-none border border-outline-variant/20 focus:border-primary"
                />
                <div className="flex items-center justify-between">
                  {/* Quick Emojis selector */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {["🔥", "❤️", "✨", "🎵", "🎧", "🚀", "😴", "😂", "☕", "🌊"].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNoteText(prev => (prev + " " + em).trim().slice(0, 60))}
                        className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-xs cursor-pointer transition-transform hover:scale-110"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-on-surface-variant text-right flex-shrink-0">{noteText.length}/60</span>
                </div>
              </div>

              {/* Audio Upload & Range Slider with Play/Stop Button */}
              <div className="p-4 rounded-2xl bg-surface-container flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">music_note</span>
                    <span className="font-label-md text-on-surface font-bold text-[12px]">Add Song / Audio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {customAudioUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          if (audioPlayerRef.current) audioPlayerRef.current.pause();
                          setIsModalPreviewPlaying(false);
                          setCustomAudioUrl(null);
                          setCustomAudioName("");
                        }}
                        className="text-caption text-error hover:underline text-[11px] cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="px-3 py-1 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary font-caption font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      {customAudioUrl ? "Change Audio" : "Upload Audio"}
                    </button>
                  </div>
                </div>

                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />

                {customAudioUrl && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-outline-variant/15">
                    {/* Audio track preview header with Play / Stop button */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={toggleModalAudioPreview}
                          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-sm flex-shrink-0 transition-colors ${
                            isModalPreviewPlaying ? "bg-primary text-white" : "bg-secondary text-white"
                          }`}
                          title={isModalPreviewPlaying ? "Stop Audio" : "Play Audio"}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isModalPreviewPlaying ? "stop" : "play_arrow"}
                          </span>
                        </button>
                        <div className="min-w-0">
                          <p className="font-caption text-secondary font-bold text-[12px] truncate">
                            🎵 {customAudioName || "Custom Track"}
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            {isModalPreviewPlaying ? "Playing preview..." : "Click play to preview audio"}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-caption font-semibold text-[10px]">
                        {audioClipLength}s clip
                      </span>
                    </div>

                    {/* Part selection slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                        <span>Start: {audioStartTime}s</span>
                        <span>Length: {audioClipLength}s</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, audioDuration - audioClipLength)}
                        value={audioStartTime}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setAudioStartTime(val);
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.currentTime = val;
                          }
                        }}
                        className="w-full accent-secondary cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Duration Days */}
              <div className="flex flex-col gap-1.5">
                <label className="font-caption text-[11px] font-bold text-on-surface uppercase tracking-wide">
                  Note Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setNoteDurationDays(days)}
                      className={`py-2 rounded-xl font-label-md text-[12px] font-bold transition-all cursor-pointer ${
                        noteDurationDays === days
                          ? "bg-primary text-white shadow-sm"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {days} Day{days > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {currentNote && (
                  <button
                    type="button"
                    onClick={handleClearNote}
                    className="flex-1 py-3 rounded-2xl border border-error/30 text-error font-title-md font-bold text-[13px] hover:bg-error/5 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-title-md font-bold text-[13px] shadow-md shadow-primary/20 cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

