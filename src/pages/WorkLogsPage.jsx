import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import {
  ClipboardList,
  Plus,
  Users,
  Boxes,
  SunMedium,
  AlertCircle,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';

export const WorkLogsPage = () => {
  const { activeProject } = useAuth();
  const { t } = useLanguage();

  const [workLogs, setWorkLogs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [workDescription, setWorkDescription] = useState('');
  const [weather, setWeather] = useState('Clear & Sunny');
  const [delayReason, setDelayReason] = useState('');
  const [workProgressPercent, setWorkProgressPercent] = useState(0);
  const [autoDeductStock, setAutoDeductStock] = useState(true);

  const [labourBreakdown, setLabourBreakdown] = useState([
    { category: 'Mistri / Mason (कारीगर)', count: 2, wagePerLabour: 900 },
    { category: 'Beldar / Helper (मजदूर)', count: 4, wagePerLabour: 600 },
  ]);

  const [materialsConsumed, setMaterialsConsumed] = useState([]);

  const loadData = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const [logsRes, matRes] = await Promise.all([
        api.getWorkLogs(),
        api.getMaterials(),
      ]);

      if (logsRes.success) setWorkLogs(logsRes.data);
      if (matRes.success) setMaterials(matRes.data);
    } catch (err) {
      console.error('Error fetching work logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?._id]);

  const openAddModal = () => {
    setTitle('');
    setDate(new Date().toISOString().slice(0, 10));
    setWorkDescription('');
    setWeather('Clear & Sunny');
    setDelayReason('');
    setWorkProgressPercent(activeProject.manualProgressPercent || 0);
    setLabourBreakdown([
      { category: 'Mistri / Mason (कारीगर)', count: 2, wagePerLabour: 900 },
      { category: 'Beldar / Helper (मजदूर)', count: 4, wagePerLabour: 600 },
    ]);
    setMaterialsConsumed([]);
    setError('');
    setAddModalOpen(true);
  };

  const addLabourRow = () => {
    setLabourBreakdown([
      ...labourBreakdown,
      { category: 'Helper / Labour', count: 1, wagePerLabour: 600 },
    ]);
  };

  const removeLabourRow = (idx) => {
    setLabourBreakdown(labourBreakdown.filter((_, i) => i !== idx));
  };

  const updateLabourRow = (idx, field, value) => {
    const updated = [...labourBreakdown];
    updated[idx][field] = value;
    setLabourBreakdown(updated);
  };

  const addMaterialRow = () => {
    if (materials.length === 0) {
      alert('No materials defined in project catalog yet.');
      return;
    }
    setMaterialsConsumed([
      ...materialsConsumed,
      { material: materials[0]._id, quantity: 1, unit: materials[0].stockUnit },
    ]);
  };

  const removeMaterialRow = (idx) => {
    setMaterialsConsumed(materialsConsumed.filter((_, i) => i !== idx));
  };

  const updateMaterialRow = (idx, field, value) => {
    const updated = [...materialsConsumed];
    updated[idx][field] = value;
    if (field === 'material') {
      const selectedMat = materials.find((m) => m._id === value);
      if (selectedMat) updated[idx].unit = selectedMat.stockUnit;
    }
    setMaterialsConsumed(updated);
  };

  const totalDailyWage = labourBreakdown.reduce(
    (acc, l) => acc + (Number(l.count) || 0) * (Number(l.wagePerLabour) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title / Summary is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.createWorkLog({
        title: title.trim(),
        date,
        workDescription,
        weather,
        delayReason,
        workProgressPercent: Number(workProgressPercent) || 0,
        labourBreakdown,
        materialsConsumed,
        autoDeductStock,
      });

      if (res.success) {
        setAddModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to save daily work log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-teal-600" />
            <span>Daily Work Log & Site Diary (दैनिक कार्य डायरी)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Track daily manpower headcounts, wages, material consumption, and task completions
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-2xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/20 hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Daily Entry</span>
        </button>
      </div>

      {/* Work Logs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : workLogs.length > 0 ? (
          workLogs.map((log) => {
            const totalWage = log.labourBreakdown?.reduce(
              (acc, l) => acc + (l.totalWage || 0),
              0
            );

            return (
              <div
                key={log._id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{log.title}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Recorded on {formatDate(log.date)} • {log.weather || 'Normal'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                      Progress: {log.workProgressPercent}%
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      Labour Cost: {formatINR(totalWage)}
                    </span>
                  </div>
                </div>

                {log.workDescription && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {log.workDescription}
                  </p>
                )}

                {/* Labour Headcounts & Materials Consumed side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Labour Details */}
                  <div className="rounded-2xl border border-slate-100 p-3.5 space-y-2">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      <span>Manpower & Labour ({log.labourBreakdown?.length || 0})</span>
                    </div>
                    <div className="space-y-1">
                      {log.labourBreakdown?.map((l, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600 py-0.5">
                          <span>{l.category} × {l.count}</span>
                          <span className="font-semibold text-slate-800">{formatINR(l.totalWage)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Materials Consumed */}
                  <div className="rounded-2xl border border-slate-100 p-3.5 space-y-2">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                      <Boxes className="h-3.5 w-3.5 text-amber-600" />
                      <span>Materials Consumed ({log.materialsConsumed?.length || 0})</span>
                    </div>
                    <div className="space-y-1">
                      {log.materialsConsumed && log.materialsConsumed.length > 0 ? (
                        log.materialsConsumed.map((m, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 py-0.5">
                            <span>{m.material?.name || 'Material'}</span>
                            <span className="font-bold text-amber-700">{m.quantity} {m.unit}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No materials consumed recorded.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            <ClipboardList className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-semibold text-slate-600">No Daily Work Logs Recorded</div>
            <p className="text-xs text-slate-400 mt-1">
              Keep a daily site record of mistris, labourers, materials used, and construction milestones achieved.
            </p>
          </div>
        )}
      </div>

      {/* ADD LOG MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">New Daily Site Entry</h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Summary Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ground floor slab casting & column curing"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Description</label>
                <textarea
                  rows="2"
                  placeholder="Detailed observations, areas completed..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none"
                />
              </div>

              {/* Labour breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Labour Headcount & Wages
                  </span>
                  <button
                    type="button"
                    onClick={addLabourRow}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    + Add Labour Category
                  </button>
                </div>

                <div className="space-y-2">
                  {labourBreakdown.map((l, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2 rounded-xl border border-slate-200 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Category"
                          value={l.category}
                          onChange={(e) => updateLabourRow(idx, 'category', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 text-xs outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Count"
                          min="0"
                          value={l.count}
                          onChange={(e) => updateLabourRow(idx, 'count', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 text-xs outline-none text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Daily Wage ₹"
                          min="0"
                          value={l.wagePerLabour}
                          onChange={(e) => updateLabourRow(idx, 'wagePerLabour', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 text-xs outline-none text-right"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button type="button" onClick={() => removeLabourRow(idx)} className="text-slate-300 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-right text-xs font-bold text-slate-800 pt-1">
                  Total Day Wage: {formatINR(totalDailyWage)}
                </div>
              </div>

              {/* Material consumption */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Material Consumed Today
                  </span>
                  <button
                    type="button"
                    onClick={addMaterialRow}
                    className="text-xs font-bold text-amber-700 hover:underline"
                  >
                    + Add Material Consumed
                  </button>
                </div>

                <div className="space-y-2">
                  {materialsConsumed.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 bg-white p-2 rounded-xl border border-slate-200 items-center">
                      <div className="col-span-6">
                        <select
                          value={m.material}
                          onChange={(e) => updateMaterialRow(idx, 'material', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 text-xs outline-none"
                        >
                          {materials.map((mat) => (
                            <option key={mat._id} value={mat._id}>
                              {mat.name} (Stock: {mat.currentStock} {mat.stockUnit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-5">
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          placeholder={`Qty in ${m.unit || 'units'}`}
                          value={m.quantity}
                          onChange={(e) => updateMaterialRow(idx, 'quantity', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-1.5 text-xs outline-none text-right"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button type="button" onClick={() => removeMaterialRow(idx)} className="text-slate-300 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {materialsConsumed.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="deductCheck"
                      checked={autoDeductStock}
                      onChange={(e) => setAutoDeductStock(e.target.checked)}
                      className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <label htmlFor="deductCheck" className="text-slate-600 cursor-pointer">
                      Automatically deduct these consumed quantities from inventory stock
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-6 py-2 font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Daily Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
