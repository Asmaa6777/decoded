/* Logic for the Computer Networks course. Pure functions; the visualizers in
   src/components/mdx/NetworkVisualizers.tsx draw them. */

import type { Frame } from "@/lib/algorithms";

const f = <S>(state: S, line: number, message: string, stats: Record<string, number> = {}): Frame<S> => ({ state, line, message, stats });

/* ================================ encapsulation ================================ */

export type Layer = { name: string; unit: string; header: number; trailer?: number; adds: string; tone: string };

/** The layers a web request passes through on its way down the sender's stack (sizes in bytes, typical minimums). */
export const LAYERS: Layer[] = [
  { name: "Application", unit: "message", header: 0, adds: "the HTTP request itself", tone: "mint" },
  { name: "Transport", unit: "segment", header: 20, adds: "TCP header: ports, sequence and ack numbers, flags", tone: "sky" },
  { name: "Network", unit: "packet", header: 20, adds: "IPv4 header: source and destination IP, TTL", tone: "violet" },
  { name: "Link", unit: "frame", header: 14, trailer: 4, adds: "Ethernet header (MAC addresses) and a checksum trailer", tone: "orange" },
];

export type EncapState = { depth: number; going: "down" | "up" | "wire" };

export function encapsulationFrames(payload: number): Frame<EncapState>[] {
  const frames: Frame<EncapState>[] = [];
  let size = payload;
  LAYERS.forEach((l, i) => {
    size += l.header + (l.trailer ?? 0);
    frames.push(f({ depth: i, going: "down" }, i, i === 0 ? `The browser writes a ${payload}-byte HTTP request. To the network it's just bytes: a message.` : `${l.name} layer: wraps everything above it and adds ${l.adds} (${l.header + (l.trailer ?? 0)} bytes). The ${l.unit} is now ${size} bytes.`, { bytes: size, overhead: size - payload }));
  });
  frames.push(f({ depth: 4, going: "wire" }, 4, `${size} bytes go out on the wire as bits. ${size - payload} of them (${Math.round(((size - payload) / size) * 100)}%) are headers.`, { bytes: size, overhead: size - payload }));
  for (let i = LAYERS.length - 1; i >= 0; i--) {
    const l = LAYERS[i];
    size -= l.header + (l.trailer ?? 0);
    frames.push(f({ depth: i, going: "up" }, i, i === 0 ? `The server's application gets back exactly the ${payload} bytes the browser sent.` : `The receiver's ${l.name.toLowerCase()} layer reads its own header, strips it, and hands the rest up.`, { bytes: i === 0 ? payload : size + l.header + (l.trailer ?? 0), overhead: 0 }));
  }
  return frames;
}

/* ================================ delay ================================ */

export const SIGNAL_SPEED = 2e8; // m/s: light in fibre or a signal in copper, about 2/3 of c

/** Seconds to push L bits onto a link of R bits per second. */
export const transmissionDelay = (bits: number, bps: number) => bits / bps;
/** Seconds for one bit to travel d metres. */
export const propagationDelay = (metres: number, speed = SIGNAL_SPEED) => metres / speed;

/** Time to send a file of `bytes` and wait for the reply, ignoring queueing: one round trip plus transmission. */
export function transferTime(bytes: number, bps: number, metres: number) {
  const tx = transmissionDelay(bytes * 8, bps);
  const prop = propagationDelay(metres);
  return { tx, prop, total: tx + 2 * prop };
}

export function formatSeconds(s: number): string {
  if (s >= 1) return `${+s.toPrecision(3)} s`;
  if (s >= 1e-3) return `${+(s * 1e3).toPrecision(3)} ms`;
  if (s >= 1e-6) return `${+(s * 1e6).toPrecision(3)} µs`;
  return `${+(s * 1e9).toPrecision(3)} ns`;
}

/* ================================ IP addresses ================================ */

export function ipToInt(ip: string): number {
  const parts = ip.trim().split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) throw new Error(`"${ip}" isn't an IPv4 address`);
  return parts.reduce((acc, p) => acc * 256 + Number(p), 0);
}

export const intToIp = (n: number) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join(".");

export const toBits = (n: number) => n.toString(2).padStart(32, "0");

