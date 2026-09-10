"use client";
import { useEffect } from 'react';
import { Storage } from '@/lib/storage';

/**
 * BootSync: Hydrates all local caches from Supabase on every app boot.
 * Runs once on mount (client-side only) to ensure remote users and stories
 * are always available across all pages without waiting for individual page loads.
 */
export default function BootSync() {
  useEffect(() => {
    Storage.fetchRemoteUsers().catch(() => {});
    Storage.fetchRemoteStories().catch(() => {});
  }, []);
  return null;
}
