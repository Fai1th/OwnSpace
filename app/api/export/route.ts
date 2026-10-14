import { getRepository } from "@/lib/db";
import { ownerId, apiError } from "@/lib/http";
export async function GET() {
  try {
    const owner = await ownerId();
    const data = await (await getRepository()).exportAccount(owner);
    return new Response(
      JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2),
      {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="ownspace-export.json"',
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    return apiError(e);
  }
}
