export {
  WORDCOUNT_DEFAULT_READING_SPEED,
  WORDCOUNT_PLUGIN_ID,
  WORDCOUNT_READING_TIME_COMMAND_ID,
  WORDCOUNT_STATUS_ID,
} from "./lib/ids";
export { WordCountPlugin } from "./lib/wordcount-plugin";
export {
  getCharacterCount,
  getWordCount,
  readingMinutes,
  textForWordCount,
} from "./lib/counts";
export { WordCountStatus } from "./lib/status-item";

export { WordCountPlugin as default } from "./lib/wordcount-plugin";
