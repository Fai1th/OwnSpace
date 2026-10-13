import { getRepository } from "./db";
import { composio, githubEnabled } from "./github";
export async function cleanup(owner: string, account = false) {
  const repo = await getRepository();
  const id = await repo.connection(owner);
  if (id) {
    if (!githubEnabled()) throw Error("GitHub cleanup requires its configured credentials.");
    try {
      await composio().connectedAccounts.delete(id);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 404) throw error;
    }
  }
  await repo.delete(owner, account);
}
