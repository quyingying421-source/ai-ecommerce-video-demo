// =========================================================
// JS 模块索引
// - 页面切换
// - 弹窗打开关闭
// - 视频广场交互
// - 创建项目生成流程
// - 音色库交互
// =========================================================

// 页面切换
const titles = {
  plaza: ["视频广场", "浏览电商视频模板、成片案例与可复用创作方案"],
  project: ["创建项目", "选择商品、模板、模特和音色，配置视频生成任务"],
  materials: ["商品素材库", "管理商品图、视频片段、卖点文本和平台适配素材"],
  models: ["模特库", "维护 AI 模特、场景偏好和商品适配范围"],
  voices: ["音色库", "管理口播音色、语速、情绪与授权状态"],
  tasks: ["任务记录", "查看视频生成、素材处理、模特生成和裂变任务"],
  blank: ["预留模块", "该菜单为统一平台预留模块，当前 Demo 暂未配置内容"]
};

function clearNavActive() {
  document.querySelectorAll(".nav button, .nav-label").forEach(item => item.classList.remove("active"));
}

function show(page, source) {
  document.querySelectorAll(".page").forEach(item => item.classList.toggle("active", item.dataset.page === page));
  clearNavActive();
  if (source) source.classList.add("active");

  const title = source && source.dataset.title ? [source.dataset.title, titles.blank[1]] : titles[page];
  const pageTitle = document.getElementById("pageTitle");
  const pageDesc = document.getElementById("pageDesc");
  if (pageTitle) pageTitle.textContent = title[0];
  if (pageDesc) pageDesc.textContent = title[1];

  const blankTitle = document.getElementById("blankTitle");
  if (blankTitle && page === "blank") blankTitle.textContent = title[0];
}

function getGroupItems(group) {
  const items = [];
  let current = group.nextElementSibling;
  while (current && !current.classList.contains("nav-group")) {
    if (!current.classList.contains("nav-divider")) items.push(current);
    current = current.nextElementSibling;
  }
  return items;
}

function setGroupExpanded(group, expanded) {
  group.classList.toggle("expanded", expanded);
  group.classList.toggle("collapsed", !expanded);
  getGroupItems(group).forEach(item => item.classList.toggle("nav-hidden", !expanded));
}

function getSubgroupItems(group) {
  const items = [];
  let current = group.nextElementSibling;
  while (current && current.classList.contains("nav-subitem")) {
    items.push(current);
    current = current.nextElementSibling;
  }
  return items;
}

function setSubgroupExpanded(group, expanded) {
  group.classList.toggle("expanded", expanded);
  group.classList.toggle("collapsed", !expanded);
  getSubgroupItems(group).forEach(item => item.classList.toggle("nav-hidden", !expanded));
}

document.getElementById("nav").addEventListener("click", event => {
  const subgroup = event.target.closest(".nav-subgroup");
  if (subgroup) {
    setSubgroupExpanded(subgroup, subgroup.classList.contains("collapsed"));
    return;
  }

  const group = event.target.closest(".nav-group");
  if (group) {
    setGroupExpanded(group, group.classList.contains("collapsed"));
    return;
  }

  const pageButton = event.target.closest("button[data-page]");
  if (pageButton) show(pageButton.dataset.page, pageButton);
});

// 弹窗打开关闭
let productUploadTimer;

function closeModals() {
  document.querySelectorAll(".modal-backdrop.active").forEach(panel => panel.classList.remove("active"));
  clearTimeout(productUploadTimer);
}

// 音色库交互
function updateVoiceModalMode(trigger) {
  const panel = document.querySelector('[data-modal-panel="voice-upload"]');
  if (!panel) return;
  const isEdit = Boolean(trigger?.classList?.contains("voice-edit"));
  panel.dataset.voiceMode = isEdit ? "edit" : "upload";
  const title = panel.querySelector("[data-voice-modal-title]");
  if (title) title.textContent = isEdit ? "编辑音色" : "上传音色";
}

