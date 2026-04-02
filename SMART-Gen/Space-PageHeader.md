
# bizComponents
| id                  | type          | title               | tags                                    | updated     |
|---------------------|---------------|---------------------|-----------------------------------------|-------------|
| bizcomp.Page Header | biz-component | Space / Page Header | uikit, ei | 2025-10-23  |

# bizComponent
| id                  | title               | figma_key |
|---------------------|---------------------|-----------|
| bizcomp.Page Header | Space / Page Header | -         |


# Definition
PageHeader 位于页面最上方，用于**明确页面主题并提供页级操作入口**。它让用户迅速判断“当前在什么页面、可以做什么”。必含 **Page Title**；可选区域：**Breadcrumb**（层级定位）、**MetaInfo**（状态/负责人/时间等）、**Tab**（同层内容切换）、**ButtonGroup/Subtitle**（属于 Title 内部的可选元素）。不承载表单或行级操作；宽度随所在页面容器；不单独定义 Layout。

# Slots
| pattern_id | slot       | component_ref                              | figma_key                                   | notes                              |
|------------|------------|---------------------------------------------|----------------------------------------------|------------------------------------|
| PageHeader | breadcrumb | Breadcrumb                                  | ed4ce45ce862f54e11ec489727755900cc202fc8    | 组件库组件；≤3 层                  |
| PageHeader | title      | Space / Page header / Page title            | 61b3b2538b287bbd32daa4d1bcef642541334729     | 必选；可含 Subtitle / ButtonGroup   |
| PageHeader | meta       | Space / Page header / MetaInfo              | 7a76b022563a1e36be1182db8baf6702911bfc34     | 可选；对象元信息                   |
| PageHeader | tab        | Tabs                                        | f31fadde71d2db5ecf8ff0cbedc5bde13f48f1e6    | 可选；2–7 个                       |

# VariantDimensions
| pattern_id | dimension   | options                      | guidance                    |
|------------|-------------|------------------------------|-----------------------------|
| PageHeader | level       | Basic, Standard, Advanced    | 信息密度/结构层级           |
| PageHeader | breadcrumbs | True, False                  | 有层级导航则 True           |
| PageHeader | meta        | True, False                  | 需展示对象元信息则 True     |
| PageHeader | tab         | True, False                  | 同层内容切换；2–7 个        |
| PageHeader | alert       | '-'                          | 当前均为 '-'                |

# Variants
variant_id 命名规范：命名目的：把**选择器**编码成稳定、可排序、可比较的键。

格式：

`<prefix>.<lvl>.<k1>=<v1>.<k2>=<v2>...`

约定：

1.  prefix：`PH`（组件固定前缀，PageHeader=PH）。
    
2.  lvl：`b|s|a` 映射 Level=`Basic|Standard|Advanced`。
    
3.  轴顺序：固定为 `bc`(Breadcrumbs) → `mi`(Meta Info) → `tab`(Tab) → `al`(Alert)。
    
4.  布尔值：`False=0`，`True=1`。
    
5.  字符串值：小写去空格；特殊字符用短横线 `-`；保留 `'-'` 原义。
    
6.  仅列入**有定义的轴**；未给出的轴用组件默认值后再编码。
    
7.  全值表：
    
    -   Level → `b|s|a`
        
    -   Breadcrumbs → `0|1`
        
    -   Meta Info → `0|1`
        
    -   Tab → `0|1`
        
    -   Alert → `-|0|1|2`（若只用默认 `-`，仍写 `al=-`）
        

缩写表：

-   `bc` = Breadcrumbs
    
-   `mi` = Meta Info
    
-   `tab` = Tab
    
-   `al` = Alert


| variant_id           | dimension_values                                      | figma_key                                   |
|----------------------|-------------------------------------------------------|----------------------------------------------|
| PH.b.bc=0.mi=0.tab=0 | level=Basic,breadcrumbs=False,meta=False,tab=False   | 522fe57a64957d7feb51c5dca23b004d352e717e     |
| PH.b.bc=0.mi=1.tab=0 | level=Basic,breadcrumbs=False,meta=True,tab=False    | 58bddc92de581d0dc8d762892e1daa16e0bc4933     |
| PH.b.bc=1.mi=0.tab=0 | level=Basic,breadcrumbs=True,meta=False,tab=False    | 4f9406dc44c4e6bcfd7cd3fcc72b5182df7d43cf     |
| PH.b.bc=1.mi=0.tab=1 | level=Basic,breadcrumbs=True,meta=False,tab=True     | 5ee1ba3bf0b044ffbbe86ad31bdaf86bb7dd30ef     |
| PH.b.bc=1.mi=1.tab=1 | level=Basic,breadcrumbs=True,meta=True,tab=True      | f560d3bb10647ce4a047b24377139c1db84f626a     |
| PH.s.bc=0.mi=0.tab=1 | level=Standard,breadcrumbs=False,meta=False,tab=True | 04471585af44298e44a216c63a866472a7a1e073     |
| PH.s.bc=0.mi=1.tab=0 | level=Standard,breadcrumbs=False,meta=True,tab=False | 01f5b945ce79dfb7c2dd5ce530ce6f7e3a4cf959     |
| PH.s.bc=1.mi=0.tab=0 | level=Standard,breadcrumbs=True,meta=False,tab=False | d530fb3bb5730886d28f4ada731269dd6ae51746     |
| PH.s.bc=1.mi=0.tab=1 | level=Standard,breadcrumbs=True,meta=False,tab=True  | 832ef0ca0f7c62d4f27259dddf317a9c4b4ca5f7     |
| PH.s.bc=1.mi=1.tab=0 | level=Standard,breadcrumbs=True,meta=True,tab=False  | edb01aafdbf6fcbf6be112c207fd48b87ec03c1c     |
| PH.s.bc=1.mi=1.tab=1 | level=Standard,breadcrumbs=True,meta=True,tab=True   | 603cbf843638c45d7e59a17c8e7c190bb9d0b0c2     |
| PH.s.bc=1.mi=1.tab=1 | level=Standard,breadcrumbs=True,meta=True,tab=True   | f6559213a507d63c72051d47cbb2d23a75703e1e     |
| PH.s.bc=1.mi=1.tab=1 | level=Standard,breadcrumbs=True,meta=True,tab=True   | dca86c019301861cb391d8d2e28ce904e4848658     |
| PH.a.bc=0.mi=0.tab=1 | level=Advanced,breadcrumbs=False,meta=False,tab=True | 9c277a5ec503d13e151f76a1fbbc7060c5e6d820     |
| PH.a.bc=0.mi=1.tab=1 | level=Advanced,breadcrumbs=False,meta=True,tab=True  | 14375cd4194aea8b47ad26e81c501f929e8a7806     |

# Constraints
- 必含 Page Title；不放表单或行级操作。  
- Breadcrumb ≤3 层；Tab 建议 2–7 个；Subtitle 不与 Tab 同行。  
- MetaInfo ≤2 行；避免高度抖动。  
- ButtonGroup：主按钮 ≤1，次要 ≤2，其余收纳到 More。

# BestPractices
✅ 关键信息在 Title，次要信息放 Meta。  
✅ 列表页可用最简变体（仅 Title）。  
❌ 在页头堆叠长段说明。  
❌ 把批量或行级操作放入页头。

# Keywords
Page Header, 页头, 标题, 面包屑, 元信息, 标签页, 操作区, Tabs
