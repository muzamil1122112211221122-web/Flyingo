"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Storage, UserProfile } from "@/lib/storage";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>({ id: "u_default", handle: "", name: "", createdAt: Date.now() });
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const u = Storage.getCurrentUser();
    setCurrentUser(u);
    const local = Storage.getAllUsers();
    setUsers(local);
    Storage.fetchRemoteUsers().then(remoteUsers => {
      setUsers(remoteUsers);
    });
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const fresh = await Storage.fetchRemoteUsers();
        setUsers(fresh);
      } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const openProfile = (user: UserProfile) => {
    setViewingUser(user);
    if (currentUser.handle) {
      Storage.recordProfileVisit(user.handle, currentUser.handle, currentUser.name);
    }
  };

  const handleSendFriendReq = (handle: string) => {
    const sent = Storage.sendFriendRequest(currentUser, handle);
    if (sent) {
      setToastMessage(`✓ Friend request sent to @${handle}!`);
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const cleanQuery = query.trim().replace(/^@/, "").toLowerCase();
  const results = users.filter(
    u => u.handle.toLowerCase() !== currentUser.handle.toLowerCase() &&
         (u.name.toLowerCase().includes(cleanQuery) ||
          u.handle.toLowerCase().includes(cleanQuery) ||
          (u.bio && u.bio.toLowerCase().includes(cleanQuery)))
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
      <Sidebar />
      <div className="md:ml-[86px] ml-0 flex-1 p-4 md:p-8 lg:p-12 flex flex-col max-w-5xl mx-auto w-full overflow-y-auto relative pb-24 md:pb-8">
        
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-tertiary text-white font-label-md text-[13px] shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {toastMessage}
          </motion.div>
        )}

        <div className="mb-6">
          <h1 className="font-display-lg font-bold">Global Search</h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            Search handles, profiles, and verified identities across Flyingo.
          </p>
        </div>

        <div className="relative w-full mb-8">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
            search
          </span>
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search by @handle or name..." 
            autoFocus
            className="w-full pl-12 pr-4 py-4 rounded-3xl bg-surface-container-low text-on-surface text-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/60 shadow-sm"
          />
        </div>
        
        {query ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-label-md uppercase tracking-wider text-on-surface-variant mb-2">
              Found {results.length} account{results.length === 1 ? "" : "s"}
            </h2>
            {results.length === 0 ? (
              <div className="p-8 rounded-3xl bg-surface-container-lowest text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 block mb-2">person_search</span>
                <p className="font-title-md text-on-surface">No user found matching &quot;{query}&quot;</p>
                <p className="font-body-sm text-on-surface-variant mt-1">Make sure the handle is typed correctly.</p>
              </div>
            ) : (
              results.map(user => (
                <motion.div
                  key={user.id || user.handle}
                  whileHover={{ x: 4 }}
                  className="p-4 rounded-3xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-4"
                >
                  <div 
                    onClick={() => openProfile(user)}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity min-w-0"
                  >
                    <img
                      src={user.avatar || "/default-avatar.jpg"}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover shadow-sm flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-title-md font-bold text-on-surface truncate">{user.name}</p>
                        {user.verifiedBadge?.enabled && (
                          <VerifiedBadge
                            icon={user.verifiedBadge.icon}
                            color={user.verifiedBadge.color}
                            size={22}
                            title={user.verifiedBadge.label || "Verified"}
                          />
                        )}
                      </div>
                      <p className="font-caption text-primary font-mono font-semibold truncate">@{user.handle}</p>
                      {user.bio && <p className="font-caption text-on-surface-variant mt-0.5 max-w-md truncate">{user.bio}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openProfile(user)}
                      className="px-4 py-2 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md transition-all cursor-pointer"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleSendFriendReq(user.handle)}
                      className="px-4 py-2 rounded-2xl bg-secondary/15 hover:bg-secondary/25 text-secondary font-label-md font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      Add
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.09 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        router.push(`/chat?user=${encodeURIComponent(user.handle)}`);
                      }}
                      className="px-4 py-2 rounded-2xl bg-primary text-white font-label-md flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      Chat
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-60">
            <span className="material-symbols-outlined text-[80px] text-on-surface-variant mb-4">travel_explore</span>
            <p className="text-xl text-on-surface-variant font-medium">Type a handle or name to discover users</p>
          </div>
        )}
      </div>

      {/* ── PROFILE VIEW MODAL ── */}
      <AnimatePresence>
        {viewingUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setViewingUser(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-tertiary" />
              
              <div className="flex items-center justify-between pt-2">
                <span className="font-caption text-on-surface-variant uppercase tracking-wider font-bold text-[11px]">User Profile</span>
                <button
                  onClick={() => setViewingUser(null)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <img
                  src={viewingUser.avatar || "/default-avatar.jpg"}
                  alt={viewingUser.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-surface-container shadow-md mb-3"
                />

                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="font-headline-md font-bold text-on-surface">
                    {viewingUser.name || `@${viewingUser.handle}`}
                  </h3>
                  {viewingUser.verifiedBadge?.enabled && (
                    <VerifiedBadge
                      icon={viewingUser.verifiedBadge.icon}
                      color={viewingUser.verifiedBadge.color}
                      size={26}
                      title={viewingUser.verifiedBadge.label || "Verified"}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <p className="font-body-sm text-primary font-mono font-semibold">
                    @{viewingUser.handle}
                  </p>
                  <span className="text-outline text-xs">•</span>
                  <span className="font-caption text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {viewingUser.customFriendsCount || 0} Friends
                  </span>
                </div>

                {(viewingUser.pronouns || viewingUser.gender) && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {viewingUser.pronouns && (
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-caption text-[11px]">
                        {viewingUser.pronouns}
                      </span>
                    )}
                    {viewingUser.gender && (
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-caption text-[11px]">
                        {viewingUser.gender}
                      </span>
                    )}
                  </div>
                )}

                {viewingUser.bio ? (
                  <p className="font-body-sm text-on-surface mt-3 bg-surface-container-low p-3 rounded-2xl w-full text-left leading-relaxed">
                    {viewingUser.bio}
                  </p>
                ) : (
                  <p className="font-caption text-on-surface-variant/60 italic mt-3">No bio written yet.</p>
                )}

                {viewingUser.links && viewingUser.links.length > 0 && (
                  <div className="w-full flex flex-col gap-1.5 mt-2">
                    {viewingUser.links.map(l => (
                      <a
                        key={l.id}
                        href={l.url.startsWith("http") ? l.url : `https://${l.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-caption text-[12px] font-semibold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">link</span>
                        <span>{l.title || "Website"}:</span>
                        <span className="truncate">{l.url}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => handleSendFriendReq(viewingUser.handle)}
                  className="py-3 rounded-2xl bg-secondary/10 hover:bg-secondary/20 text-secondary font-title-md font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Friend Request
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/chat?user=${encodeURIComponent(viewingUser.handle)}`)}
                  className="py-3 rounded-2xl bg-primary hover:bg-primary-container text-white font-title-md font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Message
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
