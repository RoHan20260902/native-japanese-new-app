const pages = Array.from(document.querySelectorAll(".page"));
const navButtons = Array.from(document.querySelectorAll("[data-nav]"));
const sheet = document.querySelector(".sheet");
const logoutModal = document.querySelector(".logout-modal");
const nicknameModal = document.querySelector(".nickname-modal");
const avatarModal = document.querySelector(".avatar-modal");
const ratingModal = document.querySelector(".rating-modal");
const levelRulesModal = document.querySelector(".level-rules-modal");
const levelPlaybackPanel = document.querySelector(".level-playback-panel");
const levelPlaybackProgress = levelPlaybackPanel?.querySelector(".level-now-card span");
const channelPages = ["home", "course", "scene", "feature"];
const authPages = ["login", "register", "verify-code-sent", "forgot-password"];
const APP_VERSION = "member-state-45";
let currentPage = "home";
let interactionCount = 0;
let ratingPromptShown = false;
let noticeRead = false;
let memberActive = false;
let lastLearningPage = null;
const FREE_LEVEL_LESSON_LIMIT = 3;
const FREE_PODCAST_LIMIT = 3;
const DETAIL_FONT_STORAGE_KEY = "nativeDetailFontSize";
const detailFontSizes = ["small", "medium", "large"];

function normalizePreviewVersion() {
  try {
    const url = new URL(window.location.href);
    const currentVersion = url.searchParams.get("v");
    if (currentVersion?.startsWith("member-state-") && currentVersion !== APP_VERSION) {
      url.searchParams.set("v", APP_VERSION);
      window.history.replaceState(null, "", url);
    }
  } catch {
    // Embedded previews may block history updates; the app can still run.
  }
}

normalizePreviewVersion();

try {
  ratingPromptShown = sessionStorage.getItem("nativeRatingPromptDone") === "true";
} catch {
  ratingPromptShown = false;
}

function applyDetailFontSize(size) {
  const normalizedSize = detailFontSizes.includes(size) ? size : "medium";
  document.body.dataset.detailFontSize = normalizedSize;
  document.querySelectorAll("[data-detail-font]").forEach((button) => {
    button.classList.toggle("active", button.dataset.detailFont === normalizedSize);
  });
}

