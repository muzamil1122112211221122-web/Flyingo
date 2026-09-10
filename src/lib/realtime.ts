import { supabase } from "./supabase";
import { Storage, UserProfile, SavedMessage, FriendRequest, CallSession } from "./storage";

// In-memory set of currently online handles tracked across all devices
const activeOnlineHandles = new Set<string>();

type MessageCallback = (msg: SavedMessage, channelId: string, partnerHandle: string) => void;
type FriendRequestCallback = (req: FriendRequest) => void;
type PresenceCallback = (onlineHandles: string[]) => void;
type TypingCallback = (channelId: string, handle: string, isTyping: boolean) => void;
type CallCallback = (call: CallSession | null) => void;
type CallSignalCallback = (signal: { senderHandle: string; recipientHandle: string; type: "offer" | "answer" | "candidate"; sdp?: any; candidate?: any }) => void;

let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let currentSubscribedHandle: string | null = null;

const messageListeners = new Set<MessageCallback>();
const friendRequestListeners = new Set<FriendRequestCallback>();
const presenceListeners = new Set<PresenceCallback>();
const typingListeners = new Set<TypingCallback>();
const callListeners = new Set<CallCallback>();
const callSignalListeners = new Set<CallSignalCallback>();

export const Realtime = {
  /**
   * Initialize real-time multi-device connection for the logged-in user.
   */
  init: (currentUser: UserProfile) => {
    if (typeof window === "undefined" || !currentUser?.handle) return;
    const cleanHandle = currentUser.handle.toLowerCase().trim();

    // Avoid duplicate subscriptions for the same user
    if (globalChannel && currentSubscribedHandle === cleanHandle) return;

    if (globalChannel) {
      supabase.removeChannel(globalChannel);
      globalChannel = null;
    }

    currentSubscribedHandle = cleanHandle;

    const channel = supabase.channel("flyingo_global_sync", {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: cleanHandle },
      },
    });

    // ── 1. REAL-TIME PRESENCE (Online / Offline status across all devices) ──
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        activeOnlineHandles.clear();

        Object.keys(state).forEach((key) => {
          activeOnlineHandles.add(key.toLowerCase());
          try {
            localStorage.setItem(`flyingo_presence_${key.toLowerCase()}`, String(Date.now()));
          } catch (e) {}
        });

        // Current user is always online
        activeOnlineHandles.add(cleanHandle);

        const list = Array.from(activeOnlineHandles);
        presenceListeners.forEach((fn) => fn(list));
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key) {
          activeOnlineHandles.add(key.toLowerCase());
          try {
            localStorage.setItem(`flyingo_presence_${key.toLowerCase()}`, String(Date.now()));
          } catch (e) {}
          presenceListeners.forEach((fn) => fn(Array.from(activeOnlineHandles)));
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key && key.toLowerCase() !== cleanHandle) {
          activeOnlineHandles.delete(key.toLowerCase());
          try {
            localStorage.removeItem(`flyingo_presence_${key.toLowerCase()}`);
          } catch (e) {}
          presenceListeners.forEach((fn) => fn(Array.from(activeOnlineHandles)));
        }
      });

    // ── 2. REAL-TIME DIRECT & GROUP MESSAGES ──
    channel.on("broadcast", { event: "new_dm" }, ({ payload }) => {
      if (!payload) return;
      const { fromUser, toHandle, message } = payload;
      if (!toHandle || !message) return;

      if (toHandle.toLowerCase() === cleanHandle) {
        // Save incoming message locally on this device
        Storage.saveDirectMessage(fromUser, cleanHandle, message);
        const dmKey = Storage.getDmKey(fromUser.handle, cleanHandle);
        messageListeners.forEach((fn) => fn(message, dmKey, fromUser.handle));

        // Dispatch storage event so open tabs react immediately
        window.dispatchEvent(new StorageEvent("storage", { key: dmKey }));
      }
    });

    channel.on("broadcast", { event: "new_group_message" }, ({ payload }) => {
      if (!payload) return;
      const { groupId, message, members } = payload;
      if (!groupId || !message) return;

      const isMember = Array.isArray(members) && members.map((m: string) => m.toLowerCase()).includes(cleanHandle);
      if (isMember) {
        Storage.saveGroupMessage(groupId, message, members);
        messageListeners.forEach((fn) => fn(message, groupId, groupId));
        window.dispatchEvent(new StorageEvent("storage", { key: `flyingo_grpmsg_${groupId}` }));
      }
    });

    // ── 3. REAL-TIME FRIEND REQUESTS ──
    channel.on("broadcast", { event: "friend_request" }, ({ payload }) => {
      if (!payload) return;
      const { request } = payload;
      if (!request || !request.toHandle) return;

      if (request.toHandle.toLowerCase() === cleanHandle) {
        // Add to local friend requests
        const saved = localStorage.getItem("flyingo_friend_requests");
        let reqs: FriendRequest[] = [];
        if (saved) {
          try { reqs = JSON.parse(saved); } catch (e) {}
        }
        if (!reqs.some((r) => r.id === request.id)) {
          reqs.unshift(request);
          localStorage.setItem("flyingo_friend_requests", JSON.stringify(reqs));
        }

        friendRequestListeners.forEach((fn) => fn(request));
        window.dispatchEvent(new StorageEvent("storage", { key: "flyingo_friend_requests" }));
      }
    });

    channel.on("broadcast", { event: "friend_request_response" }, ({ payload }) => {
      if (!payload) return;
      const { toHandle, fromHandle, status } = payload;
      if (!toHandle || !fromHandle) return;

      if (toHandle.toLowerCase() === cleanHandle && status === "accepted") {
        const partner = Storage.getUserByHandle(fromHandle);
        if (partner) {
          const convs = Storage.getSavedConversations(cleanHandle);
          if (!convs.some((c) => !c.isGroup && c.handle.toLowerCase() === fromHandle.toLowerCase())) {
            convs.unshift({
              id: `conv_${partner.handle}`,
              name: partner.name || `@${partner.handle}`,
              handle: partner.handle,
              avatar: partner.avatar || "/default-avatar.jpg",
              lastMessage: "Connected! Say hello 👋",
              time: "Just now",
              unread: 0,
              online: true,
              messages: [],
            });
            Storage.saveConversations(cleanHandle, convs);
            window.dispatchEvent(new StorageEvent("storage", { key: `flyingo_convs_${cleanHandle}` }));
          }
        }
      }
    });

    // ── 4. REAL-TIME TYPING INDICATORS ──
    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (!payload) return;
      const { channelId, handle, isTyping } = payload;
      if (handle && handle.toLowerCase() !== cleanHandle) {
        Storage.setTypingStatus(handle, channelId, isTyping);
        typingListeners.forEach((fn) => fn(channelId, handle, isTyping));
      }
    });

    // ── 5. REAL-TIME CALL SIGNALING ──
    channel.on("broadcast", { event: "call_event" }, ({ payload }) => {
      if (!payload) return;
      const { call } = payload;
      if (!call) {
        Storage.clearCall();
        callListeners.forEach((fn) => fn(null));
        return;
      }
      if (call.recipientHandle?.toLowerCase() === cleanHandle || call.callerHandle?.toLowerCase() === cleanHandle) {
        localStorage.setItem("flyingo_active_call", JSON.stringify(call));
        callListeners.forEach((fn) => fn(call));
        window.dispatchEvent(new StorageEvent("storage", { key: "flyingo_active_call" }));
      }
    });

    // ── 6. REAL-TIME WEBRTC AUDIO/VIDEO STREAM SIGNALING ──
    channel.on("broadcast", { event: "call_signal" }, ({ payload }) => {
      if (!payload) return;
      const { signal } = payload;
      if (signal && signal.recipientHandle?.toLowerCase() === cleanHandle) {
        callSignalListeners.forEach((fn) => fn(signal));
      }
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          handle: cleanHandle,
          name: currentUser.name || cleanHandle,
          onlineAt: Date.now(),
        });
      }
    });

    globalChannel = channel;

    // Background sync with Supabase database (pull any unread messages & requests)
    Realtime.pullRemoteMessages(cleanHandle);
    Realtime.pullRemoteRequests(cleanHandle);
  },

  /**
   * Broadcast a direct message to the recipient over Supabase WebSocket and save to database.
   */
  sendDirectMessage: (fromUser: UserProfile, toHandle: string, message: SavedMessage) => {
    if (!globalChannel) return;
    const cleanTo = toHandle.toLowerCase().trim();

    // 1. Broadcast over WebSocket for zero-latency delivery
    globalChannel.send({
      type: "broadcast",
      event: "new_dm",
      payload: {
        fromUser: {
          id: fromUser.id,
          handle: fromUser.handle,
          name: fromUser.name,
          avatar: fromUser.avatar,
        },
        toHandle: cleanTo,
        message,
      },
    }).catch(() => {});

    // 2. Persist to Supabase Database table (if table exists)
    supabase
      .from("flyingo_messages")
      .insert({
        id: message.id,
        sender_handle: fromUser.handle.toLowerCase(),
        recipient_handle: cleanTo,
        text: message.text || null,
        media_url: message.mediaUrl || null,
        media_type: message.mediaType || null,
        file_name: message.fileName || null,
        file_size: message.fileSize || null,
      })
      .then(() => {}, () => {});
  },

  /**
   * Broadcast a group message over Supabase WebSocket.
   */
  sendGroupMessage: (groupId: string, message: SavedMessage, members: string[]) => {
    if (!globalChannel) return;

    globalChannel.send({
      type: "broadcast",
      event: "new_group_message",
      payload: {
        groupId,
        message,
        members,
      },
    }).catch(() => {});

    // Persist to Supabase table
    supabase
      .from("flyingo_messages")
      .insert({
        id: message.id,
        sender_handle: message.senderHandle?.toLowerCase() || "unknown",
        group_id: groupId,
        text: message.text || null,
        media_url: message.mediaUrl || null,
        media_type: message.mediaType || null,
        file_name: message.fileName || null,
        file_size: message.fileSize || null,
      })
      .then(() => {}, () => {});
  },

  /**
   * Broadcast a friend request.
   */
  sendFriendRequest: (request: FriendRequest) => {
    if (!globalChannel) return;

    globalChannel.send({
      type: "broadcast",
      event: "friend_request",
      payload: { request },
    }).catch(() => {});

    // Persist to Supabase table
    supabase
      .from("flyingo_requests")
      .insert({
        id: request.id,
        from_handle: request.fromHandle.toLowerCase(),
        from_name: request.fromName,
        from_avatar: request.fromAvatar || null,
        to_handle: request.toHandle.toLowerCase(),
        status: request.status,
      })
      .then(() => {}, () => {});
  },

  /**
   * Broadcast a friend request response (accept/decline).
   */
  sendFriendRequestResponse: (toHandle: string, fromHandle: string, status: "accepted" | "declined") => {
    if (!globalChannel) return;

    globalChannel.send({
      type: "broadcast",
      event: "friend_request_response",
      payload: { toHandle, fromHandle, status },
    }).catch(() => {});

    // Update in Supabase table
    supabase
      .from("flyingo_requests")
      .update({ status })
      .match({ from_handle: toHandle.toLowerCase(), to_handle: fromHandle.toLowerCase() })
      .then(() => {}, () => {});
  },

  /**
   * Broadcast typing status.
   */
  sendTyping: (channelId: string, handle: string, isTyping: boolean) => {
    if (!globalChannel) return;
    globalChannel.send({
      type: "broadcast",
      event: "typing",
      payload: { channelId, handle, isTyping },
    }).catch(() => {});
  },

  /**
   * Broadcast call signaling (calling, answered, ended).
   */
  sendCallEvent: (call: CallSession | null) => {
    if (!globalChannel) return;
    globalChannel.send({
      type: "broadcast",
      event: "call_event",
      payload: { call },
    }).catch(() => {});
  },

  /**
   * Check if a user is currently online across any device worldwide.
   */
  isOnline: (handle: string): boolean => {
    if (!handle) return false;
    const clean = handle.toLowerCase().trim();
    if (activeOnlineHandles.has(clean)) return true;
    return Storage.isOnline(clean);
  },

  /**
   * Pull unread messages from Supabase cloud database if available.
   */
  pullRemoteMessages: async (myHandle: string) => {
    try {
      const clean = myHandle.toLowerCase();
      const { data, error } = await supabase
        .from("flyingo_messages")
        .select("*")
        .eq("recipient_handle", clean)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error || !data || data.length === 0) return;

      data.forEach((row: any) => {
        const sender = Storage.getUserByHandle(row.sender_handle) || {
          id: `u_${row.sender_handle}`,
          handle: row.sender_handle,
          name: `@${row.sender_handle}`,
          createdAt: Date.now(),
        };

        const msg: SavedMessage = {
          id: row.id,
          sender: "them",
          senderHandle: row.sender_handle,
          text: row.text || "",
          time: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          delivered: true,
          mediaUrl: row.media_url || undefined,
          mediaType: row.media_type || undefined,
          fileName: row.file_name || undefined,
          fileSize: row.file_size || undefined,
        };

        Storage.saveDirectMessage(sender, clean, msg);
      });

      window.dispatchEvent(new StorageEvent("storage", { key: "flyingo_convs_" + clean }));
    } catch (e) {}
  },

  /**
   * Pull pending friend requests from Supabase cloud database.
   */
  pullRemoteRequests: async (myHandle: string) => {
    try {
      const clean = myHandle.toLowerCase();
      const { data, error } = await supabase
        .from("flyingo_requests")
        .select("*")
        .eq("to_handle", clean)
        .eq("status", "pending")
        .limit(50);

      if (error || !data || data.length === 0) return;

      const saved = localStorage.getItem("flyingo_friend_requests");
      let localReqs: FriendRequest[] = [];
      if (saved) {
        try { localReqs = JSON.parse(saved); } catch (e) {}
      }

      data.forEach((row: any) => {
        if (!localReqs.some((r) => r.id === row.id)) {
          localReqs.unshift({
            id: row.id,
            fromHandle: row.from_handle,
            fromName: row.from_name || `@${row.from_handle}`,
            fromAvatar: row.from_avatar || "/default-avatar.jpg",
            toHandle: row.to_handle,
            status: row.status,
            createdAt: new Date(row.created_at).getTime(),
          });
        }
      });

      localStorage.setItem("flyingo_friend_requests", JSON.stringify(localReqs));
      window.dispatchEvent(new StorageEvent("storage", { key: "flyingo_friend_requests" }));
    } catch (e) {}
  },

  /**
   * Broadcast WebRTC stream signaling (offer, answer, candidate) to a peer.
   */
  sendCallSignal: (recipientHandle: string, senderHandle: string, type: "offer" | "answer" | "candidate", data: { sdp?: any; candidate?: any }) => {
    if (!globalChannel) return;
    globalChannel.send({
      type: "broadcast",
      event: "call_signal",
      payload: {
        signal: {
          recipientHandle: recipientHandle.toLowerCase(),
          senderHandle: senderHandle.toLowerCase(),
          type,
          ...data,
        },
      },
    }).catch(() => {});
  },

  onMessage: (fn: MessageCallback) => {
    messageListeners.add(fn);
    return () => messageListeners.delete(fn);
  },

  onFriendRequest: (fn: FriendRequestCallback) => {
    friendRequestListeners.add(fn);
    return () => friendRequestListeners.delete(fn);
  },

  onPresence: (fn: PresenceCallback) => {
    presenceListeners.add(fn);
    return () => presenceListeners.delete(fn);
  },

  onTyping: (fn: TypingCallback) => {
    typingListeners.add(fn);
    return () => typingListeners.delete(fn);
  },

  onCall: (fn: CallCallback) => {
    callListeners.add(fn);
    return () => callListeners.delete(fn);
  },

  onCallSignal: (fn: CallSignalCallback) => {
    callSignalListeners.add(fn);
    return () => callSignalListeners.delete(fn);
  },
};
