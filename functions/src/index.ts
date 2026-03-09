/*
 * @Copyright 2025-2026. Institute for Future Intelligence, Inc.
 */

import { onCall } from 'firebase-functions/v2/https';
import { callBuildingAzureAI, callBuildingClaudeAI, callBuildingGeminiAI, callBuildingOpenAI } from './callBuildingAI';
import {
  callSolarPowerTowerClaudeAI,
  callSolarPowerTowerOpenAI,
  callSolarPowerTowerAzureAI,
} from './callSolarPowerTowerAI';
import {
  callUrbanDesignClaudeAI,
  callUrbanDesignOpenAI,
  callUrbanDesignAzureAI,
  callUrbanDesignGeminiAI,
} from './callUrbanDesignAI';
import { AI_MODEL_NAMES } from './constants';

exports.callAI = onCall(
  {
    secrets: ['AZURE_OPENAI_API_KEY', 'CLAUDE_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY'],
    timeoutSeconds: 300,
    region: 'us-east4',
  },
  async (req) => {
    const prompt = req.data.text;
    const type = req.data.type ?? 'building';
    const aiModel = req.data.aiModel ?? AI_MODEL_NAMES['OpenAI GPT-5.2'];
    console.log('Prompt:', prompt);
    try {
      if (aiModel === AI_MODEL_NAMES['Azure OpenAI o4-mini']) {
        const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
        const reasoningEffort = req.data.reasoningEffort ?? 'medium';
        console.log('Reasoning Effort:', reasoningEffort);
        if (type === 'building') {
          console.log('calling Azure OpenAI...');
          const response = await callBuildingAzureAI(azureApiKey, prompt, false, reasoningEffort);
          console.log('Returned:', response.choices[0].message.content);
          return { text: response.choices[0].message.content };
        } else if (type === 'solar power tower') {
          console.log('calling Azure OpenAI...');
          const response = await callSolarPowerTowerAzureAI(azureApiKey, prompt, false, reasoningEffort);
          console.log('Returned:', response.choices[0].message.content);
          return { text: response.choices[0].message.content };
        } else if (type === 'urban') {
          console.log('calling Azure OpenAI...');
          const response = await callUrbanDesignAzureAI(azureApiKey, prompt, false, reasoningEffort);
          console.log('Returned:', response.choices[0].message.content);
          return { text: response.choices[0].message.content };
        }
      } else if (aiModel === AI_MODEL_NAMES['OpenAI GPT-5.2']) {
        const openApiKey = process.env.OPENAI_API_KEY;
        const reasoningEffort = req.data.reasoningEffort ?? 'medium';
        console.log('Reasoning Effort:', reasoningEffort);
        if (type === 'building') {
          console.log('calling OpenAI GPT-5.2...');
          const response = await callBuildingOpenAI(openApiKey, prompt, false, reasoningEffort);
          console.log('Returned:', response.output_text);
          return { text: response.output_text };
        } else if (type === 'solar power tower') {
          console.log('calling OpenAI GPT-5.2...');
          const response = await callSolarPowerTowerOpenAI(openApiKey, prompt, false, reasoningEffort);
          console.log('Returned:', response.output_text);
          return { text: response.output_text };
        } else if (type === 'urban') {
          console.log('calling OpenAI GPT-5.2...');
          const response = await callUrbanDesignOpenAI(openApiKey, prompt, false, reasoningEffort);
          console.log('Returned:', response.output_text);
          return { text: response.output_text };
        }
      } else if (aiModel === AI_MODEL_NAMES['Claude Opus-4.5']) {
        const claudeApiKey = process.env.CLAUDE_API_KEY;
        if (type === 'building') {
          console.log('calling Claude Opus-4.5...');
          const response = await callBuildingClaudeAI(claudeApiKey, prompt, false);
          console.log('Returned:', (response.content[0] as any).text);
          return { text: (response.content[0] as any).text };
        } else if (type === 'solar power tower') {
          console.log('calling Claude Opus-4.5...');
          const response = await callSolarPowerTowerClaudeAI(claudeApiKey, prompt, false);
          console.log('Returned:', (response.content[0] as any).text);
          return { text: (response.content[0] as any).text };
        }
      } else if (aiModel === AI_MODEL_NAMES['Claude Sonnet-4.5']) {
        const claudeApiKey = process.env.CLAUDE_API_KEY;
        if (type === 'urban') {
          console.log('calling Claude Sonnet-4.5...');
          const response = await callUrbanDesignClaudeAI(claudeApiKey, prompt, false);
          console.log('Returned:', (response.content[0] as any).text);
          return { text: (response.content[0] as any).text };
        }
      } else if (aiModel === AI_MODEL_NAMES['Gemini 2.5-Pro']) {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const reasoningEffort = req.data.reasoningEffort ?? 'medium';
        if (type === 'building') {
          console.log('calling Gemini 2.5-Pro...');
          const response = await callBuildingGeminiAI(geminiApiKey, prompt, reasoningEffort);
          const text = response.text;
          console.log('Returned:', text);
          return { text };
        } else if (type === 'urban') {
          console.log('calling Gemini 2.5-Pro...');
          const response = await callUrbanDesignGeminiAI(geminiApiKey, prompt, reasoningEffort);
          const text = response.text;
          console.log('Returned:', text);
          return { text };
        }
      }
      return null;
    } catch (e) {
      return { error: e };
    }
  },
);
