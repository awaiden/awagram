import * as React from "react";
import {
  BadgeCheck,
  CircleDashed,
  Code2,
  Compass,
  Download,
  ExternalLink,
  EyeOff,
  Film,
  Info,
  Loader2,
  MessageSquareOff,
  Search,
  ShieldBan,
  Smartphone,
  Sparkles,
  UserMinus,
  UserX,
  Zap,
} from "lucide-react";
import { OPEN_DRAWER_EVENT, type LitePrefs } from "../core";
import {
  buildNonFollowersCsv,
  fetchNonFollowers,
  loadCachedNonFollowers,
  loadWhitelist,
  saveCachedNonFollowers,
  saveWhitelist,
  unfollowUser,
  type IgUser,
  type NonFollowersProgress,
  type NonFollowersResult,
} from "../instagramApi";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Switch } from "./ui/switch";

interface LiteSettingsDrawerProps {
  initialPrefs: LitePrefs;
  portalContainer: HTMLElement | null;
  onChangePrefs: (next: LitePrefs) => void;
}

interface SettingRow {
  key: keyof LitePrefs;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTING_ROWS: SettingRow[] = [
  {
    key: "hideReels",
    label: "Block Reels",
    description: "Marks Reels tab as blocked, hides feed Reels, and redirects /reels.",
    icon: Film,
  },
  {
    key: "hideExplore",
    label: "Hide Explore",
    description: "Hides the Explore media grid while keeping account search.",
    icon: Compass,
  },
  {
    key: "hideSuggested",
    label: "Hide Suggested",
    description: "Hides Suggested for you posts in your feed.",
    icon: Sparkles,
  },
  {
    key: "hideAds",
    label: "Block Ads",
    description: "Hides Sponsored posts and paid partnership ads.",
    icon: ShieldBan,
  },
  {
    key: "hideUseApp",
    label: 'Hide "Use the App"',
    description: "Hides WebView app download and open-in-app banners.",
    icon: Smartphone,
  },
  {
    key: "hideStories",
    label: "Hide Stories",
    description: "Hides the Stories tray at the top of the home feed.",
    icon: CircleDashed,
  },
  {
    key: "hideDms",
    label: "Hide DMs",
    description: "Hides Direct Message icon and badge in navigation.",
    icon: MessageSquareOff,
  },
];

type DrawerTab = "settings" | "non-followers" | "about";

export const LiteSettingsDrawer: React.FC<LiteSettingsDrawerProps> = ({
  initialPrefs,
  portalContainer,
  onChangePrefs,
}) => {
  const [prefs, setPrefs] = React.useState<LitePrefs>(initialPrefs);
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<DrawerTab>("settings");

  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState<NonFollowersProgress | null>(null);
  const [result, setResult] = React.useState<NonFollowersResult | null>(() =>
    loadCachedNonFollowers()
  );
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [whitelist, setWhitelist] = React.useState<Set<string>>(() => loadWhitelist());
  const [unfollowingId, setUnfollowingId] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_DRAWER_EVENT, onOpen);

