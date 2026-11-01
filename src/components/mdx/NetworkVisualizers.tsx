import { useMemo, useState } from "react";
import { btn, inputCls, Stepper, Toggle } from "@/components/mdx/AlgoVisualizers";
import { Panel } from "@/components/mdx/MatrixVisualizers";
import {
  DNS_HOPS,
  dnsFrames,
  encapsulationFrames,
  formatSeconds,
  forwardingTable,
  intToIp,
  ipToInt,
  LAYERS,
  linkStateFrames,
  longestPrefixMatch,
  parseCidr,
  PY_LINK_STATE,
  renoTrace,
  TCP_CODE,
  tcpFrames,
  toBits,
  transferTime,
  type DnsState,
  type EncapState,
  type Link,
  type RouteState,
  type Route,
  type TcpState,
} from "@/lib/networks";

/* ============================================================
   Visualizers for the Computer Networks course. Layer colours:
   mint = application, sky = transport, violet = network,
   orange = link. Elsewhere: neon = now, mint = done / delivered,
   orange = lost or a problem.
   ============================================================ */

const chip = `${btn} !px-2 !py-1 !normal-case !tracking-normal`;
const LAYER_BG: Record<string, string> = { mint: "bg-mint/30 border-mint", sky: "bg-sky/30 border-sky", violet: "bg-violet/30 border-violet", orange: "bg-orange/30 border-orange" };

/* -------------------------------- encapsulation -------------------------------- */

export function EncapsulationDemo() {
  const frames = useMemo(() => encapsulationFrames(500), []);
  return (
    <Stepper
      title="Encapsulation: wrapping a request for the trip"
      frames={frames}
      code={LAYERS.map((l) => `${l.name.padEnd(12)} ${l.unit}`).concat(["the wire       bits"])}
      codeLabel="Layer · unit"
      legend={LAYERS.map((l) => [`bg-${l.tone}`, l.name] as [string, string])}
      render={(s: EncapState) => {
        const outer = s.going === "wire" ? LAYERS.length - 1 : s.depth;
        const shown = LAYERS.slice(1, outer + 1);
        return (
          <div className="space-y-3">
            <div className="flex items-stretch font-mono text-[10px] sm:text-xs overflow-x-auto">
              {[...shown].reverse().map((l) => (
                <div key={l.name} className={`shrink-0 border-2 px-1.5 sm:px-2 py-2 rounded-l-sm animate-in fade-in slide-in-from-left-2 ${LAYER_BG[l.tone]}`}>
                  {l.name === "Link" ? "Eth" : l.name === "Network" ? "IP" : "TCP"}
                  <div className="text-muted-foreground">{l.header} B</div>
                </div>
              ))}
              <div className={`grow min-w-[90px] border-2 px-2 py-2 ${LAYER_BG.mint}`}>
                HTTP request
                <div className="text-muted-foreground">500 B</div>
              </div>
              {outer >= 3 && (
                <div className={`shrink-0 border-2 px-1.5 py-2 rounded-r-sm ${LAYER_BG.orange}`}>
                  FCS
                  <div className="text-muted-foreground">4 B</div>
                </div>
              )}
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {s.going === "wire" ? "on the wire: 010011010110…" : s.going === "down" ? `sender, going down: ${LAYERS[s.depth].name.toLowerCase()} layer` : `receiver, going up: ${LAYERS[s.depth].name.toLowerCase()} layer`}
            </div>
          </div>
        );
      }}
    />
  );
}

/* -------------------------------- delay -------------------------------- */

const SIZES: [string, number][] = [["1 KB", 1e3], ["1 MB", 1e6], ["100 MB", 1e8], ["4 GB", 4e9]];
const RATES: [string, number][] = [["10 Mb/s", 1e7], ["100 Mb/s", 1e8], ["1 Gb/s", 1e9], ["10 Gb/s", 1e10]];
const DISTANCES: [string, number][] = [["same building, 100 m", 100], ["across a city, 50 km", 5e4], ["London to New York, 5,600 km", 5.6e6], ["via a geostationary satellite, 72,000 km", 7.2e7]];

