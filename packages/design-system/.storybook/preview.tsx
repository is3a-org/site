import "./storybook.css";

import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview, ReactRenderer } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    layout: "padded",
    options: {
      storySort: {
        order: ["Foundations", "Controls", "Forms", "Data display", "Navigation", "Overlays"],
      },
    },
  },
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
