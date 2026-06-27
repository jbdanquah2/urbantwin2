/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 10MB limit for image uploads
app.use(express.json({ limit: '10mb' }));

// Helper to check if Gemini API key is valid
const getGeminiKey = (): string | null => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key === 'undefined') {
    return null;
  }
  return key;
};

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Multimodal Image Analysis
app.post('/api/analyze-image', async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image base64 is required' });
  }

  const apiKey = getGeminiKey();
  if (!apiKey) {
    console.log('[Gemini Mock] Generating mock analysis.');
    // Determine a random realistic mock based on typical upload scenarios
    const mocks = [
      {
        issueType: "pothole",
        severity: "high",
        confidence: "high",
        description: "Hazardous pothole approximately 15cm deep and 40cm wide on the active driving lane.",
        publicSafetyRisk: "High risk of tire blowouts, wheel alignment damage, and hazardous swerving by drivers to avoid the crater.",
        environmentalImpact: "Low. Localized asphalt wear can contribute to sediment run-off during rain.",
        recommendedAction: "Cordon off the lane temporarily and apply high-performance rapid-setting cold-asphalt patch.",
        estimatedRepairUrgency: "24 hours",
        priorityScore: 84,
        affectedInfrastructure: "road",
        suggestedDepartment: "roads department",
        duplicateLikelihood: "low"
      },
      {
        issueType: "flooding",
        severity: "critical",
        confidence: "high",
        description: "Severe storm sewer overflow with deep ponding covering both lanes of traffic and flooding the walkway.",
        publicSafetyRisk: "Critical risk of hydroplaning. Walking path is completely submerged, forcing pedestrians into live vehicle lanes.",
        environmentalImpact: "Medium. Toxic street water and chemical pollutants entering surrounding green zones directly.",
        recommendedAction: "Dispatch emergency drainage truck with vacuum hose to clear high-pressure sewer backup.",
        estimatedRepairUrgency: "immediate",
        priorityScore: 96,
        affectedInfrastructure: "drainage",
        suggestedDepartment: "drainage department",
        duplicateLikelihood: "low"
      },
      {
        issueType: "illegal_dumping",
        severity: "medium",
        confidence: "high",
        description: "Large heap of industrial refuse, mattresses, and plastic crates piled carelessly on the sidewalk edge.",
        publicSafetyRisk: "Moderate trip hazard; encourages vermin/rodent infestation and blocks standard accessibility paths.",
        environmentalImpact: "Chemical seepage from decomposing electronic parts and plastic breaking down into public storm grids.",
        recommendedAction: "Deploy sanitation dump truck to collect and safely dispose of bulky refuse. Review local street camera logs.",
        estimatedRepairUrgency: "48 hours",
        priorityScore: 52,
        affectedInfrastructure: "waste",
        suggestedDepartment: "sanitation department",
        duplicateLikelihood: "low"
      },
      {
        issueType: "broken_streetlight",
        severity: "medium",
        confidence: "high",
        description: "Overhead utility luminaire is completely black during evening hours, leaving the crosswalk shrouded in shadow.",
        publicSafetyRisk: "Increased risk of crime, blind spots, and vehicular collisions with pedestrians navigating the crosswalk.",
        environmentalImpact: "Low.",
        recommendedAction: "Schedule bucket truck dispatch to replace the faulty bulb or repair the solar photo-sensor node.",
        estimatedRepairUrgency: "7 days",
        priorityScore: 61,
        affectedInfrastructure: "lighting",
        suggestedDepartment: "electricity department",
        duplicateLikelihood: "low"
      }
    ];

    const randomMock = mocks[Math.floor(Math.random() * mocks.length)];
    return res.json(randomMock);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || 'image/jpeg'
          }
        },
        `You are an urban infrastructure inspection assistant.
Analyze the uploaded image and return ONLY valid JSON using this schema:

{
  "issueType": "pothole | flooding | blocked_drain | broken_streetlight | illegal_dumping | damaged_road | unsafe_sidewalk | traffic_sign_damage | water_leakage | other",
  "severity": "low | medium | high | critical",
  "confidence": "low | medium | high",
  "description": "short description of the visible civic issue",
  "publicSafetyRisk": "short explanation of risk to pedestrians, vehicles, or residents",
  "environmentalImpact": "short explanation of environmental impact",
  "recommendedAction": "specific action local authorities should take",
  "estimatedRepairUrgency": "e.g. immediate, 24 hours, 48 hours, 7 days, routine maintenance",
  "priorityScore": 0,
  "affectedInfrastructure": "road | drainage | waste | lighting | water | public_safety | other",
  "suggestedDepartment": "roads department | sanitation department | drainage department | electricity department | water department | emergency response | other",
  "duplicateLikelihood": "low | medium | high"
}

Do not include markdown.
Do not include extra text.`
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to analyze image using Gemini', details: error.message });
  }
});

