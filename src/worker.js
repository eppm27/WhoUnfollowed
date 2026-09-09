import { parseFiles, MAX_TOTAL_BYTES } from "./parser.js";
import { compareConnections, buildAnalytics } from "./analyzer.js";
self.onmessage = async ({ data }) => {
  try {
    if (
      [...data.following, ...data.followers].reduce(
        (sum, f) => sum + f.size,
        0,
      ) > MAX_TOTAL_BYTES
    )
      throw new Error("Choose at most 64 MB of JSON files per analysis.");
    const following = await parseFiles(data.following, "following");
    const followers = await parseFiles(data.followers, "followers");
    const accounts = compareConnections(following.accounts, followers.accounts);
    // Future timestamps cannot describe an existing follow. Leave those dates unknown.
    const now = Math.floor(Date.now() / 1000);
    for (const account of accounts)
      if (account.followedAt > now) account.followedAt = null;
    self.postMessage({
      accounts,
      metrics: buildAnalytics(accounts),
      warnings: [...following.warnings, ...followers.warnings],
    });
  } catch (error) {
    self.postMessage({
      error:
        error.message || "Could not read these files. Try a fresh JSON export.",
    });
  }
};