export type Subnet = { address: number; prefix: number; network: number; broadcast: number; mask: number; hosts: number };

export function parseCidr(cidr: string): Subnet {
  const m = /^\s*([\d.]+)\s*\/\s*(\d{1,2})\s*$/.exec(cidr);
  if (!m || Number(m[2]) > 32) throw new Error(`"${cidr}" isn't in a.b.c.d/n form`);
  const address = ipToInt(m[1]);
  const prefix = Number(m[2]);
  const size = 2 ** (32 - prefix);
  const network = Math.floor(address / size) * size;
  const broadcast = network + size - 1;
  const mask = 2 ** 32 - size;
  // /31 and /32 are special: no network and broadcast addresses are set aside
  const hosts = prefix >= 31 ? size : size - 2;
  return { address, prefix, network, broadcast, mask, hosts };
}

export const inSubnet = (s: Subnet, ip: number) => ip >= s.network && ip <= s.broadcast;

export type Route = { cidr: string; via: string };

/** Longest-prefix match: of the routes containing the address, the most specific wins. */
export function longestPrefixMatch(table: Route[], ip: string): { route: Route | null; matches: Route[] } {
  const n = ipToInt(ip);
  const matches = table.filter((r) => inSubnet(parseCidr(r.cidr), n));
  const route = matches.reduce<Route | null>((best, r) => (!best || parseCidr(r.cidr).prefix > parseCidr(best.cidr).prefix ? r : best), null);
  return { route, matches };
}

/* ================================ routing ================================ */

export type Link = [string, string, number];
export type RouteState = { dist: Record<string, number>; prev: Record<string, string | null>; done: string[]; current: string | null; relaxed: string[] };

export const PY_LINK_STATE = [
  "dist = {r: inf for r in routers};  dist[me] = 0",
  "unvisited = set(routers)",
  "while unvisited:",
  "    u = min(unvisited, key=dist.get)      # closest unfinished router",
  "    unvisited.remove(u)",
  "    for v, cost in links[u]:",
  "        if dist[u] + cost < dist[v]:",
  "            dist[v] = dist[u] + cost;  prev[v] = u",
];

/** Dijkstra from `source`, as a link-state router runs it on its map of the network. */
export function linkStateFrames(nodes: string[], links: Link[], source: string): Frame<RouteState>[] {
  const dist: Record<string, number> = Object.fromEntries(nodes.map((n) => [n, n === source ? 0 : Infinity]));
  const prev: Record<string, string | null> = Object.fromEntries(nodes.map((n) => [n, null]));
  const done: string[] = [];
  const adj = (u: string) => links.flatMap(([a, b, w]) => (a === u ? [[b, w] as const] : b === u ? [[a, w] as const] : []));
  const snap = (current: string | null, relaxed: string[]): RouteState => ({ dist: { ...dist }, prev: { ...prev }, done: [...done], current, relaxed });
  const frames: Frame<RouteState>[] = [f(snap(null, []), 0, `Router ${source} knows the whole map (every router floods its links). It starts at distance 0; everything else is ∞.`, { finished: 0 })];
  while (done.length < nodes.length) {
    const u = nodes.filter((n) => !done.includes(n)).reduce((a, b) => (dist[b] < dist[a] ? b : a));
    if (dist[u] === Infinity) break;
    done.push(u);
    const relaxed: string[] = [];
    for (const [v, w] of adj(u)) {
      if (!done.includes(v) && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
        relaxed.push(v);
      }
    }
    frames.push(f(snap(u, relaxed), relaxed.length ? 7 : 4, `Closest unfinished router: ${u} at cost ${dist[u]}. It's final.${relaxed.length ? ` Going through ${u} improves ${relaxed.map((v) => `${v} (now ${dist[v]})`).join(", ")}.` : " No neighbour gets cheaper through it."}`, { finished: done.length }));
  }
  return frames;
}

/** The first hop from source towards each destination, read off Dijkstra's prev pointers. */
export function forwardingTable(prev: Record<string, string | null>, source: string): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const dest of Object.keys(prev)) {
    if (dest === source) continue;
    let hop: string | null = dest;
    while (hop !== null && prev[hop] !== source) hop = prev[hop];
    out[dest] = hop;
  }
  return out;
}

