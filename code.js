/**
 * Figma Plugin for New Design Interface - 增强版本
 * 
 * 功能特性：
 * - 渐进式页面构建：创建设计稿时元素逐个出现，提供更好的视觉反馈
 * - 性能优化：智能滚动节流，减少视口操作，避免卡顿
 * - 智能延迟：深层元素使用更短延迟，提升整体创建速度
 * - 平滑完成：创建完成后等待渲染，确保流畅体验
 * 
 * 性能优化细节（v2.0 增强）：
 * - 字体预加载：构建前并行预加载所有字体，创建文本时无需等待
 * - 组件懒加载+缓存：组件按需导入，相同 key 复用缓存
 * - 字体缓存：避免重复加载相同字体
 * - 快速模式：可选跳过渐进式显示以获得最快速度
 * - 只在顶层元素创建时滚动视口
 * - 每3个顶层元素才触发一次滚动（滚动节流）
 * - 深层嵌套元素延迟时间减少到1/3
 * - 完成后等待200ms让Figma渲染，避免卡顿
 * 
 * 配置选项（在 smartConfig 中传递）：
 * - progressive: boolean (默认 true) - 是否启用渐进式显示
 * - delay: number (默认 100ms) - 顶层元素之间的延迟时间
 * - fastMode: boolean (默认 false) - 快速模式，跳过渐进式显示和延迟
 * 
 * 性能对比：
 * - 普通模式：渐进式显示，适合演示和观察
 * - 快速模式：最快速度，适合批量生成
 * 
 * 示例配置：
 * {
 *   progressive: true,  // 或 fastMode: true 获得最快速度
 *   delay: 100,
 *   elements: {...},
 *   pageStructure: [...]
 * }
 */
figma.showUI(__html__, { width: 500, height: 700 });

// 全局标志：是否正在进行组件操作
let isPerformingComponentOperation = false;

// 全局标志：是否正在进行更新 PRD 选择
let isUpdatePrdMode = false;

// ========== 性能优化：资源缓存 ==========
// 组件缓存 - 避免重复导入相同的组件
const componentCache = new Map();

// 已加载字体缓存 - 避免重复加载相同字体
const loadedFonts = new Set();

/**
 * 获取或导入组件（带缓存）
 * @param {string} key - 组件 key
 * @returns {Promise<ComponentNode>} 组件节点
 */
async function getOrImportComponent(key) {
  if (componentCache.has(key)) {
    return componentCache.get(key);
  }
  const component = await figma.importComponentByKeyAsync(key);
  componentCache.set(key, component);
  return component;
}

/**
 * 加载字体（带缓存检查）
 * @param {FontName} fontName - 字体名称对象
 * @returns {Promise<void>}
 */
async function loadFontWithCache(fontName) {
  const fontKey = JSON.stringify(fontName);
  if (loadedFonts.has(fontKey)) {
    return; // 已加载，直接返回
  }
  await figma.loadFontAsync(fontName);
  loadedFonts.add(fontKey);
}

// 组件库常用字体列表（组件内部可能使用这些字体）
const COMMON_COMPONENT_FONTS = [
  { family: "Inter", style: "Regular" },
  { family: "Inter", style: "Medium" },
  { family: "Inter", style: "Semi Bold" },
  { family: "Inter", style: "Bold" },
  { family: "Roboto", style: "Regular" },
  { family: "Roboto", style: "Medium" },
  { family: "Roboto", style: "SemiBold" },
  { family: "Roboto", style: "Bold" }
];

/**
 * 预加载资源 - 预加载字体（包括组件常用字体）
 * 
 * 设计说明：
 * - 字体预加载：包括 CONFIG 中的字体 + 组件库常用字体
 * - 组件懒加载：组件导入是网络请求，预加载会阻塞流程，改为按需加载+缓存
 * 
 * @param {Object} elementsConfig - 元素配置对象
 * @returns {Promise<{fonts: number, components: number}>} 资源统计
 */
async function preloadResources(elementsConfig) {
  const fonts = new Set();
  let componentCount = 0;
  
  // 遍历收集所有字体（组件只统计数量，不预加载）
  Object.values(elementsConfig).forEach(config => {
    if (config.type === 'text') {
      const fontName = config.fontName || { family: "Inter", style: "Regular" };
      fonts.add(JSON.stringify(fontName));
    }
    if (config.type === 'component' && config.key) {
      componentCount++;
    }
  });
  
  // 添加组件库常用字体（组件内部可能使用）
  COMMON_COMPONENT_FONTS.forEach(font => {
    fonts.add(JSON.stringify(font));
  });
  
  const fontPromises = [];
  
  // 并行预加载所有字体
  for (const fontStr of fonts) {
    const fontKey = fontStr;
    if (!loadedFonts.has(fontKey)) {
      const fontName = JSON.parse(fontStr);
      fontPromises.push(
        figma.loadFontAsync(fontName)
          .then(() => {
            loadedFonts.add(fontKey);
          })
          .catch(err => {
            // 字体不存在时静默失败（可能用户系统没有该字体）
            console.warn(`字体预加载跳过: ${fontName.family} ${fontName.style}`);
          })
      );
    }
  }
  
  // 并行加载所有字体
  if (fontPromises.length > 0) {
    await Promise.all(fontPromises);
  }
  
  return {
    fonts: fonts.size,
    components: componentCount  // 只返回统计，不预加载
  };
}

/**
 * 清除资源缓存（可选，用于释放内存）
 */
function clearResourceCache() {
  componentCache.clear();
  loadedFonts.clear();
}

// ========== 语言设置管理 ==========
// 获取保存的语言设置
async function getSavedLanguage() {
  try {
    const savedLanguage = await figma.clientStorage.getAsync('userLanguage');
    return savedLanguage || 'zh'; // 默认中文
  } catch (error) {
    return 'zh';
  }
}

// 保存语言设置
async function saveLanguage(language) {
  try {
    await figma.clientStorage.setAsync('userLanguage', language);
  } catch (error) {
    console.error('保存语言设置失败:', error);
  }
}

// ========== 智能思考模式设置管理 ==========
// 获取保存的智能思考模式设置
async function getSavedThinkingMode() {
  try {
    const savedThinkingMode = await figma.clientStorage.getAsync('thinkingMode');
    // 支持向后兼容：如果保存的是旧的模式名，转换为新的模式名
    const modeMap = {
      'thinkingMode1': 'thinkingMode1', // 智能思考
      'thinkingMode2': 'thinkingMode2', // 页面生成
      'thinkingMode3': 'thinkingMode3', // 组件查询
      'thinkingMode4': 'thinkingMode4'  // 设计咨询
    };
    return modeMap[savedThinkingMode] || 'thinkingMode1'; // 默认智能思考
  } catch (error) {
    return 'thinkingMode1';
  }
}

// 保存智能思考模式设置
async function saveThinkingMode(thinkingMode) {
  try {
    await figma.clientStorage.setAsync('thinkingMode', thinkingMode);
  } catch (error) {
    console.error('保存智能思考模式失败:', error);
  }
}

// ========== 缓存管理 ==========
// 存储 page_info 缓存
async function saveCacheContent(cacheData) {
  try {
    const cacheObject = {
      page_info: cacheData.page_info || cacheData,
      timestamp: new Date().toISOString()
    };
    await figma.clientStorage.setAsync('confluenceCache', cacheObject);
  } catch (error) {
    console.error('保存缓存内容失败:', error);
  }
}

// 获取缓存内容
async function getCacheContent() {
  try {
    const cache = await figma.clientStorage.getAsync('confluenceCache');
    return cache || null;
  } catch (error) {
    return null;
  }
}

// 清空缓存
async function clearCacheContent() {
  try {
    await figma.clientStorage.deleteAsync('confluenceCache');
  } catch (error) {
    console.error('清空缓存内容失败:', error);
  }
}

// ========== 记住选择设置管理 ==========
// 获取保存的记住选择设置
async function getSavedRememberSettings() {
  try {
    const rememberedCategory = await figma.clientStorage.getAsync('rememberedCategory');
    const rememberedBusiness = await figma.clientStorage.getAsync('rememberedBusiness');
    const categoryRemember = await figma.clientStorage.getAsync('categoryRemember');
    const businessRemember = await figma.clientStorage.getAsync('businessRemember');

    return {
      rememberedCategory: rememberedCategory || null,
      rememberedBusiness: rememberedBusiness || null,
      categoryRemember: categoryRemember || false,
      businessRemember: businessRemember || false
    };
  } catch (error) {
    return {
      rememberedCategory: null,
      rememberedBusiness: null,
      categoryRemember: false,
      businessRemember: false
    };
  }
}

// 保存记住选择设置
async function saveRememberSettings(settings) {
  try {
    if (settings.rememberedCategory !== undefined) {
      await figma.clientStorage.setAsync('rememberedCategory', settings.rememberedCategory);
    }
    if (settings.rememberedBusiness !== undefined) {
      await figma.clientStorage.setAsync('rememberedBusiness', settings.rememberedBusiness);
    }
    if (settings.categoryRemember !== undefined) {
      await figma.clientStorage.setAsync('categoryRemember', settings.categoryRemember);
    }
    if (settings.businessRemember !== undefined) {
      await figma.clientStorage.setAsync('businessRemember', settings.businessRemember);
    }
  } catch (error) {
    console.error('保存记住选择设置失败:', error);
  }
}

