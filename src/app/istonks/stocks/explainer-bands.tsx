import { MessageSquare, Percent, Scale, ShieldAlert, Wallet } from "lucide-react";

import { SectionLabel } from "@/components/dashboard/primitives";
import { MockThread } from "@/components/istonks/mock-thread";
import { FEE_SPLIT } from "@/lib/istonks";
import { cn } from "@/lib/utils";

function Band({
  label,
  title,
  icon: Icon,
  children,
  className,
}: {
  label: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card/70 p-6 backdrop-blur-sm sm:p-8",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <SectionLabel>{label}</SectionLabel>
      </div>
      <h3 className="mt-2 max-w-2xl font-display text-xl font-semibold tracking-tight">
        {title}
      </h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl space-y-3 text-[13px] leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

function Figure({ value, caption }: { value: string; caption: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 px-4 py-3">
      <div className="font-mono text-2xl font-semibold leading-none tracking-tight text-primary tabular-nums">
        {value}
      </div>
      <div className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{caption}</div>
    </div>
  );
}

export function ExplainerBands() {
  return (
    <div className="space-y-3">
      <Band label="how it works" title="Launch by text" icon={MessageSquare}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <Prose>
            <p>
              There is no launch form. You text the agent the name of the token and the stock you
              want it priced against, and it does the rest — resolves the tokenized stock, builds
              the pool, sets the fee split, and hands you a transaction to sign from your own
              wallet.
            </p>
            <p>
              The agent never holds your keys. Every launch is signed by you, from the embedded
              wallet tied to your account, and paid for with your own ETH on Base.
            </p>
          </Prose>
          <MockThread />
        </div>
      </Band>

      <Band
        label="the trick"
        title="Why you don't need to own the stock"
        icon={Wallet}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <Prose>
            <p>
              A normal launch means putting up capital on both sides of the pool. Here you don&apos;t.
              Roughly 90% of your token&apos;s supply goes into the pool as the only starting
              liquidity, and zero of the tokenized stock is seeded.
            </p>
            <p>
              The stock is the numeraire, not the reserve. It sets the price the curve quotes
              against; it isn&apos;t something you have to buy first. So a launch priced against
              tokenized Apple costs you gas, not a share of Apple.
            </p>
            <p>
              The first buyers bring the stock side in. That&apos;s what makes launching by text
              possible from a wallet holding nothing but gas money.
            </p>
          </Prose>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
            <Figure value="90%" caption="of token supply seeded into the pool at launch" />
            <Figure value="0" caption="tokenized stock required from the launcher" />
          </div>
        </div>
      </Band>

      <Band label="economics" title="Where the fees go" icon={Percent}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <Prose>
            <p>
              Trading fees on the pool are split four ways, and the split is written into the pool
              at launch — nobody can change it afterwards, including us.
            </p>
            <p>
              The launcher&apos;s share accrues to the wallet that signed the launch. Claim it any
              time from the Fees page.
            </p>
          </Prose>
          <div className="w-full lg:w-[360px]">
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {FEE_SPLIT.map((slice, i) => (
                <div
                  key={slice.label}
                  style={{ width: `${slice.percent}%` }}
                  className={
                    ["bg-primary", "bg-cyan", "bg-violet", "bg-amber"][i] ?? "bg-primary"
                  }
                />
              ))}
            </div>
            <dl className="mt-4 space-y-2">
              {FEE_SPLIT.map((slice, i) => (
                <div
                  key={slice.label}
                  className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2 last:border-0"
                >
                  <dt className="flex items-center gap-2 text-[12px] text-foreground">
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        ["bg-primary", "bg-cyan", "bg-violet", "bg-amber"][i] ?? "bg-primary",
                      )}
                    />
                    {slice.label}
                    <span className="text-[11px] text-muted-foreground">{slice.note}</span>
                  </dt>
                  <dd className="shrink-0 font-mono text-[13px] font-medium tabular-nums">
                    {slice.percent}%
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Band>

      <Band label="corporate actions" title="What happens on a split" icon={Scale}>
        <Prose>
          <p>
            Tokenized stocks handle splits with a multiplier on the token, not by minting or
            burning balances. That multiplier is a display-and-redemption concept: it changes what
            one token represents when you look at it or redeem it, and nothing else.
          </p>
          <p>
            The Chainlink feed behind each stock is already a total-return feed — it accounts for
            splits and distributions on its own. Applying the multiplier on top of it would double
            count the adjustment, so the pool never does.
          </p>
          <p>
            Net effect: a split moves the numbers you read on Coinbase&apos;s side, and the pool
            stays stable. No re-pricing event, no forced migration, no action needed from a
            launcher or a holder.
          </p>
        </Prose>
      </Band>

      <Band
        label="eligibility"
        title="Regulation S, plainly"
        icon={ShieldAlert}
        className="border-primary/25 bg-primary/[0.03]"
      >
        <Prose>
          <p>
            Coinbase&apos;s tokenized stocks are offered under Regulation S. They are available
            only to eligible non-US persons. If that isn&apos;t you, the stock side of this is not
            available to you, and you should not attempt to access it.
          </p>
          <p>
            An iStonks token is not the stock. It&apos;s a community-launched token that happens to
            be priced against one. It carries no equity, no shareholder rights, and no claim on any
            company or on any tokenized stock held by anyone else.
          </p>
          <p className="text-foreground">
            None of this is investment advice, and none of it is an offer or solicitation. Confirm
            your own eligibility before you do anything here.
          </p>
        </Prose>
      </Band>
    </div>
  );
}
