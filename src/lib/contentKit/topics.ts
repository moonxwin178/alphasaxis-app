export type { Lang } from "./canvasCore";
import type { Lang } from "./canvasCore";

export interface SlideContent {
  eyebrow: string;
  headline: string;
  /** The exact substring of `headline` to render with the gold gradient. Must appear verbatim in `headline`. */
  keyPhrase: string;
  /** Bullets for content slides, or a single sub-line for the cover/CTA. */
  body: string[];
}

export type TopicSlides = [SlideContent, SlideContent, SlideContent, SlideContent];

export interface Topic {
  slug: string;
  label: string;
  handle: string;
  slidesByLang: Record<Lang, TopicSlides>;
}

export const AXISPRESTIGE_TOPIC: Topic = {
  slug: "axisprestige",
  label: "AxisPrestige",
  handle: "@alphasaxis",
  slidesByLang: {
    en: [
      {
        eyebrow: "Founding Membership",
        headline: "Own a piece of AlphasAxis from day one.",
        keyPhrase: "AlphasAxis",
        body: ["AxisPrestige — the founding node of the AlphasAxis ecosystem."],
      },
      {
        eyebrow: "The Gap",
        headline: "Most platforms reward users last.",
        keyPhrase: "users last",
        body: [
          "Early builders rarely share in the upside.",
          "Loyalty gets a badge, not a stake.",
          "By the time you can buy in, the best terms are gone.",
        ],
      },
      {
        eyebrow: "What AxisPrestige Is",
        headline: "A founding-tier membership, not a promise.",
        keyPhrase: "founding-tier",
        body: [
          "Access to platform ecosystem rewards.",
          "Distributed quarterly from real platform activity.",
          "5,000 nodes total — once minted, this tier closes.",
        ],
      },
      {
        eyebrow: "Get Started",
        headline: "Scan to explore AxisPrestige.",
        keyPhrase: "AxisPrestige",
        body: ["Educational. Not financial advice."],
      },
    ],
    zh: [
      {
        eyebrow: "创始会员",
        headline: "从第一天起，成为AlphasAxis的一份子。",
        keyPhrase: "AlphasAxis",
        body: ["AxisPrestige——AlphasAxis生态系统的创始节点。"],
      },
      {
        eyebrow: "行业缺口",
        headline: "大多数平台最后才奖励用户。",
        keyPhrase: "最后才奖励用户",
        body: ["早期建设者很少能分享后期的收益。", "忠诚换来的是徽章，而不是股权。", "等你能买入时，最好的条件早已错过。"],
      },
      {
        eyebrow: "AxisPrestige 是什么",
        headline: "创始级会员资格，而非空头承诺。",
        keyPhrase: "创始级会员资格",
        body: ["获得平台生态系统奖励的资格。", "每季度根据真实平台活动进行分配。", "总量5,000个节点——铸造完毕，该等级即关闭。"],
      },
      {
        eyebrow: "立即开始",
        headline: "扫码探索AxisPrestige。",
        keyPhrase: "AxisPrestige",
        body: ["仅供教育参考，不构成财务建议。"],
      },
    ],
    bm: [
      {
        eyebrow: "Keahlian Pengasas",
        headline: "Miliki sebahagian AlphasAxis sejak hari pertama.",
        keyPhrase: "AlphasAxis",
        body: ["AxisPrestige — nod pengasas ekosistem AlphasAxis."],
      },
      {
        eyebrow: "Jurang Yang Wujud",
        headline: "Kebanyakan platform memberi ganjaran kepada pengguna paling akhir.",
        keyPhrase: "pengguna paling akhir",
        body: [
          "Pembina awal jarang berkongsi hasil kejayaan.",
          "Kesetiaan cuma dapat lencana, bukan saham.",
          "Apabila anda boleh menyertai, syarat terbaik sudah tiada.",
        ],
      },
      {
        eyebrow: "Apa Itu AxisPrestige",
        headline: "Keahlian peringkat pengasas, bukan janji kosong.",
        keyPhrase: "peringkat pengasas",
        body: [
          "Akses kepada ganjaran ekosistem platform.",
          "Diagihkan setiap suku tahun daripada aktiviti platform sebenar.",
          "Jumlah 5,000 nod — sebaik sahaja ditempa, peringkat ini ditutup.",
        ],
      },
      {
        eyebrow: "Mulakan Sekarang",
        headline: "Imbas untuk terokai AxisPrestige.",
        keyPhrase: "AxisPrestige",
        body: ["Bersifat pendidikan. Bukan nasihat kewangan."],
      },
    ],
  },
};

