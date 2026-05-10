const CONTACTS: Record<string, { name: string; address: string }> = {
  alice: { name: 'Alice', address: 'CenYq6bDRJB7EeD6qFTfF7tVKqKsYgYKAYP3A5JzRF2E' },
  bob: { name: 'Bob', address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
  charlie: { name: 'Charlie', address: 'GKZ662KqMfY3qEUDos3K1B2DdU1FnL3FmjLSGC4sVVaT' },
}

export function resolveContact(name: string): string | null {
  const key = name.toLowerCase().trim()
  return CONTACTS[key]?.address ?? null
}

export function getContactName(address: string): string | null {
  return Object.values(CONTACTS).find(c => c.address === address)?.name ?? null
}

export function getAllContacts() {
  return Object.values(CONTACTS)
}
