import type { Lang } from "./topics";

export interface Caption {
  id: string;
  /** Contains the literal token `{LINK}`, replaced with the user's referral link at render time. */
  text: string;
}

export interface CaptionCategory {
  id: string;
  label: string;
  captions: Caption[];
}

/** Keyed by language, then by topic slug (matches `Topic.slug` in topics.ts). */
export const CAPTION_BANK: Record<Lang, Record<string, CaptionCategory[]>> = {
  en: {
    axisprestige: [
      {
        id: "brand",
        label: "Brand",
        captions: [
          { id: "b1", text: "AlphasAxis is turning Malaysia's loan brokerage industry into on-chain infrastructure — and AxisPrestige is how you own a piece of it from day one. {LINK}" },
          { id: "b2", text: "Most platforms are built, then opened to the public. AxisPrestige flips that — you're in before the doors do. {LINK}" },
          { id: "b3", text: "AlphasAxis: real revenue, on-chain. AxisPrestige is the founding membership behind it. {LINK}" },
          { id: "b4", text: "Building something in Web3 usually means chasing hype. AxisPrestige is backed by an actual brokerage business. {LINK}" },
          { id: "b5", text: "This is what it looks like when a real industry meets real infrastructure. Meet AxisPrestige. {LINK}" },
        ],
      },
      {
        id: "problem",
        label: "The Gap",
        captions: [
          { id: "p1", text: "Most platforms reward users last. Early builders rarely get a real stake in what they helped grow. {LINK}" },
          { id: "p2", text: "Loyalty usually gets you a badge. AxisPrestige is built to give you something more concrete. {LINK}" },
          { id: "p3", text: "By the time most people can buy in, the best terms are already gone. Not this time. {LINK}" },
          { id: "p4", text: "Malaysia's loan industry runs on WhatsApp and spreadsheets. We think that's a solvable problem — and an opportunity. {LINK}" },
          { id: "p5", text: "There's a gap between the people who build a platform and the people who benefit from it. AxisPrestige closes it. {LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "How It Works",
        captions: [
          { id: "h1", text: "AxisPrestige nodes: 5,000 total, minted once. Ecosystem rewards distributed quarterly from real platform activity. {LINK}" },
          { id: "h2", text: "No presale hype, no vague promises — just a capped founding tier tied to how the platform actually performs. {LINK}" },
          { id: "h3", text: "Once all 5,000 AxisPrestige nodes are minted, this tier closes for good. {LINK}" },
          { id: "h4", text: "Quarterly distributions. A hard cap. A real business behind it. That's AxisPrestige in three lines. {LINK}" },
          { id: "h5", text: "AxisPrestige ties your membership to the platform's real activity — not a promise, a mechanism. {LINK}" },
        ],
      },
      {
        id: "cta",
        label: "Get Started",
        captions: [
          { id: "c1", text: "Curious where you'd fit in? Scan or tap to see AxisPrestige for yourself. {LINK}" },
          { id: "c2", text: "Ready to see what founding membership actually looks like? Start here. {LINK}" },
          { id: "c3", text: "AxisPrestige, explained in under two minutes. Link below. {LINK}" },
          { id: "c4", text: "Not financial advice — just an invitation to look at the details yourself. {LINK}" },
        ],
      },
    ],
    "axis-token": [
      {
        id: "brand",
        label: "Brand",
        captions: [
          { id: "b1", text: "$AXIS isn't another speculative token — it's tied to a real, operating brokerage business. {LINK}" },
          { id: "b2", text: "Most tokens ask you to believe in a whitepaper. $AXIS is backed by real revenue. {LINK}" },
          { id: "b3", text: "Utility first, hype never. That's the idea behind $AXIS. {LINK}" },
        ],
      },
      {
        id: "problem",
        label: "The Gap",
        captions: [
          { id: "p1", text: "Most tokens launch before there's a real business behind them. $AXIS didn't. {LINK}" },
          { id: "p2", text: "Price charts with nothing behind them — that's the story of most tokens. Not this one. {LINK}" },
          { id: "p3", text: "If a token's value depends entirely on new buyers, that's not a business — it's a queue. {LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "How It Works",
        captions: [
          { id: "h1", text: "$AXIS powers rewards across the AlphasAxis platform — earned through real activity, not speculation. {LINK}" },
          { id: "h2", text: "Referrals, case progress, engagement — all of it can earn you $AXIS. {LINK}" },
          { id: "h3", text: "$AXIS is backed by an operating brokerage business, not a promise. {LINK}" },
        ],
      },
      {
        id: "cta",
        label: "Get Started",
        captions: [
          { id: "c1", text: "Want to understand how $AXIS actually works? Start here. {LINK}" },
          { id: "c2", text: "No hype, just mechanics. Learn what $AXIS is built on. {LINK}" },
          { id: "c3", text: "Not financial advice — just the facts on $AXIS. {LINK}" },
        ],
      },
    ],
    membership: [
      {
        id: "brand",
        label: "Brand",
        captions: [
          { id: "b1", text: "Four tiers. One growing ecosystem. Find out where you fit at AlphasAxis. {LINK}" },
          { id: "b2", text: "AxisZero to AxisPrestige — membership that scales with your involvement. {LINK}" },
          { id: "b3", text: "Not every member gets treated the same at AlphasAxis. Here's why that's a good thing. {LINK}" },
        ],
      },
      {
        id: "problem",
        label: "The Gap",
        captions: [
          { id: "p1", text: "Most platforms treat every user the same, no matter how involved they are. {LINK}" },
          { id: "p2", text: "New members and power users getting identical access? That never made sense to us. {LINK}" },
          { id: "p3", text: "Engagement usually goes unrecognized. AlphasAxis's tier system changes that. {LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "How It Works",
        captions: [
          { id: "h1", text: "AxisZero, AxisOne, AxisPro, AxisPrestige — four tiers, each unlocking more. {LINK}" },
          { id: "h2", text: "Higher tiers mean deeper access to the AlphasAxis ecosystem. {LINK}" },
          { id: "h3", text: "Your tier reflects your involvement in the platform, not just a signup date. {LINK}" },
        ],
      },
      {
        id: "cta",
        label: "Get Started",
        captions: [
          { id: "c1", text: "Curious which tier fits you? Take a look. {LINK}" },
          { id: "c2", text: "See the full tier breakdown and find your fit. {LINK}" },
          { id: "c3", text: "Not financial advice — just an overview of how membership works. {LINK}" },
        ],
      },
    ],
    earn: [
      {
        id: "brand",
        label: "Brand",
        captions: [
          { id: "b1", text: "5 minutes a day. Real rewards. That's the AlphasAxis Earn hub. {LINK}" },
          { id: "b2", text: "Most apps waste your time. AlphasAxis pays you for yours. {LINK}" },
          { id: "b3", text: "Spend, submit, refer, share — it all counts on AlphasAxis. {LINK}" },
        ],
      },
      {
        id: "problem",
        label: "The Gap",
        captions: [
          { id: "p1", text: "You scroll, you share, you refer — for free, everywhere else. {LINK}" },
          { id: "p2", text: "Your attention has value. Most platforms just take it. {LINK}" },
          { id: "p3", text: "Loyalty deserves more than a badge. AlphasAxis actually pays it. {LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "How It Works",
        captions: [
          { id: "h1", text: "Spend-to-Earn: upload a receipt from a partner brand, earn points. {LINK}" },
          { id: "h2", text: "Submit-to-Earn: hit simple case milestones, get rewarded. {LINK}" },
          { id: "h3", text: "Network & Social: invite friends, follow, engage — it all earns. {LINK}" },
        ],
      },
      {
        id: "cta",
        label: "Get Started",
        captions: [
          { id: "c1", text: "Takes 5 minutes to start. Scan and see what you can earn today. {LINK}" },
          { id: "c2", text: "Your first task is one tap away. {LINK}" },
          { id: "c3", text: "Not financial advice — just a rewards system worth trying. {LINK}" },
        ],
      },
    ],
  },
  zh: {
    axisprestige: [
      {
        id: "brand",
        label: "品牌",
        captions: [
          { id: "b1", text: "AlphasAxis正在把马来西亚的贷款经纪行业变成链上基础设施——AxisPrestige就是你从第一天起拥有一份股权的方式。{LINK}" },
          { id: "b2", text: "大多数平台先建成，再对外开放。AxisPrestige反过来——在大门开启之前，你已经在场。{LINK}" },
          { id: "b3", text: "AlphasAxis：真实收入，链上呈现。AxisPrestige是背后的创始会员资格。{LINK}" },
        ],
      },
      {
        id: "problem",
        label: "差距",
        captions: [
          { id: "p1", text: "大多数平台最后才奖励用户。早期建设者很少能真正分享他们所助力成长的成果。{LINK}" },
          { id: "p2", text: "忠诚通常换来一枚徽章。AxisPrestige想给你更实在的东西。{LINK}" },
          { id: "p3", text: "等大多数人能买入时，最好的条件早已消失。这次不一样。{LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "运作方式",
        captions: [
          { id: "h1", text: "AxisPrestige节点：总量5,000个，仅铸造一次。生态系统奖励根据真实平台活动，每季度分配。{LINK}" },
          { id: "h2", text: "没有预售炒作，没有空泛承诺——只有与平台真实表现挂钩、总量封顶的创始等级。{LINK}" },
          { id: "h3", text: "一旦5,000个AxisPrestige节点全部铸造完毕，该等级将永久关闭。{LINK}" },
        ],
      },
      {
        id: "cta",
        label: "立即开始",
        captions: [
          { id: "c1", text: "好奇自己能拥有什么位置？扫码或点击，亲自看看AxisPrestige。{LINK}" },
          { id: "c2", text: "想看看创始会员资格到底是什么样子？从这里开始。{LINK}" },
          { id: "c3", text: "两分钟看懂AxisPrestige。链接在下方。{LINK}" },
        ],
      },
    ],
    "axis-token": [
      {
        id: "brand",
        label: "品牌",
        captions: [
          { id: "b1", text: "$AXIS不是又一个投机代币——它与真实运营的经纪业务挂钩。{LINK}" },
          { id: "b2", text: "大多数代币让你相信一份白皮书。$AXIS由真实收入支撑。{LINK}" },
          { id: "b3", text: "实用优先，从不炒作。这就是$AXIS背后的理念。{LINK}" },
        ],
      },
      {
        id: "problem",
        label: "差距",
        captions: [
          { id: "p1", text: "大多数代币在真正的业务成形之前就已上线。$AXIS没有这样做。{LINK}" },
          { id: "p2", text: "只有价格图表，背后空无一物——这是大多数代币的故事。这个不是。{LINK}" },
          { id: "p3", text: "如果一个代币的价值完全依赖新买家，那不是生意，而是一场击鼓传花。{LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "运作方式",
        captions: [
          { id: "h1", text: "$AXIS为AlphasAxis平台各项奖励提供动力——通过真实活动赚取，而非投机。{LINK}" },
          { id: "h2", text: "推荐、案件进度、互动——这些都能为你赚取$AXIS。{LINK}" },
          { id: "h3", text: "$AXIS由持续运营的经纪业务支撑，而不是一句承诺。{LINK}" },
        ],
      },
      {
        id: "cta",
        label: "立即开始",
        captions: [
          { id: "c1", text: "想了解$AXIS到底是怎么运作的？从这里开始。{LINK}" },
          { id: "c2", text: "没有炒作，只有机制。了解$AXIS的支撑逻辑。{LINK}" },
          { id: "c3", text: "不构成财务建议——只是关于$AXIS的事实。{LINK}" },
        ],
      },
    ],
    membership: [
      {
        id: "brand",
        label: "品牌",
        captions: [
          { id: "b1", text: "四个等级，一个不断成长的生态系统。来AlphasAxis看看你适合哪个等级。{LINK}" },
          { id: "b2", text: "从AxisZero到AxisPrestige——会员权限随你的参与度同步扩展。{LINK}" },
          { id: "b3", text: "在AlphasAxis，不是每个会员都被同等对待。这其实是件好事。{LINK}" },
        ],
      },
      {
        id: "problem",
        label: "差距",
        captions: [
          { id: "p1", text: "大多数平台不管参与程度如何，对所有用户一视同仁。{LINK}" },
          { id: "p2", text: "新会员和资深用户拥有完全相同的权限？这在我们看来一直说不通。{LINK}" },
          { id: "p3", text: "参与度通常得不到认可。AlphasAxis的等级体系改变了这一点。{LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "运作方式",
        captions: [
          { id: "h1", text: "AxisZero、AxisOne、AxisPro、AxisPrestige——四个等级，层层解锁更多。{LINK}" },
          { id: "h2", text: "等级越高，意味着对AlphasAxis生态系统的访问权限越深。{LINK}" },
          { id: "h3", text: "你的等级反映的是你在平台上的参与程度，而不只是注册日期。{LINK}" },
        ],
      },
      {
        id: "cta",
        label: "立即开始",
        captions: [
          { id: "c1", text: "好奇哪个等级适合你？来看看。{LINK}" },
          { id: "c2", text: "查看完整等级说明，找到适合你的位置。{LINK}" },
          { id: "c3", text: "不构成财务建议——只是会员体系的介绍。{LINK}" },
        ],
      },
    ],
    earn: [
      {
        id: "brand",
        label: "品牌",
        captions: [
          { id: "b1", text: "每天5分钟，换来真实回报。这就是AlphasAxis的Earn赚取中心。{LINK}" },
          { id: "b2", text: "大多数App浪费你的时间。AlphasAxis为你的时间买单。{LINK}" },
          { id: "b3", text: "消费、提交、推荐、分享——在AlphasAxis，每个动作都算数。{LINK}" },
        ],
      },
      {
        id: "problem",
        label: "差距",
        captions: [
          { id: "p1", text: "刷屏、分享、推荐——在别的地方，这些通常都是无偿的。{LINK}" },
          { id: "p2", text: "你的注意力有价值。大多数平台只是索取它。{LINK}" },
          { id: "p3", text: "忠诚理应得到不止一枚徽章。AlphasAxis真正为此买单。{LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "运作方式",
        captions: [
          { id: "h1", text: "消费赚积分：上传合作品牌的消费凭证，即可获得积分。{LINK}" },
          { id: "h2", text: "任务赚积分：完成简单的案件里程碑，即可获得奖励。{LINK}" },
          { id: "h3", text: "社交与网络：邀请好友、关注、互动——每一步都能赚取。{LINK}" },
        ],
      },
      {
        id: "cta",
        label: "立即开始",
        captions: [
          { id: "c1", text: "只需5分钟即可开始。扫码看看你今天能赚多少。{LINK}" },
          { id: "c2", text: "你的第一个任务，只差轻轻一点。{LINK}" },
          { id: "c3", text: "不构成财务建议——只是一个值得一试的奖励系统。{LINK}" },
        ],
      },
    ],
  },
  bm: {
    axisprestige: [
      {
        id: "brand",
        label: "Jenama",
        captions: [
          { id: "b1", text: "AlphasAxis sedang mengubah industri pembrokeran pinjaman Malaysia menjadi infrastruktur on-chain — dan AxisPrestige ialah cara anda memiliki sebahagiannya sejak hari pertama. {LINK}" },
          { id: "b2", text: "Kebanyakan platform dibina dahulu, baharu dibuka kepada umum. AxisPrestige membalikkan itu — anda sudah masuk sebelum pintu dibuka. {LINK}" },
          { id: "b3", text: "AlphasAxis: hasil sebenar, on-chain. AxisPrestige ialah keahlian pengasas di sebaliknya. {LINK}" },
        ],
      },
      {
        id: "problem",
        label: "Jurangnya",
        captions: [
          { id: "p1", text: "Kebanyakan platform memberi ganjaran kepada pengguna paling akhir. Pembina awal jarang mendapat kepentingan sebenar dalam apa yang mereka bantu bina. {LINK}" },
          { id: "p2", text: "Kesetiaan biasanya cuma dapat lencana. AxisPrestige dibina untuk memberi anda sesuatu yang lebih konkrit. {LINK}" },
          { id: "p3", text: "Apabila kebanyakan orang boleh menyertai, syarat terbaik sudah tiada. Bukan kali ini. {LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "Cara Ia Berfungsi",
        captions: [
          { id: "h1", text: "Nod AxisPrestige: 5,000 kesemuanya, ditempa sekali sahaja. Ganjaran ekosistem diagihkan setiap suku tahun daripada aktiviti platform sebenar. {LINK}" },
          { id: "h2", text: "Tiada hype prajualan, tiada janji kabur — hanya peringkat pengasas yang terhad dan terikat kepada prestasi sebenar platform. {LINK}" },
          { id: "h3", text: "Sebaik sahaja kesemua 5,000 nod AxisPrestige ditempa, peringkat ini ditutup buat selama-lamanya. {LINK}" },
        ],
      },
      {
        id: "cta",
        label: "Mula Sekarang",
        captions: [
          { id: "c1", text: "Ingin tahu di mana kedudukan anda? Imbas atau tekan untuk lihat AxisPrestige sendiri. {LINK}" },
          { id: "c2", text: "Bersedia untuk lihat rupa sebenar keahlian pengasas? Mula di sini. {LINK}" },
          { id: "c3", text: "AxisPrestige, diterangkan dalam masa kurang dua minit. Pautan di bawah. {LINK}" },
        ],
      },
    ],
    "axis-token": [
      {
        id: "brand",
        label: "Jenama",
        captions: [
          { id: "b1", text: "$AXIS bukan sekadar token spekulatif — ia terikat dengan perniagaan pembrokeran sebenar yang beroperasi. {LINK}" },
          { id: "b2", text: "Kebanyakan token minta anda percaya kepada whitepaper. $AXIS disokong oleh hasil sebenar. {LINK}" },
          { id: "b3", text: "Utiliti dahulu, hype tidak sesekali. Itulah idea di sebalik $AXIS. {LINK}" },
        ],
      },
      {
        id: "problem",
        label: "Jurangnya",
        captions: [
          { id: "p1", text: "Kebanyakan token dilancarkan sebelum ada perniagaan sebenar di sebaliknya. $AXIS tidak begitu. {LINK}" },
          { id: "p2", text: "Carta harga tanpa sokongan — itulah cerita kebanyakan token. Bukan yang ini. {LINK}" },
          { id: "p3", text: "Jika nilai sesuatu token bergantung sepenuhnya kepada pembeli baharu, itu bukan perniagaan — itu barisan giliran. {LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "Cara Ia Berfungsi",
        captions: [
          { id: "h1", text: "$AXIS menggerakkan ganjaran di seluruh platform AlphasAxis — diperoleh melalui aktiviti sebenar, bukan spekulasi. {LINK}" },
          { id: "h2", text: "Rujukan, kemajuan kes, penglibatan — semua ini boleh memberi anda $AXIS. {LINK}" },
          { id: "h3", text: "$AXIS disokong oleh perniagaan pembrokeran yang beroperasi, bukan janji. {LINK}" },
        ],
      },
      {
        id: "cta",
        label: "Mula Sekarang",
        captions: [
          { id: "c1", text: "Mahu fahami cara $AXIS sebenarnya berfungsi? Mula di sini. {LINK}" },
          { id: "c2", text: "Tiada hype, hanya mekanik. Ketahui asas $AXIS dibina. {LINK}" },
          { id: "c3", text: "Bukan nasihat kewangan — hanya fakta mengenai $AXIS. {LINK}" },
        ],
      },
    ],
    membership: [
      {
        id: "brand",
        label: "Jenama",
        captions: [
          { id: "b1", text: "Empat peringkat. Satu ekosistem yang berkembang. Ketahui di mana kedudukan anda di AlphasAxis. {LINK}" },
          { id: "b2", text: "AxisZero hingga AxisPrestige — keahlian yang berkembang mengikut penglibatan anda. {LINK}" },
          { id: "b3", text: "Tidak semua ahli dilayan sama di AlphasAxis. Ini sebabnya itu perkara baik. {LINK}" },
        ],
      },
      {
        id: "problem",
        label: "Jurangnya",
        captions: [
          { id: "p1", text: "Kebanyakan platform melayan setiap pengguna sama rata, tidak kira sejauh mana penglibatan mereka. {LINK}" },
          { id: "p2", text: "Ahli baharu dan pengguna aktif mendapat akses yang sama? Itu tidak pernah masuk akal bagi kami. {LINK}" },
          { id: "p3", text: "Penglibatan biasanya tidak diiktiraf. Sistem peringkat AlphasAxis mengubah itu. {LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "Cara Ia Berfungsi",
        captions: [
          { id: "h1", text: "AxisZero, AxisOne, AxisPro, AxisPrestige — empat peringkat, setiap satu membuka lebih banyak. {LINK}" },
          { id: "h2", text: "Peringkat lebih tinggi bermaksud akses lebih mendalam kepada ekosistem AlphasAxis. {LINK}" },
          { id: "h3", text: "Peringkat anda mencerminkan penglibatan anda dalam platform, bukan sekadar tarikh mendaftar. {LINK}" },
        ],
      },
      {
        id: "cta",
        label: "Mula Sekarang",
        captions: [
          { id: "c1", text: "Ingin tahu peringkat mana sesuai untuk anda? Lihat sendiri. {LINK}" },
          { id: "c2", text: "Lihat pecahan penuh peringkat dan cari kedudukan anda. {LINK}" },
          { id: "c3", text: "Bukan nasihat kewangan — hanya gambaran keseluruhan cara keahlian berfungsi. {LINK}" },
        ],
      },
    ],
    earn: [
      {
        id: "brand",
        label: "Jenama",
        captions: [
          { id: "b1", text: "5 minit sehari. Ganjaran sebenar. Itulah hab Earn AlphasAxis. {LINK}" },
          { id: "b2", text: "Kebanyakan apl membazirkan masa anda. AlphasAxis membayar anda untuknya. {LINK}" },
          { id: "b3", text: "Belanja, hantar, rujuk, kongsi — semuanya dikira di AlphasAxis. {LINK}" },
        ],
      },
      {
        id: "problem",
        label: "Jurangnya",
        captions: [
          { id: "p1", text: "Anda skrol, anda kongsi, anda rujuk — secara percuma, di mana-mana sahaja. {LINK}" },
          { id: "p2", text: "Perhatian anda bernilai. Kebanyakan platform hanya mengambilnya. {LINK}" },
          { id: "p3", text: "Kesetiaan patut dapat lebih daripada lencana. AlphasAxis benar-benar membayarnya. {LINK}" },
        ],
      },
      {
        id: "how-it-works",
        label: "Cara Ia Berfungsi",
        captions: [
          { id: "h1", text: "Belanja-untuk-Peroleh: muat naik resit daripada jenama rakan kongsi, peroleh mata. {LINK}" },
          { id: "h2", text: "Hantar-untuk-Peroleh: capai pencapaian kes yang mudah, dapat ganjaran. {LINK}" },
          { id: "h3", text: "Rangkaian & Sosial: jemput rakan, ikuti, terlibat — semuanya memberi ganjaran. {LINK}" },
        ],
      },
      {
        id: "cta",
        label: "Mula Sekarang",
        captions: [
          { id: "c1", text: "Cuma ambil masa 5 minit untuk mula. Imbas dan lihat apa yang anda boleh peroleh hari ini. {LINK}" },
          { id: "c2", text: "Tugas pertama anda hanya sejauh satu ketukan. {LINK}" },
          { id: "c3", text: "Bukan nasihat kewangan — hanya sistem ganjaran yang berbaloi dicuba. {LINK}" },
        ],
      },
    ],
  },
};