// 初始化时获取并发送语言设置
async function initializeLanguage() {
  const savedLanguage = await getSavedLanguage();
  figma.ui.postMessage({
    type: 'initialize-language',
    language: savedLanguage
  });
}

// 初始化时获取并发送记住选择设置
async function initializeRememberSettings() {
  const savedSettings = await getSavedRememberSettings();
  figma.ui.postMessage({
    type: 'initialize-remember-settings',
    settings: savedSettings
  });
}

// 初始化时获取并发送智能思考模式设置
async function initializeThinkingMode() {
  const savedThinkingMode = await getSavedThinkingMode();
  figma.ui.postMessage({
    type: 'initialize-thinking-mode',
    mode: savedThinkingMode
  });
}

// 发送当前用户信息到 UI
const currentUser = figma.currentUser;
const userInfo = {
  id: currentUser ? currentUser.id : '',
  name: currentUser ? currentUser.name : '',
  photoUrl: currentUser ? currentUser.photoUrl : null
};
figma.ui.postMessage({
  type: 'current-user-info',
  userInfo: userInfo
});

// 初始化语言设置
initializeLanguage();

// 初始化记住选择设置
initializeRememberSettings();

// 初始化智能思考模式设置
initializeThinkingMode();

// ==================== 动态配置 ====================
// 注意：CONFIG现在将完全由Smart动态生成，不再使用固定配置

// ==================== 核心引擎 ====================

/**
 * 统一元素创建引擎 - 增强版
 * 支持更多Figma Plugin API功能
 */
async function createElement(elementName, parent = null, elementsConfig = null) {
  const config = elementsConfig ? elementsConfig[elementName] : (typeof CONFIG !== 'undefined' ? CONFIG.elements[elementName] : null);
  if (!config) throw new Error(`未知元素: ${elementName}, 请检查配置是否正确传递`);

  let element;

  // 根据类型创建不同的元素
  switch (config.type) {
    case 'frame':
      element = createFrameElement(config, parent);
      break;
    case 'component':
      element = await createComponentElement(config, parent);
      break;
    case 'rectangle':
      element = createRectangleElement(config, parent);
      break;
    case 'text':
      element = await createTextElement(config, parent);
      break;
    case 'group':
      element = createGroupElement(config, parent);
      break;
    default:
      throw new Error(`不支持的元素类型: ${config.type}`);
  }

  // 应用通用属性设置
  if (element) {
    applyCommonProperties(element, config, parent);
  }

  return element;
}

/**
 * Frame创建引擎 - 增强版
 * 支持完整的Frame API功能
 */
function createFrameElement(config, parent) {
  const frame = figma.createFrame();

  // 基本属性设置
  applyBasicProperties(frame, config);

  // 尺寸设置
  applySizeProperties(frame, config, parent);

  // 样式设置  
  applyStyleProperties(frame, config);

  // 布局设置
  applyLayoutProperties(frame, config);

  // 添加到父容器
  if (parent) {
    addToParent(frame, parent, config);
  }

  return frame;
}

/**
 * Rectangle创建引擎
 */
function createRectangleElement(config, parent) {
  const rectangle = figma.createRectangle();

  // 基本属性设置
  applyBasicProperties(rectangle, config);

  // 尺寸设置
  applySizeProperties(rectangle, config, parent);

  // 样式设置
  applyStyleProperties(rectangle, config);

  // 添加到父容器
  if (parent) {
    addToParent(rectangle, parent, config);
  }

  return rectangle;
}

/**
 * Text创建引擎 - 异步版本（优化：使用字体缓存）
 * 必须先加载字体才能设置文本内容
 */
async function createTextElement(config, parent) {
  const text = figma.createText();

  // 基本属性设置
  applyBasicProperties(text, config);

  // 获取字体配置，默认使用 Inter Regular
  const fontName = config.fontName || { family: "Inter", style: "Regular" };
  
  // 使用缓存加载字体（如果预加载阶段已加载，这里会直接跳过）
  try {
    await loadFontWithCache(fontName);
  } catch (fontError) {
    // 如果指定字体加载失败，尝试加载默认字体
    console.warn(`字体加载失败: ${fontName.family} ${fontName.style}，尝试使用默认字体`);
    try {
      await loadFontWithCache({ family: "Inter", style: "Regular" });
    } catch (defaultFontError) {
      console.error('默认字体也加载失败:', defaultFontError);
      throw new Error(`无法加载字体: ${fontName.family} ${fontName.style}`);
    }
  }

  // 字体加载后，设置字体属性
  if (config.fontName) {
    text.fontName = config.fontName;
  }

  // 文本内容设置（必须在字体加载后）
  if (config.characters) {
    text.characters = config.characters;
  }

  // 其他字体相关属性设置
  applyTextProperties(text, config);

  // 尺寸设置
  applySizeProperties(text, config, parent);

  // 样式设置
  applyStyleProperties(text, config);

  // 添加到父容器
  if (parent) {
    addToParent(text, parent, config);
  }

  return text;
}

/**
 * Group创建引擎
 */
function createGroupElement(config, parent) {
  // Group需要先创建子元素，然后组合
  const tempFrame = figma.createFrame();
  tempFrame.name = config.name || "Temp Group Frame";

  // 基本属性设置
  applyBasicProperties(tempFrame, config);

  // 添加到父容器
  if (parent) {
    addToParent(tempFrame, parent, config);
  }

  return tempFrame;
}

// ==================== 属性应用函数库 ====================

/**
 * 应用基本属性 - 通用节点API
 */
function applyBasicProperties(element, config) {
  // 节点名称
  if (config.name) {
    element.name = config.name;
  }

  // 可见性
  if (config.visible !== undefined) {
    element.visible = config.visible;
  }

  // 锁定状态
  if (config.locked !== undefined) {
    element.locked = config.locked;
  }

  // 透明度
  if (config.opacity !== undefined) {
    element.opacity = config.opacity;
  }

  // 混合模式
  if (config.blendMode) {
    element.blendMode = config.blendMode;
  }
}

/**
 * 应用尺寸属性 - 约束与尺寸控制API
 */
function applySizeProperties(element, config, parent) {
  // 基本尺寸设置
  if (config.width && config.height) {
    if (config.resizeWithoutConstraints) {
      element.resizeWithoutConstraints(config.width, config.height);
    } else {
      element.resize(config.width, config.height);
    }
  } else if (config.width || config.height) {
    const currentWidth = element.width;
    const currentHeight = element.height;
    element.resize(
      config.width || currentWidth,
      config.height || currentHeight
    );
  }

  // 位置设置
  if (config.x !== undefined || config.y !== undefined) {
    element.x = config.x || element.x;
    element.y = config.y || element.y;
  }

  // 居中定位
  if (config.centerPosition && config.width && config.height) {
    const centerX = figma.viewport.center.x;
    const centerY = figma.viewport.center.y;
    element.x = centerX - config.width / 2;
    element.y = centerY - config.height / 2;
  }

  // 约束设置
  if (config.constraints) {
    element.constraints = config.constraints;
  }

  // 尺寸调整模式 - 统一处理，兼容两种写法
  // 优先从 sizingModes 对象读取（旧格式），其次从顶层读取（新格式）
  const primaryMode = (config.sizingModes && config.sizingModes.primaryAxisSizingMode) || config.primaryAxisSizingMode;
  const counterMode = (config.sizingModes && config.sizingModes.counterAxisSizingMode) || config.counterAxisSizingMode;
  
  if (primaryMode || counterMode) {
    // 检查是否需要填充行为
    const needsFill = config.layoutAlign === "STRETCH" || config.layoutGrow > 0 || config.forceWidthFill;

    if (primaryMode) {
      // 如果元素需要在主轴方向填充，但sizingMode设置为AUTO，则覆盖为FIXED
      if (needsFill && primaryMode === "AUTO") {
        element.primaryAxisSizingMode = "FIXED";
      } else {
        element.primaryAxisSizingMode = primaryMode;
      }
    }
    
    if (counterMode) {
      element.counterAxisSizingMode = counterMode;
    }
  }
}

/**
 * 应用样式属性
 */
function applyStyleProperties(element, config) {
  // 填充颜色
  if (config.backgroundColor) {
    element.fills = [{ type: 'SOLID', color: config.backgroundColor }];
  } else if (config.fills) {
    element.fills = config.fills;
  } else if (config.backgroundColor === null) {
    element.fills = [];
  }

  // 描边
  if (config.strokes) {
    element.strokes = config.strokes;
  }

  if (config.strokeWeight !== undefined) {
    element.strokeWeight = config.strokeWeight;
  }

  if (config.strokeAlign) {
    element.strokeAlign = config.strokeAlign;
  }

  // 圆角
  if (config.cornerRadius !== undefined) {
    element.cornerRadius = config.cornerRadius;
  }

  if (config.topLeftRadius !== undefined) {
    element.topLeftRadius = config.topLeftRadius;
  }

  if (config.topRightRadius !== undefined) {
    element.topRightRadius = config.topRightRadius;
  }

  if (config.bottomLeftRadius !== undefined) {
    element.bottomLeftRadius = config.bottomLeftRadius;
  }

  if (config.bottomRightRadius !== undefined) {
    element.bottomRightRadius = config.bottomRightRadius;
  }

  // 阴影和效果
  if (config.effects) {
    element.effects = config.effects;
  }
}

