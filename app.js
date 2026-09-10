const pages = Array.from(document.querySelectorAll(".page"));
const navButtons = Array.from(document.querySelectorAll("[data-nav]"));
const goButtons = Array.from(document.querySelectorAll("[data-go]"));
const sheet = document.querySelector(".sheet");
const logoutModal = document.querySelector(".logout-modal");
const nicknameModal = document.querySelector(".nickname-modal");
const avatarModal = document.querySelector(".avatar-modal");
const ratingModal = document.querySelector(".rating-modal");
const channelPages = ["home", "course", "scene", "feature"];
let currentPage = "home";
let interactionCount = 0;
let ratingPromptShown = false;
let noticeRead = false;

try {
  ratingPromptShown = sessionStorage.getItem("nativeRatingPromptDone") === "true";
} catch {
  ratingPromptShown = false;
}

try {
  noticeRead = sessionStorage.getItem("nativeNoticeRead") === "true";
} catch {
  noticeRead = false;
}

if (noticeRead) document.body.classList.add("notice-read");

const podcasts = [
  {
    title: "日本の車生活について",
    meta: "Ep.89 · 14:20 · 真实语速",
    topic: "通勤、停车、买车文化",
    desc: "围绕地方生活中的开车通勤、停车费、买车和日常用车习惯，训练自然速度下的关键词捕捉。",
    points: "〜について話す / 必要だと思う / 場所によって変わる / なくても生活できる / 〜かなと思う",
    transcript: `こんにちは。

Native日本語ラジオです。

今日はですね……

日本の車生活について、
少し話してみたいと思います。

みなさん、
日本って車が必要だと思いますか？

これ……

実は住んでいる場所によって、
答えが全然変わるんですよね。

例えば東京。

東京の場合はですね……

正直、
車がなくても生活できる人が多いです。

電車が本当に便利なので、
「車、なくてもいいかな」
って思う人も多いんですよね。`
  },
  {
    title: "コンビニの新商品、なぜ毎週出る?",
    meta: "Ep.88 · 11:36 · 生活文化",
    topic: "便利店新品文化",
    desc: "从甜品、饭团到季节限定，听懂日本便利店商品更新背后的常用表达。",
    points: "新商品 / 期間限定 / つい買っちゃう / 売り場 / 口コミ"
  },
  {
    title: "雨の日の過ごし方",
    meta: "Ep.87 · 09:42 · 日常表达",
    topic: "雨天生活表达",
    desc: "学习下雨、撑伞、取消计划、在家度过周末时自然会说的话。",
    points: "雨が降っている / 傘を忘れた / 家でゆっくり / 予定を変える"
  },
  {
    title: "朝のカフェで聞こえる日本語",
    meta: "Ep.86 · 12:18 · 咖啡店场景",
    topic: "点单、寒暄、座位确认",
    desc: "模拟早高峰咖啡店里的点单、外带、找座位和简单寒暄。",
    points: "店内で / 持ち帰り / 空いてますか / いつもの / 少々お待ちください"
  },
  {
    title: "職場で使う「一応」と「念のため」",
    meta: "Ep.85 · 15:04 · 职场语感",
    topic: "职场缓冲语",
    desc: "拆解一応、念のため、確認します在真实工作沟通里的语气差异。",
    points: "一応 / 念のため / 確認します / 共有します / 大丈夫そうです"
  },
  {
    title: "週末、何してた?",
    meta: "Ep.84 · 10:55 · 社交闲聊",
    topic: "闲聊展开方式",
    desc: "练习从一句周末做了什么，自然延伸到兴趣、天气和近况。",
    points: "週末 / 何してた / いいですね / そうなんだ / 最近"
  },
  {
    title: "病院で症状を説明する",
    meta: "Ep.83 · 13:27 · 医疗场景",
    topic: "医疗场景表达",
    desc: "用简单清楚的日语描述头痛、发烧、胃不舒服和服药情况。",
    points: "熱があります / 頭が痛い / 胃の調子が悪い / 薬 / いつから"
  },
  {
    title: "電車が遅れた時の会話",
    meta: "Ep.82 · 08:48 · 交通出行",
    topic: "交通延误说明",
    desc: "练习电车延误、换乘失败、向对方说明迟到原因的自然说法。",
    points: "電車が遅れています / 遅れます / 乗り換え / 間に合わない"
  },
  {
    title: "日本人のあいづち入門",
    meta: "Ep.81 · 16:11 · 真实会话",
    topic: "うん、へえ、なるほど",
    desc: "掌握常见附和语，让听起来更像在自然参与对话。",
    points: "うん / へえ / なるほど / たしかに / そうなんですね"
  },
  {
    title: "スーパーでよく聞く店内放送",
    meta: "Ep.80 · 09:58 · 购物听力",
    topic: "购物听力训练",
    desc: "训练超市广播、特价信息、收银提示中常出现的关键词。",
    points: "本日限り / セール / レジ袋 / ポイントカード / お買い得"
  }
];

