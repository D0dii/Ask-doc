import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  client: "@hey-api/client-fetch", // Uses standard Fetch API (lighter than Axios)
  input: "http://localhost:3000/api-json",
  output: "src/client", // Folder where code goes
  plugins: ["@hey-api/schemas", "@tanstack/react-query"],
});