/**
 * 应用布局属性 - 布局相关API
 */
function applyLayoutProperties(element, config) {
  // 自动布局模式
  if (config.layoutMode) {
    element.layoutMode = config.layoutMode;
  }

  // 主轴对齐
  if (config.primaryAxisAlignItems) {
    element.primaryAxisAlignItems = config.primaryAxisAlignItems;
  }

  // 副轴对齐
  if (config.counterAxisAlignItems) {
    element.counterAxisAlignItems = config.counterAxisAlignItems;
  }

  // 元素间距
  if (config.itemSpacing !== undefined) {
    element.itemSpacing = config.itemSpacing;
  }

  // 内边距设置
  if (config.padding !== undefined) {
    element.paddingLeft = config.padding;
    element.paddingRight = config.padding;
    element.paddingTop = config.padding;
    element.paddingBottom = config.padding;
  }

  if (config.paddingLeft !== undefined) {
    element.paddingLeft = config.paddingLeft;
  }

  if (config.paddingRight !== undefined) {
    element.paddingRight = config.paddingRight;
  }

  if (config.paddingTop !== undefined) {
    element.paddingTop = config.paddingTop;
  }

  if (config.paddingBottom !== undefined) {
    element.paddingBottom = config.paddingBottom;
  }

  // 布局网格
  if (config.layoutGrids) {
    element.layoutGrids = config.layoutGrids;
  }
}

/**
 * 应用文本属性
 * 注意：fontName 已在 createTextElement 中设置，这里不再重复设置
 */
function applyTextProperties(element, config) {
  // fontName 已在 createTextElement 中通过 loadFontAsync 加载并设置
  // 这里不再重复设置，避免字体未加载的问题

  if (config.fontSize !== undefined) {
    element.fontSize = config.fontSize;
  }

  if (config.lineHeight) {
    element.lineHeight = config.lineHeight;
  }

  if (config.letterSpacing) {
    element.letterSpacing = config.letterSpacing;
  }

  // 文本对齐
  if (config.textAlignHorizontal) {
    element.textAlignHorizontal = config.textAlignHorizontal;
  }

  if (config.textAlignVertical) {
    element.textAlignVertical = config.textAlignVertical;
  }

  // 文本装饰
  if (config.textDecoration) {
    element.textDecoration = config.textDecoration;
  }

  if (config.textCase) {
    element.textCase = config.textCase;
  }

  // 文本自动调整
  if (config.textAutoResize) {
    element.textAutoResize = config.textAutoResize;
  }
}

/**
 * 添加到父容器 - 层级与结构API
 */
function addToParent(element, parent, config) {
  // 插入位置
  if (config.insertIndex !== undefined) {
    parent.insertChild(config.insertIndex, element);
  } else {
    parent.appendChild(element);
  }

  // 布局对齐 - 只有在明确指定时才设置
  if (config.layoutAlign !== undefined) {
    element.layoutAlign = config.layoutAlign;
  }

  // 布局增长 - 只有在明确指定时才设置
  if (config.layoutGrow !== undefined) {
    element.layoutGrow = config.layoutGrow;
  }

  // 布局位置权重
  if (config.layoutPositioning) {
    element.layoutPositioning = config.layoutPositioning;
  }

  // 强制填充处理
  if (config.layoutGrow && config.layoutGrow > 0 || config.forceWidthFill || config.layoutAlign === "STRETCH") {
    setTimeout(() => {
      if (parent && parent.layoutMode) {
        const parentIsHorizontal = parent.layoutMode === "HORIZONTAL";

        if (parentIsHorizontal && config.layoutAlign === "STRETCH") {
          // 父容器是水平布局，子元素需要高度填充
          const availableHeight = parent.height - parent.paddingTop - parent.paddingBottom;
          if (element.height !== availableHeight) {
            element.resize(element.width, availableHeight);
          }
        } else if (!parentIsHorizontal && config.layoutAlign === "STRETCH") {
          // 父容器是垂直布局，子元素需要宽度填充（Content Frame的情况）
          const availableWidth = parent.width - parent.paddingLeft - parent.paddingRight;
          if (element.width !== availableWidth) {
            element.resize(availableWidth, element.height);
          }
        }

        // 特殊处理：强制宽度填充 - 无论父容器布局模式如何都强制填充宽度
        if (config.forceWidthFill) {
          const availableWidth = parent.width - parent.paddingLeft - parent.paddingRight;
          element.resize(availableWidth, element.height);
        }
      }
    }, 100);
  }
}

/**
 * 应用通用属性
 */
function applyCommonProperties(element, config, parent) {
  // 应用约束
  if (config.constraints && parent) {
    element.constraints = config.constraints;
  }

  // 应用变换
  if (config.rotation !== undefined) {
    element.rotation = config.rotation;
  }

  // 应用导出设置
  if (config.exportSettings) {
    element.exportSettings = config.exportSettings;
  }

  // 应用原型交互
  if (config.reactions) {
    element.reactions = config.reactions;
  }
}

/**
 * 组件创建引擎 - 增强版（带缓存失效重试机制）
 */
async function createComponentElement(config, parent) {
  /**
   * 尝试创建组件实例
   * @param {ComponentNode} component - 组件节点
   * @returns {InstanceNode} 实例节点
   */
  function tryCreateInstance(component) {
    return component.createInstance();
  }

  try {
    // 使用缓存获取组件
    let component = await getOrImportComponent(config.key);
    let instance;
    
    try {
      instance = tryCreateInstance(component);
    } catch (instanceError) {
      // 缓存的组件引用可能已失效，清除缓存并重新导入
      console.warn(`组件实例创建失败，清除缓存重试: ${config.key}`, instanceError.message);
      componentCache.delete(config.key);
      component = await figma.importComponentByKeyAsync(config.key);
      componentCache.set(config.key, component);
      instance = tryCreateInstance(component);
    }

    // 应用基本属性
    applyBasicProperties(instance, config);

    // 应用尺寸属性（包含 sizingModes 处理）
    applySizeProperties(instance, config, parent);

    // 应用样式属性
    applyStyleProperties(instance, config);

    // 组件特有属性
    if (config.componentProperties) {
      Object.keys(config.componentProperties).forEach(prop => {
        if (instance.componentProperties && instance.componentProperties[prop]) {
          instance.componentProperties[prop].value = config.componentProperties[prop];
        }
      });
    }

    // 添加到父容器
    if (parent) {
      addToParent(instance, parent, config);
    }

    return instance;
  } catch (error) {
    figma.notify(`导入组件失败: ${error.message}`, { error: true });
    throw error;
  }
}

/**
 * 递归页面构建引擎 - 增强版
 * 支持自定义元素配置和批量操作
 * 支持渐进式显示效果（优化性能版本）
 */
async function buildPage(structure, parent = null, elementsConfig = null, options = {}) {
  const results = {};
  const { 
    progressive = true, 
    delay = 100,         // 减少默认延迟，提升速度
    depth = 0,           // 当前递归深度
    maxScrollDepth = 1,  // 只在顶层滚动，减少视口操作
    scrollThrottle = 0   // 滚动节流计数器
  } = options;

  let currentScrollThrottle = scrollThrottle;

  for (const item of structure) {
    const element = await createElement(item.element, parent, elementsConfig);
    results[item.element] = element;

    // 渐进式显示：每创建一个元素后添加延迟和视觉反馈
    if (progressive && element) {
      // 只在顶层元素创建时滚动视口，并且每3个元素才滚动一次，减少卡顿
      if (depth === 0 && currentScrollThrottle % 3 === 0) {
        // 使用较小的缩放来减少视觉跳动
        try {
          figma.viewport.scrollAndZoomIntoView([element]);
        } catch (e) {
          // 忽略滚动错误
        }
      }
      currentScrollThrottle++;
      
      // 添加延迟，让用户看到创建过程
      // 深层元素使用更短延迟，提升整体速度
      const actualDelay = depth === 0 ? delay : Math.max(30, delay / 3);
      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }

    if (item.children) {
      // 手动构建子元素的options对象，避免使用展开运算符
      const childOptions = {
        progressive: progressive,
        delay: delay,
        depth: depth + 1,
        maxScrollDepth: maxScrollDepth,
        scrollThrottle: currentScrollThrottle
      };
      const childResults = await buildPage(item.children, element, elementsConfig, childOptions);
      Object.assign(results, childResults);
    }
  }

  return results;
}

/**
 * 批量删除元素 - 通用节点API
 */
function deleteElements(elements) {
  const nodesToDelete = Array.isArray(elements) ? elements : [elements];
  figma.deleteNodes(nodesToDelete);
}

/**
 * 批量操作元素属性
 */
function batchUpdateElements(elements, updates) {
  const elementsArray = Array.isArray(elements) ? elements : [elements];

  elementsArray.forEach(element => {
    Object.keys(updates).forEach(property => {
      if (element.hasOwnProperty(property)) {
        element[property] = updates[property];
      }
    });
  });
}

/**
 * 查找元素 - 层级与结构API
 */
