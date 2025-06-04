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
     * Function to transform the extracted value
     */
    transform?: (value: string) => any;
    /**
     * If true, extract an array of values instead of a single value
     */
    multiple?: boolean;
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
   * Function to transform the extracted value
   */
  transform?: (value: string) => T;
  /**
   * If true, extract an array of values instead of a single value
   */
  multiple?: boolean;
}
