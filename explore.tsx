import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import Slider from '@react-native-community/slider';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConcernAnalyzeRequest {
  sessionId?: string;
  locale?: string;
  freeTextConcern: string;
  ageYears?: number;
  sexAtBirth?: 'female' | 'male' | 'intersex' | 'unknown';
  currentPregnancyStatus?:
    | 'pregnant'
    | 'possibly_pregnant'
    | 'not_pregnant'
    | 'unknown';
}

interface ConcernAnalyzeResponse {
  sessionId?: string;
  primaryCategory: string;
  candidateCategories: string[];
  clinicalSummary: string;
  psychosocialFactorsMentioned: boolean;
  durationText?: string;
  bodyLocations?: string[];
  safetyNotes: string[];
}

const API_BASE_URL = 'http://localhost:3000';

// Types
interface SymptomRating {
  symptom: string;
  severity: number; // 0-3 (None, Mild, Moderate, Severe)
}

interface RiskAssessment {
  level: 'Low' | 'Moderate' | 'High';
  concernType: string;
  brief: string;
  redFlags: string[];
  analysis: string;
  recommendations: string[];
}

// Mock AI Functions (Replace with OpenAI later)
const classifyConcern = (input: string): string[] => {
  const txt = input.toLowerCase();
  if (/chest|heart|pressure|tight/.test(txt)) {
    return ['Heart-related issue', 'Anxiety/Panic Attack', 'Respiratory Issue'];
  }
  if (/fever|cough|cold|throat/.test(txt)) {
    return ['Cold/Flu', 'COVID-19', 'Strep Throat', 'Allergies'];
  }
  if (/stomach|nausea|vomit|diarrhea/.test(txt)) {
    return ['Food Poisoning', 'Stomach Flu', 'IBS', 'Gastritis'];
  }
  if (/head|migraine/.test(txt)) {
    return ['Migraine', 'Tension Headache', 'Sinus Issue'];
  }
  return ['General Malaise', 'Viral Infection', 'Stress/Anxiety'];
};

const getSymptomsForConcern = (concern: string): string[] => {
  const symptomsMap: Record<string, string[]> = {
    'Heart-related issue': ['Chest pain', 'Shortness of breath', 'Dizziness', 'Sweating', 'Nausea', 'Arm pain'],
    'Anxiety/Panic Attack': ['Rapid heartbeat', 'Shortness of breath', 'Dizziness', 'Sweating', 'Trembling', 'Chest tightness'],
    'Respiratory Issue': ['Cough', 'Wheezing', 'Shortness of breath', 'Chest tightness', 'Fatigue'],
    'Cold/Flu': ['Fever', 'Cough', 'Sore throat', 'Runny nose', 'Body aches', 'Fatigue', 'Headache'],
    'COVID-19': ['Fever', 'Dry cough', 'Fatigue', 'Loss of taste/smell', 'Shortness of breath', 'Body aches'],
    'Strep Throat': ['Sore throat', 'Fever', 'Swollen lymph nodes', 'Difficulty swallowing', 'Red tonsils'],
    'Food Poisoning': ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Fever', 'Weakness'],
    'Stomach Flu': ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal cramps', 'Fever', 'Dehydration'],
    'Migraine': ['Severe headache', 'Nausea', 'Light sensitivity', 'Sound sensitivity', 'Visual disturbances'],
    'Tension Headache': ['Dull headache', 'Pressure around head', 'Neck pain', 'Shoulder tension'],
  };
  
  return symptomsMap[concern] || ['Fatigue', 'Pain', 'Discomfort', 'Weakness'];
};