function setDetailFontSize(size) {
  const normalizedSize = detailFontSizes.includes(size) ? size : "medium";
  applyDetailFontSize(normalizedSize);
  if (typeof clearTransientPageState === "function") {
    clearTransientPageState(currentPage);
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  try {
    localStorage.setItem(DETAIL_FONT_STORAGE_KEY, normalizedSize);
  } catch {
    // Ignore storage failures; the current page state still updates.
  }
}

try {
  applyDetailFontSize(localStorage.getItem(DETAIL_FONT_STORAGE_KEY) || "medium");
} catch {
  applyDetailFontSize("medium");
}

function updateMemberLearningEntry() {
  const banner = document.querySelector('.member-banner');
  if (banner) banner.dataset.go = memberActive ? (lastLearningPage || 'course') : 'membership';
  const summary = document.querySelector('[data-resume-summary]');
  const lesson = lastLearningPage && document.querySelector('[data-page="' + lastLearningPage + '"] .lesson-title p');
  if (summary) summary.textContent = lesson ? '上次学习：' + lesson.textContent.trim() : '选择一节课程，开始今天的学习。';
}

function applyMembershipState() {
  document.body.dataset.member = memberActive ? "paid" : "free";
  document.querySelectorAll("[data-member-paid]").forEach((item) => {
    item.hidden = !memberActive;
  });
  document.querySelectorAll("[data-member-free]").forEach((item) => {
    item.hidden = memberActive;
  });
  updateMemberLearningEntry();
  const back = document.querySelector('[data-page="membership"] .page-title .round-btn');
  if (back) {
    back.dataset.go = memberActive ? 'profile' : 'home';
    back.setAttribute('aria-label', memberActive ? '返回我的' : '返回首页');
  }
  applyFreeLevelLessonAccess();
  applyFreePodcastAccess();
}

function setMembershipActive(active) {
  memberActive = active;
  applyMembershipState();
}

function ensureCourseChannelTags(root = document) {
  root.querySelectorAll(".old-level-list article, .grammar-example-list article, .saved-list .favorite-course-card").forEach((item) => {
    const content = item.querySelector(":scope > div");
    if (!content || content.querySelector(".course-channel-tags")) return;
    const tags = document.createElement("div");
    tags.className = "course-channel-tags";
    tags.innerHTML = "<span>等级</span><span>场景</span><span>特集</span>";
    content.appendChild(tags);
  });
}

function closeSheet() {
  document.body.classList.remove("sheet-open");
  sheet?.classList.remove("open");
  sheet?.setAttribute("aria-hidden", "true");
}

function clearTransientPageState(nextPageName) {
  document.querySelector(".app")?.classList.remove("slide-left", "slide-right");
  document.querySelectorAll(".sort-bar.open-filter, .sort-bar.open-sort").forEach((bar) => {
    bar.classList.remove("open-filter", "open-sort");
  });
  document.querySelectorAll(".logout-modal.open, .nickname-modal.open, .avatar-modal.open, .level-rules-modal.open, .recording-modal.open").forEach((modal) => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
  closeSheet();
  if (!nextPageName.startsWith("level-")) closeLevelPlayback();
}

function applyFreeLevelLessonAccess() {
  document.querySelectorAll(".page[data-page^='level-'] .old-level-list, .page[data-page='scene-basic'] .old-level-list, .page[data-page='feature-adverbs'] .old-level-list").forEach((list) => {
    let visibleIndex = 0;

    Array.from(list.children).forEach((item) => {
      const isVisible = !item.hidden;
      // Keep the same three free lessons when filtering or sorting these channels.
      const fixedAccess = list.id === "scene-basic-lessons" || list.id === "feature-adverbs-lessons";
      const lessonIndex = Number(item.querySelector(":scope > span")?.textContent) - 1;
      const isLocked = !memberActive && (fixedAccess
        ? lessonIndex >= FREE_LEVEL_LESSON_LIMIT
        : isVisible && visibleIndex >= FREE_LEVEL_LESSON_LIMIT);
      const statusButton = item.querySelector(":scope > button");

      if (isVisible) visibleIndex += 1;
      item.classList.toggle("member-locked", isLocked);
      item.toggleAttribute("aria-disabled", isLocked);

      if (statusButton && !statusButton.dataset.originalText) {
        statusButton.dataset.originalText = statusButton.textContent.trim();
        statusButton.dataset.originalClass = statusButton.className || "";
      }

      if (statusButton) {
        if (isLocked) {
          statusButton.textContent = "未完成";
          statusButton.classList.add("muted");
        } else {
          statusButton.textContent = statusButton.dataset.originalText || statusButton.textContent;
          statusButton.className = statusButton.dataset.originalClass || "";
        }
      }

      let badge = item.querySelector(".member-lock-badge");
      if (isLocked && !badge) {
        badge = document.createElement("strong");
        badge.className = "member-lock-badge";
        badge.textContent = "会员解锁";
        item.appendChild(badge);
      } else if (!isLocked) {
        badge?.remove();
      }
    });
  });
}

function applyFreePodcastAccess() {
  let visibleIndex = 0;

  document.querySelectorAll("#podcast-list article[data-podcast]").forEach((item) => {
    const isVisible = !item.hidden;
    const isLocked = !memberActive && isVisible && visibleIndex >= FREE_PODCAST_LIMIT;
    const playButton = item.querySelector(":scope > button");
    const status = isLocked ? "未学习" : item.dataset.status === "learned" ? "已学习" : "未学习";
    if (isVisible) visibleIndex += 1;
    item.classList.toggle("member-locked", isLocked);
    item.toggleAttribute("aria-disabled", isLocked);

    let statusBadge = item.querySelector(".podcast-status");
    if (!statusBadge) {
      statusBadge = document.createElement("small");
      statusBadge.className = "podcast-status";
      item.appendChild(statusBadge);
    }
    statusBadge.textContent = status;

    if (playButton && !playButton.dataset.originalText) {
      playButton.dataset.originalText = playButton.textContent.trim();
    }
    if (playButton) {
      playButton.textContent = playButton.dataset.originalText || "▶";
    }

    let badge = item.querySelector(".member-lock-badge");
    if (isLocked && !badge) {
      badge = document.createElement("strong");
      badge.className = "member-lock-badge";
      badge.textContent = "会员解锁";
      item.appendChild(badge);
    } else if (!isLocked) {
      badge?.remove();
    }
  });
}

applyMembershipState();
ensureCourseChannelTags();

const podcasts = [
  {
    title: "日本の車生活について",
    meta: "Ep.89 · 4:20 · 真实语速",
    topic: "交通出行",
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
    topic: "购物消费",
    desc: "从甜品、饭团到季节限定，听懂日本便利店商品更新背后的常用表达。",
    points: "新商品 / 期間限定 / つい買っちゃう / 売り場 / 口コミ"
  },
  {
    title: "雨の日の過ごし方",
    meta: "Ep.87 · 09:42 · 日常表达",
    topic: "天气自然",
    desc: "学习下雨、撑伞、取消计划、在家度过周末时自然会说的话。",
    points: "雨が降っている / 傘を忘れた / 家でゆっくり / 予定を変える",
    dialogue: [
      { speaker: "A", text: "今日は「雨の日の過ごし方」について話してみようかなと思います。", roma: "kyou wa ame no hi no sugoshikata ni tsuite hanashite miyou kana to omoimasu.", note: "今天想聊聊“雨天的度过方式”。" },
      { speaker: "B", text: "あ〜、雨の日ね。最近けっこう多いよね。", roma: "aa, ame no hi ne. saikin kekkou ooi yo ne.", note: "啊，雨天啊。最近还挺多的呢。" },
      { speaker: "A", text: "多いよね。雨の日ってさ、出かける派？ それとも家にいる派？", roma: "ooi yo ne. ame no hi tte sa, dekakeru ha? soretomo ie ni iru ha?", note: "是挺多的。雨天你是出门派，还是待在家派？" },
      { speaker: "B", text: "うーん、基本は家にいるかな（笑）。朝起きて、雨の音が聞こえた瞬間に、「あ、今日はもう出なくていいか」ってなる。", roma: "uun, kihon wa ie ni iru kana. asa okite, ame no oto ga kikoeta shunkan ni, aa kyou wa mou denakute ii ka tte naru.", note: "嗯，基本会待在家吧。早上起来一听到雨声，就会觉得“啊，今天不用出门也行了”。" },
      { speaker: "A", text: "わかる（笑）。予定がなかったら、もう完全に家モードになるよね。", roma: "wakaru. yotei ga nakattara, mou kanzen ni ie moodo ni naru yo ne.", note: "懂。如果没有安排，就完全进入居家模式了。" },
      { speaker: "B", text: "そうそう。コーヒー淹れて、ソファでダラダラしたり、Netflix見たり。", roma: "sou sou. koohii irete, sofa de daradara shitari, Netflix mitari.", note: "对对。泡杯咖啡，在沙发上放松，看看 Netflix。" },
      { speaker: "A", text: "最高じゃん。", roma: "saikou jan.", note: "这也太舒服了吧。" },
      { speaker: "B", text: "最高（笑）。でも、ずっと家にいると、夕方くらいにちょっと外に出たくならない？", roma: "saikou. demo, zutto ie ni iru to, yuugata kurai ni chotto soto ni detaku naranai?", note: "是很舒服。但一直待在家，到了傍晚不会有点想出去吗？" },
      { speaker: "A", text: "あ〜、なるなる。なんか一日何もしてない感じがして。", roma: "aa, naru naru. nanka ichinichi nani mo shitenai kanji ga shite.", note: "会会会。会有种一天什么都没做的感觉。" },
      { speaker: "B", text: "そう！ だから私は、雨がそんなに強くなかったら、近所のカフェとか行く。", roma: "sou! dakara watashi wa, ame ga sonna ni tsuyoku nakattara, kinjo no kafe toka iku.", note: "对！所以如果雨不是特别大，我会去附近的咖啡店之类的地方。" },
      { speaker: "A", text: "へえ〜。雨の日にカフェ、いいね。", roma: "hee. ame no hi ni kafe, ii ne.", note: "哦。雨天去咖啡店，挺好。" },
      { speaker: "B", text: "意外といいよ。晴れてる日より人が少ないし、窓から雨を見ながらコーヒー飲むの、けっこう好き。", roma: "igai to ii yo. hareteru hi yori hito ga sukunai shi, mado kara ame o minagara koohii nomu no, kekkou suki.", note: "意外地不错。人比晴天少，而且我挺喜欢一边从窗户看雨一边喝咖啡。" },
      { speaker: "A", text: "あ、それはわかる。雨の日って、外にいると嫌なんだけど、室内から見る雨はけっこう好きなんだよね。", roma: "a, sore wa wakaru. ame no hi tte, soto ni iru to iya nan dakedo, shitsunai kara miru ame wa kekkou suki nan da yo ne.", note: "啊，这个我懂。雨天人在外面会觉得麻烦，但从室内看雨就挺喜欢的。" },
      { speaker: "B", text: "そうなの（笑）。濡れなければ好き。", roma: "sou na no. nurenakereba suki.", note: "就是这样。只要不被淋湿就喜欢。" },
      { speaker: "A", text: "それ大事（笑）。", roma: "sore daiji.", note: "这点很重要。" },
      { speaker: "B", text: "そっちは？ 家で何してるの？", roma: "socchi wa? ie de nani shiteru no?", note: "那你呢？在家会做什么？" },
      { speaker: "A", text: "私はね、雨の日はけっこう料理するかも。", roma: "watashi wa ne, ame no hi wa kekkou ryouri suru kamo.", note: "我的话，雨天可能会比较常做饭。" },
      { speaker: "B", text: "え、偉い。", roma: "e, erai.", note: "诶，好厉害。" },
      { speaker: "A", text: "いやいや（笑）。普段は面倒くさくて作らないようなものを、時間かけて作ったり。", roma: "iya iya. fudan wa mendou kusakute tsukuranai you na mono o, jikan kakete tsukuttari.", note: "没有啦。会花时间做一些平时嫌麻烦不会做的东西。" },
      { speaker: "B", text: "例えば？", roma: "tatoeba?", note: "比如呢？" },
      { speaker: "A", text: "カレーとか、スープとか。煮込む系。", roma: "karee toka, suupu toka. nikomu kei.", note: "咖喱、汤之类的。需要炖煮的那种。" },
      { speaker: "B", text: "あ〜、雨の日にスープいいね。", roma: "aa, ame no hi ni suupu ii ne.", note: "啊，雨天喝汤不错。" },
      { speaker: "A", text: "でしょ？ 外がちょっと暗くて、雨の音がして、家の中であったかいもの食べるのが好き。", roma: "desho? soto ga chotto kurakute, ame no oto ga shite, ie no naka de attakai mono taberu no ga suki.", note: "对吧？外面有点暗，听着雨声，在家吃热乎的东西，我很喜欢。" },
      { speaker: "B", text: "いいねえ。なんか雨の日も悪くない気がしてきた。", roma: "ii nee. nanka ame no hi mo waruku nai ki ga shite kita.", note: "不错啊。感觉雨天好像也没那么糟了。" },
      { speaker: "A", text: "ね。雨だから何もできない、じゃなくて、雨の日だからできることもあるよね。", roma: "ne. ame dakara nani mo dekinai, janakute, ame no hi dakara dekiru koto mo aru yo ne.", note: "是吧。不是因为下雨就什么都做不了，而是也有些事正因为雨天才适合做。" },
      { speaker: "B", text: "うん。まあ、洗濯物だけは困るけどね（笑）。", roma: "un. maa, sentakumono dake wa komaru kedo ne.", note: "嗯。不过洗衣服这件事确实会让人头疼。" },
      { speaker: "A", text: "それは本当にそう（笑）。", roma: "sore wa hontou ni sou.", note: "这个真的没错。" },
      { speaker: "B", text: "ということで、今日は「雨の日の過ごし方」について話してみました。", roma: "to iu koto de, kyou wa ame no hi no sugoshikata ni tsuite hanashite mimashita.", note: "那么，今天我们聊了“雨天的度过方式”。" },
      { speaker: "A", text: "みなさんは雨の日、何して過ごしますか？", roma: "minasan wa ame no hi, nani shite sugoshimasu ka?", note: "大家雨天会怎么度过呢？" },
      { speaker: "B", text: "ぜひ、自分なりの雨の日の楽しみ方を見つけてみてください。", roma: "zehi, jibun nari no ame no hi no tanoshimikata o mitsukete mite kudasai.", note: "请一定试着找到属于自己的雨天乐趣。" },
      { speaker: "A", text: "それでは、また次回。", roma: "sore dewa, mata jikai.", note: "那么，我们下次再见。" },
      { speaker: "B", text: "またね〜。", roma: "mata ne.", note: "再见啦。" }
    ]
  },
  {
    title: "朝のカフェで聞こえる日本語",
    meta: "Ep.86 · 12:18 · 咖啡店",
    topic: "餐厅餐饮",
    desc: "模拟早高峰咖啡店里的点单、外带、找座位和简单寒暄。",
    points: "店内で / 持ち帰り / 空いてますか / いつもの / 少々お待ちください"
  },
  {
    title: "職場で使う「一応」と「念のため」",
    meta: "Ep.85 · 15:04 · 职场语感",
    topic: "职场沟通",
    desc: "拆解一応、念のため、確認します在真实工作沟通里的语气差异。",
    points: "一応 / 念のため / 確認します / 共有します / 大丈夫そうです"
  },
  {
    title: "週末、何してた?",
    meta: "Ep.84 · 10:55 · 社交闲聊",
    topic: "社交聊天",
    desc: "练习从一句周末做了什么，自然延伸到兴趣、天气和近况。",
    points: "週末 / 何してた / いいですね / そうなんだ / 最近"
  },
  {
    title: "病院で症状を説明する",
    meta: "Ep.83 · 13:27 · 医疗",
    topic: "医疗健康",
    desc: "用简单清楚的日语描述头痛、发烧、胃不舒服和服药情况。",
    points: "熱があります / 頭が痛い / 胃の調子が悪い / 薬 / いつから"
  },
  {
    title: "電車が遅れた時の会話",
    meta: "Ep.82 · 08:48 · 交通出行",
    topic: "交通出行",
    desc: "练习电车延误、换乘失败、向对方说明迟到原因的自然说法。",
    points: "電車が遅れています / 遅れます / 乗り換え / 間に合わない"
  },
  {
    title: "日本人のあいづち入門",
    meta: "Ep.81 · 16:11 · 真实会话",
    topic: "基础沟通",
    desc: "掌握常见附和语，让听起来更像在自然参与对话。",
    points: "うん / へえ / なるほど / たしかに / そうなんですね"
  },
  {
    title: "スーパーでよく聞く店内放送",
    meta: "Ep.80 · 09:58 · 购物听力",
    topic: "购物消费",
    desc: "训练超市广播、特价信息、收银提示中常出现的关键词。",
    points: "本日限り / セール / レジ袋 / ポイントカード / お買い得"
  }
];

function setPage(name) {
  const currentIndex = channelPages.indexOf(currentPage);
  const nextIndex = channelPages.indexOf(name);
  const isChannelMove = currentIndex >= 0 && nextIndex >= 0;
  const nextPage = pages.find((page) => page.dataset.page === name);

  if (!nextPage) return;
  clearTransientPageState(name);
  document.querySelector(".phone")?.classList.toggle("auth-mode", authPages.includes(name));

  if (isChannelMove) {
    document.querySelector(".app").classList.toggle("slide-left", nextIndex > currentIndex);
    document.querySelector(".app").classList.toggle("slide-right", nextIndex < currentIndex);
  }

  pages.forEach((page) => {
    const isActive = page === nextPage;
    page.classList.toggle("active", isActive);
    page.setAttribute("aria-hidden", isActive ? "false" : "true");
    if (isActive) page.scrollTop = 0;
  });
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  navButtons.forEach((button) => {
    button.classList.toggle("active", !authPages.includes(name) && button.dataset.nav === name);
  });

  document.querySelectorAll(".home-cats button[data-go]").forEach((button) => {
    button.classList.toggle("active", button.dataset.go === name);
  });

  currentPage = name;
  if (['lesson-detail', 'n3-lesson-detail', 'n2-lesson-detail'].includes(name)) {
    lastLearningPage = name;
    updateMemberLearningEntry();
  }
}

function openLevelPlayback(button) {
  const levelPage = button.closest(".page");
  const progressText = levelPage?.querySelector(".level-list-head b")?.textContent.trim();
  if (progressText && levelPlaybackProgress) levelPlaybackProgress.textContent = progressText;
  pages.forEach((page) => page.classList.remove("level-playing"));
  levelPage?.classList.add("level-playing");
  levelPage?.scrollTo({ top: 0, behavior: "smooth" });
  levelPlaybackPanel?.classList.add("open");
  levelPlaybackPanel?.setAttribute("aria-hidden", "false");
}

function closeLevelPlayback() {
  levelPlaybackPanel?.classList.remove("open");
  levelPlaybackPanel?.setAttribute("aria-hidden", "true");
  pages.forEach((page) => page.classList.remove("level-playing"));
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setPage(button.dataset.nav));
});

