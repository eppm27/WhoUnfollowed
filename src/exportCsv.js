export function escapeCsv(value) {
  let text = String(value ?? "");
  // Prevent spreadsheet formula evaluation, including whitespace-prefixed formulas.
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function exportCsv(accounts) {
  const dates = accounts.some((a) => a.followedAt !== null);
  const headers = [
    "username",
    "relationship",
    ...(dates ? ["followed_at"] : []),
  ];
  return (
    [
      headers,
      ...accounts.map((a) => [
        a.username,
        a.relationship,
        ...(dates
          ? [
              a.followedAt === null
                ? ""
                : new Date(a.followedAt * 1000).toISOString(),
            ]
          : []),
      ]),
    ]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n") + "\r\n"
  );
}
