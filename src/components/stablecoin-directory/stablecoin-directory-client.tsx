"use client";

import Link from "next/link";

import type { StablecoinDirectoryRow, StablecoinDirectoryView } from "@/lib/stablecoin-directory-shared";
import { groupRowsByRegion, regionSubtitle } from "@/lib/stablecoin-directory-shared";

import "./directory.css";

function baseDotClass(status: string): string {
  if (/BASE ✓|NATIVE ✓|ACTIVE/i.test(status)) return "dot dg";
  if (/LAUNCHING/i.test(status)) return "dot da";
  return "dot dr";
}

function loiPriClass(tier: string): string {
  const t = tier.toUpperCase();
  if (t.includes("TOP 1")) return "pri p1";
  if (t.includes("TIER 2")) return "pri p2";
  if (t.includes("TIER 3")) return "pri p3";
  return "pri pw";
}

function DirectoryTable({
  rows,
  countryHeader = "Country",
}: {
  rows: StablecoinDirectoryRow[];
  countryHeader?: string;
}) {
  return (
    <div className="tw">
      <table>
        <thead>
          <tr>
            <th />
            <th>{countryHeader}</th>
            <th>Ticker</th>
            <th>Issuer</th>
            <th>Founder / CEO</th>
            <th>Twitter / X</th>
            <th>Contact</th>
            <th>Base</th>
            <th>LOI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const dim = !row.confirmedOnBase;
            const founderHandle = row.founderTwitter || row.twitter;
            return (
              <tr key={row.rowSlug} className={dim ? "dim" : undefined}>
                <td>
                  {row.flag ? <span className="flag">{row.flag}</span> : null}
                </td>
                <td>
                  <span className="cn">{row.country}</span>
                  {row.currency ? <span className="cc">{row.currency}</span> : null}
                </td>
                <td className="tok">{row.ticker}</td>
                <td className="iss">{row.issuer}</td>
                <td>
                  {row.founder ? <span className="ceo">{row.founder}</span> : null}
                  {founderHandle ? <span className="tw-h">{founderHandle}</span> : null}
                </td>
                <td>
                  {row.twitter ? <span className="tw-h">{row.twitter}</span> : null}
                </td>
                <td className="em">{row.contact}</td>
                <td>
                  {row.baseStatus ? (
                    <span className={baseDotClass(row.baseStatus)}>{row.baseStatus}</span>
                  ) : null}
                </td>
                <td>
                  {row.loiTier ? <span className={loiPriClass(row.loiTier)}>{row.loiTier}</span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function StablecoinDirectoryClient({
  view,
  narrativeHtml,
}: {
  view: StablecoinDirectoryView;
  narrativeHtml: string;
}) {
  const groups = groupRowsByRegion(view.rows);
  const loiStat = `${view.loiSignedCount}→${view.loiTarget}`;

  return (
    <div className="page">
      <div className="hdr">
        <div className="eye">
          <div className="eye-dot" />
          Stablemate Partnerships · Global Stablecoin Directory · Notion-synced
        </div>
        <h1>
          Every Country.
          <br />
          One Stablecoin.
          <br />
          On Base.
        </h1>
        <p className="sub">
          The Stablemate model: each country gets a phone number. That phone number runs on the
          local-currency stablecoin deployed on Base. Edit issuer pipeline stages in Notion → sync →
          this directory updates.
        </p>
        <div className="pills">
          <span className="pill pb">20+ confirmed on Base</span>
          <span className="pill pb">16+ country currencies live</span>
          <span className="pill pg">B20 standard active Jul 2026</span>
          <span className="pill pa">Base goal: every currency</span>
          <span className="pill pm">
            {view.loiSignedCount} LOIs signed — target: {view.loiTarget} this raise
          </span>
        </div>
        <p className="sub" style={{ marginTop: 16, marginBottom: 0 }}>
          <Link href="/data-room" className="tw-h">
            Investment pipeline (VC) → data room ↗
          </Link>
          {" · "}
          <span style={{ color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 11 }}>
            Issuer LOIs: {view.loiSignedCount}/{view.loiTarget}
            {view.source === "postgres" ? " · live from Notion" : " · fallback snapshot"}
          </span>
        </p>
      </div>

      <div className="stats">
        <div className="scard">
          <div className="sn">20+</div>
          <div className="sl">On Base now</div>
        </div>
        <div className="scard">
          <div className="sn">16+</div>
          <div className="sl">Currencies live</div>
        </div>
        <div className="scard">
          <div className="sn">$17T</div>
          <div className="sl">Base stablecoin vol 2026</div>
        </div>
        <div className="scard">
          <div className="sn">$800B</div>
          <div className="sl">Global remittance / yr</div>
        </div>
        <div className="scard">
          <div className="sn">{loiStat}</div>
          <div className="sl">LOI target this raise</div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-hdr">
          <span className="sec-n">01</span>
          <h2 className="sec-t">Confirmed on Base — Country by Country</h2>
          <div className="sec-r" />
        </div>

        <div className="callout">
          <div className="clbl">Source: Base (@base on X, Aug 2026) + BaseScan + DeFiLlama + CoinGecko</div>
          <div className="ctxt">
            Base officially confirmed 20+ stablecoins across global currencies.{" "}
            <strong>Every full-opacity row is confirmed on-chain. Dimmed rows are lobby targets.</strong>
          </div>
        </div>

        {groups.map(({ region, rows }) => (
          <div key={region}>
            <div className="rg">
              <span className="rg-l">{region}</span>
              <div className="rg-r" />
              <span className="rg-n">{regionSubtitle(region, view.rows)}</span>
            </div>
            <DirectoryTable
              rows={rows}
              countryHeader={region === "Global USD" ? "Asset" : "Country"}
            />
          </div>
        ))}

        <p className="ctxt" style={{ marginTop: 12 }}>
          Full rows = confirmed on Base. Dimmed rows = stablecoin exists but not yet on Base — lobby
          targets.
        </p>
      </div>

      <div dangerouslySetInnerHTML={{ __html: narrativeHtml }} />

      <div className="ftr">
        <div>
          <div className="fb">Stablemate</div>
          <div className="fs">mateo@basemate.app · Base Batches 002 · money in chat</div>
        </div>
        <div className="fsrc">
          Issuer pipeline: Notion → sync · VC pipeline:{" "}
          <Link href="/data-room" style={{ color: "inherit" }}>
            /data-room
          </Link>
          <br />
          Sources: @base on X · basescan.org · DeFiLlama · CoinGecko
        </div>
      </div>
    </div>
  );
}