function setActiveVoicePlay(trigger) {
  if (trigger.classList.contains("is-playing")) {
    trigger.classList.remove("is-playing");
    const currentLabel = trigger.querySelector("span");
    if (currentLabel) currentLabel.textContent = "播放";
    return;
  }

  document.querySelectorAll('.page[data-page="voices"] .voice-play.is-playing').forEach(button => {
    if (button === trigger) return;
    button.classList.remove("is-playing");
    const label = button.querySelector("span");
    if (label) label.textContent = "播放";
  });
  trigger.classList.add("is-playing");
  const label = trigger.querySelector("span");
  if (label) label.textContent = "播放中";
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "未知大小";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function renderVoiceAudioFile(input) {
  const uploader = input.closest("[data-voice-audio-uploader]");
  if (!uploader) return;
  const file = input.files && input.files[0];
  const name = uploader.querySelector("[data-voice-audio-name]");
  const meta = uploader.querySelector("[data-voice-audio-meta]");
  if (!file) {
    uploader.classList.remove("has-file");
    if (name) name.textContent = "";
    if (meta) meta.textContent = "";
    return;
  }
  uploader.classList.add("has-file");
  if (name) name.textContent = file.name;
  if (meta) meta.textContent = `已选择 1 个文件 · ${formatFileSize(file.size)} · MP3`;
}

// 新增模特弹窗交互
let modelCreateTimer;

function getModelCreateModal() {
  return document.querySelector('[data-modal-panel="model-create"] .model-create-modal');
}

function setModelCreateSteps(panel, state) {
  const analysis = panel.querySelector('[data-model-step="analysis"]');
  const five = panel.querySelector('[data-model-step="five"]');
  [analysis, five].forEach(step => step?.classList.remove("active", "complete"));
  if (["idle", "analyzing"].includes(state)) analysis?.classList.add("active");
  if (["analyzed", "generating", "complete"].includes(state)) analysis?.classList.add("complete");
  if (state === "generating") five?.classList.add("active");
  if (state === "complete") five?.classList.add("complete");
}

function setModelCreateFields(panel, mode) {
  const values = {
    name: "女性6岁甜美休闲/田园风",
    gender: "女性 / 7",
    style: "甜美休闲风、亚洲、真实感",
    category: "童装、亲子用品、生活配饰"
  };
  const shouldClear = mode === "idle";
  const editable = mode === "analyzed";
  Object.entries(values).forEach(([key, value]) => {
    const field = panel.querySelector(`[data-model-field="${key}"]`);
    if (!field) return;
    if (shouldClear) field.value = "";
    if (mode === "analyzed") field.value = value;
    field.disabled = !editable;
  });
}

function setModelCreateState(state) {
  const panel = getModelCreateModal();
  if (!panel) return;
  panel.dataset.modelCreateState = state;
  setModelCreateSteps(panel, state);
  setModelCreateFields(panel, state);

  const primary = panel.querySelector("[data-model-create-primary]");
  const dismiss = panel.querySelector("[data-dismiss]");
  if (primary) {
    const labelMap = {
      idle: "生成五视图",
      analyzing: "深度分析中...",
      analyzed: "生成五视图",
      generating: "正在生成五视图...",
      complete: "确定创建"
    };
    primary.textContent = labelMap[state] || "生成五视图";
    primary.disabled = ["idle", "analyzing", "generating"].includes(state);
  }
  if (dismiss) dismiss.textContent = state === "complete" ? "关闭" : "取消";
}

function resetModelCreateModal() {
  clearTimeout(modelCreateTimer);
  setModelCreateState("idle");
}

function startModelImageAnalysis() {
  clearTimeout(modelCreateTimer);
  setModelCreateState("analyzing");
  modelCreateTimer = setTimeout(() => {
    setModelCreateState("analyzed");
    showToast("人像分析完成");
  }, 1300);
}

function startModelFiveViewGeneration() {
  clearTimeout(modelCreateTimer);
  setModelCreateState("generating");
  modelCreateTimer = setTimeout(() => {
    setModelCreateState("complete");
    showToast("五视图生成完成");
  }, 1800);
}

function addModelEditTag(input) {
  const value = input.value.trim();
  if (!value) return;
  const list = input.closest(".form-field")?.querySelector("[data-model-edit-tags]");
  if (!list) return;
  const exists = Array.from(list.querySelectorAll(".model-edit-tag")).some(tag => tag.firstChild?.textContent?.trim() === value);
  if (exists) {
    input.value = "";
    return;
  }
  const tag = document.createElement("button");
  tag.className = "model-edit-tag";
  tag.type = "button";
  tag.append(document.createTextNode(value));
  const close = document.createElement("span");
  close.setAttribute("aria-hidden", "true");
  close.textContent = "×";
  tag.append(close);
  list.append(tag);
  input.value = "";
}

function openModal(name, trigger) {
  closeModals();
  if (name === "voice-upload") updateVoiceModalMode(trigger);
  if (name === "model-create") resetModelCreateModal();
  if (name === "product-upload") resetProductUploadModal();
  if (name === "product-edit") applyProductDetailData();
  const panel = document.querySelector(`[data-modal-panel="${name}"]`);
  if (panel) {
    if (name === "product-upload") {
      const activeCategory = panel.querySelector("[data-upload-category].active")?.dataset.uploadCategory || "服装";
      updateUploadSlots(activeCategory, panel);
    }
    panel.classList.add("active");
  }
}

function hydrateVideoDetail(trigger) {
  if (!trigger) return;
  const image = trigger.querySelector(".poster-image");
  const title = trigger.querySelector(".poster-title")?.textContent?.trim() || "无袖背心阔腿裤简约穿搭";
  const category = trigger.querySelector(".poster-category")?.textContent?.trim() || "服装";
  const titleEl = document.querySelector("[data-video-detail-title]");
  const coverEl = document.querySelector("[data-video-detail-cover]");
  const categoryEl = document.querySelector("[data-video-detail-category]");
  const productEl = document.querySelector("[data-video-detail-product]");
  const sellingEl = document.querySelector("[data-video-detail-selling]");
  const topicEl = document.querySelector("[data-video-detail-topic]");
  const sceneEl = document.querySelector("[data-video-detail-scene]");
  const scriptEl = document.querySelector("[data-video-detail-script]");
  const cta = document.querySelector(".video-detail-cta");
  const isKids = category.includes("童");
  if (titleEl) titleEl.textContent = title;
  if (coverEl && image) coverEl.src = image.src;
  if (categoryEl) categoryEl.textContent = category;
  if (productEl) productEl.textContent = isKids ? "儿童夏季穿搭单品" : "女生夏季轻薄外套";
  if (sellingEl) sellingEl.textContent = isKids ? "亲肤舒适、活力百搭、适合出街和亲子日常场景。" : "防晒通勤、轻薄透气、显白显瘦、适配街拍和日常出行场景。";
  if (topicEl) topicEl.textContent = title;
  if (sceneEl) sceneEl.textContent = isKids
    ? "穿搭：一位活力自然的儿童模特穿着夏季单品，在街区、公园和亲子出行场景中自然走动。镜头包含正面出场、侧身转场、面料细节和步行动作，整体氛围明亮轻快，突出商品上身效果和日常搭配价值。"
    : "穿搭：一位身材高挑、气质清爽的模特穿着夏季轻薄外套，搭配短裙或阔腿裤，在街区、公园和通勤路线自然走动。镜头包含正面出场、侧身转场、面料细节、包装配饰和步行动作，整体氛围干净明亮，突出商品上身效果和日常搭配价值。";
  if (scriptEl) scriptEl.textContent = isKids
    ? "夏天出门要轻松也要好看，这一套穿起来舒服不闷，跑跳活动都自在。日常出街、亲子旅行都很合适，随手一搭就有清爽活力感。"
    : "夏天出门不想晒黑，也不想穿得闷热，这一件轻薄外套刚好解决。版型利落不挑身材，通勤、逛街、旅行都能搭，随手一穿就有清爽时尚感。";
  if (cta) {
    cta.dataset.resourceLabel = title;
    cta.dataset.resourceMeta = `已选择视频广场模板：${title}，可进入创建项目复刻同款`;
  }
}

let toastTimer;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("active");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("active"), 1800);
}

