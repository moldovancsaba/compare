import { NextResponse } from "next/server";
import { z } from "zod";

import { getTrinityBrainState } from "@/lib/services/brain-queue";

const querySchema = z.object({
  comparisonRef: z.string().trim().min(8)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    comparisonRef: url.searchParams.get("comparisonRef")
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "A valid comparisonRef is required."
      },
      { status: 400 }
    );
  }

  const brain = await getTrinityBrainState(parsed.data.comparisonRef);

  return NextResponse.json({ brain });
}
