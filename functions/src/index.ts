/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { onCall } from 'firebase-functions/v2/https';
import { callBuildingAI } from './callBuildingAI';
import { AI_MODELS_NAME, callSolarPowerTowerClaudeAI, callSolarPowerTowerOpenAI } from './callSolarPowerTowerAI';

exports.callAI = onCall(
  { secrets: ['AZURE_OPENAI_API_KEY', 'CLAUDE_API_KEY'], timeoutSeconds: 300, region: 'us-east4' },
  async (req) => {
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const prompt = req.data.text;
    const type = req.data.type ?? 'building';
    const reasoningEffort = req.data.reasoningEffort ?? 'medium';
    const aIModel = req.data.aIModel ?? AI_MODELS_NAME['OpenAI o4-mini'];
    try {
      if (type === 'building') {
        const response = await callBuildingAI(azureApiKey, prompt, false, reasoningEffort);
        console.log('Prompt:', prompt);
        console.log('Reasoning Effort:', reasoningEffort);
        console.log('Returned:', response.choices[0].message.content);
        return { text: response.choices[0].message.content };
      } else if (type === 'solar power tower') {
        if (aIModel === AI_MODELS_NAME['OpenAI o4-mini']) {
          const response = await callSolarPowerTowerOpenAI(azureApiKey, prompt, false, reasoningEffort);
          console.log('Prompt:', prompt);
          console.log('Reasoning Effort:', reasoningEffort);
          console.log('Returned:', response.choices[0].message.content);
          return { text: response.choices[0].message.content };
        } else {
          const claudeApiKey = process.env.CLAUDE_API_KEY;
          const response = await callSolarPowerTowerClaudeAI(claudeApiKey, prompt, false);
          console.log('Prompt:', prompt);
          console.log('Reasoning Effort:', reasoningEffort);
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