// 任务记录交互
function applyTaskFilters() {
  const status = document.querySelector("[data-task-status].featured")?.dataset.taskStatus || "all";
  const category = document.querySelector("#taskTabs .task-tab.active")?.dataset.taskCategory || "all";
  let visibleCount = 0;
  document.querySelectorAll("#taskList [data-task]").forEach(card => {
    const statusMatched = status === "all" || card.dataset.status === status;
    const categoryMatched = category === "all" || card.dataset.category === category;
    const visible = statusMatched && categoryMatched;
    card.style.display = visible ? "" : "none";
    if (visible) visibleCount += 1;
  });
  const empty = document.getElementById("taskEmpty");
  if (empty) empty.classList.toggle("active", visibleCount === 0);
}

// 创建项目生成流程
const projectResourceMap = {
  video: { label: "参考视频", prefix: "已选参考" },
  product: { label: "产品图", prefix: "已选商品" },
  model: { label: "模特图", prefix: "已选模特" },
  voice: { label: "上传音色", prefix: "已选音色" }
};

function setBadgeState(el, state) {
  if (!el) return;
  el.classList.remove("info", "success", "warning", "danger", "gray");
  el.classList.add(state);
}

function selectResource(type, label, meta) {
  const config = projectResourceMap[type];
  if (!config) return;
  const resourceButton = document.querySelector(`[data-project-resource="${type}"]`);
  if (resourceButton) {
    const icon = resourceButton.querySelector(".project-attach-icon");
    resourceButton.textContent = `${config.prefix}`;
    if (icon) resourceButton.prepend(icon);
    resourceButton.classList.add("is-selected");
    resourceButton.title = label;
  }
  closeModals();
  const navButton = document.querySelector('button[data-page="project"]');
  show("project", navButton);
  showToast(meta || `${label}已用于当前项目`);
}

const projectGenerateSteps = [
  { text: "正在解析参考视频", percent: 18, flow: 1, status: 1, badge: "解析中" },
  { text: "正在生成替换脚本", percent: 34, flow: 2, status: 2, badge: "脚本中" },
  { text: "正在生成九宫格分镜", percent: 52, flow: 3, status: 3, badge: "分镜中" },
  { text: "正在生成视频切片", percent: 70, flow: 4, status: 3, badge: "切片中" },
  { text: "正在合成完整视频", percent: 88, flow: 5, status: 4, badge: "合成中" },
  { text: "生成完成，可进行视频裂变", percent: 100, flow: 5, status: 5, badge: "已完成", generated: true }
];
let projectGenerateTimer;

