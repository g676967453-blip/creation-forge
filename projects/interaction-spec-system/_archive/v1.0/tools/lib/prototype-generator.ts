/**
 * 可交互原型生成引擎
 * 将组件代码注入原型模板，生成可点击走通的多屏游戏原型
 */
import * as fs from "fs";
import * as path from "path";
import { parseAllComponents, type ComponentSpec } from "./component-parser";
import { getTokenCSS, type TokenOverrides } from "./shared/tokens";

/** 单个屏幕配置 */
export interface ScreenConfig {
  id: string;
  name: string;
  showHud?: boolean;
  sections: SectionConfig[];
}

/** 屏幕中的一个区块 */
export interface SectionConfig {
  type: string;       // 组件名 (对应 components/*.md 中的 component 字段)
  html?: string;      // 直接 HTML（优先于 type 查找）
  props?: Record<string, string>; // 简单属性注入
}

/** Dock 项配置 */
export interface DockItemConfig {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  centerCta?: boolean;
}

/** 完整原型配置 */
export interface PrototypeConfig {
  title?: string;
  canvas?: string;
  screens: ScreenConfig[];
  dock?: DockItemConfig[];
  showHud?: boolean;
}

const TEMPLATE_PATH = path.resolve(__dirname, "../../templates/prototype-interactive.html");

/**
 * 从组件库中按名称查找组件
 */
function findComponent(components: ComponentSpec[], name: string): ComponentSpec | undefined {
  return components.find((c) => c.meta.component === name);
}

/**
 * 将组件 HTML 注入到屏幕中
 */
function buildScreenHTML(
  screen: ScreenConfig,
  components: ComponentSpec[],
  allCSS: string
): string {
  const sections = screen.sections
    .map((section) => {
      // 优先使用直接 HTML
      if (section.html) return section.html;

      // 从组件库查找
      const comp = findComponent(components, section.type);
      if (comp && comp.htmlCode) {
        let html = comp.htmlCode;
        // 简单属性替换
        if (section.props) {
          for (const [key, value] of Object.entries(section.props)) {
            html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
          }
        }
        return html;
      }

      return `<!-- 组件 "${section.type}" 未找到 -->`;
    })
    .join("\n");

  return `
<div class="screen active" data-screen-id="${screen.id}" data-show-hud="${screen.showHud !== false}">
  ${sections}
</div>`;
}

/**
 * 构建 HUD HTML
 */
function buildHudHTML(components: ComponentSpec[]): string {
  const hud = findComponent(components, "hud");
  if (hud && hud.htmlCode) {
    return `<header class="hud" id="protoHud">${hud.htmlCode}</header>`;
  }
  return "";
}

/**
 * 构建 Dock HTML
 */
function buildDockHTML(
  dockConfig: DockItemConfig[],
  components: ComponentSpec[]
): string {
  if (!dockConfig || dockConfig.length === 0) return "";

  const items = dockConfig
    .map((item) => {
      if (item.centerCta) {
        return `<button class="dock-cta" data-screen="${item.id}">＋</button>`;
      }
      return `
<button class="dock-item${item.id === dockConfig[0]?.id ? " active" : ""}" data-screen="${item.id}">
  <span class="dock-icon">${item.icon}</span>
  <span class="dock-label">${item.label}</span>
  ${item.badge ? `<span class="dock-badge">${item.badge}</span>` : ""}
</button>`;
    })
    .join("");

  return `<nav class="dock">${items}</nav>`;
}

/**
 * 生成完整的可交互原型 HTML
 */
export function generatePrototype(
  config: PrototypeConfig,
  components: ComponentSpec[],
  tokenOverrides?: TokenOverrides
): string {
  // 读取模板
  let template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

  // 注入 Token CSS
  const tokensCSS = getTokenCSS(tokenOverrides);
  template = template.replace("/* __TOKENS_CSS__ */", tokensCSS);

  // 收集所有组件 CSS
  const allCSS = components.map((c) => c.cssCode).filter(Boolean).join("\n\n");
  template = template.replace("/* __COMPONENTS_CSS__ */", allCSS);

  // 构建所有屏幕 HTML
  const screensHTML = config.screens
    .map((screen) => buildScreenHTML(screen, components, allCSS))
    .join("\n");
  template = template.replace("<!-- __SCREENS_HTML__ -->", screensHTML);

  // HUD
  if (config.showHud !== false) {
    const hudHTML = buildHudHTML(components);
    template = template.replace("<!-- __HUD_HTML__ -->", hudHTML);
  } else {
    template = template.replace("<!-- __HUD_HTML__ -->", "");
  }

  // Dock
  if (config.dock && config.dock.length > 0) {
    const dockHTML = buildDockHTML(config.dock, components);
    template = template.replace("<!-- __DOCK_HTML__ -->", dockHTML);
  } else {
    template = template.replace("<!-- __DOCK_HTML__ -->", "");
  }

  // Title
  if (config.title) {
    template = template.replace(
      "<title>游戏交互原型 · 造化坊</title>",
      `<title>${config.title} · 造化坊</title>`
    );
  }

  return template;
}
