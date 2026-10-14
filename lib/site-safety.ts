export function websiteUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      host.includes(".") &&
      host !== "localhost" &&
      !host.endsWith(".localhost") &&
      !host.endsWith(".local") &&
      !/^[\d.]+$/.test(host) &&
      !host.includes(":")
    );
  } catch {
    return false;
  }
}
export function websiteImage(value: string) {
  return (
    value === "" ||
    /^\/art\/[a-z0-9-]+\.svg$/.test(value) ||
    (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length <= 350000)
  );
}
export function siteLink(value: string) {
  return value === "" || /^#[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(value) || websiteUrl(value);
}
