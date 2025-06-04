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
     * - an object with an execute(value: any) method
     * - an array of such functions/objects (applied in order)
     */
    transform?:
      | ((value: any) => any)
      | { execute: (value: any) => any }
      | (((value: any) => any) | { execute: (value: any) => any })[];
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
   * - a function (value: string) => any
   * - an object with an execute(value: any) method
   * - an array of such functions/objects (applied in order)
   */
  transform?:
    | ((value: any) => T)
    | { execute: (value: any) => T }
    | (((value: any) => T) | { execute: (value: any) => T })[];
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
   * - an object with an execute(value: any) => T method
   * - an array of such functions/objects (applied in order)
   */
  transform?:
    | ((value: any) => T)
    | { execute: (value: any) => T }
    | (((value: any) => T) | { execute: (value: any) => T })[];
}
