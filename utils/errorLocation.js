import path from "path";

/**
 * Parses a stack trace string to extract file path, line number, column, and function name.
 * Focuses on application code by filtering out node_modules and Node.js internal files.
 *
 * @param {string|Error} errorOrStack - Error object or stack trace string
 * @returns {{
 *   location: string,
 *   file: string|null,
 *   line: number|null,
 *   column: number|null,
 *   functionName: string|null,
 *   appFrames: Array<{ functionName: string, filePath: string, line: number, column: number }>
 * }}
 */
export function parseStackTrace(errorOrStack) {
  const stack =
    typeof errorOrStack === "string"
      ? errorOrStack
      : errorOrStack?.stack || "";

  if (!stack || typeof stack !== "string") {
    return {
      location: "Unknown location",
      file: null,
      line: null,
      column: null,
      functionName: null,
      appFrames: [],
    };
  }

  const lines = stack.split("\n");
  const appFrames = [];

  // Match patterns:
  // "    at functionName (filePath:line:col)"
  // "    at async functionName (filePath:line:col)"
  // "    at filePath:line:col"
  const frameRegex = /at\s+(?:async\s+)?(?:([^\s(]+)\s+\((.+):(\d+):(\d+)\)|(.+):(\d+):(\d+))/;

  const cwdNormalized = process.cwd().replace(/\\/g, "/").toLowerCase();

  for (const line of lines) {
    const match = line.match(frameRegex);
    if (!match) continue;

    const fnName = match[1] || "<anonymous>";
    const rawPath = match[2] || match[5] || "";
    const lineNum = parseInt(match[3] || match[6], 10);
    const colNum = parseInt(match[4] || match[7], 10);

    // Normalize path separators
    let cleanPath = rawPath
      .replace(/^file:\/\/\/?/, "")
      .replace(/\\/g, "/");

    const isInternal =
      cleanPath.includes("/node_modules/") ||
      cleanPath.includes("node_modules/") ||
      cleanPath.startsWith("node:") ||
      cleanPath.includes("internal/");

    // Make relative to current working directory
    const cleanPathLower = cleanPath.toLowerCase();
    let relativePath = cleanPath;
    if (cleanPathLower.startsWith(cwdNormalized)) {
      relativePath = cleanPath.slice(cwdNormalized.length).replace(/^\/+/, "");
    }

    const frame = {
      functionName: fnName,
      filePath: relativePath,
      line: lineNum,
      column: colNum,
      isInternal,
    };

    if (!isInternal) {
      appFrames.push(frame);
    }
  }

  // Use the first non-internal frame (closest to where error occurred in user code)
  const primaryFrame = appFrames[0] || null;

  const location = primaryFrame
    ? `${primaryFrame.filePath}:${primaryFrame.line}:${primaryFrame.column}${
        primaryFrame.functionName && primaryFrame.functionName !== "<anonymous>"
          ? ` (${primaryFrame.functionName})`
          : ""
      }`
    : "Unknown location";

  return {
    location,
    file: primaryFrame?.filePath || null,
    line: primaryFrame?.line || null,
    column: primaryFrame?.column || null,
    functionName: primaryFrame?.functionName || null,
    appFrames,
  };
}

export default parseStackTrace;
