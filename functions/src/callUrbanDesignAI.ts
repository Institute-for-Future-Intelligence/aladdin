/*
 * @Copyright 2025-2026. Institute for Future Intelligence, Inc.
 */

import Anthropic from '@anthropic-ai/sdk';

// const RULES = `Role
// You are an expert in urban design, computational geometry, and procedural layout generation.

// Task
// Generate a procedural layout for an urban area using cuboids to represent buildings, and foundations for green spaces or other non-building elements.

// Input
// You will receive a prompt describing the urban design requirements and constraints.

// Core Requirements

// The total site size is about 1000 m × 1000 m unless overridden by user input.

// Each building is represented by a cuboid.

// Buildings must not overlap.

// Use a 2D ground plane (x, y) for layout; height extends in the z-direction.

// Coordinate System Rules

// Origin (0, 0, 0) is at the center of the site.

// x corresponds to the east-west direction

// y corresponds to the north-south direction

// z is vertical;

// Prefer realistic urban proportions.

// Keep spacing reasonable for streets or open areas.

// `;

const RULES = `
你是一个城市布局生成器。根据用户描述的城市风格，生成包含道路网络和建筑布局的完整城市数据。

城市包括河流（可省略），道路，公园，地标建筑，和区域。

### Location
If not specified, the default address is New York City, USA.
  - address
  - latitude and longitude

### Date and time
  - a string in a format MM/dd/yyyy, hh:mm:ss a. If not specified, set the default date and time to 06/22/2025, 12:00:00 PM

### 通用规则
- 城市范围大约为：1500 x 2000， 不需要很精确
- 城市中心落在原点[0, 0]

### 河流规则
- 根据用户描述或者城市风格来确定是否需要河流，如果没有河流，返回空数组
- vertices：河流边界多边形顶点数组 [[x1, y1], [x2, y2], ...]
- 河流是封闭多边形，首尾顶点会自动连接
- 河流宽度通过多边形形状表达（两岸的点）
- 河流应自然弯曲，避免生硬的直线
- 河流两岸应有公园
- 河流两岸应有道路连接
- 河流可以有支流，支流也用独立的多边形表示

### 道路规则
- 道路代表城市路网的主干道
- 道路不要过于复杂
- 返回值为坐标点数组
- 2个点 = 直线，3+个点 = 折线/曲线
- 闭合环形道路首尾坐标相同
- 圆形用8-12个点近似

### 公园规则
- vertices：公园边界多边形顶点数组 [[x1, y1], [x2, y2], ...]
- 顶点按顺序连接形成公园边界
- 可以是矩形（4个点）或任意多边形
- 公园不要和地标以及建筑重叠

### 建筑区域规则
- boundary：区域边界多边形
- 区域可以很大，跨越多条道路
- 相邻且参数相同的区域并为一个大区域
- 字段说明：
  - size：建筑尺寸 [宽, 深]
  - height：高度范围 [最小, 最大]
  - spacing：建筑间距
  - coverage：覆盖率 0-1
  - layout："fill"(填充) | "perimeter"(周边) | "scatter"(分散)
- 区域只需写与默认值不同的字段
- 区域需要覆盖城市大部分面积
- 区域不要相互重叠和相交

### 地标规则
- 格式：[{center: [x, y], size: [宽, 深, 高度], rotation: 旋转角度}]
- 用于摩天大楼、纪念碑等特殊建筑
- 地标建筑位置不要相互对称排列！！！

### 优化原则
1. 区域数量建议5-15个
2. 参数相似的相邻区域合并为大区域
3. 只在需要不同参数时才拆分区域
4. 公园数量建议2-5个

### 输出格式

严格输出以下JSON结构，不要添加任何解释文字：

{
  "city": {
    "world": {
      "date": <date>,
       "address": <address>,
       "latitude": <lat>,
       "longitude": <lng>,
      },
    },

    "bounds": [1500, 2000],

    "roads": {
      "width": <道路宽度>,
      "lines": [
        [[x1, y1], [x2, y2]],
        [[x1, y1], [x2, y2], [x3, y3], ...]
      ]
    },

    "parks": [
      {"vertices": [[x1, y1], [x2, y2], ...]}
    ],

    "buildings": {
      "defaults": {
        "size": [<宽>, <深>],
        "height": [<最小高度>, <最大高度>],
        "spacing": <间距>,
        "coverage": <覆盖率0-1>,
        "layout": "<布局模式>"
      },
      "blocks": [
        {
          "boundary": [[x1, y1], [x2, y2], ...],
          "height": [<最小>, <最大>],
          "coverage": <覆盖率>,
          "layout": "<布局模式>"
        }
      ],
      "landmarks": [
        {
          "center" : [x, y],
          "size": [宽, 深, 高度],
          "rotation": 旋转角度
        }
      ]
    }
  }
}

`;

