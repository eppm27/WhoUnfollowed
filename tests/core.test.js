import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import {
  parseInstagramExport as parse,
  parseFiles,
  mergeAccounts,
  followerFileWarnings,
  validateFiles,
  MAX_FILE_BYTES,
} from "../src/parser.js";
import {
  compareConnections,
  buildAnalytics,
  filterAccounts,
} from "../src/analyzer.js";
import { escapeCsv, exportCsv } from "../src/exportCsv.js";
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const entry = (value, timestamp) => ({
  string_list_data: [{ value, timestamp }],
});
const parsed = (names, kind = "followers") =>
  parse(
    names.map((n) => entry(n)),
    kind,
  ).accounts;
const file = (name, data) => {
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return { name, size: Buffer.byteLength(text), text: async () => text };
};
test("basic classification, mutual count and reciprocity", () => {
  const rows = compareConnections(
    parsed(["a", "b"], "following"),
    parsed(["b", "c"]),
  );
  assert.deepEqual(
    rows.map((a) => [a.key, a.relationship]),
    [
      ["a", "not_following_back"],
      ["b", "mutual"],
      ["c", "i_dont_follow_back"],
    ],
  );
  assert.deepEqual(buildAnalytics(rows), {
    following: 2,
    followers: 2,
    mutual: 1,
    reciprocity: 50,
    hasDates: false,
  });
});
test("case, whitespace, @ prefix and duplicates preserve first display name", () => {
  const r = parse(
    [entry(" Alice "), entry("@ALICE"), entry("alice")],
    "followers",
  );
  assert.equal(r.accounts.length, 1);
  assert.equal(r.duplicates, 2);
  assert.equal(r.accounts[0].username, "Alice");
});
test("empty arrays are valid, zero following gives undefined reciprocity", () => {
  assert.deepEqual(parse([], "followers").accounts, []);
  assert.equal(buildAnalytics([]).reciprocity, null);
  assert.equal(
    buildAnalytics(compareConnections([], parsed(["a"]))).reciprocity,
    null,
  );
});
test("malformed entries and missing usernames are skipped with a count", () => {
  const r = parse(
    [
      null,
      4,
      {},
      { string_list_data: [] },
      { string_list_data: [null] },
      entry(42),
      entry("valid"),
    ],
    "followers",
  );
  assert.equal(r.skipped, 6);
  assert.equal(r.accounts.length, 1);
  assert.throws(() => parse([{}], "followers"), /No readable usernames/);
});
test("title and safe profile URL variants", () => {
  for (const data of [
    {
      title: "Alice",
      string_list_data: [
        { href: "https://www.instagram.com/_u/Alice", timestamp: 1700000000 },
      ],
    },
    { title: "Alice", string_list_data: [{ timestamp: 1700000000 }] },
    {
      string_list_data: [
        { href: "https://instagram.com/Alice/", timestamp: 1700000000 },
      ],
    },
  ]) {
    const r = parse({ relationships_following: [data] }, "following");
    assert.equal(r.accounts[0].key, "alice");
    assert.equal(r.accounts[0].timestamp, 1700000000);
  }
});
test("missing arrays and unsafe URLs are rejected; usernames cannot inject markup", () => {
  for (const data of [
    { title: "alice" },
    entry("<img src=x>"),
    { string_list_data: [{ href: "https://evil.example/alice" }] },
  ])
    assert.throws(() => parse([data], "followers"));
});
test("unexpected, wrong and ambiguous containers fail", () => {
  for (const data of [
    { random: [] },
    { relationships_followers: null },
    null,
    "x",
    22,
    { followers: [], relationships_followers: [] },
  ])
    assert.throws(() => parse(data, "followers"));
  assert.throws(
    () => parse({ relationships_following: [] }, "followers"),
    /Use followers/,
  );
  assert.throws(
    () => parse([], "following", "followers_1.json"),
    /Use following/,
  );
  assert.throws(
    () => parse([], "followers", "following.json"),
    /Use followers/,
  );
});
test("all supported wrapped shapes", () => {
  for (const key of ["followers", "relationships_followers"])
    assert.equal(
      parse({ [key]: [entry("a")] }, "followers").accounts.length,
      1,
    );
  for (const key of ["following", "relationships_following"])
    assert.equal(
      parse({ [key]: [entry("a")] }, "following").accounts.length,
      1,
    );
});
test("multiple followers files deduplicate across parts", async () => {
  const r = await parseFiles(
    [
      file("followers_1.json", [entry("a"), entry("b")]),
      file("followers_2.json", [entry("B"), entry("c")]),
    ],
    "followers",
  );
  assert.equal(r.accounts.length, 3);
  assert.match(r.warnings.join(), /1 duplicate/);
});
test("identical content under different names is detected", async () => {
  const r = await parseFiles(
    [
      file("followers_1.json", [entry("a")]),
      file("followers_2.json", [entry("a")]),
    ],
    "followers",
  );
  assert.equal(r.accounts.length, 1);
  assert.match(r.warnings.join(), /duplicate file ignored/);
});
test("missing first or intermediate parts warn, contiguous parts do not claim completeness", () => {
  assert.equal(followerFileWarnings(["followers_2.json"]).length, 1);
  assert.equal(
    followerFileWarnings(["followers_1.json", "followers_3.json"]).length,
    1,
  );
  assert.deepEqual(
    followerFileWarnings(["followers_1.json", "followers_2.json"]),
    [],
  );
});
test("file type, empty bytes, size, JSON, missing selection, and following cardinality", async () => {
  for (const f of [
    { name: "a.zip", size: 5 },
    { name: "a.json", size: 0 },
    { name: "a.json", size: MAX_FILE_BYTES + 1 },
  ])
    assert.throws(() => validateFiles([f], "followers"));
  assert.throws(() => validateFiles([], "followers"));
  assert.throws(() =>
    validateFiles(
      [file("following.json", []), file("second.json", [])],
      "following",
    ),
  );
  await assert.rejects(
    parseFiles([file("followers_1.json", "{bad")], "followers"),
    /invalid JSON/,
  );
  const r = await parseFiles(
    [file("followers_1.json", "\uFEFF[]")],
    "followers",
  );
  assert.match(r.warnings.join(), /empty relationship list/);
});
test("timestamps only from the following side; conflicts become unknown", () => {
  const a = parse([entry("a", 1700000000)], "following").accounts;
  const b = parse(
    [entry("a", 1800000000), entry("b", 1800000000)],
    "followers",
  ).accounts;
  const rows = compareConnections(a, b);
  assert.equal(rows[0].followedAt, 1700000000);
  assert.equal(rows[1].followedAt, null);
  const conflicts = mergeAccounts([...a, ...b]);
  assert.equal(conflicts[0].timestamp, null);
  assert.equal(conflicts[0].dateConflict, true);
  assert.equal(mergeAccounts([...conflicts, ...a])[0].timestamp, null);
  for (const stamp of [0, -1, 1700000000000, "1700000000", null])
    assert.equal(
      parse([entry("a", stamp)], "followers").accounts[0].timestamp,
      null,
    );
});
test("search, relationship filters and date sort keep unknown dates last", () => {
  const rows = compareConnections(
    parse(
      [entry("b", 1700000000), entry("a", 1800000000), entry("c")],
      "following",
    ).accounts,
    parsed(["a", "d"]),
  );
  assert.deepEqual(
    filterAccounts(rows, { search: " @A " }).map((a) => a.key),
    ["a"],
  );
  assert.deepEqual(
    filterAccounts(rows, { relationship: "mutual" }).map((a) => a.key),
    ["a"],
  );
  assert.deepEqual(
    filterAccounts(rows, { sort: "newest" }).map((a) => a.key),
    ["a", "b", "c", "d"],
  );
  assert.deepEqual(
    filterAccounts(rows, { sort: "oldest" }).map((a) => a.key),
    ["b", "a", "c", "d"],
  );
  assert.deepEqual(
    filterAccounts(rows, { sort: "za" }).map((a) => a.key),
    ["d", "c", "b", "a"],
  );
});
test("CSV escapes commas, quotes, newlines and spreadsheet formulas", () => {
  assert.equal(escapeCsv("a,b"), '"a,b"');
  assert.equal(escapeCsv('a"b'), '"a""b"');
  assert.equal(escapeCsv("a\nb"), '"a\nb"');
  for (const v of ["=cmd", "+cmd", "-cmd", "@cmd", " \t=cmd"])
    assert.equal(escapeCsv(v), `'${v}`);
  const rows = compareConnections(parsed(["a"], "following"), parsed(["b"]));
  assert.equal(
    exportCsv(rows),
    "username,relationship\r\na,not_following_back\r\nb,i_dont_follow_back\r\n",
  );
  const dated = compareConnections(
    parse([entry("a", 1700000000)], "following").accounts,
    parsed(["b"]),
  );
  assert.match(
    exportCsv(dated),
    /followed_at\r\na,not_following_back,2023-11-14T22:13:20.000Z\r\nb,i_dont_follow_back,\r\n/,
  );
});
test("realistic anonymized fixtures integrate parser, analytics and export", async () => {
  const fixture = async (name) =>
    file(
      name,
      await readFile(new URL(`fixtures/${name}`, import.meta.url), "utf8"),
    );
  const following = await parseFiles(
    [await fixture("following.json")],
    "following",
  );
  const followers = await parseFiles(
    [await fixture("followers_1.json"), await fixture("followers_2.json")],
    "followers",
  );
  const rows = compareConnections(following.accounts, followers.accounts);
  assert.deepEqual(buildAnalytics(rows), {
    following: 8,
    followers: 6,
    mutual: 4,
    reciprocity: 50,
    hasDates: true,
  });
  assert.equal(exportCsv(rows).split("\r\n").length, 12);
});
test("large inputs preserve counts without a table dependency", () => {
  const following = parsed(
    Array.from({ length: 30000 }, (_, i) => `user${i}`),
    "following",
  );
  const followers = parsed(
    Array.from({ length: 30000 }, (_, i) => `user${i + 15000}`),
  );
  const metrics = buildAnalytics(compareConnections(following, followers));
  assert.equal(metrics.mutual, 15000);
  assert.equal(metrics.reciprocity, 50);
});
