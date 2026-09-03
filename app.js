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

try {
  ratingPromptShown = sessionStorage.getItem("nativeRatingPromptDone") === "true";
} catch {
  ratingPromptShown = false;
}

const podcasts = [
  {
    title: "日本の車生活について",
    meta: "Ep.89 · 14:20 · 真实语速",
    topic: "通勤、停车、买车文化",
    desc: "围绕地方生活中的开车通勤、停车费、买车和日常用车习惯，训练自然速度下的关键词捕捉。",
    points: "駐車場 / 通勤 / 車がないと不便 / 維持費 / 地方ではよくある"
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
  button.addEventListener("click", () => setPage(button.dataset.go));
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
  const isUnlearned = statusButton?.classList.contains("muted") || text.includes("未学习");
  const isComplete = text.includes("已完成") && !isUnlearned;

  return {
    index,
    title,
    total: slash ? Number(slash[2]) : totalText ? Number(totalText[1]) : 0,
    learned: slash ? Number(slash[1]) : learnedText ? Number(learnedText[1]) : percentText ? Number(percentText[1]) : 0,
    plays: playsText ? Number(playsText[1] || playsText[2]) : 0,
    isUnlearned,
    isComplete
  };
}

document.querySelectorAll(".sort-bar").forEach((bar) => {
  const list = document.getElementById(bar.dataset.sortTarget);
  if (!list) return;

  const sortableItems = Array.from(list.children).map((item, index) => ({
    item,
    meta: parseSortMeta(item, index)
  }));

  const sortLabel = bar.querySelector("span");
  const activeButton = bar.querySelector("button.active");
  if (sortLabel && activeButton) sortLabel.textContent = `排序：${activeButton.textContent.trim()}`;

  bar.addEventListener("click", (event) => {
    event.stopPropagation();
    if (event.target === bar || event.target === sortLabel) bar.classList.toggle("open");
  });

  bar.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      if (!bar.classList.contains("open")) {
        bar.classList.add("open");
        return;
      }

      const sortType = button.dataset.sort;
      const sorted = [...sortableItems].sort((a, b) => {
        if (sortType === "total-desc") return b.meta.total - a.meta.total || a.meta.index - b.meta.index;
        if (sortType === "learned-desc") return b.meta.learned - a.meta.learned || a.meta.index - b.meta.index;
        if (sortType === "unlearned-first") return Number(b.meta.isUnlearned) - Number(a.meta.isUnlearned) || a.meta.index - b.meta.index;
        if (sortType === "complete-first") return Number(b.meta.isComplete) - Number(a.meta.isComplete) || a.meta.index - b.meta.index;
        if (sortType === "plays-desc") return b.meta.plays - a.meta.plays || a.meta.index - b.meta.index;
        if (sortType === "name-asc") return a.meta.title.localeCompare(b.meta.title, "zh-Hans-u-co-pinyin") || a.meta.index - b.meta.index;
        return a.meta.index - b.meta.index;
      });

      bar.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      if (sortLabel) sortLabel.textContent = `排序：${button.textContent.trim()}`;
      bar.classList.remove("open");
      sorted.forEach(({ item }) => list.appendChild(item));
    });
  });
});

document.addEventListener("click", () => {
  document.querySelectorAll(".sort-bar.open").forEach((bar) => bar.classList.remove("open"));
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
