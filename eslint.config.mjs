import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    // Backgrounds here use CSS gradients/images on purpose and render correctly.
    rules: { "@remotion/no-background-image": "off" },
  },
];
