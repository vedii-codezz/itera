import { bubbleSort, bubbleSortPseudocode } from "./bubbleSort.js";
import { insertionSort, insertionSortPseudocode } from "./insertionSort.js";
import { mergeSort, mergeSortPseudocode } from "./mergeSort.js";
import { quickSort, quickSortPseudocode } from "./quickSort.js";
import { binarySearch, binarySearchPseudocode } from "./binarySearch.js";
import { kadane, kadanePseudocode } from "./kadane.js";
import { MAX_LENGTH } from "../utils/input.js";

function freezeMetadata(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeMetadata);
    Object.freeze(value);
  }
  return value;
}

const inputRequirements = {
  type: "integer-array",
  maxLength: MAX_LENGTH,
  min: -999,
  max: 999,
  sorted: false,
  allowEmpty: true,
};
const sortMetrics = ["comparisons", "swaps", "writes", "steps"];

/** Time describes core operations; auxiliarySpace includes the execution copy and tracing state.
 * Snapshot cloning/caching costs are described separately in README, not hidden as algorithm work.
 */
export const algorithmDefinitions = freezeMetadata([
  {
    id: "bubble-sort",
    name: "Bubble Sort",
    category: "Sorting",
    generate: bubbleSort,
    inputRequirements,
    pseudocode: bubbleSortPseudocode,
    supportedMetrics: sortMetrics,
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      auxiliarySpace: "O(n)",
      coreAuxiliarySpace: "O(1)",
      notes:
        "Early exit after an unchanged pass. Execution keeps an input copy; snapshot costs are separate.",
    },
    stable: true,
    inPlaceCore: true,
  },
  {
    id: "insertion-sort",
    name: "Insertion Sort",
    category: "Sorting",
    generate: insertionSort,
    inputRequirements,
    pseudocode: insertionSortPseudocode,
    supportedMetrics: ["comparisons", "writes", "steps"],
    complexity: {
      best: "O(n)",
      average: "O(n²)",
      worst: "O(n²)",
      auxiliarySpace: "O(n)",
      coreAuxiliarySpace: "O(1)",
      notes:
        "Strict-greater shifts preserve equal-value order. Execution keeps an input copy; key insertions count even at the original position.",
    },
    stable: true,
    inPlaceCore: true,
  },
  {
    id: "merge-sort",
    name: "Merge Sort",
    category: "Sorting",
    generate: mergeSort,
    inputRequirements,
    pseudocode: mergeSortPseudocode,
    supportedMetrics: ["comparisons", "writes", "bufferWrites", "steps"],
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n log n)",
      auxiliarySpace: "O(n)",
      coreAuxiliarySpace: "O(n)",
      notes:
        "Top-down recursive merge; left wins ties. No already-ordered merge shortcut. Temporary buffer writes are separate from main-array writes.",
    },
    stable: true,
    inPlaceCore: false,
  },
  {
    id: "quick-sort",
    name: "Quick Sort",
    category: "Sorting",
    generate: quickSort,
    inputRequirements,
    pseudocode: quickSortPseudocode,
    supportedMetrics: sortMetrics,
    complexity: {
      best: "O(n log n)",
      average: "O(n log n)",
      worst: "O(n²)",
      auxiliarySpace: "O(n)",
      coreAuxiliarySpace: "O(log n) average; O(n) worst",
      notes:
        "Lomuto partition, final-element pivot, <= comparison. Self-swaps are omitted. Sorted and all-equal inputs reach worst-case recursion. Execution also stores an input copy and settled indices.",
    },
    stable: false,
    inPlaceCore: true,
    pivotStrategy: "Lomuto, last element",
  },
  {
    id: "binary-search",
    name: "Binary Search",
    category: "Searching",
    generate: binarySearch,
    inputRequirements: {
      ...inputRequirements,
      sorted: true,
      target: { required: true, type: "integer", min: -999, max: 999 },
    },
    pseudocode: binarySearchPseudocode,
    supportedMetrics: ["comparisons", "iterations", "steps"],
    complexity: {
      best: "O(log n)",
      average: "O(log n)",
      worst: "O(log n)",
      auxiliarySpace: "O(n)",
      coreAuxiliarySpace: "O(1)",
      validation: "O(n)",
      notes:
        "For nonempty input, continue left on a match; no early-success exit. Validation checks sortedness in O(n), so validation plus core search is O(n). Execution copies the input and builds interval highlights.",
    },
    duplicatePolicy: "Return the leftmost matching index; -1 when absent.",
  },
  {
    id: "kadane",
    name: "Kadane’s Algorithm",
    category: "Dynamic Programming",
    generate: kadane,
    inputRequirements,
    pseudocode: kadanePseudocode,
    supportedMetrics: ["elementsProcessed", "bestUpdates", "steps"],
    complexity: {
      best: "O(n)",
      average: "O(n)",
      worst: "O(n)",
      auxiliarySpace: "O(n)",
      coreAuxiliarySpace: "O(1)",
      notes:
        "Execution stores an input copy and the running-sum chart history; scalar core state is O(1). Nonempty input returns a nonempty subarray.",
    },
    tiePolicy: "Earliest start, then earliest end.",
    emptyPolicy: "Sum 0, empty subarray, null boundaries.",
  },
]);
