"use client";

import { useEffect, useState } from "react";
import { Storage, UserProfile, CallSession } from "@/lib/storage";
import { Realtime } from "@/lib/realtime";
import CallModal from "@/components/CallModal";
import { AnimatePresence } from "framer-motion";

/**
 * BootSync: Hydrates all local caches from Supabase on every app boot,
 * keeps Realtime connection alive across all routes, and hosts the global
 * CallModal so incoming calls ring and can be answered on any page.
 */
export default function BootSync() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  useEffect(() => {
    // 1. Hydrate users and stories from Supabase
    Storage.fetchRemoteUsers().catch(() => {});
    Storage.fetchRemoteStories().catch(() => {});

    // 2. Setup current user and Realtime sync
    const user = Storage.getCurrentUser();
    if (user && user.handle && user.handle !== "guest") {
      setCurrentUser(user);
      Realtime.init(user);
    }

    // 3. Check for any pre-existing active call in localStorage
    if (user && user.handle) {
      const savedCall = Storage.getActiveCall(user.handle);
      if (savedCall && savedCall.status !== "ended" && savedCall.status !== "declined") {
        setActiveCall(savedCall);
      }
    }

    // 4. Listen for real-time call broadcasts globally across all tabs/pages
    const unsubCall = Realtime.onCall((session) => {
      if (!session || session.status === "ended" || session.status === "declined") {
        setActiveCall(null);
        return;
      }
      setActiveCall(session);
    });

    // 5. Sync across local browser tabs via storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "flyingo_active_call") {
        const cur = Storage.getCurrentUser();
        if (cur && cur.handle) {
          const updatedCall = Storage.getActiveCall(cur.handle);
          if (updatedCall && updatedCall.status !== "ended" && updatedCall.status !== "declined") {
            setActiveCall(updatedCall);
          } else {
            setActiveCall(null);
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      unsubCall();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleAcceptCall = () => {
    if (!activeCall) return;
    Storage.updateCallStatus(activeCall.callId, "accepted");
    const accepted = { ...activeCall, status: "accepted" as const };
    Realtime.sendCallEvent(accepted);
    setActiveCall(accepted);
  };

  const handleDeclineCall = () => {
    if (!activeCall) return;
    Storage.updateCallStatus(activeCall.callId, "declined");
    Storage.clearCall();
    Realtime.sendCallEvent(null);
    setActiveCall(null);
  };

  const handleEndCall = (durationSecs: number) => {
    if (!activeCall) return;
    const isCaller = currentUser?.handle.toLowerCase() === activeCall.callerHandle.toLowerCase();
    const partnerHandle = isCaller ? activeCall.recipientHandle : activeCall.callerHandle;
    
    Storage.updateCallStatus(activeCall.callId, "ended");
    Realtime.sendCallEvent(null);

    const durationText = durationSecs > 0
      ? `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`
      : "Missed";

    const nowTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (currentUser?.handle && partnerHandle) {
      const callMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: "me",
        senderHandle: currentUser.handle,
        text: `${activeCall.type === "video" ? "📹 Video Call" : "📞 Voice Call"} • ${durationText}`,
        time: nowTime,
        delivered: true,
        mediaType: "call",
        callInfo: {
          type: activeCall.type,
          duration: durationSecs,
          status: durationSecs > 0 ? "ended" : "missed",
        },
      };
      Storage.saveDirectMessage(currentUser, partnerHandle, callMsg as any);
    }

    Storage.clearCall();
    setActiveCall(null);
  };

  return (
    <>
      <AnimatePresence>
        {activeCall && currentUser && (
          <CallModal
            session={activeCall}
            currentUser={currentUser}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
            onEnd={handleEndCall}
          />
        )}
      </AnimatePresence>
    </>
  );
}