// export const callUrbanDesignOpenAI = async (
//   apiKey: string | undefined,
//   inputMessage: [],
//   fromBrowser = false,
//   reasoningEffort: string,
// ) => {
//   const options = {
//     endpoint,
//     apiKey,
//     deployment,
//     apiVersion,
//     dangerouslyAllowBrowser: fromBrowser,
//     reasoning_effort: reasoningEffort,
//   };

//   const client = new AzureOpenAI(options);

//   const response = await client.chat.completions.create({
//     messages: [{ role: 'system', content: RULES }, ...inputMessage],
//     reasoning_effort: reasoningEffort as OpenAI.ReasoningEffort,
//     max_completion_tokens: 100000,
//     model: modelName,
//     response_format: {
//       type: 'json_schema',
//       json_schema: {
//         name: 'UrbanDesignGenerator',
//         strict: true,
//         schema: {
//           type: 'object',
//           properties: {
//             thinking: {
//               type: 'string',
//             },
//             elements: {
//               type: 'array',
//               items: {
//                 type: 'object',
//                 anyOf: [
//                   {
//                     type: 'object',
//                     properties: {
//                       type: { type: 'string', enum: ['Foundation'] },
//                       center: { type: 'array', items: { type: 'number' } },
//                       size: { type: 'array', items: { type: 'number' } },
//                       rotation: { type: 'number' },
//                     },
//                     required: ['type', 'center', 'size', 'rotation'],
//                     additionalProperties: false,
//                   },
//                   {
//                     type: 'object',
//                     properties: {
//                       type: { type: 'string', enum: ['Cuboid'] },
//                       center: { type: 'array', items: { type: 'number' } },
//                       size: { type: 'array', items: { type: 'number' } },
//                       rotation: { type: 'number' },
//                     },
//                     required: ['type', 'center', 'size', 'rotation'],
//                     additionalProperties: false,
//                   },
//                 ],
//               },
//             },
//           },
//           required: ['elements', 'thinking'],
//           additionalProperties: false,
//         },
//       },
//     },
//   });
//   return response;
// };

export const callUrbanDesignClaudeAI = async (apiKey: string | undefined, inputMessage: [], fromBrowser = false) => {
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: fromBrowser });

  const res = await anthropic.beta.messages.create({
    // temperature: 0,
    model: 'claude-opus-4-5',
    max_tokens: 10000, // require streaming API if this is large.
    system: RULES,
    messages: [...inputMessage],
    betas: ['structured-outputs-2025-11-13'],
    // thinking: {
    //   type: 'enabled',
    //   budget_tokens: 2000,
    // },
    output_format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          thinking: {
            type: 'string',
          },
          city: {
            type: 'object',
            properties: {
              world: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  address: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                },
                required: ['date', 'address', 'latitude', 'longitude'],
                additionalProperties: false,
              },
              rivers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    vertices: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
                  },
                  required: ['vertices'],
                  additionalProperties: false,
                },
              },
              roads: {
                type: 'object',
                properties: {
                  width: { type: 'number' },
                  lines: {
                    type: 'array',
                    items: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
                  },
                },
                required: ['width', 'lines'],
                additionalProperties: false,
              },
              parks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    vertices: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
                  },
                  required: ['vertices'],
                  additionalProperties: false,
                },
              },
              buildings: {
                type: 'object',
                properties: {
                  defaults: {
                    type: 'object',
                    properties: {
                      size: { type: 'array', items: { type: 'number' } },
                      height: { type: 'array', items: { type: 'number' } },
                      spacing: { type: 'number' },
                      layout: { type: 'string', enum: ['fill', 'perimeter', 'scatter'] },
                      coverage: { type: 'number' },
                    },
                    required: ['size', 'height', 'spacing', 'layout', 'coverage'],
                    additionalProperties: false,
                  },
                  blocks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        boundary: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
                        size: { type: 'array', items: { type: 'number' } },
                        height: { type: 'array', items: { type: 'number' } },
                        spacing: { type: 'number' },
                        layout: { type: 'string', enum: ['fill', 'perimeter', 'scatter'] },
                        coverage: { type: 'number' },
                      },
                      required: ['boundary'],
                      additionalProperties: false,
                    },
                  },
                  landmarks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        center: { type: 'array', items: { type: 'number' } },
                        size: { type: 'array', items: { type: 'number' } },
                        rotation: { type: 'number' },
                      },
                      required: ['center', 'size', 'rotation'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['defaults', 'blocks', 'landmarks'],
                additionalProperties: false,
              },
            },
            required: ['roads', 'buildings', 'parks', 'rivers', 'world'],
            additionalProperties: false,
          },
        },
        required: ['city', 'thinking'],
        additionalProperties: false,
      },
    },
  });
  return res;
};
