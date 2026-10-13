import { clerkClient } from "@clerk/nextjs/server";
import { cleanup } from "@/lib/account-cleanup";
import { ownerId, assertOrigin, apiError, json } from "@/lib/http";
export async function DELETE(req: Request) {
  try {
    assertOrigin(req);
    const owner = await ownerId();
    await cleanup(owner, false);
    try {
      await (await clerkClient()).users.deleteUser(owner);
    } catch (error) {
      if ((error as { status?: number } | null)?.status !== 404) throw error;
    }
    await cleanup(owner, true);
    return json({ deleted: true });
  } catch (e) {
    return apiError(e);
  }
}
