export interface IgUser {
  id: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  isVerified: boolean;
}

export interface NonFollowersProgress {
  phase: "resolving-user" | "following" | "followers" | "done";
  followingCount: number;
  followersCount: number;
}

export interface NonFollowersResult {
  notFollowingBack: IgUser[];
  followingCount: number;
  followersCount: number;
  updatedAt?: number;
}

const NON_FOLLOWERS_CACHE_KEY = "ig_lite_non_followers";
const WHITELIST_KEY = "ig_lite_whitelist";

export function loadWhitelist(): Set<string> {
  try {
    const raw = window.localStorage?.getItem(WHITELIST_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map((x) => String(x)));
    }
  } catch {
    // Ignore storage read errors
  }
  return new Set();
}

export function saveWhitelist(whitelist: Set<string>): void {
  try {
    window.localStorage?.setItem(WHITELIST_KEY, JSON.stringify(Array.from(whitelist)));
  } catch {
    // Ignore storage write errors
  }
}

export async function unfollowUser(userId: string): Promise<void> {
  const res = await fetch(`/api/v1/friendships/destroy/${encodeURIComponent(userId)}/`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...buildHeaders(),
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  if (res.status === 429) {
    throw new Error("Instagram API rate limit reached (429). Please wait before unfollowing more accounts.");
  }
  if (!res.ok) {
    throw new Error(`Failed to unfollow user (${res.status}).`);
  }
}

export function buildNonFollowersCsv(users: IgUser[]): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const rows = ["username,full_name,verified,profile_url"];
  for (const u of users) {
    rows.push(
      [
        escape(u.username),
        escape(u.fullName),
        u.isVerified ? "true" : "false",
        escape(`https://www.instagram.com/${u.username}/`),
      ].join(",")
    );
  }
  return rows.join("\n");
}

export function loadCachedNonFollowers(): NonFollowersResult | null {
  try {
    const raw = window.localStorage?.getItem(NON_FOLLOWERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NonFollowersResult>;
    if (parsed && Array.isArray(parsed.notFollowingBack)) {
      return {
        notFollowingBack: parsed.notFollowingBack,
        followingCount: Number(parsed.followingCount) || 0,
        followersCount: Number(parsed.followersCount) || 0,
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : undefined,
      };
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export function saveCachedNonFollowers(result: NonFollowersResult): void {
  try {
    window.localStorage?.setItem(NON_FOLLOWERS_CACHE_KEY, JSON.stringify(result));
  } catch {
    // Ignore storage write errors (e.g. quota exceeded)
  }
}

const IG_WEB_APP_ID = "936619743392459";
const PAGE_DELAY_MS = 280;

function readCookie(name: string): string {
  const cookies = (document.cookie || "").split(";");
  for (const part of cookies) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return "";
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "x-ig-app-id": IG_WEB_APP_ID,
    "x-requested-with": "XMLHttpRequest",
  };
  const csrf = readCookie("csrftoken");
  if (csrf) {
    headers["x-csrftoken"] = csrf;
  }
  return headers;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveCurrentUserId(signal?: AbortSignal): Promise<string> {
  const fromCookie = readCookie("ds_user_id");
  if (fromCookie && /^\d+$/.test(fromCookie)) {
    return fromCookie;
  }

  const res = await fetch("/api/v1/accounts/current_user/?edit=true", {
    method: "GET",
    credentials: "include",
    headers: buildHeaders(),
    signal,
  });

  if (res.ok) {
    const data = (await res.json()) as { user?: { pk?: string | number; id?: string | number } };
    const pk = data?.user?.pk ?? data?.user?.id;
    if (pk) return String(pk);
  }

  throw new Error("Could not resolve session info. Make sure you are logged into Instagram.");
}

interface RawIgUser {
  pk?: string | number;
  id?: string | number;
  username?: string;
  full_name?: string;
  profile_pic_url?: string;
  is_verified?: boolean;
}

interface FriendshipPageResponse {
  users?: RawIgUser[];
  next_max_id?: string | null;
  status?: string;
  message?: string;
}

function mapUser(raw: RawIgUser): IgUser {
  return {
    id: String(raw.pk ?? raw.id ?? raw.username ?? ""),
    username: String(raw.username ?? ""),
    fullName: String(raw.full_name ?? ""),
    profilePicUrl: String(raw.profile_pic_url ?? ""),
    isVerified: Boolean(raw.is_verified),
  };
}

async function fetchFriendshipList(
  userId: string,
  kind: "following" | "followers",
  onCount: (count: number) => void,
  signal?: AbortSignal
): Promise<IgUser[]> {
  const users: IgUser[] = [];
  let maxId: string | null = null;
  const seenCursors = new Set<string>();

  for (let page = 0; page < 200; page++) {
    if (signal?.aborted) {
      throw new DOMException("Cancelled", "AbortError");
    }

    const qs = new URLSearchParams({ count: "50" });
    if (maxId) qs.set("max_id", maxId);

    const res = await fetch(`/api/v1/friendships/${userId}/${kind}/?${qs.toString()}`, {
      method: "GET",
      credentials: "include",
      headers: buildHeaders(),
      signal,
    });

    if (res.status === 429) {
      throw new Error("Instagram API rate limit reached (429). Please wait a few minutes and try again.");
    }
    if (!res.ok) {
      throw new Error(`Instagram API error (${res.status}). Please check your session.`);
    }

    const data = (await res.json()) as FriendshipPageResponse;
    if (Array.isArray(data.users)) {
      for (const raw of data.users) {
        if (raw.username) {
          users.push(mapUser(raw));
        }
      }
      onCount(users.length);
    }

    const next = data.next_max_id ? String(data.next_max_id) : null;
    if (!next || seenCursors.has(next)) {
      break;
    }
    seenCursors.add(next);
    maxId = next;

    await sleep(PAGE_DELAY_MS);
  }

  return users;
}

export async function fetchNonFollowers(
  onProgress?: (progress: NonFollowersProgress) => void,
  signal?: AbortSignal
): Promise<NonFollowersResult> {
  onProgress?.({ phase: "resolving-user", followingCount: 0, followersCount: 0 });
  const userId = await resolveCurrentUserId(signal);

  let followingCount = 0;
  let followersCount = 0;

  onProgress?.({ phase: "following", followingCount: 0, followersCount: 0 });
  const following = await fetchFriendshipList(
    userId,
    "following",
    (count) => {
      followingCount = count;
      onProgress?.({ phase: "following", followingCount, followersCount });
    },
    signal
  );

  onProgress?.({ phase: "followers", followingCount, followersCount: 0 });
  const followers = await fetchFriendshipList(
    userId,
    "followers",
    (count) => {
      followersCount = count;
      onProgress?.({ phase: "followers", followingCount, followersCount });
    },
    signal
  );

  const followerKeys = new Set<string>();
  for (const f of followers) {
    if (f.id) followerKeys.add(f.id);
    if (f.username) followerKeys.add(f.username.toLowerCase());
  }

  const notFollowingBack = following.filter((u) => {
    const byId = u.id && followerKeys.has(u.id);
    const byName = u.username && followerKeys.has(u.username.toLowerCase());
    return !byId && !byName;
  });

  onProgress?.({ phase: "done", followingCount, followersCount });

  const result: NonFollowersResult = {
    notFollowingBack,
    followingCount,
    followersCount,
    updatedAt: Date.now(),
  };
  saveCachedNonFollowers(result);

  return result;
}
