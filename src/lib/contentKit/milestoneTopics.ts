import type { Topic, TopicSlides, Lang } from "./topics";
import { TIER_LABEL } from "@/lib/commission";
import type { NftTier } from "@/generated/prisma/client";

export type MilestoneKind = "tier-upgrade" | "referral-milestone";

export interface MilestoneData {
  tier?: NftTier;
  count?: number;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function tierUpgradeSlides(tierLabel: string, lang: Lang): TopicSlides {
  if (lang === "zh") {
    return [
      { eyebrow: "等级提升", headline: `我刚成为了${tierLabel}！`, keyPhrase: tierLabel, body: ["与AlphasAxis一起成长——加入我吧。"] },
      { eyebrow: "解锁了什么", headline: "更高等级，更深回报。", keyPhrase: "更深回报", body: ["解锁更深的平台生态系统权限。", "参与度越高，等级越高。", "会员权限随你的参与度同步扩展。"] },
      { eyebrow: "运作方式", headline: "会员体系随你成长。", keyPhrase: "随你成长", body: ["从AxisZero到AxisPrestige，四个等级。", "更高等级解锁更深权限。", "真实参与，真实成长。"] },
      { eyebrow: "加入我", headline: "扫码开启你自己的旅程。", keyPhrase: "你自己的旅程", body: ["仅供教育参考，不构成财务建议。"] },
    ];
  }
  if (lang === "bm") {
    return [
      { eyebrow: "Naik Peringkat", headline: `Saya baru sahaja menjadi ${tierLabel}!`, keyPhrase: tierLabel, body: ["Berkembang bersama AlphasAxis — sertai saya."] },
      { eyebrow: "Apa Yang Dibuka", headline: "Peringkat lebih tinggi, ganjaran lebih mendalam.", keyPhrase: "ganjaran lebih mendalam", body: ["Membuka akses ekosistem platform yang lebih mendalam.", "Lebih banyak penglibatan, peringkat lebih tinggi.", "Keahlian yang berkembang mengikut penglibatan anda."] },
      { eyebrow: "Cara Ia Berfungsi", headline: "Keahlian yang berkembang bersama anda.", keyPhrase: "berkembang bersama anda", body: ["AxisZero hingga AxisPrestige, empat peringkat.", "Peringkat lebih tinggi membuka lebih banyak akses.", "Penglibatan sebenar, pertumbuhan sebenar."] },
      { eyebrow: "Sertai Saya", headline: "Imbas untuk mula perjalanan anda sendiri.", keyPhrase: "perjalanan anda sendiri", body: ["Bersifat pendidikan. Bukan nasihat kewangan."] },
    ];
  }
  return [
    { eyebrow: "Just Leveled Up", headline: `I just became an ${tierLabel}!`, keyPhrase: tierLabel, body: ["Growing with AlphasAxis — join me."] },
    { eyebrow: "What This Unlocks", headline: "Higher tier, deeper rewards.", keyPhrase: "deeper rewards", body: ["Unlocks deeper platform ecosystem access.", "More involvement, higher tier.", "Membership that scales with your involvement."] },
    { eyebrow: "How It Works", headline: "Membership that grows with you.", keyPhrase: "grows with you", body: ["AxisZero to AxisPrestige — four tiers.", "Higher tiers unlock deeper access.", "Real involvement, real growth."] },
    { eyebrow: "Join Me", headline: "Scan to start your own journey.", keyPhrase: "your own journey", body: ["Educational. Not financial advice."] },
  ];
}

function referralMilestoneSlides(count: number, lang: Lang): TopicSlides {
  const ord = ordinal(count);
  if (lang === "zh") {
    return [
      { eyebrow: "达成里程碑", headline: `我刚推荐了第${count}位朋友！`, keyPhrase: `第${count}位朋友`, body: ["与我一起壮大AlphasAxis社区。"] },
      { eyebrow: "为什么分享", headline: "真实推荐，真实回报。", keyPhrase: "真实回报", body: ["每一次推荐都能赚取积分。", "没有隐藏条件，没有空头支票。", "透明的推荐奖励系统。"] },
      { eyebrow: "运作方式", headline: "每一次推荐都让你赚得更多。", keyPhrase: "赚得更多", body: ["分享你的专属推荐链接。", "好友加入后，你即可赚取奖励。", "达成里程碑可解锁额外$AXIS奖励。"] },
      { eyebrow: "轮到你了", headline: "扫码加入我的网络。", keyPhrase: "加入我的网络", body: ["仅供教育参考，不构成财务建议。"] },
    ];
  }
  if (lang === "bm") {
    return [
      { eyebrow: "Pencapaian Dicapai", headline: `Saya baru sahaja merujuk rakan ${ord} saya!`, keyPhrase: `rakan ${ord} saya`, body: ["Membesarkan komuniti AlphasAxis bersama-sama."] },
      { eyebrow: "Kenapa Saya Kongsi", headline: "Rujukan sebenar, ganjaran sebenar.", keyPhrase: "ganjaran sebenar", body: ["Setiap rujukan memberi anda mata.", "Tiada syarat tersembunyi, tiada janji kosong.", "Sistem ganjaran rujukan yang telus."] },
      { eyebrow: "Cara Ia Berfungsi", headline: "Setiap rujukan memberi anda lebih banyak.", keyPhrase: "lebih banyak", body: ["Kongsi pautan rujukan unik anda.", "Rakan menyertai, anda peroleh ganjaran.", "Capai pencapaian untuk buka ganjaran $AXIS tambahan."] },
      { eyebrow: "Giliran Anda", headline: "Imbas untuk sertai rangkaian saya.", keyPhrase: "rangkaian saya", body: ["Bersifat pendidikan. Bukan nasihat kewangan."] },
    ];
  }
  return [
    { eyebrow: "Milestone Reached", headline: `I just referred my ${ord} friend!`, keyPhrase: `${ord} friend`, body: ["Growing the AlphasAxis community together."] },
    { eyebrow: "Why I'm Sharing", headline: "Real referrals, real rewards.", keyPhrase: "real rewards", body: ["Every referral earns you points.", "No hidden terms, no empty promises.", "A transparent referral rewards system."] },
    { eyebrow: "How It Works", headline: "Every referral earns you more.", keyPhrase: "earns you more", body: ["Share your own referral link.", "Friends join, you earn rewards.", "Hit milestones to unlock extra $AXIS."] },
    { eyebrow: "Your Turn", headline: "Scan to join my network.", keyPhrase: "join my network", body: ["Educational. Not financial advice."] },
  ];
}

/** Builds a one-off Topic at runtime for a real milestone event — CarouselKit treats it like any static topic. */
export function buildMilestoneTopic(kind: MilestoneKind, data: MilestoneData): Topic {
  const langs: Lang[] = ["en", "zh", "bm"];

  if (kind === "tier-upgrade") {
    const tier = data.tier ?? "AXIS_ONE";
    const tierLabel = TIER_LABEL[tier];
    return {
      slug: `milestone-tier-${tier.toLowerCase()}`,
      label: `${tierLabel} Upgrade`,
      handle: "@alphasaxis",
      slidesByLang: Object.fromEntries(langs.map((l) => [l, tierUpgradeSlides(tierLabel, l)])) as Topic["slidesByLang"],
    };
  }

  const count = data.count ?? 1;
  return {
    slug: `milestone-referral-${count}`,
    label: `${ordinal(count)} Referral`,
    handle: "@alphasaxis",
    slidesByLang: Object.fromEntries(langs.map((l) => [l, referralMilestoneSlides(count, l)])) as Topic["slidesByLang"],
  };
}
