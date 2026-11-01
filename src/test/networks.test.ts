import { describe, expect, it } from "vitest";
import {
  encapsulationFrames,
  forwardingTable,
  formatSeconds,
  intToIp,
  ipToInt,
  linkStateFrames,
  longestPrefixMatch,
  parseCidr,
  propagationDelay,
  renoTrace,
  tcpFrames,
  transferTime,
  transmissionDelay,
  dnsFrames,
  type Link,
} from "@/lib/networks";

describe("encapsulation", () => {
  it("adds 58 bytes of headers to a 500-byte message and removes them again", () => {
    const fr = encapsulationFrames(500);
    expect(fr[4].stats.bytes).toBe(558);
    expect(fr.at(-1)!.stats.bytes).toBe(500);
  });
});

describe("delay", () => {
  it("computes transmission and propagation", () => {
    expect(transmissionDelay(1500 * 8, 100e6)).toBeCloseTo(0.00012, 10);
    expect(propagationDelay(2_000_000)).toBeCloseTo(0.01, 10);
    expect(transferTime(1e6, 1e9, 4e6).total).toBeCloseTo(0.008 + 0.04, 10);
    expect(formatSeconds(0.00012)).toBe("120 µs");
    expect(formatSeconds(0.048)).toBe("48 ms");
  });
});

describe("IPv4 subnets", () => {
  it("converts addresses", () => {
    expect(ipToInt("192.168.1.1")).toBe(3232235777);
    expect(intToIp(3232235777)).toBe("192.168.1.1");
    expect(() => ipToInt("300.1.1.1")).toThrow();
  });
  it("splits a /26", () => {
    const s = parseCidr("192.168.1.130/26");
    expect(intToIp(s.network)).toBe("192.168.1.128");
    expect(intToIp(s.broadcast)).toBe("192.168.1.191");
    expect(intToIp(s.mask)).toBe("255.255.255.192");
    expect(s.hosts).toBe(62);
  });
  it("handles the edges", () => {
    expect(parseCidr("10.0.0.0/8").hosts).toBe(16777214);
    expect(parseCidr("0.0.0.0/0").hosts).toBe(2 ** 32 - 2);
    expect(parseCidr("1.2.3.4/32").hosts).toBe(1);
    expect(parseCidr("1.2.3.4/31").hosts).toBe(2);
  });
  it("picks the longest matching prefix", () => {
    const table = [
      { cidr: "0.0.0.0/0", via: "ISP" },
      { cidr: "10.0.0.0/8", via: "A" },
      { cidr: "10.1.0.0/16", via: "B" },
      { cidr: "10.1.2.0/24", via: "C" },
    ];
    expect(longestPrefixMatch(table, "10.1.2.3").route?.via).toBe("C");
    expect(longestPrefixMatch(table, "10.1.9.9").route?.via).toBe("B");
    expect(longestPrefixMatch(table, "10.200.0.1").route?.via).toBe("A");
    expect(longestPrefixMatch(table, "8.8.8.8").route?.via).toBe("ISP");
    expect(longestPrefixMatch(table, "10.1.2.3").matches).toHaveLength(4);
  });
});

describe("link-state routing", () => {
  const nodes = ["A", "B", "C", "D", "E"];
  const links: Link[] = [["A", "B", 2], ["A", "C", 5], ["B", "C", 1], ["B", "D", 4], ["C", "D", 1], ["D", "E", 3], ["C", "E", 6]];
  it("finds shortest costs and next hops", () => {
    const last = linkStateFrames(nodes, links, "A").at(-1)!.state;
    expect(last.dist).toEqual({ A: 0, B: 2, C: 3, D: 4, E: 7 });
    expect(forwardingTable(last.prev, "A")).toEqual({ B: "B", C: "B", D: "B", E: "B" });
    const fromE = linkStateFrames(nodes, links, "E").at(-1)!.state;
    expect(forwardingTable(fromE.prev, "E")).toEqual({ A: "D", B: "D", C: "D", D: "D" });
  });
});

describe("TCP", () => {
  it("delivers everything in order, with or without the loss", () => {
    for (const lose of [false, true]) {
      const last = tcpFrames(lose).at(-1)!.state;
      expect(last.delivered).toBe("HELLO WORLD!");
      expect(last.clientState).toBe("CLOSED");
    }
    const lossy = tcpFrames(true).at(-1)!.state.events;
    expect(lossy.filter((e) => e.label.includes("dup"))).toHaveLength(2);
    expect(lossy.some((e) => e.label.includes("resent"))).toBe(true);
  });
});

describe("congestion control", () => {
  it("doubles, then adds one, then halves or resets", () => {
    const t = renoTrace(14, { 8: "triple-dup", 12: "timeout" }, 8);
    expect(t.map((p) => p.cwnd)).toEqual([1, 2, 4, 8, 9, 10, 11, 12, 13, 6, 7, 8, 9, 1]);
    expect(t[13].ssthresh).toBe(4);
    expect(t[0].phase).toBe("slow start");
    expect(t[5].phase).toBe("congestion avoidance");
  });
});

describe("DNS", () => {
  it("takes four round trips cold and one from the cache", () => {
    expect(dnsFrames(false).at(-1)!.stats["round trips"]).toBe(4);
    expect(dnsFrames(true)).toHaveLength(2);
  });
});
