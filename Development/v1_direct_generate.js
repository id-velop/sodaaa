// Figma Plugin for Data Table Design
figma.showUI(__html__, { width: 400, height: 300 });

// ==================== 组件资产 ====================

// 定义组件 Key 映射
const COMPONENT_KEYS = {
  // 标题组件
  title: "1fa3b553071b0113d387d4074cfdf41e7678609a",

  // 按钮组件
  buttonSecondary: "f8f1045a550c3785797c1024600bfd5b574986f1",
  buttonPrimary: "3df16de598fe1de83c0a1fa6f8deabf94e196703",

  // 表格组件
  table: "a617334256aa24fc5c321dc2c55b22b580ca80be"
};

// 设计 token 映射表
const radiusTokens = {
  "borderRadius": 2
};

// 画布配置
const CANVAS_CONFIG = {
  mainFrame: {
    width: 1280,
    height: 720,
    backgroundColor: { r: 1, g: 1, b: 1 }, // #ffffff
    padding: { left: 16, right: 16, top: 16, bottom: 16 },
    itemSpacing: 14
  },
  headerFrame: {
    height: 52,
    backgroundColor: { r: 0.965, g: 0.965, b: 0.965 }, // #F6F6F6
    padding: { left: 40, right: 40, top: 10, bottom: 10 }
  },
  buttonGroup: {
    itemSpacing: 12
  }
};

// ==================== 功能辅助函数 ====================

// 设置 Frame 圆角的辅助函数
function setFrameBorderRadius(frame) {
  const radiusValue = radiusTokens["borderRadius"];
  if (radiusValue !== undefined) {
    frame.cornerRadius = radiusValue; // 应用圆角 token
    console.log(`已设置圆角 = ${radiusValue}px (borderRadius)`);
  } else {
    console.log("未找到 borderRadius token，使用默认圆角");
  }
}

// ==================== 框架生成函数（不引用任何资产） ====================

// 创建主 Frame
function createMainFrame() {
  const mainFrame = figma.createFrame();
  mainFrame.name = "Data Table Design";

  // 配置主 Frame 尺寸和位置
  const config = CANVAS_CONFIG.mainFrame;
  mainFrame.resize(config.width, config.height);

  // 计算中心位置 - 使用当前视窗的中心
  const centerX = figma.viewport.center.x;
  const centerY = figma.viewport.center.y;
  mainFrame.x = centerX - config.width / 2;
  mainFrame.y = centerY - config.height / 2;

  // 设置背景色
  mainFrame.fills = [{ type: 'SOLID', color: config.backgroundColor }];

  // 设置圆角
  setFrameBorderRadius(mainFrame);

  // 设置布局属性
  mainFrame.layoutMode = "VERTICAL";
  mainFrame.primaryAxisSizingMode = "FIXED";
  mainFrame.counterAxisSizingMode = "FIXED";
  mainFrame.paddingLeft = config.padding.left;
  mainFrame.paddingRight = config.padding.right;
  mainFrame.paddingTop = config.padding.top;
  mainFrame.paddingBottom = config.padding.bottom;
  mainFrame.itemSpacing = config.itemSpacing;

  return mainFrame;
}

// 创建顶部 Frame
function createHeaderFrame() {
  const headerFrame = figma.createFrame();
  headerFrame.name = "Header";

  // 配置顶部 Frame
  const config = CANVAS_CONFIG.headerFrame;
  headerFrame.fills = [{ type: 'SOLID', color: config.backgroundColor }];

  // 设置圆角
  setFrameBorderRadius(headerFrame);

  // 设置布局属性
  headerFrame.layoutMode = "HORIZONTAL";
  headerFrame.primaryAxisSizingMode = "AUTO";
  headerFrame.counterAxisSizingMode = "FIXED";
  headerFrame.layoutAlign = "STRETCH"; // 使顶部 Frame 横向填充父容器
  headerFrame.primaryAxisAlignItems = "SPACE_BETWEEN";
  headerFrame.counterAxisAlignItems = "CENTER";
  headerFrame.paddingLeft = config.padding.left;
  headerFrame.paddingRight = config.padding.right;
  headerFrame.paddingTop = config.padding.top;
  headerFrame.paddingBottom = config.padding.bottom;

  // 设置初始尺寸（考虑父容器的内边距）
  const availableWidth = CANVAS_CONFIG.mainFrame.width - 32; // 主 Frame 宽度减去左右内边距
  headerFrame.resize(availableWidth, config.height);

  return headerFrame;
}

