/**
 * ==================================================================================
 * Figma Plugin for New Design Interface - 配置驱动的UI生成引擎
 * ==================================================================================
 * 
 * 🎯 功能概述：
 * 通过统一配置对象（CONFIG）定义UI元素和页面结构，一键生成完整的Figma界面
 * 支持Frame、Component、Rectangle、Text、Group等多种元素类型
 * 
 * 📖 使用指南：
 * 
 * 1️⃣ 【元素配置 CONFIG.elements】
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 🔸 Frame元素配置：
 * {
 *   type: 'frame',                    // 必填：元素类型
 *   name: "Frame Name",               // 必填：图层名称
 *   width: 1920,                      // 可选：宽度（像素）
 *   height: 1080,                     // 可选：高度（像素）
 *   backgroundColor: { r: 1, g: 1, b: 1 },  // 可选：背景色（RGB 0-1）
 *   padding: 24,                      // 可选：统一内边距
 *   paddingLeft: 24,                  // 可选：左内边距
 *   paddingRight: 24,                 // 可选：右内边距
 *   paddingTop: 24,                   // 可选：上内边距
 *   paddingBottom: 24,                // 可选：下内边距
 *   itemSpacing: 16,                  // 可选：子元素间距
 *   layoutMode: "VERTICAL",           // 可选：布局模式 "VERTICAL" | "HORIZONTAL"
 *   layoutAlign: "STRETCH",           // 可选：布局对齐 "MIN" | "MAX" | "CENTER" | "STRETCH"
 *   layoutGrow: 1,                    // 可选：布局增长权重（0=固定，1=填充剩余空间）
 *   primaryAxisAlignItems: "MIN",     // 可选：主轴对齐 "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN"
 *   counterAxisAlignItems: "MIN",     // 可选：副轴对齐 "MIN" | "MAX" | "CENTER"
 *   primaryAxisSizingMode: "AUTO",    // 可选：主轴尺寸模式 "FIXED" | "AUTO"
 *   counterAxisSizingMode: "AUTO",    // 可选：副轴尺寸模式 "FIXED" | "AUTO"
 *   centerPosition: true,             // 可选：是否居中定位到视口
 *   cornerRadius: 8,                  // 可选：圆角半径
 *   visible: true,                    // 可选：可见性
 *   locked: false,                    // 可选：锁定状态
 *   opacity: 1                        // 可选：透明度 0-1
 * }
 * 
 * 🔸 Component组件配置：
 * {
 *   type: 'component',                // 必填：元素类型
 *   key: "component-key-string",      // 必填：组件Key（从Figma获取）
 *   width: 240,                       // 可选：固定宽度
 *   height: 56,                       // 可选：固定高度
 *   layoutAlign: "STRETCH",           // 可选：布局对齐方式
 *   layoutGrow: 0,                    // 可选：布局增长权重
 *   primaryAxisSizingMode: "FIXED",   // 可选：主轴尺寸模式
 *   counterAxisSizingMode: "AUTO",    // 可选：副轴尺寸模式
 *   forceWidthFill: true,             // 可选：强制宽度填充（特殊情况使用）
 *   componentProperties: {            // 可选：组件属性覆盖
 *     "property-name": "property-value"
 *   }
 * }
 * 
 * 🔸 Rectangle矩形配置：
 * {
 *   type: 'rectangle',                // 必填：元素类型
 *   name: "Rectangle Name",           // 必填：图层名称
 *   width: 100,                       // 必填：宽度
 *   height: 100,                      // 必填：高度
 *   backgroundColor: { r: 0.2, g: 0.4, b: 0.8 },  // 可选：填充色
 *   cornerRadius: 4,                  // 可选：圆角
 *   strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],  // 可选：描边
 *   strokeWeight: 1                   // 可选：描边粗细
 * }
 * 
 * 🔸 Text文本配置：
 * {
 *   type: 'text',                     // 必填：元素类型
 *   name: "Text Name",                // 必填：图层名称
 *   characters: "文本内容",           // 必填：文本内容
 *   fontSize: 16,                     // 可选：字体大小
 *   fontName: { family: "Inter", style: "Regular" },  // 可选：字体
 *   textAlignHorizontal: "LEFT",      // 可选：水平对齐 "LEFT" | "CENTER" | "RIGHT"
 *   textAlignVertical: "TOP",         // 可选：垂直对齐 "TOP" | "CENTER" | "BOTTOM"
 *   textAutoResize: "WIDTH_AND_HEIGHT", // 可选：自动调整 "NONE" | "WIDTH_AND_HEIGHT" | "HEIGHT"
 *   fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]  // 可选：文本颜色
 * }
 * 
 * 🔸 Group组合配置：
 * {
 *   type: 'group',                    // 必填：元素类型
 *   name: "Group Name"                // 必填：图层名称
 * }
 * 
 * 2️⃣ 【页面结构定义 CONFIG.pageStructure】
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 页面结构使用嵌套数组定义，支持无限层级嵌套：
 * 
 * pageStructure: [
 *   { 
 *     element: 'mainFrame',           // 引用 CONFIG.elements 中的元素名
 *     children: [                     // 可选：子元素数组
 *       { element: 'topbar' },        // 叶子节点：无子元素
 *       { 
 *         element: 'contentFrame', 
 *         children: [                 // 嵌套子元素
 *           { element: 'sidebar' },
 *           { 
 *             element: 'pageContainer',
 *             children: [
 *               { element: 'header' },
 *               { element: 'proTable' }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 * 
 * 📝 结构定义规则：
 * • element: 必须对应 CONFIG.elements 中定义的元素名
 * • children: 可选，包含子元素的数组
 * • 支持任意层级嵌套
 * • 构建顺序：从上到下，从左到右
 * 
 * 3️⃣ 【布局最佳实践】
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 🎯 尺寸控制：
 * • layoutGrow: 0 = 根据内容大小（hug contents）
 * • layoutGrow: 1 = 填充剩余空间（fill container）
 * • 固定尺寸：设置具体的 width/height 值
 * 
 * 🎯 对齐填充：
 * • layoutAlign: "STRETCH" = 在副轴方向填充父容器
 * • primaryAxisSizingMode: "FIXED" = 主轴方向固定尺寸
 * • counterAxisSizingMode: "AUTO" = 副轴方向自动调整
 * 
 * 🎯 常见布局模式：
 * • 顶部导航栏：固定高度，宽度填充
 * • 侧边栏：固定宽度，高度填充
 * • 内容区域：宽高都填充剩余空间
 * • 按钮：固定尺寸或根据内容自适应
 * 
 * 4️⃣ 【使用方法】
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. 修改 CONFIG.elements 定义所需的元素
 * 2. 修改 CONFIG.pageStructure 定义页面层级结构
 * 3. 运行插件，一键生成完整界面
 * 
 * ==================================================================================
 */

