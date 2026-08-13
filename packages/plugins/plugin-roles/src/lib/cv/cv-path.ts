export const CV_VIEW_TYPE = "cv";

export const CV_FILENAME_PATTERNS = ["*.cv.yml", "*.cv.yaml"] as const;

export const CV_EXTENSIONS = ["cv.yml", "cv.yaml"] as const;

export function isCvPath(path: string): boolean {
  return /\.cv\.ya?ml$/i.test(path.replaceAll("\\", "/"));
}
