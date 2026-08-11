import type { Lang } from "./canvasCore";

export interface ContentKitUiStrings {
  language: string;
  topic: string;
  yourReferralLink: string;
  referralLinkNote: string;
  copyLink: string;
  copied: string;
  downloadAll: string;
  downloading: string;
  download: string;
  share: string;
  loadingAssets: string;
  captionBank: string;
  copyCaption: string;
  showMeAnother: string;
  igTikTokNote: string;
  edit: string;
  close: string;
  undo: string;
  redo: string;
  reset: string;
  addText: string;
  addImage: string;
  delete: string;
  duplicate: string;
}

export const UI_STRINGS: Record<Lang, ContentKitUiStrings> = {
  en: {
    language: "Language",
    topic: "Topic",
    yourReferralLink: "Your referral link",
    referralLinkNote: "Every carousel below is personalized with this code's QR.",
    copyLink: "Copy link",
    copied: "Copied!",
    downloadAll: "Download All",
    downloading: "Downloading…",
    download: "Download",
    share: "Share",
    loadingAssets: "Loading fonts and assets…",
    captionBank: "Caption bank",
    copyCaption: "Copy caption",
    showMeAnother: "Show me another",
    igTikTokNote: "For Instagram or TikTok, use the Share button on a slide above, or copy the caption in here.",
    edit: "Edit",
    close: "Close",
    undo: "Undo",
    redo: "Redo",
    reset: "Reset",
    addText: "+ Text",
    addImage: "+ Image",
    delete: "Delete",
    duplicate: "Duplicate",
  },
  zh: {
    language: "语言",
    topic: "主题",
    yourReferralLink: "你的推荐链接",
    referralLinkNote: "以下所有轮播图都根据此代码的二维码进行个性化定制。",
    copyLink: "复制链接",
    copied: "已复制！",
    downloadAll: "全部下载",
    downloading: "下载中…",
    download: "下载",
    share: "分享",
    loadingAssets: "正在加载字体和素材…",
    captionBank: "文案库",
    copyCaption: "复制文案",
    showMeAnother: "换一个",
    igTikTokNote: "如需分享到Instagram或TikTok，请使用上方幻灯片的分享按钮，或在此处复制文案。",
    edit: "编辑",
    close: "关闭",
    undo: "撤销",
    redo: "重做",
    reset: "重置",
    addText: "+ 文字",
    addImage: "+ 图片",
    delete: "删除",
    duplicate: "复制",
  },
  bm: {
    language: "Bahasa",
    topic: "Topik",
    yourReferralLink: "Pautan rujukan anda",
    referralLinkNote: "Setiap karusel di bawah diperibadikan dengan kod QR kod ini.",
    copyLink: "Salin pautan",
    copied: "Disalin!",
    downloadAll: "Muat Turun Semua",
    downloading: "Memuat turun…",
    download: "Muat Turun",
    share: "Kongsi",
    loadingAssets: "Memuatkan fon dan aset…",
    captionBank: "Bank kapsyen",
    copyCaption: "Salin kapsyen",
    showMeAnother: "Tunjukkan satu lagi",
    igTikTokNote: "Untuk Instagram atau TikTok, guna butang Kongsi pada slaid di atas, atau salin kapsyen di sini.",
    edit: "Sunting",
    close: "Tutup",
    undo: "Buat Asal",
    redo: "Buat Semula",
    reset: "Set Semula",
    addText: "+ Teks",
    addImage: "+ Imej",
    delete: "Padam",
    duplicate: "Gandakan",
  },
};