function handleGoButton(button) {
  if (!button?.dataset?.go) return;
  if (button.dataset.action === "activate-member" || button.dataset.go === "membership-success") {
    setMembershipActive(true);
  }
  setPage(button.dataset.go);
}

function activateMembership(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();
  setMembershipActive(true);
  setPage("membership-success");
}

document.querySelectorAll("[data-action='activate-member']").forEach((button) => {
  button.addEventListener("pointerup", activateMembership);
  button.addEventListener("click", activateMembership);
});

document.addEventListener("click", (event) => {
  const target = event.target?.closest ? event.target : event.target?.parentElement;
  const lockedLesson = target?.closest?.(".old-level-list article.member-locked");
  if (lockedLesson) {
    event.preventDefault();
    event.stopPropagation();
    setPage("membership");
    return;
  }
  const lockedPodcast = target?.closest?.("#podcast-list article.member-locked");
  if (lockedPodcast) {
    event.preventDefault();
    event.stopPropagation();
    setPage("membership");
    return;
  }
  const button = target?.closest?.("[data-go]");
  if (!button) return;
  handleGoButton(button);
}, true);

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

const grammarCourseData = {
  "〜までもない": [
    {
      title: "言うまでもない",
      theme: "恋爱约会",
      desc: "「私のこと、本当に好き?」这节课程，学习明显到不用说的自然回应。",
      plays: 1,
      target: "lesson-detail"
    },
    {
      title: "説明するまでもない",
      theme: "职场确认",
      desc: "在会议和汇报中表达“这个不用特别说明也明白”的语气。",
      plays: 0
    },
    {
      title: "聞くまでもない",
      theme: "日常判断",
      desc: "看情况就能判断时，用自然日语表达“没必要再问”。",
      plays: 0
    }
  ]
};