function setPage(name) {
  const currentIndex = channelPages.indexOf(currentPage);
  const nextIndex = channelPages.indexOf(name);
  const isChannelMove = currentIndex >= 0 && nextIndex >= 0;

  if (isChannelMove) {
    document.querySelector(".app").classList.toggle("slide-left", nextIndex > currentIndex);
    document.querySelector(".app").classList.toggle("slide-right", nextIndex < currentIndex);
  }

  pages.forEach((page) => {
    page.classList.toggle("active", page.dataset.page === name);
    if (page.dataset.page === name) page.scrollTop = 0;
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === name);
  });

  document.querySelectorAll(".home-cats button[data-go]").forEach((button) => {
    button.classList.toggle("active", button.dataset.go === name);
  });

  currentPage = name;
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setPage(button.dataset.nav));
});

goButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setPage(button.dataset.go);
  });
});

let lastGrammarLevelPage = "course";
const grammarMetaData = {
  "ます形（します）": {
    cn: "礼貌地表达动作",
    nuance: "语感比较正式、稳妥，适合初次见面、课堂、服务场景。"
  },
  "丁寧形（です）": {
    cn: "礼貌判断句",
    nuance: "语气柔和、客气，是日常会话里最基础的礼貌表达。"
  },
  "辞書形（する）": {
    cn: "做某事",
    nuance: "辞书形更直接，常用于说明习惯、能力、规则或普通叙述。"
  },
  "て形（して）": {
    cn: "连接动作、请求或状态",
    nuance: "语感自然口语，用来把动作串起来，或者温和地提出请求。"
  },
  "た系（した・しました）": {
    cn: "表示过去或完成",
    nuance: "强调事情已经发生，口语里也常用来确认经验和结果。"
  },
  "できる": {
    cn: "能够、会、可以完成",
    nuance: "语感积极，强调能力、条件具备或事情可行。"
  },
  "できない": {
    cn: "不能、不会、无法完成",
    nuance: "比直接拒绝更客观，常用于说明能力或条件不允许。"
  },
  "できている": {
    cn: "已经做好、准备好了",
    nuance: "强调完成后的状态还持续着，听起来比较自然。"
  },
  "できていない": {
    cn: "还没做好、尚未完成",
    nuance: "比できない更像“进度未完成”，不是完全不可能。"
  },
  "〜られる（可能）": {
    cn: "能够做某事",
    nuance: "表达能力或条件允许，语气比直接说できる更贴近日语动词体系。"
  },
  "〜上がる": {
    cn: "彻底完成、做完",
    nuance: "带有“完成到一个状态”的感觉，比普通完成更有结果感。"
  },
  "〜がかり": {
    cn: "花费某段时间",
    nuance: "强调事情耗时较长，常带有“费了一番工夫”的感觉。"
  },
  "〜がたい": {
    cn: "难以、很难做到",
    nuance: "书面感较强，常用于心理上难以接受、相信或理解。"
  },
  "〜きる": {
    cn: "彻底做完、做到最后",
    nuance: "强调从头到尾完成，有坚持到底或完全耗尽的感觉。"
  },
  "〜きれる": {
    cn: "能够完全做完",
    nuance: "常和否定一起用，表示数量、程度超过了承受范围。"
  },
  "〜限り（限界）": {
    cn: "在能力或范围的极限内",
    nuance: "强调“尽可能做到最大程度”，语气有全力以赴的感觉。"
  },
  "〜限りは（状態）": {
    cn: "只要处于某种状态",
    nuance: "常用于责任、条件、立场，语气偏正式。"
  },
  "〜限りでは（範囲）": {
    cn: "就某个范围来看",
    nuance: "语气谨慎，表示结论只限于自己知道或确认的范围。"
  },
  "〜に限って": {
    cn: "偏偏某时、唯独某对象",
    nuance: "常带有意外、不巧或反常的语感。"
  },
  "〜に限らず": {
    cn: "不限于、不只是",
    nuance: "用于扩大范围，语气比だけでなく更正式。"
  },
  "文法": {
    cn: "句型和表达结构",
    nuance: "用于整理真实会话中反复出现的表达框架。"
  },
  "表现": {
    cn: "自然表达和语气",
    nuance: "重点不是字面意思，而是日本人实际怎么说更自然。"
  },
  "〜までもない": {
    cn: "没必要特意做、不用说也明白",
    nuance: "语气是“事情已经很明显，所以无需再说或再做”。"
  },
  "おそらく": {
    cn: "大概、恐怕",
    nuance: "比たぶん更书面、更谨慎，常用于预测或判断。"
  },
  "もしかしたら": {
    cn: "也许、说不定",
    nuance: "带有不确定和试探感，比たぶん把握更低。"
  },
  "どうも": {
    cn: "总觉得、似乎",
    nuance: "表达模糊的感觉或判断，常用于还没完全确定的情况。"
  },
  "〜ずにはいられない": {
    cn: "忍不住要做",
    nuance: "强调情绪或冲动强到无法控制。"
  },
  "思いのほか": {
    cn: "出乎意料地、比想象中更",
    nuance: "语气带有轻微惊讶，常用于结果比预期好、快、多或不同。"
  }
};

