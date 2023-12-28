export type MergeTypes<T, K> = Omit<T, keyof K> & K;
export type PreservedValue<Value, Fallback> = [Value] extends [never] ? Fallback : Value;
