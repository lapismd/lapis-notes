import compressedAssets from "../../../.cloudflare/compressed-assets.json";
import { createAssetWorker } from "./asset-worker";

export default createAssetWorker(compressedAssets);
