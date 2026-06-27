/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { dbService } from '../services/db.service';
import { Report } from '../types';
import { 
  Upload, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  Loader2, 
  Camera, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Form validation schema using Zod
const reportSchema = z.object({
  locationName: z.string().min(3, { message: "Location name is required." }),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  issueType: z.enum([
    'pothole', 'flooding', 'blocked_drain', 'broken_streetlight', 
    'illegal_dumping', 'damaged_road', 'unsafe_sidewalk', 
    'traffic_sign_damage', 'water_leakage', 'other'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(5, { message: "Detailed description is required." }),
  publicSafetyRisk: z.string().optional(),
  environmentalImpact: z.string().optional(),
  recommendedAction: z.string().optional(),
  estimatedRepairUrgency: z.string().optional(),
  suggestedDepartment: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

// Quick tiny high-contrast placeholders for sample images to make testing 100% stable
const SAMPLE_PHOTOS = [
  {
    name: "Pothole",
    url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80",
    desc: "Severe asphalt cracking"
  },
  {
    name: "Flooded Road",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
    desc: "Clogged stormwater sewer"
  },
  {
    name: "Trash Pile",
    url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80",
    desc: "Sidewalk bulky solid waste"
  }
];

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      locationName: '',
      latitude: 6.6906,
      longitude: -1.6187,
      issueType: 'pothole',
      severity: 'medium',
      description: '',
      publicSafetyRisk: '',
      environmentalImpact: '',
      recommendedAction: '',
      estimatedRepairUrgency: '7 days',
      suggestedDepartment: 'Department of Urban Roads'
    }
  });

  const watchIssueType = watch('issueType');
  const watchSeverity = watch('severity');

  // Convert File to base64 helper
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setAiSuccess(false);
      // Trigger AI Analysis automatically for amazing UX!
      triggerAiInspection(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Convert Unsplash URL to Base64 to inspect sample photos
  const handleSelectSample = async (url: string) => {
    setImagePreview(url);
    setAnalyzing(true);
    setAiSuccess(false);

    try {
      const res = await fetch(url);
      const blob = await res.blob();
      setMimeType(blob.type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setImageBase64(base64);
        triggerAiInspection(base64, blob.type);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Error reading sample image:", e);
      setAnalyzing(false);
    }
  };

  // Run Gemini Image Inspection
  const triggerAiInspection = async (b64: string, mime: string) => {
    setAnalyzing(true);
    setAiSuccess(false);
    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, mimeType: mime }),
      });

      if (!res.ok) throw new Error("AI analysis failed.");

      const aiData = await res.json();
      
      // Auto-populate form
      if (aiData.issueType) setValue('issueType', aiData.issueType);
      if (aiData.severity) setValue('severity', aiData.severity);
      if (aiData.description) setValue('description', aiData.description);
      if (aiData.publicSafetyRisk) setValue('publicSafetyRisk', aiData.publicSafetyRisk);
      if (aiData.environmentalImpact) setValue('environmentalImpact', aiData.environmentalImpact);
      if (aiData.recommendedAction) setValue('recommendedAction', aiData.recommendedAction);
      if (aiData.estimatedRepairUrgency) setValue('estimatedRepairUrgency', aiData.estimatedRepairUrgency);
      if (aiData.suggestedDepartment) setValue('suggestedDepartment', aiData.suggestedDepartment);

      // Create a sensible location name if empty
      const curLoc = watch('locationName');
      if (!curLoc) {
        setValue('locationName', `Near ${aiData.suggestedDepartment || 'Main Road'}, Kumasi`);
      }

      setAiSuccess(true);
    } catch (err) {
      console.error("AI Auto-Inspection crashed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Fetch geolocation
  const handleGetLocation = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', Number(pos.coords.latitude.toFixed(6)));
        setValue('longitude', Number(pos.coords.longitude.toFixed(6)));
        setValue('locationName', `GPS Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setGpsLoading(false);
      },
      (err) => {
        console.warn("Geolocation blocked, using mock location near existing marker center:", err);
        // Shift current coords slightly to simulate a unique spot near the city center
        const offsetLat = 6.6906 + (Math.random() - 0.5) * 0.015;
        const offsetLng = -1.6187 + (Math.random() - 0.5) * 0.015;
        setValue('latitude', Number(offsetLat.toFixed(6)));
        setValue('longitude', Number(offsetLng.toFixed(6)));
        setValue('locationName', `Sector ${Math.floor(Math.random() * 12 + 1)}, Kumasi`);
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Submit report to DB
  const onSubmit = async (values: ReportFormValues) => {
    setSubmitting(true);
    try {
      // Determine infrastructure division
      let affectedInfrastructure: Report['affectedInfrastructure'] = 'other';
      if (['pothole', 'damaged_road', 'unsafe_sidewalk', 'traffic_sign_damage'].includes(values.issueType)) {
        affectedInfrastructure = 'road';
      } else if (['flooding', 'blocked_drain'].includes(values.issueType)) {
        affectedInfrastructure = 'drainage';
      } else if (['illegal_dumping'].includes(values.issueType)) {
        affectedInfrastructure = 'waste';
      } else if (['broken_streetlight'].includes(values.issueType)) {
        affectedInfrastructure = 'lighting';
      } else if (['water_leakage'].includes(values.issueType)) {
        affectedInfrastructure = 'water';
      }

      // Determine priority score based on severity
      let priorityScore = 30;
      switch (values.severity) {
        case 'low': priorityScore = Math.floor(Math.random() * 20 + 15); break;
        case 'medium': priorityScore = Math.floor(Math.random() * 25 + 40); break;
        case 'high': priorityScore = Math.floor(Math.random() * 15 + 72); break;
        case 'critical': priorityScore = Math.floor(Math.random() * 10 + 90); break;
      }

      await dbService.addReport({
        imageUrl: imagePreview || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
        locationName: values.locationName,
        latitude: values.latitude,
        longitude: values.longitude,
        issueType: values.issueType,
        severity: values.severity,
        confidence: aiSuccess ? 'high' : 'medium',
        description: values.description,
        publicSafetyRisk: values.publicSafetyRisk || 'Possible damage to tires or trip hazards.',
        environmentalImpact: values.environmentalImpact || 'None.',
        recommendedAction: values.recommendedAction || 'Schedule routine patch repair.',
        estimatedRepairUrgency: values.estimatedRepairUrgency || '7 days',
        priorityScore,
        affectedInfrastructure,
        suggestedDepartment: values.suggestedDepartment || 'roads department',
        duplicateLikelihood: 'low',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Redirect to Dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-8 h-8 text-blue-600 dark:text-blue-400" /> Report Infrastructure Incident
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Report potholes, street leaks, or broken lights. Our server-side Gemini AI inspects pictures instantly to score risk factors and alert operations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column: Image Upload area and Sample picker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-center items-center text-center">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Upload Incident Photo</h3>
            
            {/* Main File Box */}
            <div className="relative w-full h-48 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 flex flex-col justify-center items-center p-4 transition-colors bg-slate-50 dark:bg-slate-950/20 overflow-hidden">
              {imagePreview ? (
                <>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-xl">
                    <label className="cursor-pointer text-white font-semibold text-xs flex items-center gap-1.5 bg-blue-600 px-3.5 py-2 rounded-lg">
                      <Camera className="w-4 h-4" /> Change Photo
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full">
                  <Upload className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drag photo here or browse</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Supports JPEG, PNG, WEBP</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            {/* AI Analysis Overlay Progress Indicator */}
            <AnimatePresence>
              {analyzing && (
                <motion.div 
                  className="w-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 mt-4 flex items-center gap-2.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
                      Gemini Auto-Inspecting...
                    </span>
                    <span className="block text-[10px] text-blue-600 dark:text-blue-400 font-medium">Analyzing material composition, threat level & urgent actions...</span>
                  </div>
                </motion.div>
              )}

              {aiSuccess && !analyzing && (
                <motion.div 
                  className="w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-3 mt-4 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-350"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                  <div className="text-left">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      Gemini Auto-Inspection Success! <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                    </span>
                    <span className="block text-[10px] opacity-90">Forms have been pre-populated with damage dimensions.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sample selector */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Quick Testing Samples
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              {SAMPLE_PHOTOS.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectSample(item.url)}
                  className="flex flex-col items-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-all text-center group"
                >
                  <img 
                    src={item.url} 
                    alt={item.name} 
                    className="w-full h-14 object-cover rounded-lg mb-1 group-hover:opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Form details */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            {/* Coordinates Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500" /> Geographic Coordinates
                </span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gpsLoading}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Use GPS Location
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                    {...register('latitude', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                    {...register('longitude', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Street Address / Location Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tech Junction, near KNUST Gate, Kumasi"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                  {...register('locationName')}
                />
                {errors.locationName && (
                  <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.locationName.message}</span>
                )}
              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Issue Category</label>
                <select
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100 capitalize"
                  {...register('issueType')}
                >
                  <option value="pothole">Pothole</option>
                  <option value="flooding">Flooding</option>
                  <option value="blocked_drain">Blocked Drain</option>
                  <option value="broken_streetlight">Broken Streetlight</option>
                  <option value="illegal_dumping">Illegal Dumping</option>
                  <option value="damaged_road">Damaged Road</option>
                  <option value="unsafe_sidewalk">Unsafe Sidewalk</option>
                  <option value="traffic_sign_damage">Traffic Sign Damage</option>
                  <option value="water_leakage">Water Leakage</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Severity Level</label>
                <select
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100 uppercase"
                  {...register('severity')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea
                placeholder="Detail the issue: dimensions, exact spot, traffic interference..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                {...register('description')}
              />
              {errors.description && (
                <span className="text-[10px] text-red-500 font-medium block mt-1">{errors.description.message}</span>
              )}
            </div>

            {/* AI Field expansion panels (visible always, editable) */}
            <div className="space-y-4 pt-3 border-t border-slate-150 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> AI Diagnostic Overrides
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Suggested Department</label>
                  <input
                    type="text"
                    placeholder="roads department..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                    {...register('suggestedDepartment')}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Est. Repair Urgency</label>
                  <input
                    type="text"
                    placeholder="e.g. 24 hours, 7 days..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                    {...register('estimatedRepairUrgency')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Public Safety Risk</label>
                  <input
                    type="text"
                    placeholder="Tire damage or hazard warnings..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                    {...register('publicSafetyRisk')}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Environmental Impact</label>
                  <input
                    type="text"
                    placeholder="Water table contamination..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                    {...register('environmentalImpact')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">AI Recommended Action</label>
                <input
                  type="text"
                  placeholder="Clean sewer catch-basins immediately..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-blue-500 text-slate-800 dark:text-slate-100"
                  {...register('recommendedAction')}
                />
              </div>
            </div>

            {/* Form Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving Report and updating city metrics...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" /> Submit Report to Digital Twin
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