const grammarExampleData = {
  "ます形（します）": {
    meaning: "表示礼貌地说明自己或他人的动作。",
    examples: [
      {
        jp: "毎朝、日本語を勉強します。",
        kana: "まいあさ、にほんごを べんきょうします。",
        cn: "我每天早上学习日语。"
      },
      {
        jp: "今日は宿題をします。",
        kana: "きょうは しゅくだいをします。",
        cn: "今天我要做作业。"
      },
      {
        jp: "週末に部屋を掃除します。",
        kana: "しゅうまつに へやを そうじします。",
        cn: "周末我会打扫房间。"
      }
    ]
  },
  "できる": {
    meaning: "表示能够做某事，或某件事可以实现。",
    examples: [
      {
        jp: "私は少し日本語ができます。",
        kana: "わたしは すこし にほんごができます。",
        cn: "我会一点日语。"
      },
      {
        jp: "このアプリで発音の練習ができます。",
        kana: "このアプリで はつおんの れんしゅうができます。",
        cn: "可以用这个 App 练习发音。"
      },
      {
        jp: "明日なら時間ができます。",
        kana: "あしたなら じかんができます。",
        cn: "如果是明天的话，我会有时间。"
      }
    ]
  },
  "〜上がる": {
    meaning: "表示动作彻底完成，结果已经形成。",
    examples: [
      {
        jp: "レポートがやっと出来上がりました。",
        kana: "レポートが やっと できあがりました。",
        cn: "报告终于完成了。"
      },
      {
        jp: "料理が出来上がったら呼んでください。",
        kana: "りょうりが できあがったら よんでください。",
        cn: "饭做好后请叫我。"
      },
      {
        jp: "新しい教材が来週出来上がります。",
        kana: "あたらしい きょうざいが らいしゅう できあがります。",
        cn: "新的教材下周会完成。"
      }
    ]
  },
  "〜限り（限界）": {
    meaning: "表示在能力、体力或范围的最大限度内。",
    examples: [
      {
        jp: "力の限り走りました。",
        kana: "ちからの かぎり はしりました。",
        cn: "我用尽全力跑了。"
      },
      {
        jp: "できる限り早く返事します。",
        kana: "できるかぎり はやく へんじします。",
        cn: "我会尽可能早点回复。"
      },
      {
        jp: "時間の許す限り練習を続けます。",
        kana: "じかんの ゆるすかぎり れんしゅうを つづけます。",
        cn: "只要时间允许，我会继续练习。"
      }
    ]
  },
  "思いのほか": {
    meaning: "表示结果比自己预想的更出乎意料。",
    examples: [
      {
        jp: "試験は思いのほか簡単でした。",
        kana: "しけんは おもいのほか かんたんでした。",
        cn: "考试出乎意料地简单。"
      },
      {
        jp: "新しい仕事には思いのほか早く慣れました。",
        kana: "あたらしい しごとには おもいのほか はやく なれました。",
        cn: "我出乎意料地很快适应了新工作。"
      },
      {
        jp: "この店は思いのほか静かで、勉強しやすいです。",
        kana: "このみせは おもいのほか しずかで、べんきょうしやすいです。",
        cn: "这家店出乎意料地安静，很适合学习。"
      }
    ]
  },
  "〜までもない": {
    meaning: "表示“没有必要特意做某事 / 不用说也明白”。",
    examples: [
      {
        jp: "彼が優秀なのは、言うまでもない。",
        kana: "かれが ゆうしゅうなのは、いうまでもない。",
        cn: "他很优秀，这不用说。"
      },
      {
        jp: "そんな簡単なことは、説明するまでもない。",
        kana: "そんな かんたんなことは、せつめいするまでもない。",
        cn: "那么简单的事情，没有必要说明。"
      },
      {
        jp: "結果を見れば、誰が努力したかは聞くまでもない。",
        kana: "けっかをみれば、だれがどりょくしたかは きくまでもない。",
        cn: "看结果就知道谁努力了，没必要再问。"
      }
    ]
  }
};

