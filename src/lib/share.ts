export async function shareOrCopy(
  options: {
    title: string;
    text?: string;
    url: string;
  },
  prefer: "auto" | "share" | "copy" = "auto",
): Promise<"shared" | "copied"> {
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (prefer !== "copy" && canShare) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      if (prefer === "share") throw error;
    }
  }

  await navigator.clipboard.writeText(options.url);
  return "copied";
}
