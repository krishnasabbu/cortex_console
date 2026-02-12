// vite.config.ts
import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from "file:///home/project/node_modules/@remix-run/dev/dist/index.js";
import UnoCSS from "file:///home/project/node_modules/unocss/dist/vite.mjs";
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import { nodePolyfills } from "file:///home/project/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { optimizeCssModules } from "file:///home/project/node_modules/vite-plugin-optimize-css-modules/dist/index.mjs";
import tsconfigPaths from "file:///home/project/node_modules/vite-tsconfig-paths/dist/index.mjs";
import * as dotenv from "file:///home/project/node_modules/dotenv/lib/main.js";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
dotenv.config();
var getGitInfo = () => {
  try {
    return {
      commitHash: execSync("git rev-parse --short HEAD").toString().trim(),
      branch: execSync("git rev-parse --abbrev-ref HEAD").toString().trim(),
      commitTime: execSync("git log -1 --format=%cd").toString().trim(),
      author: execSync("git log -1 --format=%an").toString().trim(),
      email: execSync("git log -1 --format=%ae").toString().trim(),
      remoteUrl: execSync("git config --get remote.origin.url").toString().trim(),
      repoName: execSync("git config --get remote.origin.url").toString().trim().replace(/^.*github.com[:/]/, "").replace(/\.git$/, "")
    };
  } catch {
    return {
      commitHash: "no-git-info",
      branch: "unknown",
      commitTime: "unknown",
      author: "unknown",
      email: "unknown",
      remoteUrl: "unknown",
      repoName: "unknown"
    };
  }
};
var getPackageJson = () => {
  try {
    const pkgPath = join(process.cwd(), "package.json");
    const pkg2 = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return {
      name: pkg2.name,
      description: pkg2.description,
      license: pkg2.license,
      dependencies: pkg2.dependencies || {},
      devDependencies: pkg2.devDependencies || {},
      peerDependencies: pkg2.peerDependencies || {},
      optionalDependencies: pkg2.optionalDependencies || {}
    };
  } catch {
    return {
      name: "cortex-console",
      description: "Cortex Console - AI Powered Web Dev",
      license: "MIT",
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
      optionalDependencies: {}
    };
  }
};
var pkg = getPackageJson();
var gitInfo = getGitInfo();
var vite_config_default = defineConfig((config2) => {
  return {
    define: {
      __COMMIT_HASH: JSON.stringify(gitInfo.commitHash),
      __GIT_BRANCH: JSON.stringify(gitInfo.branch),
      __GIT_COMMIT_TIME: JSON.stringify(gitInfo.commitTime),
      __GIT_AUTHOR: JSON.stringify(gitInfo.author),
      __GIT_EMAIL: JSON.stringify(gitInfo.email),
      __GIT_REMOTE_URL: JSON.stringify(gitInfo.remoteUrl),
      __GIT_REPO_NAME: JSON.stringify(gitInfo.repoName),
      __APP_VERSION: JSON.stringify(process.env.npm_package_version),
      __PKG_NAME: JSON.stringify(pkg.name),
      __PKG_DESCRIPTION: JSON.stringify(pkg.description),
      __PKG_LICENSE: JSON.stringify(pkg.license),
      __PKG_DEPENDENCIES: JSON.stringify(pkg.dependencies),
      __PKG_DEV_DEPENDENCIES: JSON.stringify(pkg.devDependencies),
      __PKG_PEER_DEPENDENCIES: JSON.stringify(pkg.peerDependencies),
      __PKG_OPTIONAL_DEPENDENCIES: JSON.stringify(pkg.optionalDependencies),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    },
    build: {
      target: "esnext",
      rollupOptions: {
        output: {
          format: "esm"
        }
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: "globalThis"
        }
      }
    },
    resolve: {
      alias: {
        buffer: "vite-plugin-node-polyfills/polyfills/buffer"
      }
    },
    plugins: [
      nodePolyfills({
        include: ["buffer", "process", "util", "stream"],
        globals: {
          Buffer: true,
          process: true,
          global: true
        },
        protocolImports: true,
        exclude: ["child_process", "fs", "path"]
      }),
      {
        name: "buffer-polyfill",
        transform(code, id) {
          if (id.includes("env.mjs")) {
            return {
              code: `import { Buffer } from 'buffer';
${code}`,
              map: null
            };
          }
          return null;
        }
      },
      config2.mode !== "test" && remixCloudflareDevProxy(),
      remixVitePlugin({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true
        }
      }),
      UnoCSS(),
      tsconfigPaths(),
      chrome129IssuePlugin(),
      config2.mode === "production" && optimizeCssModules({ apply: "build" })
    ],
    envPrefix: [
      "VITE_",
      "OPENAI_LIKE_API_BASE_URL",
      "OLLAMA_API_BASE_URL",
      "LMSTUDIO_API_BASE_URL",
      "TOGETHER_API_BASE_URL"
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        }
      }
    }
  };
});
function chrome129IssuePlugin() {
  return {
    name: "chrome129IssuePlugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers["user-agent"]?.match(/Chrom(e|ium)\/([0-9]+)\./);
        if (raw) {
          const version = parseInt(raw[2], 10);
          if (version === 129) {
            res.setHeader("content-type", "text/html");
            res.end(
              '<body><h1>Please use Chrome Canary for testing.</h1><p>Chrome 129 has an issue with JavaScript modules & Vite local development, see <a href="https://github.com/stackblitz/bolt.new/issues/86#issuecomment-2395519258">for more information.</a></p><p><b>Note:</b> This only impacts <u>local development</u>. `pnpm run build` and `pnpm run start` will work fine in this browser.</p></body>'
            );
            return;
          }
        }
        next();
      });
    }
  };
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBjbG91ZGZsYXJlRGV2UHJveHlWaXRlUGx1Z2luIGFzIHJlbWl4Q2xvdWRmbGFyZURldlByb3h5LCB2aXRlUGx1Z2luIGFzIHJlbWl4Vml0ZVBsdWdpbiB9IGZyb20gJ0ByZW1peC1ydW4vZGV2JztcbmltcG9ydCBVbm9DU1MgZnJvbSAndW5vY3NzL3ZpdGUnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCB0eXBlIFZpdGVEZXZTZXJ2ZXIgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscyc7XG5pbXBvcnQgeyBvcHRpbWl6ZUNzc01vZHVsZXMgfSBmcm9tICd2aXRlLXBsdWdpbi1vcHRpbWl6ZS1jc3MtbW9kdWxlcyc7XG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tICd2aXRlLXRzY29uZmlnLXBhdGhzJztcbmltcG9ydCAqIGFzIGRvdGVudiBmcm9tICdkb3RlbnYnO1xuaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuZG90ZW52LmNvbmZpZygpO1xuXG4vLyBHZXQgZGV0YWlsZWQgZ2l0IGluZm8gd2l0aCBmYWxsYmFja3NcbmNvbnN0IGdldEdpdEluZm8gPSAoKSA9PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbW1pdEhhc2g6IGV4ZWNTeW5jKCdnaXQgcmV2LXBhcnNlIC0tc2hvcnQgSEVBRCcpLnRvU3RyaW5nKCkudHJpbSgpLFxuICAgICAgYnJhbmNoOiBleGVjU3luYygnZ2l0IHJldi1wYXJzZSAtLWFiYnJldi1yZWYgSEVBRCcpLnRvU3RyaW5nKCkudHJpbSgpLFxuICAgICAgY29tbWl0VGltZTogZXhlY1N5bmMoJ2dpdCBsb2cgLTEgLS1mb3JtYXQ9JWNkJykudG9TdHJpbmcoKS50cmltKCksXG4gICAgICBhdXRob3I6IGV4ZWNTeW5jKCdnaXQgbG9nIC0xIC0tZm9ybWF0PSVhbicpLnRvU3RyaW5nKCkudHJpbSgpLFxuICAgICAgZW1haWw6IGV4ZWNTeW5jKCdnaXQgbG9nIC0xIC0tZm9ybWF0PSVhZScpLnRvU3RyaW5nKCkudHJpbSgpLFxuICAgICAgcmVtb3RlVXJsOiBleGVjU3luYygnZ2l0IGNvbmZpZyAtLWdldCByZW1vdGUub3JpZ2luLnVybCcpLnRvU3RyaW5nKCkudHJpbSgpLFxuICAgICAgcmVwb05hbWU6IGV4ZWNTeW5jKCdnaXQgY29uZmlnIC0tZ2V0IHJlbW90ZS5vcmlnaW4udXJsJylcbiAgICAgICAgLnRvU3RyaW5nKClcbiAgICAgICAgLnRyaW0oKVxuICAgICAgICAucmVwbGFjZSgvXi4qZ2l0aHViLmNvbVs6L10vLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL1xcLmdpdCQvLCAnJyksXG4gICAgfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbW1pdEhhc2g6ICduby1naXQtaW5mbycsXG4gICAgICBicmFuY2g6ICd1bmtub3duJyxcbiAgICAgIGNvbW1pdFRpbWU6ICd1bmtub3duJyxcbiAgICAgIGF1dGhvcjogJ3Vua25vd24nLFxuICAgICAgZW1haWw6ICd1bmtub3duJyxcbiAgICAgIHJlbW90ZVVybDogJ3Vua25vd24nLFxuICAgICAgcmVwb05hbWU6ICd1bmtub3duJyxcbiAgICB9O1xuICB9XG59O1xuXG4vLyBSZWFkIHBhY2thZ2UuanNvbiB3aXRoIGRldGFpbGVkIGRlcGVuZGVuY3kgaW5mb1xuY29uc3QgZ2V0UGFja2FnZUpzb24gPSAoKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGtnUGF0aCA9IGpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3BhY2thZ2UuanNvbicpO1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKHBrZ1BhdGgsICd1dGYtOCcpKTtcblxuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBwa2cubmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBwa2cuZGVzY3JpcHRpb24sXG4gICAgICBsaWNlbnNlOiBwa2cubGljZW5zZSxcbiAgICAgIGRlcGVuZGVuY2llczogcGtnLmRlcGVuZGVuY2llcyB8fCB7fSxcbiAgICAgIGRldkRlcGVuZGVuY2llczogcGtnLmRldkRlcGVuZGVuY2llcyB8fCB7fSxcbiAgICAgIHBlZXJEZXBlbmRlbmNpZXM6IHBrZy5wZWVyRGVwZW5kZW5jaWVzIHx8IHt9LFxuICAgICAgb3B0aW9uYWxEZXBlbmRlbmNpZXM6IHBrZy5vcHRpb25hbERlcGVuZGVuY2llcyB8fCB7fSxcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogJ2NvcnRleC1jb25zb2xlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29ydGV4IENvbnNvbGUgLSBBSSBQb3dlcmVkIFdlYiBEZXYnLFxuICAgICAgbGljZW5zZTogJ01JVCcsXG4gICAgICBkZXBlbmRlbmNpZXM6IHt9LFxuICAgICAgZGV2RGVwZW5kZW5jaWVzOiB7fSxcbiAgICAgIHBlZXJEZXBlbmRlbmNpZXM6IHt9LFxuICAgICAgb3B0aW9uYWxEZXBlbmRlbmNpZXM6IHt9LFxuICAgIH07XG4gIH1cbn07XG5cbmNvbnN0IHBrZyA9IGdldFBhY2thZ2VKc29uKCk7XG5jb25zdCBnaXRJbmZvID0gZ2V0R2l0SW5mbygpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKGNvbmZpZykgPT4ge1xuICByZXR1cm4ge1xuICAgIGRlZmluZToge1xuICAgICAgX19DT01NSVRfSEFTSDogSlNPTi5zdHJpbmdpZnkoZ2l0SW5mby5jb21taXRIYXNoKSxcbiAgICAgIF9fR0lUX0JSQU5DSDogSlNPTi5zdHJpbmdpZnkoZ2l0SW5mby5icmFuY2gpLFxuICAgICAgX19HSVRfQ09NTUlUX1RJTUU6IEpTT04uc3RyaW5naWZ5KGdpdEluZm8uY29tbWl0VGltZSksXG4gICAgICBfX0dJVF9BVVRIT1I6IEpTT04uc3RyaW5naWZ5KGdpdEluZm8uYXV0aG9yKSxcbiAgICAgIF9fR0lUX0VNQUlMOiBKU09OLnN0cmluZ2lmeShnaXRJbmZvLmVtYWlsKSxcbiAgICAgIF9fR0lUX1JFTU9URV9VUkw6IEpTT04uc3RyaW5naWZ5KGdpdEluZm8ucmVtb3RlVXJsKSxcbiAgICAgIF9fR0lUX1JFUE9fTkFNRTogSlNPTi5zdHJpbmdpZnkoZ2l0SW5mby5yZXBvTmFtZSksXG4gICAgICBfX0FQUF9WRVJTSU9OOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uKSxcbiAgICAgIF9fUEtHX05BTUU6IEpTT04uc3RyaW5naWZ5KHBrZy5uYW1lKSxcbiAgICAgIF9fUEtHX0RFU0NSSVBUSU9OOiBKU09OLnN0cmluZ2lmeShwa2cuZGVzY3JpcHRpb24pLFxuICAgICAgX19QS0dfTElDRU5TRTogSlNPTi5zdHJpbmdpZnkocGtnLmxpY2Vuc2UpLFxuICAgICAgX19QS0dfREVQRU5ERU5DSUVTOiBKU09OLnN0cmluZ2lmeShwa2cuZGVwZW5kZW5jaWVzKSxcbiAgICAgIF9fUEtHX0RFVl9ERVBFTkRFTkNJRVM6IEpTT04uc3RyaW5naWZ5KHBrZy5kZXZEZXBlbmRlbmNpZXMpLFxuICAgICAgX19QS0dfUEVFUl9ERVBFTkRFTkNJRVM6IEpTT04uc3RyaW5naWZ5KHBrZy5wZWVyRGVwZW5kZW5jaWVzKSxcbiAgICAgIF9fUEtHX09QVElPTkFMX0RFUEVOREVOQ0lFUzogSlNPTi5zdHJpbmdpZnkocGtnLm9wdGlvbmFsRGVwZW5kZW5jaWVzKSxcbiAgICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WKSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBmb3JtYXQ6ICdlc20nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGNvbW1vbmpzT3B0aW9uczoge1xuICAgICAgICB0cmFuc2Zvcm1NaXhlZEVzTW9kdWxlczogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICAgIGRlZmluZToge1xuICAgICAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIGJ1ZmZlcjogJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzL3BvbHlmaWxscy9idWZmZXInLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgICBpbmNsdWRlOiBbJ2J1ZmZlcicsICdwcm9jZXNzJywgJ3V0aWwnLCAnc3RyZWFtJ10sXG4gICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICBCdWZmZXI6IHRydWUsXG4gICAgICAgICAgcHJvY2VzczogdHJ1ZSxcbiAgICAgICAgICBnbG9iYWw6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHByb3RvY29sSW1wb3J0czogdHJ1ZSxcbiAgICAgICAgZXhjbHVkZTogWydjaGlsZF9wcm9jZXNzJywgJ2ZzJywgJ3BhdGgnXSxcbiAgICAgIH0pLFxuICAgICAge1xuICAgICAgICBuYW1lOiAnYnVmZmVyLXBvbHlmaWxsJyxcbiAgICAgICAgdHJhbnNmb3JtKGNvZGUsIGlkKSB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdlbnYubWpzJykpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGNvZGU6IGBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXInO1xcbiR7Y29kZX1gLFxuICAgICAgICAgICAgICBtYXA6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGNvbmZpZy5tb2RlICE9PSAndGVzdCcgJiYgcmVtaXhDbG91ZGZsYXJlRGV2UHJveHkoKSxcbiAgICAgIHJlbWl4Vml0ZVBsdWdpbih7XG4gICAgICAgIGZ1dHVyZToge1xuICAgICAgICAgIHYzX2ZldGNoZXJQZXJzaXN0OiB0cnVlLFxuICAgICAgICAgIHYzX3JlbGF0aXZlU3BsYXRQYXRoOiB0cnVlLFxuICAgICAgICAgIHYzX3Rocm93QWJvcnRSZWFzb246IHRydWUsXG4gICAgICAgICAgdjNfbGF6eVJvdXRlRGlzY292ZXJ5OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICBVbm9DU1MoKSxcbiAgICAgIHRzY29uZmlnUGF0aHMoKSxcbiAgICAgIGNocm9tZTEyOUlzc3VlUGx1Z2luKCksXG4gICAgICBjb25maWcubW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIG9wdGltaXplQ3NzTW9kdWxlcyh7IGFwcGx5OiAnYnVpbGQnIH0pLFxuICAgIF0sXG4gICAgZW52UHJlZml4OiBbXG4gICAgICAnVklURV8nLFxuICAgICAgJ09QRU5BSV9MSUtFX0FQSV9CQVNFX1VSTCcsXG4gICAgICAnT0xMQU1BX0FQSV9CQVNFX1VSTCcsXG4gICAgICAnTE1TVFVESU9fQVBJX0JBU0VfVVJMJyxcbiAgICAgICdUT0dFVEhFUl9BUElfQkFTRV9VUkwnLFxuICAgIF0sXG4gICAgY3NzOiB7XG4gICAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICAgIHNjc3M6IHtcbiAgICAgICAgICBhcGk6ICdtb2Rlcm4tY29tcGlsZXInLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG5cbmZ1bmN0aW9uIGNocm9tZTEyOUlzc3VlUGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdjaHJvbWUxMjlJc3N1ZVBsdWdpbicsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogVml0ZURldlNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgY29uc3QgcmF3ID0gcmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXT8ubWF0Y2goL0Nocm9tKGV8aXVtKVxcLyhbMC05XSspXFwuLyk7XG5cbiAgICAgICAgaWYgKHJhdykge1xuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBwYXJzZUludChyYXdbMl0sIDEwKTtcblxuICAgICAgICAgIGlmICh2ZXJzaW9uID09PSAxMjkpIHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L2h0bWwnKTtcbiAgICAgICAgICAgIHJlcy5lbmQoXG4gICAgICAgICAgICAgICc8Ym9keT48aDE+UGxlYXNlIHVzZSBDaHJvbWUgQ2FuYXJ5IGZvciB0ZXN0aW5nLjwvaDE+PHA+Q2hyb21lIDEyOSBoYXMgYW4gaXNzdWUgd2l0aCBKYXZhU2NyaXB0IG1vZHVsZXMgJiBWaXRlIGxvY2FsIGRldmVsb3BtZW50LCBzZWUgPGEgaHJlZj1cImh0dHBzOi8vZ2l0aHViLmNvbS9zdGFja2JsaXR6L2JvbHQubmV3L2lzc3Vlcy84NiNpc3N1ZWNvbW1lbnQtMjM5NTUxOTI1OFwiPmZvciBtb3JlIGluZm9ybWF0aW9uLjwvYT48L3A+PHA+PGI+Tm90ZTo8L2I+IFRoaXMgb25seSBpbXBhY3RzIDx1PmxvY2FsIGRldmVsb3BtZW50PC91Pi4gYHBucG0gcnVuIGJ1aWxkYCBhbmQgYHBucG0gcnVuIHN0YXJ0YCB3aWxsIHdvcmsgZmluZSBpbiB0aGlzIGJyb3dzZXIuPC9wPjwvYm9keT4nLFxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH07XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsZ0NBQWdDLHlCQUF5QixjQUFjLHVCQUF1QjtBQUNoVSxPQUFPLFlBQVk7QUFDbkIsU0FBUyxvQkFBd0M7QUFDakQsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUywwQkFBMEI7QUFDbkMsT0FBTyxtQkFBbUI7QUFDMUIsWUFBWSxZQUFZO0FBQ3hCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsWUFBWTtBQUVkLGNBQU87QUFHZCxJQUFNLGFBQWEsTUFBTTtBQUN2QixNQUFJO0FBQ0YsV0FBTztBQUFBLE1BQ0wsWUFBWSxTQUFTLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDbkUsUUFBUSxTQUFTLGlDQUFpQyxFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDcEUsWUFBWSxTQUFTLHlCQUF5QixFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDaEUsUUFBUSxTQUFTLHlCQUF5QixFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDNUQsT0FBTyxTQUFTLHlCQUF5QixFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDM0QsV0FBVyxTQUFTLG9DQUFvQyxFQUFFLFNBQVMsRUFBRSxLQUFLO0FBQUEsTUFDMUUsVUFBVSxTQUFTLG9DQUFvQyxFQUNwRCxTQUFTLEVBQ1QsS0FBSyxFQUNMLFFBQVEscUJBQXFCLEVBQUUsRUFDL0IsUUFBUSxVQUFVLEVBQUU7QUFBQSxJQUN6QjtBQUFBLEVBQ0YsUUFBUTtB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QUEsVUFDUixTQUFTO0FBQUEsVUFDVCxRQUFRO0FBQUEsUUFDVjtBQUFBLFFBQ0EsaUJBQWlCO0FBQUEsUUFDakIsU0FBUyxDQUFDLGlCQUFpQixNQUFNLE1BQU07QUFBQSxNQUN6QyxDQUFDO0FBQUEsTUFDRDtBQUFBLFFBQ0UsTUFBTTtBQUFBLFFBQ04sVUFBVSxNQUFNLElBQUk7QUFDbEIsY0FBSSxHQUFHLFNBQVMsU0FBUyxHQUFHO0FBQzFCLG1CQUFPO0FBQUEsY0FDTCxNQUFNO0FBQUEsRUFBcUMsSUFBSTtBQUFBLGNBQy9DLEtBQUs7QUFBQSxZQUNQO0FBQUEsVUFDRjtBQUVBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxNQUNBQSxRQUFPLFNBQVMsVUFBVSx3QkFBd0I7QUFBQSxNQUNsRCxnQkFBZ0I7QUFBQSxRQUNkLFFBQVE7QUFBQSxVQUNOLG1CQUFtQjtBQUFBLFVBQ25CLHNCQUFzQjtBQUFBLFVBQ3RCLHFCQUFxQjtBQUFBLFVBQ3JCLHVCQUF1QjtBQUFBLFFBQ3pCO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFDRCxPQUFPO0FBQUEsTUFDUCxjQUFjO0FBQUEsTUFDZCxxQkFBcUI7QUFBQSxNQUNyQkEsUUFBTyxTQUFTLGdCQUFnQixtQkFBbUIsRUFBRSxPQUFPLFFBQVEsQ0FBQztBQUFBLElBQ3ZFO0FBQUEsSUFDQSxXQUFXO0FBQUEsTUFDVDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSCxxQkFBcUI7QUFBQSxRQUNuQixNQUFNO0FBQUEsVUFDSixLQUFLO0FBQUEsUUFDUDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7QUFFRCxTQUFTLHVCQUF1QjtBQUM5QixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixnQkFBZ0IsUUFBdUI7QUFDckMsYUFBTyxZQUFZLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUztBQUN6QyxjQUFNLE1BQU0sSUFBSSxRQUFRLFlBQVksR0FBRyxNQUFNLDBCQUEwQjtBQUV2RSxZQUFJLEtBQUs7QUFDUCxnQkFBTSxVQUFVLFNBQVMsSUFBSSxDQUFDLEdBQUcsRUFBRTtBQUVuQyxjQUFJLFlBQVksS0FBSztBQUNuQixnQkFBSSxVQUFVLGdCQUFnQixXQUFXO0FBQ3pDLGdCQUFJO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFFQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBRUEsYUFBSztBQUFBLE1BQ1AsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQ0Y7IiwKICAibmFtZXMiOiBbInBrZyIsICJjb25maWciXQp9Cg==
