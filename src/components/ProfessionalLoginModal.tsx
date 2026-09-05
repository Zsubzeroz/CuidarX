import React, { useState } from 'react';
import { Professional } from '../types';
import {
  UserCheck,
  Shield,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  Phone,
  Calendar,
  Clock,
  LogOut,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Avatar } from './Avatar';

interface ProfessionalLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionals: Professional[];
  currentProfessional: Professional | null;
  onSelectProfessional: (prof: Professional) => void;
  onLogout: () => void;
  onAddProfessional?: (newProf: Professional) => void;
}

export const ProfessionalLoginModal: React.FC<ProfessionalLoginModalProps> = ({
  isOpen,
  onClose,
  professionals,
  currentProfessional,
  onSelectProfessional,
  onLogout,
  onAddProfessional,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'credentials' | 'new'>('profiles');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // New professional form state
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('Podólogo(a) Clínico(a)');
  const [newCrpo, setNewCrpo] = useState('CRPO/SP ');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('(19) ');
  const [newSpecialties, setNewSpecialties] = useState('Podologia Geral, Unha Encravada');

  if (!isOpen) return null;

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const found = professionals.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (found) {
      onSelectProfessional(found);
      onClose();
    } else {
      setLoginError('E-mail não encontrado na equipe de profissionais cadastrados.');
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
    onSelectProfessional(newProf);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14261C]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FFFDF9] border border-[#E4D8C4] rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Elegante Verde Floresta */}
        <div className="bg-[#133023] text-[#FFFDF9] px-6 py-5 flex items-center justify-between border-b border-[#214D39]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#214D39] border border-[#2D664C] flex items-center justify-center text-[#4ADE80] shadow-inner">
              <Shield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A7F3D0]">
                  Área do Profissional
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#214D39] text-[#E4D8C4]">
                  Multi-Usuário
                </span>
              </div>
              <h2 className="text-[19px] font-fraunces font-medium text-[#FFFDF9] leading-tight mt-0.5">
                Identificação da Equipe Clínica
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#214D39]/80 hover:bg-[#214D39] text-[#E4D8C4] flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current logged-in banner */}
        {currentProfessional && (
          <div className="bg-[#E6F4EA] border-b border-[#A7F3D0] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={currentProfessional.avatar}
                name={currentProfessional.name}
                size="md"
                rounded="full"
                borderColor="border-2 border-[#0F766E]"
              />
              <div>
                <div className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider">
                  Usuário Atualmente Conectado
                </div>
                <div className="text-[13.5px] font-bold text-[#14261C]">
                  {currentProfessional.name} • <span className="font-normal text-[12px] text-[#55695E]">{currentProfessional.title}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLogout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#B91C1C] border border-[#FCA5A5] text-[12px] font-semibold hover:bg-[#FEF2F2] transition-colors"
            >
              <LogOut size={14} />
              Desconectar
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#E4D8C4] bg-[#FBF7F0] px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profiles'
                ? 'border-[#0F766E] text-[#0F766E]'
                : 'border-transparent text-[#6B7280] hover:text-[#24312E]'
            }`}
          >
            <UserCheck size={16} />
            Selecionar Profissional ({professionals.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-[#0F766E] text-[#0F766E]'
                : 'border-transparent text-[#6B7280] hover:text-[#24312E]'
            }`}
          >
            <KeyRound size={16} />
            Entrar com E-mail & Senha
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'border-[#0F766E] text-[#0F766E]'
                : 'border-transparent text-[#6B7280] hover:text-[#24312E]'
            }`}
          >
            <Plus size={16} />
            + Novo Membro
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'profiles' && (
            <div>
              <p className="text-[13px] text-[#55695E] mb-3.5">
                Selecione o seu perfil clínico para acessar sua agenda pessoal, prontuários de atendimento e histórico:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {professionals.map((prof) => {
                  const isCurrent = currentProfessional?.id === prof.id;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => {
                        onSelectProfessional(prof);
                        onClose();
                      }}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-[#E3EEEC]/60 border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-xs'
                          : 'bg-[#FFFDF9] border-[#E4D8C4] hover:border-[#0F766E] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar
                            src={prof.avatar}
                            name={prof.name}
                            size="xl"
                            rounded="xl"
                            borderColor="border border-[#E4D8C4]"
                          />
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: prof.color }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#55695E] uppercase tracking-wider">
                              {prof.crpo}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-[#0F766E] text-white text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                Ativo
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-[15px] text-[#14261C] leading-snug truncate">
                            {prof.name}
                          </h4>
                          <p className="text-[12px] text-[#0F766E] font-medium leading-tight">
                            {prof.title}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#E4D8C4]/60 flex items-center justify-between text-[11px] text-[#55695E]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-[#0F766E]" />
                          {prof.workingHours}
                        </span>
                        <span className="font-semibold text-[#0F766E] flex items-center gap-0.5">
                          Acessar <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="max-w-md mx-auto space-y-4 py-2">
              <div className="text-center mb-2">
                <h3 className="font-fraunces text-[18px] text-[#14261C]">Login com E-mail da Clínica</h3>
                <p className="text-[12.5px] text-[#55695E]">
                  Utilize seu e-mail cadastrado (ex: fabricia@cuidarx.com.br, renata@cuidarx.com.br)
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-[12px] rounded-xl">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                  E-mail do Profissional
                </label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <Mail size={16} className="text-[#6B7280]" />
                  <input
                    type="email"
                    required
                    placeholder="seu.nome@cuidarx.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                  Senha de Acesso
                </label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <Lock size={16} className="text-[#6B7280]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  Entrar no Painel Profissional
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-[11.5px] text-[#6B7280]">
                  Dica de acesso rápido: Você também pode usar a aba{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('profiles')}
                    className="text-[#0F766E] font-bold underline"
                  >
                    Selecionar Profissional
                  </button>
                  .
                </span>
              </div>
            </form>
          )}

          {activeTab === 'new' && (
            <form onSubmit={handleCreateProfessional} className="space-y-3.5 py-1">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E4D8C4] text-[12px] text-[#55695E]">
                Adicione um novo(a) podólogo(a) ou assistente à equipe da clínica para liberar sua agenda individual e permitir agendamentos online pelos pacientes.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Luciana Martins"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                    Título / Especialidade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Podóloga Clínica & Laser"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                    CRPO / Registro
                  </label>
                  <input
                    type="text"
                    placeholder="CRPO/SP 00.000"
                    value={newCrpo}
                    onChange={(e) => setNewCrpo(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="luciana@cuidarx.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(19) 90000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                  Especialidades Principais (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pé Diabético, Onicocriptose, Órtese de Silicone"
                  value={newSpecialties}
                  onChange={(e) => setNewSpecialties(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profiles')}
                  className="px-4 py-2.5 rounded-xl border border-[#E4D8C4] text-[13px] font-semibold text-[#55695E] hover:bg-[#FAF8F5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-bold shadow-sm flex items-center gap-2"
                >
                  Cadastrar e Ativar Profissional
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