/* ================================ TCP ================================ */

export type TcpEvent = { from: "client" | "server"; label: string; kind: "syn" | "data" | "ack" | "fin" | "lost"; lost?: boolean };
export type TcpState = { events: TcpEvent[]; clientState: string; serverState: string; delivered: string };

/** A short connection: handshake, four data segments with one lost and resent after duplicate ACKs, then close. */
export function tcpFrames(loseSegment: boolean): Frame<TcpState>[] {
  const frames: Frame<TcpState>[] = [];
  const events: TcpEvent[] = [];
  let cs = "CLOSED";
  let ss = "LISTEN";
  let delivered = "";
  const push = (e: TcpEvent | null, c: string, s: string, msg: string, line: number) => {
    if (e) events.push(e);
    cs = c;
    ss = s;
    frames.push(f({ events: [...events], clientState: cs, serverState: ss, delivered }, line, msg, { segments: events.length }));
  };
  push(null, "CLOSED", "LISTEN", "The server is listening on port 443. The client has nothing open yet.", 0);
  push({ from: "client", label: "SYN seq=100", kind: "syn" }, "SYN-SENT", "LISTEN", "Client: SYN. \"I'd like to talk; my bytes will be numbered from 100.\" The starting number is random, so old or forged segments don't fit.", 0);
  push({ from: "server", label: "SYN-ACK seq=300 ack=101", kind: "syn" }, "SYN-SENT", "SYN-RECEIVED", "Server: SYN-ACK. \"Got it, I expect your byte 101 next, and my bytes start at 300.\"", 0);
  push({ from: "client", label: "ACK ack=301", kind: "ack" }, "ESTABLISHED", "ESTABLISHED", "Client: ACK. Both sides now know each other's starting numbers. That's the three-way handshake: one round trip before any data.", 0);
  const data = ["HEL", "LO ", "WOR", "LD!"];
  let seq = 101;
  const sent: number[] = [];
  data.forEach((d, i) => {
    const lost = loseSegment && i === 1;
    events.push({ from: "client", label: `seq=${seq} "${d}"`, kind: lost ? "lost" : "data", lost });
    sent.push(seq);
    seq += d.length;
  });
  delivered = "HEL";
  frames.push(f({ events: [...events], clientState: cs, serverState: ss, delivered }, 1, loseSegment ? "The client sends four segments without waiting: that's the window. Segment 2 (seq=104) is lost on the way." : "The client sends four segments without waiting for each ACK: that's the window.", { segments: events.length }));
  if (!loseSegment) {
    delivered = "HELLO WORLD!";
    push({ from: "server", label: "ACK ack=113", kind: "ack" }, "ESTABLISHED", "ESTABLISHED", "Everything arrived in order. One cumulative ACK, 113, says \"I have every byte before 113.\"", 2);
  } else {
    push({ from: "server", label: "ACK ack=104", kind: "ack" }, "ESTABLISHED", "ESTABLISHED", "The server got seq 101 to 103 and acknowledges: \"next I need 104\".", 2);
    push({ from: "server", label: "ACK ack=104 (dup)", kind: "ack" }, "ESTABLISHED", "ESTABLISHED", "\"WOR\" arrives, but 104 is still missing. The server holds it and repeats ack=104: a duplicate ACK.", 3);
    push({ from: "server", label: "ACK ack=104 (dup)", kind: "ack" }, "ESTABLISHED", "ESTABLISHED", "\"LD!\" arrives too. Another duplicate ACK for 104.", 3);
    push({ from: "client", label: 'seq=104 "LO " (resent)', kind: "data" }, "ESTABLISHED", "ESTABLISHED", "Three ACKs for the same byte tell the client one segment went missing while later ones arrived. It resends seq=104 at once, without waiting for a timeout: fast retransmit.", 4);
    delivered = "HELLO WORLD!";
    push({ from: "server", label: "ACK ack=113", kind: "ack" }, "ESTABLISHED", "ESTABLISHED", "The gap is filled. The server now has bytes 101 to 112 and delivers them to the application in order: ack=113.", 5);
  }
  push({ from: "client", label: "FIN seq=113", kind: "fin" }, "FIN-WAIT", "CLOSE-WAIT", "Client: FIN, \"I'm done sending.\" Each direction is closed separately.", 6);
  push({ from: "server", label: "ACK + FIN", kind: "fin" }, "TIME-WAIT", "LAST-ACK", "The server acknowledges and sends its own FIN.", 6);
  push({ from: "client", label: "ACK", kind: "ack" }, "CLOSED", "CLOSED", `Closed. The application received "${delivered}", complete and in order, though one segment was ${loseSegment ? "lost and resent" : "never in danger"}.`, 6);
  return frames;
}

