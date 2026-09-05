import React, { useState } from 'react';
import { Professional } from '../types';
import {
  UserCheck,
  Shield,
  Mail,
  Lock,
  ArrowRight,
  X,
  LogOut,
  Plus,
  User,
  Phone,
} from 'lucide-react';
import { Avatar } from './Avatar';
import {
  registerProfessional,
  loginProfessional,
  loginWithGoogle,
  saveProfessionalToFirestore,
  ProfessionalDoc,
} from '../firebase';

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
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCrpo, setRegCrpo] = useState('');
  const [regTitle, setRegTitle] = useState('Podólogo(a) Clínico(a)');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await loginProfessional(loginEmail.trim(), loginPassword);
      // Find professional by authUid
      const found = professionals.find((p) => p.authUid === user.uid);
      if (found) {
        onSelectProfessional(found);
        onClose();
      } else {
        setError('Profissional não encontrado. Faça o cadastro primeiro.');
      }
    } catch (err: any) {
      const msg = err?.code === 'auth/user-not-found'
        ? 'Usuário não encontrado.'
        : err?.code === 'auth/wrong-password'
        ? 'Senha incorreta.'
        : err?.code === 'auth/invalid-email'
        ? 'E-mail inválido.'
        : err?.code === 'auth/too-many-requests'
        ? 'Muitas tentativas. Aguarde alguns minutos.'
        : 'Erro ao entrar. Verifique seus dados.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regPasswordConfirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (regPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await registerProfessional(regEmail.trim(), regPassword);

      const colors = ['#0F766E', '#1E40AF', '#B45309', '#6D28D9', '#BE185D', '#0369A1'];
      const randomColor = colors[professionals.length % colors.length];

      const profId = `prof-${Date.now()}`;
      const newProf: Professional = {
        id: profId,
        name: regName.trim(),
        title: regTitle.trim(),
        crpo: regCrpo.trim() || 'CRPO/SP',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(regName.trim())}&background=E3EEEC&color=0F766E&bold=true&size=200`,
        color: randomColor,
        email: regEmail.trim(),
        phone: regPhone.trim(),
        specialties: ['Podologia Geral'],
        bio: 'Profissional CuidarX.',
        availableDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        workingHours: '08:00 - 18:00',
        active: true,
        rating: 5.0,
        reviewsCount: 0,
        authUid: user.uid,
      };

      // Save to Firestore
      const firestoreDoc: ProfessionalDoc = {
        ...newProf,
        authUid: user.uid,
      };
      await saveProfessionalToFirestore(firestoreDoc);

      // Save locally too
      if (onAddProfessional) {
        onAddProfessional(newProf);
      }

      onSelectProfessional(newProf);
      onClose();
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está cadastrado.'
        : err?.code === 'auth/weak-password'
        ? 'A senha deve ter pelo menos 6 caracteres.'
        : err?.code === 'auth/invalid-email'
        ? 'E-mail inválido.'
        : 'Erro ao criar conta. Tente novamente.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const user = await loginWithGoogle();
      const found = professionals.find((p) => p.authUid === user.uid);
      if (found) {
        onSelectProfessional(found);
        onClose();
        return;
      }

      // Auto-register with Google profile data
      const colors = ['#0F766E', '#1E40AF', '#B45309', '#6D28D9', '#BE185D', '#0369A1'];
      const randomColor = colors[professionals.length % colors.length];
      const profId = `prof-${Date.now()}`;

      const newProf: Professional = {
        id: profId,
        name: user.displayName || user.email?.split('@')[0] || 'Profissional',
        title: 'Podólogo(a) Clínico(a)',
        crpo: 'CRPO/SP',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'P')}&background=E3EEEC&color=0F766E&bold=true&size=200`,
        color: randomColor,
        email: user.email || '',
        phone: '',
        specialties: ['Podologia Geral'],
        bio: 'Profissional CuidarX.',
        availableDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        workingHours: '08:00 - 18:00',
        active: true,
        rating: 5.0,
        reviewsCount: 0,
        authUid: user.uid,
      };

      await saveProfessionalToFirestore({ ...newProf, authUid: user.uid } as ProfessionalDoc);
      if (onAddProfessional) onAddProfessional(newProf);
      onSelectProfessional(newProf);
      onClose();
    } catch (err: any) {
      const msg = err?.code === 'auth/popup-closed-by-user'
        ? 'Janela de login fechada.'
        : err?.code === 'auth/cancelled-popup-request'
        ? 'Login cancelado.'
        : err?.code === 'auth/popup-blocked'
        ? 'Popup bloqueado pelo navegador. Permita popups para este site.'
        : 'Erro ao entrar com Google. Tente novamente.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14261C]/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFFDF9] border border-[#E4D8C4] rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#133023] text-[#FFFDF9] px-6 py-5 flex items-center justify-between border-b border-[#214D39]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#214D39] border border-[#2D664C] flex items-center justify-center text-[#4ADE80] shadow-inner">
              <Shield size={22} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A7F3D0]">
                Área do Profissional
              </span>
              <h2 className="text-[17px] font-fraunces font-medium text-[#FFFDF9] leading-tight mt-0.5">
                {currentProfessional ? 'Trocar de Profissional' : 'Acesse sua conta'}
              </h2>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#214D39]/80 hover:bg-[#214D39] text-[#E4D8C4] flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Current professional banner */}
        {currentProfessional && (
          <div className="bg-[#E6F4EA] border-b border-[#A7F3D0] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={currentProfessional.avatar} name={currentProfessional.name}
                size="md" rounded="full" borderColor="border-2 border-[#0F766E]" />
              <div>
                <div className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider">Conectado como</div>
                <div className="text-[13.5px] font-bold text-[#14261C]">
                  {currentProfessional.name}
                </div>
              </div>
            </div>
            <button type="button" onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#B91C1C] border border-[#FCA5A5] text-[12px] font-semibold hover:bg-[#FEF2F2] transition-colors">
              <LogOut size={14} /> Sair
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#E4D8C4] bg-[#FBF7F0] px-6 pt-3 gap-2">
          <button type="button" onClick={() => { setActiveTab('login'); setError(''); }}
            className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'login' ? 'border-[#0F766E] text-[#0F766E]' : 'border-transparent text-[#6B7280] hover:text-[#24312E]'
            }`}>
            <Lock size={16} /> Entrar
          </button>
          <button type="button" onClick={() => { setActiveTab('register'); setError(''); }}
            className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'register' ? 'border-[#0F766E] text-[#0F766E]' : 'border-transparent text-[#6B7280] hover:text-[#24312E]'
            }`}>
            <Plus size={16} /> Criar Conta
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-[12px] rounded-xl mb-4">
              {error}
            </div>
          )}

          {activeTab === 'login' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-fraunces text-[18px] text-[#14261C]">Entrar com E-mail & Senha</h3>
                <p className="text-[12.5px] text-[#55695E]">Acesse sua conta profissional</p>
              </div>

              <button type="button" onClick={handleGoogleLogin} disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-white border border-[#E4D8C4] hover:bg-[#FAF8F5] text-[#14261C] text-[13px] font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar com Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E4D8C4]" />
                <span className="text-[11px] text-[#9b9280]">ou</span>
                <div className="flex-1 h-px bg-[#E4D8C4]" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">E-mail</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <Mail size={16} className="text-[#6B7280]" />
                    <input type="email" required placeholder="seu@email.com" value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Senha</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <Lock size={16} className="text-[#6B7280]" />
                    <input type="password" required placeholder="Sua senha" value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>

                <button type="submit" disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {isLoading ? 'Entrando...' : <>Entrar <ArrowRight size={16} /></>}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="text-center mb-2">
                <h3 className="font-fraunces text-[18px] text-[#14261C]">Criar Conta Profissional</h3>
                <p className="text-[12.5px] text-[#55695E]">Cadastre-se para gerenciar seus atendimentos</p>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Nome Completo *</label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <User size={16} className="text-[#6B7280]" />
                  <input type="text" required placeholder="Dra. Maria Silva" value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">E-mail *</label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <Mail size={16} className="text-[#6B7280]" />
                  <input type="email" required placeholder="maria@cuidarx.com.br" value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Senha *</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <Lock size={16} className="text-[#6B7280]" />
                    <input type="password" required minLength={6} placeholder="Mín. 6 caracteres" value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Confirmar *</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <Lock size={16} className="text-[#6B7280]" />
                    <input type="password" required minLength={6} placeholder="Repita a senha" value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">WhatsApp</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <Phone size={16} className="text-[#6B7280]" />
                    <input type="tel" placeholder="(19) 90000-0000" value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">CRPO</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <input type="text" placeholder="CRPO/SP 00.000" value={regCrpo}
                      onChange={(e) => setRegCrpo(e.target.value)}
                      className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Título / Especialidade</label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <input type="text" value={regTitle} onChange={(e) => setRegTitle(e.target.value)}
                    className="w-full bg-transparent border-none text-[13.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none" />
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-bold shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2">
                {isLoading ? 'Criando conta...' : <>Criar Conta Profissional <ArrowRight size={16} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