export function DelayCalculator() {
  const [size, setSize] = useState(1);
  const [rate, setRate] = useState(1);
  const [dist, setDist] = useState(2);
  const t = transferTime(SIZES[size][1], RATES[rate][1], DISTANCES[dist][1]);
  const txShare = t.tx / t.total;
  const pick = (opts: [string, number][], v: number, set: (i: number) => void, label: string) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground w-20 shrink-0">{label}</span>
      {opts.map(([name], i) => (
        <button key={name} type="button" className={`${chip} ${i === v ? "bg-foreground text-background border-foreground" : ""}`} onClick={() => set(i)}>
          {name}
        </button>
      ))}
    </div>
  );
  return (
    <Panel title="Where does the time go?" legend={[["bg-sky", "transmission"], ["bg-violet", "propagation (there and back)"]]}>
      {pick(SIZES, size, setSize, "file")}
      {pick(RATES, rate, setRate, "bandwidth")}
      {pick(DISTANCES, dist, setDist, "distance")}
      <div className="flex h-9 rounded-sm overflow-hidden border border-border">
        <div className="bg-sky/70 flex items-center justify-center transition-all duration-500" style={{ width: `${Math.max(txShare * 100, 0.5)}%` }}>
          {txShare > 0.2 && <span className="font-mono text-[11px] text-background font-bold">send</span>}
        </div>
        <div className="bg-violet/70 flex items-center justify-center transition-all duration-500" style={{ width: `${Math.max((1 - txShare) * 100, 0.5)}%` }}>
          {txShare < 0.8 && <span className="font-mono text-[11px] text-background font-bold">travel</span>}
        </div>
      </div>
      <div className="font-mono text-sm grid sm:grid-cols-3 gap-2">
        <div>transmission <b>{formatSeconds(t.tx)}</b><div className="text-[11px] text-muted-foreground">bits ÷ bandwidth</div></div>
        <div>propagation ×2 <b>{formatSeconds(2 * t.prop)}</b><div className="text-[11px] text-muted-foreground">distance ÷ 2×10⁸ m/s, both ways</div></div>
        <div>total <b>{formatSeconds(t.total)}</b><div className="text-[11px] text-muted-foreground">ignoring queues and processing</div></div>
      </div>
      <p className="text-sm leading-relaxed">
        {txShare > 0.9
          ? "Bandwidth-bound: almost all the time is spent pushing bits onto the link. A faster connection would help a lot."
          : txShare < 0.1
            ? "Latency-bound: the bits are sent almost instantly and then just travel. A faster connection barely helps; only being closer does."
            : "Both matter here: more bandwidth and a shorter distance would each make a visible difference."}
      </p>
    </Panel>
  );
}

/* -------------------------------- subnets -------------------------------- */

