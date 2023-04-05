import { barelyServe } from "barely-a-dev-server";

barelyServe({
  dev: false,
  entryRoot: "src",
  devDomain: "dancehack.localhost",
  outDir: "dist/garron.net/app/dance-hacker",
});
