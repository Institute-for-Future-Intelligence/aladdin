/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { onCall } from 'firebase-functions/v2/https';
import { callBuildingAI, callBuildingClaudeAI } from './callBuildingAI';
import { AI_MODELS_NAME, callSolarPowerTowerClaudeAI, callSolarPowerTowerOpenAI } from './callSolarPowerTowerAI';
import { callUrbanDesignClaudeAI } from './callUrbanDesignAI';

exports.callAI = onCall(
  { secrets: ['AZURE_OPENAI_API_KEY', 'CLAUDE_API_KEY'], timeoutSeconds: 300, region: 'us-east4' },
  async (req) => {
    const prompt = req.data.text;
    const type = req.data.type ?? 'building';
    const aIModel = req.data.aIModel ?? AI_MODELS_NAME['OpenAI o4-mini'];
    console.log('Prompt:', prompt);
    try {
      if (aIModel === AI_MODELS_NAME['OpenAI o4-mini']) {
        const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
        const reasoningEffort = req.data.reasoningEffort ?? 'medium';
        console.log('Reasoning Effort:', reasoningEffort);
        if (type === 'building') {
          console.log('calling OpenAI...');
          const response = await callBuildingAI(azureApiKey, prompt, false, reasoningEffort);
          console.log('Returned:', response.choices[0].message.content);
          return { text: response.choices[0].message.content };
        } else if (type === 'solar power tower') {
          console.log('calling OpenAI...');
          const response = await callSolarPowerTowerOpenAI(azureApiKey, prompt, false, reasoningEffort);
          console.log('Returned:', response.choices[0].message.content);
          return { text: response.choices[0].message.content };
        }
      } else if (aIModel === AI_MODELS_NAME['Claude Opus-4.5']) {
        const claudeApiKey = process.env.CLAUDE_API_KEY;
        if (type === 'building') {
          console.log('calling Claude...');
          const response = await callBuildingClaudeAI(claudeApiKey, prompt, false);
          console.log('Returned:', (response.content[0] as any).text);
          return { text: (response.content[0] as any).text };
        } else if (type === 'solar power tower') {
          console.log('calling Claude...');
          const response = await callSolarPowerTowerClaudeAI(claudeApiKey, prompt, false);
          console.log('Returned:', (response.content[0] as any).text);
          return { text: (response.content[0] as any).text };
        } else if (type === 'urban') {
          console.log('calling Claude...');
          const response = await callUrbanDesignClaudeAI(claudeApiKey, prompt, false);
          console.log('Returned:', (response.content[0] as any).text);
          return { text: (response.content[0] as any).text };
        }
      }
      return null;
    } catch (e) {
      return { error: e };
    }
  },
);
