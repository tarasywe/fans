export function toggleId(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** A list is "selected" when all its members are; toggling selects or clears all of them. */
export function isGroupSelected(
  selected: ReadonlySet<string>,
  memberIds: readonly string[],
): boolean {
  return memberIds.length > 0 && memberIds.every((id) => selected.has(id));
}

export function toggleGroup(
  selected: ReadonlySet<string>,
  memberIds: readonly string[],
): Set<string> {
  const next = new Set(selected);
  const allSelected = isGroupSelected(selected, memberIds);
  for (const id of memberIds) {
    if (allSelected) next.delete(id);
    else next.add(id);
  }
  return next;
}

export function submitLabel(count: number): string {
  return count > 1 ? `Message to (${count}) Users` : 'Start Chat';
}
