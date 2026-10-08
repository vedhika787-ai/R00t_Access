"use client";

import React from "react";

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border/50 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div
            className={`h-4 rounded bg-muted/70 ${
              i === 0 ? "w-48" : i === 1 ? "w-24" : i === 2 ? "w-20" : "w-16"
            }`}
          />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full rounded-2xl border border-border/80 bg-surface overflow-hidden shadow-soft">
      <div className="p-4 border-b border-border/60 bg-muted/30 flex items-center justify-between animate-pulse">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-3 px-4">
                  <div className="h-3 w-20 rounded bg-muted/80" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonRow key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-soft animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="w-9 h-9 rounded-xl bg-muted" />
      </div>
      <div className="h-8 w-20 rounded bg-muted mb-2" />
      <div className="h-3 w-40 rounded bg-muted/60" />
    </div>
  );
}
