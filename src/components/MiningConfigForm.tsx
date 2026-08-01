"use client";

import { useActionState } from "react";
import { updateMiningConfig } from "@/app/actions/admin";

export interface MiningConfigValues {
  petrolSubsidyRate: number;
  fxRateRmPerUsd: number;
  halvingMilestoneMiners: number;
  mpmBonusPerTierWeight: number;
  mpmCap: number;
  adsDepositRate: number;
  mintBurnShare: number;
  mintReserveShare: number;
  lockSixMonthPayoutPct: number;
  lockOneYearPayoutPct: number;
  lockTwoYearPayoutPct: number;
  lockThreeYearPayoutPct: number;
  advancedKycQuotaBoost: number;
  advancedKycEarnBoost: number;
}

function PercentField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue: number; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="number"
        step="0.1"
        min="0"
        max="100"
        defaultValue={(defaultValue * 100).toString()}
        required
      />
      {hint && <p className="p-note !mb-0">{hint}</p>}
    </div>
  );
}

/** Multiplier fields (e.g. 1.5x = "+50%"), distinct from PercentField's plain 0-1 fraction fields above. */
function BoostField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue: number; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="number"
        step="1"
        min="0"
        defaultValue={((defaultValue - 1) * 100).toString()}
        required
      />
      {hint && <p className="p-note !mb-0">{hint}</p>}
    </div>
  );
}

export function MiningConfigForm({ config }: { config: MiningConfigValues }) {
  const [state, action, pending] = useActionState(updateMiningConfig, undefined);

  return (
    <form action={action} className="card">
      <p className="row-title mb-1">Economy settings</p>
      <p className="p-note mb-2">
        Every tunable number in the Agent2Mine economy — changes only apply going forward, never rewriting past
        ledger entries or vesting schedules.
      </p>

      <p className="eyebrow mb-1">External / policy-linked</p>
      <PercentField
        name="petrolSubsidyRate"
        label="Government petrol subsidy rate (%)"
        defaultValue={config.petrolSubsidyRate}
        hint="Changes by government policy announcement."
      />
      <div className="field">
        <label htmlFor="fxRateRmPerUsd">FX rate (RM per USD)</label>
        <input
          id="fxRateRmPerUsd"
          name="fxRateRmPerUsd"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={config.fxRateRmPerUsd}
          required
        />
      </div>

      <p className="eyebrow mb-1 mt-2">Emission &amp; halving</p>
      <div className="field">
        <label htmlFor="halvingMilestoneMiners">Halving milestone (cumulative miners)</label>
        <input
          id="halvingMilestoneMiners"
          name="halvingMilestoneMiners"
          type="number"
          step="1"
          min="1"
          defaultValue={config.halvingMilestoneMiners}
          required
        />
        <p className="p-note !mb-0">Emission budget halves every time this many net-new miners join.</p>
      </div>

      <p className="eyebrow mb-1 mt-2">Mining Power Multiplier</p>
      <PercentField
        name="mpmBonusPerTierWeight"
        label="Bonus per active referral tier-weight (%)"
        defaultValue={config.mpmBonusPerTierWeight}
      />
      <PercentField name="mpmCap" label="Maximum MPM bonus (%)" defaultValue={config.mpmCap} />

      <p className="eyebrow mb-1 mt-2">Spend-to-Earn</p>
      <PercentField
        name="adsDepositRate"
        label="Ads deposit rate (% of verified ad spend)"
        defaultValue={config.adsDepositRate}
      />

      <p className="eyebrow mb-1 mt-2">Mint-cycling split</p>
      <PercentField name="mintBurnShare" label="Burned forever (%)" defaultValue={config.mintBurnShare} />
      <PercentField name="mintReserveShare" label="Liquidity reserve (%)" defaultValue={config.mintReserveShare} />

      <p className="eyebrow mb-1 mt-2">Vesting-lock payout %</p>
      <PercentField name="lockSixMonthPayoutPct" label="6 months (%)" defaultValue={config.lockSixMonthPayoutPct} />
      <PercentField name="lockOneYearPayoutPct" label="1 year (%)" defaultValue={config.lockOneYearPayoutPct} />
      <PercentField name="lockTwoYearPayoutPct" label="2 years (%)" defaultValue={config.lockTwoYearPayoutPct} />
      <PercentField name="lockThreeYearPayoutPct" label="3 years (%)" defaultValue={config.lockThreeYearPayoutPct} />

      <p className="eyebrow mb-1 mt-2">Advanced KYC benefits</p>
      <BoostField
        name="advancedKycQuotaBoost"
        label="Deposit quota boost (%)"
        defaultValue={config.advancedKycQuotaBoost}
        hint="Extra Spend-to-Earn deposit quota on top of the base tier, e.g. 50 = +50%."
      />
      <BoostField
        name="advancedKycEarnBoost"
        label="$AXIS earn-rate boost (%)"
        defaultValue={config.advancedKycEarnBoost}
        hint="Extra $AXIS mined per task on top of the base tier."
      />

      {state?.error && <p className="mb-2 text-[11px] font-semibold text-red-400">{state.error}</p>}
      <button className="btn secondary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