    return () => {
      window.removeEventListener(OPEN_DRAWER_EVENT, onOpen);
      abortRef.current?.abort();
    };
  }, []);

  const handleToggle = (key: keyof LitePrefs, checked: boolean) => {
    const next = { ...prefs, [key]: checked };
    setPrefs(next);
    onChangePrefs(next);
  };

  const handleStartScan = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setProgress({ phase: "resolving-user", followingCount: 0, followersCount: 0 });

    try {
      const data = await fetchNonFollowers((p) => setProgress(p), controller.signal);
      setResult(data);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError((err as Error)?.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const handleIgnoreUser = (user: IgUser) => {
    const key = user.id || user.username.toLowerCase();
    const next = new Set(whitelist);
    next.add(key);
    setWhitelist(next);
    saveWhitelist(next);
  };

  const handleResetWhitelist = () => {
    const empty = new Set<string>();
    setWhitelist(empty);
    saveWhitelist(empty);
  };

  const handleUnfollow = async (user: IgUser) => {
    if (!user.id || unfollowingId) return;
    setUnfollowingId(user.id);
    setError(null);
    try {
      await unfollowUser(user.id);
      if (result) {
        const updated: NonFollowersResult = {
          ...result,
          notFollowingBack: result.notFollowingBack.filter((u) => u.id !== user.id),
          followingCount: Math.max(0, result.followingCount - 1),
        };
        setResult(updated);
        saveCachedNonFollowers(updated);
      }
    } catch (err) {
      setError((err as Error)?.message || "Failed to unfollow user.");
    } finally {
      setUnfollowingId(null);
    }
  };

  const handleExportCsv = () => {
    if (filteredUsers.length === 0) return;
    const csv = buildNonFollowersCsv(filteredUsers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ig-lite-not-following-back.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const filteredUsers = React.useMemo(() => {
    if (!result) return [];
    const q = query.trim().toLowerCase();
    return result.notFollowingBack.filter((u) => {
      const key = u.id || u.username.toLowerCase();
      if (whitelist.has(key) || whitelist.has(u.username.toLowerCase())) {
        return false;
      }
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q)
      );
    });
  }, [result, query, whitelist]);

  const progressText = React.useMemo(() => {
    if (!progress) return "";
    if (progress.phase === "resolving-user") return "Verifying account...";
    if (progress.phase === "following") {
      return `Fetching following (${progress.followingCount})...`;
    }
    if (progress.phase === "followers") {
      return `Fetching followers (${progress.followersCount})...`;
    }
    return "";
  }, [progress]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent portalContainer={portalContainer}>
        <DrawerHeader>
          <DrawerTitle>awagram</DrawerTitle>
          <DrawerDescription>
            {activeTab === "settings"
              ? "Toggle distracting Instagram features on or off."
              : activeTab === "non-followers"
                ? "List accounts that don't follow you back via Instagram Web API."
                : "Open-source, distraction-free Instagram wrapper."}
          </DrawerDescription>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "6px",
              padding: "4px",
              marginTop: "10px",
              borderRadius: "12px",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
            }}
          >
            <button
              id="ig-lite-tab-settings"
              type="button"
              onClick={() => setActiveTab("settings")}
              style={{
                padding: "7px 8px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: activeTab === "settings" ? "#fafafa" : "transparent",
                color: activeTab === "settings" ? "#09090b" : "#a1a1aa",
              }}
            >
              Settings
            </button>
            <button
              id="ig-lite-tab-non-followers"
              type="button"
              onClick={() => setActiveTab("non-followers")}
              style={{
                padding: "7px 8px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: activeTab === "non-followers" ? "#fafafa" : "transparent",
                color: activeTab === "non-followers" ? "#09090b" : "#a1a1aa",
              }}
            >
              Not Following
            </button>
            <button
              id="ig-lite-tab-about"
              type="button"
              onClick={() => setActiveTab("about")}
              style={{
                padding: "7px 8px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                backgroundColor: activeTab === "about" ? "#fafafa" : "transparent",
                color: activeTab === "about" ? "#09090b" : "#a1a1aa",
              }}
            >
              About
            </button>
          </div>
        </DrawerHeader>

        {activeTab === "settings" ? (
          <div
            className="flex flex-col gap-2 px-5 py-2"
            style={{ maxHeight: "48vh", overflowY: "auto" }}
          >
            {SETTING_ROWS.map((row) => {
              const Icon = row.icon;
              const checked = Boolean(prefs[row.key]);
              return (
                <label
                  key={row.key}
                  htmlFor={`ig-lite-switch-${row.key}`}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-zinc-800/90 bg-zinc-900/70 px-3.5 py-2.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-zinc-100">
                        {row.label}
                      </span>
                      <span className="text-[11px] leading-snug text-zinc-400">
                        {row.description}
                      </span>
                    </div>
                  </div>
                  <Switch
                    id={`ig-lite-switch-${row.key}`}
                    checked={checked}
                    onCheckedChange={(nextChecked) => handleToggle(row.key, nextChecked)}
                  />
                </label>
              );
            })}
          </div>
        ) : activeTab === "about" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "8px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px",
                borderRadius: "14px",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "#09090b",
                  border: "1px solid #3f3f46",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fafafa",
                  flexShrink: 0,
                }}
              >
                <Zap className="h-5 w-5" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#fafafa" }}>
                    awagram
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 6px",
                      borderRadius: "9999px",
                      backgroundColor: "#27272a",
                      color: "#d4d4d8",
                    }}
                  >
                    v0.1.2 · MIT
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#a1a1aa" }}>
                  Built by Halil Aydın (@awaiden) with Tauri v2, Rust & React
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "14px",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                fontSize: "12px",
                color: "#d4d4d8",
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fafafa", fontWeight: 600 }}>
                <Info className="h-4 w-4" />
                <span>Quick Tips</span>
              </div>
              <span style={{ color: "#a1a1aa" }}>
                • Long-press the locked Reels icon, shake your phone, or press{" "}
                <strong style={{ color: "#e4e4e7" }}>Ctrl/Cmd + Shift + L</strong> on any page to open this drawer.
              </span>
              <span style={{ color: "#a1a1aa" }}>
                • All preferences, whitelist entries, and non-follower cache stay 100% local on your device.
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <a
                href="https://github.com/awaiden/awagram"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "#fafafa",
                  color: "#09090b",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Code2 className="h-4 w-4" />
                <span>GitHub Repo</span>
              </a>
              <a
                href="https://github.com/awaiden/awagram/issues"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  color: "#fafafa",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <ExternalLink className="h-4 w-4" />
                <span>Report Issue</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 px-5 py-2">
            <div className="flex items-center gap-2">
              <button
                id="ig-lite-scan-non-followers"
                type="button"
                disabled={loading}
                onClick={handleStartScan}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: loading ? "#27272a" : "#fafafa",
                  color: loading ? "#a1a1aa" : "#09090b",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{progressText}</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4" />
                    <span>{result ? "Re-run Analysis" : "Start Analysis"}</span>
                  </>
                )}
              </button>

              {loading && (
                <button
                  type="button"
                  onClick={handleCancelScan}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #3f3f46",
                    backgroundColor: "#18181b",
                    color: "#e4e4e7",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}

              {!loading && filteredUsers.length > 0 && (
                <button
                  id="ig-lite-export-csv"
                  type="button"
                  onClick={handleExportCsv}
                  title="Export CSV"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #3f3f46",
                    backgroundColor: "#18181b",
                    color: "#e4e4e7",
                    cursor: "pointer",
                  }}
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>

            {whitelist.size > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleResetWhitelist}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#a1a1aa",
                    fontSize: "11px",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Reset ignored ({whitelist.size})
                </button>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(127, 29, 29, 0.35)",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                  color: "#fca5a5",
                  fontSize: "12px",
                }}
              >
                {error}
              </div>
            )}

            {result && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#a1a1aa",
                    padding: "2px 2px",
                  }}
                >
                  <span>
                    Not following back:{" "}
                    <strong style={{ color: "#fafafa" }}>
                      {result.notFollowingBack.length}
                    </strong>
                  </span>
                  <span>
                    {result.followingCount} following · {result.followersCount} followers
                    {result.updatedAt
                      ? ` · ${new Date(result.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : ""}
                  </span>
                </div>

                {result.notFollowingBack.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                    }}
                  >
                    <Search className="h-3.5 w-3.5 text-zinc-400" />
                    <input
                      id="ig-lite-non-followers-search"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search username..."
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "#fafafa",
                        fontSize: "12px",
                      }}
                    />
                  </div>
                )}

                <div
                  style={{
                    maxHeight: "38vh",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    paddingRight: "2px",
                  }}
                >
                  {filteredUsers.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px 10px",
                        fontSize: "12px",
                        color: "#71717a",
                      }}
                    >
                      {result.notFollowingBack.length === 0
                        ? "Awesome! Everyone you follow follows you back."
                        : "No matching users found."}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id || user.username}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          padding: "8px 10px",
                          borderRadius: "12px",
                          backgroundColor: "#18181b",
                          border: "1px solid #27272a",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            minWidth: 0,
                          }}
                        >
                          {user.profilePicUrl ? (
                            <img
                              src={user.profilePicUrl}
                              alt={user.username}
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "9999px",
                                objectFit: "cover",
                                flexShrink: 0,
                                backgroundColor: "#27272a",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "9999px",
                                backgroundColor: "#27272a",
                                color: "#e4e4e7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {user.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#fafafa",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span>@{user.username}</span>
                              {user.isVerified && (
                                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                              )}
                            </div>
                            {user.fullName && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#a1a1aa",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {user.fullName}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                          <button
                            type="button"
                            title="Ignore"
                            aria-label={`Ignore ${user.username}`}
                            onClick={() => handleIgnoreUser(user)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "6px",
                              borderRadius: "8px",
                              border: "1px solid #3f3f46",
                              backgroundColor: "#27272a",
                              color: "#a1a1aa",
                              cursor: "pointer",
                            }}
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            title="Unfollow"
                            aria-label={`Unfollow ${user.username}`}
                            disabled={unfollowingId === user.id}
                            onClick={() => handleUnfollow(user)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "6px",
                              borderRadius: "8px",
                              border: "1px solid rgba(239, 68, 68, 0.35)",
                              backgroundColor: "rgba(127, 29, 29, 0.25)",
                              color: "#fca5a5",
                              cursor: unfollowingId === user.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {unfollowingId === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserMinus className="h-3.5 w-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Open Profile"
                            aria-label={`Open ${user.username} profile`}
                            onClick={() => {
                              setOpen(false);
                              window.location.assign(`/${encodeURIComponent(user.username)}/`);
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "6px",
                              borderRadius: "8px",
                              border: "1px solid #3f3f46",
                              backgroundColor: "#27272a",
                              color: "#fafafa",
                              cursor: "pointer",
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <DrawerFooter>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-full cursor-pointer rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              Done
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
