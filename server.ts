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
    console.log('[Gemini Mock] Generating Kumasi-specific mock analysis.');
    // Determine a random realistic mock based on typical upload scenarios
    const mocks = [
      {
        issueType: "pothole",
        severity: "high",
        confidence: "high",
        description: "Hazardous potholes and asphalt crumbling on the driving lanes, hindering traffic flow.",
        publicSafetyRisk: "High risk of vehicle tire blowouts, suspensions issues, and swerving hazards for drivers on busy Kumasi roads.",
        environmentalImpact: "Low. Localized asphalt wear and erosion can wash soil and sediment into nearby drains.",
        recommendedAction: "Cordon off the active lane and dispatch a road repair unit to perform deep hot-mix patching.",
        estimatedRepairUrgency: "24 hours",
        priorityScore: 82,
        affectedInfrastructure: "road",
        suggestedDepartment: "Department of Urban Roads",
        duplicateLikelihood: "low"
      },
      {
        issueType: "flooding",
        severity: "critical",
        confidence: "high",
        description: "Severe stormwater drain backing up and ponding, flooding walkways and nearby market stalls.",
        publicSafetyRisk: "Critical health and slip hazard for local traders and shoppers. Deep water blocks walkways, forcing pedestrians onto vehicle routes.",
        environmentalImpact: "High. Silt, trash, and plastic waste are washed into public water systems, contaminating the Subin River basin.",
        recommendedAction: "Dispatch municipal vacuum trucks and NADMO emergency teams to flush choked secondary sewers and clear blockages.",
        estimatedRepairUrgency: "immediate",
        priorityScore: 95,
        affectedInfrastructure: "drainage",
        suggestedDepartment: "NADMO / Drainage Department",
        duplicateLikelihood: "low"
      },
      {
        issueType: "illegal_dumping",
        severity: "medium",
        confidence: "high",
        description: "Large pile of household solid waste, plastics, and debris dumped next to a community space boundary.",
        publicSafetyRisk: "Promotes rodent breeding, blocks pedestrian paths, and produces severe foul odors in busy market sectors.",
        environmentalImpact: "Decomposing waste runs off into open storm gutters, causing contamination and severe drainage chokes during rain.",
        recommendedAction: "Deploy Zoomlion refuse collection truck to clear the waste. Erect warning signs and increase municipal patrols.",
        estimatedRepairUrgency: "48 hours",
        priorityScore: 58,
        affectedInfrastructure: "waste",
        suggestedDepartment: "Environmental Health Department / Zoomlion",
        duplicateLikelihood: "low"
      },
      {
        issueType: "broken_streetlight",
        severity: "medium",
        confidence: "high",
        description: "Row of streetlighting poles is completely black during evening hours, leaving the road section in darkness.",
        publicSafetyRisk: "Sells-by-night traders face security concerns, and pedestrians are exposed to blind spots and high risk of vehicle accidents.",
        environmentalImpact: "None.",
        recommendedAction: "Dispatch a crew with a bucket truck to replace faulty sodium bulbs or check the local transformer node fuse.",
        estimatedRepairUrgency: "7 days",
        priorityScore: 62,
        affectedInfrastructure: "lighting",
        suggestedDepartment: "Electricity Company of Ghana",
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
        `You are an expert urban infrastructure inspection assistant tailored for Ghanaian smart cities (specifically Kumasi, Ghana).
Analyze the uploaded image and return ONLY valid JSON using this schema:

{
  "issueType": "pothole | flooding | blocked_drain | broken_streetlight | illegal_dumping | damaged_road | unsafe_sidewalk | traffic_sign_damage | water_leakage | other",
  "severity": "low | medium | high | critical",
  "confidence": "low | medium | high",
  "description": "short description of the visible civic issue in Kumasi",
  "publicSafetyRisk": "short explanation of risk to pedestrians, vehicles, or traders in Kumasi",
  "environmentalImpact": "short explanation of environmental impact",
  "recommendedAction": "specific action local Ghanaian authorities should take",
  "estimatedRepairUrgency": "e.g. immediate, 24 hours, 48 hours, 7 days, routine maintenance",
  "priorityScore": 0,
  "affectedInfrastructure": "road | drainage | waste | lighting | water | public_safety | other",
  "suggestedDepartment": "Department of Urban Roads | NADMO / Drainage Department | Environmental Health Department / Zoomlion | Electricity Company of Ghana | Ghana Water Company | Ghana Police MTTD | other",
  "duplicateLikelihood": "low | medium | high"
}

Ensure recommendations align with Ghanaian civic contexts, recommending the correct departments (such as Department of Urban Roads, NADMO, Zoomlion, ECG, or Ghana Water).
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
    console.log('[Gemini Mock] Generating mock Kumasi chat response.');
    const userQuery = messages[messages.length - 1].text.toLowerCase();

    let answer = "As your Kumasi AI City Analyst, I have inspected the Urban Twin database. ";
    if (userQuery.includes('fix first') || userQuery.includes('priority') || userQuery.includes('critical')) {
      answer += "\n\nBased on the priority engine, the Kumasi Assemblies should immediately focus on **rep-2 (Kejetia Market Drainage Flooding)** with a critical priority score of **95/100**, and **rep-5 (Adum Commercial Area Water Leakage)** at **89/100**.\n\nThese represent severe risks to pedestrian safety and commercial activity. Drainage flooding must be tackled first to allow market access and prevent waterborne disease vectors.";
    } else if (userQuery.includes('risk') || userQuery.includes('neighborhood') || userQuery.includes('area') || userQuery.includes('location')) {
      answer += "\n\nThe **Kejetia Market and Adum Commercial corridor** currently presents the highest infrastructure stress coefficient in Kumasi. It has accumulated critical stormwater flooding and high-pressure pipe leaks, threatening road foundations and commercial transit.";
    } else if (userQuery.includes('summar') || userQuery.includes('incident') || userQuery.includes('today')) {
      answer += `\n\n**Kumasi Infrastructure Summary:**\n- **Active Incidents**: ${reports?.length || 5}\n- **Water Infrastructure**: 1 pipe leak in Adum (High severity)\n- **Roads**: 1 deep pothole at Tech Junction (High severity)\n- **Drainage**: 1 stormwater sewer choke in Kejetia (Critical severity)\n- **Waste**: 1 dumping heap near Asafo Market (Medium severity)\n- **Resolved**: 1 streetlight blackout on Bantama High Street (Resolved by ECG)`;
    } else {
      answer += "\n\nTo optimize municipal operations, I recommend dispatching a **suction pump team to Kejetia** to clear the drains, and directing **Ghana Water Company crews to Adum** to isolate the leaking main. Drainage and road division indices are currently the most depressed elements of the overall Kumasi health twin.";
    }
    return res.json({ text: answer });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Build chat structure with Ghanaian Smart City context
    const systemInstruction = `You are "Urban Twin AI Analyst", an expert smart city coordinator, municipal engineer, and maintenance advisor specifically for Kumasi, Ghana.
You are communicating with Kumasi Metropolitan Assembly (KMA) and Oforikrom Municipal Assembly officials.
Your answers should be highly analytical, professional, and practical for Ghanaian conditions.
Use the following list of active and past city reports (provided directly from our Digital Twin database) to back up your statements with specific IDs, severities, and locations:

--- KUMASI CIVIL REPORTS DATABASE ---
${reportsSummary}
----------------------------

Always refer to specific incidents by ID and Ghanaian location names (such as Tech Junction, KNUST, Kejetia, Bantama, Adum, Asafo, Suame, Ayeduase). Refer to Ghanaian organizations (such as Department of Urban Roads, NADMO, Electricity Company of Ghana, Ghana Water Company, and Zoomlion). Always propose concrete, localized recommendations. Use currency GHS if talking about costs.`;

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
    console.log('[Gemini Mock] Generating mock Kumasi insights.');
    const mockInsights = {
      topIssues: [
        { type: "Choked Gutters & Flooding", count: 3, change: "+20% this week" },
        { type: "Asphalt Potholes", count: 4, change: "-10% this week" },
        { type: "Illegal Market Waste Dumping", count: 2, change: "Stable" }
      ],
      highestRiskAreas: [
        { area: "Kejetia Market Drainage", riskLevel: "Critical", score: 95 },
        { area: "Tech Junction Crossing", riskLevel: "High", score: 82 },
        { area: "Asafo Market Outskirts", riskLevel: "Medium", score: 58 }
      ],
      weeklySummary: "Overall Kumasi health indicators declined temporarily due to heavy rainfall on Day 4, leading to rapid gutter overflows at Kejetia. Electricity Company of Ghana was highly successful in restoring streetlights on Bantama High Street, keeping lighting metrics stable.",
      monthlySummary: "Over the last 30 days, storm drainage and main roads are under the greatest stress in Kumasi. Assemblies must coordinate with Zoomlion for pre-rain gutter clearing and push the Department of Urban Roads to allocate GHS for structural road resurfacing.",
      recommendations: [
        "Sponsor joint Zoomlion and NADMO clean-up exercises to desilt secondary gutters around Kejetia Market before next rains.",
        "Request Ghana Water Company to isolate and replace corroded primary valve junctions in Adum commercial sector to stop clean water wasting.",
        "Urge Department of Urban Roads to prioritize permanent asphalt milling on high-volume lanes near Tech Junction rather than recurring temporary patches."
      ]
    };
    return res.json(mockInsights);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert municipal infrastructure planner for Kumasi, Ghana and its surrounding Municipal Assemblies.
Based on the following real-time report database from our Smart City platform, analyze and generate comprehensive strategic insights.

--- CURRENT INCIDENTS ---
${reportsSummary}
-------------------------

Generate a JSON object conforming EXACTLY to this schema. Do not include markdown wraps or extra text. Make sure suggestions use Ghanaian terms and departments (such as Department of Urban Roads, NADMO, ECG, Ghana Water, Zoomlion) and use GHS currency references if applicable.

{
  "topIssues": [
    { "type": "issue name", "count": 3, "change": "short trend string" }
  ],
  "highestRiskAreas": [
    { "area": "Kumasi area name (e.g., Kejetia, Adum, Tech Junction, Bantama)", "riskLevel": "Low | Medium | High | Critical", "score": 85 }
  ],
  "weeklySummary": "comprehensive paragraph detailing urban activity, rainfall stress, and municipal achievements this week in Kumasi",
  "monthlySummary": "comprehensive paragraph outlining historical trends and long-term infrastructure health forecasts for the Ashanti Region",
  "recommendations": [
    "specific, actionable engineering or policy recommendation for Kumasi assembly officials (e.g., KMA, ECG, Zoomlion, NADMO)",
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
      narration: `Simulation report for Kumasi on ${dateName || 'today'}: Category updates show Road Health at ${healthMetrics?.roadHealth || 80}%, Drainage Health at ${healthMetrics?.drainageHealth || 80}%. Localized maintenance intervention successfully stabilized key municipal services.`
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the narrator of an Urban Digital Twin system for Kumasi, Ghana.
Generate a concise, authoritative, yet engaging 2-sentence narration for a municipal timeline dashboard on ${dateName || 'this day'}.

The current Kumasi metrics are:
${metricsStr}

The events/changes registered are:
${eventsStr}

Describe specifically how these events affected the corresponding city health metrics, using Ghanaian smart city terminology where relevant. Keep it highly focused, objective, and realistic.`
    });

    return res.json({ narration: response.text?.trim() });
  } catch (error: any) {
    console.error('Gemini Narration Error:', error);
    res.json({
      narration: `Analysis on ${dateName || 'this day'} shows overall Kumasi health is holding at ${healthMetrics?.overallHealth || 80}%. Drainage and road maintenance remain top priorities.`
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