export const TCP_CODE = ["connect(): three-way handshake", "send segments up to the window size", "receiver ACKs the next byte it needs", "out of order? repeat that ACK (duplicate)", "3 duplicate ACKs: resend the missing segment", "gap filled: cumulative ACK jumps ahead", "close(): FIN each way"];

/* ================================ congestion control ================================ */

export type CwndPoint = { round: number; cwnd: number; ssthresh: number; phase: "slow start" | "congestion avoidance"; event: "triple-dup" | "timeout" | null };

/**
 * TCP Reno, one point per round trip. cwnd is in segments. Slow start doubles
 * until ssthresh; then +1 per round. A triple duplicate ACK halves cwnd; a
 * timeout drops it to 1 and restarts slow start.
 */
export function renoTrace(rounds: number, losses: Record<number, "triple-dup" | "timeout">, ssthresh0 = 16): CwndPoint[] {
  let cwnd = 1;
  let ssthresh = ssthresh0;
  const out: CwndPoint[] = [];
  for (let r = 0; r < rounds; r++) {
    const event = losses[r] ?? null;
    out.push({ round: r, cwnd, ssthresh, phase: cwnd < ssthresh ? "slow start" : "congestion avoidance", event });
    if (event === "triple-dup") {
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = ssthresh;
    } else if (event === "timeout") {
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = 1;
    } else if (cwnd < ssthresh) cwnd = Math.min(cwnd * 2, ssthresh);
    else cwnd += 1;
  }
  return out;
}

/* ================================ DNS ================================ */

export type DnsState = { step: number; cached: boolean };

export const DNS_HOPS = [
  { who: "your laptop", to: "recursive resolver", ask: "www.decoded-demo.com?", say: "Your laptop asks its configured resolver (often your router, ISP, 1.1.1.1 or 8.8.8.8) to find the whole answer for it." },
  { who: "recursive resolver", to: "root server", ask: "www.decoded-demo.com?", say: "The resolver doesn't know, so it asks one of the 13 root server names (well over a thousand machines answer for them, worldwide). Roots only know who runs each top-level domain." },
  { who: "root server", to: "recursive resolver", ask: "try .com: a.gtld-servers.net", say: "The root replies with a referral: the name servers for .com." },
  { who: "recursive resolver", to: ".com TLD server", ask: "www.decoded-demo.com?", say: "The resolver asks a .com server." },
  { who: ".com TLD server", to: "recursive resolver", ask: "try decoded-demo.com's own servers", say: "Another referral: the authoritative name servers for decoded-demo.com." },
  { who: "recursive resolver", to: "decoded-demo.com server", ask: "www.decoded-demo.com?", say: "The resolver asks decoded-demo.com's authoritative server, the one that actually owns the answer." },
  { who: "decoded-demo.com server", to: "recursive resolver", ask: "A 203.0.113.10, TTL 3600", say: "The answer: an A record with the IPv4 address, and a TTL saying it may be cached for 3,600 seconds." },
  { who: "recursive resolver", to: "your laptop", ask: "203.0.113.10", say: "The resolver caches every reply it got, then hands the address back. Your browser can finally open a TCP connection." },
];

export function dnsFrames(cached: boolean): Frame<DnsState>[] {
  if (cached)
    return [
      f({ step: 0, cached }, 0, DNS_HOPS[0].say, { "round trips": 1 }),
      f({ step: 7, cached }, 7, "Someone asked for this name in the last hour, so the answer is still in the resolver's cache (TTL not expired). One round trip instead of four; this is what happens most of the time.", { "round trips": 1 }),
    ];
  return DNS_HOPS.map((h, i) => f({ step: i, cached }, i, h.say, { "round trips": Math.ceil((i + 1) / 2) }));
}
