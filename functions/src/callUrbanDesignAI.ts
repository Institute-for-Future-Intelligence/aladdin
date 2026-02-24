/*
 * @Copyright 2025-2026. Institute for Future Intelligence, Inc.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI, { AzureOpenAI } from 'openai';

const RULES = `
你是一个城市布局生成器。根据用户描述的城市风格，生成完整的城市数据。

### 坐标系
- 中心点：[0, 0]
- 范围：x, y ∈ [-1000, 1000]
- 方向：x正向东，y正向北
- 单位：米


### 数据结构

{
  "world": {
    "date": string,
    "address": string,
    "latitude": number,
    "longitude": number,
  },
  "terrain": {
    "sea": {
      "vertices": [[x, y], ...]
    },
    "land": {
      "vertices": [[x, y], ...]
    }
  },
  "city": {
    "roads": {
      "nodes": [
        { "id": string, "position": [x, y] }
      ],
      "edges": [
        { "id": string, "from": string, "to": string, "level": 1 | 2, "points?": [[x, y], ...] }
      ]
    },
    "rivers": [
      { "vertices": [[x, y], ...] }
    ],
    "ponds": [
      { "vertices": [[x, y], ...] }
    ],
    "parks": [
      { "vertices": [[x, y], ...] }
    ],
    "landmarks": [
      { "center": [x, y], "size": [宽, 深, 高], "rotation": number }
    ],
    "zones": [
      {
        "boundary": [[x, y], ...],
        "length": [min, max],
        "width": [min, max],
        "height": [min, max],
        "coverage": number,
        "layout": "grid" | "perimeter" | "cluster"
      }
    ],
  },
  "thinking": string
}

### 字段说明

## Location
If not specified, the default address is New York City, USA.
  - address
  - latitude and longitude

## Date and time
  - a string in a format MM/dd/yyyy, hh:mm:ss a. If not specified, set the default date and time to 06/22/2025, 02:00:00 PM

## terrain
  - 海洋只包含一个端点属性，用数组表示
  - 将整个范围分为海洋和陆地两个部分，且海洋和陆地要填满所有范围。所有城市和道路都必须建立在陆地上。
  - 如果城市没有海洋，则用陆地填满整个范围，海洋端点返回空数组。
  - 海洋范围不能太大，默认小于整个范围的1/3

## roads
- nodes: 道路交叉点和端点
- edges: 道路段
  - id: 边唯一标识
  - from: 起点节点 id
  - to: 终点节点 id
  - level 1 = 主干道
  - level 2 = 支路
  - points = 曲线中间点（可选，不含首尾）

## rivers
- 狭长多边形，可穿越城市
- 无河流时返回空数组

## ponds
- 封闭多边形，默认应该包含在park范围内
- 没有时返回空数组

## parks
- 封闭多边形，数量建议 2-5 个
- 不与河流重叠

## landmarks
- 特殊建筑：摩天大楼、纪念碑等
- 位置避免对称排列
- rotation 为弧度
- 数量建议5-10个

## zones
- boundary: 边界多边形，与道路对齐
- length/width/height: 建筑尺寸范围
- coverage: 建筑覆盖率 0-1
- layout:
  - grid = 网格排列
  - perimeter = 沿边缘，中间留空
  - cluster = 随机散落

## thinking
- 英文记录生成思路

### 生成规则

## 道路
- 主干道构成骨架
- 支路填充，连接主干道
- 交叉处必须有节点
- edge 的 from/to 必须引用已有节点

## 区域
- 根据用户描述或者城市风格将城市划分成不同区域
- 区域之间不重叠、不相交
- 每个区域大小没有限制，区域数量不要过多，但是总面积覆盖城市90%以上
- 区域由道路划分
- 建筑颜色以神色为主，不要太鲜艳

### 城市案例
- 曼哈顿：河流应该是南北走向，位置应该在城市的东西两侧。应该包含broad way和中央公园
- 巴黎：河流不要穿过正中心，应该偏离中心

### 输出要求(特别重要)
只返回纯 JSON，禁止markdown代码块！直接以 '{' 开头!!!!!
`;

export const callUrbanDesignOpenAI = async (
  apiKey: string | undefined,
  inputMessage: [],
  fromBrowser = false,
  reasoningEffort: string,
) => {
  const modelName = 'o4-mini';
  // const modelName = 'gpt-5-mini';

  const options = {
    apiKey,
    deployment: modelName,
    apiVersion: '2024-12-01-preview',
    endpoint: 'https://ifi-aims-genai.services.ai.azure.com/',
    dangerouslyAllowBrowser: fromBrowser,
    reasoning_effort: reasoningEffort,
  };

  const client = new AzureOpenAI(options);

  const response = await client.chat.completions.create({
    messages: [{ role: 'system', content: RULES }, ...inputMessage],
    reasoning_effort: reasoningEffort as OpenAI.ReasoningEffort,
    max_completion_tokens: 100000,
    model: modelName,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'UrbanDesign',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            thinking: {
              type: 'string',
            },
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
            city: {
              type: 'object',
              properties: {
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
                    nodes: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['id', 'position'],
                        additionalProperties: false,
                        properties: {
                          id: { type: 'string' },
                          position: { type: 'array', items: { type: 'number' } },
                        },
                      },
                    },
                    edges: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['id', 'from', 'to', 'level', 'points'],
                        additionalProperties: false,
                        properties: {
                          id: { type: 'string' },
                          from: { type: 'string' },
                          to: { type: 'string' },
                          level: { type: 'string', enum: ['1', '2'] },
                          points: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
                        },
                      },
                    },
                  },
                  required: ['nodes', 'edges'],
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
                zones: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['boundary', 'length', 'width', 'height', 'coverage', 'layout', 'color'],
                    additionalProperties: false,
                    properties: {
                      boundary: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
                      length: { type: 'array', items: { type: 'number' } },
                      width: { type: 'array', items: { type: 'number' } },
                      height: { type: 'array', items: { type: 'number' } },
                      layout: { type: 'string', enum: ['grid', 'perimeter', 'cluster'] },
                      coverage: { type: 'number' },
                      color: { type: 'string' },
                    },
                  },
                },
                landmarks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['center', 'size', 'rotation'],
                    additionalProperties: false,
                    properties: {
                      center: { type: 'array', items: { type: 'number' } },
                      size: { type: 'array', items: { type: 'number' } },
                      rotation: { type: 'number' },
                    },
                  },
                },
              },
              required: ['roads', 'parks', 'rivers', 'landmarks', 'zones'],
              additionalProperties: false,
            },
            terrain: {
              type: 'object',
              properties: {
                land: {
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
                sea: {
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
              },
              required: ['land', 'sea'],
              additionalProperties: false,
            },
          },
          required: ['city', 'thinking', 'world'],
          additionalProperties: false,
        },
      },
    },
  });
  return response;
};

export const callUrbanDesignClaudeAI = async (
  apiKey: string | undefined,
  inputMessage: [],
  fromBrowser = false,
  aIModel = 'claude-sonnet-4-5',
) => {
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: fromBrowser });

  const res = await anthropic.beta.messages.create({
    // model: 'claude-opus-4-5',
    // model: 'claude-sonnet-4-5',
    model: aIModel,
    max_tokens: 10000, // require streaming API if this is large.
    system: RULES,
    messages: [...inputMessage],
    // betas: ['structured-outputs-2025-11-13'],
    // output_format: {
    //   type: 'json_schema',
    //   schema: {
    //     type: 'object',
    //     properties: {
    //       thinking: {
    //         type: 'string',
    //       },
    //       world: {
    //         type: 'object',
    //         properties: {
    //           date: { type: 'string' },
    //           address: { type: 'string' },
    //           latitude: { type: 'number' },
    //           longitude: { type: 'number' },
    //         },
    //         required: ['date', 'address', 'latitude', 'longitude'],
    //         additionalProperties: false,
    //       },
    //       city: {
    //         type: 'object',
    //         properties: {
    //           rivers: {
    //             type: 'array',
    //             items: {
    //               type: 'object',
    //               properties: {
    //                 vertices: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
    //               },
    //               required: ['vertices'],
    //               additionalProperties: false,
    //             },
    //           },
    //           roads: {
    //             type: 'object',
    //             properties: {
    //               nodes: {
    //                 type: 'array',
    //                 items: {
    //                   type: 'object',
    //                   required: ['id', 'position'],
    //                   additionalProperties: false,
    //                   properties: {
    //                     id: { type: 'string' },
    //                     position: { type: 'array', items: { type: 'number' } },
    //                   },
    //                 },
    //               },
    //               edges: {
    //                 type: 'array',
    //                 items: {
    //                   type: 'object',
    //                   required: ['id', 'from', 'to', 'level', 'points'],
    //                   additionalProperties: false,
    //                   properties: {
    //                     id: { type: 'string' },
    //                     from: { type: 'string' },
    //                     to: { type: 'string' },
    //                     level: { type: 'string', enum: ['1', '2'] },
    //                     points: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
    //                   },
    //                 },
    //               },
    //             },
    //             required: ['nodes', 'edges'],
    //             additionalProperties: false,
    //           },
    //           parks: {
    //             type: 'array',
    //             items: {
    //               type: 'object',
    //               properties: {
    //                 vertices: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
    //               },
    //               required: ['vertices'],
    //               additionalProperties: false,
    //             },
    //           },
    //           zones: {
    //             type: 'array',
    //             items: {
    //               type: 'object',
    //               required: ['boundary', 'length', 'width', 'height', 'coverage', 'layout', 'color'],
    //               additionalProperties: false,
    //               properties: {
    //                 boundary: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
    //                 length: { type: 'array', items: { type: 'number' } },
    //                 width: { type: 'array', items: { type: 'number' } },
    //                 height: { type: 'array', items: { type: 'number' } },
    //                 layout: { type: 'string', enum: ['grid', 'perimeter', 'cluster'] },
    //                 coverage: { type: 'number' },
    //                 color: { type: 'string' },
    //               },
    //             },
    //           },
    //           landmarks: {
    //             type: 'array',
    //             items: {
    //               type: 'object',
    //               required: ['center', 'size', 'rotation'],
    //               additionalProperties: false,
    //               properties: {
    //                 center: { type: 'array', items: { type: 'number' } },
    //                 size: { type: 'array', items: { type: 'number' } },
    //                 rotation: { type: 'number' },
    //               },
    //             },
    //           },
    //         },
    //         required: ['roads', 'parks', 'rivers', 'landmarks', 'zones'],
    //         additionalProperties: false,
    //       },
    //       terrain: {
    //         type: 'object',
    //         properties: {
    //           land: {
    //             type: 'array',
    //             items: {
    //               type: 'object',
    //               properties: {
    //                 vertices: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
    //               },
    //               required: ['vertices'],
    //               additionalProperties: false,
    //             },
    //           },
    //           sea: {
    //             type: 'array',
    //             items: {
    //               type: 'object',
    //               properties: {
    //                 vertices: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
    //               },
    //               required: ['vertices'],
    //               additionalProperties: false,
    //             },
    //           },
    //         },
    //         required: ['land', 'sea'],
    //         additionalProperties: false,
    //       },
    //     },
    //     required: ['city', 'thinking', 'world', 'terrain'],
    //     additionalProperties: false,
    //   },
    // },
  });
  return res;
};