function normalizeGrammarText(value) {
  return value.trim().replace(/^~/, "〜");
}

function getGrammarMeta(grammar, title) {
  const normalized = normalizeGrammarText(grammar);
  return grammarMetaData[normalized] || {
    cn: title,
    nuance: "该语法的语感说明准备中，后续可补充更完整解释。"
  };
}

function getGrammarLevelInfo(list) {
  const page = list.closest(".page");
  return {
    pageName: page?.dataset.page || "course",
    level: page?.querySelector(".page-title h2")?.textContent.trim() || "等级"
  };
}

function renderGrammarExamples(grammar, level) {
  const normalized = normalizeGrammarText(grammar);
  const data = grammarExampleData[normalized] || {
    meaning: "该语法的例句内容准备中。",
    examples: [
      { jp: `${normalized} を使った例文を準備中です。`, kana: "れいぶんを じゅんびちゅうです。", cn: "这个语法的例句正在准备中。" }
    ]
  };
  document.querySelector("#grammar-example-title").textContent = normalized;
  document.querySelector("#grammar-example-subtitle").textContent = `${level} · 例句练习`;
  document.querySelector("#grammar-example-pattern").textContent = normalized;
  document.querySelector("#grammar-example-meaning").textContent = data.meaning;
  const exampleList = document.querySelector("#grammar-example-list");
  exampleList.innerHTML = data.examples.map((example, index) => `
    <article>
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>${example.jp}</h3>
        <p>${example.kana}</p>
        <small>${example.cn}</small>
      </div>
      <button data-action="play">▶</button>
    </article>
  `).join("");
  setPage("grammar-examples");
}

function renderGrammarList(sourceList, selectedGrammar) {
  const { pageName, level } = getGrammarLevelInfo(sourceList);
  lastGrammarLevelPage = pageName;
  const grammarItems = Array.from(sourceList.querySelectorAll("article")).map((item, index) => ({
    order: String(index + 1).padStart(2, "0"),
    title: item.querySelector("h3")?.textContent.trim() || "课程",
    grammar: normalizeGrammarText(item.querySelector("p")?.textContent.trim() || ""),
    status: parseSortMeta(item, index).isUnlearned ? "unlearned" : "learned",
    recent: String(100 - index)
  })).filter((item) => item.grammar);

  document.querySelector("#grammar-list-title").textContent = `${level} 语法列表`;
  document.querySelector("#grammar-list-subtitle").textContent = `来自 ${level} 课程主题`;
  document.querySelector("#grammar-list-current").textContent = `${level} 高频语法`;

  const topicList = document.querySelector("#grammar-topic-list");
  topicList.innerHTML = grammarItems.map((item) => `
    <article data-grammar="${item.grammar}" data-level="${level}" data-status="${item.status}" data-recent="${item.recent}">
      <span>${item.order}</span>
      <div>
        <h3>${item.grammar}</h3>
        <p>${getGrammarMeta(item.grammar, item.title).cn}</p>
        <small>${getGrammarMeta(item.grammar, item.title).nuance}</small>
      </div>
      <button>例句 ›</button>
    </article>
  `).join("");

  topicList.querySelectorAll("article").forEach((item) => {
    item.addEventListener("click", () => renderGrammarExamples(item.dataset.grammar, item.dataset.level));
  });

  setPage("level-grammar-list");
  if (selectedGrammar) {
    const selected = Array.from(topicList.querySelectorAll("article")).find((item) => item.dataset.grammar === normalizeGrammarText(selectedGrammar));
    selected?.classList.add("active");
  }
}

