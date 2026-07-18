export function postInitials(authorName: string) {
  const parts = authorName.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "X";
}

export function bodyPreview(body: string, limit = 220) {
  if (body.length <= limit) {
    return body;
  }
  return `${body.slice(0, limit).trimEnd()}...`;
}

export function formatPostedAt(postedAt: string) {
  const date = new Date(postedAt);
  if (Number.isNaN(date.getTime())) {
    return postedAt;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short"
  }).format(date);
}
