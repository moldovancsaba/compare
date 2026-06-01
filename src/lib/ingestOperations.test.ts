import { describe, expect, it } from "vitest";
import { applyIngestOperation } from "@/lib/ingestOperations";

class FakeCollection {
  docs: Record<string, unknown>[] = [];

  find() {
    return { toArray: async () => this.docs.map((doc) => ({ ...doc })) };
  }

  async findOne(filter: Record<string, unknown>) {
    const [key, value] = Object.entries(filter)[0] || [];
    return this.docs.find((doc) => doc[key] === value) ?? null;
  }

  async replaceOne(filter: Record<string, unknown>, replacement: Record<string, unknown>, options?: { upsert?: boolean }) {
    const [key, value] = Object.entries(filter)[0] || [];
    const index = this.docs.findIndex((doc) => doc[key] === value);
    if (index >= 0) this.docs[index] = { ...replacement };
    else if (options?.upsert) this.docs.push({ ...replacement });
  }

  async updateOne(filter: Record<string, unknown>, update: { $set: Record<string, unknown> }, options?: { upsert?: boolean }) {
    const [key, value] = Object.entries(filter)[0] || [];
    const index = this.docs.findIndex((doc) => doc[key] === value);
    if (index >= 0) {
      this.docs[index] = { ...this.docs[index], ...update.$set };
    } else if (options?.upsert) {
      this.docs.push({ [key]: value, ...update.$set });
    }
  }

  async deleteOne(filter: Record<string, unknown>) {
    const [key, value] = Object.entries(filter)[0] || [];
    this.docs = this.docs.filter((doc) => doc[key] !== value);
  }

  async deleteMany(filter?: Record<string, unknown>) {
    if (!filter || Object.keys(filter).length === 0) {
      const deletedCount = this.docs.length;
      this.docs = [];
      return { deletedCount };
    }
    const ids = (filter.id as { $in?: string[] })?.$in;
    if (Array.isArray(ids)) {
      const before = this.docs.length;
      this.docs = this.docs.filter((doc) => !ids.includes(doc.id));
      return { deletedCount: before - this.docs.length };
    }
    return { deletedCount: 0 };
  }

  async insertMany(documents: Record<string, unknown>[]) {
    this.docs.push(...documents.map((doc) => ({ ...doc })));
  }

  async countDocuments() {
    return this.docs.length;
  }

  async bulkWrite(writes: { replaceOne: { filter: Record<string, unknown>; replacement: Record<string, unknown>; upsert?: boolean } }[]) {
    for (const write of writes) {
      await this.replaceOne(write.replaceOne.filter, write.replaceOne.replacement, { upsert: write.replaceOne.upsert });
    }
  }
}

class FakeDb {
  collections = new Map<string, FakeCollection>();

  collection(name: string) {
    if (!this.collections.has(name)) this.collections.set(name, new FakeCollection());
    return this.collections.get(name) as FakeCollection;
  }
}

describe("applyIngestOperation", () => {
  it("preserves publishedAt and updates updatedAt across provider writes", async () => {
    const db = new FakeDb() as never;
    await applyIngestOperation(db, {
      resource: "provider",
      action: "upsert",
      document: {
        id: "prov-time-test",
        name: "Time Test",
        category: "Camps",
        borough: "Hungary",
        neighborhood: "Budapest",
        address: "1 Example St",
        activityTypes: ["Rifle"],
        ageRanges: ["Licensed Adult"],
        dayTimeTags: ["Weekday"],
        pricePerClass: 20,
        shortDescription: "A provider used for timestamp testing.",
        longDescription: "A provider used for timestamp testing with enough content to satisfy validation rules.",
        rating: 0,
        reviewCount: 0,
        badges: [],
        image: "https://i.ibb.co/example/photo.jpg",
        email: "",
        website: "https://example.org/provider",
        phone: "",
      },
    });

    const created = db.collection("providers").docs[0] as { publishedAt?: string; updatedAt?: string };
    expect(created.publishedAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();

    await applyIngestOperation(db, {
      resource: "provider",
      action: "patch",
      id: "prov-time-test",
      patch: {
        shortDescription: "Updated provider summary for timestamp preservation.",
      },
    });

    const updated = db.collection("providers").docs[0] as { publishedAt?: string; updatedAt?: string; shortDescription?: string };
    expect(updated.publishedAt).toBe(created.publishedAt);
    expect(updated.updatedAt).not.toBe(created.updatedAt);
    expect(updated.shortDescription).toContain("Updated provider summary");
  });

  it("accepts valid meetup upserts and can list them", async () => {
    const db = new FakeDb() as never;

    const upsert = await applyIngestOperation(db, {
        resource: "meetupGroup",
      action: "upsert",
      document: {
        id: "meetup-riverdale-families",
        name: "Shooting Club",
        borough: "Hungary",
        neighborhood: "Budapest",
        groupType: "Sport Shooting Club",
        ageRange: "All ages",
        cadence: "Monthly",
        instagram: "",
        website: "https://example.org/families",
        description: "A neighborhood groups meetup for active shooters.",
        initials: "RF",
        icon: "target",
        palette: "teal",
        coverImageUrl: "https://i.ibb.co/example/photo.jpg",
      },
    });

    expect(upsert).toEqual({ ok: true });

    const list = await applyIngestOperation(db, { resource: "meetupGroups", action: "list" });
    expect(list.ok).toBe(true);
    expect((list as { data: { id: string }[] }).data[0]?.id).toBe("meetup-riverdale-families");
  });

  it("rejects invalid meetup patches", async () => {
    const db = new FakeDb() as never;
    await applyIngestOperation(db, {
      resource: "meetupGroup",
      action: "upsert",
      document: {
        id: "meetup-riverdale-families",
        name: "Riverdale Families",
        borough: "Hungary",
        neighborhood: "Budapest",
        groupType: "Sport Shooting Club",
        ageRange: "All ages",
        cadence: "Monthly",
        instagram: "",
        website: "https://example.org/families",
        description: "Monthly shooter-focused meetup. ",
        initials: "RF",
        icon: "target",
        palette: "teal",
      },
    });

    const patched = await applyIngestOperation(db, {
      resource: "meetupGroup",
      action: "patch",
      id: "meetup-riverdale-families",
      patch: { groupType: "Wrong Type" },
    });

    expect(patched.ok).toBe(false);
    expect((patched as { error: string }).error).toMatch(/Invalid enum value/);
  });

  it("blocks provider upserts that match legacy kid criteria", async () => {
    const db = new FakeDb() as never;

    const result = await applyIngestOperation(db, {
      resource: "provider",
      action: "upsert",
      document: {
        id: "prov-kid-scratch",
        name: "Little Hands Club",
        category: "Classes",
        borough: "Hungary",
        neighborhood: "Budapest",
        address: "1 Scratch Ave",
        activityTypes: ["Rifle"],
        ageRanges: ["3–5"],
        dayTimeTags: ["Weekday"],
        pricePerClass: 12,
        shortDescription: "Hands-on classes for children.",
        longDescription: "Fun children-led classes designed for little hands and curious minds.",
        rating: 4,
        reviewCount: 7,
        badges: [],
        image: "https://i.ibb.co/example/kids.jpg",
        email: "",
        website: "https://example.org",
        phone: "",
      },
    });

    expect(result).toEqual({
      ok: false,
      error: "provider.upsert rejected: content policy blocks legacy family/kid listing",
    });
  });
});
