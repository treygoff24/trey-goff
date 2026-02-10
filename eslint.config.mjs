import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".content-collections/**",
      "test/.broken/**",
      "verify-arch.cjs",
    ],
  },
  {
    rules: {
      // This rule is overly strict for valid hydration/mount patterns
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
