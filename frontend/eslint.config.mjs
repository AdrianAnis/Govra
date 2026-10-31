import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/lib/notifications-context.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  {
    files: [
      "src/components/admin/admin-distribution-map.tsx",
      "src/components/agency/dinas-tugas-proker-manager.tsx",
      "src/components/pemerintah/pemerintah-proker-manager.tsx",
      "src/components/program-detail.tsx",
    ],
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/types/api.ts"]),
]);

export default eslintConfig;
