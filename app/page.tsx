"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

/** Theme catalogue shown in the picker (kept local so the landing stays light). */
const THEMES = [
  { id: "premium", name: "Premium", desc: "Glass card + animated equalizer" },
  { id: "minimal", name: "Minimal", desc: "Clean one-liner, no chrome" },
  { id: "retro", name: "Retro", desc: "Synthwave cassette + scanlines" },
  { id: "neon", name: "Neon", desc: "High-glow pulsing border" },
] as const;

const AUTH_MESSAGES: Record<string, { ok: boolean; text: string }> = {
  success: { ok: true, text: "Spotify connected! You're ready to stream." },
  denied: { ok: false, text: "Authorization was denied." },
  state_mismatch: { ok: false, text: "Security check failed (state mismatch). Try again." },
  missing_code: { ok: false, text: "Spotify didn't return an authorization code." },
  exchange_failed: { ok: false, text: "Token exchange failed — check your client secret." },
  no_refresh_token: { ok: false, text: "No refresh token returned. Try connecting again." },
};

const BASE_URL = "http://127.0.0.1:3000";

export default function Home() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<string>("premium");
  const [authNotice, setAuthNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Read the ?auth= status the OAuth callback redirected us back with.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    if (auth && AUTH_MESSAGES[auth]) setAuthNotice(AUTH_MESSAGES[auth]);
    // Clean the URL so a refresh doesn't re-show the notice.
    if (auth) window.history.replaceState({}, "", "/");
  }, []);

  // Fetch connection status on mount.
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setAuthorized(!!d.authorized))
      .catch(() => setAuthorized(false));
  }, [authNotice]);

  const overlayUrl = `${BASE_URL}/overlay?theme=${theme}`;

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  async function disconnect() {
    await fetch("/api/auth/disconnect", { method: "POST" });
    setAuthorized(false);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.logo}>♪</div>
          <h1 className={styles.title}>Spotify Streaming Overlay</h1>
          <p className={styles.subtitle}>
            A free, open-source now-playing overlay for OBS. Local-first, multi-theme.
          </p>
        </header>

        {authNotice && (
          <div
            className={styles.notice}
            data-ok={authNotice.ok}
            role="status"
          >
            {authNotice.text}
          </div>
        )}

        {/* Step 1 — connect */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.step}>1</span>
            <h2>Connect your Spotify</h2>
          </div>

          {authorized === null ? (
            <p className={styles.muted}>Checking connection…</p>
          ) : authorized ? (
            <div className={styles.connectedRow}>
              <span className={styles.connected}>● Connected</span>
              <button className={styles.ghostBtn} onClick={disconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <>
              <p className={styles.muted}>
                Authorize once. Your refresh token is stored locally on this
                machine — nothing leaves your computer.
              </p>
              <a className={styles.primaryBtn} href="/api/auth/login">
                Connect Spotify
              </a>
            </>
          )}
        </section>

        {/* Step 2 — pick a theme */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.step}>2</span>
            <h2>Pick a theme</h2>
          </div>

          <div className={styles.themes}>
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={styles.themeBtn}
                data-active={theme === t.id}
                onClick={() => setTheme(t.id)}
              >
                <span className={styles.themeName}>{t.name}</span>
                <span className={styles.themeDesc}>{t.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3 — add to OBS */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.step}>3</span>
            <h2>Add to OBS</h2>
          </div>
          <p className={styles.muted}>
            In OBS: <strong>Sources → + → Browser</strong>, then paste this URL.
            Set width ~480, height ~140, and check “Refresh browser when scene
            becomes active”.
          </p>

          <div className={styles.urlRow}>
            <code className={styles.url}>{overlayUrl}</code>
            <button className={styles.copyBtn} onClick={copyUrl}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <a className={styles.previewLink} href={`/overlay?theme=${theme}`} target="_blank" rel="noreferrer">
            Open preview in a new tab ↗
          </a>
        </section>

        <footer className={styles.footer}>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            Open source · MIT
          </a>
        </footer>
      </div>
    </main>
  );
}
