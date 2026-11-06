// Copy of batch/orch.js activeHead (mods cannot import from each other); keep the two in step.
const isHead = (t) => t?.labels?.["orch.role"] === "head";

export function activeHead(terms, focusedAddr, last) {
  const by = new Map(terms.map((t) => [t.address, t]));
  for (let t = by.get(focusedAddr), hops = 0; t && hops < 8; t = by.get(t.parent), hops++) if (isHead(t)) return t.address;
  if (last && isHead(by.get(last))) return last;
  const heads = terms.filter(isHead);
  return heads.length === 1 ? heads[0].address : null;
}