function normalizeGrammarText(value) {
  return value.trim().replace(/^~/, "〜");
}

function getGrammarMeta(grammar, title) {
  const normalized = normalizeGrammarText(grammar);
  return grammarMetaData[normalized] || {
    cn: "释义准备中",
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
  const meta = getGrammarMeta(normalized, normalized);
  const data = grammarExampleData[normalized] || {
    meaning: "该语法的例句内容准备中。",
    examples: [
      { jp: `${normalized} を使った例文を準備中です。`, kana: "れいぶんを じゅんびちゅうです。", cn: "这个语法的例句正在准备中。" }
    ]
  };
  document.querySelector("#grammar-example-title").textContent = normalized;
  document.querySelector("#grammar-example-subtitle").textContent = `${level} · 关联课程`;
  document.querySelector("#grammar-example-pattern").textContent = normalized;
  document.querySelector("#grammar-example-cn").textContent = meta.cn || data.meaning;
  const exampleList = document.querySelector("#grammar-example-list");
  const exampleCount = document.querySelector("#grammar-example-count");
  const courses = grammarCourseData[normalized] || data.examples.map((example, index) => ({
    title: example.jp,
    theme: `${level} 主题课程`,
    desc: example.cn,
    plays: index === 0 ? 1 : 0
  }));
  if (exampleCount) exampleCount.textContent = `${courses.length}个课程`;
  exampleList.innerHTML = courses.map((course, index) => `
    <article data-status="${course.plays > 0 ? "learned" : "unlearned"}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3 ${course.target ? `data-course-target="${course.target}"` : ""}>${course.title}</h3>
        <p>${normalized}</p>
      </div>
      <em>▶ ${course.plays}</em>
      <button class="${course.plays > 0 ? "" : "muted"}">${course.plays > 0 ? "已完成" : "未学习"}</button>
    </article>
  `).join("");
  ensureCourseChannelTags(exampleList);
  exampleList.querySelectorAll("[data-course-target]").forEach((item) => {
    item.addEventListener("click", () => setPage(item.dataset.courseTarget));
  });
  setPage("grammar-examples");
}

document.querySelectorAll(".old-level-list article p, .lesson-tags .grammar-tag-row span, .favorite-course-card p b").forEach((item) => {
  item.dataset.grammarLink = "true";
});

document.addEventListener("click", (event) => {
  const grammarTag = event.target.closest("[data-grammar-link]");
  if (!grammarTag) return;
  event.preventDefault();
  event.stopPropagation();
  const sourceList = grammarTag.closest(".old-level-list");
  const sourcePage = grammarTag.closest(".page");
  const { pageName, level } = sourceList
    ? getGrammarLevelInfo(sourceList)
    : {
      pageName: sourcePage?.dataset.page || "lesson-detail",
      level: sourcePage?.querySelector(".page-title p")?.textContent.split("·")[0].trim() || "课程"
    };
  lastGrammarLevelPage = pageName;
  renderGrammarExamples(grammarTag.textContent, level);
}, true);

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
    document.body.classList.add("sheet-open");
    noticeRead = true;
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden", "false");
  });
});