// Figma Plugin for New Design Interface - 超简化版本
figma.showUI(__html__, { width: 400, height: 300 });

// ==================== 统一配置 ====================

const CONFIG = {
  // 元素定义
  elements: {
    // Frame元素
  mainFrame: {
      type: 'frame',
      name: "New Design Frame",
      width: 1920,
      height: 1080,
      backgroundColor: { r: 1, g: 1, b: 1 },
      padding: 0,
      itemSpacing: 0,
      layoutMode: "VERTICAL",
      centerPosition: true,
      sizingModes: { primaryAxisSizingMode: "FIXED", counterAxisSizingMode: "FIXED" }
  },
  contentFrame: {
      type: 'frame',
      name: "Content Frame",
      backgroundColor: { r: 1, g: 1, b: 1 },
      padding: 0,
      itemSpacing: 0,
      layoutMode: "HORIZONTAL",
      layoutAlign: "STRETCH", // 宽度填充父容器
      layoutGrow: 1, // 高度填充剩余空间
      sizingModes: { primaryAxisSizingMode: "AUTO", counterAxisSizingMode: "AUTO" }
  },
  pageContainer: {
      type: 'frame',
      name: "Page Container",
      backgroundColor: { r: 0.961, g: 0.961, b: 0.961 },
      padding: 0,
      itemSpacing: 24,
      layoutMode: "VERTICAL",
      layoutAlign: "STRETCH", // 高度填充父容器（水平布局中）
      layoutGrow: 1, // 宽度填充剩余空间
      sizingModes: { primaryAxisSizingMode: "FIXED", counterAxisSizingMode: "FIXED" }
  },
  proTableFrame: {
      type: 'frame',
      name: "Pro Table",
      backgroundColor: null,
      paddingLeft: 24,
      paddingRight: 24,
      paddingTop: 0,
      paddingBottom: 24,
      itemSpacing: 0,
      layoutMode: "VERTICAL",
      layoutAlign: "STRETCH", // 宽度填充父容器
      layoutGrow: 1, // 高度填充剩余空间
      sizingModes: { primaryAxisSizingMode: "AUTO", counterAxisSizingMode: "AUTO" }
    },
    topbar: {
      type: 'component',
      key: "87e3cf5ce77dd5659b8c8063f53bc2ac83fb05e5",
      height: 56, // 固定高度
      layoutAlign: "STRETCH", // 宽度填充
      layoutGrow: 0, // 不占用额外空间
      primaryAxisSizingMode: "FIXED", // 高度固定
      counterAxisSizingMode: "FIXED" // 宽度填充但不自动调整
    },
    sidebar: {
      type: 'component',
      key: "d2bc3d5c399bb05406b738b9dcb93aee6d031a5b",
      width: 240, // 固定宽度
      layoutAlign: "STRETCH", // 高度填充
      layoutGrow: 0, // 不占用额外空间
      primaryAxisSizingMode: "FIXED", // 宽度固定
      counterAxisSizingMode: "AUTO" // 高度自动填充
    },
    header: {
      type: 'component',
      key: "4b10082a59a85f2938802355e70793140263a40b",
      layoutAlign: "STRETCH", // 宽度填充
      layoutGrow: 0, // 不占用额外空间，根据内容自适应高度
      primaryAxisSizingMode: "AUTO", // 高度根据内容自适应
      counterAxisSizingMode: "AUTO" // 宽度自动填充
    },
    proTable: {
      type: 'component',
      key: "4e9332c9435f9d814c8e292c6547457a4bf25a9d",
      layoutAlign: "STRETCH", // 宽度填充
      layoutGrow: 1, // 占用剩余空间
      primaryAxisSizingMode: "AUTO", // 高度根据内容自适应
      counterAxisSizingMode: "AUTO", // 宽度自动填充
      // 强制宽度填充设置
      forceWidthFill: true
    }
  },
  
  // 页面结构定义
  pageStructure: [
    { element: 'mainFrame', children: [
      { element: 'topbar' },
      { element: 'contentFrame', children: [
        { element: 'sidebar' },
        { element: 'pageContainer', children: [
          { element: 'header' },
          { element: 'proTableFrame', children: [
            { element: 'proTable' }
          ]}
        ]}
      ]}
    ]}
  ]
};