function findElements(parent, criteria) {
  const results = [];

  function searchRecursively(node) {
    // 检查当前节点是否符合条件
    let matches = true;

    if (criteria.name && node.name !== criteria.name) {
      matches = false;
    }

    if (criteria.type && node.type !== criteria.type) {
      matches = false;
    }

    if (criteria.visible !== undefined && node.visible !== criteria.visible) {
      matches = false;
    }

    if (matches) {
      results.push(node);
    }

    // 递归搜索子节点
    if (node.children) {
      node.children.forEach(child => searchRecursively(child));
    }
  }

  searchRecursively(parent);
  return results;
}

/**
 * 复制元素
 */
function cloneElement(element, parent) {
  const cloned = element.clone();
  if (parent) {
    parent.appendChild(cloned);
  }
  return cloned;
}

// 注意：变体查询现在直接在UI中调用Smart API，不再通过插件主进程

/**
 * 测试组件Key是否有效
 */
async function testComponentKey(key, name) {
  try {
    const component = await figma.importComponentByKeyAsync(key);

    if (component) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * 插入变体组件
 */
async function insertVariantComponent(variantKey, variantName) {
  try {
    // 设置操作标志，防止选中状态监听器干扰
    isPerformingComponentOperation = true;

    figma.notify(`正在插入变体: ${variantName}...`);

    // 验证组件Key格式
    if (!variantKey || variantKey === 'parse-error' || variantKey.includes('error')) {
      throw new Error('无效的组件Key: ' + variantKey);
    }

    // 使用Figma Plugin API导入组件
    const component = await figma.importComponentByKeyAsync(variantKey);

    if (!component) {
      throw new Error('无法导入组件，组件Key可能无效或组件不存在');
    }

    // 创建组件实例
    const instance = component.createInstance();
    // 暂时使用变体名称，稍后根据是否替换来决定最终名称

    // 智能替换逻辑：如果有选中的组件，直接替换；否则在视口中心插入
    // 在开始时就保存选中状态，避免异步操作期间状态变化
    const selection = [...figma.currentPage.selection]; // 创建副本
    let replacedNode = null;

    if (selection.length > 0) {
      const selectedNode = selection[0];

      // 验证节点是否仍然存在和有效
      try {
        // 尝试访问节点属性来验证其有效性
        selectedNode.id;
        selectedNode.name;
      } catch (nodeError) {
        console.error('选中节点无效:', nodeError);
        throw new Error('选中的节点已不存在或无效');
      }

      // 检查选中的是否是组件实例，如果是则替换
      if (selectedNode.type === 'INSTANCE' || selectedNode.type === 'COMPONENT') {
        try {

          // 记录原组件的位置、尺寸和父容器
          const originalX = selectedNode.x;
          const originalY = selectedNode.y;
          const originalWidth = selectedNode.width;
          const originalHeight = selectedNode.height;
          const originalParent = selectedNode.parent;
          const originalIndex = originalParent ? originalParent.children.indexOf(selectedNode) : 0;

          // 复制原组件的属性（包括名称和布局属性）
          const originalName = selectedNode.name;
          const layoutProperties = {
            layoutAlign: selectedNode.layoutAlign,
            layoutGrow: selectedNode.layoutGrow,
            layoutPositioning: selectedNode.layoutPositioning,
            constraints: selectedNode.constraints
          };

          // 设置新组件的位置和尺寸
          instance.x = originalX;
          instance.y = originalY;

          // 尝试保持相同尺寸（如果合理的话）
          try {
            instance.resize(originalWidth, originalHeight);
          } catch (resizeError) {
          }

          // 添加到相同的父容器和位置
          if (originalParent) {
            originalParent.insertChild(originalIndex, instance);
          } else {
            figma.currentPage.appendChild(instance);
          }

          // 应用原组件的名称和布局属性
          try {
            // 保持原组件的名称
            instance.name = originalName;

            // 应用布局属性
            if (layoutProperties.layoutAlign) {
              instance.layoutAlign = layoutProperties.layoutAlign;
            }
            if (layoutProperties.layoutGrow !== undefined) {
              instance.layoutGrow = layoutProperties.layoutGrow;
            }
            if (layoutProperties.layoutPositioning) {
              instance.layoutPositioning = layoutProperties.layoutPositioning;
            }
            if (layoutProperties.constraints) {
              instance.constraints = layoutProperties.constraints;
            }
          } catch (layoutError) {
          }

          // 移除原组件
          replacedNode = selectedNode; // 在删除前保存引用
          selectedNode.remove();

        } catch (replaceError) {
          console.error('替换组件时出错:', replaceError);
          throw new Error(`替换组件失败: ${replaceError.message}`);
        }

      } else {
        // 如果选中的不是组件，在其旁边插入
        instance.x = selectedNode.x + selectedNode.width + 20;
        instance.y = selectedNode.y;
        instance.name = variantName; // 插入模式使用变体名称
        figma.currentPage.appendChild(instance);
      }
    } else {
      // 在视口中心插入
      const center = figma.viewport.center;
      instance.x = center.x - instance.width / 2;
      instance.y = center.y - instance.height / 2;
      instance.name = variantName; // 插入模式使用变体名称
      figma.currentPage.appendChild(instance);
    }

    // 选中新插入的组件实例
    figma.currentPage.selection = [instance];

    // 调整视口以显示新插入的组件
    figma.viewport.scrollAndZoomIntoView([instance]);

    // 根据操作类型显示不同的成功提示
    if (replacedNode) {
      // 使用保存的名称，避免访问已删除的节点
      const originalName = instance.name; // 新组件保持了原组件的名称
      figma.notify(`✅ 组件替换成功！\n"${originalName}" 已替换为 "${variantName}" 变体\n图层名称保持不变`, { timeout: 4000 });
    } else {
      figma.notify(`✅ 变体 "${variantName}" 插入成功！`, { timeout: 3000 });
    }

  } catch (error) {
    console.error('插入变体组件失败:', error);

    // 根据错误类型提供不同的提示信息
    const errorMessage = error.message || error.toString() || '未知错误';

    if (errorMessage.includes('unpublished')) {
      figma.notify(`组件未发布到团队库，无法导入\n组件: ${variantName}\nKey: ${variantKey}\n\n解决方案:\n1. 在Figma中找到该组件\n2. 右键选择"发布到团队库"\n3. 发布后重试插入`, { error: true, timeout: 10000 });
    } else if (errorMessage.includes('Component not found') || errorMessage.includes('Invalid key')) {
      figma.notify(`组件Key无效或组件不存在\n组件: ${variantName}\nKey: ${variantKey}`, { error: true, timeout: 5000 });
    } else if (errorMessage.includes('Network')) {
      figma.notify('网络错误，请检查网络连接后重试', { error: true });
    } else if (errorMessage.includes('Permission') || errorMessage.includes('access')) {
      figma.notify('权限不足，无法访问该组件\n请检查是否有团队库访问权限', { error: true });
    } else {
      figma.notify(`插入变体失败: ${errorMessage}`, { error: true });
    }
  } finally {
    // 清除操作标志
    isPerformingComponentOperation = false;
  }
}

// ==================== 执行区域 ====================

/**
 * 主执行函数 - 提示用户使用Smart生成
 */
async function createNewDesignInterface() {
  figma.notify("请使用'发送到Smart生成'功能来创建界面设计", { error: true });
  // 不再使用固定配置，完全依赖Smart生成的配置
}

/**
 * 使用Smart生成的配置创建设计界面
 * 支持单个配置或配置数组（多页面批量生成）
 */
async function createNewDesignInterfaceWithConfig(smartConfig, confluenceUrl) {
  try {
    var createdFrames = [];
    // 支持配置数组（多页面生成）
    if (Array.isArray(smartConfig)) {
      createdFrames = await createMultipleDesignInterfaces(smartConfig);
    } else {
      // 单个配置处理
      var result = await createSingleDesignInterface(smartConfig);
      if (result && result.mainFrame) {
        createdFrames = [result.mainFrame];
      }
    }
    
    // 如果有 confluenceUrl，存储到所有生成的 Frame 的 pluginData 中
    if (confluenceUrl && createdFrames && createdFrames.length > 0) {
      var timestamp = new Date().toISOString();
      for (var i = 0; i < createdFrames.length; i++) {
        var frame = createdFrames[i];
        if (frame && typeof frame.setPluginData === 'function') {
          frame.setPluginData('soda_confluence_url', confluenceUrl);
          frame.setPluginData('soda_generated_at', timestamp);
        }
      }
    }

  } catch (error) {
    figma.notify(`创建失败: ${error.message}`, { error: true });
    console.error('Smart Config Error:', error);
    
    // 发送消息通知UI创建失败
    figma.ui.postMessage({
      type: 'design-create-error',
      message: error.message
    });
  }
}

/**
 * 创建单个设计界面
 * @param {Object} smartConfig - 单个页面配置
 * @param {Object} options - 可选参数
 * @param {number} options.offsetX - X轴偏移量
 * @param {number} options.offsetY - Y轴偏移量
 * @param {number} options.pageIndex - 页面索引（多页面模式）
 * @param {number} options.totalPages - 总页面数（多页面模式）
 * @returns {Object} 包含创建的元素和主Frame的对象
 */
async function createSingleDesignInterface(smartConfig, options = {}) {
  const { offsetX = 0, offsetY = 0, pageIndex = 0, totalPages = 1 } = options;
  const isMultiPage = totalPages > 1;

  // 验证配置格式
  if (!smartConfig || !smartConfig.elements || !smartConfig.pageStructure) {
    throw new Error("Smart配置格式无效");
  }

  // 计算总元素数量（用于进度显示）
  function countElements(structure) {
    let count = 0;
    for (const item of structure) {
      count++;
      if (item.children) {
        count += countElements(item.children);
      }
    }
    return count;
  }
  const totalElements = countElements(smartConfig.pageStructure);
  
  if (!isMultiPage) {
    figma.notify("✨ 开始创建界面，请稍候...", { timeout: 2000 });
  }

  // 性能优化：预加载字体（组件采用懒加载+缓存）
  await preloadResources(smartConfig.elements);

  if (!isMultiPage) {
    figma.notify(`🎨 正在创建设计稿（共 ${totalElements} 个元素）...`, { timeout: 3000 });
  }

  // 使用Smart返回的配置构建页面
  // fastMode: 快速模式，跳过渐进式显示和延迟
  const fastMode = smartConfig.fastMode === true;
  const progressive = fastMode ? false : (smartConfig.progressive !== undefined ? smartConfig.progressive : true);
  const delay = fastMode ? 0 : (smartConfig.delay || 100);
  
  const elements = await buildPage(smartConfig.pageStructure, null, smartConfig.elements, {
    progressive: progressive,
    delay: delay,
    depth: 0,
    maxScrollDepth: 1,
    scrollThrottle: 0
  });

  // 查找主Frame
  const mainFrameKey = Object.keys(elements).find(key =>
    smartConfig.elements[key] &&
    smartConfig.elements[key].type === 'frame' &&
    (smartConfig.elements[key].width || smartConfig.elements[key].centerPosition)
  );

  const mainFrame = mainFrameKey ? elements[mainFrameKey] : Object.values(elements)[0];

  // 多页面模式下，设置绝对位置
  if (mainFrame && isMultiPage) {
    // 使用绝对定位，offsetX 是相对于第一个页面的偏移
    mainFrame.x = offsetX;
    mainFrame.y = offsetY;
  }

  // 等待一小段时间让Figma完成渲染，避免卡顿
  await new Promise(resolve => setTimeout(resolve, 200));

  // 单页面模式下的视图设置
  if (!isMultiPage && mainFrame) {
    figma.currentPage.selection = [mainFrame];
    try {
      figma.viewport.scrollAndZoomIntoView([mainFrame]);
    } catch (e) {
    }
    
    figma.notify("✅ 设计稿创建完成！", { timeout: 3000 });
    
    figma.ui.postMessage({
      type: 'design-created',
      success: true
    });
  }

  return { elements, mainFrame };
}

/**
 * 批量创建多个设计界面
 * @param {Array} configArray - 配置数组，每个元素是一个页面配置
 */
async function createMultipleDesignInterfaces(configArray) {
  const totalPages = configArray.length;
  const createdFrames = [];
  const PAGE_GAP = 100; // 页面之间的间距
  
  figma.notify(`✨ 开始批量创建 ${totalPages} 个页面，请稍候...`, { timeout: 3000 });
  
  // 计算所有页面的总元素数
  let totalElementsAll = 0;
  for (const config of configArray) {
    if (config && config.pageStructure) {
      totalElementsAll += countElementsInStructure(config.pageStructure);
    }
  }
  
  figma.notify(`🎨 正在创建设计稿（共 ${totalPages} 个页面，${totalElementsAll} 个元素）...`, { timeout: 5000 });
  
  // 获取视口中心作为起始位置
  const startX = figma.viewport.center.x;
  const startY = figma.viewport.center.y;
  
  let currentOffsetX = 0;
  
  for (let i = 0; i < configArray.length; i++) {
    const config = configArray[i];
    
    if (!config || !config.elements || !config.pageStructure) {
      console.warn(`跳过无效配置 (索引: ${i})`);
      continue;
    }
    
    figma.notify(`📄 正在创建第 ${i + 1}/${totalPages} 个页面...`, { timeout: 2000 });
    
    // 发送进度到 UI
    figma.ui.postMessage({
      type: 'design-create-progress',
      current: i + 1,
      total: totalPages
    });
    
    try {
      // 计算当前页面的偏移量
      const offsetX = currentOffsetX;
      
      const result = await createSingleDesignInterface(config, {
        offsetX: offsetX,
        offsetY: 0,
        pageIndex: i,
        totalPages: totalPages
      });
      
      if (result.mainFrame) {
        createdFrames.push(result.mainFrame);
        // 更新下一个页面的X偏移量
        currentOffsetX += result.mainFrame.width + PAGE_GAP;
      }
      
    } catch (pageError) {
      console.error(`创建第 ${i + 1} 个页面失败:`, pageError);
      figma.notify(`⚠️ 第 ${i + 1} 个页面创建失败: ${pageError.message}`, { error: true, timeout: 3000 });
    }
  }
  
  // 选中所有创建的Frame并调整视图
  if (createdFrames.length > 0) {
    figma.currentPage.selection = createdFrames;
    
    try {
      figma.viewport.scrollAndZoomIntoView(createdFrames);
    } catch (e) {
    }
    
    figma.notify(`✅ 批量创建完成！成功创建 ${createdFrames.length}/${totalPages} 个页面`, { timeout: 4000 });
    
    figma.ui.postMessage({
      type: 'design-created',
      success: true,
      count: createdFrames.length,
      total: totalPages
    });
    
    return createdFrames;
  } else {
    throw new Error('所有页面创建均失败');
  }
}

/**
 * 计算结构中的元素数量
 */
function countElementsInStructure(structure) {
  let count = 0;
  for (const item of structure) {
    count++;
    if (item.children) {
      count += countElementsInStructure(item.children);
    }
  }
  return count;
}

// UI事件处理（包含生成功能和编辑功能）
figma.ui.onmessage = async (msg) => {
  // ===== 生成功能消息 =====
  if (msg.type === 'create-design') {
    await createNewDesignInterface();
  } else if (msg.type === 'create-design-with-config') {
    await createNewDesignInterfaceWithConfig(msg.config, msg.confluenceUrl);
  } else if (msg.type === 'get-selection-info') {
    // 获取当前选中对象信息
    const selection = figma.currentPage.selection;
    const selectionInfo = selection.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible
    }));

    figma.ui.postMessage({
      type: 'selection-info',
      data: selectionInfo
    });
  } else if (msg.type === 'insert-variant') {
    // 插入变体组件
    await insertVariantComponent(msg.variantKey, msg.variantName);
  } else if (msg.type === 'test-component-key') {
    // 测试组件Key有效性
    const isValid = await testComponentKey(msg.key, msg.name);
    figma.ui.postMessage({
      type: 'component-key-test-result',
      key: msg.key,
      name: msg.name,
      isValid: isValid
    });
  } else if (msg.type === 'resize-window') {
    // 调整插件窗口大小
    figma.ui.resize(msg.width, msg.height);
  } else if (msg.type === 'language-changed') {
    // 保存语言设置变更
    const newLanguage = msg.language;
    await saveLanguage(newLanguage);
  } else if (msg.type === 'remember-settings-changed') {
    // 保存记住选择设置变更
    const settings = msg.settings;
    await saveRememberSettings(settings);
  } else if (msg.type === 'save-thinking-mode') {
    // 保存智能思考模式变更
    const thinkingMode = msg.mode;
    await saveThinkingMode(thinkingMode);
  } else if (msg.type === 'save-cache-content') {
    // 保存缓存内容
    await saveCacheContent(msg.cacheData);
  } else if (msg.type === 'get-cache-content') {
    // 获取缓存内容
    const cache = await getCacheContent();
    figma.ui.postMessage({
      type: 'cache-content-result',
      cache: cache
    });
  } else if (msg.type === 'clear-cache-content') {
    // 清空缓存内容
    await clearCacheContent();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
  // ===== 更新 PRD 功能消息 =====
  else if (msg.type === 'start-update-prd-selection') {
    // 开始更新 PRD 选择模式
    isUpdatePrdMode = true;
    // 立即发送当前选择状态
    sendUpdatePrdSelectionStatus();
  }
  else if (msg.type === 'confirm-update-prd') {
    // 用户确认，执行截图
    await handleConfirmUpdatePrd();
  }
  else if (msg.type === 'cancel-update-prd') {
    // 取消更新 PRD 模式
    isUpdatePrdMode = false;
  }
  // ===== 编辑功能消息 =====
  else if (msg.type === 'extract-design-structure') {
    // 提取设计稿结构
    try {
      var selection = figma.currentPage.selection;
      
      if (selection.length === 0) {
        figma.ui.postMessage({
          type: 'extract-design-structure-result',
          success: false,
          error: '请先选中一个设计稿 Frame'
        });
        return;
      }
      
      var targetNode = selection[0];
      
      // 验证选中的是否是 Frame 或组件
      if (targetNode.type !== 'FRAME' && targetNode.type !== 'INSTANCE' && targetNode.type !== 'COMPONENT') {
        figma.ui.postMessage({
          type: 'extract-design-structure-result',
          success: false,
          error: '请选中一个 Frame、组件实例或组件'
        });
        return;
      }
      
      figma.notify('正在提取设计稿结构...', { timeout: 2000 });
      
      // 提取结构
      var extractOptions = msg.options || {};
      var structure = await extractDesignStructure(targetNode, extractOptions);
      
      figma.ui.postMessage({
        type: 'extract-design-structure-result',
        success: true,
        data: structure
      });
      
      figma.notify('设计稿结构提取完成！', { timeout: 2000 });
      
    } catch (error) {
      figma.ui.postMessage({
        type: 'extract-design-structure-result',
        success: false,
        error: error.message || '提取失败'
      });
    }
  }
  else if (msg.type === 'execute-edit-actions') {
    // 执行编辑指令
    try {
      if (!msg.payload || !msg.payload.actions) {
        figma.ui.postMessage({
          type: 'execute-edit-actions-result',
          success: false,
          error: '缺少编辑指令'
        });
        return;
      }
      
      var actionCount = msg.payload.actions.length;
      figma.notify('正在执行 ' + actionCount + ' 条编辑指令...', { timeout: 2000 });
      
      // 执行编辑
      var results = await executeEditActions(msg.payload);
      
      figma.ui.postMessage({
        type: 'execute-edit-actions-result',
        success: results.success,
        data: results
      });
      
      if (results.success) {
        figma.notify('编辑完成！成功执行 ' + results.successCount + ' 条指令', { timeout: 3000 });
      } else {
        figma.notify('部分编辑失败：成功 ' + results.successCount + '，失败 ' + results.failedCount, { 
          error: true, 
          timeout: 4000 
        });
      }
      
    } catch (error) {
      figma.ui.postMessage({
        type: 'execute-edit-actions-result',
        success: false,
        error: error.message || '执行失败'
      });
      figma.notify('编辑执行失败: ' + error.message, { error: true });
    }
  }
};

