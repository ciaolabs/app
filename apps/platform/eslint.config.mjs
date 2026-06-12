import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", ".source/**", "coverage/**", "test-results/**", "next-env.d.ts", "public/**"],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    // New react-hooks v6 rules from eslint-config-next 16; existing patterns
    // predate them. Kept as warnings until the components are refactored.
    rules: {
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
