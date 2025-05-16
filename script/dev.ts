import { barelyServe } from "barely-a-dev-server";

barelyServe({
  entryRoot: "src",
  devDomain: "dancehack.localhost",
  esbuildOptions: {
    sourceRoot: "src",
  },
});