const analyzeRisk = (concern: string, ratings: SymptomRating[]): RiskAssessment => {
  const severeCount = ratings.filter(r => r.severity === 3).length;
  const moderateCount = ratings.filter(r => r.severity === 2).length;
  const totalScore = ratings.reduce((sum, r) => sum + r.severity, 0);
  
  // Determine risk level
  let level: 'Low' | 'Moderate' | 'High' = 'Low';
  if (severeCount >= 2 || totalScore >= 12) {
    level = 'High';
  } else if (severeCount >= 1 || totalScore >= 6) {
    level = 'Moderate';
  }

  // Red flags for specific concerns
  const redFlags: string[] = [];
  if (concern === 'Heart-related issue' && severeCount > 0) {
    redFlags.push('Severe chest symptoms require immediate medical attention');
    redFlags.push('Call 911 if symptoms worsen or include arm/jaw pain');
  }
  if (concern === 'COVID-19' && ratings.find(r => r.symptom.includes('breath') && r.severity >= 2)) {
    redFlags.push('Difficulty breathing requires immediate medical evaluation');
  }
  if (level === 'High') {
    redFlags.push('Multiple severe symptoms present - seek immediate care');
  }

  // Generate assessment
  const symptomsText = ratings.filter(r => r.severity > 0)
    .map(r => `${r.symptom} (${['None', 'Mild', 'Moderate', 'Severe'][r.severity]})`)
    .join(', ');

  return {
    level,
    concernType: concern,
    brief: `Patient reports ${concern.toLowerCase()} with ${ratings.length} assessed symptoms. Overall risk level: ${level}.`,
    redFlags,
    analysis: `Based on your reported symptoms (${symptomsText}), you are experiencing ${level.toLowerCase()}-level concern. The symptom pattern suggests ${concern.toLowerCase()}, which ${level === 'High' ? 'requires immediate medical attention' : level === 'Moderate' ? 'should be evaluated by a healthcare provider soon' : 'can likely be managed with self-care, but monitor for changes'}.`,
    recommendations: level === 'High' 
      ? ['Seek immediate medical attention', 'Visit ER or urgent care', 'Call 911 if symptoms worsen', 'Do not drive yourself']
      : level === 'Moderate'
      ? ['Schedule appointment with doctor within 24-48 hours', 'Monitor symptoms closely', 'Rest and stay hydrated', 'Seek immediate care if symptoms worsen']
      : ['Rest and monitor symptoms', 'Stay hydrated', 'Use over-the-counter medications if appropriate', 'Contact doctor if symptoms persist beyond 3-5 days']
  };
};

