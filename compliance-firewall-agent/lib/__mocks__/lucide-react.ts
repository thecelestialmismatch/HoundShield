// Stub all Lucide icons as no-op strings for Node/Jest test environments.
// The pricing _data.ts no longer imports from lucide-react directly,
// but this stub remains for any future test files that transitively pull it in.
const stub = () => null;
const handler = { get: () => stub };
export default new Proxy({}, handler);
module.exports = new Proxy({}, handler);
