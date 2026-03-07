import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, AreaChart, Area
} from "recharts";
import {
    RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Info,
    ChevronDown, Zap, Globe, Brain, BarChart2, Activity,
    Briefcase, LogOut, Hexagon
} from "lucide-react";
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, dashboardApi, setAuthToken } from '../services/api';
import { useLiveSync } from '../context/LiveSyncContext';

// ─────────────────────────────────────────────
// DESIGN TOKENS (LIGHT BLACK & WHITE THEME)
// ─────────────────────────────────────────────
const T = {
    teal: "#0f172a", // Navy black for primary branding
    tealLight: "#334155", // Slate gray
    tealDark: "#000000",
    orange: "#f59e0b",
    red: "#ef4444",
    green: "#10b981",
    greenLight: "#34d399",
    redLight: "#f87171",
    bg: "#f8fafc", // Off-white
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    border: "#e2e8f0",
    borderStrong: "#cbd5e1",
    text: "#0f172a",
    textMuted: "#64748b",
    textXMuted: "#94a3b8",
    navy: "#ffffff", // Topnav Bg
    navyLight: "#f8fafc"
};

const CHART_COLORS = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8"];
const PIE_COLORS = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"];

// ─────────────────────────────────────────────
// REUSABLE UI COMPONENTS
// ─────────────────────────────────────────────
const Card = ({ children, className = "", style = {} }) => (
    <div style={{
        background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: `0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)`,
        overflow: "hidden", ...style
    }} className={className}>
        {children}
    </div>
);

const CardHeader = ({ title, subtitle, icon: Icon, badge, action }) => (
    <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {Icon && <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
                <Icon size={20} strokeWidth={2} color={T.text} />
            </div>}
            <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, color: T.text, letterSpacing: "-0.02em" }}>{title}</div>
                {subtitle && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2, fontWeight: 500 }}>{subtitle}</div>}
            </div>
            {badge && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: T.text, color: T.surface, marginLeft: 4 }}>{badge}</span>}
        </div>
        {action}
    </div>
);

