import React, { useState, useMemo } from 'react';
import { DogProfile, DailyActivityRecord } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Flame,
  Footprints,
  Brain,
  Trophy,
  TrendingUp,
  Clock,
  Compass,
  Plus,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface DogActivityReportProps {
  dog: DogProfile;
  activityHistory: DailyActivityRecord[];
  onAddActivity?: (record: DailyActivityRecord) => void;
}

export const DogActivityReport: React.FC<DogActivityReportProps> = ({
  dog,
  activityHistory,
  onAddActivity,
}) => {
  const [selectedView, setSelectedView] = useState<'duration' | 'calories'>('duration');
  const [showAddActivityModal, setShowAddActivityModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for new activity registration
  const [newDayLabel, setNewDayLabel] = useState<string>('Hoje');
  const [newWalkingMin, setNewWalkingMin] = useState<number>(dog.dailyExerciseMin > 0 ? Math.round(dog.dailyExerciseMin * 0.7) : 45);
  const [newPlayMin, setNewPlayMin] = useState<number>(25);
  const [newCognitiveMin, setNewCognitiveMin] = useState<number>(dog.cognitiveMin || 20);
  const [newDistanceKm, setNewDistanceKm] = useState<number>(3.5);
  const [newIntensity, setNewIntensity] = useState<'leve' | 'moderada' | 'intensa'>('moderada');
  const [newNotes, setNewNotes] = useState<string>('Passeio no parque e enriquecimento mental');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter activities for this active dog
  const dogActivities = useMemo(() => {
    const list = activityHistory.filter((a) => a.dogId === dog.id);
    if (list.length > 0) return list;
    // Fallback if no specific dog activities found
    return activityHistory.slice(0, 7);
  }, [activityHistory, dog.id]);

  // Aggregate weekly metrics
  const weeklyMetrics = useMemo(() => {
    const totalWalking = dogActivities.reduce((acc, a) => acc + (a.walkingMinutes || 0), 0);
    const totalPlay = dogActivities.reduce((acc, a) => acc + (a.playMinutes || 0), 0);
    const totalCognitive = dogActivities.reduce((acc, a) => acc + (a.cognitiveMinutes || 0), 0);
    const totalExercise = totalWalking + totalPlay;
    const totalDistance = dogActivities.reduce((acc, a) => acc + (a.distanceKm || 0), 0);
    const totalCalories = dogActivities.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);

    const targetDailyTotal = dog.dailyExerciseMin + (dog.cognitiveMin || 20);
    const targetWeeklyMinutes = targetDailyTotal * Math.max(dogActivities.length, 7);
    const totalActivityMinutes = totalExercise + totalCognitive;
    const completionRate = targetWeeklyMinutes > 0 ? Math.round((totalActivityMinutes / targetWeeklyMinutes) * 100) : 100;
    const averageDailyMinutes = dogActivities.length > 0 ? Math.round(totalActivityMinutes / dogActivities.length) : targetDailyTotal;

    return {
      totalWalking,
      totalPlay,
      totalCognitive,
      totalExercise,
      totalDistance: Number(totalDistance.toFixed(1)),
      totalCalories,
      completionRate,
      averageDailyMinutes,
      targetDailyTotal,
    };
  }, [dogActivities, dog.dailyExerciseMin, dog.cognitiveMin]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    return dogActivities.map((a) => ({
      day: a.dayLabel,
      caminhada: a.walkingMinutes,
      brincadeira: a.playMinutes,
      cognitivo: a.cognitiveMinutes,
      total: a.walkingMinutes + a.playMinutes + a.cognitiveMinutes,
      calorias: a.caloriesBurned,
      distancia: a.distanceKm,
      intensidade: a.intensity,
      notas: a.notes,
    }));
  }, [dogActivities]);

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const walkingCalories = newWalkingMin * 4.2;
    const playCalories = newPlayMin * 5.0;
    const calculatedCalories = Math.round((walkingCalories + playCalories) * (dog.currentWeight / 30));

    const newRecord: DailyActivityRecord = {
      id: 'act-' + Date.now(),
      dogId: dog.id,
      date: new Date().toISOString().split('T')[0],
      dayLabel: newDayLabel,
      walkingMinutes: Number(newWalkingMin),
      playMinutes: Number(newPlayMin),
      cognitiveMinutes: Number(newCognitiveMin),
      distanceKm: Number(newDistanceKm),
      caloriesBurned: calculatedCalories,
      intensity: newIntensity,
      notes: newNotes,
    };

    if (onAddActivity) {
      onAddActivity(newRecord);
    }
    setShowAddActivityModal(false);
    showToast(`Atividade de ${newRecord.walkingMinutes + newRecord.playMinutes + newRecord.cognitiveMinutes} min registrada para ${dog.name}!`);
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/80">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-slate-900 font-heading">
                Relatório de Atividade & Exercício Semanal
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Histórico diário de gasto aeróbico, caminhadas e estímulos cognitivos para <strong>{dog.name}</strong> ({dog.breed})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle (Duration vs Calories) */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setSelectedView('duration')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedView === 'duration'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Minutos</span>
            </button>
            <button
              onClick={() => setSelectedView('calories')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedView === 'calories'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Calorias (kcal)</span>
            </button>
          </div>

          {/* Add Activity Button */}
          <button
            onClick={() => setShowAddActivityModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Registrar Hoje</span>
          </button>
        </div>
      </div>

      {/* Weekly Performance Stats Ribbon (4 Bento Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Meta Semanal */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Meta da Semana</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-900">
              {weeklyMetrics.completionRate}%
            </span>
            <span className="text-[11px] text-slate-500">concluído</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                weeklyMetrics.completionRate >= 90 ? 'bg-emerald-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(weeklyMetrics.completionRate, 100)}%` }}
            />
          </div>
          <span className="block text-[10px] text-slate-500">
            Meta: {dog.dailyExerciseMin + dog.cognitiveMin} min/dia ({dog.breed})
          </span>
        </div>

        {/* Card 2: Tempo Total de Exercício */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Exercício Total</span>
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">
            {weeklyMetrics.totalExercise + weeklyMetrics.totalCognitive}{' '}
            <span className="text-xs font-normal text-slate-500">min</span>
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>Média: <strong>{weeklyMetrics.averageDailyMinutes}m/dia</strong></span>
            <span className="text-emerald-700 font-semibold">✓ Ativo</span>
          </div>
        </div>

        {/* Card 3: Distância Percorrida */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Distância em Caminhadas</span>
            <Compass className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">
            {weeklyMetrics.totalDistance}{' '}
            <span className="text-xs font-normal text-slate-500">km</span>
          </p>
          <span className="block text-[10px] text-slate-500 pt-1">
            Média de ~{(weeklyMetrics.totalDistance / Math.max(dogActivities.length, 1)).toFixed(1)} km por passeio diário
          </span>
        </div>

        {/* Card 4: Queima Calórica Semanal */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Gasto Calórico Estimado</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-700">
            {weeklyMetrics.totalCalories.toLocaleString('pt-BR')}{' '}
            <span className="text-xs font-normal text-slate-500">kcal</span>
          </p>
          <span className="block text-[10px] text-slate-500 pt-1">
            Equilíbrio energético com a dieta de {dog.dietGramsPerDay}g/dia
          </span>
        </div>
      </div>

      {/* Main Interactive Recharts Chart */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span>Distribuição Semanal por Modalidade:</span>
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block"></span>
                <span>Caminhada</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-teal-500 inline-block"></span>
                <span>Brincadeiras</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block"></span>
                <span>Estímulo Cognitivo</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
            <span>Meta Diária: <strong>{weeklyMetrics.targetDailyTotal} min</strong></span>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-64 w-full bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
          {selectedView === 'duration' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                />
                <YAxis
                  unit="m"
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[190px]">
                          <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                            <span className="font-bold">{label} • Detalhes da Atividade</span>
                            <span className="text-[10px] text-orange-400 font-mono">{data.total} min total</span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-orange-300">🚶 Caminhada:</span>
                              <strong>{data.caminhada} min</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-teal-300">🎾 Brincadeira:</span>
                              <strong>{data.brincadeira} min</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-indigo-300">🧩 Cognitivo:</span>
                              <strong>{data.cognitivo} min</strong>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-300">
                              <span>Distância percorrida:</span>
                              <strong>{data.distancia} km</strong>
                            </div>
                            <div className="flex justify-between text-[10px] text-rose-300">
                              <span>Gasto estimado:</span>
                              <strong>{data.calorias} kcal</strong>
                            </div>
                          </div>
                          {data.notas && (
                            <p className="text-[10px] italic text-slate-400 pt-1 border-t border-slate-800">
                              "{data.notas}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={weeklyMetrics.targetDailyTotal}
                  stroke="#E11D48"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Meta: ${weeklyMetrics.targetDailyTotal}m`,
                    position: 'top',
                    fill: '#E11D48',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="caminhada" name="Caminhada" stackId="a" fill="#F97316" radius={[0, 0, 0, 0]} />
                <Bar dataKey="brincadeira" name="Brincadeiras" stackId="a" fill="#14B8A6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cognitivo" name="Cognitivo" stackId="a" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="caloriaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                />
                <YAxis
                  unit=" kcal"
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-bold border-b border-slate-700 pb-1">{label} • Gasto Calórico</p>
                          <p className="text-sm font-mono font-bold text-rose-400">{data.calorias} kcal queimadas</p>
                          <p className="text-[10px] text-slate-300">Tempo total de exercício: {data.total} min</p>
                          <p className="text-[10px] text-slate-400">Distância: {data.distancia} km</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calorias"
                  name="Calorias Queimadas"
                  stroke="#E11D48"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#caloriaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Routine Recommendations based on Breed */}
      <div className="p-3.5 bg-orange-50/60 border border-orange-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-orange-950">
        <div className="flex items-start gap-2.5">
          <Brain className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Recomendação Cinotécnica para {dog.breed}:</span>
            <p className="text-[11px] text-orange-900 leading-relaxed">
              Cães do grupo <strong>{dog.breedGroup}</strong> demandam pelo menos <strong>{dog.dailyExerciseMin} min de exercício aeróbico</strong> e <strong>{dog.cognitiveMin} min de estímulo mental diário</strong> para prevenir estresse, sedentarismo e problemas articulares.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="px-2.5 py-1 bg-white rounded-lg border border-orange-200 text-orange-800 font-bold text-[11px]">
            {weeklyMetrics.completionRate >= 90 ? '✓ Rotina Exemplar' : 'Atenção aos Passeios'}
          </span>
        </div>
      </div>

      {/* Modal: Registrar Atividade Diária */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm text-slate-900 font-heading">
                  Registrar Exercício de Hoje para {dog.name}
                </h3>
              </div>
              <button
                onClick={() => setShowAddActivityModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dia / Identificação:
                  </label>
                  <input
                    type="text"
                    required
                    value={newDayLabel}
                    onChange={(e) => setNewDayLabel(e.target.value)}
                    placeholder="Ex: Hoje ou Seg"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Distância Estimada (km):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={newDistanceKm}
                    onChange={(e) => setNewDistanceKm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-orange-700 mb-1">
                    Caminhada (min):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newWalkingMin}
                    onChange={(e) => setNewWalkingMin(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-teal-700 mb-1">
                    Brincadeiras (min):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPlayMin}
                    onChange={(e) => setNewPlayMin(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-indigo-700 mb-1">
                    Cognitivo (min):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newCognitiveMin}
                    onChange={(e) => setNewCognitiveMin(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Intensity */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Intensidade do Exercício:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['leve', 'moderada', 'intensa'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewIntensity(lvl)}
                      className={`py-1.5 rounded-lg border text-center capitalize transition-colors ${
                        newIntensity === lvl
                          ? 'bg-slate-900 text-white font-bold border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações do Tutor:
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Treino de obediência e passeio com amigos no parque"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddActivityModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Salvar Registro de Exercício
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
