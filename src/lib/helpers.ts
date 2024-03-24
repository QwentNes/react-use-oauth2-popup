type AnyFunction = (...args: any[]) => any;

class Helpers {
   public static IsFunction<T extends AnyFunction>(value: any): value is T {
      return value && typeof value === 'function';
   }

   public static IsString(value: any): value is string {
      return value && typeof value === 'string';
   }

   public static IsObject(value: any): value is object {
      return value && typeof value === 'object';
   }

   public static IsContainsField(object: object, filed: string): boolean {
      return Object.prototype.hasOwnProperty.call(object, filed);
   }

   public static AllDefined(...values: any[]): boolean {
      return values.every((value) => value !== undefined && value !== null);
   }
}

export default Helpers;