document.querySelectorAll("[data-action='close-sheet']").forEach((button) => {
  button.addEventListener("click", () => {
    closeSheet();
  });
});

document.querySelectorAll("[data-action='open-level-rules']").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    levelRulesModal?.classList.add("open");
    levelRulesModal?.setAttribute("aria-hidden", "false");
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    trigger.click();
  });
});

document.querySelectorAll("[data-action='close-level-rules']").forEach((button) => {
  button.addEventListener("click", () => {
    levelRulesModal?.classList.remove("open");
    levelRulesModal?.setAttribute("aria-hidden", "true");
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
    if (button.dataset.action === "confirm-logout") setPage("register");
  });
});

document.querySelectorAll("[data-action='play']").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.closest(".level-list-head")) openLevelPlayback(button);

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

document.querySelectorAll("[data-action='close-level-playback']").forEach((button) => {
  button.addEventListener("click", closeLevelPlayback);
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
  const status = item.classList.contains("member-locked") ? "unlearned" : item.dataset.status || "";
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
  default: "推荐",
  "unlearned-first": "未学习优先",
  "recent-desc": "最近学习"
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
  const availableSorts = ["default", "unlearned-first", "recent-desc"];
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
  chips.innerHTML = filterType === "all" ? "" : `<button data-clear-filter>${filterText} ×</button>`;
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
    return a.meta.index - b.meta.index;
  });

  sorted.forEach(({ item, meta }) => {
    const visible = filterType === "all" || (filterType === "unlearned" && meta.isUnlearned) || (filterType === "learned" && meta.isComplete);
    item.hidden = item.classList.contains("favorite-hidden") || !visible;
    list.appendChild(item);
  });
  updateToolChips(bar);
  applyFreeLevelLessonAccess();
  applyFreePodcastAccess();
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
  course: ["课程收藏进度", "只显示已收藏的课程内容，按学习路径继续复习"],
  podcast: ["播客收藏进度", "只显示已收藏的播客节目，训练真实语速"]
};

