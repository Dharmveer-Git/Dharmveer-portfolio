export function databaseErrorHint(error) {
  const errors = [error, error?.cause, ...Array.from(error?.reason?.servers?.values?.() || [], (server) => server.error)]
  const details = errors.map((item) => `${item?.code || ''} ${item?.message || ''}`).join(' ')
  if (/querySrv|queryTxt|ENOTFOUND|EAI_AGAIN|ECONNREFUSED.*_mongodb/i.test(details)) {
    return 'MongoDB DNS lookup failed. Check your DNS/network connection and MONGODB_DNS_SERVERS if configured.'
  }
  if (/TLS|SSL|certificate/i.test(details)) {
    return 'MongoDB TLS connection failed. Check Atlas Network Access for your current public IP, cluster availability, and VPN/firewall TLS filtering. Keep certificate validation enabled.'
  }
  if (/Authentication failed|bad auth/i.test(details) || error?.code === 18) {
    return 'MongoDB authentication failed. Check the database user and URL-encoded credentials in MONGODB_URI.'
  }
  return 'MongoDB connection failed. Check MONGODB_URI, Atlas cluster status, Network Access, and outbound connectivity to port 27017.'
}
