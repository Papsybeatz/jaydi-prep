export function safeNextPath(path: string | null) {
  return path?.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : "/";
}