function applyFavoriteFilter(filter) {
  const nextFilter = favoriteLabels[filter] ? filter : "course";
  const activeButton = document.querySelector(`[data-favorite-filter="${nextFilter}"]`);

  document.querySelectorAll("[data-favorite-filter]").forEach((item) => item.classList.remove("active"));
  activeButton?.classList.add("active");

  let visibleCount = 0;
  let learnedCount = 0;
  document.querySelectorAll("[data-favorite-channel]").forEach((item) => {
    const visible = item.dataset.favoriteChannel === nextFilter;
    item.classList.toggle("favorite-hidden", !visible);
    if (visible) visibleCount += 1;
    if (visible && item.dataset.status === "learned") learnedCount += 1;
  });

  const countNode = document.querySelector("[data-favorite-count]");
  const labelNode = document.querySelector("[data-favorite-label]");
  const descNode = document.querySelector("[data-favorite-desc]");
  const progressNode = document.querySelector("[data-favorite-progress]");
  if (countNode) countNode.textContent = visibleCount;
  if (labelNode) labelNode.textContent = favoriteLabels[nextFilter][0];
  if (descNode) descNode.textContent = favoriteLabels[nextFilter][1];
  if (progressNode) {
    progressNode.style.width = `${Math.max(8, Math.round((learnedCount / Math.max(visibleCount, 1)) * 100))}%`;
  }

  const favoriteSortBar = document.querySelector(".favorite-tools .sort-bar");
  if (favoriteSortBar) {
    favoriteSortBar.classList.remove("open-filter", "open-sort");
    applyListTools(favoriteSortBar);
  }
}

