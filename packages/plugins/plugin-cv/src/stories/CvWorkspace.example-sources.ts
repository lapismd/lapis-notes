export const CvWorkspaceExample = `<script lang="ts">
  import { CvWorkspace } from "@lapis-notes/cv";
  import sample from "./sample.cv.yml?raw";
</script>

<CvWorkspace yamlText={sample} filePath="sample.cv.yml" />
`;