function updateProjectGenerateState(stepIndex) {
  const step = projectGenerateSteps[Math.min(stepIndex, projectGenerateSteps.length - 1)];
  const percent = document.getElementById("projectProgressPercent");
  const fill = document.getElementById("projectProgressFill");
  const statusText = document.getElementById("projectCurrentStatus");
  const outputPanel = document.querySelector(".project-output-panel");
  const outputBadge = document.querySelector("[data-project-output-badge]");
  const fissionButton = document.querySelector("[data-project-fission]");
  if (percent) percent.textContent = `${step.percent}%`;
  if (fill) fill.style.width = `${step.percent}%`;
  if (statusText) statusText.textContent = step.text;
  if (outputBadge) outputBadge.textContent = step.badge || "生成中";
  if (outputPanel) outputPanel.classList.toggle("is-generated", Boolean(step.generated));
  if (fissionButton) fissionButton.disabled = !step.generated;

  document.querySelectorAll("[data-project-status-step]").forEach(item => {
    item.classList.toggle("active", Number(item.dataset.projectStatusStep) === step.status);
  });

  document.querySelectorAll("[data-project-flow-step]").forEach(item => {
    const index = Number(item.dataset.projectFlowStep);
    item.classList.toggle("active", index === step.flow);
    item.classList.toggle("complete", index < step.flow || (step.generated && index === step.flow));
  });

  document.querySelectorAll(".project-flow-steps i").forEach((line, index) => {
    line.classList.toggle("complete", index + 1 < step.flow || (step.generated && index + 1 === step.flow));
  });

  document.querySelectorAll("[data-project-stage]").forEach(stageEl => {
    const stageNumber = Number(stageEl.dataset.projectStage);
    const stateEl = stageEl.querySelector(".project-stage-status");
    stageEl.classList.toggle("active", stageNumber === step.stage);
    if (!stateEl) return;
    if (stageNumber < step.stage) stateEl.textContent = "已完成";
    if (stageNumber === step.stage) stateEl.textContent = step.percent === 100 ? "已完成" : "生成中";
    if (stageNumber > step.stage) stateEl.textContent = "等待中";
  });
}

function startProjectFission() {
  const outputPanel = document.querySelector(".project-output-panel");
  const outputBadge = document.querySelector("[data-project-output-badge]");
  const statusText = document.getElementById("projectCurrentStatus");
  const fissionButton = document.querySelector("[data-project-fission]");
  if (!outputPanel?.classList.contains("is-generated")) {
    showToast("请先生成成片");
    return;
  }

  outputPanel.classList.add("is-fission");
  if (outputBadge) outputBadge.textContent = "裂变中";
  if (statusText) statusText.textContent = "正在生成 5 个场景裂变视频";
  if (fissionButton) {
    fissionButton.disabled = true;
    fissionButton.textContent = "裂变中";
  }

  document.querySelectorAll("[data-project-flow-step]").forEach(item => {
    const index = Number(item.dataset.projectFlowStep);
    item.classList.toggle("active", index === 6);
    item.classList.toggle("complete", index < 6);
  });
  document.querySelectorAll(".project-flow-steps i").forEach(line => line.classList.add("complete"));

  setTimeout(() => {
    if (outputBadge) outputBadge.textContent = "裂变完成";
    if (statusText) statusText.textContent = "已生成 5 个场景裂变视频";
    if (fissionButton) {
      fissionButton.disabled = false;
      fissionButton.textContent = "再裂变 5 个";
    }
    showToast("已生成 5 个裂变视频");
  }, 900);
}

function startProjectGenerate() {
  closeModals();
  show("project", document.querySelector('button[data-page="project"]'));
  showToast("生成任务已提交");
  clearInterval(projectGenerateTimer);
  const outputPanel = document.querySelector(".project-output-panel");
  const fissionButton = document.querySelector("[data-project-fission]");
  if (outputPanel) outputPanel.classList.remove("is-generated", "is-fission");
  if (fissionButton) {
    fissionButton.disabled = true;
    fissionButton.textContent = "裂变 5 个";
  }
  let stepIndex = 0;
  updateProjectGenerateState(stepIndex);
  projectGenerateTimer = setInterval(() => {
    stepIndex += 1;
    updateProjectGenerateState(stepIndex);
    if (stepIndex >= projectGenerateSteps.length - 1) {
      clearInterval(projectGenerateTimer);
      showToast("生成完成，可在任务记录查看");
    }
  }, 900);
}

// 商品素材库交互
function filterAssetCards(type, value) {
  let visibleCount = 0;
  document.querySelectorAll(`[data-asset-card][data-asset-type="${type}"]`).forEach(card => {
    const category = card.dataset.category || "";
    const visible = value === "all" || category.includes(value);
    card.style.display = visible ? "" : "none";
    if (visible) visibleCount += 1;
  });
  if (visibleCount === 0) showToast("当前分类暂无素材");
}

