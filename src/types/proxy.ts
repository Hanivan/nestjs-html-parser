export interface ProxyConfig {
  /**
   * Proxy server URL (e.g., 'http://proxy.example.com:8080')
   */
  url: string;
  /**
   * Type of proxy server
   */
  type?: 'http' | 'https' | 'socks4' | 'socks5';
  /**
   * Username for proxy authentication
   */
  username?: string;
  /**
   * Password for proxy authentication
   */
  password?: string;
}
