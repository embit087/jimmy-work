// Declaration-merge the STATUS_PASSWORD secret onto the generated Env type.
// Set at runtime via `wrangler secret put STATUS_PASSWORD` (and .dev.vars locally).
interface Env {
  STATUS_PASSWORD: string;
}
