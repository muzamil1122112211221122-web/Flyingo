"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CallSession, UserProfile, Storage } from "@/lib/storage";
import { Realtime } from "@/lib/realtime";

interface CallModalProps {
  session: CallSession;
  currentUser: UserProfile;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: (durationSeconds: number) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export default function CallModal({
  session,
  currentUser,
  onAccept,
  onDecline,
  onEnd,
}: CallModalProps) {
  const isCaller = currentUser.handle.toLowerCase() === session.callerHandle.toLowerCase();
  const isIncoming = !isCaller && session.status === "ringing";
  const isOutgoing = isCaller && session.status === "ringing";
  const isConnected = session.status === "accepted";

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(session.type === "video");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [hasRemoteMedia, setHasRemoteMedia] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const targetHandle = isCaller ? session.recipientHandle : session.callerHandle;
  const partnerUser = Storage.getUserByHandle(targetHandle);
  const partnerHandle = targetHandle;
  const partnerName = partnerUser?.name || (isCaller ? `@${session.recipientHandle}` : session.callerName);
  const partnerAvatar = partnerUser?.avatar || (isCaller ? "/default-avatar.jpg" : session.callerAvatar);

  // Call timer when connected
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Initialize WebRTC and Peer Connection when Call is active / accepted
  useEffect(() => {
    if (!isConnected) return;

    let isMounted = true;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Send local ICE candidates to peer over Supabase broadcast
    pc.onicecandidate = (event) => {
      if (event.candidate && isMounted) {
        Realtime.sendCallSignal(targetHandle, currentUser.handle, "candidate", {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Receive remote stream (Audio and/or Video)
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setHasRemoteMedia(true);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
        if (remoteVideoRef.current && session.type === "video") {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
      }
    };

    // Get user media
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: session.type === "video",
    };

    navigator.mediaDevices
      ?.getUserMedia(constraints)
      .then(async (stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;

        // Attach to local video PiP
        if (localVideoRef.current && session.type === "video") {
          localVideoRef.current.srcObject = stream;
        }

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // The caller creates the SDP offer
        if (isCaller) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          Realtime.sendCallSignal(targetHandle, currentUser.handle, "offer", { sdp: offer });
        }
      })
      .catch((err) => {
        console.warn("getUserMedia failed or not permitted:", err);
      });

    // Listen for WebRTC signal events (offer, answer, candidate) from peer
    const unsubSignal = Realtime.onCallSignal(async (signal) => {
      if (!isMounted || !peerConnectionRef.current) return;
      const peer = peerConnectionRef.current;

      try {
        if (signal.type === "offer" && signal.sdp && !isCaller) {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          Realtime.sendCallSignal(targetHandle, currentUser.handle, "answer", { sdp: answer });
        } else if (signal.type === "answer" && signal.sdp && isCaller) {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === "candidate" && signal.candidate) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Error handling WebRTC signal:", err);
      }
    });

    return () => {
      isMounted = false;
      unsubSignal();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [isConnected, isCaller, targetHandle, currentUser.handle, session.type]);

  const toggleMic = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  };

  const toggleVideo = () => {
    const nextVideo = !isVideoEnabled;
    setIsVideoEnabled(nextVideo);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextVideo;
      });
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Hidden audio element for receiving peer audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline muted={!isSpeakerOn} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-surface-container-lowest/90 border border-outline-variant/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center text-center p-8 backdrop-blur-xl"
      >
        {/* Top Call Info / Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-[12px] mb-4">
            <span className="material-symbols-outlined text-[16px]">
              {session.type === "video" ? "videocam" : "call"}
            </span>
            <span>
              {session.type === "video" ? "Flyingo Video Call" : "Flyingo Voice Call"}
            </span>
          </div>

          <h3 className="font-headline-sm font-bold text-on-surface text-[20px]">{partnerName}</h3>
          <p className="font-caption text-primary font-mono text-[12px] mt-0.5">@{partnerHandle}</p>

          <p className="font-caption text-on-surface-variant mt-2 text-[13px] font-medium">
            {isOutgoing && "Calling..."}
            {isIncoming && `Incoming ${session.type} call...`}
            {isConnected && formatTimer(callDuration)}
          </p>
        </div>

        {/* Video or Voice Center Screen */}
        <div className="relative w-full aspect-square max-w-[280px] mb-8 flex items-center justify-center">
          {session.type === "video" && isConnected ? (
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-black/40 border border-outline-variant/30 flex items-center justify-center">
              {/* Main remote video stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${hasRemoteMedia ? "block" : "hidden"}`}
              />

              {/* Fallback avatar if remote video track hasn't arrived yet */}
              {!hasRemoteMedia && (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <img
                    src={partnerAvatar}
                    alt={partnerName}
                    className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-primary mb-3"
                  />
                  <span className="font-caption text-white/70 text-[12px]">Connecting Video Stream...</span>
                </div>
              )}

              {/* PiP Local Video View */}
              {isVideoEnabled && (
                <div className="absolute top-3 right-3 w-20 h-28 bg-black rounded-xl overflow-hidden border border-white/20 shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Voice Call Center Avatar with Pulsing Sonar Rings */
            <div className="relative flex items-center justify-center">
              {(isOutgoing || isIncoming || isConnected) && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.4, 1.8], opacity: [0.6, 0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
                    className="absolute w-44 h-44 rounded-full bg-primary/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1.6], opacity: [0.7, 0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2, delay: 0.6, ease: "easeOut" }}
                    className="absolute w-44 h-44 rounded-full bg-primary/30"
                  />
                </>
              )}
              <img
                src={partnerAvatar}
                alt={partnerName}
                className="relative z-10 w-36 h-36 rounded-full object-cover shadow-2xl border-4 border-surface-container"
              />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 w-full">
          {isIncoming ? (
            <>
              {/* Decline Button */}
              <button
                type="button"
                onClick={onDecline}
                className="flex-1 max-w-[120px] py-3.5 px-4 rounded-2xl bg-user-gradient text-white font-label-md text-[13px] flex items-center justify-center gap-2 shadow-lg hover:opacity-90 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">call_end</span>
                Decline
              </button>

              {/* Accept Button */}
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 max-w-[120px] py-3.5 px-4 rounded-2xl bg-green-600 text-white font-label-md text-[13px] flex items-center justify-center gap-2 shadow-lg hover:bg-green-700 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
                Accept
              </button>
            </>
          ) : (
            <>
              {/* Connected / Outgoing in-call buttons */}
              {isConnected && (
                <>
                  {/* Mute Mic */}
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                      isMuted ? "bg-error/20 text-error" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                    }`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isMuted ? "mic_off" : "mic"}
                    </span>
                  </button>

                  {/* Video Toggle (if video call) */}
                  {session.type === "video" && (
                    <button
                      type="button"
                      onClick={toggleVideo}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                        !isVideoEnabled ? "bg-error/20 text-error" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                      }`}
                      title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isVideoEnabled ? "videocam" : "videocam_off"}
                      </span>
                    </button>
                  )}

                  {/* Speaker */}
                  <button
                    type="button"
                    onClick={() => setIsSpeakerOn(p => !p)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                      isSpeakerOn ? "bg-primary/20 text-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                    }`}
                    title="Toggle Speaker"
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isSpeakerOn ? "volume_up" : "volume_off"}
                    </span>
                  </button>
                </>
              )}

              {/* End / Cancel Call Button */}
              <button
                type="button"
                onClick={() => onEnd(callDuration)}
                className="w-14 h-14 rounded-full bg-user-gradient text-white flex items-center justify-center shadow-xl hover:opacity-90 cursor-pointer transition-transform hover:scale-105"
                title="End Call"
              >
                <span className="material-symbols-outlined text-[26px]">call_end</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