export const AXIS_TOKEN_TOPIC: Topic = {
  slug: "axis-token",
  label: "$AXIS Token",
  handle: "@alphasaxis",
  slidesByLang: {
    en: [
      {
        eyebrow: "The Utility Token",
        headline: "Real revenue backs the $AXIS token.",
        keyPhrase: "$AXIS token",
        body: ["Not a speculative coin — a utility token tied to an actual brokerage business."],
      },
      {
        eyebrow: "The Problem With Most Tokens",
        headline: "Most tokens launch before there's a business.",
        keyPhrase: "before there's a business",
        body: [
          "Price charts with nothing behind them.",
          "Utility promised, rarely delivered.",
          "Value dependent entirely on new buyers.",
        ],
      },
      {
        eyebrow: "What $AXIS Is",
        headline: "A utility token for a real ecosystem.",
        keyPhrase: "real ecosystem",
        body: [
          "Powers rewards across the AlphasAxis platform.",
          "Earned through real activity — cases, referrals, engagement.",
          "Backed by an operating brokerage business.",
        ],
      },
      {
        eyebrow: "Learn More",
        headline: "Scan to understand $AXIS.",
        keyPhrase: "$AXIS",
        body: ["Educational. Not financial advice."],
      },
    ],
    zh: [
      {
        eyebrow: "实用型代币",
        headline: "真实收入支撑$AXIS代币。",
        keyPhrase: "$AXIS代币",
        body: ["并非投机币——而是与真实经纪业务挂钩的实用型代币。"],
      },
      {
        eyebrow: "多数代币的通病",
        headline: "多数代币在业务成形前就已上线。",
        keyPhrase: "业务成形前就已上线",
        body: ["只有价格图表，背后空无一物。", "承诺的实用性，很少真正兑现。", "价值完全依赖新买家接盘。"],
      },
      {
        eyebrow: "$AXIS 是什么",
        headline: "服务于真实生态系统的实用型代币。",
        keyPhrase: "真实生态系统",
        body: ["为AlphasAxis平台各项奖励提供动力。", "通过真实活动赚取——案件、推荐、互动。", "由持续运营的经纪业务提供支撑。"],
      },
      {
        eyebrow: "了解更多",
        headline: "扫码了解$AXIS。",
        keyPhrase: "$AXIS",
        body: ["仅供教育参考，不构成财务建议。"],
      },
    ],
    bm: [
      {
        eyebrow: "Token Utiliti",
        headline: "Hasil sebenar menyokong token $AXIS.",
        keyPhrase: "token $AXIS",
        body: ["Bukan token spekulatif — token utiliti yang terikat dengan perniagaan pembrokeran sebenar."],
      },
      {
        eyebrow: "Masalah Kebanyakan Token",
        headline: "Kebanyakan token dilancarkan sebelum ada perniagaan.",
        keyPhrase: "sebelum ada perniagaan",
        body: [
          "Carta harga tanpa sebarang sokongan di sebaliknya.",
          "Utiliti dijanjikan, jarang direalisasikan.",
          "Nilai bergantung sepenuhnya kepada pembeli baharu.",
        ],
      },
      {
        eyebrow: "Apa Itu $AXIS",
        headline: "Token utiliti untuk ekosistem sebenar.",
        keyPhrase: "ekosistem sebenar",
        body: [
          "Menggerakkan ganjaran di seluruh platform AlphasAxis.",
          "Diperoleh melalui aktiviti sebenar — kes, rujukan, penglibatan.",
          "Disokong oleh perniagaan pembrokeran yang beroperasi.",
        ],
      },
      {
        eyebrow: "Ketahui Lebih Lanjut",
        headline: "Imbas untuk fahami $AXIS.",
        keyPhrase: "$AXIS",
        body: ["Bersifat pendidikan. Bukan nasihat kewangan."],
      },
    ],
  },
};

