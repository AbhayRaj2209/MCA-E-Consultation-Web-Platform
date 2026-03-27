import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, Building2, Briefcase, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const normalizeStakeholderType = (value: string | null | undefined): string => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'Individual';
  if (raw === 'individual' || raw === 'indv') return 'Individual';
  if (raw === 'industry' || raw === 'industry body' || raw.includes('industry body')) return 'Industry Body';
  if (raw === 'ngo' || raw === 'n.g.o') return 'NGO';
  if (raw === 'law' || raw === 'law firm' || raw === 'legal') return 'Law Firm';
  if (raw === 'consulting' || raw === 'consulting firm' || raw === 'consultant') return 'Consulting Firm';
  if (raw === 'nri') return 'NRI';
  return raw
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const TrendAnalysis = () => {
  const [totalSubmissionsFromDB, setTotalSubmissionsFromDB] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');

        const [bill1Res, bill2Res, bill3Res, consultRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/comments/bill_1?limit=10000`),
          fetch(`${import.meta.env.VITE_API_URL}/api/comments/bill_2?limit=10000`),
          fetch(`${import.meta.env.VITE_API_URL}/api/comments/bill_3?limit=10000`),
          fetch(`${import.meta.env.VITE_API_URL}/api/consultations`)
        ]);

        const [bill1Json, bill2Json, bill3Json, consultJson] = await Promise.all([
          bill1Res.ok ? bill1Res.json() : Promise.resolve({ ok: false, data: [] }),
          bill2Res.ok ? bill2Res.json() : Promise.resolve({ ok: false, data: [] }),
          bill3Res.ok ? bill3Res.json() : Promise.resolve({ ok: false, data: [] }),
          consultRes.ok ? consultRes.json() : Promise.resolve({ ok: false, data: [] })
        ]);

        if (!bill1Res.ok || !bill2Res.ok || !bill3Res.ok || !consultRes.ok) {
          setErrorMessage('Some analytics endpoints failed. Showing only successfully fetched database records.');
        }

        const allRows = [
          ...(Array.isArray(bill1Json.data) ? bill1Json.data.map((r: any) => ({ ...r, billId: 1 })) : []),
          ...(Array.isArray(bill2Json.data) ? bill2Json.data.map((r: any) => ({ ...r, billId: 2 })) : []),
          ...(Array.isArray(bill3Json.data) ? bill3Json.data.map((r: any) => ({ ...r, billId: 3 })) : [])
        ];

        const consultationsData = Array.isArray(consultJson.data) ? consultJson.data : [];

        const mapped = allRows.map((r: any) => {
          const rawSentiment = String(r.sentiment || r.stance || 'neutral').toLowerCase();
          const normalizedStance = rawSentiment.charAt(0).toUpperCase() + rawSentiment.slice(1);

          return {
          id: r.comments_id || r.id || r.comment_id || Math.random(),
          submitter: r.commenter_name || r.submitter || 'Anonymous',
          stakeholderType: normalizeStakeholderType(r.stakeholder_type || r.stakeholderType || 'Individual'),
          date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : (r.date || ''),
          stance: normalizedStance,
          summary: r.comment_data || r.summary || '',
          confidenceScore_based_on_ensemble_model: r.confidence_score || r.confidence || r.confidenceScore_based_on_ensemble_model || 0,
          originalText: r.comment_data || r.originalText || '',
          keywords: r.keywords || [],
          consultationId: r.billId || r.consultationId || null
        };
        });

        setAllComments(mapped);
        setConsultations(consultationsData);

        setTotalSubmissionsFromDB(mapped.length);
      } catch (err) {
        console.error('Error fetching data:', err);
        setAllComments([]);
        setConsultations([]);
        setErrorMessage('Unable to fetch live analytics data from database.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stakeholder analytics from fetched data
  const stakeholderTypes = allComments.reduce((acc, comment) => {
    const type = normalizeStakeholderType(comment.stakeholderType || 'Individual');
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topStakeholders = Object.entries(stakeholderTypes)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  const totalComments = allComments.length;

  const averageConfidence = totalComments > 0
    ? (allComments.reduce((acc, comment) => {
        return acc + Number(comment.confidenceScore_based_on_ensemble_model || 0);
      }, 0) / totalComments)
    : 0;
  const averageConfidencePercent = averageConfidence <= 1
    ? (averageConfidence * 100).toFixed(1)
    : averageConfidence.toFixed(1);

  const billEngagement = consultations.map(consultation => {
    const billComments = allComments.filter(c => c.consultationId === consultation.id);
    const stanceCounts = billComments.reduce((acc, comment) => {
      const stance = comment.stance || 'Neutral';
      acc[stance] = (acc[stance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantStance = Object.entries(stanceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([stance]) => stance)[0] || 'Neutral';

    return {
      billId: consultation.id,
      total: billComments.length,
      dominantStance
    };
  });

  const mostDiscussedBill = billEngagement.length > 0 
    ? billEngagement.reduce((max, curr) => {
        if (!max || curr.total > max.total) return curr;
        return max;
      }, billEngagement[0])
    : { billId: 1, total: 0, dominantStance: 'Neutral' };

  // Prepare sentiment trend data for all bills
  const sentimentTrendData = consultations.length > 0
    ? consultations.map(consultation => {
        const billComments = allComments.filter(c => Number(c.consultationId) === Number(consultation.id));
        return {
          bill: `Bill ${consultation.id}`,
          Positive: billComments.filter(c => c.stance === 'Positive').length,
          Negative: billComments.filter(c => c.stance === 'Negative').length,
          Neutral: billComments.filter(c => c.stance === 'Neutral').length
        };
      })
    : [1, 2, 3].map((billId) => {
        const billComments = allComments.filter(c => Number(c.consultationId) === billId);
        return {
          bill: `Bill ${billId}`,
          Positive: billComments.filter(c => c.stance === 'Positive').length,
          Negative: billComments.filter(c => c.stance === 'Negative').length,
          Neutral: billComments.filter(c => c.stance === 'Neutral').length
        };
      });

  const keyInsights = [
    `${topStakeholders[0]?.[0] || 'Industry Body'} leads participation at ${(((Number(topStakeholders[0]?.[1]) || 0) / Math.max(totalComments, 1)) * 100).toFixed(1)}% of submissions`,
    `Bill ${mostDiscussedBill?.billId || 1} has the highest engagement with ${mostDiscussedBill?.total || 0} submissions, leaning ${mostDiscussedBill?.dominantStance || 'Neutral'}`,
    `Average model confidence is ${averageConfidencePercent}% across submitted feedback`,
    `Negative sentiment concentrates on Bill 2 with ${sentimentTrendData.find(d => d.bill === 'Bill 2')?.Negative ?? 0} critical comments`
  ];

  const getStakeholderIcon = (type: string) => {
    switch(type) {
      case 'Individual':
        return <Users className="h-6 w-6" />;
      case 'Industry Body':
        return <Building2 className="h-6 w-6" />;
      case 'NGO':
        return <Briefcase className="h-6 w-6" />;
      case 'Law Firm':
        return <FileText className="h-6 w-6" />;
      default:
        return <BookOpen className="h-6 w-6" />;
    }
  };

  const getIconBgColor = (index: number) => {
    switch(index) {
      case 0:
        return 'bg-primary text-primary-foreground';
      case 1:
        return 'bg-success text-white';
      case 2:
        return 'bg-warning text-white';
      case 3:
        return 'bg-info text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-secondary rounded-xl p-8 border">
        <h1 className="text-3xl font-bold text-foreground mb-2">Trend Analysis</h1>
        <p className="text-muted-foreground text-lg">
          Historical patterns and trends in e-consultation feedback over time
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {errorMessage}
        </div>
      ) : null}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Consultations</p>
                <p className="text-2xl font-bold">{loading ? '...' : consultations.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{loading ? '...' : totalSubmissionsFromDB}</p>
              </div>
              <Users className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stakeholder Types</p>
                <p className="text-2xl font-bold">{loading ? '...' : Object.keys(stakeholderTypes).length}</p>
              </div>
              <Building2 className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Confidence</p>
                <p className="text-2xl font-bold">{loading ? '...' : `${averageConfidencePercent}%`}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Active Stakeholders</CardTitle>
            <CardDescription>
              Stakeholder types by submission volume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topStakeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stakeholder data available from database.</p>
            ) : (
              topStakeholders.map(([type, count], index) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBgColor(index)}`}>
                      {getStakeholderIcon(type)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{type}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalComments > 0 ? ((Number(count) / totalComments) * 100).toFixed(1) : '0.0'}% of submissions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{Number(count)}</p>
                    <p className="text-xs text-muted-foreground">submissions</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Sentiment Distribution by Bill</CardTitle>
                <CardDescription>
                  Positive, Negative, and Neutral sentiment breakdown
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            ) : sentimentTrendData && sentimentTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={sentimentTrendData} margin={{ bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="bill" 
                    className="text-muted-foreground"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Number of Comments', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { 
                        fill: 'hsl(var(--foreground))',
                        fontSize: '12px',
                        fontWeight: 500
                      }
                    }}
                    className="text-muted-foreground"
                    style={{ fontSize: '12px', fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [value, 'Comments']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="Positive" 
                    fill="hsl(var(--success))" 
                    name="Positive Comments"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="Negative" 
                    fill="hsl(var(--destructive))" 
                    name="Negative Comments"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="Neutral" 
                    fill="hsl(var(--warning))" 
                    name="Neutral Comments"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-muted-foreground">No sentiment data available yet</p>
              </div>
            )}
          </CardContent>
          </Card>
      </div>

      {/* Live Data Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>
              Computed from current database records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {keyInsights.map((insight, index) => (
              <div key={index} className="p-4 bg-gradient-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Health</CardTitle>
            <CardDescription>
              Source and coverage of the live analytics feed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Total Records Loaded</span>
                <span className="text-sm font-semibold">{loading ? '...' : allComments.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Consultations Loaded</span>
                <span className="text-sm font-semibold">{loading ? '...' : consultations.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Data Source</span>
                <span className="text-sm font-semibold">PostgreSQL (live)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrendAnalysis;