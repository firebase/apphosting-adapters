export function getDateString() {
  return new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: "UTC",
  });
}

export function getRandomUUID() {
  // Use native crypto.randomUUID in secure contexts (HTTPS / localhost).
  // Provide fallback for non-secure contexts (e.g. HTTP testing) where randomUUID is restricted.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}