export const MEMBERSHIP_TOPIC: Topic = {
  slug: "membership",
  label: "Membership Tiers",
  handle: "@alphasaxis",
  slidesByLang: {
    en: [
      {
        eyebrow: "Membership Tiers",
        headline: "Four tiers. One growing ecosystem.",
        keyPhrase: "One growing ecosystem",
        body: ["AxisZero to AxisPrestige — access that scales with your involvement."],
      },
      {
        eyebrow: "One Size Doesn't Fit All",
        headline: "Most platforms treat everyone the same.",
        keyPhrase: "treat everyone the same",
        body: [
          "New members and power users get identical access.",
          "No path to grow your standing over time.",
          "Engagement isn't recognized or rewarded.",
        ],
      },
      {
        eyebrow: "How Tiers Work",
        headline: "Four tiers, each unlocking more.",
        keyPhrase: "each unlocking more",
        body: [
          "AxisZero, AxisOne, AxisPro, AxisPrestige.",
          "Higher tiers unlock deeper ecosystem access.",
          "Your tier reflects your involvement in the platform.",
        ],
      },
      {
        eyebrow: "Find Your Tier",
        headline: "Scan to see where you fit.",
        keyPhrase: "where you fit",
        body: ["Educational. Not financial advice."],
      },
    ],
    zh: [
      {
        eyebrow: "会员等级",
        headline: "四个等级，一个不断成长的生态系统。",
        keyPhrase: "一个不断成长的生态系统",
        body: ["从AxisZero到AxisPrestige——权限随你的参与度同步提升。"],
      },
      {
        eyebrow: "一刀切并不合理",
        headline: "大多数平台对所有人一视同仁。",
        keyPhrase: "对所有人一视同仁",
        body: ["新会员和资深用户拥有完全相同的权限。", "没有随时间提升地位的路径。", "参与度得不到认可，也没有回报。"],
      },
      {
        eyebrow: "等级如何运作",
        headline: "四个等级，层层解锁更多权益。",
        keyPhrase: "层层解锁更多权益",
        body: ["AxisZero、AxisOne、AxisPro、AxisPrestige。", "等级越高，解锁的生态系统权限越深。", "你的等级反映你在平台上的参与程度。"],
      },
      {
        eyebrow: "找到你的等级",
        headline: "扫码看看你适合哪个等级。",
        keyPhrase: "你适合哪个等级",
        body: ["仅供教育参考，不构成财务建议。"],
      },
    ],
    bm: [
      {
        eyebrow: "Peringkat Keahlian",
        headline: "Empat peringkat. Satu ekosistem yang berkembang.",
        keyPhrase: "Satu ekosistem yang berkembang",
        body: ["AxisZero hingga AxisPrestige — akses yang berkembang mengikut penglibatan anda."],
      },
      {
        eyebrow: "Satu Saiz Tidak Sesuai Untuk Semua",
        headline: "Kebanyakan platform melayan semua orang sama rata.",
        keyPhrase: "melayan semua orang sama rata",
        body: [
          "Ahli baharu dan pengguna aktif mendapat akses yang sama.",
          "Tiada laluan untuk meningkatkan kedudukan dari semasa ke semasa.",
          "Penglibatan tidak diiktiraf atau diberi ganjaran.",
        ],
      },
      {
        eyebrow: "Cara Peringkat Berfungsi",
        headline: "Empat peringkat, setiap satu membuka lebih banyak.",
        keyPhrase: "membuka lebih banyak",
        body: [
          "AxisZero, AxisOne, AxisPro, AxisPrestige.",
          "Peringkat lebih tinggi membuka akses ekosistem yang lebih mendalam.",
          "Peringkat anda mencerminkan penglibatan anda dalam platform.",
        ],
      },
      {
        eyebrow: "Cari Peringkat Anda",
        headline: "Imbas untuk lihat di mana anda berada.",
        keyPhrase: "di mana anda berada",
        body: ["Bersifat pendidikan. Bukan nasihat kewangan."],
      },
    ],
  },
};