// 监听选中状态变化
figma.on('selectionchange', () => {
  // 只有当UI打开且不在进行组件操作时才发送选中信息
  if (figma.ui && !isPerformingComponentOperation) {
    try {
      const selection = figma.currentPage.selection;
      const selectionInfo = selection.map(node => {
        // 安全地访问节点属性
        try {
          return {
            id: node.id,
            name: node.name,
            type: node.type,
            visible: node.visible
          };
        } catch (nodeError) {
          console.warn('访问节点属性失败:', nodeError);
          return null;
        }
      }).filter(info => info !== null); // 过滤掉无效的节点

      figma.ui.postMessage({
        type: 'selection-info',
        data: selectionInfo
      });
      
      // 如果处于更新 PRD 选择模式，发送更新选择状态
      if (isUpdatePrdMode) {
        sendUpdatePrdSelectionStatus();
      }
    } catch (error) {
      console.error('选中状态监听器错误:', error);
    }
  }
});

// ===== 更新 PRD 功能 =====

/**
 * 发送更新 PRD 选择状态给 UI
 */
function sendUpdatePrdSelectionStatus() {
  var selection = figma.currentPage.selection;
  var layers = selection.map(function(node) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      x: node.x,
      y: node.y
    };
  });
  
  figma.ui.postMessage({
    type: 'update-prd-selection-changed',
    layers: layers
  });
}

