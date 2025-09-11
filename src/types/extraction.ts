export type TransformPipeConfig<T = any> = {
  class: new (...args: any[]) => { transform: (value: any) => any };
  payload?: Partial<T>;
};

export type TransformType = TransformPipeConfig | ((value: any) => any) | Array<TransformPipeConfig | ((value: any) => any)>;

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
     * Transform to apply to the extracted value. Must be:
     * - an object with { class: PipeClass, payload?: {...} }
     * - an array of such objects (applied in order)
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

export interface ExtractionField {
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
   * Transform to apply to the extracted value. Must be:
   * - an object with { class: PipeClass, payload?: {...} }
   * - an array of such objects (applied in order)
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

export interface ExtractionOptions {
  verbose?: boolean;
  /**
   * Base URL for resolving relative URLs in transform pipes (e.g., ParseAsURLPipe)
   */
  baseUrl?: string;
  /**
   * Transform to apply to the extracted value. Must be:
   * - an object with { class: PipeClass, payload?: {...} }
   * - an array of such objects (applied in order)
   */
  transform?: TransformType;
}