const uploadSlotRules = {
  "服装": {
    summary: "服装建议先补齐正面、背面和关键细节。",
    slots: [["正面图", "必传"], ["背面图", "必传"], ["领口 / 图案", "建议上传"], ["面料细节", "建议上传"]]
  },
  "鞋子": {
    summary: "鞋子建议补齐正面、侧面、背面、鞋底和 Logo 细节。",
    slots: [["正面图", "必传"], ["侧面图", "必传"], ["背面图", "必传"], ["鞋底图", "必传"], ["Logo 细节", "建议上传"]]
  },
  "内衣": {
    summary: "内衣建议补齐正背面、肩带扣位和面料纹理。",
    slots: [["正面图", "必传"], ["背面图", "必传"], ["肩带 / 扣位", "建议上传"], ["面料纹理", "建议上传"]]
  },
  "箱包": {
    summary: "箱包建议补齐外观、结构和五金 Logo 细节。",
    slots: [["正面图", "必传"], ["侧面图", "必传"], ["开合结构", "必传"], ["五金 / Logo", "建议上传"], ["内里细节", "建议上传"]]
  },
  "配饰": {
    summary: "配饰建议补齐佩戴效果、材质纹理和刻字 Logo。",
    slots: [["正面图", "必传"], ["佩戴效果", "建议上传"], ["材质纹理", "建议上传"], ["Logo / 刻字", "建议上传"]]
  },
  "帽子": {
    summary: "帽子建议补齐帽型、佩戴效果和刺绣材质细节。",
    slots: [["正面图", "必传"], ["侧面图", "必传"], ["佩戴效果", "建议上传"], ["刺绣 / 材质", "建议上传"]]
  },
  "其他": {
    summary: "其他品类可先上传主图、结构图和关键细节，AI 解析后再补充。",
    slots: [["主图", "必传"], ["背面 / 侧面", "建议上传"], ["包装图", "建议上传"], ["关键细节", "建议上传"]]
  }
};

let currentProductDetail = {
  title: "意大利头层牛皮手提包",
  category: "服装",
  image: "assets/product-cover-01.png"
};

function applyProductDetailData() {
  const detailPanel = document.querySelector('[data-modal-panel="product-detail"]');
  const editPanel = document.querySelector('[data-modal-panel="product-edit"]');
  const detailTitle = detailPanel?.querySelector("[data-product-detail-title]");
  const detailCategory = detailPanel?.querySelector("[data-product-detail-category]");
  const detailCategoryText = detailPanel?.querySelector("[data-product-detail-category-text]");
  const detailHero = detailPanel?.querySelector("[data-product-detail-hero]");
  const editTitle = editPanel?.querySelector("[data-product-edit-title]");
  const editCategoryLabel = editPanel?.querySelector("[data-product-edit-category-label]");
  const editHero = editPanel?.querySelector("[data-product-edit-hero]");
  const editName = editPanel?.querySelector("[data-product-edit-name]");
  const editCategory = editPanel?.querySelector("[data-product-edit-category]");
  if (detailTitle) detailTitle.textContent = currentProductDetail.title;
  if (detailCategory) detailCategory.textContent = currentProductDetail.category;
  if (detailCategoryText) detailCategoryText.textContent = currentProductDetail.category;
  if (detailHero) detailHero.src = currentProductDetail.image;
  if (editTitle) editTitle.textContent = currentProductDetail.title;
  if (editCategoryLabel) editCategoryLabel.textContent = currentProductDetail.category;
  if (editHero) editHero.src = currentProductDetail.image;
  if (editName) editName.value = currentProductDetail.title;
  if (editCategory) editCategory.value = currentProductDetail.category;
}

function hydrateProductDetail(card) {
  const title = card.querySelector(".product-card-copy h3")?.textContent?.trim();
  const category = card.dataset.category || "服装";
  const image = card.querySelector(".product-image img")?.getAttribute("src");
  currentProductDetail = {
    title: title || currentProductDetail.title,
    category,
    image: image || currentProductDetail.image
  };
  applyProductDetailData();
}

function updateUploadSlots(category, root = document) {
  const slots = root.querySelector("[data-product-upload-slots]") || document.getElementById("productUploadSlots");
  if (!slots) return;
  const rule = uploadSlotRules[category] || uploadSlotRules["服装"];
  const summary = root.querySelector("[data-upload-slot-summary]");
  if (summary) summary.textContent = rule.summary;
  slots.replaceChildren();
  rule.slots.forEach(([title, desc]) => {
    const slot = document.createElement("div");
    const body = document.createElement("div");
    const strong = document.createElement("strong");
    slot.className = desc === "必传" ? "upload-slot required" : "upload-slot";
    strong.textContent = title;
    body.append(strong, desc);
    slot.appendChild(body);
    slots.appendChild(slot);
  });
}

function getProductUploadModal() {
  return document.querySelector('[data-modal-panel="product-upload"] .product-create-modal');
}

function syncProductNameCount(panel) {
  const input = panel?.querySelector("[data-product-name-input]");
  const count = panel?.querySelector("[data-product-name-count]");
  if (input && count) count.textContent = String(input.value.length);
}