/**
 * 向上查找节点的 Confluence URL（从 pluginData）
 * @param {SceneNode} node - 起始节点
 * @returns {string|null} Confluence URL 或 null
 */
function findConfluenceUrl(node) {
  var current = node;
  while (current) {
    try {
      var url = current.getPluginData('soda_confluence_url');
      if (url) return url;
    } catch (e) {
      // 节点不支持 pluginData，继续向上查找
    }
    current = current.parent;
  }
  return null;
}

/**
 * 构造 Figma 节点链接
 * @param {string} nodeId - 节点 ID
 * @returns {string} Figma 链接
 */
function slugifyFigmaTitle(title) {
  var raw = String(title || 'Design');
  return encodeURIComponent(raw.trim().replace(/\s+/g, '-'));
}

function buildFigmaLink(nodeId) {
  var fileKey = figma.fileKey;
  if (!fileKey) {
    // 尝试从 root 获取
    fileKey = figma.root && figma.root.documentId ? figma.root.documentId : 'unknown';
  }
  var normalizedNodeId = String(nodeId || '').replace(/:/g, '-');
  var fileTitle = figma.root && figma.root.name ? figma.root.name : 'Design';
  return 'https://www.figma.com/design/' + fileKey + '/' + slugifyFigmaTitle(fileTitle) + '?node-id=' + normalizedNodeId;
}

/**
 * 将 Uint8Array 转换为 base64
 * @param {Uint8Array} bytes - 字节数组
 * @returns {string} base64 字符串
 */
function uint8ArrayToBase64(bytes) {
  if (typeof figma.base64Encode === 'function') {
    return figma.base64Encode(bytes);
  }
  if (typeof bytes.toBase64 === 'function') {
    return bytes.toBase64();
  }
  // 手动转换（分块避免栈溢出）
  var chunkSize = 4096;
  var binaryStr = '';
  for (var i = 0; i < bytes.byteLength; i += chunkSize) {
    var end = Math.min(i + chunkSize, bytes.byteLength);
    for (var j = i; j < end; j++) {
      binaryStr += String.fromCharCode(bytes[j]);
    }
  }
  return btoa(binaryStr);
}

/**
 * 处理确认更新 PRD - 执行截图并发送给 UI
 */
async function handleConfirmUpdatePrd() {
  var selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'update-prd-error',
      message: '请至少选择一个图层'
    });
    return;
  }
  
  // 按空间位置排序：先按 y（从上到下），再按 x（从左到右）
  var sortedNodes = Array.from(selection).sort(function(a, b) {
    var rowThreshold = 50; // 同一行的 y 容差
    if (Math.abs(a.y - b.y) < rowThreshold) {
      return a.x - b.x; // 同行按 x 排序
    }
    return a.y - b.y; // 不同行按 y 排序
  });
  
  // 查找 Confluence URL（从任意选中节点或其祖先）
  var confluenceUrl = null;
  for (var i = 0; i < sortedNodes.length; i++) {
    confluenceUrl = findConfluenceUrl(sortedNodes[i]);
    if (confluenceUrl) break;
  }
  
  if (!confluenceUrl) {
    figma.ui.postMessage({
      type: 'update-prd-error',
      message: '未找到关联的 Confluence 链接，该图层可能不是通过 Confluence PRD 生成的'
    });
    return;
  }
  
  figma.notify('正在截图...', { timeout: 2000 });
  
  // 批量截图
  var screenshots = [];
  for (var i = 0; i < sortedNodes.length; i++) {
    var node = sortedNodes[i];
    try {
      var imageBytes = await node.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 } // @2x 清晰度
      });
      var base64 = uint8ArrayToBase64(new Uint8Array(imageBytes));
      
      var link = buildFigmaLink(node.id);
      screenshots.push({
        name: node.name,
        nodeId: node.id,
        base64: base64,
        figmaLink: link
      });
    } catch (err) {
      console.error('截图失败:', node.name, err);
      // 继续处理其他节点
    }
  }
  
  if (screenshots.length === 0) {
    figma.ui.postMessage({
      type: 'update-prd-error',
      message: '截图失败，请重试'
    });
    return;
  }
  
  isUpdatePrdMode = false;
  
  figma.ui.postMessage({
    type: 'update-prd-ready',
    confluenceUrl: confluenceUrl,
    screenshots: screenshots
  });
}

// ==================== 第二部分：设计稿编辑功能（新增代码）====================
// 此部分与生成功能完全隔离，互不影响
// - extractDesignStructure: 提取设计稿结构
// - executeEditActions: 执行编辑指令
// - 新增消息处理: extract-design-structure, execute-edit-actions

/**
 * 设计稿编辑引擎 - 结构提取
 * 
 * 将 Figma 设计稿转换为 JSON 结构，供 Agent 理解和生成编辑指令
 * 
 * 优化策略：
 * 1. 路径标注：每个节点携带完整路径
 * 2. 深度控制：避免提取过深导致数据量过大
 * 3. 类型过滤：聚焦可编辑的节点类型
 * 4. 表格智能处理：只提取表头，避免数据爆炸
 */

/**
 * 提取设计稿结构为 JSON
 * @param {SceneNode} rootFrame - 根节点（通常是选中的 Frame）
 * @param {Object} options - 提取选项
 * @param {number} options.maxDepth - 最大遍历深度（默认 4）
 * @param {string[]} options.includeTypes - 关注的节点类型
 * @param {boolean} options.skipInstanceChildren - 是否跳过组件实例内部
 * @returns {Object} 设计稿结构 JSON
 */
async function extractDesignStructure(rootFrame, options) {
  // 设置默认选项（不使用解构默认值，兼容 Figma 插件环境）
  options = options || {};
  var maxDepth = options.maxDepth !== undefined ? options.maxDepth : 4;
  var includeTypes = options.includeTypes || ['INSTANCE', 'TEXT', 'FRAME', 'COMPONENT', 'GROUP'];
  var skipInstanceChildren = options.skipInstanceChildren !== undefined ? options.skipInstanceChildren : false;
  
  var structure = {
    frameId: rootFrame.id,
    frameName: rootFrame.name,
    frameType: rootFrame.type,
    frameSize: {
      width: rootFrame.width,
      height: rootFrame.height
    },
    extractedAt: new Date().toISOString(),
    nodes: []
  };
  
  // 开始递归提取
  await traverseAndExtract(rootFrame, structure.nodes, '', 0, {
    maxDepth: maxDepth,
    includeTypes: includeTypes,
    skipInstanceChildren: skipInstanceChildren
  });
  
  return structure;
}

