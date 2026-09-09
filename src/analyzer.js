export const RELATIONSHIPS = {
  not_following_back: "Not following me back",
  i_dont_follow_back: "I don’t follow back",
  mutual: "Mutual",
};

export function compareConnections(following, followers) {
  const outbound = new Map(following.map((a) => [a.key, a]));
  const inbound = new Map(followers.map((a) => [a.key, a]));
  const result = [];
  for (const [key, account] of outbound)
    result.push({
      key,
      username: account.username,
      relationship: inbound.has(key) ? "mutual" : "not_following_back",
      followedAt: account.timestamp,
    });
  for (const [key, account] of inbound)
    if (!outbound.has(key))
      result.push({
        key,
        username: account.username,
        relationship: "i_dont_follow_back",
        followedAt: null,
      });
  return result.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

export function buildAnalytics(accounts) {
  const mutual = accounts.filter((a) => a.relationship === "mutual").length;
  const following = accounts.filter(
    (a) => a.relationship !== "i_dont_follow_back",
  ).length;
  const followers = accounts.filter(
    (a) => a.relationship !== "not_following_back",
  ).length;
  return {
    followers,
    following,
    mutual,
    reciprocity: following ? (100 * mutual) / following : null,
    hasDates: accounts.some((a) => a.followedAt !== null),
  };
}

export function filterAccounts(
  accounts,
  { relationship = "all", search = "", sort = "az" } = {},
) {
  const query = search.trim().replace(/^@/, "").toLowerCase();
  return accounts
    .filter(
      (a) =>
        (relationship === "all" || a.relationship === relationship) &&
        a.key.includes(query),
    )
    .sort((a, b) => {
      if (sort === "newest" || sort === "oldest") {
        if (a.followedAt === null && b.followedAt !== null) return 1;
        if (b.followedAt === null && a.followedAt !== null) return -1;
        const delta = (a.followedAt ?? 0) - (b.followedAt ?? 0);
        if (delta) return sort === "newest" ? -delta : delta;
      }
      return (
        (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) * (sort === "za" ? -1 : 1)
      );
    });
}
