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
    trigger.setAttribute("aria-label", trigger.getAttribute("aria-label")?.replace("暂停", "播放") || "播放音色");
    trigger.title = "播放";
    return;
  }

  document.querySelectorAll('.page[data-page="voices"] .voice-play.is-playing, [data-modal-panel="project-voice-select"] .voice-play.is-playing').forEach(button => {
    if (button === trigger) return;
    button.classList.remove("is-playing");
    button.setAttribute("aria-label", button.getAttribute("aria-label")?.replace("暂停", "播放") || "播放音色");
    button.title = "播放";
  });
  trigger.classList.add("is-playing");
  trigger.setAttribute("aria-label", trigger.getAttribute("aria-label")?.replace("播放", "暂停") || "暂停音色");
  trigger.title = "暂停";
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

function getModelCreateMode(panel = getModelCreateModal()) {
  return panel?.dataset.modelCreateMode || "text";
}

function getTextModelSelections(panel = getModelCreateModal()) {
  if (!panel) return [];
  const values = [];
  panel.querySelectorAll('[data-model-create-mode-panel="text"] .model-option-grid button.active').forEach(button => {
    const value = button.dataset.value || button.textContent.trim();
    if (value) values.push(value);
  });
  panel.querySelectorAll('[data-model-create-mode-panel="text"] .model-text-custom').forEach(input => {
    const value = input.value.trim();
    if (value) values.push(value);
  });
  const prompt = panel.querySelector("[data-model-text-prompt]")?.value.trim();
  if (prompt) values.push(prompt);
  return values;
}

function isTextModelReady(panel = getModelCreateModal()) {
  if (!panel) return false;
  return Array.from(panel.querySelectorAll("[data-model-text-required]")).every(group => group.querySelector("button.active"));
}

