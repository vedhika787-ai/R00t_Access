"use client";

import React from "react";
import { FolderSearch, Plus, Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-surface/40 backdrop-blur-sm ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium shadow-sm hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground text-sm font-medium hover:bg-muted/40 transition-all"
          >
            <Sparkles className="w-4 h-4 text-brand-primary" />
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
