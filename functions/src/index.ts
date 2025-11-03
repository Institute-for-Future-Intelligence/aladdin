/*
 * @Copyright 2025. Institute for Future Intelligence, Inc.
 */

import { onCall } from 'firebase-functions/v2/https';
import { callBuildingAI } from './callBuildingAI';

exports.callAzure = onCall(
  { secrets: ['AZURE_OPENAI_API_KEY'], timeoutSeconds: 300, region: 'us-east4' },
  async (req) => {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const prompt = req.data.text;
    const reasoningEffort = req.data.reasoningEffort ?? 'medium';
    try {
      const response = await callBuildingAI(apiKey, prompt, false, reasoningEffort);
      console.log('Prompt:', prompt);
      console.log('Reasoning Effort:', reasoningEffort);
      console.log('Returned:', response.choices[0].message.content);
      return { text: response.choices[0].message.content };
    } catch (e) {
      return { error: e };
    }
  },
);