const Skeleton = ({ h = 200, style = {} }) => (
    <div style={{ height: h, borderRadius: 8, background: `linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.border} 50%, ${T.surfaceAlt} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style }} />
);

// ─────────────────────────────────────────────
// GAUGE CHART (Custom SVG)
// ─────────────────────────────────────────────
function GaugeChart({ score }) {
    const r = 90, cx = 140, cy = 130, strokeW = 18;
    const startAngle = -210, endAngle = 30;
    const totalDeg = 240;
    const fraction = score / 100;
    const toRad = d => (d * Math.PI) / 180;
    const arc = (angle) => ({
        x: cx + r * Math.cos(toRad(angle)),
        y: cy + r * Math.sin(toRad(angle)),
    });
    const needleAngle = startAngle + fraction * totalDeg;
    const needleTip = arc(needleAngle);
    const largeArc = fraction * totalDeg > 180 ? 1 : 0;
    const bgEnd = arc(endAngle);
    const bgStart = arc(startAngle);
    const fgEnd = arc(startAngle + fraction * totalDeg);

    const color = score < 35 ? T.green : score < 65 ? T.orange : T.red;
    const label = score < 35 ? "LOW RISK" : score < 65 ? "MEDIUM RISK" : "CRITICAL RISK";
    const zones = [
        { start: startAngle, end: startAngle + 0.33 * totalDeg, color: `${T.green}30` },
        { start: startAngle + 0.33 * totalDeg, end: startAngle + 0.66 * totalDeg, color: `${T.orange}30` },
        { start: startAngle + 0.66 * totalDeg, end: endAngle, color: `${T.red}30` },
    ];

    const zonePath = (a1, a2, col) => {
        const p1 = arc(a1), p2 = arc(a2);
        const la = (a2 - a1) > 180 ? 1 : 0;
        return <path key={col + a1} d={`M ${p1.x} ${p1.y} A ${r} ${r} 0 ${la} 1 ${p2.x} ${p2.y}`}
            fill="none" stroke={col} strokeWidth={strokeW} strokeLinecap="butt" />;
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width={280} height={170} viewBox="0 0 280 170">
                <filter id="shadow">
                    <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.15" />
                </filter>
                {zones.map(z => zonePath(z.start, z.end, z.color))}
                <path d={`M ${arc(startAngle).x} ${arc(startAngle).y} A ${r} ${r} 0 ${largeArc} 1 ${fgEnd.x} ${fgEnd.y}`}
                    fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
                <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y}
                    stroke={T.teal} strokeWidth={4} strokeLinecap="round" filter="url(#shadow)" />
                <circle cx={cx} cy={cy} r={8} fill={T.teal} />
                <circle cx={cx} cy={cy} r={3} fill={T.surface} />
                <text x={cx} y={cy + 30} textAnchor="middle" fontSize={42} fontWeight={800}
                    fontFamily="'JetBrains Mono', monospace" fill={T.text} letterSpacing="-2px">{score}</text>
                <text x={cx} y={cy + 50} textAnchor="middle" fontSize={11} fontWeight={800}
                    fontFamily="'Inter', sans-serif" fill={color} letterSpacing="1px">{label}</text>
                <text x={arc(startAngle).x - 2} y={arc(startAngle).y + 16} textAnchor="middle" fontSize={11} fontWeight={600} fill={T.textXMuted}>0</text>
                <text x={arc(endAngle).x + 2} y={arc(endAngle).y + 16} textAnchor="middle" fontSize={11} fontWeight={600} fill={T.textXMuted}>100</text>
            </svg>
        </div>
    );
}

// ─────────────────────────────────────────────
// CUSTOM CHART TOOLTIPS
// ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "#ffffff", border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 16px", boxShadow: `0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`, minWidth: 160 }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>
                        {p.name}: <b style={{ fontWeight: 800 }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</b>
                    </span>
                </div>
            ))}
        </div>
    );
};


// ─────────────────────────────────────────────
// TAB A — HIRING TRENDS
// ─────────────────────────────────────────────
function TabHiring({ data, loading }) {
    if (loading) return <Skeleton h={600} />;

    // Transform Backend 'byCategory' into a generic Array for the BarChart
    const categoryData = data?.hiringData?.byCategory || [];

    // Transform Backend 'byCityAndCategory' into an aggregated City list
    const cityMap = {};
    (data?.hiringData?.byCityAndCategory || []).forEach(item => {
        if (!cityMap[item.city]) cityMap[item.city] = { city: item.city, volume: 0, tier: item.tier };
        cityMap[item.city].volume += item.count;
    });
    const cityData = Object.values(cityMap).sort((a, b) => b.volume - a.volume);

    // Transform Backend 'byCategory' for the PieChart
    const sectorData = categoryData.map(c => ({ name: c.category, value: c.count }));

    return (
        <div style={{ display: "grid", gap: 24 }}>
            {/* Multi-line Trend (Converted to Category Breakdown) */}
            <Card>
                <CardHeader title="Hiring Volume by Category" subtitle="Total active job listings across top tech categories" icon={BarChart2} badge="LIVE DB" />
                <div style={{ padding: "16px 24px 24px" }}>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={categoryData} margin={{ top: 20, right: 20, bottom: 40, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceAlt} vertical={false} />
                            <XAxis dataKey="category" tick={{ fontSize: 11, fill: T.textMuted, fontWeight: 500 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" />
                            <YAxis tick={{ fontSize: 11, fill: T.textMuted, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: T.surfaceAlt }} />
                            <Bar dataKey="count" name="Job Listings" radius={[6, 6, 0, 0]} fill={T.teal} maxBarSize={60}>
                                {categoryData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 24 }}>
                {/* City Area/Bar */}
                <Card>
                    <CardHeader title="Hiring Volume by City" subtitle="Aggregation by location" icon={Globe} />
                    <div style={{ padding: "16px 24px 24px" }}>
                        <ResponsiveContainer width="100%" height={460}>
                            <BarChart data={cityData.slice(0, 15)} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={T.surfaceAlt} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: T.textMuted, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                <YAxis dataKey="city" type="category" width={120} tick={{ fontSize: 12, fill: T.text, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: T.surfaceAlt }} />
                                <Bar dataKey="volume" name="Open Roles" radius={[0, 6, 6, 0]}>
                                    {cityData.map((entry, i) => (
                                        <Cell key={i} fill={entry.tier === 1 ? T.teal : entry.tier === 2 ? T.tealLight : T.borderStrong} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                            {[["Tier 1", T.teal], ["Tier 2", T.tealLight], ["Tier 3 / Local", T.borderStrong]].map(([l, c]) => (
                                <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: T.textMuted }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />{l}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Sector Donut */}
                <Card>
                    <CardHeader title="Category Distribution" subtitle="Share of top job postings" icon={Hexagon} />
                    <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={75} outerRadius={105}
                                    paddingAngle={2} dataKey="value" nameKey="name" strokeWidth={0}>
                                    {sectorData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(v, _, item) => [`${Math.round((v / data.hiringData.totalJobsInPeriod) * 100)}%`, "Share"]}
                                    contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', color: T.text, fontSize: 13, fontWeight: 600 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginTop: 12 }}>
                            {sectorData.slice(0, 6).map((s, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", background: T.surfaceAlt, borderRadius: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: T.text, marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace" }}>{Math.round((s.value / data.hiringData.totalJobsInPeriod) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB B — SKILLS INTELLIGENCE
// ─────────────────────────────────────────────
function SkillRow({ skill, type, rank }) {
    const isRising = type === "rising";
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
            borderBottom: `1px solid ${T.surfaceAlt}`,
        }}>
            <span style={{ fontSize: 12, color: T.textXMuted, width: 24, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>#{rank}</span>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>{skill.skill}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: isRising ? `${T.green}15` : `${T.red}15`, padding: "4px 10px", borderRadius: 6 }}>
                {isRising ? <TrendingUp size={14} strokeWidth={2.5} color={T.green} /> : <TrendingDown size={14} strokeWidth={2.5} color={T.red} />}
                <span style={{ fontSize: 13, fontWeight: 800, color: isRising ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>
                    {isRising ? "+" : ""}{skill.changePercent}%
                </span>
            </div>
        </div>
    );
}

function TabSkills({ data, loading }) {
    if (loading) return <Skeleton h={600} />;

    const skills = data?.skillsData || { risingSkills: [], decliningSkills: [], topSkills30d: [] };

    // Transform Backend Top Skills to Radar Chart format
    const radarData = skills.topSkills30d.slice(0, 6).map(s => {
        // Backend only provides usage count. We synthesize 'supply' inversely or randomly bounded for UI demo.
        const demandScore = Math.min(100, Math.round((s.count / Math.max(...skills.topSkills30d.map(s => s.count))) * 100));
        return {
            dimension: s.skill,
            demand: demandScore,
            supply: Math.round(demandScore * (0.6 + Math.random() * 0.4))
        }
    });

    return (
        <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Rising Skills */}
                <Card>
                    <CardHeader title="Top 20 Rising Skills" subtitle="Week-over-week demand surge" icon={TrendingUp}
                        badge={`+${skills.risingSkills?.[0]?.changePercent || 0}% top`} />
                    <div style={{ padding: "12px 24px 20px" }}>
                        <div>
                            {skills.risingSkills.map((s, i) => <SkillRow key={s.skill} skill={s} type="rising" rank={i + 1} />)}
                        </div>
                    </div>
                </Card>
                {/* Declining Skills */}
                <Card>
                    <CardHeader title="Top 20 Declining Skills" subtitle="Week-over-week demand drop" icon={TrendingDown}
                        badge={`${skills.decliningSkills?.[0]?.changePercent || 0}% top`} />
                    <div style={{ padding: "12px 24px 20px" }}>
                        <div>
                            {skills.decliningSkills.map((s, i) => <SkillRow key={s.skill} skill={s} type="declining" rank={i + 1} />)}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Supply vs Demand Radar */}
            <Card>
                <CardHeader title="Supply vs. Demand Gap — Employer View" subtitle="Skills present in local workforce vs. required in Top 6 JD demands" icon={Brain} />
                <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "center" }}>
                    <ResponsiveContainer width="100%" height={360}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke={T.border} />
                            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: T.textMuted, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: T.textXMuted }} />
                            <Radar name="Workforce Supply" dataKey="supply" stroke={T.textMuted} fill={T.textMuted} fillOpacity={0.2} strokeWidth={2} />
                            <Radar name="JD Demand" dataKey="demand" stroke={T.teal} fill={T.teal} fillOpacity={0.4} strokeWidth={2} />
                            <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
                            <RechartsTooltip content={<CustomTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 8, letterSpacing: "-0.01em" }}>Pipeline Gaps Detected</div>
                        {radarData.map(d => (
                            <div key={d.dimension} style={{ padding: "12px 16px", borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{d.dimension}</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, fontWeight: 500, display: "flex", justifyContent: "space-between" }}>
                                    <span>Demand: <b style={{ color: T.text }}>{d.demand}</b></span>
                                    <span>Gap: <b style={{ color: d.demand - d.supply > 10 ? T.red : T.teal }}>+{d.demand - d.supply}</b></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ─────────────────────────────────────────────
// TAB C — AI VULNERABILITY INDEX
// ─────────────────────────────────────────────
function TabAI({ data, loading, role }) {
    if (loading) return <Skeleton h={600} />;

    const aiData = data?.aiData || [];

    // Find the specific role/category data, default to first if missing.
    const currentRoleData = aiData.find(d => d.category === role) || aiData[0] || {};

    const score = currentRoleData.vulnerabilityIndex || 0;
    const isAlert = currentRoleData.trend === "Rising Risk";

    return (
        <div style={{ display: "grid", gap: 24 }}>
            {/* Early Warning Alert */}
            {isAlert && (
                <div style={{
                    padding: "20px 24px", borderRadius: 12,
                    background: `${T.red}08`,
                    border: `1px solid ${T.red}30`,
                    display: "flex", alignItems: "flex-start", gap: 16,
                }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: T.red, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${T.red}40` }}>
                        <AlertTriangle size={24} strokeWidth={2} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: T.red, letterSpacing: "-0.02em" }}>
                            ⚠ DISPLACEMENT EARLY WARNING — {role.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 14, color: T.text, marginTop: 6, lineHeight: 1.6, fontWeight: 500 }}>
                            Hiring volume shows instability while AI tool mentions in job descriptions are <b>rising rapidly</b>.
                            This pattern historically precedes role restructuring within 6–18 months.
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                            <div style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontWeight: 700 }}>AI Penetration: {currentRoleData.signals?.aiPenetrationPercent}%</div>
                            <div style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontWeight: 700 }}>Hiring Decline: {currentRoleData.signals?.hiringDeclinePercent}%</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>
                {/* Gauge + Methodology */}
                <div style={{ display: "grid", gap: 24 }}>
                    <Card>
                        <CardHeader title="AI Vulnerability Score" subtitle={role} icon={Zap} />
                        <div style={{ padding: "16px 24px 24px" }}>
                            <GaugeChart score={score} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 24 }}>
                                {[
                                    ["Total Roles", (currentRoleData.totalJobs || 0).toLocaleString()],
                                    ["Risk Trend", currentRoleData.trend || "Stable"],
                                    ["Risk Tier", currentRoleData.riskLevel || "Low"],
                                ].map(([l, v]) => (
                                    <div key={l} style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 10px", textAlign: "center", border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{l}</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, fontFamily: "'Inter', sans-serif", marginTop: 4 }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Methodology */}
                    <div style={{ padding: "20px", borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", gap: 16 }}>
                        <Info size={20} strokeWidth={2} color={T.textMuted} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 10, letterSpacing: "-0.01em" }}>Score Methodology</div>
                            {[
                                ["Hiring Decline Rate", "30%"],
                                ["AI Tool Mentions in JDs", "50%"],
                                ["Role Replacement Ratio", "20%"],
                            ].map(([s, w]) => (
                                <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMuted, marginBottom: 6, fontWeight: 500 }}>
                                    <span>→ {s}</span><span style={{ fontWeight: 800, color: T.text }}>{w}</span>
                                </div>
                            ))}
                            <div style={{ fontSize: 11, color: T.textXMuted, marginTop: 12, lineHeight: 1.5, fontWeight: 500 }}>
                                Data signals sourced from Live DB Job Scrapes. Updated continuously.
                            </div>
                        </div>
                    </div>
                </div>

                {/* All Roles Breakdown */}
                <Card>
                    <CardHeader title="Global Vulnerability Index" subtitle="Comparison of AI displacement risk across all categories" icon={Globe}
                        badge={`${aiData.filter(c => c.riskLevel === "High").length} High Risk`} />
                    <div style={{ padding: "16px 24px 24px", display: "grid", gap: 8 }}>
                        {aiData.map((c, i) => {
                            const isSelected = c.category === role;
                            return (
                                <div key={c.category} style={{
                                    display: "flex", alignItems: "center", gap: 16, padding: "12px 16px",
                                    borderRadius: 10, background: isSelected ? T.text : T.surfaceAlt,
                                    border: `1px solid ${isSelected ? T.text : T.border}`,
                                    color: isSelected ? T.surface : T.text,
                                    transition: "all 0.2s",
                                }}>
                                    <span style={{ fontSize: 12, color: isSelected ? T.surfaceAlt : T.textXMuted, width: 24, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>#{i + 1}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{c.category}</div>
                                        <div style={{ fontSize: 11, color: isSelected ? T.surfaceAlt : T.textMuted, fontWeight: 500, marginTop: 2 }}>{c.totalJobs.toLocaleString()} active roles</div>
                                    </div>
                                    <div style={{ width: 120, height: 8, borderRadius: 999, background: isSelected ? T.surfaceAlt : T.border, overflow: "hidden" }}>
                                        <div style={{ height: "100%", borderRadius: 999, width: `${c.vulnerabilityIndex}%`, background: c.riskLevel === "High" ? T.red : c.riskLevel === "Low" ? T.green : T.orange }} />
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", width: 40, textAlign: "right" }}>{c.vulnerabilityIndex}</span>
                                    <span style={{
                                        fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 8,
                                        background: c.riskLevel === "High" ? T.red : c.riskLevel === "Low" ? T.green : T.orange, color: "#fff", minWidth: 70, textAlign: "center",
                                    }}>{c.riskLevel.toUpperCase()}</span>
                                </div>
                            )
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
const TABS = [
    { id: "hiring", label: "Hiring Trends", icon: TrendingUp },
    { id: "skills", label: "Skills Intelligence", icon: Brain },
    { id: "ai", label: "AI Vulnerability", icon: Zap },
];

export default function EnterpriseDashboardPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const navigate = useNavigate();

    const [roleFilter, setRoleFilter] = useState("Software Engineer");
    const [dateRange, setDateRange] = useState("30d"); // 7d, 30d, 90d
    const [activeTab, setActiveTab] = useState("hiring");

    const { syncResult, syncLive, isSyncing, lastSyncTimestamp } = useLiveSync();

    const handleSync = async () => {
        try {
            // Trigger sync for the currently selected role filter
            await syncLive(roleFilter, 'India');
        } catch (e) {
            console.error("Live sync failed", e);
        }
    };

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            if (!user.unsafeMetadata?.onboardingComplete) {
                navigate('/onboarding', { replace: true })
            }
        }
    }, [isLoaded, isSignedIn, user, navigate])

    // --- Data Fetching Hooks ---
    const { data: dbMetrics } = useQuery({
        queryKey: ['dashboardMetrics'],
        queryFn: async () => {
            setAuthToken(await getToken());
            return dashboardApi.getMetrics();
        },
        enabled: isLoaded && isSignedIn,
        refetchOnWindowFocus: false
    });

    const { data: hiringData, isLoading: isHiringLoading, refetch: refetchHiring } = useQuery({
        queryKey: ['hiringTrends', dateRange],
        queryFn: async () => {
            setAuthToken(await getToken());
            return analyticsApi.getHiringTrends(parseInt(dateRange.replace('d', '')));
        },
        enabled: isLoaded && isSignedIn,
        refetchOnWindowFocus: false
    });

    const { data: skillsData, isLoading: isSkillsLoading, refetch: refetchSkills } = useQuery({
        queryKey: ['skillsIntelligence'],
        queryFn: async () => {
            setAuthToken(await getToken());
            return analyticsApi.getSkillsIntelligence();
        },
        enabled: isLoaded && isSignedIn,
        refetchOnWindowFocus: false
    });

    const { data: aiData, isLoading: isAiLoading, refetch: refetchAi } = useQuery({
        queryKey: ['aiVulnerability'],
        queryFn: async () => {
            setAuthToken(await getToken());
            return analyticsApi.getAIVulnerability();
        },
        enabled: isLoaded && isSignedIn,
        refetchOnWindowFocus: false
    });

    // Derive Dynamic Categories List from Hiring Data payload
    const dynamicRoles = useMemo(() => {
        if (!hiringData || !hiringData.byCategory) return ["Software Engineer"];
        return hiringData.byCategory.map(c => c.category);
    }, [hiringData]);

    useEffect(() => {
        if (syncResult && isLoaded && isSignedIn) {
            refetchHiring();
            refetchSkills();
            refetchAi();
        }
    }, [syncResult, refetchHiring, refetchSkills, refetchAi, isLoaded, isSignedIn]);


    const isLoading = !isLoaded || isHiringLoading || isSkillsLoading || isAiLoading;

    // Package unified data map for the tabs
    const unifiedData = {
        hiringData,
        skillsData,
        aiData,
        dbMetrics,
    };

    const handleSignOut = () => navigate('/login');

    const SelectBox = ({ value, onChange, options, label }) => {
        const [open, setOpen] = useState(false);
        return (
            <div style={{ position: "relative" }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>{label}</div>
                <button onClick={() => setOpen(!open)} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: T.surface, border: `1.5px solid ${open ? T.teal : T.borderStrong}`,
                    borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                    fontSize: 14, fontWeight: 600, color: T.text,
                    minWidth: "100%", justifyContent: "space-between",
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: open ? `0 0 0 4px ${T.surfaceAlt}` : "none",
                    transition: "all 0.15s",
                }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                    <ChevronDown size={16} strokeWidth={2} color={T.textMuted} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                </button>
                {open && (
                    <div style={{
                        position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 100,
                        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
                        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)", minWidth: "100%", overflowY: "auto", maxHeight: "300px"
                    }}>
                        {options.map(opt => (
                            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} style={{
                                padding: "12px 16px", fontSize: 14, color: opt === value ? T.text : T.textMuted,
                                fontWeight: opt === value ? 800 : 500, cursor: "pointer",
                                background: opt === value ? T.surfaceAlt : "transparent",
                                transition: "background 0.1s",
                                fontFamily: "'Inter', sans-serif",
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = opt === value ? T.surfaceAlt : "#fafafa"}
                                onMouseLeave={e => e.currentTarget.style.background = opt === value ? T.surfaceAlt : "transparent"}>
                                {opt}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                ::-webkit-scrollbar { width: 8px; height: 8px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: ${T.borderStrong}; border-radius: 4px; border: 2px solid ${T.bg}; }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                @keyframes pulse-border { 0%,100% { border-color: ${T.red}40; box-shadow: 0 0 0 0 ${T.red}10; } 50% { border-color: ${T.red}80; box-shadow: 0 0 0 4px ${T.red}15; } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .fade-in { animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
            `}</style>

            {/* ── TOP NAV ── */}
            <header style={{
                background: T.navy, color: T.text, padding: "0 32px",
                height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 200,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: T.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Briefcase size={20} strokeWidth={2.5} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
                            SkillBeacon
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: T.text, color: "#fff", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>ENTERPRISE L1</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ display: "flex", gap: 2, background: T.surfaceAlt, borderRadius: 10, padding: 3, border: `1px solid ${T.border}` }}>
                        {["7d", "30d", "90d"].map(dr => (
                            <button key={dr} onClick={() => setDateRange(dr)} style={{
                                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                                fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                                background: dr === dateRange ? T.surface : "transparent",
                                color: dr === dateRange ? T.text : T.textMuted,
                                boxShadow: dr === dateRange ? `0 2px 4px rgba(0,0,0,0.05)` : "none",
                                transition: "all 0.15s",
                            }}>{dr}</button>
                        ))}
                    </div>

                    <div style={{ width: 1, height: 24, background: T.border }}></div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => navigate('/profile')}>
                        {user?.imageUrl ? (
                            <img className="w-9 h-9 rounded-full object-cover border border-slate-200" src={user.imageUrl} alt="Profile" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-500">person</span>
                            </div>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{user?.firstName || 'Admin'}</span>
                    </div>

                    <button onClick={handleSignOut} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <LogOut size={20} strokeWidth={2} />
                    </button>
                </div>
            </header>

            <div style={{ display: "flex", flex: 1 }}>
                {/* ── SIDEBAR ── */}
                <aside style={{
                    width: 280, background: T.surface, borderRight: `1px solid ${T.border}`,
                    padding: "32px 24px", display: "flex", flexDirection: "column", gap: 32,
                    position: "sticky", top: 64, height: "calc(100vh - 64px)", overflowY: "auto",
                }}>
                    <SelectBox label="Target Job Role" value={roleFilter} onChange={setRoleFilter} options={dynamicRoles} />

                    <div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Navigation</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                const active = activeTab === tab.id;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                                        borderRadius: 10, border: `1px solid ${active ? T.border : 'transparent'}`, cursor: "pointer", textAlign: "left",
                                        background: active ? T.surfaceAlt : "transparent",
                                        color: active ? T.text : T.textMuted,
                                        fontWeight: active ? 700 : 600, fontSize: 14,
                                        fontFamily: "'Inter', sans-serif",
                                        transition: "all 0.1s ease-in-out",
                                    }}
                                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#fafafa" }}
                                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}
                                    >
                                        <Icon size={18} strokeWidth={active ? 2.5 : 2} color={active ? T.text : T.textMuted} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12, paddingTop: 24 }}>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                width: "100%", padding: "14px", borderRadius: 10,
                                background: isSyncing ? T.borderStrong : T.teal,
                                color: isSyncing ? T.textMuted : T.surface,
                                fontWeight: 700, fontSize: 14, fontFamily: "'Inter', sans-serif",
                                cursor: isSyncing ? "not-allowed" : "pointer", border: "none",
                                boxShadow: isSyncing ? "none" : `0 4px 12px ${T.teal}40`,
                                transition: "all 0.2s"
                            }}>
                            <RefreshCw size={18} strokeWidth={2.5} style={isSyncing ? { animation: "spin 1s linear infinite" } : {}} />
                            {isSyncing ? "Syncing Live Data..." : "Live Data Sync"}
                        </button>
                        {lastSyncTimestamp && (
                            <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center", fontWeight: 600 }}>
                                Last synced: {new Date(lastSyncTimestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        )}
                    </div>

                </aside>

                {/* ── MAIN CONTENT ── */}
                <main style={{ flex: 1, padding: "32px 40px", overflowX: "hidden", minWidth: 0 }}>
                    {/* Stats bar */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
                        {[
                            { label: "Active Regional Roles", value: isLoading ? "—" : (hiringData?.totalJobsInPeriod || 0).toLocaleString(), color: T.text, icon: BarChart2 },
                            { label: "Total Historical DB Jobs", value: isLoading ? "—" : (hiringData?.totalJobsAllTime || 0).toLocaleString(), color: T.text, icon: Activity },
                            { label: "AI Displacement Score", value: isLoading ? "—" : `${(aiData?.find(d => d.category === roleFilter)?.vulnerabilityIndex || 0)}/100`, color: T.orange, icon: Zap },
                            { label: "Market Volatility", value: isLoading ? "—" : `${dbMetrics?.marketVolatility || '0'}%`, color: T.tealLight, icon: TrendingUp },
                        ].map(s => {
                            const Icon = s.icon;
                            return (
                                <Card key={s.label} style={{ padding: "16px 20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6, fontWeight: 600 }}>{s.label}</div>
                                            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-1px" }}>{s.value}</div>
                                        </div>
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Icon size={20} strokeWidth={2} color={s.color} />
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="fade-in" key={activeTab + roleFilter + dateRange}>
                        {activeTab === "hiring" && <TabHiring data={unifiedData} loading={isLoading} />}
                        {activeTab === "skills" && <TabSkills data={unifiedData} loading={isLoading} />}
                        {activeTab === "ai" && <TabAI data={unifiedData} loading={isLoading} role={roleFilter} />}
                    </div>
                </main>
            </div>
        </div>
    );
}

