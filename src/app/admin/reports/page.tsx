'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSignedPhotoUrl } from '@/app/actions/reportActions';
import { Calendar, User, Eye, CheckCircle2, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVendor, setSelectedVendor] = useState('all');

  // Modal for viewing photo
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedVendor]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all vendors for filter
    const { data: vData } = await supabase.from('vendors').select('id, name');
    if (vData) setVendors(vData);

    let query = supabase
      .from('reports')
      .select('*, vendors(name)')
      .order('submitted_at', { ascending: false });

    if (selectedDate) {
      // Filter by date using Bogota offset (-05:00)
      query = query.gte('submitted_at', `${selectedDate}T00:00:00-05:00`)
                   .lte('submitted_at', `${selectedDate}T23:59:59-05:00`);
    }

    if (selectedVendor !== 'all') {
      query = query.eq('vendor_id', selectedVendor);
    }

    const { data: rData } = await query;
    if (rData) setReports(rData);
    setLoading(false);
  };

  const handleViewPhoto = async (path: string) => {
    const signedUrl = await getSignedPhotoUrl(path);
    if (signedUrl) {
      setViewingPhoto(signedUrl);
    } else {
      alert('No se pudo generar la URL de la foto');
    }
  };

  return (
    <div className="space-y-6 min-h-screen pb-20" style={{ background: 'var(--bg-page)' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4 pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Auditoría de Reportes</h1>
          <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Visualiza y verifica las fotos enviadas por los vendedores.</p>
        </div>
        
        <div 
          className="flex space-x-4 p-3 rounded-2xl border shadow-xl shadow-black/20"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase ml-1 mb-1 tracking-widest" style={{ color: 'var(--text-muted)' }}>Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-bold rounded-xl px-3 py-2 outline-none transition-all"
              style={{ background: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="border-l pl-4 flex flex-col" style={{ borderColor: 'var(--border)' }}>
            <label className="text-[10px] font-black uppercase ml-1 mb-1 tracking-widest" style={{ color: 'var(--text-muted)' }}>Vendedor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="border-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-bold rounded-xl px-3 py-2 outline-none transition-all min-w-[140px]"
              style={{ background: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
            >
              <option value="all">Todos</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 font-bold animate-pulse" style={{ color: 'var(--text-decorative)' }}>Cargando reportes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="rounded-[2rem] border overflow-hidden transition-all group"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div className="p-6 flex items-start justify-between">
                <div>
                  <h3 className="font-black text-lg tracking-tight group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text-primary)' }}>{report.vendors.name}</h3>
                  <div className="flex items-center text-xs font-bold mt-1" style={{ color: 'var(--text-muted)' }}>
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    {format(new Date(report.submitted_at), "d 'de' MMM, HH:mm", { locale: es })}
                  </div>
                </div>
                <span 
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                    report.report_type === 'midday' 
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                      : 'border-[var(--border-hover)]'
                  }`}
                  style={report.report_type === 'midday' ? {} : { background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}
                >
                  {report.report_type === 'midday' ? 'Mediodía' : 'Noche'}
                </span>
              </div>
              
              <div className="px-6 pb-6 flex items-center justify-between mt-2">
                <div className="flex items-center">
                  {report.is_on_time ? (
                    <div className="flex items-center text-emerald-400 text-xs font-black tracking-widest uppercase">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      A TIEMPO
                    </div>
                  ) : (
                    <div className="flex items-center text-rose-400 text-xs font-black tracking-widest uppercase">
                      <AlertTriangle className="w-4 h-4 mr-1.5" />
                      TARDE
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => handleViewPhoto(report.photo_url)}
                  className="flex items-center px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase active:scale-95 transition-all shadow-lg shadow-black/20"
                  style={{ background: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover-bright, #3f3f46)' }} // fallback or just hover
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  VER FOTO
                </button>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <div 
              className="col-span-full border-2 border-dashed rounded-[2.5rem] py-24 text-center"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <Shield className="mx-auto mb-4" size={48} style={{ color: 'var(--border)' }} />
              <p className="font-bold tracking-tight" style={{ color: 'var(--text-muted)' }}>No se encontraron reportes para esta selección.</p>
            </div>
          )}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-[100]" 
          style={{ background: 'rgba(9, 9, 11, 0.95)' }} // using rgba for backdrop on page bg
          onClick={() => setViewingPhoto(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="absolute top-4 right-4 flex items-center gap-4">
               <button 
                className="text-white/50 hover:text-white p-2 rounded-full transition-colors"
                onClick={(e) => { e.stopPropagation(); setViewingPhoto(null); }}
              >
                <XCircle className="w-10 h-10" />
              </button>
            </div>
            <img 
              src={viewingPhoto} 
              alt="Audit" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border" 
              style={{ borderColor: 'var(--border)' }}              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
