export type TransformFunction = (value: any) => any;
export type TransformObject = { transform: (value: any) => any };
export type TransformClass = new (...args: any[]) => TransformObject;
export type TransformType =
  | TransformFunction
  | TransformObject
  | TransformClass
  | Array<TransformFunction | TransformObject | TransformClass>;

export interface ExtractionSchema<T = Record<string, any>> {
  [key: string]: {
    /**
     * CSS selector or XPath expression to locate elements
     */
    selector: string;
    /**
     * Type of selector being used
     */
    type: 'xpath' | 'css';
    /**
     * HTML attribute to extract from the selected element
     */
    attribute?: string;
    /**
     * Transform to apply to the extracted value. Can be:
     * - a function (value: string) => any
     * - an object with a transform(value: any) method
     * - a class constructor with a transform method
     * - an array of such functions/objects/classes (applied in order)
     */
    transform?: TransformType;
    /**
     * If true, extract an array of values instead of a single value
     */
    multiple?: boolean;
    /**
     * If true, return the raw HTML of the matched element(s) instead of text/attribute value
     */
    raw?: boolean;
  };
}

export interface ExtractionField<T = any> {
  /**
   * CSS selector or XPath expression to locate elements
   */
  selector: string;
  /**
   * Type of selector being used
   */
  type: 'xpath' | 'css';
  /**
   * HTML attribute to extract from the selected element
   */
  attribute?: string;
  /**
   * Transform to apply to the extracted value. Can be:
   * - a function (value: string) => T
   * - an object with a transform(value: any) => T method
   * - a class constructor with a transform method
   * - an array of such functions/objects/classes (applied in order)
   */
  transform?: TransformType;
  /**
   * If true, extract an array of values instead of a single value
   */
  multiple?: boolean;
  /**
   * If true, return the raw HTML of the matched element(s) instead of text/attribute value
   */
  raw?: boolean;
}

export interface ExtractionOptions<T = any> {
  verbose?: boolean;
  /**
   * Transform to apply to the extracted value. Can be:
   * - a function (value: string) => T
   * - an object with a transform(value: any) => T method
   * - a class constructor with a transform method
   * - an array of such functions/objects/classes (applied in order)
   */
  transform?: TransformType;
}
