import { NextResponse } from "next/server";
import { z } from "zod";

import { compareWatches } from "@/lib/services/compare-watches";
import { resolveWatch } from "@/lib/utils/resolve-watch";

const requestSchema = z.object({
  leftInput: z.string().trim().min(2),
  rightInput: z.string().trim().min(2)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leftInput, rightInput } = requestSchema.parse(body);

    const left = resolveWatch(leftInput);
    const right = resolveWatch(rightInput);

    if (!left || !right) {
      return NextResponse.json(
        {
          error:
            "SpecDiff V1 currently supports its curated mechanical watch catalog. Try Rolex Air-King, Rolex Explorer, Tudor Black Bay 54, Tudor Black Bay 58, Tudor Pelagos 39, or Omega Aqua Terra 38."
        },
        { status: 404 }
      );
    }

    if (left.id === right.id) {
      return NextResponse.json(
        {
          error: "Choose two different watches so the comparison surfaces meaningful tradeoffs."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      comparison: compareWatches(left, right)
    });
  } catch {
    return NextResponse.json(
      {
        error: "The comparison request was invalid. Check both inputs and try again."
      },
      { status: 400 }
    );
  }
}
