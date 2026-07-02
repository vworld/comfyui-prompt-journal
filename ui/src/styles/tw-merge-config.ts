import { extendTailwindMerge } from "tailwind-merge";

export const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["tiny", "xxs", "xs-plus", "sm-plus"],
    },
  },
});