export function SubnetCalculator() {
  const [cidr, setCidr] = useState("192.168.1.130/26");
  const [probe, setProbe] = useState("192.168.1.200");
  const parsed = useMemo(() => {
    try {
      return { s: parseCidr(cidr), err: null };
    } catch (e) {
      return { s: null, err: (e as Error).message };
    }
  }, [cidr]);
  let probeIn: boolean | null = null;
  try {
    if (parsed.s) {
      const n = ipToInt(probe);
      probeIn = n >= parsed.s.network && n <= parsed.s.broadcast;
    }
  } catch {
    probeIn = null;
  }
  const s = parsed.s;
  return (
    <Panel title="A subnet, bit by bit" legend={[["bg-violet", "network bits"], ["bg-sky", "host bits"]]}>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="Address in CIDR form" className={`${inputCls} w-48 !py-1`} value={cidr} onChange={(e) => setCidr(e.target.value)} spellCheck={false} />
        {["192.168.1.130/26", "10.0.0.0/8", "172.16.5.4/20", "203.0.113.9/30"].map((c) => (
          <button key={c} type="button" className={chip} onClick={() => setCidr(c)}>{c}</button>
        ))}
      </div>
      {!s ? (
        <p className="font-mono text-xs text-orange">{parsed.err}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-y-1 font-mono text-[11px] sm:text-xs">
            {toBits(s.address).split("").map((b, i) => (
              <span key={i} className={`w-[9px] sm:w-3 text-center ${i < s.prefix ? "bg-violet/35" : "bg-sky/30"} ${i % 8 === 7 && i < 31 ? "mr-1.5" : ""}`}>{b}</span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
            <div>prefix <b>/{s.prefix}</b>: {s.prefix} network bits, {32 - s.prefix} host bits</div>
            <div>mask <b>{intToIp(s.mask)}</b></div>
            <div>network <b>{intToIp(s.network)}</b></div>
            <div>broadcast <b>{intToIp(s.broadcast)}</b></div>
            <div>usable hosts <b>{s.hosts.toLocaleString("en-US")}</b>{s.prefix < 31 ? ` = 2^${32 - s.prefix} − 2` : ""}</div>
            <div>range <b>{s.prefix >= 31 ? `${intToIp(s.network)} – ${intToIp(s.broadcast)}` : `${intToIp(s.network + 1)} – ${intToIp(s.broadcast - 1)}`}</b></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            is
            <input aria-label="Address to test" className={`${inputCls} w-36 !py-1`} value={probe} onChange={(e) => setProbe(e.target.value)} spellCheck={false} />
            on this subnet?
            {probeIn === null ? <span className="text-muted-foreground">type an IPv4 address</span> : probeIn ? <b className="text-mint">yes: same network, deliver directly</b> : <b className="text-orange">no: send it to the router</b>}
          </div>
        </>
      )}
    </Panel>
  );
}

/* -------------------------------- forwarding table -------------------------------- */

const TABLE: Route[] = [
  { cidr: "0.0.0.0/0", via: "ISP uplink (default)" },
  { cidr: "10.0.0.0/8", via: "campus core" },
  { cidr: "10.1.0.0/16", via: "science building" },
  { cidr: "10.1.2.0/24", via: "lab 2 switch" },
  { cidr: "192.168.0.0/16", via: "office VPN" },
];

export function ForwardingTableLab() {
  const [ip, setIp] = useState("10.1.2.77");
  let res: ReturnType<typeof longestPrefixMatch> | null = null;
  try {
    res = longestPrefixMatch(TABLE, ip);
  } catch {
    res = null;
  }
  return (
    <Panel title="A router's forwarding table" legend={[["bg-sky", "matches"], ["bg-mint", "longest match: used"]]}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">destination</span>
        <input aria-label="Destination address" className={`${inputCls} w-36 !py-1`} value={ip} onChange={(e) => setIp(e.target.value)} spellCheck={false} />
        {["10.1.2.77", "10.1.40.3", "10.9.9.9", "192.168.4.4", "8.8.8.8"].map((a) => (
          <button key={a} type="button" className={chip} onClick={() => setIp(a)}>{a}</button>
        ))}
      </div>
      <table className="font-mono text-xs w-full border-collapse">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="text-left font-normal py-1">prefix</th>
            <th className="text-left font-normal py-1">next hop</th>
          </tr>
        </thead>
        <tbody>
          {TABLE.map((r) => {
            const used = res?.route === r;
            const hit = res?.matches.includes(r);
            return (
              <tr key={r.cidr} className={`border-t border-border transition-colors ${used ? "bg-mint/25 font-bold" : hit ? "bg-sky/15" : ""}`}>
                <td className="py-1.5 pr-2">{r.cidr}</td>
                <td className="py-1.5">{r.via}{used ? " ←" : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-sm leading-relaxed min-h-[3em]">
        {!res
          ? "Type an IPv4 address."
          : `${res.matches.length} prefix${res.matches.length === 1 ? "" : "es"} contain${res.matches.length === 1 ? "s" : ""} ${ip}. The most specific one, ${res.route?.cidr}, wins, so the packet goes to the ${res.route?.via}.${res.route?.cidr === "0.0.0.0/0" ? " Only the default route matched: anything the router has no better idea about goes upstream." : ""}`}
      </p>
    </Panel>
  );
}

/* -------------------------------- link-state routing -------------------------------- */

const R_NODES = ["A", "B", "C", "D", "E"];
const R_POS: Record<string, [number, number]> = { A: [50, 110], B: [170, 40], C: [170, 180], D: [310, 55], E: [420, 160] };
const R_LINKS: Link[] = [["A", "B", 2], ["A", "C", 5], ["B", "C", 1], ["B", "D", 4], ["C", "D", 1], ["D", "E", 3], ["C", "E", 6]];

export function LinkStateDemo() {
  const [src, setSrc] = useState("A");
  const frames = useMemo(() => linkStateFrames(R_NODES, R_LINKS, src), [src]);
  return (
    <Stepper
      title="Link-state routing: Dijkstra inside a router"
      frames={frames}
      code={PY_LINK_STATE}
      codeLabel="Python"
      legend={[["bg-neon", "settled now"], ["bg-mint", "settled"], ["bg-sky", "on a shortest path"]]}
      inputs={<Toggle<string> value={src} onChange={setSrc} options={R_NODES.map((n) => [n, `from ${n}`] as [string, string])} />}
      render={(s: RouteState) => {
        const table = forwardingTable(s.prev, src);
        const onTree = (a: string, b: string) => s.prev[a] === b || s.prev[b] === a;
        return (
          <div className="space-y-3">
            <svg viewBox="0 0 470 220" className="w-full max-w-[520px] h-auto block mx-auto" role="img" aria-label="router network">
              {R_LINKS.map(([a, b, w]) => {
                const [x1, y1] = R_POS[a];
                const [x2, y2] = R_POS[b];
                const tree = onTree(a, b);
                return (
                  <g key={a + b}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={tree ? 3 : 1.5} className={tree ? "stroke-sky" : "stroke-border"} />
                    <rect x={(x1 + x2) / 2 - 10} y={(y1 + y2) / 2 - 10} width={20} height={20} rx={3} className="fill-card" />
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 4.5} textAnchor="middle" className="fill-muted-foreground font-mono text-[13px]">{w}</text>
                  </g>
                );
              })}
              {R_NODES.map((n) => {
                const [x, y] = R_POS[n];
                const cls = n === s.current ? "fill-neon/30 stroke-neon" : s.done.includes(n) ? "fill-mint/25 stroke-mint" : s.relaxed.includes(n) ? "fill-sky/20 stroke-sky" : "fill-card stroke-border";
                return (
                  <g key={n}>
                    <rect x={x - 22} y={y - 18} width={44} height={36} rx={4} className="fill-card" />
                    <rect x={x - 22} y={y - 18} width={44} height={36} rx={4} strokeWidth={2} className={`transition-colors ${cls}`} />
                    <text x={x} y={y + 5} textAnchor="middle" className="fill-foreground font-display font-bold text-[15px]">{n}</text>
                    <text x={x + 30} y={y - 12} textAnchor="start" paintOrder="stroke" strokeWidth={4} className="stroke-card fill-muted-foreground font-mono text-[12px]">{s.dist[n] === Infinity ? "∞" : s.dist[n]}</text>
                  </g>
                );
              })}
            </svg>
            <div className="font-mono text-xs">
              <span className="text-muted-foreground">{src}'s forwarding table: </span>
              {Object.entries(table).map(([d, hop]) => (
                <span key={d} className="mr-3 whitespace-nowrap">
                  {d} → <b>{s.done.includes(d) ? hop : "?"}</b>
                </span>
              ))}
            </div>
          </div>
        );
      }}
    />
  );
}

/* -------------------------------- TCP timeline -------------------------------- */

export function TcpTimeline() {
  const [lose, setLose] = useState(true);
  const frames = useMemo(() => tcpFrames(lose), [lose]);
  return (
    <Stepper
      title="A TCP connection, segment by segment"
      frames={frames}
      code={TCP_CODE}
      codeLabel="What TCP does"
      legend={[["bg-violet", "SYN / FIN"], ["bg-sky", "data"], ["bg-mint", "ACK"], ["bg-orange", "lost"]]}
      inputs={<Toggle<string> value={lose ? "y" : "n"} onChange={(v) => setLose(v === "y")} options={[["y", "Lose a segment"], ["n", "No loss"]]} />}
      render={(s: TcpState) => {
        const rowH = 26;
        const H = Math.max(6, s.events.length) * rowH + 40;
        const tone = (k: string) => (k === "lost" ? "stroke-orange" : k === "ack" ? "stroke-mint" : k === "data" ? "stroke-sky" : "stroke-violet");
        const fill = (k: string) => (k === "lost" ? "fill-orange" : k === "ack" ? "fill-mint" : k === "data" ? "fill-sky" : "fill-violet");
        return (
          <div className="space-y-2">
            <svg viewBox={`0 0 360 ${H}`} className="w-full max-w-[460px] h-auto block mx-auto" role="img" aria-label="TCP segments between client and server">
              <text x={40} y={14} textAnchor="middle" className="fill-foreground font-mono text-[11px] font-bold">client</text>
              <text x={320} y={14} textAnchor="middle" className="fill-foreground font-mono text-[11px] font-bold">server</text>
              <line x1={40} y1={22} x2={40} y2={H - 4} className="stroke-border" strokeWidth={2} />
              <line x1={320} y1={22} x2={320} y2={H - 4} className="stroke-border" strokeWidth={2} />
              {s.events.map((e, i) => {
                const y = 32 + i * rowH;
                const left = e.from === "client";
                const x1 = left ? 40 : 320;
                const x2 = e.lost ? 180 : left ? 320 : 40;
                const last = i === s.events.length - 1;
                return (
                  <g key={i} className={last ? "animate-in fade-in" : ""}>
                    <line x1={x1} y1={y} x2={x2} y2={y + 14} strokeWidth={last ? 2.5 : 1.6} className={tone(e.kind)} strokeDasharray={e.lost ? "4 3" : undefined} />
                    {e.lost ? <text x={x2 + 4} y={y + 18} className="fill-orange font-mono text-[13px] font-bold">✗</text> : <circle cx={x2} cy={y + 14} r={3} className={fill(e.kind)} />}
                    <text x={180} y={y + 5} textAnchor="middle" paintOrder="stroke" strokeWidth={4} className={`stroke-card font-mono text-[12px] ${last ? "fill-foreground font-bold" : "fill-muted-foreground"}`}>{e.label}</text>
                  </g>
                );
              })}
            </svg>
            <div className="flex flex-wrap justify-between gap-2 font-mono text-[11px]">
              <span>client: <b>{s.clientState}</b></span>
              <span>delivered to the app: <b className="text-mint">"{s.delivered}"</b></span>
              <span>server: <b>{s.serverState}</b></span>
            </div>
          </div>
        );
      }}
    />
  );
}

/* -------------------------------- congestion window -------------------------------- */

const LOSS_PRESETS: { id: string; label: string; losses: Record<number, "triple-dup" | "timeout"> }[] = [
  { id: "none", label: "No loss", losses: {} },
  { id: "dup", label: "Triple duplicate ACKs", losses: { 9: "triple-dup", 17: "triple-dup" } },
  { id: "timeout", label: "A timeout", losses: { 9: "triple-dup", 15: "timeout" } },
];

export function CongestionChart() {
  const [preset, setPreset] = useState("dup");
  const p = LOSS_PRESETS.find((x) => x.id === preset)!;
  const trace = renoTrace(24, p.losses, 16);
  const max = Math.max(...trace.map((t) => t.cwnd), 20);
  const W = 460;
  const H = 210;
  const X = (r: number) => 34 + (r / 23) * (W - 50);
  const Y = (v: number) => H - 28 - (v / max) * (H - 50);
  return (
    <Panel title="TCP's congestion window" legend={[["bg-sky", "cwnd (segments in flight)"], ["bg-orange", "ssthresh"], ["bg-neon", "loss detected"]]}>
      <div className="flex flex-wrap gap-2">
        {LOSS_PRESETS.map((x) => (
          <button key={x.id} type="button" className={`${chip} ${x.id === preset ? "bg-foreground text-background border-foreground" : ""}`} onClick={() => setPreset(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[540px] h-auto" role="img" aria-label="congestion window over time">
        {[0, 5, 10, 15, 20, 25].filter((v) => v <= max).map((v) => (
          <g key={v}>
            <line x1={34} x2={W - 12} y1={Y(v)} y2={Y(v)} className="stroke-border" strokeWidth={0.5} />
            <text x={28} y={Y(v) + 4} textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">{v}</text>
          </g>
        ))}
        <path d={trace.map((t, i) => `${i ? "L" : "M"}${X(t.round)},${Y(t.ssthresh)}`).join(" ")} fill="none" strokeDasharray="5 4" className="stroke-orange" strokeWidth={1.5} />
        <path d={trace.map((t, i) => `${i ? "L" : "M"}${X(t.round)},${Y(t.cwnd)}`).join(" ")} fill="none" className="stroke-sky" strokeWidth={2.5} />
        {trace.map((t) => (
          <circle key={t.round} cx={X(t.round)} cy={Y(t.cwnd)} r={t.event ? 6 : 3} className={t.event ? "fill-neon stroke-foreground" : "fill-sky"} />
        ))}
        <text x={W / 2} y={H - 4} textAnchor="middle" className="fill-muted-foreground font-mono text-[11px]">round trips</text>
      </svg>
      <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
        <li><b>Slow start</b> (rounds 0 to 4): cwnd doubles every round trip, 1, 2, 4, 8, 16, until it reaches ssthresh.</li>
        <li><b>Congestion avoidance</b>: then it grows by just 1 segment per round trip, probing gently for spare capacity.</li>
        {preset !== "none" && <li><b>Triple duplicate ACKs</b>: one segment was lost but later ones arrive, so the network is still working. cwnd and ssthresh drop to half: multiplicative decrease.</li>}
        {preset === "timeout" && <li><b>Timeout</b>: nothing came back at all, a sign of heavy congestion. cwnd falls to 1 and slow start begins again.</li>}
      </ul>
    </Panel>
  );
}

/* -------------------------------- DNS -------------------------------- */

const DNS_BOXES = ["your laptop", "recursive resolver", "root server", ".com TLD server", "decoded-demo.com server"];

export function DnsLookup() {
  const [cached, setCached] = useState(false);
  const frames = useMemo(() => dnsFrames(cached), [cached]);
  return (
    <Stepper
      title="Resolving www.decoded-demo.com"
      frames={frames}
      code={DNS_HOPS.map((h) => `${h.who} → ${h.to}: ${h.ask}`)}
      codeLabel="Messages"
      legend={[["bg-neon", "sending"], ["bg-sky", "receiving"]]}
      inputs={<Toggle<string> value={cached ? "c" : "n"} onChange={(v) => setCached(v === "c")} options={[["n", "Cold cache"], ["c", "Answer cached"]]} />}
      render={(s: DnsState) => {
        const hop = DNS_HOPS[s.step];
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {DNS_BOXES.map((b) => {
                const from = hop.who === b;
                const to = hop.to === b;
                return (
                  <div key={b} className={`rounded-sm border-2 px-2 py-2 text-center font-mono text-xs transition-colors duration-300 ${from ? "border-neon bg-neon/15" : to ? "border-sky bg-sky/15" : "border-border text-muted-foreground"}`}>
                    {b}
                  </div>
                );
              })}
            </div>
            <div className="font-mono text-sm">
              <span className="text-muted-foreground">{hop.who} → {hop.to}: </span>
              <b>{s.cached && s.step === 7 ? "203.0.113.10 (from cache)" : hop.ask}</b>
            </div>
          </div>
        );
      }}
    />
  );
}