// API: AI City Analyst Chat
app.post('/api/chat-analyst', async (req, res) => {
  const { messages, reports } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const reportsSummary = reports && Array.isArray(reports)
    ? reports.map((r: any) => `- ID: ${r.id}, Type: ${r.issueType}, Severity: ${r.severity}, Status: ${r.status}, Priority: ${r.priorityScore}, Location: ${r.locationName}, Infrastructure: ${r.affectedInfrastructure}`).join('\n')
    : 'No active reports available.';

  const apiKey = getGeminiKey();
  if (!apiKey) {
    console.log('[Gemini Mock] Generating mock chat response.');
    const userQuery = messages[messages.length - 1].text.toLowerCase();

    let answer = "As your AI City Analyst, I have inspected the Urban Twin database. ";
    if (userQuery.includes('fix first') || userQuery.includes('priority') || userQuery.includes('critical')) {
      answer += "\n\nBased on the priority engine, the city should immediately focus on **rep-2 (Flooding on Mission Street)** with a critical priority score of **95/100**, and **rep-1 (Pothole on Market Street)** at **82/100**.\n\nThese represent severe risks to pedestrian safety and transit efficiency. Flooding should take precedence due to potential damage to local businesses and electrical risks.";
    } else if (userQuery.includes('risk') || userQuery.includes('neighborhood') || userQuery.includes('area')) {
      answer += "\n\nThe **Downtown Market St / Mission St corridor** currently presents the highest infrastructure risk coefficient. It has accumulated both critical stormwater flooding and high-severity road pothole filings, which can lead to rapid cascading road failure.";
    } else if (userQuery.includes('summar') || userQuery.includes('incident') || userQuery.includes('today')) {
      answer += `\n\n**City Infrastructure Summary:**\n- **Active Incidents**: ${reports?.length || 5}\n- **Water Infrastructure**: 1 active water leakage (High severity)\n- **Roads**: 1 active deep pothole (High severity)\n- **Drainage**: 1 active main storm sewer blockage (Critical severity)\n- **Waste**: 1 active dumping case (Medium severity)\n- **Resolved**: 1 broken streetlight (Resolved in the last 24 hours)`;
    } else {
      answer += "\n\nTo optimize municipal operations, I recommend dispatching a **vactor truck to Mission Street** for the flooding, and scheduling **asphalt crews to Market Street** tomorrow morning. Road and drainage division scores are currently the most depressed elements of the overall city twin health model.";
    }
    return res.json({ text: answer });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Build chat structure
    const systemInstruction = `You are "Urban Twin AI Analyst", an expert urban planner, smart city coordinator, and maintenance advisor.
You are communicating with municipal city officials.
Your answers should be highly analytical, professional, and practical.
Use the following list of active and past city reports (provided directly from our Digital Twin database) to back up your statements with specific IDs, severities, and locations:

--- CITY REPORTS DATABASE ---
${reportsSummary}
----------------------------

Always refer to specific incidents by ID and location, prioritize critical and high-severity safety hazards, and provide actionable operational recommendations (such as dispatching specific departments or machinery).`;

    const formattedContents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction
      }
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({ error: 'Failed to chat with Gemini', details: error.message });
  }
});

