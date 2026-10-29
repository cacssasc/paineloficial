/** Retries transient network failures (e.g. "Failed to fetch" while the server is restarting) before giving up. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const transient = e instanceof TypeError && /fetch|network/i.test(e.message);
      if (!transient || i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
}