document.querySelectorAll(".old-level-list article p").forEach((grammarTag) => {
  grammarTag.addEventListener("click", (event) => {
    event.stopPropagation();
    const sourceList = grammarTag.closest(".old-level-list");
    if (!sourceList) return;
    renderGrammarList(sourceList, grammarTag.textContent);
  });
});

document.querySelector("[data-action='grammar-back']")?.addEventListener("click", () => {
  setPage(lastGrammarLevelPage);
});

function closeRatingPrompt() {
  ratingModal?.classList.remove("open");
  ratingModal?.setAttribute("aria-hidden", "true");
  try {
    sessionStorage.setItem("nativeRatingPromptDone", "true");
  } catch {
    // Session storage can be unavailable in some embedded browsers.
  }
  ratingPromptShown = true;
}

function maybeShowRatingPrompt() {
  if (ratingPromptShown || !ratingModal) return;
  interactionCount += 1;
  if (interactionCount < 6) return;
  ratingModal.classList.add("open");
  ratingModal.setAttribute("aria-hidden", "false");
  ratingPromptShown = true;
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".rating-modal")) return;
  if (event.target.closest("button, [data-go], [data-nav], .level-card")) maybeShowRatingPrompt();
});

document.querySelectorAll("[data-rating]").forEach((button) => {
  button.addEventListener("click", () => {
    button.parentElement.querySelectorAll("button").forEach((item) => item.classList.toggle("selected", Number(item.dataset.rating) <= Number(button.dataset.rating)));
    window.setTimeout(closeRatingPrompt, 420);
  });
});

document.querySelector("[data-action='close-rating']")?.addEventListener("click", closeRatingPrompt);

document.querySelectorAll("[data-action='open-sheet']").forEach((button) => {
  button.addEventListener("click", () => {
    document.body.classList.add("notice-read");
    try {
      sessionStorage.setItem("nativeNoticeRead", "true");
    } catch {
      noticeRead = true;
    }
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
  });
});

document.querySelectorAll("[data-action='close-sheet']").forEach((button) => {
  button.addEventListener("click", () => {
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden", "true");
  });
});

document.querySelectorAll("[data-action='logout']").forEach((button) => {
  button.addEventListener("click", () => {
    logoutModal.classList.add("open");
    logoutModal.setAttribute("aria-hidden", "false");
  });
});

document.querySelectorAll("[data-action='cancel-logout'], [data-action='confirm-logout']").forEach((button) => {
  button.addEventListener("click", () => {
    logoutModal.classList.remove("open");
    logoutModal.setAttribute("aria-hidden", "true");
    if (button.dataset.action === "confirm-logout") setPage("login");
  });
});

document.querySelectorAll("[data-action='play']").forEach((button) => {
  button.addEventListener("click", () => {
    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(.92)" },
        { transform: "scale(1)" }
      ],
      { duration: 220, easing: "ease-out" }
    );
  });
});

