import app from "./src/app.js";

const server = Bun.serve({
   port: 3030,
   fetch: app.fetch,
});

console.log("server is running on port " + server.port);
