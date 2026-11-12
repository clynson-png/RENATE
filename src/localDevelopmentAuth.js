const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

export function canSkipLocalAuth({ developmentBuild, hostname }) {
  return developmentBuild === true
    && LOCAL_HOSTNAMES.has(String(hostname ?? '').toLowerCase());
}
