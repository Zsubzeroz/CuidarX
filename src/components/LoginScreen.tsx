import React, { useState } from 'react';
import { Professional } from '../types';
import { BrandLogo } from './BrandLogo';
import {
  Shield,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Clock,
  Plus,
  X,
} from 'lucide-react';

interface LoginScreenProps {
  professionals: Professional[];
  onLogin: (prof: Professional) => void;
  onAddProfessional?: (newProf: Professional) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  professionals,
  onLogin,
  onAddProfessional,
}) => {
  const [mode, setMode] = useState<'select' | 'credentials' | 'new'>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('Podólogo(a) Clínico(a)');
  const [newCrpo, setNewCrpo] = useState('CRPO/SP ');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('(19) ');
  const [newSpecialties, setNewSpecialties] = useState('Podologia Geral, Unha Encravada');

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const found = professionals.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (found) {
      onLogin(found);
    } else {
      setLoginError('E-mail não encontrado na equipe.');
    }
  };

  const handleCreateProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const colors = ['#0F766E', '#1E40AF', '#B45309', '#6D28D9', '#BE185D', '#0369A1'];
    const randomColor = colors[professionals.length % colors.length];

    const newProf: Professional = {
      id: `prof-${Date.now()}`,
      name: newName.trim(),
      title: newTitle.trim(),
      crpo: newCrpo.trim(),
      avatar: 'https://images.unsplash.com/photo-1594824813575-52b821437190?auto=format&fit=crop&w=400&q=80',
      color: randomColor,
      email: newEmail.trim(),
      phone: newPhone.trim(),
      specialties: newSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
      bio: 'Profissional especialista dedicado à saúde e bem-estar podológico da equipe CuidarX.',
      availableDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      workingHours: '08:00 - 18:00',
      active: true,
      rating: 5.0,
      reviewsCount: 1,
    };

    if (onAddProfessional) {
      onAddProfessional(newProf);
    }
    onLogin(newProf);
  };

  return (
    <div className="min-h-screen bg-[#E9E1D2] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={14} className="text-[#0F766E]" />
            <span className="text-xs uppercase tracking-wider font-semibold text-[#0F766E]">
              Área do Profissional
            </span>
          </div>
          <h1 className="font-fraunces text-2xl font-semibold text-[#24312E]">
            Identificação da Equipe Clínica
          </h1>
          <p className="text-sm text-[#5B665F] mt-1">
            Selecione seu perfil para acessar o sistema.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-[#FBF3E7] p-1 rounded-xl border border-[#E4D8C4] mb-4">
          <button
            type="button"
            onClick={() => setMode('select')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'select'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            Selecionar Perfil
          </button>
          <button
            type="button"
            onClick={() => setMode('credentials')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'credentials'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            E-mail & Senha
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'new'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            + Novo Membro
          </button>
        </div>

        {/* Card */}
        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl shadow-lg overflow-hidden">
          {/* Profile selection */}
          {mode === 'select' && (
            <div className="p-5 space-y-3">
              {professionals.map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => onLogin(prof)}
                  className="w-full p-4 rounded-xl border border-[#E4D8C4] bg-[#FFFDF9] hover:border-[#0F766E] hover:bg-[#FAF8F5] transition-all cursor-pointer text-left flex items-center gap-3.5 group"
                >
                  {prof.avatar ? (
                    <img
                      src={prof.avatar}
                      alt={prof.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#E4D8C4]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center font-bold text-sm">
                      {prof.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-[#5B665F] uppercase tracking-wider">
                      {prof.crpo}
                    </div>
                    <div className="font-bold text-sm text-[#24312E] truncate">
                      {prof.name}
                    </div>
                    <div className="text-xs text-[#0F766E] font-medium">
                      {prof.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5B665F] shrink-0">
                    <Clock size={12} className="text-[#0F766E]" />
                    <span>{prof.workingHours}</span>
                  </div>
                  <ChevronRight size={16} className="text-[#5B665F] group-hover:text-[#0F766E] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Email/password login */}
          {mode === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="p-5 space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">
                  E-mail do Profissional
                </label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <Mail size={16} className="text-[#5B665F]" />
                  <input
                    type="email"
                    required
                    placeholder="seu.nome@cuidarx.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">
                  Senha
                </label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <Lock size={16} className="text-[#5B665F]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5D56] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                Entrar
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* New professional */}
          {mode === 'new' && (
            <form onSubmit={handleCreateProfessional} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dra. Luciana Martins"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-sm text-[#24312E] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Podóloga Clínica & Laser"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-sm text-[#24312E] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">
                    CRPO
                  </label>
                  <input
                    type="text"
                    placeholder="CRPO/SP 00.000"
                    value={newCrpo}
                    onChange={(e) => setNewCrpo(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-sm text-[#24312E] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="luciana@cuidarx.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-sm text-[#24312E] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(19) 90000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-sm text-[#24312E] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">
                  Especialidades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Pé Diabético, Onicocriptose, Órtese"
                  value={newSpecialties}
                  onChange={(e) => setNewSpecialties(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-sm text-[#24312E] focus:outline-none focus:border-[#0F766E]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="px-4 py-2 rounded-xl border border-[#E4D8C4] text-xs font-semibold text-[#5B665F] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0B5D56] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  Cadastrar
                  <CheckCircle2 size={14} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#8b8272] mt-6">
          CuidarX — Prontuario Podologico &middot; Gestao Clinica & Biosseguranca
        </p>
      </div>
    </div>
  );
};