document.querySelectorAll(".level-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".level-tabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

function parseSortMeta(item, index) {
  const title = item.querySelector("h3")?.textContent.trim() || item.querySelector("b")?.textContent.trim() || "";
  const text = item.textContent.replace(/\s+/g, " ");
  const slash = text.match(/(\d+)\s*\/\s*(\d+)\s*课/);
  const totalText = text.match(/(\d+)\s*课/);
  const learnedText = text.match(/已完成\s*(\d+)/);
  const playsText = text.match(/▶\s*(\d+)|播放\s*(\d+)/);
  const percentText = item.querySelector("i span")?.style.width?.match(/(\d+)/);
  const statusButton = item.querySelector("button");
  const status = item.dataset.status || "";
  const isUnlearned = status === "unlearned" || statusButton?.classList.contains("muted") || text.includes("未学习");
  const isComplete = status === "learned" || (text.includes("已完成") && !isUnlearned);

  return {
    index,
    title,
    total: slash ? Number(slash[2]) : totalText ? Number(totalText[1]) : 0,
    learned: slash ? Number(slash[1]) : learnedText ? Number(learnedText[1]) : percentText ? Number(percentText[1]) : 0,
    plays: playsText ? Number(playsText[1] || playsText[2]) : 0,
    recent: Number(item.dataset.recent || (index < 2 ? 100 - index : 30 - index)),
    isUnlearned,
    isComplete
  };
}

const sortLabels = {
  default: "推荐顺序",
  "unlearned-first": "未学习优先",
  "recent-desc": "最近学习",
  "name-asc": "五十音顺",
  "total-desc": "课程多到少",
  "learned-desc": "学习多到少"
};

const filterLabels = {
  all: "全部",
  unlearned: "未学习",
  learned: "已学习"
};

function normalizeSortButton(button) {
  if (!button) return;
  const type = button.dataset.sort || "default";
  button.textContent = sortLabels[type] || button.textContent.trim();
}

function ensureListTools(bar) {
  if (bar.dataset.toolsReady === "true") return;
  bar.dataset.toolsReady = "true";
  bar.classList.add("list-tools");

  const activeType = bar.querySelector("[data-sort].active")?.dataset.sort || "default";
  const availableSorts = ["default", "unlearned-first", "recent-desc", "name-asc"];
  const sortButtons = availableSorts.map((type) => {
    const button = document.createElement("button");
    button.dataset.sort = type;
    button.textContent = sortLabels[type];
    if (type === activeType || (type === "default" && !availableSorts.includes(activeType))) button.classList.add("active");
    return button;
  });
  sortButtons.forEach(normalizeSortButton);

  const sortMenu = document.createElement("div");
  sortMenu.className = "tool-menu sort-menu";
  sortButtons.forEach((button) => sortMenu.appendChild(button));

  const filterMenu = document.createElement("div");
  filterMenu.className = "tool-menu filter-menu";
  [
    ["all", "全部"],
    ["unlearned", "未学习"],
    ["learned", "已学习"]
  ].forEach(([value, label], index) => {
    const button = document.createElement("button");
    button.dataset.filter = value;
    button.textContent = label;
    if (index === 0) button.classList.add("active");
    filterMenu.appendChild(button);
  });

  bar.textContent = "";
  bar.dataset.filter = "all";
  bar.dataset.sort = availableSorts.includes(activeType) ? activeType : "default";
  const filterTrigger = document.createElement("span");
  filterTrigger.className = "tool-trigger";
  filterTrigger.dataset.tool = "filter";
  filterTrigger.textContent = "筛选";
  const sortTrigger = document.createElement("span");
  sortTrigger.className = "tool-trigger";
  sortTrigger.dataset.tool = "sort";
  sortTrigger.textContent = "排序";
  const chips = document.createElement("div");
  chips.className = "tool-chips";

  bar.append(filterTrigger, sortTrigger, filterMenu, sortMenu, chips);
}

function updateToolChips(bar) {
  const chips = bar.querySelector(".tool-chips");
  if (!chips) return;
  const filterType = bar.dataset.filter || "all";
  const sortType = bar.dataset.sort || "default";
  const filterText = filterLabels[filterType] || "全部";
  const sortText = sortLabels[sortType] || "推荐顺序";
  chips.innerHTML = `
    ${filterType === "all" ? "" : `<button data-clear-filter>${filterText} ×</button>`}
    <span>排序：${sortText}</span>
  `;
}

function applyListTools(bar, sortableItems) {
  const list = document.getElementById(bar.dataset.sortTarget);
  if (!list) return;
  const items = sortableItems || Array.from(list.children).map((item, index) => ({
    item,
    meta: parseSortMeta(item, index)
  }));
  const filterType = bar.dataset.filter || "all";
  const sortType = bar.dataset.sort || "default";

  const sorted = [...items].sort((a, b) => {
    if (sortType === "total-desc") return b.meta.total - a.meta.total || a.meta.index - b.meta.index;
    if (sortType === "learned-desc") return b.meta.learned - a.meta.learned || a.meta.index - b.meta.index;
    if (sortType === "unlearned-first") return Number(b.meta.isUnlearned) - Number(a.meta.isUnlearned) || a.meta.index - b.meta.index;
    if (sortType === "recent-desc") return b.meta.recent - a.meta.recent || a.meta.index - b.meta.index;
    if (sortType === "name-asc") return a.meta.title.localeCompare(b.meta.title, "ja") || a.meta.index - b.meta.index;
    return a.meta.index - b.meta.index;
  });

  sorted.forEach(({ item, meta }) => {
    const visible = filterType === "all" || (filterType === "unlearned" && meta.isUnlearned) || (filterType === "learned" && meta.isComplete);
    item.hidden = !visible;
    list.appendChild(item);
  });
  updateToolChips(bar);
}

document.querySelectorAll(".sort-bar").forEach((bar) => {
  ensureListTools(bar);
  const list = document.getElementById(bar.dataset.sortTarget);
  if (!list) return;

  const sortableItems = Array.from(list.children).map((item, index) => ({
    item,
    meta: parseSortMeta(item, index)
  }));

  const activeSort = bar.querySelector("[data-sort].active") || bar.querySelector("[data-sort='default']");
  if (activeSort) bar.dataset.sort = activeSort.dataset.sort || "default";
  applyListTools(bar, sortableItems);

  bar.addEventListener("click", (event) => {
    event.stopPropagation();
    const trigger = event.target.closest(".tool-trigger");
    const sortButton = event.target.closest("[data-sort]");
    const filterButton = event.target.closest("[data-filter]");
    const clearFilter = event.target.closest("[data-clear-filter]");

    if (trigger) {
      bar.classList.toggle(`open-${trigger.dataset.tool}`);
      bar.classList.remove(trigger.dataset.tool === "filter" ? "open-sort" : "open-filter");
      return;
    }

    if (clearFilter) {
      bar.dataset.filter = "all";
      bar.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item.dataset.filter === "all"));
      applyListTools(bar);
      return;
    }

    if (filterButton) {
      bar.dataset.filter = filterButton.dataset.filter || "all";
      bar.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === filterButton));
      bar.classList.remove("open-filter");
      applyListTools(bar);
      return;
    }

    if (sortButton) {
      bar.dataset.sort = sortButton.dataset.sort || "default";
      bar.querySelectorAll("[data-sort]").forEach((item) => item.classList.toggle("active", item === sortButton));
      bar.classList.remove("open-sort");
      applyListTools(bar);
    }
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".sort-bar.open-filter, .sort-bar.open-sort").forEach((bar) => {
    bar.classList.remove("open-filter", "open-sort");
  });
});

