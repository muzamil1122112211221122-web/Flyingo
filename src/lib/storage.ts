// Client-side storage and Supabase synchronization for Flyingo
import { supabase } from "./supabase";

export interface VerifiedBadge {
  enabled: boolean;
  color: string;
  icon: string;
  label?: string;
}

export interface UserLink {
  id: string;
  title: string;
  url: string;
}

export interface UserNote {
  type: "text" | "music" | "both";
  text?: string;
  songTitle?: string;
  artist?: string;
  audioDataUrl?: string; // Custom uploaded audio file
  audioKey?: string; // IndexedDB key for persistent audio storage
  startTime?: number; // Start offset in seconds (e.g. 15s)
  durationSeconds?: number; // Clip length in seconds (default 30s)
  durationDays: number; // 1, 2, or 3 days
  createdAt: number;
}

export interface UserProfile {
  id: string;
  handle: string;
  name: string;
  avatar?: string;
  bio?: string;
  link?: string;
  links?: UserLink[]; // Multiple custom links support
  gender?: string;
  pronouns?: string;
  activeNote?: string;
  note?: UserNote;
  pin?: string;
  password?: string;
  verifiedBadge?: VerifiedBadge;
  customFriendsCount?: string; // e.g. "1M", "500k", etc.
  createdAt: number;
}

export interface ProfileVisit {
  id: string;
  visitedHandle: string;
  visitorHandle: string;
  visitorName: string;
  timestamp: number;
}

export interface FriendRequest {
  id: string;
  fromHandle: string;
  fromName: string;
  fromAvatar?: string;
  toHandle: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
}

export interface FlamingooStory {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  type: "text" | "image" | "video";
  content?: string;
  mediaUrl?: string;
  background: string;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textPosition?: "top" | "center" | "bottom";
  textYOffset?: number; // draggable vertical position
  textXOffset?: number; // draggable horizontal position
  timestamp: string;
  createdTime: number;
  durationSeconds: number;
  likes: number;
  hasLiked?: boolean;
  viewers: string[];
}

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  members: string[]; // array of user handles
  createdAt: number;
}

export interface PanicModeConfig {
  id: string;
  name: string;
  myAccountName: string;
  myAccountHandle: string;
  receiverName: string;
  receiverHandle: string;
  messages: Array<{
    sender: "me" | "them";
    text: string;
    time: string;
  }>;
}

export interface ChatCustomization {
  sentTheme: string;
  receivedTheme: string;
  wallpaper: string;
  fontSize: number;
  sentOpacity: number;
  themeMode?: "light" | "dark";
}

export interface MessageReaction {
  emoji: string;
  users: string[];
}

export interface SavedMessage {
  id: string;
  sender: "me" | "them";
  senderHandle?: string; // actual handle who sent the message (for per-account correct display)
  text: string;
  time: string;
  delivered?: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "gif" | "file" | "audio" | "call";
  fileName?: string;
  fileSize?: string;
  audioDuration?: number; // duration in seconds
  callInfo?: {
    type: "voice" | "video";
    duration?: number; // in seconds
    status: "missed" | "ended" | "declined";
  };
  replyTo?: {
    id: string;
    text: string;
    senderHandle?: string;
    mediaType?: string;
  };
  reactions?: MessageReaction[];
  isPinned?: boolean;
}

export interface CallSession {
  callId: string;
  callerHandle: string;
  callerName: string;
  callerAvatar: string;
  recipientHandle: string;
  type: "voice" | "video";
  status: "ringing" | "accepted" | "declined" | "ended";
  startedAt?: number;
  endedAt?: number;
}

export interface SavedConversation {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: SavedMessage[];
  isGroup?: boolean;
  members?: string[];
}

const MOCK_HANDLES = ["zephyr_code", "elena_motion", "kaelen_audio", "nova_sync"];