// ==================== 核心引擎 ====================

/**
 * 统一元素创建引擎 - 增强版
 * 支持更多Figma Plugin API功能
 */
async function createElement(elementName, parent = null, elementsConfig = null) {
  const config = (elementsConfig && elementsConfig[elementName]) || CONFIG.elements[elementName];
  if (!config) throw new Error(`未知元素: ${elementName}`);
  
  let element;
  
  // 根据类型创建不同的元素
  switch(config.type) {
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
      element = createTextElement(config, parent);
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
 * Text创建引擎
 */
function createTextElement(config, parent) {
  const text = figma.createText();
  
  // 基本属性设置
  applyBasicProperties(text, config);
  
  // 文本内容设置
  if (config.characters) {
    text.characters = config.characters;
  }
  
  // 字体设置
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
  
  // 尺寸调整模式
  if (config.sizingModes) {
    if (config.sizingModes.primaryAxisSizingMode) {
      element.primaryAxisSizingMode = config.sizingModes.primaryAxisSizingMode;
    }
    if (config.sizingModes.counterAxisSizingMode) {
      element.counterAxisSizingMode = config.sizingModes.counterAxisSizingMode;
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
 */
function applyTextProperties(element, config) {
  // 字体设置
  if (config.fontName) {
    element.fontName = config.fontName;
  }
  
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
  if (config.layoutGrow && config.layoutGrow > 0 || config.forceWidthFill) {
    setTimeout(() => {
      if (parent && parent.layoutMode) {
        const isHorizontal = parent.layoutMode === "HORIZONTAL";
        
        if (isHorizontal && config.layoutAlign === "STRETCH") {
          // 水平布局中需要高度填充
          if (element.height !== parent.height) {
            element.resize(element.width, parent.height);
          }
        } else if (!isHorizontal && config.layoutAlign === "STRETCH") {
          // 垂直布局中需要宽度填充
          const availableWidth = parent.width - parent.paddingLeft - parent.paddingRight;
          if (element.width !== availableWidth) {
            element.resize(availableWidth, element.height);
          }
        }
        
        // 特殊处理：强制宽度填充
        if (config.forceWidthFill && parent.layoutMode === "VERTICAL") {
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
 * 组件创建引擎 - 增强版
 */
async function createComponentElement(config, parent) {
  try {
    const component = await figma.importComponentByKeyAsync(config.key);
    const instance = component.createInstance();
    
    // 应用基本属性
    applyBasicProperties(instance, config);
    
    // 应用尺寸属性
    applySizeProperties(instance, config, parent);
    
    // 应用样式属性
    applyStyleProperties(instance, config);
    
    // 应用组件的尺寸调整模式
    if (config.primaryAxisSizingMode) {
      instance.primaryAxisSizingMode = config.primaryAxisSizingMode;
    }
    if (config.counterAxisSizingMode) {
      instance.counterAxisSizingMode = config.counterAxisSizingMode;
    }
    
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
 */
async function buildPage(structure, parent = null, elementsConfig = null) {
  const results = {};
  
  for (const item of structure) {
    const element = await createElement(item.element, parent, elementsConfig);
    results[item.element] = element;
    
    if (item.children) {
      const childResults = await buildPage(item.children, element, elementsConfig);
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

// ==================== 执行区域 ====================

/**
 * 主执行函数 - 超简化版本
 */
async function createNewDesignInterface() {
  try {
    // 一行代码构建整个页面
    const elements = await buildPage(CONFIG.pageStructure);
    
    // 设置视图
    figma.currentPage.selection = [elements.mainFrame];
    figma.viewport.center = { x: figma.viewport.center.x, y: figma.viewport.center.y };
    figma.viewport.zoom = 0.5;
    
    figma.notify("设计界面创建完成！");

  } catch (error) {
    figma.notify(`创建失败: ${error.message}`, { error: true });
  }
}

// UI事件处理
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-design') {
    await createNewDesignInterface();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
