type CXArgs =
  | string
  | { [key: string]: boolean | void | null }
  | Array<CXArgs>
  | void
  | null;

/**
 * Combines multiple class names or objects into a single string.
 *
 * @param  args - The class names or objects to be combined.
 * @returns  A string containing the combined class names.
 */
export const cx = (...args: Array<CXArgs>): string => {
  let cls = '';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg == null) continue;

    let toAdd: string;
    switch (typeof arg) {
      case 'object': {
        if (Array.isArray(arg)) {
          toAdd = cx(...arg);
        } else {
          toAdd = '';
          for (const k in arg) {
            if (arg[k] && k) {
              if (toAdd) toAdd += ' ';
              toAdd += k;
            }
          }
        }
        break;
      }
      default: {
        toAdd = arg;
      }
    }
    if (toAdd) {
      if (cls) cls += ' ';
      cls += toAdd;
    }
  }

  return cls;
};
