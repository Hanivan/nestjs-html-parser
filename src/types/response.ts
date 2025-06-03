export interface HtmlFetchResponse {
  /**
   * HTML content of the fetched page
   */
  data: string;
  /**
   * HTTP response headers as key-value pairs
   */
  headers: Record<string, string>;
  /**
   * HTTP status code (e.g., 200, 404, 500)
   */
  status: number;
  /**
   * HTTP status text (e.g., 'OK', 'Not Found', 'Internal Server Error')
   */
  statusText: string;
}
