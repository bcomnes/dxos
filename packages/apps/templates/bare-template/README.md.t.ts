import { text, defineTemplate } from "@dxos/plate";
import config from "./config.t";

export default defineTemplate<typeof config>(({ input }) => {
  const { name } = input;
  return text`
  # ${name}

  This app was created with the DXOS \`bare\` application template.

  Run the app with \`pnpm\`:
  \`\`\`bash
  pnpm install
  pnpm serve
  \`\`\`

  Build the app to the \`out\` folder:
  \`\`\`bash
  pnpm build
  \`\`\`

  Deploy the app to a [DXOS Kube](https://docs.dxos.org/guide/kube/quick-start):
  \`\`\`
  pnpm deploy
  \`\`\`

  [📚 DXOS Documentation](https://docs.dxos.org)
  `
})