// ==================== 创建组件函数（仅创建组件，不负责界面框架部分） ====================

// 创建顶部组件
async function createHeaderComponents(headerFrame) {
  try {
    // 导入组件
    const titleComponent = await figma.importComponentByKeyAsync(COMPONENT_KEYS.title);
    const secondaryButtonComponent = await figma.importComponentByKeyAsync(COMPONENT_KEYS.buttonSecondary);
    const primaryButtonComponent = await figma.importComponentByKeyAsync(COMPONENT_KEYS.buttonPrimary);

    // 创建组件实例
    const titleInstance = titleComponent.createInstance();
    const secondaryButtonInstance = secondaryButtonComponent.createInstance();
    const primaryButtonInstance = primaryButtonComponent.createInstance();

    // 创建按钮组容器
    const buttonGroup = figma.createFrame();
    buttonGroup.name = "Button Group";

    // 设置按钮组容器的圆角
    setFrameBorderRadius(buttonGroup);

    // 配置按钮组布局
    const config = CANVAS_CONFIG.buttonGroup;
    buttonGroup.layoutMode = "HORIZONTAL";
    buttonGroup.primaryAxisSizingMode = "AUTO";
    buttonGroup.counterAxisSizingMode = "AUTO";
    buttonGroup.itemSpacing = config.itemSpacing;
    buttonGroup.counterAxisAlignItems = "CENTER";

    // 将按钮添加到按钮组
    buttonGroup.appendChild(secondaryButtonInstance);
    buttonGroup.appendChild(primaryButtonInstance);

    // 将标题和按钮组添加到顶部 Frame
    headerFrame.appendChild(titleInstance);
    headerFrame.appendChild(buttonGroup);

  } catch (error) {
    figma.notify(`导入组件失败: ${error.message}`, { error: true });
    throw error;
  }
}

// 创建表格组件
async function createTableComponent(mainFrame) {
  try {
    // 导入表格组件
    const tableComponent = await figma.importComponentByKeyAsync(COMPONENT_KEYS.table);
    const tableInstance = tableComponent.createInstance();

    // 设置表格组件的布局属性，使其横向填充父容器
    tableInstance.layoutAlign = "STRETCH"; // 宽度填充父容器
    tableInstance.primaryAxisSizingMode = "AUTO"; // 高度自适应
    tableInstance.counterAxisSizingMode = "AUTO"; // 宽度自适应

    // 将表格添加到主 Frame
    mainFrame.appendChild(tableInstance);

  } catch (error) {
    figma.notify(`导入表格组件失败: ${error.message}`, { error: true });
    throw error;
  }
}

// ==================== 主函数（任务执行函数） ====================

// 主函数：创建数据表格设计
async function createDataTableDesign() {
  try {
    // 设置画布
    const page = figma.currentPage;

    // 1. 创建主 Frame
    const mainFrame = createMainFrame();

    // 2. 创建顶部 Frame
    const headerFrame = createHeaderFrame();

    // 3. 将顶部 Frame 添加到主 Frame（先添加，会显示在下方）
    mainFrame.appendChild(headerFrame);

    // 4. 在顶部 Frame 中插入组件
    await createHeaderComponents(headerFrame);

    // 5. 在主 Frame 中插入表格组件（后添加，会显示在上方）
    await createTableComponent(mainFrame);

    // 确保主 Frame 保持固定尺寸
    const config = CANVAS_CONFIG.mainFrame;
    mainFrame.resize(config.width, config.height);

    // 选中创建的框架并聚焦到中心
    figma.currentPage.selection = [mainFrame];

    // 确保设计显示在视窗中心
    const centerX = figma.viewport.center.x;
    const centerY = figma.viewport.center.y;
    figma.viewport.center = { x: centerX, y: centerY };
    figma.viewport.zoom = 1;

    figma.notify("数据表格设计已创建完成！");

  } catch (error) {
    figma.notify(`创建失败: ${error.message}`, { error: true });
  }
}

// UI 界面
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-design') {
    await createDataTableDesign();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
