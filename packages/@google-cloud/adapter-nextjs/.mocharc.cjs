// Node.js 22.6+ can strip TypeScript types natively, which bypasses ts-node and breaks these
// CommonJS-compiled specs, so turn it off there. Older Node versions don't know the flag.
const [major, minor] = process.versions.node.split(".").map(Number);
const supportsStripTypesFlag = major > 22 || (major === 22 && minor >= 6);

module.exports = supportsStripTypesFlag ? { "node-option": ["no-experimental-strip-types"] } : {};
