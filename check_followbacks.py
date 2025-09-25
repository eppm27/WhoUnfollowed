# check_followbacks.py
import json
import csv
import pathlib
import sys

def load_usernames_from_json(path):
    """Supports common Instagram export formats."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    usernames = set()

    def pull_from_items(items):
        for item in items:
            sld = item.get("string_list_data") or []
            if sld and isinstance(sld, list):
                val = sld[0].get("value")
                if val:
                    usernames.add(val.strip().lstrip("@").lower())

    # Format A: top-level dict with keys like "relationships_followers"
    if isinstance(data, dict):
        for key in ("relationships_followers", "relationships_following", "followers", "following"):
            if key in data and isinstance(data[key], list):
                pull_from_items(data[key])

    # Format B: top-level list of entries with string_list_data
    if isinstance(data, list):
        pull_from_items(data)

    return usernames

def save_list(fname, rows):
    with open(fname, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["username"])
        for u in sorted(rows):
            w.writerow([u])
    print(f"Wrote {fname} ({len(rows)} users)")

def main():
    base = pathlib.Path(".")
    following_file = base / "following.json"
    if not following_file.exists():
        print("Could not find following.json in current folder.", file=sys.stderr)
        sys.exit(1)

    # Collect `followers` from all followers_*.json files
    follower_files = sorted(base.glob("followers*.json")) + sorted(base.glob("*followers_*.json")) + [base / "followers_1.json"]
    follower_files = [p for p in follower_files if p.exists()]
    if not follower_files:
        print("Could not find any followers_*.json file(s).", file=sys.stderr)
        sys.exit(1)

    following = load_usernames_from_json(following_file)

    followers = set()
    for ff in dict.fromkeys(follower_files):  # de-dupe while preserving order
        followers |= load_usernames_from_json(ff)

    not_following_back = following - followers
    i_dont_follow_back = followers - following

    save_list("not_following_back.csv", not_following_back)
    save_list("i_dont_follow_back.csv", i_dont_follow_back)

if __name__ == "__main__":
    main()