import { clerkClient } from "@clerk/nextjs/server";
import { cleanup } from "@/lib/account-cleanup";
import { getRepository } from "@/lib/db";
import { ownerId, assertOrigin, apiError, json } from "@/lib/http";
export async function GET() {
  try {
    const owner = await ownerId();
    return json({ entitlement: await (await getRepository()).entitlement(owner) });
  } catch (error) {
    return apiError(error);
  }
}
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
