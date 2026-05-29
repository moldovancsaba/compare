export async function register() {
  // Next.js already loads `.env` and `.env.local` for the application runtime.
  // Keep instrumentation inert here so the runtime does not bundle dotenv into
  // app startup and break local dev/server compilation.
}
