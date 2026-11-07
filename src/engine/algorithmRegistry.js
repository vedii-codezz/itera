import { algorithmDefinitions } from "../algorithms/definitions.js";

export function createRegistry() {
  const entries = new Map();
  return {
    register(definition) {
      if (!definition?.id || typeof definition.generate !== "function")
        throw new Error("An algorithm needs an id and generator.");
      if (entries.has(definition.id))
        throw new Error("Duplicate algorithm id.");
      entries.set(definition.id, Object.freeze({ ...definition }));
    },
    get(id) {
      if (!entries.has(id)) throw new Error(`Algorithm unavailable: ${id}`);
      return entries.get(id);
    },
    list() {
      return [...entries.values()];
    },
  };
}
export const algorithmRegistry = createRegistry();
algorithmDefinitions.forEach((definition) =>
  algorithmRegistry.register(definition),
);
