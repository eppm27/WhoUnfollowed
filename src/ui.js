import { validateFiles, MAX_TOTAL_BYTES } from "./parser.js";
import { filterAccounts, RELATIONSHIPS } from "./analyzer.js";
import { exportCsv } from "./exportCsv.js";

const $ = (id) => document.getElementById(id);
const files = { following: [], followers: [] };
let worker,
  accounts = [],
  visible = [],
  page = 0,
  relationship = "not_following_back";
const PAGE_SIZE = 50;
function status(message) {
  $("status").textContent = message;
}
function error(message = "") {
  $("error").textContent = message;
  $("error").hidden = !message;
}
function invalidate() {
  worker?.terminate();
  worker = null;
  accounts = [];
  visible = [];
  page = 0;
  $("results").hidden = true;
  $("accounts").replaceChildren();
  $("warnings").replaceChildren();
  for (const id of [
    "followers-count",
    "following-count",
    "mutual-count",
    "reciprocity-count",
  ])
    $(id).textContent = "—";
  $("analyze").textContent = "Analyze connections →";
  $("analyze").disabled = !(files.following.length && files.followers.length);
}
function showFiles(kind) {
  const list = $(`${kind}-files`);
  list.replaceChildren();
  for (const [index, file] of files[kind].entries()) {
    const li = document.createElement("li"),
      name = document.createElement("span"),
      remove = document.createElement("button");
    name.textContent = file.name;
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${file.name}`);
    remove.onclick = () => {
      files[kind].splice(index, 1);
      invalidate();
      error();
      showFiles(kind);
      status("File removed. Analyze again to update results.");
      $(`${kind}-file`).focus();
    };
    li.append(name, remove);
    list.append(li);
  }
  $(`${kind}-zone`).classList.toggle("ready", files[kind].length > 0);
}
function selectFiles(kind, incoming) {
  if (!incoming.length) return;
  try {
    validateFiles(incoming, kind);
    const next = kind === "following" ? [...incoming] : [...files[kind]];
    let duplicate = false;
    if (kind === "followers")
      for (const file of incoming) {
        if (
          next.some(
            (f) =>
              f.name === file.name &&
              f.size === file.size &&
              f.lastModified === file.lastModified,
          )
        ) {
          duplicate = true;
          continue;
        }
        // A replacement with the same name replaces the old selection.
        const index = next.findIndex((f) => f.name === file.name);
        if (index >= 0) next[index] = file;
        else next.push(file);
      }
    const other = kind === "following" ? files.followers : files.following;
    if ([...next, ...other].reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES)
      throw new Error("Choose at most 64 MB of JSON files per analysis.");
    files[kind] = next;
    invalidate();
    error();
    showFiles(kind);
    status(
      duplicate
        ? "Duplicate selection ignored. Add every followers file from the same export."
        : "Files selected. Ready to analyze when both lists are added.",
    );
  } catch (e) {
    error(e.message);
  }
}
for (const kind of ["following", "followers"]) {
  const input = $(`${kind}-file`),
    zone = $(`${kind}-zone`);
  input.onchange = () => {
    selectFiles(kind, Array.from(input.files));
    input.value = "";
  };
  zone.ondragover = (event) => {
    event.preventDefault();
    zone.classList.add("dragging");
  };
  zone.ondragleave = (event) => {
    if (!zone.contains(event.relatedTarget)) zone.classList.remove("dragging");
  };
  zone.ondrop = (event) => {
    event.preventDefault();
    zone.classList.remove("dragging");
    selectFiles(kind, Array.from(event.dataTransfer.files));
  };
}
// Dropping outside a box must not navigate away and expose raw data on screen.
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());
$("clear").onclick = () => {
  files.following = [];
  files.followers = [];
  invalidate();
  error();
  $("following-file").value = "";
  $("followers-file").value = "";
  showFiles("following");
  showFiles("followers");
  $("search").value = "";
  $("sort").value = "az";
  relationship = "not_following_back";
  status("All files and results cleared.");
  $("following-file").focus();
};
$("analyze").onclick = () => {
  invalidate();
  error();
  $("analyze").disabled = true;
  $("analyze").textContent = "Analyzing…";
  status("Reading files on your device…");
  try {
    worker = new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({ data }) => {
      worker.terminate();
      worker = null;
      $("analyze").disabled = false;
      $("analyze").textContent = "Analyze connections →";
      if (data.error) {
        error(data.error);
        status("Analysis could not finish. Check your files.");
        return;
      }
      accounts = data.accounts;
      page = 0;
      $("search").value = "";
      $("sort").value = "az";
      relationship = "not_following_back";
      for (const key of ["followers", "following", "mutual"])
        $(`${key}-count`).textContent = data.metrics[key].toLocaleString();
      $("reciprocity-count").textContent =
        data.metrics.reciprocity === null
          ? "—"
          : `${Math.round(data.metrics.reciprocity)}%`;
      for (const option of $("sort").options)
        if (["newest", "oldest"].includes(option.value)) {
          option.hidden = !data.metrics.hasDates;
          option.disabled = !data.metrics.hasDates;
        }
      $("date-note").hidden = !data.metrics.hasDates;
      const warnings = $("warnings");
      warnings.replaceChildren();
      warnings.hidden = !data.warnings.length;
      for (const message of data.warnings) {
        const li = document.createElement("li");
        li.textContent = message;
        warnings.append(li);
      }
      $("results").hidden = false;
      updateTabs();
      render();
      status(
        `Analysis complete. ${accounts.length.toLocaleString()} unique accounts.`,
      );
      $("results-title").focus();
    };
    worker.onerror = () => {
      invalidate();
      error(
        "Could not read these files. Try smaller JSON files or a current browser.",
      );
      status("Analysis stopped.");
    };
    worker.postMessage(files);
  } catch {
    invalidate();
    error(
      "This browser could not start local analysis. Try a current browser over HTTPS or localhost.",
    );
    status("Analysis stopped.");
  }
};
const tabs = Array.from($("tabs").querySelectorAll("[role=tab]"));
function updateTabs() {
  for (const tab of tabs) {
    const selected = tab.dataset.filter === relationship;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.querySelector("span").textContent = (
      tab.dataset.filter === "all"
        ? accounts.length
        : accounts.filter((a) => a.relationship === tab.dataset.filter).length
    ).toLocaleString();
  }
  $("account-panel").setAttribute("aria-labelledby", `tab-${relationship}`);
}
for (const [i, tab] of tabs.entries()) {
  tab.onclick = () => {
    relationship = tab.dataset.filter;
    page = 0;
    updateTabs();
    render();
  };
  tab.onkeydown = (event) => {
    const targets = {
      ArrowRight: (i + 1) % tabs.length,
      ArrowLeft: (i + tabs.length - 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    if (event.key in targets) {
      event.preventDefault();
      const target = tabs[targets[event.key]];
      target.focus();
      target.click();
    }
  };
}
function render() {
  visible = filterAccounts(accounts, {
    relationship,
    search: $("search").value,
    sort: $("sort").value,
  });
  const start = page * PAGE_SIZE,
    list = $("accounts");
  list.replaceChildren();
  $("result-count").textContent =
    `${visible.length.toLocaleString()} ${visible.length === 1 ? "account" : "accounts"}${$("search").value ? " matching search" : ""}`;
  $("empty").hidden = visible.length > 0;
  $("export").disabled = !visible.length;
  for (const account of visible.slice(start, start + PAGE_SIZE)) {
    const li = document.createElement("li"),
      main = document.createElement("div"),
      link = document.createElement("a"),
      meta = document.createElement("div"),
      copy = document.createElement("button");
    li.className = "account";
    main.className = "account-main";
    meta.className = "account-meta";
    link.textContent = `@${account.username}`;
    link.href = `https://instagram.com/${encodeURIComponent(account.key)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute(
      "aria-label",
      `Open @${account.username} on Instagram (new tab)`,
    );
    const type = document.createElement("span");
    type.textContent = RELATIONSHIPS[account.relationship];
    meta.append(type);
    if (account.followedAt !== null) {
      const date = document.createElement("time");
      date.dateTime = new Date(account.followedAt * 1000).toISOString();
      date.textContent = `Followed ${new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(account.followedAt * 1000)}`;
      meta.append(date);
    }
    copy.textContent = "Copy";
    copy.setAttribute("aria-label", `Copy ${account.username}`);
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(account.username);
        status(`Copied @${account.username}.`);
      } catch {
        status(
          `Copy unavailable. Select @${account.username} to copy manually.`,
        );
      }
    };
    main.append(link, meta);
    li.append(main, copy);
    list.append(li);
  }
  $("previous").disabled = page === 0;
  $("next").disabled = start + PAGE_SIZE >= visible.length;
  $("page-count").textContent = visible.length
    ? `${start + 1}–${Math.min(start + PAGE_SIZE, visible.length)} of ${visible.length.toLocaleString()}`
    : "0 accounts";
}
$("search").oninput = () => {
  page = 0;
  render();
};
$("sort").onchange = () => {
  page = 0;
  render();
};
$("previous").onclick = () => {
  page--;
  render();
};
$("next").onclick = () => {
  page++;
  render();
};
$("export").onclick = () => {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", exportCsv(visible)], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `connections-${relationship}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status(
    `Exported ${visible.length.toLocaleString()} ${visible.length === 1 ? "account" : "accounts"} from the current filter${$("search").value ? " and search" : ""}.`,
  );
};