function updateTextModelSummary(panel = getModelCreateModal()) {
  if (!panel) return;
  const summary = panel.querySelector("[data-model-text-summary]");
  if (!summary) return;
  const values = getTextModelSelections(panel);
  if (!values.length) {
    summary.textContent = "请先选择年龄、性别、肤色";
  } else {
    summary.innerHTML = values.slice(0, 10).map(value => `<span class="badge">${value}</span>`).join("");
  }
  const primary = panel.querySelector("[data-model-create-primary]");
  if (primary && getModelCreateMode(panel) === "text") {
    primary.disabled = !isTextModelReady(panel);
  }
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

const defaultModelGeneratedTags = {
  genderAge: ["女童", "7-12岁"],
  style: ["甜美休闲风", "田园风", "真实感"]
};

function renderModelGeneratedTags(field) {
  const selected = field.querySelector("[data-model-create-selected]");
  if (!selected) return;
  const values = Array.from(field.querySelectorAll("[data-model-create-tag-option].active")).map(button => button.dataset.value);
  selected.innerHTML = values.length
    ? values.map(value => `<span class="badge">${value}</span>`).join("")
    : "<span>AI 识别后自动填写</span>";
}

function setModelCreateTagField(panel, key, values, editable) {
  const field = panel.querySelector(`[data-model-create-tag-field="${key}"]`);
  if (!field) return;
  const selectedValues = new Set(values);
  field.classList.remove("is-editing");
  field.querySelectorAll("[data-model-create-tag-option]").forEach(button => {
    button.classList.toggle("active", selectedValues.has(button.dataset.value));
    button.disabled = !editable;
  });
  const edit = field.querySelector("[data-model-create-tag-edit]");
  if (edit) {
    edit.disabled = !editable;
    edit.textContent = "修改";
  }
  renderModelGeneratedTags(field);
}

function setModelCreateTagFields(panel, mode) {
  const editable = mode === "analyzed";
  const shouldClear = mode === "idle";
  Object.keys(defaultModelGeneratedTags).forEach(key => {
    if (shouldClear) {
      setModelCreateTagField(panel, key, [], false);
    } else if (mode === "analyzed") {
      setModelCreateTagField(panel, key, defaultModelGeneratedTags[key], editable);
    } else {
      const field = panel.querySelector(`[data-model-create-tag-field="${key}"]`);
      if (!field) return;
      field.classList.remove("is-editing");
      field.querySelectorAll("[data-model-create-tag-option]").forEach(button => {
        button.disabled = true;
      });
      const edit = field.querySelector("[data-model-create-tag-edit]");
      if (edit) {
        edit.disabled = true;
        edit.textContent = "修改";
      }
      renderModelGeneratedTags(field);
    }
  });
}

function setModelCreateFields(panel, mode) {
  const values = {
    name: "女性6岁甜美休闲/田园风",
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
  setModelCreateTagFields(panel, mode);
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
    if (getModelCreateMode(panel) === "text") {
      primary.textContent = "生成模特";
      primary.disabled = !isTextModelReady(panel);
    } else {
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
  }
  if (dismiss) dismiss.textContent = state === "complete" ? "关闭" : "取消";
}

function setModelCreateMode(mode) {
  const panel = getModelCreateModal();
  if (!panel) return;
  panel.dataset.modelCreateMode = mode;
  const title = panel.querySelector("[data-model-create-title]");
  const desc = panel.querySelector("[data-model-create-desc]");
  if (title) title.textContent = mode === "image" ? "图生模特" : "文生模特";
  if (desc) {
    desc.textContent = mode === "image"
      ? "上传参考人物图片并生成可复用 AI 模特五视图。"
      : "通过结构化特征和自然语言描述生成可复用 AI 模特。";
  }
  panel.querySelectorAll("[data-model-create-mode-panel]").forEach(modePanel => {
    modePanel.classList.toggle("active", modePanel.dataset.modelCreateModePanel === mode);
  });
  setModelCreateState(mode === "text" ? "idle" : panel.dataset.modelCreateState || "idle");
  updateTextModelSummary(panel);
}

function resetTextModel(panel = getModelCreateModal()) {
  if (!panel) return;
  panel.querySelectorAll('[data-model-create-mode-panel="text"] .model-option-grid button.active').forEach(button => {
    button.classList.remove("active");
  });
  panel.querySelectorAll('[data-model-create-mode-panel="text"] .model-text-custom, [data-model-text-prompt]').forEach(input => {
    input.value = "";
  });
  const reference = panel.querySelector(".model-text-reference");
  reference?.classList.remove("is-analyzed");
  const referenceButton = panel.querySelector("[data-text-model-reference]");
  if (referenceButton) referenceButton.innerHTML = '<span class="model-ref-plus"></span>上传参考图并分析';
  panel.querySelectorAll("[data-model-text-section-tab]").forEach((button, index) => {
    button.classList.toggle("active", index === 0);
  });
  panel.querySelectorAll("[data-model-text-section]").forEach(section => {
    section.classList.toggle("active", section.dataset.modelTextSection === "basic");
  });
  updateTextModelSummary(panel);
}

function resetModelCreateModal(mode = "text") {
  clearTimeout(modelCreateTimer);
  setModelCreateMode(mode);
  resetTextModel();
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

function analyzeTextModelReference() {
  const panel = getModelCreateModal();
  if (!panel) return;
  const reference = panel.querySelector(".model-text-reference");
  reference?.classList.add("is-analyzed");
  const values = {
    age: "青年",
    gender: "女性",
    skin: "亚洲自然肤色"
  };
  Object.entries(values).forEach(([key, value]) => {
    const group = panel.querySelector(`[data-model-text-required="${key}"]`);
    group?.querySelectorAll("button").forEach(button => {
      button.classList.toggle("active", button.dataset.value === value);
    });
  });
  ["长发", "鹅蛋脸", "自然微笑", "真实感", "通勤", "匀称", "亲和自然", "亚洲", "服装", "3:4"].forEach(value => {
    const button = panel.querySelector(`[data-model-create-mode-panel="text"] .model-option-grid button[data-value="${value}"]`);
    button?.classList.add("active");
  });
  const prompt = panel.querySelector("[data-model-text-prompt]");
  if (prompt && !prompt.value.trim()) {
    prompt.value = "参考图分析为年轻亚洲女性，整体通勤自然风，适合服装和箱包短视频。";
  }
  const referenceButton = panel.querySelector("[data-text-model-reference]");
  if (referenceButton) referenceButton.textContent = "已分析参考图";
  updateTextModelSummary(panel);
  showToast("参考图特征已填入文生配置");
}

function submitTextModelCreate() {
  const panel = getModelCreateModal();
  if (!isTextModelReady(panel)) {
    showToast("请先选择年龄、性别、肤色");
    return;
  }
  closeModals();
  showToast("文生模特配置已创建，出图能力待接入");
}

function applyModelDetailSource(trigger) {
  const modal = document.querySelector('[data-modal-panel="model-detail"] .model-detail-modal');
  if (!modal) return;
  const sourceKind = trigger?.dataset.modelSourceKind || "image";
  modal.dataset.modelSourceKind = sourceKind;
  const type = modal.querySelector("[data-model-source-type]");
  const note = modal.querySelector("[data-model-source-note]");
  const desc = modal.querySelector("[data-model-source-desc]");
  if (sourceKind === "text-no-reference") {
    if (type) type.textContent = "文生模特";
    if (note) note.textContent = "无参考图";
    if (desc) desc.textContent = "该模特由结构化特征与自由描述生成，无原始参考图。";
    return;
  }
  if (sourceKind === "text-reference") {
    if (type) type.textContent = "文生模特";
    if (note) note.textContent = "参考图辅助分析";
    if (desc) desc.textContent = "参考图仅用于提取年龄、性别、肤色、发型等特征，生成仍以文字配置为准。";
    return;
  }
  if (type) type.textContent = "图生模特";
  if (note) note.textContent = "用户上传原图";
  if (desc) desc.textContent = "都市通勤女模特，适合服装、箱包和配饰短视频。";
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
  syncModelEditPresetTags();
}

function getModelEditTagValues(modal = document.querySelector('[data-modal-panel="model-edit"]')) {
  return Array.from(modal?.querySelectorAll(".model-edit-tag") || []).map(tag => tag.firstChild?.textContent?.trim()).filter(Boolean);
}

function syncModelEditPresetTags() {
  const modal = document.querySelector('[data-modal-panel="model-edit"]');
  if (!modal) return;
  const values = new Set(getModelEditTagValues(modal));
  modal.querySelectorAll("[data-model-edit-preset-tag]").forEach(button => {
    button.classList.toggle("active", values.has(button.dataset.value));
  });
}

function toggleModelEditPresetTag(button) {
  const value = button.dataset.value;
  if (!value) return;
  const modal = button.closest('[data-modal-panel="model-edit"]');
  const list = modal?.querySelector("[data-model-edit-tags]");
  if (!list) return;
  const exists = Array.from(list.querySelectorAll(".model-edit-tag")).find(tag => tag.firstChild?.textContent?.trim() === value);
  if (exists) {
    exists.remove();
    syncModelEditPresetTags();
    return;
  }
  const dimension = button.dataset.modelEditTagDimension;
  if (dimension) {
    const dimensionValues = new Set(Array.from(modal.querySelectorAll(`[data-model-edit-tag-dimension="${dimension}"]`)).map(item => item.dataset.value));
    list.querySelectorAll(".model-edit-tag").forEach(tagItem => {
      const tagValue = tagItem.firstChild?.textContent?.trim();
      if (dimensionValues.has(tagValue)) tagItem.remove();
    });
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
  syncModelEditPresetTags();
}

function openModal(name, trigger) {
  closeModals();
  if (name === "voice-upload") updateVoiceModalMode(trigger);
  if (name === "model-create") resetModelCreateModal(trigger?.dataset.modelCreateChoice || "text");
  if (name === "model-detail") applyModelDetailSource(trigger);
  if (name === "model-edit") syncModelEditPresetTags();
  if (name === "product-upload") resetProductUploadModal();
  if (name === "product-edit") applyProductDetailData();
  const panel = document.querySelector(`[data-modal-panel="${name}"]`);
  if (panel) {
    if (name === "project-model-select") renderProjectMultiResourceState("model");
    if (name === "project-voice-select") renderProjectMultiResourceState("voice");
    if (name === "product-upload") {
      const activeCategory = panel.querySelector("[data-upload-category].active")?.dataset.uploadCategory || "服装";
      updateUploadSlots(activeCategory, panel);
    }
    panel.classList.add("active");
  }
}

let currentVideoDetail = {
  title: "无袖背心阔腿裤简约穿搭",
  image: "assets/plaza-covers/plaza-04.png",
  category: "女装"
};

function hydrateVideoDetail(trigger) {
  if (!trigger) return;
  const image = trigger.querySelector(".poster-image");
  const title = trigger.dataset.videoTitle || trigger.querySelector(".poster-title")?.textContent?.trim() || "无袖背心阔腿裤简约穿搭";
  const category = trigger.dataset.videoCategory || trigger.querySelector(".poster-category")?.textContent?.trim() || "服装";
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
  const fromProjectBoard = Boolean(trigger.closest(".project-video-board"));
  currentVideoDetail = {
    title,
    image: image?.getAttribute("src") || "assets/plaza-covers/plaza-04.png",
    category
  };
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
    cta.dataset.resourceImage = currentVideoDetail.image;
    if (fromProjectBoard) {
      cta.dataset.projectRemake = "true";
      delete cta.dataset.selectResource;
    } else {
      cta.dataset.selectResource = "video";
      delete cta.dataset.projectRemake;
    }
  }
}

function setCurrentVideoDetailFromProjectCard(card) {
  if (!card) return;
  const image = card.querySelector(".poster-image");
  const title = card.querySelector(".poster-title")?.textContent?.trim() || "生成视频";
  const category = card.querySelector(".poster-category")?.textContent?.trim() || "服装";
  currentVideoDetail = {
    title,
    image: image?.getAttribute("src") || "assets/plaza-covers/plaza-04.png",
    category
  };
}

function openProjectMyVideoFullscreen(card) {
  if (!card) return;
  const image = card.querySelector(".poster-image");
  const title = card.querySelector(".poster-title")?.textContent?.trim() || "视频预览";
  const src = image?.getAttribute("src") || "assets/plaza-covers/plaza-04.png";
  const overlay = document.createElement("div");
  const closeButton = document.createElement("button");
  const stage = document.createElement("div");
  const poster = document.createElement("img");
  const playIcon = document.createElement("span");
  const titleNode = document.createElement("span");
  overlay.className = "project-my-video-fullscreen";
  closeButton.className = "project-my-video-fullscreen-close";
  closeButton.type = "button";
  closeButton.dataset.projectMyVideoFullscreenClose = "";
  closeButton.setAttribute("aria-label", "关闭");
  closeButton.textContent = "×";
  stage.className = "project-my-video-fullscreen-stage";
  poster.src = src;
  poster.alt = "";
  playIcon.className = "project-my-video-fullscreen-play";
  titleNode.className = "project-my-video-fullscreen-title";
  titleNode.textContent = title;
  stage.append(poster, playIcon, titleNode);
  overlay.append(closeButton, stage);
  document.body.appendChild(overlay);
  document.body.classList.add("modal-open");
  if (overlay.requestFullscreen) {
    overlay.requestFullscreen().catch(() => {});
  }
}

function closeProjectMyVideoFullscreen() {
  const overlay = document.querySelector(".project-my-video-fullscreen");
  if (!overlay) return;
  const shouldExitFullscreen = document.fullscreenElement === overlay && document.exitFullscreen;
  overlay.remove();
  document.body.classList.remove("modal-open");
  if (shouldExitFullscreen) {
    document.exitFullscreen().catch(() => {});
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

const projectSelectedLabelMap = {
  video: "[data-project-selected-video]",
  product: "[data-project-selected-product]",
  model: "[data-project-selected-model]",
  voice: "[data-project-selected-voice]"
};

const projectMultiResourceTypes = new Set(["model", "voice"]);
const projectMultiResourceLimit = 3;
const projectMultiResourceDraft = {
  model: [],
  voice: []
};

const projectResourceEmptyButtonLabelMap = {
  model: "上传模特",
  voice: "上传音色"
};

const projectDetailResourceConfig = {
  video: {
    label: "已选视频",
    emptyTitle: "视频",
    emptyLabel: "上传参考视频",
    modal: "project-video-select",
    imageClass: "project-selected-cover",
    fallbackImage: "assets/plaza-covers/plaza-04.png",
    desc: "镜头节奏、构图和口播结构将作为本次生成参考。",
    emptyDesc: "点击选择参考视频，用于解析节奏、镜头和口播结构。"
  },
  product: {
    label: "已选商品图",
    emptyTitle: "商品图",
    emptyLabel: "上传商品图",
    modal: "project-product-select",
    imageClass: "project-selected-image",
    fallbackImage: "assets/product-cover-01.png",
    desc: "5 张视角图，Logo 与材质细节已校验。",
    emptyDesc: "从商品素材库选择商品图，系统会复用商品视角与卖点。"
  },
  model: {
    label: "已选模特",
    emptyTitle: "模特",
    emptyLabel: "上传模特",
    modal: "project-model-select",
    imageClass: "project-selected-image",
    fallbackImage: "assets/model-detail-source.png",
    desc: "五视图已生成，适合通勤穿搭和鞋服展示。",
    emptyDesc: "从模特库选择已创建模特，保持人物一致性。"
  },
  voice: {
    label: "已选音色",
    emptyTitle: "音色",
    emptyLabel: "上传音色",
    modal: "project-voice-select",
    imageClass: "project-selected-image",
    fallbackImage: "assets/voice-avatars/warm-female.png",
    desc: "自然 / 轻快，适合短视频种草口播。",
    emptyDesc: "从音色库选择口播音色，生成时用于人声表达。"
  }
};

const PROJECT_FISSION_BEAN_COST = 3;
const projectParamState = {
  ratio: "3:4",
  resolution: "720p",
  durationMode: "auto",
  duration: "15",
  music: "on",
  voice: "on"
};
let projectParamDraft = { ...projectParamState };

function normalizeProjectDuration(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "15";
  return String(Math.min(90, Math.max(4, Math.round(number))));
}

function getProjectFissionCount() {
  const value = Number(document.querySelector("[data-project-fission-count]")?.value || 5);
  return Math.min(12, Math.max(1, value));
}

function updateProjectParamSummary() {
  const ratio = document.querySelector("[data-project-param-summary-ratio]");
  const resolution = document.querySelector("[data-project-param-summary-resolution]");
  const music = document.querySelector("[data-project-param-summary-music]");
  const voice = document.querySelector("[data-project-param-summary-voice]");
  if (ratio) ratio.textContent = projectParamState.ratio;
  if (resolution) resolution.textContent = projectParamState.resolution;
  if (music) music.textContent = projectParamState.music === "on" ? "背景音频" : "无背景音频";
  if (voice) voice.textContent = projectParamState.voice === "on" ? "人声" : "无人声";
}

function updateProjectDurationRangeFill(range) {
  if (!range) return;
  const min = Number(range.min) || 4;
  const max = Number(range.max) || 90;
  const value = Math.min(max, Math.max(min, Number(range.value) || min));
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  range.style.setProperty("--project-duration-fill", `${percent}%`);
}

function renderProjectParamOptions() {
  document.querySelectorAll("[data-project-param-option]").forEach(button => {
    const key = button.dataset.projectParamOption;
    button.classList.toggle("active", projectParamDraft[key] === button.dataset.value);
  });
  const durationControl = document.querySelector("[data-project-duration-control]");
  durationControl?.classList.toggle("is-disabled", projectParamDraft.durationMode !== "custom");
  document.querySelectorAll("[data-project-duration-range], [data-project-duration-input]").forEach(input => {
    input.value = projectParamDraft.duration;
    if (input.matches("[data-project-duration-range]")) updateProjectDurationRangeFill(input);
  });
}

function openProjectParamPopover() {
  const wrap = document.querySelector("[data-project-param-wrap]");
  if (!wrap) return;
  projectParamDraft = { ...projectParamState };
  renderProjectParamOptions();
  wrap.classList.add("is-open");
}

function closeProjectParamPopover() {
  document.querySelector("[data-project-param-wrap]")?.classList.remove("is-open");
}

function confirmProjectParamPopover() {
  Object.assign(projectParamState, projectParamDraft);
  updateProjectParamSummary();
  closeProjectParamPopover();
}

function startProjectTitleEdit() {
  const titleWrap = document.querySelector(".project-generate-title");
  const titleText = document.querySelector("[data-project-title-text]");
  const titleInput = document.querySelector("[data-project-title-input]");
  if (!titleWrap || !titleText || !titleInput) return;
  titleInput.value = titleText.textContent.trim();
  titleInput.hidden = false;
  titleWrap.classList.add("is-editing");
  titleInput.focus();
  titleInput.select();
}

function saveProjectTitleEdit() {
  const titleWrap = document.querySelector(".project-generate-title");
  const titleText = document.querySelector("[data-project-title-text]");
  const titleInput = document.querySelector("[data-project-title-input]");
  if (!titleWrap || !titleText || !titleInput) return;
  const nextTitle = titleInput.value.trim() || titleText.textContent.trim();
  titleText.textContent = nextTitle;
  titleInput.value = nextTitle;
  titleInput.hidden = true;
  titleWrap.classList.remove("is-editing");
}

function cancelProjectTitleEdit() {
  const titleWrap = document.querySelector(".project-generate-title");
  const titleText = document.querySelector("[data-project-title-text]");
  const titleInput = document.querySelector("[data-project-title-input]");
  if (!titleWrap || !titleText || !titleInput) return;
  titleInput.value = titleText.textContent.trim();
  titleInput.hidden = true;
  titleWrap.classList.remove("is-editing");
}

function setProjectFissionButtons(text, disabled) {
  document.querySelectorAll("[data-project-fission]").forEach(button => {
    if (typeof disabled === "boolean") button.disabled = disabled;
    const label = button.querySelector("span");
    if (label) label.textContent = text;
  });
}

function syncProjectFissionCost(count = getProjectFissionCount()) {
  document.querySelectorAll("[data-project-fission-count]").forEach(select => {
    if (select.value !== String(count)) select.value = String(count);
  });
  document.querySelectorAll("[data-project-fission-cost]").forEach(item => {
    item.textContent = String(count * PROJECT_FISSION_BEAN_COST);
  });
}

function getProjectFissionCards() {
  return Array.from(document.querySelectorAll(".project-fission-result-grid > div"));
}

function ensureProjectFissionCardActions(card) {
  if (!card.querySelector(".poster-image")) {
    card.insertAdjacentHTML("beforeend", '<img class="poster-image" src="assets/task-video-cover.png" alt="">');
  }
  if (!card.querySelector("[data-project-fission-result-check]")) {
    card.insertAdjacentHTML("beforeend", '<button class="project-fission-card-check" type="button" data-project-fission-result-check aria-label="选择裂变视频"></button>');
  }
  if (!card.querySelector("[data-project-fission-result-download]")) {
    card.insertAdjacentHTML("beforeend", '<button class="project-fission-card-download" type="button" data-project-fission-result-download>下载</button>');
  }
  card.dataset.modal = "video-detail";
  card.dataset.videoTitle = card.dataset.videoTitle || "最终合成视频";
  card.dataset.videoCategory = card.dataset.videoCategory || "裂变视频";
}

function renderProjectFissionCards(generatedCount = 0, waitingText = "待生成") {
  getProjectFissionCards().forEach((card, index) => {
    const done = index < generatedCount;
    card.classList.toggle("done", done);
    card.classList.remove("is-selected");
    if (done) ensureProjectFissionCardActions(card);
    const label = card.querySelector("span");
    if (label) {
      label.className = done ? "poster-play" : "";
      label.textContent = done ? "" : waitingText;
    }
    if (!done) card.removeAttribute("data-modal");
  });
  resetProjectFissionSelection();
}

function updateProjectFissionSelection() {
  const selectedCount = document.querySelectorAll(".project-fission-result-grid > div.done.is-selected").length;
  const countLabel = document.querySelector("[data-project-fission-selected-count]");
  const downloadButton = document.querySelector("[data-project-fission-download]");
  if (countLabel) {
    countLabel.textContent = `已选：${selectedCount}个`;
    countLabel.hidden = selectedCount === 0;
  }
  if (downloadButton) {
    downloadButton.disabled = selectedCount === 0;
    downloadButton.classList.toggle("is-active", selectedCount > 0);
  }
}

function resetProjectFissionSelection() {
  document.querySelector(".project-fission-workspace")?.classList.remove("is-selecting");
  getProjectFissionCards().forEach(card => card.classList.remove("is-selected"));
  updateProjectFissionSelection();
}

function selectAllProjectFissionResults() {
  const doneCards = getProjectFissionCards().filter(card => card.classList.contains("done"));
  if (!doneCards.length) {
    showToast("暂无可选择的裂变视频");
    return;
  }
  document.querySelector(".project-fission-workspace")?.classList.add("is-selecting");
  doneCards.forEach(card => {
    ensureProjectFissionCardActions(card);
    card.classList.add("is-selected");
  });
  updateProjectFissionSelection();
}

function setBadgeState(el, state) {
  if (!el) return;
  el.classList.remove("info", "success", "warning", "danger", "gray");
  el.classList.add(state);
}

function getProjectResourceImage(type, trigger) {
  const image = trigger?.closest(".project-select-card, .project-library-video-card, .project-upload-drop")?.querySelector("img");
  return image?.getAttribute("src") || projectDetailResourceConfig[type]?.fallbackImage || "";
}

function getProjectMultiButtonId(button) {
  return button?.dataset.resourceLabel || "";
}

function renderProjectMultiResourceState(type) {
  if (!projectMultiResourceTypes.has(type)) return;
  const selected = projectMultiResourceDraft[type] || [];
  const selectedIds = new Set(selected.map(item => item.id));
  const isAtLimit = selected.length >= projectMultiResourceLimit;
  document.querySelectorAll(`[data-select-resource="${type}"]`).forEach(target => {
    const id = getProjectMultiButtonId(target);
    const card = target.closest(".project-select-card");
    const isSelected = selectedIds.has(id);
    card?.classList.toggle("is-multi-selected", isSelected);
    card?.classList.toggle("is-multi-limit", isAtLimit && !isSelected);
    if (target.tagName === "BUTTON") {
      target.classList.toggle("primary", isSelected);
      target.disabled = isAtLimit && !isSelected;
      target.textContent = isSelected ? "已选择" : "选择";
    }
  });
  const count = document.querySelector(`[data-project-multi-count="${type}"]`);
  if (count) count.textContent = `已选 ${selected.length}/${projectMultiResourceLimit}`;
}

function toggleProjectMultiResource(button) {
  const type = button?.dataset.selectResource;
  if (!projectMultiResourceTypes.has(type)) return false;
  const id = getProjectMultiButtonId(button);
  if (!id) return true;
  const selected = projectMultiResourceDraft[type];
  const existingIndex = selected.findIndex(item => item.id === id);
  if (existingIndex >= 0) {
    selected.splice(existingIndex, 1);
  } else {
    if (selected.length >= projectMultiResourceLimit) {
      showToast(`最多选择 ${projectMultiResourceLimit} 个`);
      renderProjectMultiResourceState(type);
      return true;
    }
    selected.push({
      id,
      label: button.dataset.resourceLabel,
      meta: button.dataset.resourceMeta,
      image: getProjectResourceImage(type, button)
    });
  }
  renderProjectMultiResourceState(type);
  return true;
}

function resetProjectResource(type) {
  const config = projectResourceMap[type];
  const resourceButton = document.querySelector(`[data-project-resource="${type}"]`);
  if (resourceButton && config) {
    const icon = resourceButton.querySelector(".project-attach-icon");
    resourceButton.textContent = projectResourceEmptyButtonLabelMap[type] || config.label;
    if (icon) resourceButton.prepend(icon);
    resourceButton.classList.remove("is-selected");
    resourceButton.removeAttribute("title");
  }
  const selectedLabel = document.querySelector(projectSelectedLabelMap[type]);
  if (selectedLabel) selectedLabel.textContent = "";
  const generatePage = document.querySelector("[data-project-generate-page]");
  if (generatePage?.classList.contains("is-active")) {
    renderProjectSelectedResource(type, null);
  }
}

function renderProjectSelectedResource(type, resource) {
  const config = projectDetailResourceConfig[type];
  const card = document.querySelector(`[data-project-selected-card="${type}"]`);
  if (!config || !card) return;

  card.classList.toggle("hero", type === "video");
  card.classList.toggle("compact", false);
  if (!resource) {
    card.classList.add("is-empty");
    card.innerHTML = `
      <span class="project-selected-card-label">${config.emptyTitle}</span>
      <button class="project-selected-empty-btn" type="button" data-project-empty-resource="${type}" data-modal="${config.modal}" aria-haspopup="dialog"><i></i>${config.emptyLabel}</button>
      <p>${config.emptyDesc}</p>
    `;
    return;
  }

  card.classList.remove("is-empty");
  const image = resource.image || config.fallbackImage;
  const removeButton = type === "video" ? '<button class="project-selected-remove" type="button" data-project-remove-resource="video">删除</button>' : "";
  card.innerHTML = `
    <div class="project-selected-card-top"><span class="project-selected-card-label">${config.label}</span>${removeButton}</div>
    <div class="${config.imageClass}"><img src="${image}" alt=""></div>
    <div>
      <strong ${projectSelectedLabelMap[type] ? projectSelectedLabelMap[type].replace("[", "").replace("]", "") : ""}>${resource.label}</strong>
      <p>${resource.desc || config.desc}</p>
    </div>
  `;
}

function openProjectEmptyResourceModal(trigger) {
  const type = trigger?.dataset.projectEmptyResource;
  const modal = trigger?.dataset.modal || projectDetailResourceConfig[type]?.modal;
  if (!modal) return false;
  openModal(modal, trigger);
  return true;
}

function confirmProjectMultiResource(type) {
  if (!projectMultiResourceTypes.has(type)) return;
  const selected = projectMultiResourceDraft[type] || [];
  if (!selected.length) {
    resetProjectResource(type);
    closeModals();
    showToast(type === "model" ? "已清空模特选择" : "已清空音色选择");
    return;
  }
  const first = selected[0];
  const label = selected.length === 1 ? first.label : `${first.label}等 ${selected.length} 个`;
  const meta = type === "model" ? `已选择 ${selected.length} 个模特` : `已选择 ${selected.length} 个音色`;
  selectResource(type, label, meta, {
    closest(selector) {
      if (selector === ".project-select-card, .project-library-video-card, .project-upload-drop") {
        return { querySelector: () => ({ getAttribute: () => first.image }) };
      }
      return null;
    }
  });
}

function resetProjectDetailProgress() {
  const generatePage = document.querySelector("[data-project-generate-page]");
  const outputBadge = document.querySelector("[data-project-output-badge]");
  const statusText = document.getElementById("projectCurrentStatus");
  const percent = document.getElementById("projectProgressPercent");
  const fill = document.getElementById("projectProgressFill");
  const previewTitle = document.querySelector("[data-project-preview-title]");
  const fissionCount = document.querySelector(".project-fission-workspace-head span");
  if (generatePage) generatePage.classList.remove("is-running", "is-generated", "is-fission", "is-task-failed");
  if (outputBadge) outputBadge.textContent = "待生成";
  if (statusText) statusText.textContent = "等待提交生成任务";
  if (percent) percent.textContent = "0%";
  if (fill) fill.style.width = "0%";
  if (previewTitle) previewTitle.textContent = "等待生成";
  if (fissionCount) fissionCount.textContent = "已生成 0 个";
  document.querySelectorAll("[data-project-status-step]").forEach(item => {
    item.classList.toggle("active", Number(item.dataset.projectStatusStep) === 1);
  });
  document.querySelectorAll("[data-project-flow-step]").forEach(item => {
    item.classList.toggle("active", Number(item.dataset.projectFlowStep) === 1);
    item.classList.remove("complete");
  });
  document.querySelectorAll(".project-flow-steps i").forEach(line => line.classList.remove("complete"));
  renderProjectFissionCards(0, "待生成");
  setProjectFissionButtons("一键裂变", true);
  syncProjectFissionCost();
}

function openProjectRemakeDetail() {
  const generatePage = document.querySelector("[data-project-generate-page]");
  if (!generatePage) return;
  clearInterval(projectGenerateTimer);
  closeModals();
  const navButton = document.querySelector('button[data-page="project"]');
  show("project", navButton);
  generatePage.classList.add("is-active");
  resetProjectDetailProgress();

  const headerBadge = generatePage.querySelector(".project-generate-title .badge");
  const headerTitle = generatePage.querySelector("[data-project-title-text]");
  const headerTitleInput = generatePage.querySelector("[data-project-title-input]");
  const headerDesc = generatePage.querySelector(".project-generate-title p");
  if (headerBadge) {
    headerBadge.textContent = "视频生成";
    setBadgeState(headerBadge, "info");
  }
  if (headerTitle) headerTitle.textContent = `复刻-${currentVideoDetail.title}`;
  if (headerTitleInput) headerTitleInput.value = `复刻-${currentVideoDetail.title}`;
  if (headerDesc) headerDesc.textContent = "已带入参考视频，请补充商品图、模特和音色后立即生成。";

  renderProjectSelectedResource("video", {
    label: currentVideoDetail.title,
    image: currentVideoDetail.image,
    desc: "镜头节奏、构图和口播结构将作为本次生成参考。"
  });
  renderProjectSelectedResource("product", null);
  renderProjectSelectedResource("model", null);
  renderProjectSelectedResource("voice", null);
  showToast("已带入参考视频，可继续补充素材");
}

function selectResource(type, label, meta, trigger) {
  const config = projectResourceMap[type];
  if (!config) return;
  const generatePage = document.querySelector("[data-project-generate-page]");
  const isProjectDetailActive = generatePage?.classList.contains("is-active");
  const resourceButton = document.querySelector(`[data-project-resource="${type}"]`);
  if (resourceButton) {
    const icon = resourceButton.querySelector(".project-attach-icon");
    resourceButton.textContent = `${config.prefix}`;
    if (icon) resourceButton.prepend(icon);
    resourceButton.classList.add("is-selected");
    resourceButton.title = label;
  }
  const selectedLabel = document.querySelector(projectSelectedLabelMap[type]);
  if (selectedLabel) selectedLabel.textContent = label;
  if (isProjectDetailActive) {
    renderProjectSelectedResource(type, {
      label,
      image: getProjectResourceImage(type, trigger),
      desc: projectMultiResourceTypes.has(type) && meta ? meta : projectDetailResourceConfig[type]?.desc
    });
  }
  closeModals();
  if (!isProjectDetailActive) {
    const navButton = document.querySelector('button[data-page="project"]');
    show("project", navButton);
  }
  showToast(meta || `${label}已用于当前项目`);
}

const projectGenerateSteps = [
  { text: "正在解析参考视频", percent: 35, flow: 1, status: 1, badge: "解析中" },
  { text: "正在生成视频成片", percent: 72, flow: 2, status: 2, badge: "成片中" },
  { text: "生成完成，可进行视频裂变", percent: 100, flow: 2, status: 3, badge: "已完成", generated: true }
];
let projectGenerateTimer;

const taskProjectDetailMap = {
  "task-1": {
    badge: ["生成中", "info"],
    title: "夏季防晒衣穿搭口播生成",
    desc: "保留任务记录中的生成进度、商品、模特和音色参数。",
    status: "分镜生成中，已完成 3/5",
    percent: 68,
    flow: 2,
    statusStep: 2,
    generated: false,
    cover: "assets/task-video-cover.png",
    previewTitle: "夏季防晒衣穿搭口播",
    previewMeta: "竖版 9:16 · 36 秒 · 720P",
    selected: {
      video: "夏季防晒衣穿搭口播",
      product: "防晒衣",
      model: "都市通勤女模特",
      voice: "清爽女声"
    },
    metrics: ["3/5 分镜", "720P 输出", "AI 口播"],
    fissionCount: "已生成 0 个"
  },
  "task-2": {
    badge: ["已完成", "success"],
    title: "补水面膜卖点口播成片",
    desc: "保留任务记录中的成片结果、商品参数和音色配置。",
    status: "成片已生成，可下载或裂变",
    percent: 100,
    flow: 2,
    statusStep: 3,
    generated: true,
    cover: "assets/task-video-cover.png",
    previewTitle: "补水面膜卖点口播成片",
    previewMeta: "竖版 9:16 · 22 秒 · 720P",
    selected: {
      video: "补水面膜卖点口播",
      product: "补水面膜",
      model: "未使用",
      voice: "促销播报"
    },
    metrics: ["已成片", "720P 输出", "可裂变"],
    fissionCount: "已生成 1 个"
  },
  "task-3": {
    badge: ["已完成", "success"],
    title: "贵人鸟老爹鞋商品素材处理",
    desc: "保留任务记录中的素材处理进度、商品参数和生成内容。",
    status: "商品解析与多视角图已完成",
    percent: 100,
    flow: 2,
    statusStep: 3,
    generated: true,
    cover: "assets/product-cover-01.png",
    previewTitle: "老爹鞋多视角商品图",
    previewMeta: "5 张原图 · 7 项卖点 · 多视角已生成",
    selected: {
      video: "商品素材处理",
      product: "贵人鸟老爹鞋",
      model: "正面 / 侧面 / 鞋底 / Logo",
      voice: "可用于创作"
    },
    metrics: ["5 张图", "7 项卖点", "多视角"],
    fissionCount: "已生成 0 个"
  },
  "task-4": {
    badge: ["失败", "danger"],
    title: "连衣裙大促短视频裂变任务",
    desc: "保留任务记录中的失败阶段、裂变进度和已配置参数。",
    status: "7/10 已完成，失败阶段：分镜 4",
    percent: 70,
    flow: 3,
    statusStep: 2,
    generated: false,
    failed: true,
    cover: "assets/task-video-cover.png",
    previewTitle: "连衣裙大促视频裂变",
    previewMeta: "竖版 9:16 · 10 条变体 · 分镜 4 失败",
    selected: {
      video: "连衣裙大促视频裂变",
      product: "白色连衣裙",
      model: "家居生活场景模特",
      voice: "建议更换参考图"
    },
    metrics: ["7/10 完成", "3 条重试", "裂变任务"],
    fissionCount: "已生成 7 个"
  }
};

function updateTaskDetailFlow(data) {
  document.querySelectorAll("[data-project-status-step]").forEach(item => {
    item.classList.toggle("active", Number(item.dataset.projectStatusStep) === data.statusStep);
  });

  document.querySelectorAll("[data-project-flow-step]").forEach(item => {
    const index = Number(item.dataset.projectFlowStep);
    item.classList.toggle("active", index === data.flow);
    item.classList.toggle("complete", index < data.flow || (data.generated && index === data.flow));
  });

  document.querySelectorAll(".project-flow-steps i").forEach((line, index) => {
    line.classList.toggle("complete", index + 1 < data.flow || (data.generated && index + 1 === data.flow));
  });
}

function openTaskProjectDetail(taskId, trigger) {
  const data = taskProjectDetailMap[taskId];
  const generatePage = document.querySelector("[data-project-generate-page]");
  if (!data || !generatePage) return;

  clearInterval(projectGenerateTimer);
  closeModals();
  const navButton = document.querySelector('button[data-page="project"]');
  show("project", navButton);

  generatePage.classList.remove("is-running", "is-generated", "is-fission", "is-task-failed");
  generatePage.classList.add("is-active", data.generated ? "is-generated" : "is-running");
  generatePage.classList.toggle("is-task-failed", Boolean(data.failed));

  const headerBadge = generatePage.querySelector(".project-generate-title .badge");
  const headerTitle = generatePage.querySelector("[data-project-title-text]");
  const headerTitleInput = generatePage.querySelector("[data-project-title-input]");
  const headerDesc = generatePage.querySelector(".project-generate-title p");
  if (headerBadge) {
    headerBadge.textContent = data.badge[0];
    setBadgeState(headerBadge, data.badge[1]);
  }
  if (headerTitle) headerTitle.textContent = data.title;
  if (headerTitleInput) headerTitleInput.value = data.title;
  if (headerDesc) headerDesc.textContent = data.desc;

  const outputBadge = document.querySelector("[data-project-output-badge]");
  const statusText = document.getElementById("projectCurrentStatus");
  const percent = document.getElementById("projectProgressPercent");
  const fill = document.getElementById("projectProgressFill");
  const previewTitle = document.querySelector("[data-project-preview-title]");
  const previewMeta = generatePage.querySelector(".project-preview-head p");
  const previewImage = generatePage.querySelector(".project-generation-phone img");
  const fissionButton = document.querySelector("[data-project-fission]");
  const fissionCount = document.querySelector(".project-fission-workspace-head span");

  if (outputBadge) outputBadge.textContent = data.badge[0];
  if (statusText) statusText.textContent = data.status;
  if (percent) percent.textContent = `${data.percent}%`;
  if (fill) fill.style.width = `${data.percent}%`;
  if (previewTitle) previewTitle.textContent = data.previewTitle;
  if (previewMeta) previewMeta.textContent = data.previewMeta;
  if (previewImage) previewImage.src = data.cover;
  if (fissionButton) {
    setProjectFissionButtons("一键裂变", !data.generated);
  }
  if (fissionCount) fissionCount.textContent = data.fissionCount;

  Object.entries(data.selected).forEach(([type, label]) => {
    const target = document.querySelector(projectSelectedLabelMap[type]);
    if (target) target.textContent = label;
    renderProjectSelectedResource(type, {
      label,
      image: type === "video" ? data.cover : projectDetailResourceConfig[type]?.fallbackImage,
      desc: projectDetailResourceConfig[type]?.desc
    });
  });

  document.querySelectorAll(".project-preview-metrics span").forEach((item, index) => {
    if (!data.metrics[index]) return;
    const parts = data.metrics[index].split(" ");
    item.innerHTML = parts.length > 1 ? `<b>${parts[0]}</b> ${parts.slice(1).join(" ")}` : `<b>${data.metrics[index]}</b>`;
  });

  renderProjectFissionCards(data.generated ? 12 : (data.failed ? 7 : 0), "待生成");

  updateTaskDetailFlow(data);

  if (trigger) {
    document.querySelectorAll("#taskList [data-task]").forEach(card => {
      card.classList.toggle("active", card.dataset.task === taskId);
    });
  }
}

function updateProjectGenerateState(stepIndex) {
  const step = projectGenerateSteps[Math.min(stepIndex, projectGenerateSteps.length - 1)];
  const percent = document.getElementById("projectProgressPercent");
  const fill = document.getElementById("projectProgressFill");
  const statusText = document.getElementById("projectCurrentStatus");
  const outputPanel = document.querySelector("[data-project-generate-page]");
  const outputBadge = document.querySelector("[data-project-output-badge]");
  const fissionButton = document.querySelector("[data-project-fission]");
  const previewTitle = document.querySelector("[data-project-preview-title]");
  if (percent) percent.textContent = `${step.percent}%`;
  if (fill) fill.style.width = `${step.percent}%`;
  if (statusText) statusText.textContent = step.text;
  if (outputBadge) outputBadge.textContent = step.badge || "生成中";
  if (previewTitle) previewTitle.textContent = step.generated ? "最终合成视频" : "正在生成";
  if (outputPanel) {
    outputPanel.classList.toggle("is-generated", Boolean(step.generated));
    outputPanel.classList.toggle("is-running", !step.generated);
  }
  if (fissionButton) setProjectFissionButtons("一键裂变", !step.generated);

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
  const outputPanel = document.querySelector("[data-project-generate-page]");
  const outputBadge = document.querySelector("[data-project-output-badge]");
  const statusText = document.getElementById("projectCurrentStatus");
  const fissionCountValue = getProjectFissionCount();
  if (!outputPanel?.classList.contains("is-generated")) {
    showToast("请先生成成片");
    return;
  }

  outputPanel.classList.add("is-fission");
  if (outputBadge) outputBadge.textContent = "裂变中";
  if (statusText) statusText.textContent = `正在生成 ${fissionCountValue} 个场景裂变视频`;
  setProjectFissionButtons("裂变中", true);

  document.querySelectorAll("[data-project-flow-step]").forEach(item => {
    const index = Number(item.dataset.projectFlowStep);
    item.classList.toggle("active", index === 3);
    item.classList.toggle("complete", index < 3);
  });
  document.querySelectorAll(".project-flow-steps i").forEach(line => line.classList.add("complete"));

  setTimeout(() => {
    if (outputBadge) outputBadge.textContent = "裂变完成";
    if (statusText) statusText.textContent = `已生成 ${fissionCountValue} 个场景裂变视频`;
    const fissionCount = document.querySelector(".project-fission-workspace-head span");
    if (fissionCount) fissionCount.textContent = `已生成 ${fissionCountValue} 个`;
    renderProjectFissionCards(fissionCountValue, "待选择");
    setProjectFissionButtons(`再裂变 ${fissionCountValue} 个`, false);
    showToast(`已生成 ${fissionCountValue} 个裂变视频`);
  }, 900);
}

function startProjectGenerate() {
  closeModals();
  const generatePage = document.querySelector("[data-project-generate-page]");
  if (generatePage) generatePage.classList.add("is-active");
  showToast("生成任务已提交");
  clearInterval(projectGenerateTimer);
  const outputPanel = document.querySelector("[data-project-generate-page]");
  const fissionButton = document.querySelector("[data-project-fission]");
  if (outputPanel) outputPanel.classList.remove("is-generated", "is-fission", "is-running", "is-task-failed");
  const fissionCount = document.querySelector(".project-fission-workspace-head span");
  if (fissionCount) fissionCount.textContent = "已生成 0 个";
  renderProjectFissionCards(0, "待生成");
  if (fissionButton) setProjectFissionButtons("一键裂变", true);
  syncProjectFissionCost();
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
  "美妆": {
    summary: "美妆建议补齐产品正面、外包装和关键质地细节。",
    slots: [["正面图", "必传"], ["包装图", "必传"], ["质地 / 色号", "建议上传"], ["Logo / 标签", "建议上传"]]
  },
  "其他": {
    summary: "其他品类先上传正面图和背景图，也可以自主添加补充图片。",
    slots: [["正面图", "必传"], ["背景图", "必传"], ["自主添加图片", "建议上传"]]
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
  const rule = uploadSlotRules[category] || uploadSlotRules["其他"];
  const summary = root.querySelector("[data-upload-slot-summary]");
  if (summary) summary.textContent = rule.summary;
  slots.replaceChildren();
  rule.slots.forEach(([title, desc]) => {
    const slot = document.createElement("div");
    const body = document.createElement("div");
    const strong = document.createElement("strong");
    const state = document.createElement("span");
    slot.className = desc === "必传" ? "upload-slot required" : "upload-slot";
    strong.textContent = title;
    state.className = desc === "必传" ? "upload-slot-state required" : "upload-slot-state";
    state.textContent = desc;
    body.append(strong, state);
    slot.appendChild(body);
    slots.appendChild(slot);
  });
}

function createCustomUploadCategory(input) {
  const category = input.value.trim();
  const row = input.closest(".product-category-row");
  const modal = input.closest(".modal") || document;
  if (!row) return;
  if (!category) {
    input.replaceWith(createCustomUploadTrigger());
    return;
  }

  const existing = Array.from(row.querySelectorAll("[data-upload-category]")).find(item => item.dataset.uploadCategory === category);
  const customTrigger = row.querySelector("[data-upload-custom-category]");
  const target = existing || document.createElement("button");
  if (!existing) {
    target.className = "pill-btn";
    target.type = "button";
    target.dataset.uploadCategory = category;
    target.dataset.customUploadCategory = "true";
    target.textContent = category;
    row.insertBefore(target, input);
  }

  row.querySelectorAll("[data-upload-category]").forEach(item => item.classList.toggle("active", item === target));
  input.replaceWith(customTrigger || createCustomUploadTrigger());
  updateUploadSlots(category, modal);
  if (modal.classList?.contains("product-create-modal")) syncProductResult(modal);
}

function createCustomUploadTrigger() {
  const button = document.createElement("button");
  button.className = "pill-btn";
  button.type = "button";
  button.dataset.uploadCustomCategory = "";
  button.textContent = "自定义";
  return button;
}

function showCustomUploadCategoryInput(trigger) {
  const input = document.createElement("input");
  input.className = "product-custom-category-input";
  input.type = "text";
  input.placeholder = "输入品类";
  input.maxLength = 12;
  trigger.replaceWith(input);
  input.focus();
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
  if (resultSelect) {
    const hasOption = Array.from(resultSelect.options).some(option => option.value === activeCategory);
    if (!hasOption) resultSelect.appendChild(new Option(activeCategory, activeCategory));
    resultSelect.value = activeCategory;
  }
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
  panel.querySelector(".product-custom-category-input")?.replaceWith(createCustomUploadTrigger());
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

document.querySelector(".project-selected-rail")?.addEventListener("click", event => {
  const projectEmptyResource = event.target.closest("[data-project-empty-resource]");
  if (!projectEmptyResource) return;
  event.preventDefault();
  event.stopPropagation();
  openProjectEmptyResourceModal(projectEmptyResource);
});

document.addEventListener("click", event => {
  const projectMyVideoPlay = event.target.closest("[data-project-my-video-play]");
  if (projectMyVideoPlay) {
    event.preventDefault();
    event.stopPropagation();
    openProjectMyVideoFullscreen(projectMyVideoPlay.closest(".project-my-video-card"));
    return;
  }

  const projectMyVideoRemake = event.target.closest("[data-project-my-video-remake]");
  if (projectMyVideoRemake) {
    event.preventDefault();
    event.stopPropagation();
    setCurrentVideoDetailFromProjectCard(projectMyVideoRemake.closest(".project-my-video-card"));
    openProjectRemakeDetail();
    return;
  }

  const projectMyVideoFullscreenClose = event.target.closest("[data-project-my-video-fullscreen-close]");
  if (projectMyVideoFullscreenClose) {
    event.preventDefault();
    closeProjectMyVideoFullscreen();
    return;
  }

  const projectRemake = event.target.closest("[data-project-remake]");
  if (projectRemake) {
    event.preventDefault();
    event.stopPropagation();
    openProjectRemakeDetail();
    return;
  }

  const projectVoicePlayTrigger = event.target.closest('[data-modal-panel="project-voice-select"] .voice-play');
  if (projectVoicePlayTrigger) {
    event.preventDefault();
    event.stopPropagation();
    setActiveVoicePlay(projectVoicePlayTrigger);
    return;
  }

  const multiResourceCard = event.target.closest('[data-modal-panel="project-model-select"] .project-select-card, [data-modal-panel="project-voice-select"] .project-select-card');
  if (multiResourceCard && !event.target.closest("button")) {
    const selectTarget = multiResourceCard.matches("[data-select-resource]")
      ? multiResourceCard
      : multiResourceCard.querySelector("[data-select-resource]");
    if (selectTarget) {
      event.preventDefault();
      event.stopPropagation();
      toggleProjectMultiResource(selectTarget);
      return;
    }
  }

  const selectTrigger = event.target.closest("[data-select-resource]");
  if (selectTrigger) {
    event.preventDefault();
    event.stopPropagation();
    if (projectMultiResourceTypes.has(selectTrigger.dataset.selectResource)) {
      toggleProjectMultiResource(selectTrigger);
      return;
    }
    selectResource(selectTrigger.dataset.selectResource, selectTrigger.dataset.resourceLabel, selectTrigger.dataset.resourceMeta, selectTrigger);
    return;
  }

  const confirmProjectMulti = event.target.closest("[data-confirm-project-multi]");
  if (confirmProjectMulti) {
    event.preventDefault();
    event.stopPropagation();
    confirmProjectMultiResource(confirmProjectMulti.dataset.confirmProjectMulti);
    return;
  }

  const projectParamTrigger = event.target.closest("[data-project-param-trigger]");
  if (projectParamTrigger) {
    event.preventDefault();
    event.stopPropagation();
    const wrap = projectParamTrigger.closest("[data-project-param-wrap]");
    if (wrap?.classList.contains("is-open")) {
      closeProjectParamPopover();
    } else {
      openProjectParamPopover();
    }
    return;
  }

  const projectParamOption = event.target.closest("[data-project-param-option]");
  if (projectParamOption) {
    event.preventDefault();
    const key = projectParamOption.dataset.projectParamOption;
    if (key) {
      projectParamDraft[key] = projectParamOption.dataset.value;
      renderProjectParamOptions();
    }
    return;
  }

  const projectParamCancel = event.target.closest("[data-project-param-cancel]");
  if (projectParamCancel) {
    event.preventDefault();
    projectParamDraft = { ...projectParamState };
    closeProjectParamPopover();
    return;
  }

  const projectParamConfirm = event.target.closest("[data-project-param-confirm]");
  if (projectParamConfirm) {
    event.preventDefault();
    confirmProjectParamPopover();
    return;
  }

  const openProjectParam = document.querySelector("[data-project-param-wrap].is-open");
  if (openProjectParam && !event.target.closest("[data-project-param-wrap]")) closeProjectParamPopover();

  const projectTitleEdit = event.target.closest("[data-project-title-edit]");
  if (projectTitleEdit) {
    event.preventDefault();
    startProjectTitleEdit();
    return;
  }

  const generateTrigger = event.target.closest("[data-start-generate]");
  if (generateTrigger) {
    event.preventDefault();
    startProjectGenerate();
    return;
  }

  const taskProjectDetail = event.target.closest("[data-task-project-detail]");
  if (taskProjectDetail) {
    event.preventDefault();
    event.stopPropagation();
    openTaskProjectDetail(taskProjectDetail.dataset.taskProjectDetail, taskProjectDetail);
    return;
  }

  const fissionSelectAll = event.target.closest("[data-project-fission-select-all]");
  if (fissionSelectAll) {
    event.preventDefault();
    selectAllProjectFissionResults();
    return;
  }

  const fissionBatchDownload = event.target.closest("[data-project-fission-download]");
  if (fissionBatchDownload) {
    event.preventDefault();
    const selectedCount = document.querySelectorAll(".project-fission-result-grid > div.done.is-selected").length;
    if (!selectedCount) return;
    showToast(`已开始下载 ${selectedCount} 个裂变视频`);
    return;
  }

  const fissionCardDownload = event.target.closest("[data-project-fission-result-download]");
  if (fissionCardDownload) {
    event.preventDefault();
    event.stopPropagation();
    showToast("裂变视频下载已开始");
    return;
  }

  const fissionCardCheck = event.target.closest("[data-project-fission-result-check]");
  if (fissionCardCheck) {
    event.preventDefault();
    event.stopPropagation();
    const card = fissionCardCheck.closest(".project-fission-result-grid > div.done");
    if (!card) return;
    card.classList.toggle("is-selected");
    updateProjectFissionSelection();
    return;
  }

  const fissionDoneCard = event.target.closest(".project-fission-result-grid > div.done");
  if (fissionDoneCard) {
    event.preventDefault();
    if (fissionDoneCard.closest(".project-fission-workspace")?.classList.contains("is-selecting")) {
      fissionDoneCard.classList.toggle("is-selected");
      updateProjectFissionSelection();
      return;
    }
    hydrateVideoDetail(fissionDoneCard);
    openModal("video-detail", fissionDoneCard);
    return;
  }

  const projectFission = event.target.closest("[data-project-fission]");
  if (projectFission) {
    event.preventDefault();
    startProjectFission();
    return;
  }

  const projectRemoveResource = event.target.closest("[data-project-remove-resource]");
  if (projectRemoveResource) {
    event.preventDefault();
    renderProjectSelectedResource(projectRemoveResource.dataset.projectRemoveResource, null);
    showToast("已移除参考视频");
    return;
  }

  const projectEmptyResource = event.target.closest("[data-project-empty-resource]");
  if (projectEmptyResource) {
    event.preventDefault();
    event.stopPropagation();
    openProjectEmptyResourceModal(projectEmptyResource);
    return;
  }

  const projectGenerateBack = event.target.closest("[data-project-generate-back]");
  if (projectGenerateBack) {
    event.preventDefault();
    openModal("project-exit-confirm");
    return;
  }

  const projectConfirmLeave = event.target.closest("[data-project-confirm-leave]");
  if (projectConfirmLeave) {
    event.preventDefault();
    clearInterval(projectGenerateTimer);
    document.querySelector("[data-project-generate-page]")?.classList.remove("is-active", "is-running", "is-generated", "is-fission");
    closeModals();
    return;
  }

  const projectBackToVideo = event.target.closest("[data-project-back-to-video]");
  if (projectBackToVideo) {
    event.preventDefault();
    document.querySelector("[data-project-generate-page]")?.classList.remove("is-fission");
    return;
  }

  const projectVideoTab = event.target.closest("[data-project-video-tab]");
  if (projectVideoTab) {
    event.preventDefault();
    const board = projectVideoTab.closest(".project-video-board");
    const target = projectVideoTab.dataset.projectVideoTab;
    if (!board) return;
    board.querySelectorAll("[data-project-video-tab]").forEach(button => {
      button.classList.toggle("active", button === projectVideoTab);
    });
    board.querySelectorAll("[data-project-video-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.projectVideoPanel === target);
    });
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

  const projectRefTab = event.target.closest("[data-project-ref-tab]");
  if (projectRefTab) {
    event.preventDefault();
    const modal = projectRefTab.closest(".project-select-modal");
    const mode = projectRefTab.dataset.projectRefTab;
    if (!modal) return;
    modal.querySelectorAll("[data-project-ref-tab]").forEach(button => {
      button.classList.toggle("active", button === projectRefTab);
    });
    modal.querySelectorAll("[data-project-ref-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.projectRefPanel === mode);
    });
    return;
  }

  const projectSelectFilter = event.target.closest("[data-project-select-filter]");
  if (projectSelectFilter) {
    event.preventDefault();
    const modal = projectSelectFilter.closest(".project-select-modal");
    const value = projectSelectFilter.dataset.projectSelectFilter;
    if (!modal) return;
    modal.querySelectorAll("[data-project-select-filter]").forEach(button => {
      button.classList.toggle("active", button === projectSelectFilter);
    });
    modal.querySelectorAll("[data-project-select-category]").forEach(card => {
      const category = card.dataset.projectSelectCategory || "";
      card.hidden = value !== "all" && !category.includes(value);
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

  const modelCreateChoice = event.target.closest("[data-model-create-choice]");
  if (modelCreateChoice) {
    event.preventDefault();
    openModal("model-create", modelCreateChoice);
    return;
  }

  const modelTextSectionTab = event.target.closest("[data-model-text-section-tab]");
  if (modelTextSectionTab) {
    event.preventDefault();
    const panel = getModelCreateModal();
    const target = modelTextSectionTab.dataset.modelTextSectionTab;
    panel?.querySelectorAll("[data-model-text-section-tab]").forEach(button => {
      button.classList.toggle("active", button === modelTextSectionTab);
    });
    panel?.querySelectorAll("[data-model-text-section]").forEach(section => {
      section.classList.toggle("active", section.dataset.modelTextSection === target);
    });
    return;
  }

  const textModelOption = event.target.closest('[data-model-create-mode-panel="text"] .model-option-grid button');
  if (textModelOption) {
    event.preventDefault();
    const group = textModelOption.closest(".model-option-grid");
    if (group?.hasAttribute("data-model-text-required")) {
      group.querySelectorAll("button").forEach(button => {
        button.classList.toggle("active", button === textModelOption);
      });
    } else {
      textModelOption.classList.toggle("active");
    }
    updateTextModelSummary();
    return;
  }

  const textModelReference = event.target.closest("[data-text-model-reference]");
  if (textModelReference) {
    event.preventDefault();
    analyzeTextModelReference();
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
    if (getModelCreateMode(panel) === "text") {
      submitTextModelCreate();
      return;
    }
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

  const modelCreateTagEdit = event.target.closest("[data-model-create-tag-edit]");
  if (modelCreateTagEdit) {
    event.preventDefault();
    if (modelCreateTagEdit.disabled) return;
    const field = modelCreateTagEdit.closest("[data-model-create-tag-field]");
    field?.classList.toggle("is-editing");
    modelCreateTagEdit.textContent = field?.classList.contains("is-editing") ? "收起" : "修改";
    return;
  }

  const modelCreateTagOption = event.target.closest("[data-model-create-tag-option]");
  if (modelCreateTagOption) {
    event.preventDefault();
    if (modelCreateTagOption.disabled) return;
    const field = modelCreateTagOption.closest("[data-model-create-tag-field]");
    const dimension = modelCreateTagOption.dataset.modelTagDimension;
    if (dimension) {
      field?.querySelectorAll(`[data-model-tag-dimension="${dimension}"]`).forEach(button => {
        button.classList.toggle("active", button === modelCreateTagOption);
      });
    } else {
      modelCreateTagOption.classList.toggle("active");
    }
    if (field) renderModelGeneratedTags(field);
    return;
  }

  const modelEditPresetTag = event.target.closest("[data-model-edit-preset-tag]");
  if (modelEditPresetTag) {
    event.preventDefault();
    toggleModelEditPresetTag(modelEditPresetTag);
    return;
  }

  const modelEditTag = event.target.closest('[data-modal-panel="model-edit"] .model-edit-tag');
  if (modelEditTag) {
    event.preventDefault();
    modelEditTag.remove();
    syncModelEditPresetTags();
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

  const customUploadCategory = event.target.closest("[data-upload-custom-category]");
  if (customUploadCategory) {
    event.preventDefault();
    showCustomUploadCategoryInput(customUploadCategory);
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
  const projectFissionCount = event.target.closest("[data-project-fission-count]");
  if (projectFissionCount) {
    syncProjectFissionCost(Number(projectFissionCount.value));
    return;
  }

  const voiceAudioInput = event.target.closest("[data-voice-audio-input]");
  if (voiceAudioInput) renderVoiceAudioFile(voiceAudioInput);
});

document.addEventListener("input", event => {
  const projectDurationInput = event.target.closest("[data-project-duration-range], [data-project-duration-input]");
  if (projectDurationInput) {
    projectParamDraft.durationMode = "custom";
    projectParamDraft.duration = normalizeProjectDuration(projectDurationInput.value);
    renderProjectParamOptions();
    return;
  }

  const productNameInput = event.target.closest("[data-product-name-input]");
  if (productNameInput) {
    const modal = productNameInput.closest(".product-create-modal");
    syncProductNameCount(modal);
    syncProductResult(modal);
  }

  const textModelInput = event.target.closest('[data-model-create-mode-panel="text"] .model-text-custom, [data-model-text-prompt]');
  if (textModelInput) {
    updateTextModelSummary();
  }
});

document.addEventListener("keydown", event => {
  const customUploadCategoryInput = event.target.closest(".product-custom-category-input");
  if (customUploadCategoryInput && event.key === "Enter") {
    event.preventDefault();
    createCustomUploadCategory(customUploadCategoryInput);
    return;
  }
  if (customUploadCategoryInput && event.key === "Escape") {
    event.preventDefault();
    customUploadCategoryInput.replaceWith(createCustomUploadTrigger());
    return;
  }

  const modelEditTagInput = event.target.closest("[data-model-edit-tag-input]");
  if (modelEditTagInput && event.key === "Enter") {
    event.preventDefault();
    addModelEditTag(modelEditTagInput);
    return;
  }

  const projectTitleInput = event.target.closest("[data-project-title-input]");
  if (projectTitleInput && event.key === "Enter") {
    event.preventDefault();
    saveProjectTitleEdit();
    return;
  }
  if (projectTitleInput && event.key === "Escape") {
    event.preventDefault();
    cancelProjectTitleEdit();
    return;
  }

  if (event.key === "Escape" && document.querySelector(".project-my-video-fullscreen")) {
    event.preventDefault();
    closeProjectMyVideoFullscreen();
    return;
  }

  if (event.key === "Escape") closeModals();
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-voice-audio-uploader]")) {
    event.preventDefault();
    const input = event.target.querySelector("[data-voice-audio-input]");
    if (input) input.click();
  }
});

document.addEventListener("focusout", event => {
  if (event.target.closest("[data-project-title-input]")) saveProjectTitleEdit();
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
