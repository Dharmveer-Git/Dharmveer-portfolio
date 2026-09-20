import dns from 'node:dns'

// Optional process-local DNS override for networks that block SRV lookups.
export function configureDatabaseDns() {
  const servers = (process.env.MONGODB_DNS_SERVERS || '').split(',').map((value) => value.trim()).filter(Boolean)
  if (servers.length) dns.setServers(servers)
}