/**
 * 递归遍历并提取节点信息
 * @param {SceneNode} node - 当前节点
 * @param {Array} results - 结果数组
 * @param {string} parentPath - 父节点路径
 * @param {number} depth - 当前深度
 * @param {Object} options - 提取选项
 */
async function traverseAndExtract(node, results, parentPath, depth, options) {
  // 深度检查
  if (depth > options.maxDepth) {
    return;
  }
  
  // 构建当前路径
  var currentPath = parentPath ? (parentPath + ' / ' + node.name) : node.name;
  
  // 基本节点信息
  var nodeInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
    path: currentPath,
    visible: node.visible,
    depth: depth
  };
  
  // 尺寸信息（如果有）
  if (node.width !== undefined && node.height !== undefined) {
    nodeInfo.size = {
      width: Math.round(node.width),
      height: Math.round(node.height)
    };
  }
  
  // 组件实例特殊处理
  if (node.type === 'INSTANCE') {
    try {
      var mainComponent = await node.getMainComponentAsync();
      nodeInfo.componentKey = mainComponent ? mainComponent.key : null;
      nodeInfo.componentName = mainComponent ? mainComponent.name : null;
    } catch (e) {
      nodeInfo.componentKey = null;
      nodeInfo.componentName = 'unknown';
    }
    
    // 提取组件属性
    if (node.componentProperties) {
      nodeInfo.componentProperties = {};
      var propKeys = Object.keys(node.componentProperties);
      for (var i = 0; i < propKeys.length; i++) {
        var propName = propKeys[i];
        var prop = node.componentProperties[propName];
        nodeInfo.componentProperties[propName] = {
          type: prop.type,
          value: prop.value
        };
        // 如果是变体属性，尝试添加可选值（从 componentPropertyDefinitions 获取）
        // 注意：使用已经获取的 mainComponent 变量（异步获取的）
        if (prop.type === 'VARIANT' && mainComponent && mainComponent.parent) {
          var componentSet = mainComponent.parent;
          if (componentSet.type === 'COMPONENT_SET' && componentSet.componentPropertyDefinitions) {
            var propDef = componentSet.componentPropertyDefinitions[propName];
            if (propDef && propDef.variantOptions) {
              nodeInfo.componentProperties[propName].options = propDef.variantOptions;
            }
          }
        }
      }
    }
    
    // 表格智能处理：如果是表格组件，提取摘要而非完整内容
    if (node.name.toLowerCase().includes('table')) {
      nodeInfo.isTable = true;
      nodeInfo.summary = extractTableSummary(node);
    }
  }
  
  // 文本节点特殊处理
  if (node.type === 'TEXT') {
    nodeInfo.characters = node.characters;
    // 获取字体信息（仅第一个字符的字体）
    if (node.characters && node.characters.length > 0) {
      try {
        var fontName = node.getRangeFontName(0, 1);
        if (fontName !== figma.mixed) {
          nodeInfo.fontName = fontName;
        }
      } catch (e) {
        // 忽略字体获取错误
      }
    }
  }
  
  // 添加到结果
  results.push(nodeInfo);
  
  // 递归处理子节点
  if ('children' in node && node.children && node.children.length > 0) {
    // 如果是组件实例且设置了跳过内部
    if (node.type === 'INSTANCE' && options.skipInstanceChildren) {
      // 只提取直接可编辑的文本子节点
      nodeInfo.editableChildren = [];
      for (var j = 0; j < node.children.length; j++) {
        var child = node.children[j];
        if (child.type === 'TEXT') {
          nodeInfo.editableChildren.push({
            id: child.id,
            name: child.name,
            type: 'TEXT',
            characters: child.characters
          });
        }
      }
    } else {
      nodeInfo.children = [];
      for (var k = 0; k < node.children.length; k++) {
        await traverseAndExtract(node.children[k], nodeInfo.children, currentPath, depth + 1, options);
      }
    }
  }
}

/**
 * 提取表格摘要信息（增强版）
 * @param {InstanceNode} tableNode - 表格组件实例
 * @returns {Object} 表格摘要，包含可编辑单元格的 ID
 */
function extractTableSummary(tableNode) {
  var summary = {
    columns: 0,
    rows: 0,
    columnHeaders: [],
    editableCells: [],      // TEXT 节点列表
    editableInstances: []   // 组件实例列表（通过属性编辑）
  };
  
  // 查找所有可编辑的文本节点和组件实例
  function findEditableElements(node, context, depth) {
    if (depth > 6) return;  // 增加深度限制
    
    // TEXT 节点
    if (node.type === 'TEXT' && node.characters) {
      summary.editableCells.push({
        id: node.id,
        name: node.name,
        text: node.characters.length > 30 ? node.characters.substring(0, 30) + '...' : node.characters,
        context: context,
        editType: 'setText'
      });
    }
    
    // 组件实例 - 检查是否有文本相关属性
    if (node.type === 'INSTANCE') {
      var textProps = {};
      var hasTextProp = false;
      
      // 获取组件属性
      try {
        var props = node.componentProperties;
        if (props) {
          for (var propName in props) {
            if (props.hasOwnProperty(propName)) {
              var prop = props[propName];
              // 检查是否是文本类型属性
              if (prop.type === 'TEXT' || 
                  propName.toLowerCase().includes('text') || 
                  propName.toLowerCase().includes('label') ||
                  propName.toLowerCase().includes('title') ||
                  propName.toLowerCase().includes('value')) {
                textProps[propName] = prop.value;
                hasTextProp = true;
              }
            }
          }
        }
      } catch (e) {
        // 忽略属性获取错误
      }
      
      if (hasTextProp) {
        summary.editableInstances.push({
          id: node.id,
          name: node.name,
          context: context,
          editType: 'setVariant',
          textProperties: textProps
        });
      }
    }
    
    // 更新上下文并递归
    if ('children' in node && node.children) {
      var childContext = context;
      if (node.name) {
        var lowerName = node.name.toLowerCase();
        if (lowerName.includes('header') || lowerName.includes('thead') || lowerName.includes('th')) {
          childContext = 'header';
        } else if (lowerName.includes('row') || lowerName.includes('tr') || lowerName.includes('body')) {
          childContext = 'row';
        } else if (lowerName.includes('cell') || lowerName.includes('td') || lowerName.includes('column')) {
          childContext = 'cell';
        }
      }
      
      for (var i = 0; i < node.children.length; i++) {
        findEditableElements(node.children[i], childContext, depth + 1);
      }
    }
  }
  
  // 查找表头
  function findHeaders(node, depth) {
    if (depth > 3) return;
    
    if (node.name && (node.name.toLowerCase().includes('header') || node.name.toLowerCase().includes('thead'))) {
      if ('children' in node && node.children) {
        for (var i = 0; i < node.children.length; i++) {
          var child = node.children[i];
          if (child.type === 'TEXT') {
            summary.columnHeaders.push({ id: child.id, text: child.characters });
            summary.columns++;
          } else if ('children' in child && child.children) {
            for (var j = 0; j < child.children.length; j++) {
              var grandChild = child.children[j];
              if (grandChild.type === 'TEXT') {
                summary.columnHeaders.push({ id: grandChild.id, text: grandChild.characters });
                summary.columns++;
              }
            }
          }
        }
      }
      return;
    }
    
    if ('children' in node && node.children) {
      for (var k = 0; k < node.children.length; k++) {
        findHeaders(node.children[k], depth + 1);
      }
    }
  }
  
  findHeaders(tableNode, 0);
  
  // 估算行数
  function countRows(node) {
    var count = 0;
    if (node.name && node.name.toLowerCase().includes('row') && !node.name.toLowerCase().includes('header')) {
      count++;
    }
    if ('children' in node && node.children) {
      for (var i = 0; i < node.children.length; i++) {
        count += countRows(node.children[i]);
      }
    }
    return count;
  }
  
  summary.rows = countRows(tableNode);
  
  // 提取可编辑元素（TEXT 节点和组件实例）
  findEditableElements(tableNode, 'table', 0);
  
  // 限制数量，避免数据过大
  if (summary.editableCells.length > 30) {
    summary.totalCellCount = summary.editableCells.length;
    summary.editableCells = summary.editableCells.slice(0, 30);
    summary.hasMoreCells = true;
  }
  
  if (summary.editableInstances.length > 30) {
    summary.totalInstanceCount = summary.editableInstances.length;
    summary.editableInstances = summary.editableInstances.slice(0, 30);
    summary.hasMoreInstances = true;
  }
  
  return summary;
}

/**
 * 设计稿编辑引擎 - 指令执行器
 * 
 * 执行 Agent 生成的编辑指令，支持：
 * - setVariant: 切换组件变体
 * - setText: 修改文本内容
 * - setVisibility: 显示/隐藏元素
 * - swapComponent: 替换组件
 * - setNestedText: 修改嵌套文本
 * - setImage: 替换图片
 */

/**
 * 执行编辑指令数组
 * @param {Object} editPayload - 编辑指令载荷
 * @param {string} editPayload.targetFrameId - 目标 Frame ID
 * @param {Array} editPayload.actions - 编辑指令数组
 * @returns {Object} 执行结果
 */
