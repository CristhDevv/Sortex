'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSignedPhotoUrl } from '@/app/actions/reportActions';
import { Calendar, User, Eye, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
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
      // Filter by date (reports.submitted_at is timestamptz, we compare the date part)
      query = query.gte('submitted_at', `${selectedDate}T00:00:00Z`)
                   .lte('submitted_at', `${selectedDate}T23:59:59Z`);
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
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Auditoría de Reportes</h1>
          <p className="text-gray-500">Visualiza y verifica las fotos enviadas por los vendedores.</p>
        </div>
        
        <div className="flex space-x-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none focus:ring-0 text-sm font-medium"
            />
          </div>
          <div className="border-l border-gray-100 pl-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">Vendedor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="border-none focus:ring-0 text-sm font-medium"
            >
              <option value="all">Todos</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando reportes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              <div className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{report.vendors.name}</h3>
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(report.submitted_at), "d 'de' MMMM, HH:mm", { locale: es })}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${report.report_type === 'midday' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-800 text-white'}`}>
                  {report.report_type === 'midday' ? 'Mediodía' : 'Noche'}
                </span>
              </div>
              
              <div className="px-5 pb-5 flex items-center justify-between">
                <div className="flex items-center">
                  {report.is_on_time ? (
                    <div className="flex items-center text-green-600 text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      A TIEMPO
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500 text-sm font-bold">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      TARDE
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => handleViewPhoto(report.photo_url)}
                  className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  VER FOTO
                </button>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center">
              <p className="text-gray-400 font-medium">No se encontraron reportes para esta selección.</p>
            </div>
          )}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[100]" onClick={() => setViewingPhoto(null)}>
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <img src={viewingPhoto} alt="Audit" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            <button 
              className="absolute top-4 right-4 text-white bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30"
              onClick={() => setViewingPhoto(null)}
            >
              <XCircle className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