export const AudioStorage = {
  dbPromise: null as Promise<IDBDatabase> | null,

  getDB: (): Promise<IDBDatabase> => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return Promise.reject("IndexedDB not supported or window undefined");
    }
    if (AudioStorage.dbPromise) return AudioStorage.dbPromise;

    AudioStorage.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open("flyingo_audio_db", 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("audio_files")) {
            db.createObjectStore("audio_files");
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
    return AudioStorage.dbPromise;
  },

  saveAudio: async (key: string, dataUrl: string): Promise<void> => {
    try {
      const db = await AudioStorage.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("audio_files", "readwrite");
        const store = tx.objectStore("audio_files");
        const req = store.put(dataUrl, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn("Failed to save audio in IndexedDB:", err);
    }
  },

  getAudio: async (key: string): Promise<string | null> => {
    try {
      const db = await AudioStorage.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("audio_files", "readonly");
        const store = tx.objectStore("audio_files");
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn("Failed to read audio from IndexedDB:", err);
      return null;
    }
  },

  deleteAudio: async (key: string): Promise<void> => {
    try {
      const db = await AudioStorage.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("audio_files", "readwrite");
        const store = tx.objectStore("audio_files");
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {}
  },

  resolveNoteAudio: async (note?: UserNote, handle?: string): Promise<string | null> => {
    if (!note) return null;
    if (note.audioDataUrl && note.audioDataUrl !== "[INDEXED_DB]" && !note.audioDataUrl.startsWith("indexeddb:")) {
      return note.audioDataUrl;
    }
    const key = note.audioKey || (handle ? `note_audio_${handle.toLowerCase()}` : undefined);
    if (!key) return null;
    return await AudioStorage.getAudio(key);
  }
};

export function sanitizeUserForStorage(user: UserProfile): UserProfile {
  if (!user.note) return user;
  if (user.note.audioDataUrl && (user.note.audioDataUrl.length > 300 || user.note.audioDataUrl.startsWith("data:audio"))) {
    return {
      ...user,
      note: {
        ...user.note,
        audioKey: user.note.audioKey || `note_audio_${user.handle.toLowerCase()}`,
        audioDataUrl: "[INDEXED_DB]",
      },
    };
  }
  return user;
}

export const Storage = {
  getRealCurrentUser: (): UserProfile => {
    if (typeof window === "undefined") {
      return { id: "u_default", handle: "", name: "", createdAt: Date.now(), avatar: "/default-avatar.jpg", links: [] };
    }
    // sessionStorage is per-tab: each tab has its own independent login session
    const saved = sessionStorage.getItem("flyingo_current_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.avatar) parsed.avatar = "/default-avatar.jpg";
        if (!parsed.links) parsed.links = [];
        return parsed;
      } catch (e) {}
    }
    return {
      id: "u_guest",
      handle: "guest",
      name: "Guest User",
      avatar: "/default-avatar.jpg",
      bio: "",
      link: "",
      links: [],
      gender: "",
      pronouns: "",
      createdAt: Date.now(),
    };
  },

  getCurrentUser: (): UserProfile => {
    // If panic mode is active, display decoy identity on screen
    if (typeof window !== "undefined") {
      const activePanic = Storage.getActivePanicMode();
      if (activePanic) {
        return {
          id: `u_${activePanic.myAccountHandle}`,
          handle: activePanic.myAccountHandle,
          name: activePanic.myAccountName,
          avatar: "/default-avatar.jpg",
          createdAt: Date.now(),
        };
      }
    }

    const realUser = Storage.getRealCurrentUser();
    // Check if note has expired based on durationDays
    if (realUser?.note && realUser.note.createdAt && realUser.note.durationDays) {
      const expiryTime = realUser.note.createdAt + (realUser.note.durationDays * 24 * 60 * 60 * 1000);
      if (Date.now() > expiryTime) {
        realUser.note = undefined;
        Storage.setCurrentUser({ note: undefined });
      }
    }
    return realUser;
  },

  setCurrentUser: (user: Partial<UserProfile>) => {
    if (typeof window === "undefined") return;
    const current = Storage.getRealCurrentUser();
    // If logging in or switching to a different handle, do NOT blend old user data
    let updated: UserProfile;
    if (user.handle && current.handle && user.handle.toLowerCase() !== current.handle.toLowerCase()) {
      // Different account: load full stored profile, never blend previous session data
      const existing = Storage.getUserByHandle(user.handle);
      updated = {
        id: existing?.id || user.id || `u_${user.handle.toLowerCase()}`,
        handle: user.handle.toLowerCase(),
        name: existing?.name || user.name || user.handle,
        avatar: existing?.avatar || user.avatar || "/default-avatar.jpg",
        bio: existing?.bio !== undefined ? existing.bio : (user.bio ?? ""),
        link: existing?.link !== undefined ? existing.link : (user.link ?? ""),
        links: existing?.links !== undefined ? existing.links : (user.links ?? []),
        gender: existing?.gender !== undefined ? existing.gender : (user.gender ?? ""),
        pronouns: existing?.pronouns !== undefined ? existing.pronouns : (user.pronouns ?? ""),
        note: existing?.note,
        verifiedBadge: existing?.verifiedBadge,
        customFriendsCount: existing?.customFriendsCount,
        pin: user.pin || existing?.pin,
        password: user.password || existing?.password,
        createdAt: existing?.createdAt || user.createdAt || Date.now(),
      };
    } else {
      updated = { ...current, ...user };
    }

    // Save custom audio to IndexedDB if present
    const targetHandle = (user.handle || current.handle || "user").toLowerCase();
    if (updated.note?.audioDataUrl && updated.note.audioDataUrl.startsWith("data:audio")) {
      const audioKey = updated.note.audioKey || `note_audio_${targetHandle}`;
      updated.note.audioKey = audioKey;
      AudioStorage.saveAudio(audioKey, updated.note.audioDataUrl).catch(() => {});
    }

    // Write to sessionStorage (per-tab session) — safely sanitized against quota limits
    try {
      sessionStorage.setItem("flyingo_current_user", JSON.stringify(sanitizeUserForStorage(updated)));
    } catch (e) {
      console.warn("sessionStorage quota issue:", e);
    }
    Storage.registerUser(updated);
  },

  // Clean account switch: fully replaces session with target account's stored profile
  loginUser: (handle: string, pin?: string, password?: string) => {
    if (typeof window === "undefined") return;
    const cleanHandle = handle.toLowerCase().replace(/^@/, "");
    const existing = Storage.getUserByHandle(cleanHandle);
    const profile: UserProfile = {
      id: existing?.id || `u_${cleanHandle}`,
      handle: cleanHandle,
      name: existing?.name || cleanHandle,
      avatar: existing?.avatar || "/default-avatar.jpg",
      bio: existing?.bio ?? "",
      link: existing?.link ?? "",
      links: existing?.links ?? [],
      gender: existing?.gender ?? "",
      pronouns: existing?.pronouns ?? "",
      note: existing?.note,
      verifiedBadge: existing?.verifiedBadge,
      customFriendsCount: existing?.customFriendsCount,
      pin: pin || existing?.pin,
      password: password || existing?.password,
      createdAt: existing?.createdAt || Date.now(),
    };
    // Write to sessionStorage (per-tab) — each tab maintains its own independent session
    try {
      sessionStorage.setItem("flyingo_current_user", JSON.stringify(sanitizeUserForStorage(profile)));
    } catch (e) {}
    // Clear active panic mode for this tab
    sessionStorage.removeItem("flyingo_active_panic_id");
    Storage.registerUser(profile);
  },

  logoutUser: () => {
    if (typeof window === "undefined") return;
    // Clear this tab's session only — other tabs keep their own sessions
    sessionStorage.removeItem("flyingo_current_user");
    sessionStorage.removeItem("flyingo_active_panic_id");
    sessionStorage.removeItem("flyingo_admin_auth");
  },

  // ── PANIC MODE SYSTEM (Permanent decoy mode until --leave is entered) ──
  getPanicModes: (): PanicModeConfig[] => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("flyingo_panic_modes");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default pre-configured decoy panic mode
    const defaultMode: PanicModeConfig = {
      id: "panic_academic_notes",
      name: "University Notes / Study Group",
      myAccountName: "Muzamil (Student)",
      myAccountHandle: "muzamil_study",
      receiverName: "Prof. Farhan (CS Dept)",
      receiverHandle: "farhan_prof",
      messages: [
        { sender: "them", text: "Please make sure the DBMS project submission is completed by Friday 5 PM.", time: "10:15 AM" },
        { sender: "me", text: "Yes sir, I have finalized the ER diagram and normalization steps. Submitting today.", time: "10:22 AM" },
        { sender: "them", text: "Excellent. Keep up the good academic progress.", time: "10:25 AM" },
      ],
    };
    return [defaultMode];
  },

  savePanicMode: (config: PanicModeConfig) => {
    if (typeof window === "undefined") return;
    const modes = Storage.getPanicModes().filter(m => m.id !== config.id);
    modes.push(config);
    localStorage.setItem("flyingo_panic_modes", JSON.stringify(modes));
  },

  deletePanicMode: (id: string) => {
    if (typeof window === "undefined") return;
    const modes = Storage.getPanicModes().filter(m => m.id !== id);
    localStorage.setItem("flyingo_panic_modes", JSON.stringify(modes));
  },

  getActivePanicMode: (): PanicModeConfig | null => {
    if (typeof window === "undefined") return null;
    const activeId = sessionStorage.getItem("flyingo_active_panic_id");
    if (!activeId) return null;
    const modes = Storage.getPanicModes();
    return modes.find(m => m.id === activeId) || null;
  },

  activatePanicMode: (panicId: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("flyingo_active_panic_id", panicId);
  },

  exitPanicMode: () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("flyingo_active_panic_id");
  },

  getAllUsers: (): UserProfile[] => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("flyingo_all_users");
    let users: UserProfile[] = [];
    if (saved) {
      try {
        users = JSON.parse(saved);
        users = users.filter(u => !MOCK_HANDLES.includes((u.handle || "").toLowerCase()));
      } catch (e) {}
    }
    const current = Storage.getCurrentUser();
    if (current && current.handle && current.handle !== "guest") {
      const idx = users.findIndex(u => u.handle.toLowerCase() === current.handle.toLowerCase());
      const sanitized = sanitizeUserForStorage(current);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...sanitized };
      } else {
        users.unshift(sanitized);
      }
      try {
        localStorage.setItem("flyingo_all_users", JSON.stringify(users.map(sanitizeUserForStorage)));
      } catch (e) {}
    }
    return users;
  },

  getUserByHandle: (handle: string): UserProfile | null => {
    const users = Storage.getAllUsers();
    const clean = handle.replace(/^@/, "").toLowerCase();
    return users.find(u => u.handle.toLowerCase() === clean) || null;
  },

  registerUser: async (user: UserProfile) => {
    if (typeof window === "undefined") return;
    if (user.note?.audioDataUrl && user.note.audioDataUrl.startsWith("data:audio")) {
      const audioKey = user.note.audioKey || `note_audio_${user.handle.toLowerCase()}`;
      user.note.audioKey = audioKey;
      AudioStorage.saveAudio(audioKey, user.note.audioDataUrl).catch(() => {});
    }
    const users = Storage.getAllUsers();
    const existingIndex = users.findIndex(u => u.handle.toLowerCase() === user.handle.toLowerCase());
    const sanitized = sanitizeUserForStorage(user);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...sanitized };
    } else {
      users.unshift(sanitized);
    }
    try {
      localStorage.setItem("flyingo_all_users", JSON.stringify(users.map(sanitizeUserForStorage)));
    } catch (err) {
      console.warn("localStorage quota reached:", err);
    }

    try {
      if (user.handle && user.handle !== "guest") {
        const profilePayload = {
          avatar: user.avatar || "/default-avatar.jpg",
          bio: user.bio || "",
          link: user.link || "",
          links: user.links || [],
          gender: user.gender || "",
          pronouns: user.pronouns || "",
          badge: user.verifiedBadge?.enabled ? (user.verifiedBadge.label || user.verifiedBadge.icon) : null,
          customFriendsCount: user.customFriendsCount || "",
        };

        await supabase.from("flyingo_users").upsert(
          {
            handle: user.handle.toLowerCase(),
            name: user.name || user.handle,
            badge_text: JSON.stringify(profilePayload),
            verified: !!user.verifiedBadge?.enabled,
          },
          { onConflict: "handle" }
        );
      }
    } catch (err) {
      console.warn("Supabase user sync error:", err);
    }
  },

  fetchRemoteUsers: async (): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase.from("flyingo_users").select("*");
      if (!error && data && data.length > 0) {
        const localUsers = Storage.getAllUsers();
        const merged = [...localUsers];
        data.forEach(dbUser => {
          if (MOCK_HANDLES.includes(dbUser.handle.toLowerCase())) return;

          let avatar = "/default-avatar.jpg";
          let bio = "";
          let link = "";
          let links: Array<{ id: string; title: string; url: string }> = [];
          let gender = "";
          let pronouns = "";
          let customFriendsCount = "";
          let verifiedBadge: VerifiedBadge | undefined = dbUser.verified ? { enabled: true, color: "#00daf3", icon: "verified" } : undefined;

          if (dbUser.badge_text) {
            try {
              if (dbUser.badge_text.startsWith("{")) {
                const parsed = JSON.parse(dbUser.badge_text);
                if (parsed.avatar) avatar = parsed.avatar;
                if (parsed.bio) bio = parsed.bio;
                if (parsed.link) link = parsed.link;
                if (Array.isArray(parsed.links)) links = parsed.links;
                if (parsed.gender) gender = parsed.gender;
                if (parsed.pronouns) pronouns = parsed.pronouns;
                if (parsed.customFriendsCount) customFriendsCount = parsed.customFriendsCount;
                if (parsed.badge) {
                  verifiedBadge = { enabled: true, color: "#00daf3", icon: "verified", label: parsed.badge };
                }
              } else {
                verifiedBadge = { enabled: true, color: "#00daf3", icon: "verified", label: dbUser.badge_text };
              }
            } catch (e) {}
          }

          const found = merged.find(u => u.handle.toLowerCase() === dbUser.handle.toLowerCase());
          if (!found) {
            merged.push({
              id: dbUser.id || `u_${dbUser.handle}`,
              handle: dbUser.handle,
              name: dbUser.name || dbUser.handle,
              avatar,
              bio,
              link,
              links,
              gender,
              pronouns,
              customFriendsCount,
              verifiedBadge,
              createdAt: new Date(dbUser.created_at || Date.now()).getTime(),
            });
          } else {
            if (avatar && avatar !== "/default-avatar.jpg") found.avatar = avatar;
            if (bio) found.bio = bio;
            if (link) found.link = link;
            if (links.length > 0) found.links = links;
            if (gender) found.gender = gender;
            if (pronouns) found.pronouns = pronouns;
            if (customFriendsCount) found.customFriendsCount = customFriendsCount;
            if (dbUser.verified) found.verifiedBadge = verifiedBadge;
          }
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("flyingo_all_users", JSON.stringify(merged));

          // Also update active session if current user exists in cloud
          const cur = Storage.getCurrentUser();
          if (cur && cur.handle) {
            const remoteCurrent = merged.find(u => u.handle.toLowerCase() === cur.handle.toLowerCase());
            if (remoteCurrent) {
              const updatedSession = { ...cur, ...remoteCurrent };
              sessionStorage.setItem("flyingo_current_user", JSON.stringify(sanitizeUserForStorage(updatedSession)));
            }
          }
        }
        return merged;
      }
    } catch (e) {
      console.warn("Could not fetch remote users:", e);
    }
    return Storage.getAllUsers();
  },

  setUserBadge: (handle: string, badge: VerifiedBadge) => {
    const users = Storage.getAllUsers();
    const clean = handle.replace(/^@/, "").toLowerCase();
    const updated = users.map(u => {
      if (u.handle.toLowerCase() === clean) {
        return { ...u, verifiedBadge: badge };
      }
      return u;
    });
    localStorage.setItem("flyingo_all_users", JSON.stringify(updated));

    const current = Storage.getCurrentUser();
    if (current.handle.toLowerCase() === clean) {
      Storage.setCurrentUser({ verifiedBadge: badge });
    }

    supabase.from("flyingo_users").update({
      verified: badge.enabled,
      badge_text: badge.enabled ? (badge.label || badge.icon) : null,
    }).eq("handle", clean).then();

    return updated;
  },

  setUserFriendsCount: (handle: string, count: string) => {
    const users = Storage.getAllUsers();
    const clean = handle.replace(/^@/, "").toLowerCase();
    const updated = users.map(u => {
      if (u.handle.toLowerCase() === clean) {
        return { ...u, customFriendsCount: count.trim() };
      }
      return u;
    });
    localStorage.setItem("flyingo_all_users", JSON.stringify(updated));

    const current = Storage.getCurrentUser();
    if (current.handle.toLowerCase() === clean) {
      Storage.setCurrentUser({ customFriendsCount: count.trim() });
    }

    return updated;
  },

  recordProfileVisit: (visitedHandle: string, visitorHandle: string, visitorName: string) => {
    if (typeof window === "undefined") return;
    if (!visitedHandle || !visitorHandle || visitedHandle.toLowerCase() === visitorHandle.toLowerCase()) return;
    
    const saved = localStorage.getItem("flyingo_profile_visits");
    let visits: ProfileVisit[] = [];
    if (saved) {
      try { visits = JSON.parse(saved); } catch (e) {}
    }

    visits.unshift({
      id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      visitedHandle: visitedHandle.toLowerCase(),
      visitorHandle: visitorHandle.toLowerCase(),
      visitorName: visitorName || visitorHandle,
      timestamp: Date.now(),
    });

    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    visits = visits.filter(v => v.timestamp >= cutoff);
    localStorage.setItem("flyingo_profile_visits", JSON.stringify(visits));
  },

  getProfileVisits24h: (handle: string): ProfileVisit[] => {
    if (typeof window === "undefined" || !handle) return [];
    const saved = localStorage.getItem("flyingo_profile_visits");
    let visits: ProfileVisit[] = [];
    if (saved) {
      try { visits = JSON.parse(saved); } catch (e) {}
    }
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return visits.filter(v => v.visitedHandle.toLowerCase() === handle.toLowerCase() && v.timestamp >= cutoff);
  },

  // ── Friend Requests System ──
  getFriendRequests: (forHandle: string): FriendRequest[] => {
    if (typeof window === "undefined" || !forHandle) return [];
    const saved = localStorage.getItem("flyingo_friend_requests");
    let reqs: FriendRequest[] = [];
    if (saved) {
      try { reqs = JSON.parse(saved); } catch (e) {}
    }
    return reqs.filter(r => r.toHandle.toLowerCase() === forHandle.toLowerCase() && r.status === "pending");
  },

  getSentRequests: (fromHandle: string): FriendRequest[] => {
    if (typeof window === "undefined" || !fromHandle) return [];
    const saved = localStorage.getItem("flyingo_friend_requests");
    let reqs: FriendRequest[] = [];
    if (saved) {
      try { reqs = JSON.parse(saved); } catch (e) {}
    }
    return reqs.filter(r => r.fromHandle.toLowerCase() === fromHandle.toLowerCase());
  },

  sendFriendRequest: (from: UserProfile, toHandle: string): boolean => {
    if (typeof window === "undefined" || !from.handle || !toHandle) return false;
    const cleanTo = toHandle.replace(/^@/, "").toLowerCase();
    if (from.handle.toLowerCase() === cleanTo) return false;

    const saved = localStorage.getItem("flyingo_friend_requests");
    let reqs: FriendRequest[] = [];
    if (saved) {
      try { reqs = JSON.parse(saved); } catch (e) {}
    }

    const exists = reqs.find(r => r.fromHandle.toLowerCase() === from.handle.toLowerCase() && r.toHandle.toLowerCase() === cleanTo && r.status === "pending");
    if (exists) return true;

    reqs.unshift({
      id: `freq_${Date.now()}`,
      fromHandle: from.handle,
      fromName: from.name || `@${from.handle}`,
      fromAvatar: from.avatar || "/default-avatar.jpg",
      toHandle: cleanTo,
      status: "pending",
      createdAt: Date.now(),
    });

    localStorage.setItem("flyingo_friend_requests", JSON.stringify(reqs));
    return true;
  },

  respondFriendRequest: (requestId: string, status: "accepted" | "declined") => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("flyingo_friend_requests");
    let reqs: FriendRequest[] = [];
    if (saved) {
      try { reqs = JSON.parse(saved); } catch (e) {}
    }
    reqs = reqs.map(r => r.id === requestId ? { ...r, status } : r);
    localStorage.setItem("flyingo_friend_requests", JSON.stringify(reqs));

    // If accepted, ensure they are registered in mutual friend lists
    if (status === "accepted") {
      const req = reqs.find(r => r.id === requestId);
      if (req) {
        Storage.addMutualFriend(req.fromHandle, req.toHandle);
      }
    }
  },

  addMutualFriend: (handleA: string, handleB: string) => {
    if (typeof window === "undefined") return;
    const cleanA = handleA.toLowerCase();
    const cleanB = handleB.toLowerCase();
    const saved = localStorage.getItem("flyingo_mutual_friends");
    let map: Record<string, string[]> = {};
    if (saved) {
      try { map = JSON.parse(saved); } catch (e) {}
    }
    if (!map[cleanA]) map[cleanA] = [];
    if (!map[cleanB]) map[cleanB] = [];
    if (!map[cleanA].includes(cleanB)) map[cleanA].push(cleanB);
    if (!map[cleanB].includes(cleanA)) map[cleanB].push(cleanA);
    localStorage.setItem("flyingo_mutual_friends", JSON.stringify(map));
  },

  getFriends: (handle: string): string[] => {
    if (typeof window === "undefined" || !handle) return [];
    const clean = handle.toLowerCase();
    const saved = localStorage.getItem("flyingo_mutual_friends");
    if (saved) {
      try {
        const map = JSON.parse(saved);
        if (map[clean]) return map[clean];
      } catch (e) {}
    }
    return [];
  },

  // ── GROUP CHATS SYSTEM ──
  // Groups are stored per-user: flyingo_groups_<handle>
  // On group creation, the group is written to all members' stores so they can see it
  getGroups: (userHandle?: string): GroupChat[] => {
    if (typeof window === "undefined") return [];
    if (!userHandle) return [];
    const key = `flyingo_groups_${userHandle.toLowerCase()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  },

  _saveGroupsForUser: (userHandle: string, groups: GroupChat[]) => {
    if (typeof window === "undefined" || !userHandle) return;
    const key = `flyingo_groups_${userHandle.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(groups));
  },

  createGroup: (name: string, createdBy: string, members: string[], description?: string, avatar?: string): GroupChat => {
    const cleanMembers = Array.from(new Set([createdBy.toLowerCase(), ...members.map(m => m.toLowerCase())]));
    const newGroup: GroupChat = {
      id: `group_${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || "",
      avatar: avatar || "/default-avatar.jpg",
      createdBy: createdBy.toLowerCase(),
      members: cleanMembers,
      createdAt: Date.now(),
    };
    // Write the group to every member's own store so they can see it
    if (typeof window !== "undefined") {
      cleanMembers.forEach(memberHandle => {
        const existing = Storage.getGroups(memberHandle);
        existing.unshift(newGroup);
        Storage._saveGroupsForUser(memberHandle, existing);
      });
    }
    return newGroup;
  },

  updateGroupAvatar: (groupId: string, newAvatar: string): boolean => {
    if (typeof window === "undefined") return false;
    // Update in current user's store; find the group to get all members
    const currentUser = Storage.getRealCurrentUser();
    const myGroups = Storage.getGroups(currentUser.handle);
    const group = myGroups.find(g => g.id === groupId);
    if (group) {
      // Propagate to all members
      group.members.forEach(memberHandle => {
        const memberGroups = Storage.getGroups(memberHandle);
        const updatedGroups = memberGroups.map(g => g.id === groupId ? { ...g, avatar: newAvatar } : g);
        Storage._saveGroupsForUser(memberHandle, updatedGroups);
      });
    }
    return true;
  },

  updateGroup: (groupId: string, updates: Partial<GroupChat>): boolean => {
    if (typeof window === "undefined") return false;
    const currentUser = Storage.getRealCurrentUser();
    const myGroups = Storage.getGroups(currentUser.handle);
    const group = myGroups.find(g => g.id === groupId);
    if (group) {
      const allMembers = updates.members || group.members || [];
      allMembers.forEach(memberHandle => {
        const memberGroups = Storage.getGroups(memberHandle);
        const updatedGroups = memberGroups.map(g => g.id === groupId ? { ...g, ...updates } : g);
        Storage._saveGroupsForUser(memberHandle, updatedGroups);
      });
    }
    return true;
  },

  // ── CONVERSATIONS PERSISTENCE SYSTEM ──
  getSavedConversations: (userHandle: string): SavedConversation[] => {
    if (typeof window === "undefined" || !userHandle) return [];
    const clean = userHandle.toLowerCase();
    const key = `flyingo_convs_${clean}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  },

  saveConversations: (userHandle: string, conversations: SavedConversation[]) => {
    if (typeof window === "undefined" || !userHandle) return;
    const clean = userHandle.toLowerCase();
    const key = `flyingo_convs_${clean}`;
    // Conversation list stores ONLY metadata. Messages live in their own dedicated stores.
    const sanitized = conversations.map(c => ({
      ...c,
      messages: [],
    }));
    localStorage.setItem(key, JSON.stringify(sanitized));
  },

  // ── GROUP MESSAGES: stored at group level, shared by all members ──
  // Key: flyingo_grpmsg_<groupId>
  getGroupMessages: (groupId: string): SavedMessage[] => {
    if (typeof window === "undefined" || !groupId) return [];
    const saved = localStorage.getItem(`flyingo_grpmsg_${groupId}`);
    if (saved) {
      try {
        const parsed: SavedMessage[] = JSON.parse(saved);
        const seen = new Set<string>();
        return parsed.filter(m => {
          if (!m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      } catch (e) {}
    }
    return [];
  },

  saveGroupMessage: (groupId: string, message: SavedMessage, groupMembers: string[]) => {
    if (typeof window === "undefined" || !groupId) return;
    const currentMsgs = Storage.getGroupMessages(groupId);
    if (!currentMsgs.some(m => m.id === message.id)) {
      currentMsgs.push(message);
      localStorage.setItem(`flyingo_grpmsg_${groupId}`, JSON.stringify(currentMsgs));
    }

    const lastMsgText = message.text || (message.mediaType === "gif" ? "Sent a GIF" : message.mediaType ? "Sent a Photo" : "");
    const time = message.time;

    // Update conversation list stubs for each member
    groupMembers.forEach(memberHandle => {
      const clean = memberHandle.toLowerCase();
      const convs = Storage.getSavedConversations(clean);
      const existingIdx = convs.findIndex(c => c.id === groupId);
      if (existingIdx >= 0) {
        convs[existingIdx] = {
          ...convs[existingIdx],
          lastMessage: lastMsgText,
          time,
          messages: [],
        };
        Storage.saveConversations(clean, convs);
      }
    });
  },

  // ── DIRECT MESSAGES (1-ON-1): Dedicated shared store for each user pair ──
  // Key: flyingo_dm_<user1>__<user2> (sorted alphabetically for exact symmetry)
  getDmKey: (handle1: string, handle2: string): string => {
    const sorted = [handle1.toLowerCase().trim(), handle2.toLowerCase().trim()].sort();
    return `flyingo_dm_${sorted[0]}__${sorted[1]}`;
  },

  getDirectMessages: (handle1: string, handle2: string): SavedMessage[] => {
    if (typeof window === "undefined" || !handle1 || !handle2) return [];
    const key = Storage.getDmKey(handle1, handle2);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed: SavedMessage[] = JSON.parse(saved);
        const seen = new Set<string>();
        return parsed.filter(m => {
          if (!m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      } catch (e) {}
    }
    return [];
  },

  saveDirectMessage: (senderUser: UserProfile, recipientHandle: string, message: SavedMessage) => {
    if (typeof window === "undefined" || !senderUser?.handle || !recipientHandle) return;
    const cleanSender = senderUser.handle.toLowerCase();
    const cleanRecipient = recipientHandle.toLowerCase();
    const key = Storage.getDmKey(cleanSender, cleanRecipient);
    
    // Save to dedicated 1-on-1 store
    const currentMsgs = Storage.getDirectMessages(cleanSender, cleanRecipient);
    if (!currentMsgs.some(m => m.id === message.id)) {
      currentMsgs.push(message);
      localStorage.setItem(key, JSON.stringify(currentMsgs));
    }

    const lastMsgText = message.text || (message.mediaType === "gif" ? "Sent a GIF" : message.mediaType ? "Sent a Photo" : "");
    const time = message.time;

    // Helper to update or insert conversation stub in user's sidebar
    const updateStub = (ownerHandle: string, partnerHandle: string, partnerName: string, partnerAvatar: string) => {
      const convs = Storage.getSavedConversations(ownerHandle);
      const idx = convs.findIndex(c => !c.isGroup && c.handle.toLowerCase() === partnerHandle.toLowerCase());
      if (idx >= 0) {
        convs[idx] = {
          ...convs[idx],
          lastMessage: lastMsgText,
          time,
          messages: [],
        };
      } else {
        convs.unshift({
          id: `conv_${partnerHandle}`,
          name: partnerName || `@${partnerHandle}`,
          handle: partnerHandle,
          avatar: partnerAvatar || "/default-avatar.jpg",
          lastMessage: lastMsgText,
          time,
          unread: 0,
          online: true,
          messages: [],
        });
      }
      Storage.saveConversations(ownerHandle, convs);
    };

    const recipientUser = Storage.getUserByHandle(cleanRecipient);
    // Update sender's sidebar list
    updateStub(cleanSender, cleanRecipient, recipientUser?.name || cleanRecipient, recipientUser?.avatar || "/default-avatar.jpg");
    // Update recipient's sidebar list
    updateStub(cleanRecipient, cleanSender, senderUser.name || cleanSender, senderUser.avatar || "/default-avatar.jpg");
  },

  // Stories (Flamingoos)
  getStories: (): FlamingooStory[] => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("flyingo_stories");
    if (saved) {
      try {
        let list: FlamingooStory[] = JSON.parse(saved);
        const clean = list.filter(s => !MOCK_HANDLES.includes((s.authorHandle || "").toLowerCase()));
        if (clean.length !== list.length) {
          localStorage.setItem("flyingo_stories", JSON.stringify(clean));
        }
        return clean;
      } catch (e) {}
    }
    return [];
  },

  addStory: (story: Omit<FlamingooStory, "id" | "timestamp" | "createdTime" | "likes" | "viewers">): FlamingooStory => {
    const stories = Storage.getStories();
    const newStory: FlamingooStory = {
      ...story,
      id: `story_${Date.now()}`,
      timestamp: "Just now",
      createdTime: Date.now(),
      likes: 0,
      viewers: [],
    };
    const updated = [newStory, ...stories];
    if (typeof window !== "undefined") {
      localStorage.setItem("flyingo_stories", JSON.stringify(updated));
    }
    return newStory;
  },

  recordStoryView: (storyId: string, viewerHandle: string) => {
    if (!storyId || !viewerHandle) return;
    const stories = Storage.getStories();
    const updated = stories.map(s => {
      if (s.id === storyId) {
        const viewers = s.viewers || [];
        if (!viewers.includes(viewerHandle.toLowerCase())) {
          return { ...s, viewers: [...viewers, viewerHandle.toLowerCase()] };
        }
      }
      return s;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("flyingo_stories", JSON.stringify(updated));
    }
    return updated;
  },

  likeStory: (storyId: string) => {
    const stories = Storage.getStories();
    const updated = stories.map(s => {
      if (s.id === storyId) {
        const hasLiked = !s.hasLiked;
        return { ...s, hasLiked, likes: hasLiked ? s.likes + 1 : s.likes - 1 };
      }
      return s;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("flyingo_stories", JSON.stringify(updated));
    }
    return updated;
  },

  getSettings: (): ChatCustomization => {
    const defaults: ChatCustomization = {
      sentTheme: "electric-rose",
      receivedTheme: "liquid-glass",
      wallpaper: "frost",
      fontSize: 15,
      sentOpacity: 100,
    };
    if (typeof window === "undefined") return defaults;
    const saved = localStorage.getItem("flyingo_chat_settings");
    if (saved) {
      try { return { ...defaults, ...JSON.parse(saved) }; } catch (e) {}
    }
    return defaults;
  },

  saveSettings: (settings: Partial<ChatCustomization>) => {
    if (typeof window === "undefined") return;
    const current = Storage.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem("flyingo_chat_settings", JSON.stringify(updated));
  },

  isAdminAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("flyingo_admin_auth") === "true";
  },

  setAdminAuthenticated: (status: boolean) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("flyingo_admin_auth", status ? "true" : "false");
  },

  // ── TYPING INDICATOR SYSTEM ──
  setTypingStatus: (userHandle: string, targetId: string, isTyping: boolean) => {
    if (typeof window === "undefined" || !userHandle || !targetId) return;
    const cleanUser = userHandle.toLowerCase();
    const key = `flyingo_typing_${targetId.toLowerCase()}`;
    const saved = localStorage.getItem(key);
    let typers: Record<string, number> = {};
    if (saved) {
      try { typers = JSON.parse(saved); } catch (e) {}
    }
    const now = Date.now();
    // Prune entries older than 4 seconds
    const fresh: Record<string, number> = {};
    for (const [handle, ts] of Object.entries(typers)) {
      if (now - ts < 4000 && handle !== cleanUser) {
        fresh[handle] = ts;
      }
    }
    if (isTyping) {
      fresh[cleanUser] = now;
    }
    localStorage.setItem(key, JSON.stringify(fresh));
  },

  getTypingUsers: (targetId: string, myHandle: string): string[] => {
    if (typeof window === "undefined" || !targetId) return [];
    const key = `flyingo_typing_${targetId.toLowerCase()}`;
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    try {
      const typers: Record<string, number> = JSON.parse(saved);
      const now = Date.now();
      const cleanMe = myHandle?.toLowerCase();
      return Object.entries(typers)
        .filter(([handle, ts]) => handle !== cleanMe && now - ts < 3500)
        .map(([handle]) => handle);
    } catch (e) {
      return [];
    }
  },

  // ── CALL SIGNALING SYSTEM ──
  initiateCall: (caller: UserProfile, recipientHandle: string, type: "voice" | "video"): CallSession => {
    const session: CallSession = {
      callId: `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      callerHandle: caller.handle.toLowerCase(),
      callerName: caller.name || caller.handle,
      callerAvatar: caller.avatar || "/default-avatar.jpg",
      recipientHandle: recipientHandle.toLowerCase(),
      type,
      status: "ringing",
      startedAt: Date.now(),
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("flyingo_active_call", JSON.stringify(session));
    }
    return session;
  },

  getActiveCall: (myHandle: string): CallSession | null => {
    if (typeof window === "undefined" || !myHandle) return null;
    const saved = localStorage.getItem("flyingo_active_call");
    if (!saved) return null;
    try {
      const session: CallSession = JSON.parse(saved);
      const clean = myHandle.toLowerCase();
      if (session.callerHandle === clean || session.recipientHandle === clean) {
        // Auto-expire calls ringing for over 45 seconds
        if (session.status === "ringing" && session.startedAt && Date.now() - session.startedAt > 45000) {
          Storage.clearCall();
          return null;
        }
        return session;
      }
    } catch (e) {}
    return null;
  },

  updateCallStatus: (callId: string, status: "accepted" | "declined" | "ended") => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("flyingo_active_call");
    if (!saved) return;
    try {
      const session: CallSession = JSON.parse(saved);
      if (session.callId === callId) {
        session.status = status;
        if (status === "ended" || status === "declined") {
          session.endedAt = Date.now();
        }
        localStorage.setItem("flyingo_active_call", JSON.stringify(session));
      }
    } catch (e) {}
  },

  clearCall: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("flyingo_active_call");
  },

  // ── MESSAGE REACTIONS & PINNING ──
  toggleReaction: (
    channelKey: string,
    messageId: string,
    emoji: string,
    userHandle: string,
    isGroup: boolean
  ) => {
    if (typeof window === "undefined" || !channelKey || !messageId || !userHandle) return;
    const cleanUser = userHandle.toLowerCase();
    const key = isGroup ? `flyingo_grpmsg_${channelKey}` : channelKey.startsWith("flyingo_dm_") ? channelKey : `flyingo_dm_${channelKey}`;
    const saved = localStorage.getItem(key);
    if (!saved) return;
    try {
      const messages: SavedMessage[] = JSON.parse(saved);
      const msgIdx = messages.findIndex(m => m.id === messageId);
      if (msgIdx < 0) return;

      const msg = messages[msgIdx];
      const reactions = msg.reactions ? [...msg.reactions] : [];
      const reactionIdx = reactions.findIndex(r => r.emoji === emoji);

      if (reactionIdx >= 0) {
        const reaction = reactions[reactionIdx];
        if (reaction.users.includes(cleanUser)) {
          // Toggle off
          reaction.users = reaction.users.filter(u => u !== cleanUser);
          if (reaction.users.length === 0) {
            reactions.splice(reactionIdx, 1);
          }
        } else {
          reaction.users.push(cleanUser);
        }
      } else {
        reactions.push({ emoji, users: [cleanUser] });
      }

      msg.reactions = reactions;
      messages[msgIdx] = msg;
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {}
  },

  togglePin: (channelKey: string, messageId: string, isGroup: boolean) => {
    if (typeof window === "undefined" || !channelKey || !messageId) return;
    const key = isGroup ? `flyingo_grpmsg_${channelKey}` : channelKey.startsWith("flyingo_dm_") ? channelKey : `flyingo_dm_${channelKey}`;
    const saved = localStorage.getItem(key);
    if (!saved) return;
    try {
      const messages: SavedMessage[] = JSON.parse(saved);
      const msgIdx = messages.findIndex(m => m.id === messageId);
      if (msgIdx < 0) return;

      const willPin = !messages[msgIdx].isPinned;
      messages.forEach(m => {
        if (m.id === messageId) {
          m.isPinned = willPin;
        } else if (willPin) {
          m.isPinned = false; // keep only 1 message pinned at a time
        }
      });

      localStorage.setItem(key, JSON.stringify(messages));
    } catch (e) {}
  },

  deleteMessage: (channelKey: string, messageId: string, isGroup: boolean) => {
    if (typeof window === "undefined" || !channelKey || !messageId) return;
    const key = isGroup ? `flyingo_grpmsg_${channelKey}` : channelKey.startsWith("flyingo_dm_") ? channelKey : `flyingo_dm_${channelKey}`;
    const saved = localStorage.getItem(key);
    if (!saved) return;
    try {
      const messages: SavedMessage[] = JSON.parse(saved);
      const filtered = messages.filter(m => m.id !== messageId);
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch (e) {}
  },

  // ── ONLINE PRESENCE (heartbeat-based, 3min window) ──
  pingOnline: (handle: string) => {
    if (typeof window === "undefined" || !handle) return;
    localStorage.setItem(`flyingo_presence_${handle.toLowerCase()}`, String(Date.now()));
  },

  isOnline: (handle: string): boolean => {
    if (typeof window === "undefined" || !handle) return false;
    const ts = localStorage.getItem(`flyingo_presence_${handle.toLowerCase()}`);
    if (!ts) return false;
    return Date.now() - parseInt(ts) < 3 * 60 * 1000; // online if heartbeat within 3 min
  },
};