function syncProductResult(panel) {
  const activeCategory = panel.querySelector("[data-upload-category].active")?.dataset.uploadCategory || "服装";
  const name = panel.querySelector("[data-product-name-input]")?.value?.trim() || "白色运动休闲鞋";
  const resultSelect = panel.querySelector('.product-result-form select.form-control');
  const resultName = panel.querySelector('.product-result-form input.form-control');
  if (resultSelect) resultSelect.value = activeCategory;
  if (resultName) resultName.value = name;
}

function setProductUploadStep(step) {
  const panel = getProductUploadModal();
  if (!panel) return;
  const safeStep = Math.min(4, Math.max(1, Number(step) || 1));
  panel.dataset.productUploadStep = String(safeStep);
  panel.querySelectorAll("[data-product-step-panel]").forEach(item => {
    item.classList.toggle("active", Number(item.dataset.productStepPanel) === safeStep);
  });
  panel.querySelectorAll("[data-product-step-indicator]").forEach(item => {
    const index = Number(item.dataset.productStepIndicator);
    item.classList.toggle("active", index === safeStep);
    item.classList.toggle("complete", index < safeStep);
  });
  panel.querySelectorAll(".product-stepper i").forEach((line, index) => {
    line.classList.toggle("complete", index + 1 < safeStep);
  });
  const next = panel.querySelector("[data-product-upload-next]");
  if (next) next.textContent = safeStep === 2 ? "提交图片" : "下一步";
  if (safeStep === 4) syncProductResult(panel);
}

function resetProductUploadModal() {
  clearTimeout(productUploadTimer);
  const panel = getProductUploadModal();
  if (!panel) return;
  const activeCategory = panel.querySelector("[data-upload-category].active")?.dataset.uploadCategory || "服装";
  updateUploadSlots(activeCategory, panel);
  syncProductNameCount(panel);
  setProductUploadStep(1);
}

function startProductUploadAnalysis() {
  clearTimeout(productUploadTimer);
  setProductUploadStep(3);
  productUploadTimer = setTimeout(() => {
    setProductUploadStep(4);
  }, 1600);
}

function runProductAnalysis(trigger) {
  const modal = trigger.closest(".modal");
  const preview = modal?.querySelector(".product-analysis-preview");
  if (!preview) {
    showToast("商品素材已重新提交解析");
    return;
  }
  preview.innerHTML = '<div class="status-callout"><span class="loading-dot"></span><div><strong>AI 正在解析</strong>正在识别商品轮廓、视角完整度、Logo 细节和可用于视频脚本的卖点。</div></div>';
  setTimeout(() => {
    preview.innerHTML = '<div class="status-callout success"><div><strong>解析完成</strong>已生成商品元素说明、关键卖点和建议补充视角，保存后可用于视频创作。</div></div>';
  }, 700);
}

document.querySelectorAll(".product-modal").forEach(modal => {
  const activeCategory = modal.querySelector("[data-upload-category].active")?.dataset.uploadCategory;
  if (activeCategory) updateUploadSlots(activeCategory, modal);
});