// API: Generate AI City Insights
app.post('/api/insights', async (req, res) => {
  const { reports } = req.body;
  const reportsSummary = reports && Array.isArray(reports)
    ? reports.map((r: any) => `- ${r.issueType}, Severity: ${r.severity}, Status: ${r.status}, Priority: ${r.priorityScore}, Location: ${r.locationName}, Infrastructure: ${r.affectedInfrastructure}`).join('\n')
    : 'No reports.';

  const apiKey = getGeminiKey();
  if (!apiKey) {
    console.log('[Gemini Mock] Generating mock insights.');
    const mockInsights = {
      topIssues: [
        { type: "Stormwater Drainage Floods", count: 3, change: "+20% this week" },
        { type: "Asphalt Cratering (Potholes)", count: 4, change: "-10% this week" },
        { type: "Illegal Solid Waste Dumping", count: 2, change: "Stable" }
      ],
      highestRiskAreas: [
        { area: "Mission St & 5th Ave", riskLevel: "Critical", score: 95 },
        { area: "Market St Corridor", riskLevel: "High", score: 82 },
        { area: "Valencia St greenway", riskLevel: "Medium", score: 58 }
      ],
      weeklySummary: "Overall city safety indicators slipped due to high-precipitation events on Day 4, leading to rapid stormwater backups. Streetlighting restoration was highly successful, bringing lighting divisions back to peak levels.",
      monthlySummary: "Over the last 30 days, roads and drainage infrastructure remain under the highest stress. The roads division requires a structural paving initiative rather than reactive patch maintenance to solve chronic arterial issues.",
      recommendations: [
        "Deploy the Sanitation and Drainage departments jointly to clean the storm main lines near Mission St ahead of forecasted rains.",
        "Establish regional bulky waste collection events near Valencia St to proactively curb illegal solid waste dumping patterns.",
        "Transition broken streetlighting logs into automated smart lamp node telemetry to discover blackouts before citizens report them."
      ]
    };
    return res.json(mockInsights);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a city infrastructure operations analyzer. Based on the following real-time report database from our Smart City platform, analyze and generate comprehensive strategic insights.

--- CURRENT INCIDENTS ---
${reportsSummary}
-------------------------

Generate a JSON object conforming EXACTLY to this schema. Do not include markdown wraps or extra text.

{
  "topIssues": [
    { "type": "issue name", "count": 3, "change": "short trend string" }
  ],
  "highestRiskAreas": [
    { "area": "neighborhood/street name", "riskLevel": "Low | Medium | High | Critical", "score": 85 }
  ],
  "weeklySummary": "comprehensive paragraph detailing urban activity, system stress, and achievements this week",
  "monthlySummary": "comprehensive paragraph outlining historical trends and long-term infrastructure health forecasts",
  "recommendations": [
    "specific, actionable engineering or policy recommendation for city officials",
    "another actionable recommendation"
  ]
}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Gemini Insights Error:', error);
    res.status(500).json({ error: 'Failed to generate insights', details: error.message });
  }
});

// API: Generate Digital Twin Narration for Timeline Replay
app.post('/api/generate-narration', async (req, res) => {
  const { dateName, healthMetrics, recentEvents } = req.body;
  
  const metricsStr = JSON.stringify(healthMetrics);
  const eventsStr = recentEvents ? JSON.stringify(recentEvents) : 'Routine city reports';

  const apiKey = getGeminiKey();
  if (!apiKey) {
    return res.json({
      narration: `Simulation report for ${dateName || 'today'}: Category updates show Road Health at ${healthMetrics?.roadHealth || 80}%, Drainage Health at ${healthMetrics?.drainageHealth || 80}%. Localized maintenance intervention successfully stabilized key municipal services.`
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the narrator of an Urban Digital Twin system.
Generate a concise, authoritative, yet engaging 2-sentence narration for a municipal timeline dashboard on ${dateName || 'this day'}.

The current city metrics are:
${metricsStr}

The events/changes registered are:
${eventsStr}

Describe specifically how these events affected the corresponding city health metrics. Keep it highly focused, objective, and realistic.`
    });

    return res.json({ narration: response.text?.trim() });
  } catch (error: any) {
    console.error('Gemini Narration Error:', error);
    res.json({
      narration: `Analysis on ${dateName || 'this day'} shows overall city health is holding at ${healthMetrics?.overallHealth || 80}%. Drainage and road maintenance remain top priorities.`
    });
  }
});

// Serve static assets in production, and set up Vite middleware in dev
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static file serving enabled.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start full-stack server:', err);
});