document.querySelector(".favorite-filters")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-favorite-filter]");
  if (!button) return;
  applyFavoriteFilter(button.dataset.favoriteFilter);
});

applyFavoriteFilter(document.querySelector(".favorite-filters button.active")?.dataset.favoriteFilter || "course");

document.querySelectorAll("[data-detail-font]").forEach((button) => {
  button.addEventListener("click", () => {
    setDetailFontSize(button.dataset.detailFont);
  });
});

document.querySelectorAll(".plan-card").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".plan-card").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const price = button.querySelector("b")?.textContent;
    const amount = document.querySelector(".pay-footer b");
    if (price && amount) amount.textContent = `¥${price}`;
  });
});

function openPodcastDetail(index) {
  const podcastItem = document.querySelector(`[data-podcast="${index}"]`);
  if (podcastItem?.classList.contains("member-locked")) {
    setPage("membership");
    return;
  }
  const podcast = podcasts[Number(index)] || podcasts[0];
  const transcriptNode = document.querySelector("#podcast-transcript");
  const dialogueNode = document.querySelector("#podcast-dialogue");
  const duration = podcast.meta.split("·").map((item) => item.trim()).find((item) => /\d+:\d+/.test(item)) || podcast.meta;
  const spokenDuration = duration.replace(/^(\d+):(\d+)$/, (_, minutes, seconds) => `${Number(minutes)}分${Number(seconds)}秒`);
  document.querySelector("#podcast-title").textContent = podcast.title;
  document.querySelector("#podcast-jp").textContent = podcast.title;
  document.querySelector("#podcast-meta").textContent = spokenDuration;
  document.querySelector("#podcast-topic").textContent = podcast.topic;
  document.querySelector("#podcast-desc").textContent = podcast.desc;
  document.querySelector("#podcast-points").textContent = podcast.points;
  if (podcast.dialogue && podcast.dialogue.length) {
    transcriptNode.hidden = true;
    dialogueNode.hidden = false;
    dialogueNode.innerHTML = podcast.dialogue.map((line, lineIndex) => {
      const isRight = lineIndex % 2 === 1;
      const speakerClass = isRight ? "boy" : "girl";
      const avatar = isRight ? "./assets/avatar-male.png" : "./assets/avatar-female.png";
      const speakerLabel = isRight ? "男性说话人" : "女性说话人";
      const speaker = `<div class="speaker ${speakerClass}" aria-label="${speakerLabel}"><img src="${avatar}" alt="" /></div>`;
      return `
      <article class="podcast-bubble ${isRight ? "right" : "left"}">
        ${isRight ? "" : speaker}
        <div>
          <h3>${line.text}</h3>
          <p>${line.roma || ""}</p>
          <small>${line.note}</small>
          <div><button data-action="play">▶ 播放</button></div>
        </div>
        ${isRight ? speaker : ""}
      </article>
    `;
    }).join("");
  } else {
    dialogueNode.hidden = true;
    dialogueNode.innerHTML = "";
    transcriptNode.hidden = false;
    transcriptNode.textContent = podcast.transcript || "字幕内容准备中。";
  }
  setPage("podcast-detail");
}

document.querySelectorAll("[data-podcast]").forEach((item) => {
  item.addEventListener("click", () => {
    if (item.classList.contains("member-locked")) {
      setPage("membership");
      return;
    }
    openPodcastDetail(item.dataset.podcast);
  });
});

document.querySelectorAll("[data-notice-podcast]").forEach((item) => {
  item.addEventListener("click", () => {
    closeSheet();
    openPodcastDetail(item.dataset.noticePodcast);
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
    const registerHint = button.closest(".auth-page")?.querySelector(".auth-register-phone-hint");
    if (registerHint) registerHint.hidden = !button.textContent.includes("手机");
  });
});

document.querySelectorAll(".phone-auth-input").forEach((input) => {
  input.addEventListener("focus", () => {
    const hint = input.closest("label")?.querySelector(".auth-field-hint");
    if (hint) hint.hidden = false;
  });
  input.addEventListener("click", () => {
    const hint = input.closest("label")?.querySelector(".auth-field-hint");
    if (hint) hint.hidden = false;
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