document.addEventListener("click", event => {
  const selectTrigger = event.target.closest("[data-select-resource]");
  if (selectTrigger) {
    event.preventDefault();
    event.stopPropagation();
    selectResource(selectTrigger.dataset.selectResource, selectTrigger.dataset.resourceLabel, selectTrigger.dataset.resourceMeta);
    return;
  }

  const generateTrigger = event.target.closest("[data-start-generate]");
  if (generateTrigger) {
    event.preventDefault();
    startProjectGenerate();
    return;
  }

  const projectFission = event.target.closest("[data-project-fission]");
  if (projectFission) {
    event.preventDefault();
    startProjectFission();
    return;
  }

  const projectOption = event.target.closest('.page[data-page="project"] .project-chip-group button');
  if (projectOption) {
    event.preventDefault();
    projectOption.parentElement.querySelectorAll("button").forEach(button => {
      button.classList.toggle("active", button === projectOption);
    });
    return;
  }

  const productNext = event.target.closest("[data-product-upload-next]");
  if (productNext) {
    event.preventDefault();
    const modal = productNext.closest(".product-create-modal");
    const step = Number(modal?.dataset.productUploadStep || 1);
    if (step === 1) setProductUploadStep(2);
    if (step === 2) startProductUploadAnalysis();
    return;
  }

  const productPrev = event.target.closest("[data-product-upload-prev]");
  if (productPrev) {
    event.preventDefault();
    const modal = productPrev.closest(".product-create-modal");
    const step = Number(modal?.dataset.productUploadStep || 1);
    setProductUploadStep(step === 4 ? 2 : step - 1);
    return;
  }

  const productCancel = event.target.closest("[data-product-upload-cancel]");
  if (productCancel) {
    event.preventDefault();
    closeModals();
    return;
  }

  const productCard = event.target.closest('.page[data-page="materials"] .product-card');
  if (productCard) {
    event.preventDefault();
    hydrateProductDetail(productCard);
    openModal("product-detail", productCard);
    return;
  }

  const productAnalyze = event.target.closest("[data-product-analyze]");
  if (productAnalyze) {
    event.preventDefault();
    runProductAnalysis(productAnalyze);
    return;
  }

  const jumpTrigger = event.target.closest("[data-jump]");
  if (jumpTrigger) {
    event.preventDefault();
    closeModals();
    const navButton = document.querySelector(`button[data-page="${jumpTrigger.dataset.jump}"]`);
    show(jumpTrigger.dataset.jump, navButton);
    if (jumpTrigger.textContent.trim() === "提交生成") showToast("生成任务已提交");
    return;
  }

  const voicePlayTrigger = event.target.closest('.page[data-page="voices"] .voice-play');
  if (voicePlayTrigger) setActiveVoicePlay(voicePlayTrigger);

  const voiceAudioUploader = event.target.closest("[data-voice-audio-uploader]");
  if (voiceAudioUploader) {
    event.preventDefault();
    const input = voiceAudioUploader.querySelector("[data-voice-audio-input]");
    if (input) input.click();
    return;
  }

  const modelUploadCard = event.target.closest("[data-model-upload-card]");
  if (modelUploadCard) {
    event.preventDefault();
    const panel = getModelCreateModal();
    const state = panel?.dataset.modelCreateState;
    if (state === "idle") startModelImageAnalysis();
    return;
  }

  const modelCreatePrimary = event.target.closest("[data-model-create-primary]");
  if (modelCreatePrimary) {
    event.preventDefault();
    const panel = getModelCreateModal();
    const state = panel?.dataset.modelCreateState;
    if (state === "analyzed") {
      startModelFiveViewGeneration();
      return;
    }
    if (state === "complete") {
      closeModals();
      showToast("模特创建成功");
    }
    return;
  }

  const modelCreateRegenerate = event.target.closest("[data-model-create-regenerate]");
  if (modelCreateRegenerate) {
    event.preventDefault();
    startModelFiveViewGeneration();
    return;
  }

  const modelEditTag = event.target.closest('[data-modal-panel="model-edit"] .model-edit-tag');
  if (modelEditTag) {
    event.preventDefault();
    modelEditTag.remove();
    return;
  }

  const toastTrigger = event.target.closest("[data-toast]");
  if (toastTrigger) {
    event.preventDefault();
    event.stopPropagation();
    showToast(toastTrigger.dataset.toast);
    if (toastTrigger.hasAttribute("data-close-modal")) closeModals();
    return;
  }

  const dismissTrigger = event.target.closest("[data-dismiss]");
  if (dismissTrigger) {
    event.preventDefault();
    closeModals();
    return;
  }

  const modalTrigger = event.target.closest("[data-modal]");
  if (modalTrigger) {
    event.preventDefault();
    event.stopPropagation();
    if (modalTrigger.dataset.modal === "video-detail") hydrateVideoDetail(modalTrigger);
    openModal(modalTrigger.dataset.modal, modalTrigger);
    return;
  }

  const closeButton = event.target.closest(".modal-close");
  if (closeButton) {
    closeModals();
    return;
  }

  const backdrop = event.target.classList && event.target.classList.contains("modal-backdrop") ? event.target : null;
  if (backdrop) closeModals();

  const assetFilter = event.target.closest("[data-asset-filter]");
  if (assetFilter) {
    assetFilter.parentElement.querySelectorAll("[data-asset-filter]").forEach(item => item.classList.toggle("active", item === assetFilter));
    filterAssetCards(assetFilter.dataset.assetFilter, assetFilter.dataset.filterValue);
    return;
  }

  const uploadCategory = event.target.closest("[data-upload-category]");
  if (uploadCategory) {
    uploadCategory.parentElement.querySelectorAll("[data-upload-category]").forEach(item => item.classList.toggle("active", item === uploadCategory));
    const modal = uploadCategory.closest(".modal") || document;
    updateUploadSlots(uploadCategory.dataset.uploadCategory, modal);
    if (modal.classList?.contains("product-create-modal")) syncProductResult(modal);
    return;
  }

  const pill = event.target.closest(".pill-btn");
  if (pill && pill.parentElement) {
    pill.parentElement.querySelectorAll(".pill-btn").forEach(item => item.classList.toggle("active", item === pill));
  }

  const taskStatus = event.target.closest("[data-task-status]");
  if (taskStatus) {
    document.querySelectorAll("[data-task-status]").forEach(item => {
      item.classList.toggle("featured", item === taskStatus);
    });
    applyTaskFilters();
  }
});

