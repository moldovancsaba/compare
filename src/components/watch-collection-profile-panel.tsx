"use client";

import { useMemo, useState } from "react";

import { watchCatalog } from "@/lib/data/watch-catalog";
import { watchDisplayName } from "@/lib/domains/watch-entity";
import type { WatchCollectionItemStatus, WatchCollectionProfile } from "@/types/watch-collection";

interface WatchCollectionProfilePanelProps {
  activeDomain: string;
  profile: WatchCollectionProfile;
  onChange: (profile: WatchCollectionProfile) => void;
}

const statusLabels: Record<WatchCollectionItemStatus, string> = {
  owned: "Owned",
  wishlist: "Wishlist",
  sold: "Sold"
};

function nowIso(): string {
  return new Date().toISOString();
}

export function WatchCollectionProfilePanel({ activeDomain, profile, onChange }: WatchCollectionProfilePanelProps) {
  const [selectedWatchId, setSelectedWatchId] = useState(watchCatalog[0]?.id ?? "");
  const [selectedStatus, setSelectedStatus] = useState<WatchCollectionItemStatus>("owned");
  const [note, setNote] = useState("");
  const savedWatchIds = useMemo(() => new Set(profile.items.map((item) => item.watchId)), [profile.items]);
  const availableWatches = watchCatalog.filter((watch) => !savedWatchIds.has(watch.id));
  const effectiveSelectedWatchId =
    selectedWatchId && !savedWatchIds.has(selectedWatchId) ? selectedWatchId : (availableWatches[0]?.id ?? "");

  if (activeDomain !== "watches") {
    return null;
  }

  function updatePreferredBrands(value: string) {
    onChange({
      ...profile,
      preferredBrands: Array.from(
        new Set(
          value
            .split(",")
            .map((brand) => brand.trim())
            .filter(Boolean)
        )
      ).slice(0, 8)
    });
  }

  function addItem() {
    if (!effectiveSelectedWatchId || savedWatchIds.has(effectiveSelectedWatchId)) {
      return;
    }

    onChange({
      ...profile,
      items: [
        ...profile.items,
        {
          watchId: effectiveSelectedWatchId,
          status: selectedStatus,
          ...(note.trim() ? { note: note.trim().slice(0, 240) } : {}),
          updatedAt: nowIso()
        }
      ]
    });
    setNote("");
    setSelectedWatchId(availableWatches.find((watch) => watch.id !== effectiveSelectedWatchId)?.id ?? "");
  }

  function updateItemStatus(watchId: string, status: WatchCollectionItemStatus) {
    onChange({
      ...profile,
      items: profile.items.map((item) =>
        item.watchId === watchId
          ? {
              ...item,
              status,
              updatedAt: nowIso()
            }
          : item
      )
    });
  }

  function removeItem(watchId: string) {
    onChange({
      ...profile,
      items: profile.items.filter((item) => item.watchId !== watchId)
    });
  }

  return (
    <section className="surface-card p-6 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow eyebrow-wide">Collection profile</p>
          <h3 className="title-section mt-3">Saved watch context</h3>
        </div>
        <span className="pill-muted eyebrow eyebrow-tight px-3 py-1">stored in this browser</span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.7fr]">
        <label>
          <span className="eyebrow mb-2 block">Preferred brands</span>
          <input
            className="field-input placeholder-muted w-full px-4 py-3 text-sm"
            placeholder="Rolex, Tudor, Omega"
            value={profile.preferredBrands.join(", ")}
            onChange={(event) => updatePreferredBrands(event.target.value)}
          />
        </label>
        <div className="surface-item p-4">
          <p className="card-kicker mb-2">Profile size</p>
          <p className="body-copy body-copy-strong text-sm">
            {profile.items.length} watches, {profile.preferredBrands.length} preferred brands
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.55fr]">
        <select
          className="field-input w-full px-4 py-3 text-sm"
          value={effectiveSelectedWatchId}
          onChange={(event) => setSelectedWatchId(event.target.value)}
        >
          {availableWatches.length ? (
            availableWatches.map((watch) => (
              <option key={watch.id} value={watch.id}>
                {watchDisplayName(watch)}
              </option>
            ))
          ) : (
            <option value="">All catalog watches saved</option>
          )}
        </select>
        <select
          className="field-input w-full px-4 py-3 text-sm"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value as WatchCollectionItemStatus)}
        >
          {Object.entries(statusLabels).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          className="field-input placeholder-muted w-full px-4 py-3 text-sm"
          maxLength={240}
          placeholder="Optional note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <button
          type="button"
          className="action-button eyebrow eyebrow-tight px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!effectiveSelectedWatchId || savedWatchIds.has(effectiveSelectedWatchId)}
          onClick={addItem}
        >
          Add watch
        </button>
      </div>

      {profile.items.length ? (
        <div className="mt-5 grid gap-3">
          {profile.items.map((item) => {
            const watch = watchCatalog.find((candidate) => candidate.id === item.watchId);

            if (!watch) {
              return null;
            }

            return (
              <article key={item.watchId} className="surface-item grid gap-3 p-4 lg:grid-cols-[1fr_0.45fr_auto]">
                <div>
                  <p className="card-kicker mb-2">{watchDisplayName(watch)}</p>
                  {item.note ? <p className="body-copy body-copy-faint text-xs">{item.note}</p> : null}
                </div>
                <select
                  className="field-input px-3 py-2 text-sm"
                  value={item.status}
                  onChange={(event) => updateItemStatus(item.watchId, event.target.value as WatchCollectionItemStatus)}
                >
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="pill-muted eyebrow eyebrow-tight px-3 py-2 text-xs transition"
                  onClick={() => removeItem(item.watchId)}
                >
                  Remove
                </button>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
