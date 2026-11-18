"use client";

import { useState } from "react";

// Optimistic move-up/move-down for an ordered list, saved to the server.
export default function useReorder(items, setItems, save, toast) {
  const [saving, setSaving] = useState(false);

  const move = async (index, delta) => {
    const target = index + delta;
    if (!items || target < 0 || target >= items.length) return;

    const previous = items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next.map((item, i) => ({ ...item, order: i + 1 })));

    setSaving(true);
    try {
      await save(next.map((item) => item._id));
    } catch (err) {
      setItems(previous);
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return { move, saving };
}