// 视频广场交互
const plazaMoreVideos = [
  { category: "女装", title: "白色小香风套装街拍种草", image: "assets/plaza-covers/plaza-01.png" },
  { category: "女装", title: "学院风针织马甲通勤搭配", image: "assets/plaza-covers/plaza-02.png" },
  { category: "女装", title: "蓝色防晒外套少女感穿搭", image: "assets/plaza-covers/plaza-03.png" },
  { category: "女装", title: "无袖背心阔腿裤简约穿搭", image: "assets/plaza-covers/plaza-04.png" },
  { category: "女装", title: "风车草地半身裙度假穿搭", image: "assets/plaza-covers/plaza-05.png" },
  { category: "女装", title: "碎花连衣裙咖啡店场景口播", image: "assets/plaza-covers/plaza-06.png" },
  { category: "女装", title: "粉色衬衫半裙街拍穿搭", image: "assets/plaza-covers/plaza-07.png" },
  { category: "女童", title: "儿童针织开衫牛仔裤出街搭配", image: "assets/plaza-covers/plaza-08.png" },
  { category: "女装", title: "灰黄拼色连衣裙优雅通勤", image: "assets/plaza-covers/plaza-09.png" },
  { category: "女装", title: "草编帽绿色衬衫夏日度假穿搭", image: "assets/plaza-covers/plaza-10.png" }
];
const plazaVideoMaxCount = 30;
let plazaVideoCursor = 5;
let plazaLoading = false;

function createPlazaVideoCard(item) {
  const card = document.createElement("article");
  const poster = document.createElement("div");
  const image = document.createElement("img");
  const category = document.createElement("span");
  const feature = document.createElement("span");
  const play = document.createElement("span");
  const title = document.createElement("span");
  card.className = "gallery-card plaza-video-card";
  card.dataset.modal = "video-detail";
  poster.className = "poster plaza-poster";
  image.className = "poster-image";
  image.src = item.image;
  image.alt = "";
  category.className = "poster-badge poster-category";
  category.textContent = item.category;
  feature.className = "poster-badge poster-feature";
  feature.textContent = "精选";
  play.className = "poster-play";
  title.className = "poster-title";
  title.textContent = item.title;
  poster.append(image, category, feature, play, title);
  card.appendChild(poster);
  return card;
}

function loadMorePlazaVideos() {
  const grid = document.querySelector(".plaza-video-grid");
  const loader = document.getElementById("plazaLoadMore");
  const plazaPage = document.querySelector('[data-page="plaza"]');
  if (!grid || !loader || !plazaPage?.classList.contains("active") || plazaLoading) return;
  const currentCount = grid.querySelectorAll(".plaza-video-card").length;
  if (currentCount >= plazaVideoMaxCount) {
    loader.textContent = "已展示全部 30 个视频";
    return;
  }
  plazaLoading = true;
  loader.textContent = "正在加载更多视频...";
  setTimeout(() => {
    const fragment = document.createDocumentFragment();
    const count = Math.min(5, plazaVideoMaxCount - currentCount);
    for (let i = 0; i < count; i += 1) {
      const item = plazaMoreVideos[plazaVideoCursor % plazaMoreVideos.length];
      fragment.appendChild(createPlazaVideoCard(item));
      plazaVideoCursor += 1;
    }
    grid.appendChild(fragment);
    const nextCount = grid.querySelectorAll(".plaza-video-card").length;
    loader.textContent = nextCount >= plazaVideoMaxCount ? "已展示全部 30 个视频" : "继续下拉加载更多视频";
    plazaLoading = false;
  }, 220);
}

window.addEventListener("scroll", () => {
  const loader = document.getElementById("plazaLoadMore");
  if (!loader) return;
  const distanceToLoader = loader.getBoundingClientRect().top - window.innerHeight;
  if (distanceToLoader < 360) loadMorePlazaVideos();
}, { passive: true });
loadMorePlazaVideos();

document.addEventListener("change", event => {
  const voiceAudioInput = event.target.closest("[data-voice-audio-input]");
  if (voiceAudioInput) renderVoiceAudioFile(voiceAudioInput);
});

document.addEventListener("input", event => {
  const productNameInput = event.target.closest("[data-product-name-input]");
  if (productNameInput) {
    const modal = productNameInput.closest(".product-create-modal");
    syncProductNameCount(modal);
    syncProductResult(modal);
  }
});

document.addEventListener("keydown", event => {
  const modelEditTagInput = event.target.closest("[data-model-edit-tag-input]");
  if (modelEditTagInput && event.key === "Enter") {
    event.preventDefault();
    addModelEditTag(modelEditTagInput);
    return;
  }
  if (event.key === "Escape") closeModals();
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-voice-audio-uploader]")) {
    event.preventDefault();
    const input = event.target.querySelector("[data-voice-audio-input]");
    if (input) input.click();
  }
});

const taskList = document.getElementById("taskList");
if (taskList) {
  taskList.addEventListener("click", event => {
    const card = event.target.closest("[data-task]");
    if (!card) return;

    taskList.querySelectorAll("[data-task]").forEach(item => {
      item.classList.toggle("active", item === card);
    });

    document.querySelectorAll("[data-task-detail]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.taskDetail === card.dataset.task);
    });
  });
}

const taskTabs = document.getElementById("taskTabs");
if (taskTabs) {
  taskTabs.addEventListener("click", event => {
    const tab = event.target.closest(".task-tab");
    if (!tab) return;

    taskTabs.querySelectorAll(".task-tab").forEach(item => {
      item.classList.toggle("active", item === tab);
    });
    applyTaskFilters();
  });
}
