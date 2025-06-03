export interface ProxyConfig {
  url: string;
  type?: 'http' | 'https' | 'socks4' | 'socks5';
  username?: string;
  password?: string;
}