const favoriteLabels = {
  all: ["全部收藏课程", "等级、场景、播客、特集都已按频道整理。"],
  level: ["等级课程收藏", "当前只显示收藏的等级课程。"],
  scene: ["场景课程收藏", "当前只显示收藏的场景课程。"],
  podcast: ["播客收藏", "当前只显示收藏的播客内容。"],
  feature: ["特集收藏", "当前只显示收藏的特集内容。"]
};

function applyFavoriteFilter(filter) {
  const nextFilter = favoriteLabels[filter] ? filter : "all";
  const activeButton = document.querySelector(`[data-favorite-filter="${nextFilter}"]`);

  document.querySelectorAll("[data-favorite-filter]").forEach((item) => item.classList.remove("active"));
  activeButton?.classList.add("active");

  let visibleCount = 0;
  document.querySelectorAll("[data-favorite-channel]").forEach((item) => {
    const visible = nextFilter === "all" || item.dataset.favoriteChannel === nextFilter;
    item.classList.toggle("favorite-hidden", !visible);
    if (visible) visibleCount += 1;
  });

  const countNode = document.querySelector("[data-favorite-count]");
  const labelNode = document.querySelector("[data-favorite-label]");
  const descNode = document.querySelector("[data-favorite-desc]");
  if (countNode) countNode.textContent = visibleCount;
  if (labelNode) labelNode.textContent = favoriteLabels[nextFilter][0];
  if (descNode) descNode.textContent = favoriteLabels[nextFilter][1];
}

document.querySelector(".favorite-filters")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-favorite-filter]");
  if (!button) return;
  applyFavoriteFilter(button.dataset.favoriteFilter);
});

applyFavoriteFilter(document.querySelector(".favorite-filters button.active")?.dataset.favoriteFilter || "all");

