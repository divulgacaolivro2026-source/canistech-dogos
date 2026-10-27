import React, { useState, useMemo } from 'react';
import { PartnerSpecialist, GeoPartnerLocation } from '../types';
import {
  Building2,
  Phone,
  Star,
  MapPin,
  Calendar,
  Video,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageCircle,
} from 'lucide-react';

export interface PartnersDirectoryViewProps {
  partners: PartnerSpecialist[];
  geoPartners?: GeoPartnerLocation[];
}

export const PartnersDirectoryView: React.FC<PartnersDirectoryViewProps> = ({
  partners,
  geoPartners = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const unifiedPartners = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      category: string;
      categoryLabel: string;
      address: string;
      distanceKm: number;
      phone: string;
      whatsapp?: string;
      rating: number;
      reviewsCount: number;
      description: string;
      is24hEmergency: boolean;
      hasCrmvVerified: boolean;
      crmvResp?: string;
      openingHours?: string;
    }> = partners.map((p) => ({
      ...p,
      crmvResp: p.hasCrmvVerified ? 'CRMV Ativo' : undefined,
    }));

    if (geoPartners && geoPartners.length > 0) {
      geoPartners.forEach((gp) => {
        if (!list.some((p) => p.name.toLowerCase() === gp.name.toLowerCase())) {
          list.push({
            id: gp.id,
            name: gp.name,
            category: gp.category,
            categoryLabel: gp.categoryLabel,
            address: `${gp.address} - ${gp.city}, ${gp.state}`,
            distanceKm: 2.1,
            phone: gp.phone,
            whatsapp: gp.whatsapp,
            rating: 4.9,
            reviewsCount: 164,
            description: `${gp.categoryLabel} credenciado pela rede CanisTech. Responsável técnico homologado.`,
            is24hEmergency: gp.category === 'veterinario' && gp.openingHours.toLowerCase().includes('24 horas'),
            hasCrmvVerified: gp.verifiedByAdmin,
            crmvResp: gp.crmvResp,
            openingHours: gp.openingHours,
          });
        }
      });
    }

    return list;
  }, [partners, geoPartners]);

  const filteredPartners = unifiedPartners.filter((p) => {
    const matchCat =
      selectedCategory === 'all' ||
      p.category === selectedCategory ||
      (selectedCategory === 'hospital_24h' && p.category === 'veterinario') ||
      (selectedCategory === 'veterinario' && (p.category === 'veterinario' || p.category === 'hospital_24h'));
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Rede Credenciada & Marketplace de Suporte
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading tracking-tight mt-1">
            Especialistas e Emergências no Seu Raio
          </h1>
          <p className="text-xs md:text-sm text-slate-600">
            Hospitais 24 horas, UTIs caninas, lojas de nutrição, pet shops e especialistas integrados ao prontuário DogOS.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700">
          <MapPin className="w-4 h-4 text-[#E07A5F]" />
          <span>Localização detectada: <strong>São Paulo, Capital</strong></span>
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-semibold pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({unifiedPartners.length})
            </button>
            <button
              onClick={() => setSelectedCategory('hospital_24h')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'hospital_24h' || selectedCategory === 'veterinario'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              Hospitais & Clínicas 24h
            </button>
            <button
              onClick={() => setSelectedCategory('loja_racao')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'loja_racao'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Lojas de Ração & Nutrição
            </button>
            <button
              onClick={() => setSelectedCategory('pet_shop')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'pet_shop'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              Pet Shop & Banho/Tosa
            </button>
            <button
              onClick={() => setSelectedCategory('comportamento')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'comportamento'
                  ? 'bg-[#E07A5F] text-white'
                  : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
              }`}
            >
              Comportamento & Adestramento
            </button>
            <button
              onClick={() => setSelectedCategory('nutrologia')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'nutrologia'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Nutrologia Canina
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar clínica, bairro, serviço..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    partner.is24hEmergency || partner.category === 'hospital_24h' || partner.category === 'veterinario'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : partner.category === 'loja_racao' || partner.category === 'nutrologia'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : partner.category === 'pet_shop'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {partner.categoryLabel}
                </span>
                <span className="font-mono text-xs text-slate-500 font-semibold">
                  {partner.distanceKm} km
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 font-heading leading-tight">
                {partner.name}
              </h3>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {partner.description}
              </p>

              <div className="text-[11px] text-slate-400 truncate">
                {partner.address}
              </div>

              {partner.openingHours && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{partner.openingHours}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs pt-1">
                <span className="flex items-center text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 mr-0.5" />
                  {partner.rating}
                </span>
                <span className="text-slate-400">({partner.reviewsCount} avaliações)</span>
                {partner.hasCrmvVerified && (
                  <span className="text-emerald-700 font-semibold ml-auto flex items-center gap-0.5 text-[10px]" title={partner.crmvResp || 'CRMV Homologado'}>
                    <ShieldCheck className="w-3 h-3" /> {partner.crmvResp || 'CRMV'}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <a
                href={`tel:${partner.phone}`}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  partner.is24hEmergency
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{partner.is24hEmergency ? 'Ligar para Emergência' : 'Falar com a Clínica / Loja'}</span>
              </a>

              {partner.whatsapp && (
                <a
                  href={`https://wa.me/55${partner.whatsapp.replace(/\D/g, '')}?text=Olá,%20encontrei%20vocês%20pela%20plataforma%20CanisTech.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Conversar no WhatsApp</span>
                </a>
              )}

              <button
                onClick={() => showToast(`Agendamento solicitado para ${partner.name}! A equipe entrará em contato.`)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3 h-3" />
                <span>Agendar Avaliação / Serviço</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

