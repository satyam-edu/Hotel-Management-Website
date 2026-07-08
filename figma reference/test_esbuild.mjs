import * as esbuild from 'esbuild';
import fs from 'fs';

try {
  esbuild.transformSync(fs.readFileSync('src/app/components/AdminDashboard.tsx', 'utf8'), {
    loader: 'tsx'
  });
  console.log("ESBuild success!");
} catch(e) {
  console.error("ESBuild error:", e.message);
}