document.querySelectorAll(".plan-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".plan-card").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const price = button.querySelector("b")?.textContent;
    const amount = document.querySelector(".pay-footer b");
    if (price && amount) amount.textContent = `¥${price}`;
  });
});

document.querySelectorAll("[data-podcast]").forEach((item) => {
  item.addEventListener("click", () => {
    const podcast = podcasts[Number(item.dataset.podcast)] || podcasts[0];
    document.querySelector("#podcast-title").textContent = podcast.title;
    document.querySelector("#podcast-jp").textContent = podcast.title;
    document.querySelector("#podcast-meta").textContent = podcast.meta;
    document.querySelector("#podcast-topic").textContent = podcast.topic;
    document.querySelector("#podcast-desc").textContent = podcast.desc;
    document.querySelector("#podcast-points").textContent = podcast.points;
    document.querySelector("#podcast-transcript").textContent = podcast.transcript || "字幕内容准备中。";
    setPage("podcast-detail");
  });
});

document.querySelectorAll(".radio-grid button").forEach((button) => {
  button.addEventListener("click", () => {
    button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelectorAll(".auth-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelectorAll("[data-action='open-nickname']").forEach((button) => {
  button.addEventListener("click", () => {
    nicknameModal.classList.add("open");
    nicknameModal.setAttribute("aria-hidden", "false");
  });
});

document.querySelectorAll("[data-action='close-nickname']").forEach((button) => {
  button.addEventListener("click", () => {
    nicknameModal.classList.remove("open");
    nicknameModal.setAttribute("aria-hidden", "true");
  });
});

document.querySelectorAll("[data-action='open-avatar']").forEach((button) => {
  button.addEventListener("click", () => {
    avatarModal.classList.add("open");
    avatarModal.setAttribute("aria-hidden", "false");
  });
});

document.querySelectorAll("[data-action='close-avatar']").forEach((button) => {
  button.addEventListener("click", () => {
    avatarModal.classList.remove("open");
    avatarModal.setAttribute("aria-hidden", "true");
  });
});

document.querySelectorAll(".avatar-grid button").forEach((button) => {
  button.addEventListener("click", () => {
    button.parentElement.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelectorAll("[data-action='confirm-avatar']").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedAvatar = document.querySelector(".avatar-grid button.active");
    const profileAvatar = document.querySelector(".profile-avatar");
    if (selectedAvatar && profileAvatar) {
      profileAvatar.dataset.avatar = selectedAvatar.dataset.avatar;
      profileAvatar.innerHTML = selectedAvatar.innerHTML;
    }
    avatarModal.classList.remove("open");
    avatarModal.setAttribute("aria-hidden", "true");
  });
});

document.querySelectorAll(".toggle").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("active");
    const label = button.closest("article").querySelector("small");
    label.textContent = button.classList.contains("active") ? "开(默认)" : "关";
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "已复制";
    } catch {
      button.textContent = "已复制";
    }

    window.setTimeout(() => {
      button.textContent = "复制";
    }, 1200);
  });
});

document.querySelectorAll("[data-action='favorite-lesson']").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("active");
    button.textContent = button.classList.contains("active") ? "♥" : "♡";
    button.setAttribute("aria-label", button.classList.contains("active") ? "已收藏" : "收藏");
    document.querySelectorAll(".lesson-favorite-item").forEach((item) => {
      item.classList.toggle("show", button.classList.contains("active"));
    });
  });
});

document.querySelectorAll("[data-action='toggle-complete']").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("complete");
    button.textContent = button.classList.contains("complete") ? "学习完成" : "学习取消";
  });
});

const recordingModal = document.querySelector(".recording-modal");

function openRecording() {
  recordingModal?.classList.add("open");
  recordingModal?.setAttribute("aria-hidden", "false");
}

function closeRecording() {
  recordingModal?.classList.remove("open");
  recordingModal?.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".dialogue-list .bubble button:nth-child(2)").forEach((button) => {
  button.addEventListener("pointerdown", openRecording);
  button.addEventListener("pointerup", closeRecording);
  button.addEventListener("pointercancel", closeRecording);
  button.addEventListener("pointerleave", closeRecording);
  button.addEventListener("click", () => {
    openRecording();
    window.setTimeout(closeRecording, 1200);
  });
});
