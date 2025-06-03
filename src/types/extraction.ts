export interface ExtractionSchema {
  [key: string]: {
    selector: string;
    type: 'xpath' | 'css';
    attribute?: string;
    transform?: (value: string) => any;
  };
}
