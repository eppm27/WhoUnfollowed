/** Accept only known relationship containers; never search unrelated export data. */
export function parseInstagramExport(data, kind, filename = "") {
  if (!["followers", "following"].includes(kind))
    throw new Error("Unknown relationship type.");
  const opposite = kind === "followers" ? "following" : "followers";
  const expected = kind === "followers" ? "followers_*.json" : "following.json";
  const wrong = () =>
    new Error(
      `Use ${expected} in the ${kind} box. Export Followers and following as JSON.`,
    );
  if (new RegExp(`^${opposite}(?:_\\d+)?\\.json$`, "i").test(filename))
    throw wrong();
  let entries;
  if (Array.isArray(data)) entries = data;
  else if (data && typeof data === "object") {
    if (`relationships_${opposite}` in data || opposite in data) throw wrong();
    const keys = [`relationships_${kind}`, kind].filter((key) =>
      Object.hasOwn(data, key),
    );
    if (keys.length !== 1 || !Array.isArray(data[keys[0]])) throw wrong();
    entries = data[keys[0]];
  } else throw wrong();
  const result = normalizeAccounts(entries);
  if (entries.length && !result.accounts.length)
    throw new Error(
      `No readable usernames in ${filename || expected}. Download a fresh JSON export.`,
    );
  return result;
}

function username(value) {
  if (typeof value !== "string") return null;
  const display = value.trim().replace(/^@/, "");
  return /^[a-zA-Z0-9._]{1,30}$/.test(display) ? display : null;
}

function profileUsername(href) {
  if (typeof href !== "string") return null;
  try {
    const url = new URL(href);
    if (
      url.protocol !== "https:" ||
      !["instagram.com", "www.instagram.com"].includes(url.hostname)
    )
      return null;
    const match = url.pathname.match(/^\/(?:_u\/)?([a-zA-Z0-9._]{1,30})\/?$/);
    return match ? username(match[1]) : null;
  } catch {
    return null;
  }
}

function timestamp(value) {
  // Unix seconds only. Unknown/millisecond/implausible values do not become dates.
  return Number.isInteger(value) && value >= 1286323200 && value <= 4102444800
    ? value
    : null;
}

export function normalizeAccounts(entries) {
  const raw = [];
  let skipped = 0;
  for (const entry of entries) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !Array.isArray(entry.string_list_data)
    ) {
      skipped++;
      continue;
    }
    const items = entry.string_list_data.filter(
      (item) => item && typeof item === "object",
    );
    const title = username(entry.title);
    const item =
      items.find((item) => username(item.value)) ||
      items.find((item) => profileUsername(item.href));
    const display =
      username(item?.value) || title || profileUsername(item?.href);
    if (!display) {
      skipped++;
      continue;
    }
    const matchingItem = items.find(
      (item) =>
        (username(item.value) || profileUsername(item.href))?.toLowerCase() ===
        display.toLowerCase(),
    );
    const dateItem = matchingItem || (items.length === 1 ? items[0] : null);
    raw.push({
      key: display.toLowerCase(),
      username: display,
      timestamp: timestamp(dateItem?.timestamp),
      dateConflict: false,
    });
  }
  const accounts = mergeAccounts(raw);
  return { accounts, skipped, duplicates: raw.length - accounts.length };
}

export function mergeAccounts(accounts) {
  const unique = new Map();
  for (const account of accounts) {
    const previous = unique.get(account.key);
    if (!previous) {
      unique.set(account.key, { ...account });
      continue;
    }
    // Disagreeing dates are unknown, not an invented earliest/latest follow.
    if (
      previous.dateConflict ||
      account.dateConflict ||
      (previous.timestamp !== null &&
        account.timestamp !== null &&
        previous.timestamp !== account.timestamp)
    ) {
      previous.timestamp = null;
      previous.dateConflict = true;
    } else if (previous.timestamp === null)
      previous.timestamp = account.timestamp;
  }
  return [...unique.values()];
}

export const MAX_FILE_BYTES = 16 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 64 * 1024 * 1024;
export function validateFiles(files, kind) {
  if (!files.length)
    throw new Error(
      `Choose ${kind === "following" ? "following.json" : "all followers_*.json files"}.`,
    );
  if (kind === "following" && files.length !== 1)
    throw new Error("Choose one following.json file.");
  for (const file of files) {
    if (!/\.json$/i.test(file.name))
      throw new Error(`${file.name}: choose JSON files, not ZIP or HTML.`);
    if (file.size > MAX_FILE_BYTES)
      throw new Error(`${file.name}: exceeds 16 MB. Choose a smaller export.`);
    if (!file.size)
      throw new Error(`${file.name} is empty. Download the export again.`);
  }
}

export function followerFileWarnings(names) {
  const numbers = [
    ...new Set(
      names
        .map((name) => /^followers_(\d+)\.json$/i.exec(name)?.[1])
        .filter(Boolean)
        .map(Number),
    ),
  ].sort((a, b) => a - b);
  if (
    numbers.length &&
    (numbers[0] !== 1 || numbers.some((n, i) => i && n !== numbers[i - 1] + 1))
  ) {
    return [
      "A followers file may be missing. Add every followers_*.json file from the same export.",
    ];
  }
  return [];
}

export async function parseFiles(files, kind) {
  validateFiles(files, kind);
  let skipped = 0,
    duplicates = 0;
  const accounts = [],
    warnings = [],
    fingerprints = new Set();
  for (const file of files) {
    const text = await file.text();
    const fingerprint = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text),
    );
    const hash = Array.from(new Uint8Array(fingerprint), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    if (fingerprints.has(hash)) {
      warnings.push(`${file.name}: duplicate file ignored.`);
      continue;
    }
    fingerprints.add(hash);
    let data;
    try {
      data = JSON.parse(text.replace(/^\uFEFF/, ""));
    } catch {
      throw new Error(
        `${file.name}: invalid JSON. Extract the ZIP or download a fresh JSON export.`,
      );
    }
    const parsed = parseInstagramExport(data, kind, file.name);
    for (const account of parsed.accounts) accounts.push(account);
    skipped += parsed.skipped;
    duplicates += parsed.duplicates;
    if (!parsed.accounts.length)
      warnings.push(`${file.name}: empty relationship list.`);
  }
  const merged = mergeAccounts(accounts);
  duplicates += accounts.length - merged.length;
  if (skipped)
    warnings.push(
      `${skipped} unreadable ${kind} entries skipped. Results may be incomplete; try a fresh export.`,
    );
  if (duplicates)
    warnings.push(`${duplicates} duplicate ${kind} entries combined.`);
  if (kind === "followers")
    warnings.push(...followerFileWarnings(files.map((file) => file.name)));
  return { accounts: merged, warnings };
}