const TOTAL_STEPS = 4;
const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  
  // Step state
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // LLM outputs from step 1
  const [clinicalSummary, setClinicalSummary] = useState<string | null>(null);

  // Step 1: Free text input
  const [freeText, setFreeText] = useState('');
  const [concernSuggestions, setConcernSuggestions] = useState<string[]>([]);
  
  // Step 2: Concern selection
  const [selectedConcern, setSelectedConcern] = useState<string>('');
  
  // Step 3: Symptom ratings
  const [symptomRatings, setSymptomRatings] = useState<SymptomRating[]>([]);
  
  // Step 4: Risk assessment + questions
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [doctorQuestions, setDoctorQuestions] = useState<string[]>([]);
  
  // Computed symptoms list
  const symptomsList = useMemo(() => {
    if (!selectedConcern) return [];
    return getSymptomsForConcern(selectedConcern);
  }, [selectedConcern]);

  const handleAnalyzeText = async () => {
    if (!freeText.trim()) return;
  
    setIsLoading(true);
  
    const payload: ConcernAnalyzeRequest = {
      freeTextConcern: freeText.trim(),
      locale: 'en-US',
    };
  
    try {
      const res = await fetch(`${API_BASE_URL}/v1/intake/concern-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error status:', res.status, 'body:', errorText);
        return;
      }
  
      const data: ConcernAnalyzeResponse = await res.json();
      console.log('API response:', data);
  
      const suggestions = [
        data.primaryCategory,
        ...(data.candidateCategories || []),
      ].filter(Boolean);
  
      setConcernSuggestions(suggestions);
      setClinicalSummary(data.clinicalSummary || null);
      setStep(2);
    } catch (err) {
      console.error('Network or parsing error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConcern = (concern: string) => {
    setSelectedConcern(concern);
    
    const symptoms = getSymptomsForConcern(concern);
    setSymptomRatings(symptoms.map(s => ({ symptom: s, severity: 0 })));
    
    setStep(3);
  };

  const handleUpdateSeverity = (index: number, severity: number) => {
    const updated = [...symptomRatings];
    updated[index].severity = severity;
    setSymptomRatings(updated);
  };

  const handleGenerateAssessment = async () => {
    if (!selectedConcern || symptomRatings.length === 0) return;
  
    setIsLoading(true);
  
    // 1) Deterministic risk scoring
    const localAssessment = analyzeRisk(selectedConcern, symptomRatings);
  
    // 2) Build symptom summary from sliders
    const symptomSummary =
      symptomRatings
        .filter(r => r.severity > 0)
        .map(r => `${r.symptom} (${SEVERITY_LABELS[r.severity]})`)
        .join(', ') || 'No significant symptoms were rated.';
  
    const payload = {
      riskLevel: localAssessment.level,
      concernType: localAssessment.concernType,
      symptomSummary,
      redFlags: localAssessment.redFlags,
      recommendations: localAssessment.recommendations,
    };
  
    try {
      // 3) Call final-report endpoint (LLM rewrites summary/analysis)
      const res = await fetch(`${API_BASE_URL}/v1/intake/final-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Final report API error:', res.status, errorText);
  
        setRiskAssessment(localAssessment);
        setStep(4);
        return;
      }
  
      const data = await res.json() as {
        riskLevel: 'Low' | 'Moderate' | 'High';
        concernType: string;
        summary: string;
        analysis: string;
        recommendations: string[];
        disclaimer: string;
        safetyNotes: string[];
      };
  
      const merged: RiskAssessment = {
        level: localAssessment.level,
        concernType: localAssessment.concernType,
        brief: data.summary || localAssessment.brief,
        redFlags: localAssessment.redFlags,
        analysis: data.analysis || localAssessment.analysis,
        recommendations: data.recommendations?.length
          ? data.recommendations
          : localAssessment.recommendations,
      };
  
      setRiskAssessment(merged);

      // 4) Call generate-questions endpoint (LLM generates clinician questions)
      if (clinicalSummary) {
        try {
          const qRes = await fetch(`${API_BASE_URL}/v1/intake/generate-questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              concernType: selectedConcern,
              clinicalSummary,
            }),
          });

          if (qRes.ok) {
            const qData = await qRes.json() as {
              concernType: string;
              questions: string[];
              rationaleNotes?: string[];
              safetyNotes?: string[];
            };

            if (Array.isArray(qData.questions)) {
              setDoctorQuestions(qData.questions);
            }
          } else {
            console.error('Questions API error:', qRes.status, await qRes.text());
          }
        } catch (err) {
          console.error('Network error (generate-questions):', err);
        }
      } else {
        setDoctorQuestions([]);
      }

      setStep(4);
    } catch (err) {
      console.error('Network error (final-report):', err);
      setRiskAssessment(localAssessment);
      setStep(4);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFreeText('');
    setConcernSuggestions([]);
    setSelectedConcern('');
    setSymptomRatings([]);
    setRiskAssessment(null);
    setClinicalSummary(null);
    setDoctorQuestions([]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ThemedView style={styles.container}>
        {/* Header with Progress */}
        <ThemedView style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <ThemedText type="title" style={styles.headerTitle}>
            Health Consultation
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            Step {step} of {TOTAL_STEPS}
          </ThemedText>
          
          <View style={styles.progressContainer}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={styles.progressWrapper}>
                <View style={[styles.progressDot, i < step && styles.progressDotActive]} />
                {i < TOTAL_STEPS - 1 && (
                  <View style={[styles.progressLine, i < step - 1 && styles.progressLineActive]} />
                )}
              </View>
            ))}
          </View>
        </ThemedView>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: FREE TEXT INPUT */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                What brings you in today?
              </ThemedText>
              <ThemedText type="default" style={styles.stepDescription}>
                Describe your main concern or symptoms in your own words.
              </ThemedText>

              <TextInput
                style={styles.textInput}
                value={freeText}
                onChangeText={setFreeText}
                placeholder="e.g., I've been having chest pain and feeling short of breath..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
              />

              <Pressable
                style={[styles.primaryButton, !freeText.trim() && styles.buttonDisabled]}
                onPress={handleAnalyzeText}
                disabled={!freeText.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>Analyze Symptoms</ThemedText>
                )}
              </Pressable>
            </View>
          )}

          {/* STEP 2: CONCERN SELECTION */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                Select the concern that best matches
              </ThemedText>
              <ThemedText type="default" style={styles.stepDescription}>
                Based on your description, here are possible concerns:
              </ThemedText>

              <View style={styles.concernList}>
                {concernSuggestions.map((concern, index) => (
                  <Pressable
                    key={index}
                    style={styles.concernCard}
                    onPress={() => handleSelectConcern(concern)}
                  >
                    <View style={styles.concernIcon}>
                      <ThemedText style={styles.concernEmoji}>🩺</ThemedText>
                    </View>
                    <View style={styles.concernContent}>
                      <ThemedText type="defaultSemiBold">{concern}</ThemedText>
                      <ThemedText style={styles.concernArrow}>→</ThemedText>
                    </View>
                  </Pressable>
                ))}
              </View>

              <Pressable style={styles.linkButton} onPress={() => setStep(1)}>
                <ThemedText style={styles.linkText}>← Go back and edit description</ThemedText>
              </Pressable>
            </View>
          )}

          {/* STEP 3: SYMPTOM SLIDERS */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                {selectedConcern}
              </ThemedText>
              <ThemedText type="default" style={styles.stepDescription}>
                Rate the severity of each symptom you're experiencing:
              </ThemedText>

              <View style={styles.slidersList}>
                {symptomRatings.map((rating, index) => (
                  <View key={index} style={styles.sliderItem}>
                    <View style={styles.sliderHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.sliderLabel}>
                        {rating.symptom}
                      </ThemedText>
                      <View style={[
                        styles.severityBadge,
                        rating.severity === 0 && styles.severityNone,
                        rating.severity === 1 && styles.severityMild,
                        rating.severity === 2 && styles.severityModerate,
                        rating.severity === 3 && styles.severitySevere,
                      ]}>
                        <ThemedText style={styles.severityBadgeText}>
                          {SEVERITY_LABELS[rating.severity]}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={3}
                      step={1}
                      value={rating.severity}
                      onValueChange={(value) => handleUpdateSeverity(index, value)}
                      minimumTrackTintColor="#3B82F6"
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor="#3B82F6"
                    />
                  </View>
                ))}
              </View>

              <Pressable
                style={styles.primaryButton}
                onPress={handleGenerateAssessment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>Generate Assessment</ThemedText>
                )}
              </Pressable>

              <Pressable style={styles.linkButton} onPress={() => setStep(2)}>
                <ThemedText style={styles.linkText}>← Change concern</ThemedText>
              </Pressable>
            </View>
          )}

          {/* STEP 4: RISK ASSESSMENT & RECOMMENDATIONS */}
          {step === 4 && riskAssessment && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                Your Health Assessment
              </ThemedText>

              {/* Risk Level Banner */}
              <View style={[
                styles.riskBanner,
                riskAssessment.level === 'Low' && styles.riskLow,
                riskAssessment.level === 'Moderate' && styles.riskModerate,
                riskAssessment.level === 'High' && styles.riskHigh,
              ]}>
                <ThemedText type="subtitle" style={styles.riskLevel}>
                  Risk Level: {riskAssessment.level}
                </ThemedText>
                <ThemedText style={styles.riskConcern}>
                  {riskAssessment.concernType}
                </ThemedText>
              </View>

              {riskAssessment.redFlags.length > 0 && (
                <View style={styles.redFlagSection}>
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    ⚠️ Important Warnings
                  </ThemedText>
                  {riskAssessment.redFlags.map((flag, index) => (
                    <View key={index} style={styles.listItem}>
                      <ThemedText style={styles.bullet}>•</ThemedText>
                      <ThemedText style={styles.redFlagText}>{flag}</ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {/* Clinical Brief */}
              <View style={styles.summarySection}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  📋 Summary
                </ThemedText>
                <ThemedText style={styles.summaryText}>{riskAssessment.brief}</ThemedText>
              </View>

              {/* Analysis */}
              <View style={styles.summarySection}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  🔍 Analysis
                </ThemedText>
                <ThemedText style={styles.summaryText}>{riskAssessment.analysis}</ThemedText>
              </View>

              {/* Recommendations */}
              <View style={styles.summarySection}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  💡 Recommendations
                </ThemedText>
                {riskAssessment.recommendations.map((rec, index) => (
                  <View key={index} style={styles.listItem}>
                    <ThemedText style={styles.bullet}>•</ThemedText>
                    <ThemedText style={styles.summaryText}>{rec}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Questions to ask your clinician */}
              {doctorQuestions.length > 0 && (
                <View style={styles.summarySection}>
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.sectionTitle}
                  >
                    🗣️ Questions to ask your clinician
                  </ThemedText>
                  {doctorQuestions.map((q, index) => (
                    <View key={index} style={styles.listItem}>
                      <ThemedText style={styles.bullet}>•</ThemedText>
                      <ThemedText style={styles.summaryText}>{q}</ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {/* Disclaimer */}
              <View style={styles.disclaimer}>
                <ThemedText style={styles.disclaimerText}>
                  ⚕️ This assessment is for informational purposes only and does not replace professional medical advice. Always consult a healthcare provider for proper diagnosis and treatment.
                </ThemedText>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable style={styles.secondaryButton}>
                  <ThemedText style={styles.secondaryButtonText}>Find Clinics</ThemedText>
                </Pressable>
                <Pressable style={styles.secondaryButton}>
                  <ThemedText style={styles.secondaryButtonText}>Save Report</ThemedText>
                </Pressable>
              </View>

              <Pressable style={styles.primaryButton} onPress={handleReset}>
                <ThemedText style={styles.buttonText}>Start New Consultation</ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: Fonts.rounded,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 20,
  },
  stepDescription: {
    opacity: 0.7,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#1F2937',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  concernList: {
    gap: 12,
  },
  concernCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  concernIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  concernEmoji: {
    fontSize: 24,
  },
  concernContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  concernArrow: {
    fontSize: 20,
    color: '#3B82F6',
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  slidersList: {
    gap: 20,
  },
  sliderItem: {
    gap: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 15,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityNone: {
    backgroundColor: '#F3F4F6',
  },
  severityMild: {
    backgroundColor: '#FEF3C7',
  },
  severityModerate: {
    backgroundColor: '#FED7AA',
  },
  severitySevere: {
    backgroundColor: '#FEE2E2',
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  riskBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  riskLow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  riskModerate: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  riskHigh: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  riskLevel: {
    fontSize: 18,
    marginBottom: 4,
  },
  riskConcern: {
    fontSize: 14,
    opacity: 0.8,
  },
  redFlagSection: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 8,
  },
  redFlagText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
    lineHeight: 20,
  },
  summarySection: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    marginRight: 8,
    color: '#4B5563',
  },
  disclaimer: {
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
});
