import dns from 'node:dns'
import { isIP } from 'node:net'

export function createDatabaseLookup(resolver, systemLookup = dns.lookup) {
  return (hostname, options, callback) => {
    if (typeof options === 'function') { callback = options; options = {} }
    if (typeof options === 'number') options = { family: options }
    options ||= {}
    // Keep local/private database names and IP literals on the system resolver.
    if (isIP(hostname) || !hostname.endsWith('.mongodb.net')) {
      return systemLookup(hostname, options, callback)
    }
    const families = options.family === 4 ? [4] : options.family === 6 ? [6] : [4, 6]
    Promise.allSettled(families.map((family) => new Promise((resolve, reject) => {
      resolver[family === 4 ? 'resolve4' : 'resolve6'](hostname, (error, addresses) => {
        if (error) reject(error)
        else resolve(addresses.map((address) => ({ address, family })))
      })
    }))).then((results) => {
      let addresses = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
      if (options.order === 'ipv6first') addresses = addresses.sort((a, b) => b.family - a.family)
      if (!addresses.length) {
        const error = results.find((result) => result.status === 'rejected')?.reason || new Error('No DNS addresses found')
        error.hostname = hostname
        callback(error)
      } else if (options.all) callback(null, addresses)
      else callback(null, addresses[0].address, addresses[0].family)
    })
  }
}

// SRV/TXT discovery and Atlas socket lookups must use the same DNS override.
export function configureDatabaseDns() {
  const servers = (process.env.MONGODB_DNS_SERVERS || '').split(',').map((value) => value.trim()).filter(Boolean)
  if (!servers.length) return {}
  const resolver = new dns.Resolver({ timeout: 2_000, tries: 2 })
  resolver.setServers(servers)
  dns.setServers(servers)
  return { lookup: createDatabaseLookup(resolver) }
}