async function executeEditActions(editPayload) {
  var results = {
    success: true,
    totalActions: editPayload.actions ? editPayload.actions.length : 0,
    successCount: 0,
    failedCount: 0,
    details: []
  };
  
  if (!editPayload.actions || editPayload.actions.length === 0) {
    results.success = false;
    results.error = '没有要执行的编辑指令';
    return results;
  }
  
  for (var i = 0; i < editPayload.actions.length; i++) {
    var action = editPayload.actions[i];
    var actionResult = {
      index: i,
      type: action.type,
      nodeId: action.nodeId,
      success: false,
      error: null
    };
    
    try {
      // 获取目标节点
      var node = await figma.getNodeByIdAsync(action.nodeId);
      
      if (!node) {
        actionResult.error = '节点不存在: ' + action.nodeId;
        results.details.push(actionResult);
        results.failedCount++;
        continue;
      }
      
      // 根据指令类型执行不同操作
      switch (action.type) {
        case 'setVariant':
          await executeSetVariant(node, action);
          actionResult.success = true;
          break;
          
        case 'setText':
          await executeSetText(node, action);
          actionResult.success = true;
          break;
          
        case 'setVisibility':
          executeSetVisibility(node, action);
          actionResult.success = true;
          break;
          
        case 'swapComponent':
          await executeSwapComponent(node, action);
          actionResult.success = true;
          break;
          
        case 'setNestedText':
          await executeSetNestedText(node, action);
          actionResult.success = true;
          break;
          
        case 'setImage':
          await executeSetImage(node, action);
          actionResult.success = true;
          break;
          
        default:
          actionResult.error = '未知的指令类型: ' + action.type;
      }
      
      if (actionResult.success) {
        results.successCount++;
      } else {
        results.failedCount++;
      }
      
    } catch (error) {
      actionResult.error = error.message || '执行失败';
      results.failedCount++;
    }
    
    results.details.push(actionResult);
  }
  
  results.success = results.failedCount === 0;
  
  // 如果有失败，生成错误摘要
  if (results.failedCount > 0) {
    var failedDetails = results.details.filter(function(d) { return !d.success; });
    var errorMessages = failedDetails.map(function(d) { 
      return d.type + '(' + d.nodeId + '): ' + d.error; 
    });
    results.error = '部分指令执行失败: ' + errorMessages.slice(0, 3).join('; ');
    if (errorMessages.length > 3) {
      results.error += ' ...等 ' + errorMessages.length + ' 个错误';
    }
  }
  
  return results;
}

/**
 * 执行变体切换指令
 * @param {InstanceNode} node - 组件实例节点
 * @param {Object} action - 指令对象
 */
async function executeSetVariant(node, action) {
  if (node.type !== 'INSTANCE') {
    throw new Error('setVariant 只能应用于组件实例');
  }
  
  if (!action.properties || typeof action.properties !== 'object') {
    throw new Error('setVariant 需要 properties 参数');
  }
  
  // 使用 setProperties 设置属性
  node.setProperties(action.properties);
}

/**
 * 执行文本修改指令
 * @param {TextNode} node - 文本节点
 * @param {Object} action - 指令对象
 */
async function executeSetText(node, action) {
  if (node.type !== 'TEXT') {
    throw new Error('setText 只能应用于文本节点');
  }
  
  if (action.text === undefined || action.text === null) {
    throw new Error('setText 需要 text 参数');
  }
  
  // 加载字体
  await loadAllFontsForText(node);
  
  // 设置文本内容
  node.characters = String(action.text);
}

/**
 * 执行显示/隐藏指令
 * @param {SceneNode} node - 任意场景节点
 * @param {Object} action - 指令对象
 */
function executeSetVisibility(node, action) {
  if (action.visible === undefined) {
    throw new Error('setVisibility 需要 visible 参数');
  }
  
  node.visible = Boolean(action.visible);
}

/**
 * 执行组件替换指令
 * @param {InstanceNode} node - 组件实例节点
 * @param {Object} action - 指令对象
 */
async function executeSwapComponent(node, action) {
  if (node.type !== 'INSTANCE') {
    throw new Error('swapComponent 只能应用于组件实例');
  }
  
  if (!action.newComponentKey) {
    throw new Error('swapComponent 需要 newComponentKey 参数');
  }
  
  // 导入新组件
  var newComponent = await figma.importComponentByKeyAsync(action.newComponentKey);
  
  if (!newComponent) {
    throw new Error('无法导入组件: ' + action.newComponentKey);
  }
  
  // 执行替换
  node.swapComponent(newComponent);
}

/**
 * 执行嵌套文本修改指令
 * @param {InstanceNode} node - 组件实例节点
 * @param {Object} action - 指令对象
 */
async function executeSetNestedText(node, action) {
  if (!action.targetName && !action.targetPath) {
    throw new Error('setNestedText 需要 targetName 或 targetPath 参数');
  }
  
  if (action.text === undefined || action.text === null) {
    throw new Error('setNestedText 需要 text 参数');
  }
  
  // 查找目标文本节点
  var targetText = null;
  var searchName = action.targetName || '';
  
  if (searchName) {
    // 1. 精确匹配
    targetText = node.findOne(function(n) {
      return n.type === 'TEXT' && n.name === searchName;
    });
    
    // 2. 不区分大小写匹配
    if (!targetText) {
      var lowerName = searchName.toLowerCase();
      targetText = node.findOne(function(n) {
        return n.type === 'TEXT' && n.name.toLowerCase() === lowerName;
      });
    }
    
    // 3. 包含匹配（名称包含搜索词）
    if (!targetText) {
      targetText = node.findOne(function(n) {
        return n.type === 'TEXT' && n.name.toLowerCase().indexOf(lowerName) !== -1;
      });
    }
    
    // 4. 关键词匹配（搜索词包含在名称中或反之）
    if (!targetText) {
      var keywords = searchName.replace(/([A-Z])/g, ' $1').toLowerCase().split(/[\s_-]+/);
      targetText = node.findOne(function(n) {
        if (n.type !== 'TEXT') return false;
        var nodeName = n.name.toLowerCase();
        return keywords.some(function(kw) { 
          return kw.length > 2 && nodeName.indexOf(kw) !== -1; 
        });
      });
    }
    
    // 5. 如果是特定关键词，查找相关文本节点
    if (!targetText) {
      var keywordMap = {
        'placeholder': ['placeholder', 'hint', 'input', 'search'],
        'title': ['title', 'heading', 'header', 'label'],
        'searchplaceholder': ['search', 'placeholder', 'input'],
        'appname': ['app', 'name', 'logo', 'brand', 'title'],
        'columnheaders': ['header', 'column', 'th', 'head']
      };
      var mappedKeywords = keywordMap[searchName.toLowerCase()];
      if (mappedKeywords) {
        targetText = node.findOne(function(n) {
          if (n.type !== 'TEXT') return false;
          var nodeName = n.name.toLowerCase();
          return mappedKeywords.some(function(kw) { return nodeName.indexOf(kw) !== -1; });
        });
      }
    }
  }
  
  if (action.targetPath && !targetText) {
    // 通过路径查找
    var pathParts = action.targetPath.split('/').map(function(p) { return p.trim(); });
    var current = node;
    
    for (var i = 0; i < pathParts.length && current; i++) {
      var partName = pathParts[i];
      if ('children' in current && current.children) {
        current = current.children.find(function(c) { return c.name === partName; }) || null;
      } else {
        current = null;
      }
    }
    
    if (current && current.type === 'TEXT') {
      targetText = current;
    }
  }
  
  // 6. 最后尝试：查找节点内的第一个文本节点
  if (!targetText) {
    targetText = node.findOne(function(n) { return n.type === 'TEXT'; });
  }
  
  if (!targetText) {
    throw new Error('找不到目标文本节点: ' + (action.targetName || action.targetPath) + '，节点内无任何文本');
  }
  
  // 加载字体并设置文本
  await loadAllFontsForText(targetText);
  targetText.characters = String(action.text);
}

/**
 * 执行图片替换指令
 * @param {SceneNode} node - 可填充节点
 * @param {Object} action - 指令对象
 */
async function executeSetImage(node, action) {
  if (!action.imageUrl && !action.imageHash) {
    throw new Error('setImage 需要 imageUrl 或 imageHash 参数');
  }
  
  // 检查节点是否支持填充
  if (!('fills' in node)) {
    throw new Error('该节点不支持图片填充');
  }
  
  var imageHash;
  
  if (action.imageHash) {
    imageHash = action.imageHash;
  } else {
    // 需要从 URL 获取图片（在 Figma 插件中需要通过 UI 中转）
    throw new Error('图片 URL 下载需要通过 UI 中转，请使用 imageHash');
  }
  
  var scaleMode = action.scaleMode || 'FILL';
  
  node.fills = [{
    type: 'IMAGE',
    imageHash: imageHash,
    scaleMode: scaleMode
  }];
}

/**
 * 加载文本节点的所有字体
 * @param {TextNode} textNode - 文本节点
 */
async function loadAllFontsForText(textNode) {
  if (textNode.characters.length === 0) {
    // 空文本，加载默认字体
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    return;
  }
  
  // 获取所有使用的字体
  var fonts = textNode.getRangeAllFontNames(0, textNode.characters.length);
  
  // 并行加载所有字体
  var loadPromises = [];
  for (var i = 0; i < fonts.length; i++) {
    loadPromises.push(figma.loadFontAsync(fonts[i]));
  }
  
  await Promise.all(loadPromises);
}

