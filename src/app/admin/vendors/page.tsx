'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { UserPlus, Edit2, Trash2, ShieldCheck, ShieldAlert, History } from 'lucide-react';
import bcrypt from 'bcryptjs';

interface Vendor {
  id: string;
  name: string;
  alias: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVendors(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hash PIN if creating or updating
    let hashedPin = '';
    if (pin) {
      hashedPin = await bcrypt.hash(pin, 10);
    }

    if (editingVendor) {
      const updateData: any = { name, alias: alias.toLowerCase(), phone };
      if (pin) updateData.pin = hashedPin;

      const { error } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', editingVendor.id);

      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from('vendors')
        .insert([{ name, alias: alias.toLowerCase(), phone, pin: hashedPin, is_active: true }]);

      if (error) alert(error.message);
    }

    setShowModal(false);
    resetForm();
    fetchVendors();
  };

  const toggleStatus = async (vendor: Vendor) => {
    const { error } = await supabase
      .from('vendors')
      .update({ is_active: !vendor.is_active })
      .eq('id', vendor.id);

    if (!error) {
      fetchVendors();
    }
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setName(vendor.name);
    setAlias(vendor.alias);
    setPhone(vendor.phone);
    setPin(''); // PIN empty unless changing
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingVendor(null);
    setName('');
    setAlias('');
    setPhone('');
    setPin('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Vendedores</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Nuevo Vendedor
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando vendedores...</div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre / Alias</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                    <div className="text-sm text-gray-500">@{vendor.alias}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {vendor.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => toggleStatus(vendor)}
                        className={`${vendor.is_active ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'}`}
                        title={vendor.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {vendor.is_active ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </button>
                      <Link
                        href={`/admin/vendors/${vendor.id}`}
                        className="text-amber-600 hover:text-amber-900"
                        title="Historial"
                      >
                        <History className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => openEditModal(vendor)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingVendor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Alias (Usuario)</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PIN (4 dígitos) {editingVendor && <span className="text-xs text-gray-400 font-normal">(Dejar vacío para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d{4}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required={!editingVendor}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="1234"
                />
              </div>
              <div className="flex space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200"
                >
                  {editingVendor ? 'Guardar Cambios' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
