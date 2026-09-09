"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Storage, UserProfile, ChatCustomization, FriendRequest, PanicModeConfig, GroupChat, CallSession } from "@/lib/storage";
import { INSTAGRAM_GIFS, GIF_CATEGORIES, GifItem } from "@/lib/gifs";
import VerifiedBadge from "@/components/VerifiedBadge";
import AudioPlayer from "@/components/AudioPlayer";
import CallModal from "@/components/CallModal";

interface Message {
  id: string;
  sender: "me" | "them";
  senderHandle?: string; // actual handle who sent (for group chats cross-account display)
  text: string;
  time: string;
  delivered?: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "gif" | "file" | "audio" | "call";
  fileName?: string;
  fileSize?: string;
  audioDuration?: number;
  callInfo?: {
    type: "voice" | "video";
    duration?: number;
    status: "missed" | "ended" | "declined";
  };
  replyTo?: { id: string; text: string; mediaType?: string };
  reactions?: Array<{ emoji: string; users: string[] }>;
  isPinned?: boolean;
}

interface Conversation {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
  isGroup?: boolean;
  members?: string[];
}

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: "u_default",
    handle: "",
    name: "",
    createdAt: Date.now(),
    avatar: "/default-avatar.jpg",
  });
  const [chatSettings, setChatSettings] = useState<ChatCustomization>({
    sentTheme: "electric-rose",
    receivedTheme: "liquid-glass",
    wallpaper: "frost",
    fontSize: 15,
    sentOpacity: 100,
  });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "requests" | "groups">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [requestSentToast, setRequestSentToast] = useState("");

  // Group Chats State
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupAvatar, setNewGroupAvatar] = useState<string>("/default-avatar.jpg");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  // Rich Chat Input: Attachments (Photos, Docs, Files), Emojis & GIFs
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<"smileys" | "gestures" | "hearts" | "objects">("smileys");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGifCategory, setSelectedGifCategory] = useState<string>("trending");
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState<Array<{id:string; title:string; url:string; preview:string}>>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const gifSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; url: string; isImage: boolean } | null>(null);
  const fileInputChatRef = useRef<HTMLInputElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);

  // Voice Note Recording
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Typing Indicators
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio / Video Call Session
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  // Mobile master-detail navigation
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Reply-to state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Reaction emoji picker per message
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);

  // Long-press context menu (mobile)
  const [contextMenu, setContextMenu] = useState<{ msgId: string; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Panic Mode state
  const [isPanicActive, setIsPanicActive] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [panicModes, setPanicModes] = useState<PanicModeConfig[]>([]);
  const [newPanicName, setNewPanicName] = useState("");
  const [newPanicMyName, setNewPanicMyName] = useState("");
  const [newPanicMyHandle, setNewPanicMyHandle] = useState("");
  const [newPanicReceiverName, setNewPanicReceiverName] = useState("");
  const [newPanicReceiverHandle, setNewPanicReceiverHandle] = useState("");
  const [newPanicInitialThemMsg, setNewPanicInitialThemMsg] = useState("");
  const [newPanicInitialMyMsg, setNewPanicInitialMyMsg] = useState("");
  const [panicToast, setPanicToast] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadPanicModeState = () => {
    const activePanic = Storage.getActivePanicMode();
    const allModes = Storage.getPanicModes();
    setPanicModes(allModes);
    if (activePanic) {
      setIsPanicActive(true);
      const panicConv: Conversation = {
        id: `conv_${activePanic.receiverHandle}`,
        name: activePanic.receiverName,
        handle: activePanic.receiverHandle,
        avatar: "/default-avatar.jpg",
        lastMessage: activePanic.messages[activePanic.messages.length - 1]?.text || "Hello",
        time: activePanic.messages[activePanic.messages.length - 1]?.time || "Just now",
        unread: 0,
        online: true,
        messages: activePanic.messages.map((m, idx) => ({
          id: `panic_msg_${idx}`,
          sender: m.sender,
          text: m.text,
          time: m.time,
          delivered: true,
        })),
      };
      setConversations([panicConv]);
      setActiveConvId(panicConv.id);
    } else {
      setIsPanicActive(false);
    }
  };

  useEffect(() => {
    const user = Storage.getCurrentUser();
    setCurrentUser(user);
    setChatSettings(Storage.getSettings());
    loadPanicModeState();
    Storage.fetchRemoteUsers().then(users => {
      setAllUsers(users.filter(u => u.handle.toLowerCase() !== user.handle.toLowerCase()));
    });
    if (user.handle) {
      setFriendRequests(Storage.getFriendRequests(user.handle));
      setGroups(Storage.getGroups(user.handle));
      const activePanic = Storage.getActivePanicMode();
      if (!activePanic) {
        const saved = Storage.getSavedConversations(user.handle);
        if (saved && saved.length > 0) {
          setConversations(saved as any);
          setActiveConvId(saved[0].id);
        }
      }
    }
  }, []);

  const [syncTick, setSyncTick] = useState(0);

  // Real-time synchronization across browser tabs and background updates
  useEffect(() => {
    if (!currentUser.handle) return;

    const syncChats = () => {
      if (isPanicActive) return;
      const activeUser = Storage.getCurrentUser();
      if (!activeUser.handle) return;

      // Refresh friend requests & groups
      setFriendRequests(Storage.getFriendRequests(activeUser.handle));
      setGroups(Storage.getGroups(activeUser.handle));

      // Refresh conversation stubs
      const saved = Storage.getSavedConversations(activeUser.handle);
      setConversations(prev => {
        const prevKey = prev.map(c => `${c.id}_${c.lastMessage}_${c.time}`).join("|");
        const nextKey = saved.map(c => `${c.id}_${c.lastMessage}_${c.time}`).join("|");
        if (prevKey !== nextKey) {
          return saved as any;
        }
        return prev;
      });

      // Refresh typing users using symmetric channel ID (works across accounts!)
      const curConv = saved.find(c => c.id === activeConvId) || conversations.find(c => c.id === activeConvId);
      if (curConv && activeUser.handle) {
        const channelId = curConv.isGroup ? curConv.id : Storage.getDmKey(activeUser.handle, curConv.handle);
        const typers = Storage.getTypingUsers(channelId, activeUser.handle);
        setTypingUsers(typers);
      } else {
        setTypingUsers([]);
      }

      // Check active calls
      const liveCall = Storage.getActiveCall(activeUser.handle);
      setActiveCall(prev => {
        if (!liveCall) return null;
        if (liveCall.status === "ended" || liveCall.status === "declined") {
          setTimeout(() => Storage.clearCall(), 1200);
          return null;
        }
        return liveCall;
      });

      // Tick to re-evaluate active conversation messages
      setSyncTick(t => t + 1);
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (
        e.key.startsWith("flyingo_dm_") ||
        e.key.startsWith("flyingo_grpmsg_") ||
        e.key.startsWith("flyingo_convs_") ||
        e.key.startsWith("flyingo_groups_") ||
        e.key.startsWith("flyingo_typing_") ||
        e.key === "flyingo_active_call"
      ) {
        syncChats();
      }
    };

    window.addEventListener("storage", handleStorage);
    const interval = setInterval(syncChats, 350);

    // Heartbeat: mark current user as online every 30s
    Storage.pingOnline(currentUser.handle);
    const presenceInterval = setInterval(() => {
      Storage.pingOnline(currentUser.handle);
    }, 30000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
      clearInterval(presenceInterval);
    };
  }, [currentUser.handle, isPanicActive, activeConvId]);

  const activeConv = (() => {
    if (!activeConvId) return null;
    const found = conversations.find(c => c.id === activeConvId);
    if (found) return found;
    if (currentUser.handle) {
      const saved = Storage.getSavedConversations(currentUser.handle);
      const savedFound = saved.find(c => c.id === activeConvId);
      if (savedFound) return savedFound as any;
      const grps = Storage.getGroups(currentUser.handle);
      const grpFound = grps.find(g => g.id === activeConvId);
      if (grpFound) {
        return {
          id: grpFound.id,
          name: grpFound.name,
          handle: `group_${grpFound.members.length}_members`,
          avatar: grpFound.avatar || "/default-avatar.jpg",
          lastMessage: grpFound.description || `${grpFound.members.length} members`,
          time: "Just now",
          unread: 0,
          online: true,
          messages: [],
          isGroup: true,
          members: grpFound.members,
        } as Conversation;
      }
    }
    return null;
  })();

  // Dynamically load fresh messages for active conversation from isolated stores
  const getMessagesForConv = (conv: Conversation | null): Message[] => {
    if (!conv) return [];
    if (isPanicActive) return conv.messages || [];
    if (conv.isGroup) {
      return (Storage.getGroupMessages(conv.id) as any) as Message[];
    }
    if (currentUser.handle && conv.handle) {
      return (Storage.getDirectMessages(currentUser.handle, conv.handle) as any) as Message[];
    }
    return conv.messages || [];
  };

  const currentMessages = getMessagesForConv(activeConv);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length]);

  // ── Giphy Live API (via server-side proxy to avoid CORS) ──
  const fetchGiphy = async (query: string, category: string) => {
    setGifLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.set("category", category);
      }
      const res = await fetch(`/api/gifs?${params.toString()}`);
      const json = await res.json();
      if (json.gifs) {
        setGifResults(json.gifs);
      }
    } catch {
      // fallback silently
    } finally {
      setGifLoading(false);
    }
  };

  useEffect(() => {
    if (!showGifPicker) return;
    if (gifSearchRef.current) clearTimeout(gifSearchRef.current);
    gifSearchRef.current = setTimeout(() => {
      fetchGiphy(gifSearch, selectedGifCategory);
    }, gifSearch ? 400 : 0);
    return () => { if (gifSearchRef.current) clearTimeout(gifSearchRef.current); };
  }, [showGifPicker, gifSearch, selectedGifCategory]);


  const now = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const startConversation = (user: UserProfile) => {
    if (isPanicActive) return; // Prevent real contacts when in panic mode
    const cleanHandle = user.handle.toLowerCase();
    const convId = `conv_${cleanHandle}`;
    let convs = Storage.getSavedConversations(currentUser.handle);
    const exists = convs.find(c => !c.isGroup && c.handle.toLowerCase() === cleanHandle);
    if (exists) {
      setActiveConvId(exists.id);
    } else {
      const newConv: Conversation = {
        id: convId,
        name: user.name || `@${user.handle}`,
        handle: user.handle,
        avatar: user.avatar || "/default-avatar.jpg",
        lastMessage: "Say hi 👋",
        time: now(),
        unread: 0,
        online: true,
        messages: [],
      };
      convs = [newConv, ...convs];
      Storage.saveConversations(currentUser.handle, convs as any);
      setConversations(convs as any);
      setActiveConvId(newConv.id);
    }
    setSyncTick(t => t + 1);
    setMobileView("chat");
    setShowFindFriends(false);
    setViewingProfileUser(null);
    setActiveTab("chats");
  };

  // Auto-open target chat if navigated with ?user=handle
  useEffect(() => {
    if (typeof window === "undefined" || !currentUser.handle || isPanicActive) return;
    const params = new URLSearchParams(window.location.search);
    const targetHandle = params.get("user");
    if (targetHandle) {
      const cleanTarget = targetHandle.toLowerCase();
      const convs = Storage.getSavedConversations(currentUser.handle);
      const existing = convs.find(c => !c.isGroup && c.handle.toLowerCase() === cleanTarget);
      if (existing) {
        setActiveConvId(existing.id);
        setMobileView("chat");
      } else {
        const partner = Storage.getUserByHandle(cleanTarget) || {
          id: `u_${cleanTarget}`,
          handle: cleanTarget,
          name: cleanTarget,
          createdAt: Date.now(),
          avatar: "/default-avatar.jpg",
        };
        startConversation(partner);
      }
    }
  }, [currentUser.handle]);

  const sendMessage = (customMediaUrl?: string, customMediaType?: "image" | "gif") => {
    const text = messageText.trim();
    const fileToSend = attachedFile;
    const isFile = !!fileToSend && !fileToSend.isImage;
    const mediaToSend = customMediaUrl || (fileToSend ? fileToSend.url : attachedImage);
    const mediaTypeDetermined: "image" | "gif" | "file" | undefined = customMediaType || (isFile ? "file" : (mediaToSend ? "image" : undefined));

    if (!text && !mediaToSend) return;
    if (!activeConvId) return;
    const time = now();

    // ── SECRET ESCAPE COMMAND: --leave ──
    if (text.toLowerCase() === "--leave") {
      Storage.exitPanicMode();
      setIsPanicActive(false);
      setMessageText("");
      const realUser = Storage.getCurrentUser();
      setCurrentUser(realUser);
      setConversations([]);
      setActiveConvId(null);
      setPanicToast("Unlocked: Normal mode restored.");
      setTimeout(() => setPanicToast(""), 3500);
      return;
    }

    const activeConvForSend = conversations.find(c => c.id === activeConvId);
    if (!activeConvForSend) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: "me" as const,
      senderHandle: currentUser.handle, // store real handle for cross-account display
      text,
      time,
      delivered: true,
      mediaUrl: mediaToSend || undefined,
      mediaType: mediaTypeDetermined,
      fileName: isFile ? fileToSend.name : undefined,
      fileSize: isFile ? fileToSend.size : undefined,
      ...(replyingTo ? { replyTo: { id: replyingTo.id, text: replyingTo.text, mediaType: replyingTo.mediaType } } : {}),
    };

    if (isPanicActive) {
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: [...c.messages, newMsg] } : c));
    } else {
      if (activeConvForSend.isGroup) {
        Storage.saveGroupMessage(activeConvId, newMsg as any, activeConvForSend.members || []);
      } else if (activeConvForSend.handle) {
        Storage.saveDirectMessage(currentUser, activeConvForSend.handle, newMsg as any);
      }
      // Refresh conversation list so sidebar shows updated preview & time
      const saved = Storage.getSavedConversations(currentUser.handle);
      setConversations(saved as any);
      setSyncTick(t => t + 1);
    }

    if (activeConv && currentUser.handle) {
      const channelId = activeConv.isGroup ? activeConv.id : Storage.getDmKey(currentUser.handle, activeConv.handle);
      Storage.setTypingStatus(currentUser.handle, channelId, false);
    }

    setMessageText("");
    setAttachedImage(null);
    setAttachedFile(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
  };

  const handleTyping = () => {
    if (!activeConv || !currentUser.handle || isPanicActive) return;
    const channelId = activeConv.isGroup ? activeConv.id : Storage.getDmKey(currentUser.handle, activeConv.handle);
    Storage.setTypingStatus(currentUser.handle, channelId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      Storage.setTypingStatus(currentUser.handle, channelId, false);
    }, 3000);
  };

  // Voice recording handlers (with graceful fallback for hardware/permissions)
  const startVoiceRecording = async () => {
    setIsRecordingAudio(true);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(d => d + 1);
    }, 1000);

    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.start();
      }
    } catch (err) {
      console.warn("Microphone hardware or permission not available, operating in simulated voice note mode:", err);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  const stopAndSendVoiceRecording = () => {
    const duration = recordingDuration > 0 ? recordingDuration : 3;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);
    setRecordingDuration(0);

    if (mediaRecorderRef.current && audioChunksRef.current.length > 0) {
      const recorder = mediaRecorderRef.current;
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendVoiceMessage(base64Audio, duration);
        };
        reader.readAsDataURL(audioBlob);
        recorder.stream.getTracks().forEach(t => t.stop());
      };
      recorder.stop();
    } else {
      // Clean fallback audio note so user can always test even without microphone access
      const sampleAudio = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAP//AAD//wAA//8AAP//";
      sendVoiceMessage(sampleAudio, duration);
    }
  };

  const sendVoiceMessage = (audioUrl: string, durationSecs: number) => {
    if (!activeConvId) return;
    const time = now();
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: "me",
      senderHandle: currentUser.handle,
      text: "",
      time,
      delivered: true,
      mediaUrl: audioUrl,
      mediaType: "audio",
      audioDuration: durationSecs,
    };

    const activeConvForSend = conversations.find(c => c.id === activeConvId);
    if (!activeConvForSend) return;

    if (activeConvForSend.isGroup) {
      Storage.saveGroupMessage(activeConvId, newMsg as any, activeConvForSend.members || []);
    } else if (activeConvForSend.handle) {
      Storage.saveDirectMessage(currentUser, activeConvForSend.handle, newMsg as any);
    }

    const saved = Storage.getSavedConversations(currentUser.handle);
    setConversations(saved as any);
    setSyncTick(t => t + 1);
  };

  // Calling handlers
  const handleStartCall = (type: "voice" | "video") => {
    if (!activeConv) return;
    const target = activeConv.isGroup
      ? ((activeConv.members as string[] | undefined)?.find((m: string) => m.toLowerCase() !== currentUser.handle.toLowerCase()) || activeConv.handle)
      : activeConv.handle;
    const session = Storage.initiateCall(currentUser, target, type);
    setActiveCall(session);
  };

  const handleAcceptCall = () => {
    if (!activeCall) return;
    Storage.updateCallStatus(activeCall.callId, "accepted");
    setActiveCall({ ...activeCall, status: "accepted" });
  };

  const handleDeclineCall = () => {
    if (!activeCall) return;
    Storage.updateCallStatus(activeCall.callId, "declined");
    Storage.clearCall();
    setActiveCall(null);
  };

  const handleEndCall = (durationSecs: number) => {
    if (!activeCall) return;
    Storage.updateCallStatus(activeCall.callId, "ended");

    const durationText = durationSecs > 0
      ? `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s`
      : "Missed";

    const callMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: "me",
      senderHandle: currentUser.handle,
      text: `${activeCall.type === "video" ? "📹 Video Call" : "📞 Voice Call"} • ${durationText}`,
      time: now(),
      delivered: true,
      mediaType: "call",
      callInfo: {
        type: activeCall.type,
        duration: durationSecs,
        status: durationSecs > 0 ? "ended" : "missed",
      },
    };

    if (activeConv?.handle) {
      Storage.saveDirectMessage(currentUser, activeConv.handle, callMsg as any);
    }

    Storage.clearCall();
    setActiveCall(null);
    setSyncTick(t => t + 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImg = file.type.startsWith("image/");
      const formatBytes = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / 1048576).toFixed(1) + " MB";
      };

      const reader = new FileReader();
      reader.onload = loadEvt => {
        if (loadEvt.target?.result) {
          const dataUrl = loadEvt.target.result as string;
          if (isImg) {
            setAttachedImage(dataUrl);
            setAttachedFile({ name: file.name, size: formatBytes(file.size), url: dataUrl, isImage: true });
          } else {
            setAttachedFile({ name: file.name, size: formatBytes(file.size), url: dataUrl, isImage: false });
          }
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputChatRef.current) fileInputChatRef.current.value = "";
  };

  const handleGroupAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = loadEvt => {
        if (loadEvt.target?.result) {
          setNewGroupAvatar(loadEvt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
    if (groupAvatarInputRef.current) groupAvatarInputRef.current.value = "";
  };

  // Profile Viewing with 24h tracker integration
  const openUserProfile = (u: UserProfile) => {
    setViewingProfileUser(u);
    // Record visit to their profile so it shows in their Admin Panel 24h visitors tracker!
    if (currentUser.handle) {
      Storage.recordProfileVisit(u.handle, currentUser.handle, currentUser.name);
    }
  };

  const handleSendFriendRequest = (targetHandle: string) => {
    const success = Storage.sendFriendRequest(currentUser, targetHandle);
    if (success) {
      setRequestSentToast(`✓ Friend request sent to @${targetHandle}!`);
      setTimeout(() => setRequestSentToast(""), 3000);
    }
  };

  const handleAcceptRequest = (req: FriendRequest) => {
    Storage.respondFriendRequest(req.id, "accepted");
    setFriendRequests(Storage.getFriendRequests(currentUser.handle));
    // Start chat with requester (find from allUsers or construct minimal UserProfile fallback)
    let found = allUsers.find(u => u.handle.toLowerCase() === req.fromHandle.toLowerCase());
    if (!found) {
      found = {
        id: `u_${req.fromHandle}`,
        name: req.fromName,
        handle: req.fromHandle,
        avatar: req.fromAvatar || "/default-avatar.jpg",
        createdAt: Date.now(),
      };
    }
    startConversation(found);
    setActiveTab("chats");
  };

  const handleDeclineRequest = (req: FriendRequest) => {
    Storage.respondFriendRequest(req.id, "declined");
    setFriendRequests(Storage.getFriendRequests(currentUser.handle));
  };

  const startGroupConversation = (group: GroupChat) => {
    if (isPanicActive) return;
    let convs = Storage.getSavedConversations(currentUser.handle);
    const exists = convs.find(c => c.isGroup && c.id === group.id);
    if (exists) {
      setActiveConvId(exists.id);
    } else {
      const newConv: Conversation = {
        id: group.id,
        name: group.name,
        handle: `group_${group.members.length}_members`,
        avatar: group.avatar || "/default-avatar.jpg",
        lastMessage: group.description || `${group.members.length} members`,
        time: now(),
        unread: 0,
        online: true,
        messages: [],
        isGroup: true,
        members: group.members,
      };
      convs = [newConv, ...convs];
      Storage.saveConversations(currentUser.handle, convs as any);
      setConversations(convs as any);
      setActiveConvId(newConv.id);
    }
    setSyncTick(t => t + 1);
    setMobileView("chat");
    setActiveTab("chats");
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !currentUser.handle) return;
    const newGroup = Storage.createGroup(
      newGroupName.trim(),
      currentUser.handle,
      selectedGroupMembers,
      newGroupDesc.trim(),
      newGroupAvatar
    );
    setGroups(Storage.getGroups(currentUser.handle));
    setShowCreateGroup(false);
    setNewGroupName("");
    setNewGroupDesc("");
    setNewGroupAvatar("/default-avatar.jpg");
    setSelectedGroupMembers([]);
    startGroupConversation(newGroup);
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(friendSearch.toLowerCase()) ||
    u.handle.toLowerCase().includes(friendSearch.toLowerCase())
  );

  const sentGradients: Record<string, string> = {
    "electric-rose": "from-[#b70942] to-[#da2e59]",
    "midnight-violet": "from-[#7d2dce] to-[#51138f]",
    "emerald-glow": "from-[#008190] to-[#00525c]",
    "ocean-cyan": "from-[#00daf3] to-[#007482]",
    "deep-obsidian": "from-[#283044] to-[#131b2e]",
  };

  const receivedBubbleStyles: Record<string, string> = {
    "liquid-glass": "bg-white/80 backdrop-blur-md text-on-surface shadow-sm",
    "soft-slate": "bg-surface-container-low text-on-surface shadow-sm",
    "deep-obsidian": "bg-[#283044] text-white shadow-md",
    "lilac-mist": "bg-[#efdbff]/60 text-on-surface shadow-sm",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar hideBottomNav={mobileView === "chat"} />

      {/* ── LEFT PANE ── */}
      <section className={`md:ml-[72px] w-full md:w-[390px] flex-shrink-0 flex-col bg-surface-container-lowest/90 backdrop-blur-2xl shadow-[4px_0_24px_rgba(19,27,46,0.03)] z-10 border-r border-outline-variant/10 overflow-hidden ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}>

        {/* Header with REAL User DP and Dynamic Verified Badge */}
        <div className="p-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/profile")}
                className="w-11 h-11 rounded-2xl overflow-hidden shadow-md flex items-center justify-center p-0.5 bg-surface-container border border-outline-variant/20 cursor-pointer"
                title="View Bio Studio"
              >
                <img
                  src={currentUser.avatar || "/default-avatar.jpg"}
                  alt={currentUser.name || "Profile"}
                  className="w-full h-full object-cover rounded-xl"
                />
              </motion.button>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-surface-container-lowest" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-title-md font-bold truncate text-on-surface">
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
              <span className="font-caption text-primary font-mono text-[11px] truncate">
                @{currentUser.handle}
              </span>
            </div>
          </div>

            <motion.button
              whileHover={{ scale: 1.08, rotate: 5 }} whileTap={{ scale: 0.92 }}
              onClick={() => { setShowFindFriends(true); Storage.fetchRemoteUsers().then(users => setAllUsers(users.filter(u => u.handle.toLowerCase() !== currentUser.handle.toLowerCase()))); }}
              title="Find Friends / Send Friend Request"
              className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/30 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </motion.button>
          </div>

        {/* Search - Full Circular Pill Shape */}
        <div className="px-5 pb-2">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-11 pr-5 py-2.5 rounded-full bg-surface-container-low/80 focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 text-on-surface font-body-sm transition-all outline-none placeholder:text-on-surface-variant/60"
            />
          </div>
        </div>

        {/* 3 Tabs: Chats, Groups & Friend Requests - Full Circular Pill Shape Container */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-full">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 py-2 px-2.5 rounded-full font-label-md text-[12px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "chats"
                  ? "bg-surface-container-lowest text-primary font-bold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Chats</span>
              <span className="px-1.5 py-0.5 rounded-full font-caption text-[10px] bg-primary/10 text-primary font-bold">
                {conversations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-2 px-2.5 rounded-full font-label-md text-[12px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "groups"
                  ? "bg-surface-container-lowest text-tertiary font-bold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Groups</span>
              <span className="px-1.5 py-0.5 rounded-full font-caption text-[10px] bg-tertiary/10 text-tertiary font-bold">
                {groups.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-2 px-2.5 rounded-full font-label-md text-[12px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "requests"
                  ? "bg-surface-container-lowest text-secondary font-bold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>Requests</span>
              {friendRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full font-caption text-[10px] bg-secondary text-white font-bold animate-pulse">
                  {friendRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Flamingoos Quick Tray */}
        <div className="px-5 pb-3">
          <div 
            onClick={() => router.push("/flamingoos")}
            className="p-3 rounded-2xl bg-gradient-to-r from-surface-container-low to-surface-container/60 flex items-center gap-3 shadow-xs cursor-pointer hover:bg-surface-container transition-all"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-surface-container-lowest flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px] text-secondary">auto_stories</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow-xs text-[10px] font-bold">+</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-label-md font-semibold text-on-surface">Flamingoos</span>
                <span className="font-caption text-[9px] text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full font-bold uppercase">Live</span>
              </div>
              <p className="font-body-sm text-on-surface-variant text-[11px] truncate">Post or view ephemeral flamingoos...</p>
            </div>
          </div>
        </div>

        {/* TAB 1: CHATS LIST */}
        {activeTab === "chats" && (
          <div className="flex-1 px-4 overflow-y-auto flex flex-col pb-4 gap-1.5">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center text-center mt-6 px-3">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/40 mb-3">
                  <span className="material-symbols-outlined text-[32px]">chat</span>
                </div>
                <h3 className="font-title-md font-semibold text-on-surface">No Conversations Yet</h3>
                <p className="font-caption text-on-surface-variant mt-1 leading-relaxed">
                  Click the &apos;+&apos; icon or find users to start a conversation.
                </p>
                <button
                  onClick={() => setShowFindFriends(true)}
                  className="mt-3 px-4 py-2 rounded-2xl bg-primary text-white font-label-md text-[12px] shadow-xs cursor-pointer"
                >
                  Find Users
                </button>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeConvId;
                return (
                  <motion.div
                    key={conv.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setMobileView("chat");
                    }}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary-container/20 text-on-primary-container shadow-sm border border-primary/20"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.avatar || "/default-avatar.jpg"}
                        alt={conv.name}
                        className="w-11 h-11 rounded-2xl object-cover"
                      />
                      {!conv.isGroup && (
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-surface-container-lowest ${Storage.isOnline(conv.handle) ? "bg-green-500" : "bg-gray-400"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-title-md font-semibold text-on-surface truncate text-[14px]">
                          {conv.name}
                        </span>
                        <span className="font-caption text-on-surface-variant text-[11px]">{conv.time}</span>
                      </div>
                      <p className="font-body-sm text-on-surface-variant truncate text-[12px] mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: GROUPS LIST */}
        {activeTab === "groups" && (
          <div className="flex-1 px-4 overflow-y-auto flex flex-col pb-4 gap-2">
            <div className="flex items-center justify-between py-1">
              <span className="font-label-md text-on-surface font-semibold text-[13px]">
                Your Groups ({groups.length})
              </span>
              <button
                onClick={() => {
                  setShowCreateGroup(true);
                  // refresh remote users
                  Storage.fetchRemoteUsers().then(users => setAllUsers(users.filter(u => u.handle.toLowerCase() !== currentUser.handle.toLowerCase())));
                }}
                className="text-tertiary hover:underline font-caption text-[11px] font-bold cursor-pointer"
              >
                + New Group
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="flex flex-col items-center text-center mt-10 px-3">
                <div className="w-14 h-14 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary mb-3">
                  <span className="material-symbols-outlined text-[28px]">groups</span>
                </div>
                <p className="font-title-md font-semibold text-on-surface">No Groups Created</p>
                <p className="font-caption text-on-surface-variant mt-1 text-[12px]">
                  Create group chats to talk with multiple friends together.
                </p>
                <button
                  onClick={() => {
                    setShowCreateGroup(true);
                    Storage.fetchRemoteUsers().then(users => setAllUsers(users.filter(u => u.handle.toLowerCase() !== currentUser.handle.toLowerCase())));
                  }}
                  className="mt-3 px-4 py-2 rounded-2xl bg-tertiary text-white font-label-md text-[12px] shadow-xs cursor-pointer"
                >
                  Create Your First Group
                </button>
              </div>
            ) : (
              groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => startGroupConversation(group)}
                  className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center gap-3 cursor-pointer hover:bg-surface-container transition-all shadow-xs"
                >
                  {group.avatar && group.avatar !== "/default-avatar.jpg" ? (
                    <img
                      src={group.avatar}
                      alt={group.name}
                      className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-outline-variant/20 shadow-xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-tertiary/20 flex items-center justify-center flex-shrink-0 text-tertiary font-bold">
                      <span className="material-symbols-outlined text-[22px]">groups</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-title-md text-[13px] font-bold text-on-surface truncate">{group.name}</h4>
                      <span className="font-caption text-[10px] text-on-surface-variant">{group.members.length} members</span>
                    </div>
                    <p className="font-caption text-on-surface-variant truncate text-[11px] mt-0.5">
                      {group.description || `Members: ${group.members.map(m => `@${m}`).join(", ")}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: FRIEND REQUESTS */}
        {activeTab === "requests" && (
          <div className="flex-1 px-4 overflow-y-auto flex flex-col pb-4 gap-2">
            <div className="flex items-center justify-between py-1">
              <span className="font-label-md text-on-surface font-semibold text-[13px]">
                Incoming Requests ({friendRequests.length})
              </span>
              <button
                onClick={() => setShowFindFriends(true)}
                className="text-primary hover:underline font-caption text-[11px] cursor-pointer"
              >
                Send Request +
              </button>
            </div>

            {friendRequests.length === 0 ? (
              <div className="flex flex-col items-center text-center mt-10 px-3">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/40 mb-3">
                  <span className="material-symbols-outlined text-[28px]">group_add</span>
                </div>
                <p className="font-title-md font-semibold text-on-surface">No Pending Friend Requests</p>
                <p className="font-caption text-on-surface-variant mt-1 text-[12px]">
                  When someone sends you a friend request, it will appear here.
                </p>
              </div>
            ) : (
              friendRequests.map(req => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div 
                      onClick={() => {
                        const target = Storage.getUserByHandle(req.fromHandle);
                        if (target) openUserProfile(target);
                      }}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={req.fromAvatar || "/default-avatar.jpg"}
                        alt={req.fromName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="font-title-md text-[13px] font-bold text-on-surface truncate">{req.fromName}</p>
                        <p className="font-caption text-[11px] text-primary font-mono truncate">@{req.fromHandle}</p>
                      </div>
                    </div>
                    <span className="font-caption text-on-surface-variant text-[10px]">Just now</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-0.5">
                    <button
                      onClick={() => handleDeclineRequest(req)}
                      className="py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-caption text-[11px] cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      className="py-1.5 rounded-xl bg-primary text-white font-caption font-bold text-[11px] shadow-xs cursor-pointer"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </section>

      {/* ── RIGHT MAIN CHAT AREA (INSTAGRAM STYLE FULL SCREEN ON MOBILE) ── */}
      <main className={`fixed inset-0 z-30 md:static md:flex-1 md:z-0 flex-col h-screen overflow-hidden bg-surface ${mobileView === "list" ? "hidden md:flex" : "flex"}`}>
        {requestSentToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-tertiary text-white font-label-md text-[13px] shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {requestSentToast}
          </motion.div>
        )}

        {activeConv ? (
          <>
            {/* Active Header with Partner Profile Inspection */}
            <header className="px-4 md:px-8 py-3.5 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between z-20 flex-shrink-0">
              {/* Mobile back button */}
              <button
                onClick={() => setMobileView("list")}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container mr-1 cursor-pointer flex-shrink-0"
                title="Back"
              >
                <span className="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div 
                onClick={() => {
                  if (activeConv.isGroup) {
                    setShowGroupInfo(true);
                  } else {
                    const partner = Storage.getUserByHandle(activeConv.handle);
                    if (partner) openUserProfile(partner);
                  }
                }}
                className="flex items-center gap-3.5 cursor-pointer hover:opacity-85 transition-opacity flex-1 min-w-0"
                title={activeConv.isGroup ? "View group info" : "Click to view full user profile"}
              >
                {activeConv.isGroup ? (
                  activeConv.avatar && activeConv.avatar !== "/default-avatar.jpg" ? (
                    <img
                      src={activeConv.avatar}
                      alt={activeConv.name}
                      className="w-11 h-11 rounded-full object-cover shadow-xs border border-outline-variant/20"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary font-bold shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">groups</span>
                    </div>
                  )
                ) : (
                  <img
                    src={activeConv.avatar || "/default-avatar.jpg"}
                    alt={activeConv.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-title-md font-bold text-on-surface">{activeConv.name}</h2>
                    {!activeConv.isGroup && (() => {
                      const partner = Storage.getUserByHandle(activeConv.handle);
                      if (partner?.verifiedBadge?.enabled) {
                        return (
                          <VerifiedBadge
                            icon={partner.verifiedBadge.icon || "verified"}
                            color={partner.verifiedBadge.color || "#00daf3"}
                            size={22}
                            title={partner.verifiedBadge.label || "Verified"}
                          />
                        );
                      }
                      return <VerifiedBadge size={22} />;
                    })()}
                  </div>
                  <p className="font-caption text-primary font-mono text-[11px]">
                    {typingUsers.length > 0 ? (
                      <span className="text-tertiary font-bold animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary inline-block animate-ping" />
                        {activeConv.isGroup ? `@${typingUsers[0]} is typing...` : "typing..."}
                      </span>
                    ) : activeConv.isGroup ? (
                      `${activeConv.members?.length || 0} members • Tap to view info`
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${Storage.isOnline(activeConv.handle) ? "bg-green-500" : "bg-gray-400"}`} />
                        {Storage.isOnline(activeConv.handle) ? "Online" : "Offline"}
                        <span className="text-on-surface-variant"> • @{activeConv.handle}</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!activeConv.isGroup && (
                  <>
                    <button
                      onClick={() => handleStartCall("voice")}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer transition-colors"
                      title="Voice Call"
                    >
                      <span className="material-symbols-outlined text-[20px]">call</span>
                    </button>
                    <button
                      onClick={() => handleStartCall("video")}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer transition-colors"
                      title="Video Call"
                    >
                      <span className="material-symbols-outlined text-[20px]">videocam</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => router.push("/settings")}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
                  title="Chat Customizations"
                >
                  <span className="material-symbols-outlined text-[20px]">palette</span>
                </button>
              </div>
            </header>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto px-8 py-5 flex flex-col gap-3 bg-gradient-to-b from-surface to-surface-container-low/20">
              {currentMessages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[30px] text-primary">waving_hand</span>
                  </div>
                  <p className="font-body-md text-on-surface-variant">
                    Say hi to <span className="font-semibold text-on-surface">{activeConv.name}</span> (@{activeConv.handle})! 👋
                  </p>
                </div>
              ) : (
                currentMessages.map(msg => {
                  // Use senderHandle for accurate per-account ownership; fall back to legacy sender field
                  const isMe = msg.senderHandle
                    ? msg.senderHandle.toLowerCase() === currentUser.handle.toLowerCase()
                    : msg.sender === "me";
                  const avatarSrc = isMe
                    ? (currentUser.avatar || "/default-avatar.jpg")
                    : (activeConv.avatar || "/default-avatar.jpg");
                  const displayName = isMe
                    ? (currentUser.name || `@${currentUser.handle}`)
                    : activeConv.name;

                  // For group chats, resolve sender's actual profile for avatar/name
                  let senderAvatar = avatarSrc;
                  let senderDisplayName = displayName;
                  if (activeConv.isGroup && !isMe && msg.senderHandle) {
                    const senderProfile = Storage.getUserByHandle(msg.senderHandle);
                    senderAvatar = senderProfile?.avatar || "/default-avatar.jpg";
                    senderDisplayName = senderProfile?.name || msg.senderHandle;
                  }

                  // Get channel key for reactions/pins
                  const channelKey = activeConv.isGroup
                    ? activeConv.id
                    : Storage.getDmKey(currentUser.handle, activeConv.handle);

                  return (
                    <div
                      key={msg.id}
                      id={`msg_${msg.id}`}
                      className={`relative group flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      {/* Pinned indicator */}
                      {(msg as any).isPinned && (
                        <div className="flex items-center gap-1 mb-0.5 px-1 text-[10px] text-on-surface-variant/60 font-caption">
                          <span className="material-symbols-outlined text-[12px]">push_pin</span>
                          Pinned
                        </div>
                      )}

                      {/* Reply-to context with Click to Jump */}
                      {(msg as any).replyTo && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetId = `msg_${(msg as any).replyTo?.id}`;
                            const targetEl = document.getElementById(targetId);
                            if (targetEl) {
                              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
                              targetEl.classList.add("ring-2", "ring-primary", "rounded-2xl", "transition-all", "duration-300");
                              setTimeout(() => {
                                targetEl.classList.remove("ring-2", "ring-primary", "rounded-2xl");
                              }, 1200);
                            }
                          }}
                          className={`mb-1 px-3 py-1.5 rounded-xl border-l-2 border-primary bg-surface-container text-[11px] text-on-surface-variant max-w-[220px] truncate cursor-pointer hover:bg-surface-container-high transition-all ${isMe ? "mr-10" : "ml-10"}`}
                          title="Click to jump to original message"
                        >
                          <span className="font-bold text-primary">↩ </span>
                          {(msg as any).replyTo.text || (msg as any).replyTo.mediaType || "Message"}
                        </div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        drag="x"
                        dragConstraints={{ left: -60, right: 60 }}
                        dragElastic={0.25}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -30 || info.offset.x > 30) {
                            setReplyingTo(msg);
                          }
                        }}
                        onDoubleClick={() => {
                          // Double-tap: heart react
                          const key = activeConv.isGroup ? activeConv.id : Storage.getDmKey(currentUser.handle, activeConv.handle);
                          Storage.toggleReaction(key, msg.id, "❤️", currentUser.handle, !!activeConv.isGroup);
                          setSyncTick(t => t + 1);
                        }}
                        onPointerDown={(e) => {
                          // Long-press for mobile context menu
                          const x = e.clientX;
                          const y = e.clientY;
                          longPressTimerRef.current = setTimeout(() => {
                            setContextMenu({ msgId: msg.id, x, y });
                          }, 550);
                        }}
                        onPointerUp={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                        onPointerLeave={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
                        className={`flex items-end gap-2.5 max-w-[80%] md:max-w-[75%] ${isMe ? "self-end ml-auto flex-row-reverse" : "self-start"} touch-pan-y cursor-pointer`}
                      >
                        {/* User DP beside message bubble */}
                        <img
                          src={senderAvatar}
                          alt={senderDisplayName}
                          title={senderDisplayName}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0 shadow-xs border border-outline-variant/15 mb-0.5"
                        />
                        <div
                          className={`relative p-3.5 rounded-3xl shadow-sm ${
                            isMe
                              ? `rounded-br-xs bg-gradient-to-br ${sentGradients[chatSettings.sentTheme] || "from-primary to-primary-container"} text-white shadow-md`
                              : `rounded-bl-xs ${receivedBubbleStyles[chatSettings.receivedTheme] || "bg-surface-container-lowest text-on-surface"}`
                          }`}
                          style={{ fontSize: `${chatSettings.fontSize}px` }}
                        >
                          {/* In group chats show sender name above their messages */}
                          {activeConv.isGroup && !isMe && (
                            <p className="font-caption text-[10px] font-bold mb-1 opacity-70">@{msg.senderHandle || activeConv.handle}</p>
                          )}
                          {msg.mediaType === "audio" && msg.mediaUrl ? (
                            <div className="py-1">
                              <AudioPlayer src={msg.mediaUrl} durationSeconds={msg.audioDuration} isMe={isMe} />
                            </div>
                          ) : msg.mediaType === "call" ? (
                            <div className="flex items-center gap-3 py-1 px-1 min-w-[180px]">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                msg.callInfo?.status === "missed" ? "bg-error/25 text-error" : isMe ? "bg-white/20 text-white" : "bg-primary/20 text-primary"
                              }`}>
                                <span className="material-symbols-outlined text-[20px]">
                                  {msg.callInfo?.type === "video" ? "videocam" : "call"}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="font-title-md text-[13px] font-bold truncate">
                                  {msg.callInfo?.type === "video" ? "Video Call" : "Voice Call"}
                                </p>
                                <p className="font-caption text-[11px] opacity-80">
                                  {msg.callInfo?.status === "missed" ? "Missed" : `${Math.floor((msg.callInfo?.duration || 0) / 60)}m ${(msg.callInfo?.duration || 0) % 60}s`}
                                </p>
                              </div>
                            </div>
                          ) : msg.mediaType === "file" ? (
                            <div className="mb-2 p-3 rounded-2xl bg-black/15 flex items-center gap-3 border border-white/10 max-w-xs">
                              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white flex-shrink-0">
                                <span className="material-symbols-outlined text-[20px]">description</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-title-md text-[12px] font-bold truncate text-white">{msg.fileName || "Attachment Document"}</p>
                                <p className="font-caption text-[10px] text-white/70">{msg.fileSize || "File"}</p>
                              </div>
                              {msg.mediaUrl && (
                                <a
                                  href={msg.mediaUrl}
                                  download={msg.fileName || "attachment"}
                                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer transition-colors flex-shrink-0"
                                  title="Download File"
                                >
                                  <span className="material-symbols-outlined text-[16px]">download</span>
                                </a>
                              )}
                            </div>
                          ) : msg.mediaUrl ? (
                            <div className="mb-2 rounded-2xl overflow-hidden max-w-xs shadow-xs">
                              <img
                                src={msg.mediaUrl}
                                alt="attachment"
                                className="w-full h-auto max-h-64 object-cover rounded-2xl"
                              />
                            </div>
                          ) : null}
                          {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}
                          {!isPanicActive && (
                            <span className="block font-caption text-right text-[10px] opacity-70 mt-1">{msg.time}</span>
                          )}
                        </div>

                        {/* ── HOVER ACTION BAR (desktop PC) — sits right beside the bubble ── */}
                        <div className={`hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl shadow-lg border border-outline-variant/15 px-1 py-0.5`}>
                          {/* Reply */}
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer transition-colors"
                            title="Reply"
                          >
                            <span className="material-symbols-outlined text-[16px]">reply</span>
                          </button>
                          {/* React */}
                          <button
                            onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container cursor-pointer transition-colors"
                            title="React"
                          >
                            <span className="material-symbols-outlined text-[16px]">sentiment_satisfied</span>
                          </button>
                          {/* Pin */}
                          <button
                            onClick={() => {
                              Storage.togglePin(channelKey, msg.id, !!activeConv.isGroup);
                              setSyncTick(t => t + 1);
                            }}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center hover:bg-surface-container cursor-pointer transition-colors ${msg.isPinned ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                            title={msg.isPinned ? "Unpin" : "Pin"}
                          >
                            <span className="material-symbols-outlined text-[16px]">push_pin</span>
                          </button>
                          {/* Delete for everyone */}
                          <button
                            onClick={() => {
                              Storage.deleteMessage(channelKey, msg.id, !!activeConv.isGroup);
                              setSyncTick(t => t + 1);
                            }}
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 cursor-pointer transition-colors"
                            title="Delete for everyone"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </motion.div>

                      {/* Full Instagram-style emoji picker */}
                      {reactionPickerMsgId === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.85, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className={`bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 z-30 mb-1 w-72 ${isMe ? "self-end" : "self-start ml-9"}`}
                        >
                          {/* Quick row */}
                          <div className="flex items-center justify-around px-3 pt-3 pb-2 border-b border-outline-variant/10">
                            {["❤️", "😂", "😮", "😢", "👏", "🔥"].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  Storage.toggleReaction(channelKey, msg.id, emoji, currentUser.handle, !!activeConv.isGroup);
                                  setReactionPickerMsgId(null);
                                  setSyncTick(t => t + 1);
                                }}
                                className="text-2xl hover:scale-130 transition-transform cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                            <button onClick={() => setReactionPickerMsgId(null)} className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-error cursor-pointer rounded-full hover:bg-surface-container">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                          {/* Full emoji grid */}
                          <div className="grid grid-cols-8 gap-0.5 p-2 max-h-52 overflow-y-auto">
                            {[
                              "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🫣","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕",
                              "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","🫀","♥️","💋","👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏",
                              "🔥","⭐","🌟","✨","💥","🎉","🎊","🎈","🎁","🏆","🥇","🎯","💯","🚀","🌈","❄️","⚡","🌊","🍕","🍔","🍟","🌮","🍦","🎂","🍰","🧁","🍫","🍬","🍭","🥂","🎵","🎶","🎸","🎤","🎬","🌺","🌸","🌹","🌷","🌻","🍀","🌿","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐙","🦋"
                            ].map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  Storage.toggleReaction(channelKey, msg.id, emoji, currentUser.handle, !!activeConv.isGroup);
                                  setReactionPickerMsgId(null);
                                  setSyncTick(t => t + 1);
                                }}
                                className="text-lg p-1 rounded-lg hover:bg-surface-container hover:scale-125 transition-all cursor-pointer text-center"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Reaction badges */}
                      {(msg as any).reactions && (msg as any).reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-0.5 ${isMe ? "justify-end mr-10" : "ml-10"}`}>
                          {(msg as any).reactions.map((r: { emoji: string; users: string[] }) => (
                            <button
                              key={r.emoji}
                              onClick={() => {
                                Storage.toggleReaction(channelKey, msg.id, r.emoji, currentUser.handle, !!activeConv.isGroup);
                                setSyncTick(t => t + 1);
                              }}
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[12px] border transition-colors cursor-pointer ${r.users.includes(currentUser.handle) ? "bg-primary/15 border-primary/30 text-primary" : "bg-surface-container border-outline-variant/20 text-on-surface"}`}
                              title={r.users.join(", ")}
                            >
                              {r.emoji} <span className="text-[10px] font-bold">{r.users.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* ── LIVE TYPING INDICATOR BUBBLE (Instagram / WhatsApp style) ── */}
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="flex items-end gap-2.5 self-start"
                >
                  <img
                    src={
                      Storage.getUserByHandle(typingUsers[0])?.avatar ||
                      (activeConv.isGroup ? "/default-avatar.jpg" : activeConv.avatar) ||
                      "/default-avatar.jpg"
                    }
                    alt="Typing"
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 shadow-xs border border-outline-variant/15 mb-0.5"
                  />
                  <div className="py-3 px-4 rounded-2xl rounded-bl-xs bg-surface-container-low border border-outline-variant/10 shadow-xs flex items-center gap-1.5">
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/70"
                    />
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/70"
                    />
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/70"
                    />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar — Floating style, no bg */}
            <div className="px-4 md:px-6 pb-3 md:pb-5 pt-2 relative flex-shrink-0">
              <div className="max-w-2xl mx-auto">
              {/* Reply-to Banner */}
              {replyingTo && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-2 flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface-container border-l-2 border-primary"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">reply</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-primary font-bold">Replying to</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{replyingTo.text || replyingTo.mediaType || "Message"}</p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="w-6 h-6 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-error cursor-pointer flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </motion.div>
              )}
              {/* Attached Media / File Preview Pill */}
              {attachedFile && (
                <div className="mb-2.5 flex items-center gap-2.5 p-2 px-3 rounded-full bg-surface-container-low border border-outline-variant/15 max-w-sm shadow-xs">
                  {attachedFile.isImage ? (
                    <img src={attachedFile.url} alt="preview" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px]">attachment</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-caption text-[11px] font-bold text-on-surface truncate">{attachedFile.name}</p>
                    <p className="font-caption text-[10px] text-on-surface-variant">{attachedFile.size} • Ready to send</p>
                  </div>
                  <button
                    onClick={() => { setAttachedFile(null); setAttachedImage(null); }}
                    className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}

              {/* Instagram-style Built-in Comprehensive Emoji Picker Popover */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute bottom-20 left-4 z-50 p-3.5 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 w-88 max-w-[92vw]"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container text-xs font-bold text-on-surface">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-primary">sentiment_satisfied</span>
                        Emojis
                      </span>
                      <button onClick={() => setShowEmojiPicker(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>

                    {/* Emoji Category Tabs */}
                    <div className="flex items-center gap-1 mb-2.5 p-1 bg-surface-container-low rounded-full">
                      {(["smileys", "gestures", "hearts", "objects"] as const).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEmojiCategory(cat)}
                          className={`flex-1 py-1 rounded-full text-[11px] font-bold capitalize transition-all cursor-pointer ${
                            emojiCategory === cat ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Emoji Search */}
                    <input
                      type="text"
                      value={emojiSearch}
                      onChange={e => setEmojiSearch(e.target.value)}
                      placeholder="Search emoji..."
                      className="w-full px-3 py-1.5 rounded-full bg-surface-container-low text-xs outline-none text-on-surface mb-2 focus:ring-2 focus:ring-primary/20"
                    />

                    {/* Comprehensive Emoji Grid */}
                    <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto pr-1">
                      {(() => {
                        const emojiSets: Record<string, string[]> = {
                          smileys: [
                            "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹",
                            "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗",
                            "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓",
                            "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕",
                            "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😮‍💨",
                            "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨",
                            "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤫", "🫠", "🤥", "😶",
                            "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱",
                            "😴", "🤤", "😪", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧",
                            "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡"
                          ],
                          gestures: [
                            "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫸", "🫷", "🫳",
                            "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
                            "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊",
                            "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏",
                            "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "👃"
                          ],
                          hearts: [
                            "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
                            "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
                            "💟", "✨", "⭐", "🌟", "💫", "🔥", "💥", "💯", "💢", "🕊️"
                          ],
                          objects: [
                            "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "👑", "💎",
                            "💍", "🚀", "⚡", "🌈", "☀️", "🌙", "⭐", "🎵", "🎶", "🎧",
                            "🎤", "🎸", "🎹", "🥁", "🎮", "🕹️", "⚽", "🏀", "🏈", "⚾",
                            "🎾", "🏐", "🎯", "🎲", "🧩", "🚗", "✈️", "🛸", "🍿", "🍕",
                            "🍔", "🍟", "☕", "🍻", "🥂", "🍾", "🌹", "🌸", "🌺", "🌻"
                          ],
                        };

                        const list = emojiSearch.trim()
                          ? Object.values(emojiSets).flat()
                          : emojiSets[emojiCategory] || emojiSets.smileys;

                        return list.map((emoji, idx) => (
                          <button
                            key={`${emoji}_${idx}`}
                            type="button"
                            onClick={() => {
                              setMessageText(prev => prev + emoji);
                            }}
                            className="w-9 h-9 rounded-xl hover:bg-surface-container text-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-120"
                          >
                            {emoji}
                          </button>
                        ));
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── LIVE GIPHY GIF Picker (Instagram-style) ── */}
              <AnimatePresence>
                {showGifPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute bottom-20 left-10 z-50 p-3.5 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 w-[360px] max-w-[94vw]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container text-xs font-bold text-on-surface">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-secondary">gif_box</span>
                        GIFs
                        <span className="text-[9px] font-normal text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded-full">Powered by GIPHY</span>
                      </span>
                      <button onClick={() => { setShowGifPicker(false); setGifSearch(""); }} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full mb-2">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-on-surface-variant">search</span>
                      <input
                        type="text"
                        value={gifSearch}
                        onChange={e => setGifSearch(e.target.value)}
                        placeholder="Search any GIF... noo, yes, lol, cry..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-full bg-surface-container-low text-xs outline-none text-on-surface focus:ring-2 focus:ring-secondary/20"
                        autoComplete="off"
                      />
                      {gifSearch && (
                        <button onClick={() => setGifSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>

                    {/* Category Chips (shown when not searching) */}
                    {!gifSearch.trim() && (
                      <div className="flex gap-1.5 mb-2.5 overflow-x-auto pb-1" style={{scrollbarWidth:"none"}}>
                        {[
                          { id: "trending", label: "🔥 Trending" },
                          { id: "funny", label: "😂 Funny" },
                          { id: "love", label: "❤️ Love" },
                          { id: "yes", label: "✅ Yes" },
                          { id: "no", label: "❌ No" },
                          { id: "happy", label: "😊 Happy" },
                          { id: "sad", label: "😢 Sad" },
                          { id: "angry", label: "😡 Angry" },
                          { id: "wow", label: "😮 Wow" },
                          { id: "dance", label: "💃 Dance" },
                          { id: "cute", label: "🥰 Cute" },
                          { id: "reaction", label: "🙄 Reaction" },
                          { id: "celebrate", label: "🎉 Celebrate" },
                          { id: "anime", label: "🌸 Anime" },
                          { id: "gaming", label: "🎮 Gaming" },
                          { id: "meme", label: "🐸 Meme" },
                        ].map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedGifCategory(cat.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                              selectedGifCategory === cat.id
                                ? "bg-secondary text-white shadow-sm"
                                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* GIF Grid */}
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {gifLoading ? (
                        // Skeleton loading placeholders
                        Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="rounded-2xl bg-surface-container animate-pulse aspect-video" />
                        ))
                      ) : gifResults.length > 0 ? (
                        gifResults.map(gif => (
                          <div
                            key={gif.id}
                            onClick={() => { sendMessage(gif.url, "gif"); setShowGifPicker(false); setGifSearch(""); }}
                            className="rounded-2xl overflow-hidden cursor-pointer hover:opacity-85 hover:scale-[1.02] transition-all aspect-video relative group bg-surface-container"
                          >
                            <img
                              src={gif.preview}
                              alt={gif.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[9px] text-white font-bold truncate max-w-[90%] opacity-0 group-hover:opacity-100 transition-opacity">
                              {gif.title}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-on-surface-variant text-xs flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-[28px] opacity-40">gif_box</span>
                          {gifSearch ? `No GIFs found for "${gifSearch}"` : "No GIFs loaded"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hidden File Input for Any Attachments (Photos, Docs, Audio, Files) */}
              <input
                ref={fileInputChatRef}
                type="file"
                accept="*/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* The Full Circular Pill Bar */}
              <div className="flex items-center gap-1 sm:gap-2 bg-surface-container-low pl-2 sm:pl-3 pr-1 sm:pr-1.5 py-1 sm:py-1.5 rounded-full shadow-xs border border-outline-variant/10 w-full overflow-hidden">
                {/* Universal Attachments Button (Photos, Documents, Files) */}
                <button
                  type="button"
                  onClick={() => fileInputChatRef.current?.click()}
                  title="Attach Photos or Files"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">attach_file</span>
                </button>

                {/* Built-in Emoji Picker button */}
                <button
                  type="button"
                  onClick={() => { setShowEmojiPicker(prev => !prev); setShowGifPicker(false); }}
                  title="Insert Emojis"
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                    showEmojiPicker ? "bg-primary text-white" : "hover:bg-surface-container text-on-surface-variant hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">sentiment_satisfied</span>
                </button>

                {/* Built-in GIF button */}
                <button
                  type="button"
                  onClick={() => { setShowGifPicker(prev => !prev); setShowEmojiPicker(false); }}
                  title="Send GIF"
                  className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase transition-colors cursor-pointer flex-shrink-0 ${
                    showGifPicker ? "bg-secondary text-white" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-secondary"
                  }`}
                >
                  GIF
                </button>

                {isRecordingAudio ? (
                  <div className="flex-1 min-w-0 flex items-center justify-between px-1 sm:px-2 py-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse flex-shrink-0" />
                      <span className="font-mono text-error font-bold text-[12px] sm:text-[13px] truncate">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60) < 10 ? "0" : ""}{recordingDuration % 60}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container text-error hover:bg-error/20 flex items-center justify-center cursor-pointer transition-colors"
                        title="Cancel recording"
                      >
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopAndSendVoiceRecording}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                        title="Send Voice Note"
                      >
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">send</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={messageText}
                      onChange={e => {
                        setMessageText(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                      placeholder={`Message @${activeConv.handle}...`}
                      className="flex-1 min-w-0 bg-transparent text-on-surface font-body-md outline-none px-1.5 sm:px-2 text-[13px] sm:text-[14px]"
                    />

                    {messageText.trim() || attachedFile || attachedImage ? (
                      <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => sendMessage()}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-md shadow-primary/20 transition-all flex-shrink-0"
                        title="Send Message"
                      >
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px]">send</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={startVoiceRecording}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-container hover:bg-primary hover:text-white text-on-surface-variant flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
                        title="Record Voice Message"
                      >
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px]">mic</span>
                      </motion.button>
                    )}
                  </>
                )}
              </div>
              </div>{/* end max-w-2xl */}
            </div>
          </>
        ) : (
          /* Empty hero */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest relative">
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden absolute top-4 left-4 w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
              title="Back to Conversations"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <div className="w-20 h-20 rounded-3xl bg-surface-container-low flex items-center justify-center mb-5 shadow-xs">
              <img src="/flyingo-logo.png" alt="Flyingo" className="w-14 h-14 object-contain" />
            </div>
            <h2 className="font-display-lg font-bold text-on-surface mb-2">Welcome to Flyingo</h2>
            <p className="font-body-md text-on-surface-variant max-w-md mb-6 leading-relaxed">
              Select a conversation from the sidebar or click Find Users to connect with your friends.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFindFriends(true)}
              className="px-6 py-3 rounded-2xl bg-primary text-white font-title-md font-semibold flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">person_search</span>
              Find & Add Friends
            </motion.button>
          </div>
        )}
      </main>

      {/* ── USER PROFILE VIEW MODAL (WITH FRIEND REQUEST BUTTON) ── */}
      <AnimatePresence>
        {viewingProfileUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setViewingProfileUser(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-tertiary" />
              
              <div className="flex items-center justify-between pt-2">
                <span className="font-caption text-on-surface-variant uppercase tracking-wider font-bold text-[11px]">User Profile</span>
                <button
                  onClick={() => setViewingProfileUser(null)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Avatar & Identifiers */}
              <div className="flex flex-col items-center text-center">
                <img
                  src={viewingProfileUser.avatar || "/default-avatar.jpg"}
                  alt={viewingProfileUser.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-surface-container shadow-md mb-3"
                />

                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="font-headline-md font-bold text-on-surface">
                    {viewingProfileUser.name || `@${viewingProfileUser.handle}`}
                  </h3>
                  {viewingProfileUser.verifiedBadge?.enabled && (
                    <VerifiedBadge
                      icon={viewingProfileUser.verifiedBadge.icon}
                      color={viewingProfileUser.verifiedBadge.color}
                      size={26}
                      title={viewingProfileUser.verifiedBadge.label || "Verified"}
                    />
                  )}
                </div>

                <p className="font-body-sm text-primary font-mono font-semibold">
                  @{viewingProfileUser.handle}
                </p>

                {/* Friends Count display on Profile */}
                <div className="flex items-center justify-center gap-1.5 mt-2 px-3.5 py-1.5 rounded-2xl bg-surface-container-low text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[17px]">group</span>
                  <span className="font-bold text-[13px]">{viewingProfileUser.customFriendsCount || 0}</span>
                  <span className="font-caption text-on-surface-variant text-[11px]">Friends</span>
                </div>

                {/* Pronouns / Gender */}
                {(viewingProfileUser.pronouns || viewingProfileUser.gender) && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {viewingProfileUser.pronouns && (
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-caption text-[11px]">
                        {viewingProfileUser.pronouns}
                      </span>
                    )}
                    {viewingProfileUser.gender && (
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-caption text-[11px]">
                        {viewingProfileUser.gender}
                      </span>
                    )}
                  </div>
                )}

                {/* Bio */}
                {viewingProfileUser.bio ? (
                  <p className="font-body-sm text-on-surface mt-3 bg-surface-container-low p-3 rounded-2xl w-full text-left leading-relaxed">
                    {viewingProfileUser.bio}
                  </p>
                ) : (
                  <p className="font-caption text-on-surface-variant/60 italic mt-3">No bio written yet.</p>
                )}

                {/* Links */}
                {viewingProfileUser.links && viewingProfileUser.links.length > 0 && (
                  <div className="w-full flex flex-col gap-1.5 mt-2">
                    {viewingProfileUser.links.map(l => (
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

              {/* Action Buttons: Friend Request & Message */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => handleSendFriendRequest(viewingProfileUser.handle)}
                  className="py-3 rounded-2xl bg-secondary/10 hover:bg-secondary/20 text-secondary font-title-md font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Friend Request
                </button>
                <button
                  type="button"
                  onClick={() => startConversation(viewingProfileUser)}
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

      {/* ── GROUP INFO PANEL (WhatsApp-style full screen) ── */}
      <AnimatePresence>
        {showGroupInfo && activeConv?.isGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-end"
            onClick={e => { if (e.target === e.currentTarget) setShowGroupInfo(false); }}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="h-full w-full max-w-sm bg-surface-container-lowest flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/15 bg-surface-container-lowest/95 backdrop-blur-xl flex-shrink-0">
                <button
                  onClick={() => setShowGroupInfo(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </button>
                <h2 className="font-title-md font-bold text-on-surface flex-1">Group Info</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Group Avatar + Name Hero */}
                <div className="flex flex-col items-center py-8 px-6 gap-3 bg-gradient-to-b from-surface-container to-surface-container-lowest">
                  <div className="relative group cursor-pointer" onClick={() => groupAvatarInputRef.current?.click()}>
                    {activeConv.avatar && activeConv.avatar !== "/default-avatar.jpg" ? (
                      <img
                        src={activeConv.avatar}
                        alt={activeConv.name}
                        className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-surface-container-lowest group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-tertiary/20 flex items-center justify-center shadow-xl border-4 border-surface-container-lowest group-hover:opacity-80 transition-opacity">
                        <span className="material-symbols-outlined text-[44px] text-tertiary">groups</span>
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                      <span className="text-[10px] font-semibold">Change DP</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={groupAvatarInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (loadEvt) => {
                        const newAvatar = loadEvt.target?.result as string;
                        if (!newAvatar || !activeConv) return;
                        Storage.updateGroupAvatar(activeConv.id, newAvatar);
                        setConversations(prev => {
                          const updated = prev.map(c => c.id === activeConv.id ? { ...c, avatar: newAvatar } : c);
                          if (currentUser?.handle) Storage.saveConversations(currentUser.handle, updated);
                          return updated;
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <div className="text-center">
                    <h3 className="font-headline-sm font-bold text-on-surface text-xl">{activeConv.name}</h3>
                    <p className="font-caption text-on-surface-variant text-[12px] mt-0.5">
                      Group · {activeConv.members?.length || 0} members
                    </p>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex gap-3 px-5 pb-4">
                  {[
                    { icon: "chat", label: "Message", action: () => setShowGroupInfo(false) },
                    { icon: "notifications", label: "Mute", action: () => {} },
                    { icon: "search", label: "Search", action: () => {} },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-primary text-[22px]">{btn.icon}</span>
                      <span className="font-caption text-[10px] text-on-surface-variant font-semibold">{btn.label}</span>
                    </button>
                  ))}
                </div>

                {/* Group Description Placeholder */}
                <div className="mx-5 mb-4 p-4 rounded-2xl bg-surface-container">
                  <p className="font-caption text-[11px] text-on-surface-variant font-semibold uppercase tracking-wide mb-2">Description</p>
                  <p className="font-body-sm text-on-surface text-[13px] leading-relaxed">
                    {(activeConv as {description?: string}).description || "No group description yet."}
                  </p>
                </div>

                {/* Created Info */}
                <div className="mx-5 mb-4 p-4 rounded-2xl bg-surface-container flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">calendar_today</span>
                  <div>
                    <p className="font-caption text-[11px] text-on-surface-variant">Group created</p>
                    <p className="font-body-sm text-on-surface text-[12px] font-semibold">
                      {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Members List */}
                <div className="mx-5 mb-4">
                  <p className="font-caption text-[11px] text-on-surface-variant font-semibold uppercase tracking-wide mb-3 px-1">
                    {activeConv.members?.length || 0} Members
                  </p>
                  <div className="flex flex-col gap-2">
                    {/* Current user (you) */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container">
                      <img
                        src={currentUser.avatar || "/default-avatar.jpg"}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-title-md text-[13px] font-bold text-on-surface truncate">{currentUser.name || "You"}</p>
                        <p className="font-caption text-[11px] text-primary font-mono">@{currentUser.handle}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-caption text-[10px] font-bold">Admin</span>
                    </div>
                    {/* Other members */}
                    {((activeConv.members as string[]) || [])
                      .filter((m: string) => m.toLowerCase() !== currentUser.handle.toLowerCase())
                      .map((handle: string) => {
                        const memberUser = Storage.getUserByHandle(handle);
                        return (
                          <div key={handle} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                            <img
                              src={memberUser?.avatar || "/default-avatar.jpg"}
                              alt={memberUser?.name || handle}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-title-md text-[13px] font-bold text-on-surface truncate">{memberUser?.name || handle}</p>
                              <p className="font-caption text-[11px] text-primary font-mono truncate">@{handle}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Leave Group */}
                <div className="mx-5 mb-8">
                  <button className="w-full py-3.5 rounded-2xl border border-error/30 text-error font-title-md font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-error/5 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">exit_to_app</span>
                    Leave Group
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FIND FRIENDS MODAL ── */}

      <AnimatePresence>
        {showFindFriends && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowFindFriends(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">person_search</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">Find & Connect</h3>
                </div>
                <button onClick={() => setShowFindFriends(false)} className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                <input
                  type="text"
                  value={friendSearch}
                  onChange={e => setFriendSearch(e.target.value)}
                  placeholder="Search by name or @handle..."
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-surface-container-low text-on-surface font-body-sm outline-none focus:ring-2 focus:ring-primary/20 text-[13px]"
                />
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto max-h-72 pr-1">
                {filteredAllUsers.length === 0 ? (
                  <p className="text-center font-caption text-on-surface-variant py-8">No registered users found</p>
                ) : (
                  filteredAllUsers.map(u => (
                    <div
                      key={u.id || u.handle}
                      className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container flex items-center justify-between gap-3 transition-colors"
                    >
                      <div 
                        onClick={() => openUserProfile(u)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80"
                      >
                        <img
                          src={u.avatar || "/default-avatar.jpg"}
                          alt={u.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-title-md text-[13px] font-bold text-on-surface truncate">{u.name}</p>
                          <p className="font-caption text-[11px] text-primary font-mono truncate">@{u.handle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSendFriendRequest(u.handle)}
                          className="px-2.5 py-1.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary font-caption text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Send Friend Request"
                        >
                          <span className="material-symbols-outlined text-[14px]">person_add</span>
                          Add
                        </button>
                        <button
                          onClick={() => startConversation(u)}
                          className="px-2.5 py-1.5 rounded-xl bg-primary text-white font-caption text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          Chat
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CREATE GROUP MODAL ── */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowCreateGroup(false); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-4 overflow-hidden max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-surface-container pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">group_add</span>
                  <h3 className="font-headline-sm font-bold text-on-surface">Create New Group</h3>
                </div>
                <button
                  onClick={() => setShowCreateGroup(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {/* Group Photo / DP Upload */}
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                  <div className="relative">
                    <img
                      src={newGroupAvatar || "/default-avatar.jpg"}
                      alt="group avatar"
                      className="w-14 h-14 rounded-full object-cover border-2 border-tertiary shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => groupAvatarInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-tertiary text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform"
                      title="Upload Group Photo"
                    >
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-title-md font-bold text-on-surface text-[13px]">Group Photo</p>
                    <p className="font-caption text-on-surface-variant text-[11px]">Upload custom group picture</p>
                  </div>
                  <input
                    ref={groupAvatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGroupAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => groupAvatarInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-tertiary font-caption text-[11px] font-bold cursor-pointer"
                  >
                    Choose Photo
                  </button>
                </div>

                <div>
                  <label className="block font-caption text-on-surface-variant text-[11px] font-bold uppercase mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="e.g. Friends Squad, Crypto Gang, Study Team..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-low text-on-surface font-body-sm outline-none focus:ring-2 focus:ring-tertiary/30 text-[13px]"
                  />
                </div>

                <div>
                  <label className="block font-caption text-on-surface-variant text-[11px] font-bold uppercase mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder="What is this group about?"
                    className="w-full px-3.5 py-2 rounded-2xl bg-surface-container-low text-on-surface font-body-sm outline-none focus:ring-2 focus:ring-tertiary/30 text-[12px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-caption text-on-surface-variant text-[11px] font-bold uppercase">
                      Select Members ({selectedGroupMembers.length})
                    </label>
                    <span className="font-caption text-[11px] text-tertiary font-medium">You are admin</span>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto border border-outline-variant/10 rounded-2xl p-2 bg-surface-container-low/40">
                    {allUsers.length === 0 ? (
                      <p className="font-caption text-on-surface-variant text-center py-4 text-[11px]">
                        No other users found to add.
                      </p>
                    ) : (
                      allUsers.map(user => {
                        const isSelected = selectedGroupMembers.includes(user.handle.toLowerCase());
                        return (
                          <div
                            key={user.id || user.handle}
                            onClick={() => {
                              const handle = user.handle.toLowerCase();
                              setSelectedGroupMembers(prev =>
                                isSelected ? prev.filter(h => h !== handle) : [...prev, handle]
                              );
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                              isSelected ? "bg-tertiary/15 text-tertiary font-bold" : "hover:bg-surface-container"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={user.avatar || "/default-avatar.jpg"}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="min-w-0">
                                <p className="font-title-md text-[12px] truncate">{user.name || `@${user.handle}`}</p>
                                <p className="font-caption text-[10px] text-on-surface-variant font-mono">@{user.handle}</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isSelected ? "bg-tertiary border-tertiary text-white" : "border-outline-variant"
                            }`}>
                              {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="mt-2 w-full py-3 rounded-2xl bg-tertiary text-white font-title-md font-bold text-[13px] flex items-center justify-center gap-2 shadow-md shadow-tertiary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Create Group
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANIC MODE MANAGER MODAL ── */}
      <AnimatePresence>
        {showPanicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowPanicModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-error/20 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center font-bold text-lg">
                    !
                  </div>
                  <div>
                    <h3 className="font-title-lg font-bold text-on-surface">Panic Modes</h3>
                    <p className="font-caption text-on-surface-variant">Permanent decoy screen until you type <span className="text-error font-mono font-bold">--leave</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPanicModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Active Panic Status Banner */}
              {isPanicActive && (
                <div className="p-3.5 rounded-2xl bg-error/15 border border-error/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-error text-sm font-semibold">
                    <span className="material-symbols-outlined text-[20px] animate-pulse">lock</span>
                    Panic Mode is currently ACTIVE
                  </div>
                  <button
                    onClick={() => {
                      Storage.exitPanicMode();
                      setIsPanicActive(false);
                      const real = Storage.getCurrentUser();
                      setCurrentUser(real);
                      setConversations([]);
                      setActiveConvId(null);
                      setPanicToast("Unlocked: Returned to normal mode.");
                      setTimeout(() => setPanicToast(""), 3000);
                      setShowPanicModal(false);
                    }}
                    className="px-3 py-1 rounded-xl bg-error text-white font-caption font-bold text-xs cursor-pointer hover:bg-error/90"
                  >
                    Exit Panic Mode
                  </button>
                </div>
              )}

              {/* Existing Panic Modes List */}
              <div className="flex flex-col gap-2">
                <span className="font-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">Select Preset to Activate</span>
                {panicModes.map(mode => (
                  <div
                    key={mode.id}
                    className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-between gap-3 hover:border-error/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-title-md font-bold text-on-surface truncate">{mode.name}</p>
                      <p className="font-caption text-on-surface-variant text-[12px] truncate">
                        Me: <span className="font-semibold">{mode.myAccountName}</span> (@{mode.myAccountHandle}) ↔ Partner: <span className="font-semibold">{mode.receiverName}</span> (@{mode.receiverHandle})
                      </p>
                      <p className="font-caption text-outline text-[11px] mt-0.5 truncate italic">
                        &quot;{mode.messages[0]?.text || "No preview"}&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          Storage.activatePanicMode(mode.id);
                          loadPanicModeState();
                          setShowPanicModal(false);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-error hover:bg-error/90 text-white font-caption font-bold text-xs shadow-sm cursor-pointer"
                      >
                        Activate
                      </button>
                      {mode.id !== "panic_academic_notes" && (
                        <button
                          onClick={() => {
                            Storage.deletePanicMode(mode.id);
                            setPanicModes(Storage.getPanicModes());
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-error/10 text-error flex items-center justify-center cursor-pointer"
                          title="Delete mode"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Create New Panic Mode Form */}
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/15 flex flex-col gap-3 mt-1">
                <span className="font-title-md font-bold text-on-surface flex items-center gap-1.5 text-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
                  Create New Panic Mode
                </span>

                <input
                  type="text"
                  placeholder="Mode Name (e.g. Study Group, Office Work, Mom)"
                  value={newPanicName}
                  onChange={e => setNewPanicName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs outline-none border border-outline-variant/20 focus:border-primary"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Decoy Name"
                    value={newPanicMyName}
                    onChange={e => setNewPanicMyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs outline-none border border-outline-variant/20 focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Your Decoy @handle"
                    value={newPanicMyHandle}
                    onChange={e => setNewPanicMyHandle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs outline-none border border-outline-variant/20 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Receiver Name"
                    value={newPanicReceiverName}
                    onChange={e => setNewPanicReceiverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs outline-none border border-outline-variant/20 focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Receiver @handle"
                    value={newPanicReceiverHandle}
                    onChange={e => setNewPanicReceiverHandle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs outline-none border border-outline-variant/20 focus:border-primary"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Receiver's Message (What they sent you)"
                  value={newPanicInitialThemMsg}
                  onChange={e => setNewPanicInitialThemMsg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs outline-none border border-outline-variant/20 focus:border-primary"
                />

                <input
                  type="text"
                  placeholder="Your Reply Message"
                  value={newPanicInitialMyMsg}
                  onChange={e => setNewPanicInitialMyMsg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs outline-none border border-outline-variant/20 focus:border-primary"
                />

                <button
                  onClick={() => {
                    if (!newPanicName.trim() || !newPanicReceiverName.trim()) return;
                    const newMode: PanicModeConfig = {
                      id: `panic_${Date.now()}`,
                      name: newPanicName.trim(),
                      myAccountName: newPanicMyName.trim() || "User",
                      myAccountHandle: newPanicMyHandle.trim().replace(/^@/, "") || "user",
                      receiverName: newPanicReceiverName.trim(),
                      receiverHandle: newPanicReceiverHandle.trim().replace(/^@/, "") || "partner",
                      messages: [
                        ...(newPanicInitialThemMsg.trim() ? [{ sender: "them" as const, text: newPanicInitialThemMsg.trim(), time: "10:00 AM" }] : []),
                        ...(newPanicInitialMyMsg.trim() ? [{ sender: "me" as const, text: newPanicInitialMyMsg.trim(), time: "10:05 AM" }] : []),
                      ],
                    };
                    Storage.savePanicMode(newMode);
                    setPanicModes(Storage.getPanicModes());
                    setNewPanicName("");
                    setNewPanicMyName("");
                    setNewPanicMyHandle("");
                    setNewPanicReceiverName("");
                    setNewPanicReceiverHandle("");
                    setNewPanicInitialThemMsg("");
                    setNewPanicInitialMyMsg("");
                  }}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-title-md font-bold text-xs cursor-pointer hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Save Panic Preset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panic Toast Indicator */}
      <AnimatePresence>
        {panicToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-2xl bg-error text-white font-title-md text-xs font-semibold shadow-xl flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">emergency_home</span>
            {panicToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING TOP-RIGHT EMERGENCY PANIC MODE BUTTON ── */}
      {!isPanicActive && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setPanicModes(Storage.getPanicModes());
            setShowPanicModal(true);
          }}
          title="Emergency Panic Mode"
          className="fixed top-2.5 md:top-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-40 w-8 h-8 md:w-11 md:h-11 rounded-full bg-error text-white font-extrabold text-base md:text-xl shadow-lg shadow-error/30 flex items-center justify-center border-2 border-white/90 cursor-pointer hover:shadow-xl hover:shadow-error/50 transition-all group"
        >
          <span className="group-hover:scale-110 transition-transform">!</span>
        </motion.button>
      )}

      {/* ── LIVE VOICE / VIDEO CALL MODAL ── */}
      <AnimatePresence>
        {activeCall && (
          <CallModal
            session={activeCall}
            currentUser={currentUser}
            onAccept={handleAcceptCall}
            onDecline={handleDeclineCall}
            onEnd={handleEndCall}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE LONG-PRESS CONTEXT MENU ── */}
      <AnimatePresence>
        {contextMenu && (() => {
          const activeConvCtx = conversations.find(c => c.id === activeConvId);
          const ctxMsg = activeConvCtx ? (currentMessages.find(m => m.id === contextMenu.msgId)) : null;
          if (!ctxMsg || !activeConvCtx) return null;
          const channelKeyCtx = activeConvCtx.isGroup
            ? activeConvCtx.id
            : Storage.getDmKey(currentUser.handle, activeConvCtx.handle);
          return (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={() => setContextMenu(null)}
              />
              {/* Menu */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="fixed z-50 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 p-2 min-w-[180px]"
                style={{
                  top: Math.min(contextMenu.y, window.innerHeight - 240),
                  left: Math.min(contextMenu.x, window.innerWidth - 200),
                }}
              >
                {/* Quick reactions row */}
                <div className="flex items-center justify-around px-2 py-2 mb-1 border-b border-outline-variant/10">
                  {["❤️", "😂", "😮", "😢", "👏", "🔥"].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        Storage.toggleReaction(channelKeyCtx, contextMenu.msgId, emoji, currentUser.handle, !!activeConvCtx.isGroup);
                        setSyncTick(t => t + 1);
                        setContextMenu(null);
                      }}
                      className="text-xl hover:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {/* Actions */}
                {[
                  { icon: "reply", label: "Reply", action: () => { setReplyingTo(ctxMsg); setContextMenu(null); } },
                  { icon: "push_pin", label: (ctxMsg as any).isPinned ? "Unpin" : "Pin", action: () => { Storage.togglePin(channelKeyCtx, contextMenu.msgId, !!activeConvCtx.isGroup); setSyncTick(t => t + 1); setContextMenu(null); } },
                  { icon: "content_copy", label: "Copy", action: () => { navigator.clipboard?.writeText(ctxMsg.text || ""); setContextMenu(null); } },
                  { icon: "delete", label: "Delete for everyone", isDestructive: true, action: () => { Storage.deleteMessage(channelKeyCtx, contextMenu.msgId, !!activeConvCtx.isGroup); setSyncTick(t => t + 1); setContextMenu(null); } },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-container text-[14px] font-medium cursor-pointer transition-colors text-left ${item.isDestructive ? "text-error hover:bg-error/10" : "text-on-surface"}`}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${item.isDestructive ? "text-error" : "text-on-surface-variant"}`}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
