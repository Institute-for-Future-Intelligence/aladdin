/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { onCall } from 'firebase-functions/v2/https';
import { callBuildingAI } from './callBuildingAI';
import { callSolarPowerTowerOpenAI } from './callSolarPowerTowerAI';

exports.callAzure = onCall(
  { secrets: ['AZURE_OPENAI_API_KEY'], timeoutSeconds: 300, region: 'us-east4' },
  async (req) => {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const prompt = req.data.text;
    const type = req.data.type ?? 'building';
    const reasoningEffort = req.data.reasoningEffort ?? 'medium';
    try {
      if (type === 'building') {
        const response = await callBuildingAI(apiKey, prompt, false, reasoningEffort);
        console.log('Prompt:', prompt);
        console.log('Reasoning Effort:', reasoningEffort);
        console.log('Returned:', response.choices[0].message.content);
        return { text: response.choices[0].message.content };
      } else if (type === 'solar power tower') {
        const response = await callSolarPowerTowerOpenAI(apiKey, prompt, false, reasoningEffort);
        console.log('Prompt:', prompt);
        console.log('Reasoning Effort:', reasoningEffort);
        console.log('Returned:', response.choices[0].message.content);
        return { text: response.choices[0].message.content };
      }
      return null;
    } catch (e) {
      return { error: e };
    }
  },
);