export const EARN_TOPIC: Topic = {
  slug: "earn",
  label: "Earn Tasks",
  handle: "@alphasaxis",
  slidesByLang: {
    en: [
      {
        eyebrow: "Earn On AlphasAxis",
        headline: "Turn 5 minutes into real rewards.",
        keyPhrase: "real rewards",
        body: ["Spend, submit, refer, share — every action earns you points on AlphasAxis."],
      },
      {
        eyebrow: "Most Apps Give You Nothing",
        headline: "Most apps take your time for free.",
        keyPhrase: "for free",
        body: [
          "Scrolling, sharing, referring — normally unpaid.",
          "Your attention has value. Most platforms just keep it.",
          "AlphasAxis pays you back for showing up.",
        ],
      },
      {
        eyebrow: "Four Ways To Earn",
        headline: "Four simple ways to start earning.",
        keyPhrase: "start earning",
        body: [
          "Spend-to-Earn — upload receipts from partner brands.",
          "Submit-to-Earn — complete simple case milestones.",
          "Network & Social — invite friends, follow, engage.",
        ],
      },
      {
        eyebrow: "Start Today",
        headline: "Scan and start earning now.",
        keyPhrase: "earning now",
        body: ["Educational. Not financial advice."],
      },
    ],
    zh: [
      {
        eyebrow: "在AlphasAxis赚取",
        headline: "5分钟，换来真实回报。",
        keyPhrase: "真实回报",
        body: ["消费、提交、推荐、分享——在AlphasAxis上，每个动作都能为你赚取积分。"],
      },
      {
        eyebrow: "多数App什么都不给你",
        headline: "多数App白白占用你的时间。",
        keyPhrase: "白白占用你的时间",
        body: ["刷屏、分享、推荐——通常都是无偿的。", "你的注意力有价值，多数平台却只是索取。", "AlphasAxis为你的每一次参与买单。"],
      },
      {
        eyebrow: "四种赚取方式",
        headline: "四种简单方式，开启赚取之旅。",
        keyPhrase: "开启赚取之旅",
        body: ["消费赚积分——上传合作品牌的消费凭证。", "任务赚积分——完成简单的案件里程碑。", "社交与网络——邀请好友、关注、互动。"],
      },
      {
        eyebrow: "今天就开始",
        headline: "扫码，立即开始赚取。",
        keyPhrase: "立即开始赚取",
        body: ["仅供教育参考，不构成财务建议。"],
      },
    ],
    bm: [
      {
        eyebrow: "Peroleh Ganjaran di AlphasAxis",
        headline: "Jadikan 5 minit ganjaran sebenar.",
        keyPhrase: "ganjaran sebenar",
        body: ["Belanja, hantar, rujuk, kongsi — setiap tindakan memberi anda mata di AlphasAxis."],
      },
      {
        eyebrow: "Kebanyakan Apl Tak Bagi Apa-apa",
        headline: "Kebanyakan apl mengambil masa anda secara percuma.",
        keyPhrase: "secara percuma",
        body: [
          "Skrol, kongsi, rujuk — biasanya tanpa bayaran.",
          "Perhatian anda bernilai. Kebanyakan platform hanya mengambilnya.",
          "AlphasAxis membalas anda kerana hadir.",
        ],
      },
      {
        eyebrow: "Empat Cara Untuk Peroleh",
        headline: "Empat cara mudah untuk mula memperoleh.",
        keyPhrase: "mula memperoleh",
        body: [
          "Belanja-untuk-Peroleh — muat naik resit dari jenama rakan kongsi.",
          "Hantar-untuk-Peroleh — capai pencapaian kes yang mudah.",
          "Rangkaian & Sosial — jemput rakan, ikuti, terlibat.",
        ],
      },
      {
        eyebrow: "Mula Hari Ini",
        headline: "Imbas dan mula peroleh sekarang.",
        keyPhrase: "peroleh sekarang",
        body: ["Bersifat pendidikan. Bukan nasihat kewangan."],
      },
    ],
  },
};

export const TOPICS: Topic[] = [AXISPRESTIGE_TOPIC, AXIS_TOKEN_TOPIC, MEMBERSHIP_TOPIC, EARN_TOPIC];
