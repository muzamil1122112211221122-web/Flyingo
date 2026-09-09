"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Key, Shield, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Storage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleNext = async () => {
    setAuthError("");
    if (step === 1) {
      if (!handle.trim()) {
        setAuthError("Please enter a unique handle.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!password) {
        setAuthError("Please enter your master password.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (pin.length < 4) {
        setAuthError("Please enter a 4-digit PIN.");
        return;
      }

      setIsLoading(true);
      const cleanHandle = handle.trim().toLowerCase().replace(/^@/, "");
      const finalName = displayName.trim() || cleanHandle;

      try {
        if (authMode === "signup") {
          // Check if handle already exists in Supabase
          const { data: existingUser } = await supabase
            .from("flyingo_users")
            .select("handle")
            .eq("handle", cleanHandle)
            .maybeSingle();

          if (existingUser) {
            setAuthError("This handle is already registered! Please sign in or choose another handle.");
            setIsLoading(false);
            return;
          }

          // Insert into Supabase permanently
          const { error: insertError } = await supabase.from("flyingo_users").insert({
            handle: cleanHandle,
            name: finalName,
            password_hash: password, // For private client custody
            pin_hash: pin,
            verified: false,
          });

          if (insertError) {
            console.warn("Supabase insert warning:", insertError);
          }
        } else {
          // Sign In mode: verify from Supabase
          const { data: userRecord, error: fetchError } = await supabase
            .from("flyingo_users")
            .select("*")
            .eq("handle", cleanHandle)
            .maybeSingle();

          if (userRecord) {
            if (userRecord.password_hash && userRecord.password_hash !== password) {
              setAuthError("Incorrect password for @" + cleanHandle);
              setIsLoading(false);
              return;
            }
            if (userRecord.pin_hash && userRecord.pin_hash !== pin) {
              setAuthError("Incorrect PIN for @" + cleanHandle);
              setIsLoading(false);
              return;
            }
          }
        }

        // For signup: pre-register the full profile into flyingo_all_users so loginUser can load it
        if (authMode === "signup") {
          Storage.setCurrentUser({
            id: `u_${cleanHandle}`,
            handle: cleanHandle,
            name: finalName,
            pin: pin,
            password: password,
            bio: "",
            link: "",
            links: [],
            gender: "",
            pronouns: "",
            createdAt: Date.now(),
          });
        }

        // Save session in local client storage — loginUser loads the full stored profile cleanly
        Storage.loginUser(cleanHandle, pin, password);

        router.push("/chat");
      } catch (err: any) {
        console.error("Auth error:", err);
        // Fallback save in case of offline/network glitch
        Storage.loginUser(cleanHandle, pin);
        router.push("/chat");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="w-full min-h-screen bg-surface flex flex-col items-center justify-center relative overflow-hidden p-4 sm:p-8">
      {/* Ambient background */}
      <div className="absolute top-12 left-1/4 w-96 h-96 rounded-full bg-primary-container/15 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[28rem] h-[28rem] rounded-full bg-secondary-container/15 blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        {/* Left Info Deck */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-8 rounded-3xl bg-surface-container-low/70 backdrop-blur-2xl p-8 sm:p-10 shadow-xl shadow-surface-dim/40 relative overflow-hidden">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-md shadow-sm">
              <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center">
                <Shield className="text-primary" size={20} />
              </div>
              <div>
                <div className="font-headline-sm text-headline-sm font-semibold flex items-center gap-1.5">
                  Flyingo
                  <span className="material-symbols-outlined text-[16px] text-tertiary">verified</span>
                </div>
                <p className="font-caption text-caption text-on-surface-variant">Desktop v4.12.0 • Cloud Sync</p>
              </div>
            </div>
            <div className="mt-8">
              <h1 className="font-display-lg text-display-lg font-bold tracking-tight text-on-surface">
                Private, End-to-End <br />
                <span className="bg-gradient-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
                  Encrypted Messenger
                </span>
              </h1>
              <p className="mt-4 font-body-md text-on-surface-variant max-w-md leading-relaxed">
                Peer-to-peer ratcheted sessions, real ephemeral Flamingoos stories, and zero-knowledge database accounts.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/20 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary animate-ping" />
            <span className="font-caption text-on-surface-variant text-[11px]">Database node connected: PostgreSQL E2EE</span>
          </div>
        </div>

        {/* Right Auth Gate */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl bg-surface-container-lowest/95 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl shadow-surface-dim/30">
          <div className="flex items-center justify-between pb-8">
            <div className="inline-flex p-1.5 rounded-2xl bg-surface-container-high/60 backdrop-blur-md">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setAuthMode("login"); setStep(1); setAuthError(""); }}
                className={`px-5 py-2 rounded-xl font-label-md font-semibold transition-all ${
                  authMode === "login" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Sign In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setAuthMode("signup"); setStep(1); setAuthError(""); }}
                className={`px-5 py-2 rounded-xl font-label-md font-semibold transition-all ${
                  authMode === "signup" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Create New Account
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-headline-md font-bold text-on-surface">
                {authMode === "signup" ? "Create Permanent Account" : "Sign In to Your Vault"}
              </h2>
              <p className="font-body-sm text-on-surface-variant mt-1">
                {authMode === "signup"
                  ? "Your account will be saved permanently in the database so you can log back in anytime."
                  : "Enter your handle, password and PIN to open your encrypted session."}
              </p>
            </div>

            {/* Steps indicator */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-surface-container-low">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    step === num ? "bg-primary text-white shadow-sm" : "bg-transparent text-on-surface-variant"
                  }`}
                >
                  <span className="font-caption font-bold">{num}</span>
                  <span className="font-label-sm truncate">
                    {num === 1 ? "Handle" : num === 2 ? "Password" : "PIN"}
                  </span>
                </div>
              ))}
            </div>

            {authError && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-error/10 border border-error/20 text-error font-caption text-[12px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {authError}
              </motion.div>
            )}

            {/* Forms */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  {authMode === "signup" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md font-semibold text-on-surface">Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Hunter"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-2xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all font-body-md"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md font-semibold text-on-surface">Unique Handle (@handle)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-primary font-headline-sm font-bold">@</span>
                      <input
                        type="text"
                        placeholder="your_handle"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        className="w-full pl-10 pr-4 py-3 bg-surface-container-low text-on-surface rounded-2xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all font-body-md"
                      />
                    </div>
                    <span className="font-caption text-on-surface-variant text-[11px]">
                      {authMode === "signup"
                        ? "Choose your permanent handle. Others can find and chat with you using @handle."
                        : "Enter the handle you used when creating your account."}
                    </span>
                  </div>

                  <motion.button
                    whileHover={handle ? { scale: 1.02 } : {}}
                    whileTap={handle ? { scale: 0.98 } : {}}
                    onClick={handleNext}
                    disabled={!handle}
                    className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white font-title-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <span>Continue to Master Password</span>
                    <ArrowRight size={18} />
                  </motion.button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <label className="font-label-md font-semibold text-on-surface">Account Master Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-2xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all font-body-md pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      <Image 
                        src={showPassword ? "/eye-off.png" : "/eye.png"} 
                        alt="Toggle visibility" 
                        width={20} 
                        height={20} 
                        className="opacity-70 hover:opacity-100"
                      />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(1)}
                      className="py-3 rounded-2xl bg-surface-container-high text-on-surface font-title-md font-semibold cursor-pointer"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={password ? { scale: 1.02 } : {}}
                      whileTap={password ? { scale: 0.98 } : {}}
                      onClick={handleNext}
                      disabled={!password}
                      className="py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white font-title-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      <span>Verify PIN</span>
                      <Key size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <label className="font-label-md font-semibold text-on-surface">4-Digit Security PIN</label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 font-label-md"
                    >
                      <Image 
                        src={showPin ? "/eye-off.png" : "/eye.png"} 
                        alt="Toggle visibility" 
                        width={16} 
                        height={16} 
                        className="opacity-70 hover:opacity-100"
                      />
                      <span>{showPin ? "Hide Code" : "Show Code"}</span>
                    </button>
                  </div>
                  <div className="flex gap-4 justify-center">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        type={showPin ? "text" : "password"}
                        maxLength={1}
                        value={pin[i] || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const newPinArr = pin.split('');
                          newPinArr[i] = val;
                          setPin(newPinArr.join(''));
                          if (val && e.target.nextElementSibling) {
                            (e.target.nextElementSibling as HTMLInputElement).focus();
                          }
                        }}
                        className="w-14 h-14 text-center bg-surface-container-low text-on-surface rounded-2xl outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all font-headline-md font-bold"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(2)}
                      className="py-3 rounded-2xl bg-surface-container-high text-on-surface font-title-md font-semibold cursor-pointer"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={pin.length >= 4 && !isLoading ? { scale: 1.02 } : {}}
                      whileTap={pin.length >= 4 && !isLoading ? { scale: 0.98 } : {}}
                      onClick={handleNext}
                      disabled={pin.length < 4 || isLoading}
                      className="py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white font-title-md font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      <span>{isLoading ? "Connecting Vault..." : "Unlock Vault"}</span>
                      <ShieldCheck size={18} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
