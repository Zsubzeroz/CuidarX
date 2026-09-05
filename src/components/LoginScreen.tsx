import React, { useState } from 'react';
import { Professional } from '../types';
import { BrandLogo } from './BrandLogo';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Phone,
  Plus,
  User,
} from 'lucide-react';
import {
  registerProfessional,
  loginProfessional,
  saveProfessionalToFirestore,
  ProfessionalDoc,
} from '../firebase';

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
  const [mode, setMode] = useState<'login' | 'register'>('login');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await loginProfessional(loginEmail.trim(), loginPassword);
      const found = professionals.find((p) => p.authUid === user.uid);
      if (found) {
        onLogin(found);
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

      const firestoreDoc: ProfessionalDoc = {
        ...newProf,
        authUid: user.uid,
      };
      await saveProfessionalToFirestore(firestoreDoc);

      if (onAddProfessional) {
        onAddProfessional(newProf);
      }

      onLogin(newProf);
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

  return (
    <div className="min-h-screen bg-[#E9E1D2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
            Acesse sua conta
          </h1>
          <p className="text-sm text-[#5B665F] mt-1">
            Entre com e-mail e senha para gerenciar seus atendimentos.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-[#FBF3E7] p-1 rounded-xl border border-[#E4D8C4] mb-4">
          <button type="button" onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#0F766E] shadow-2xs' : 'text-[#5B665F] hover:text-[#24312E]'
            }`}>
            Entrar
          </button>
          <button type="button" onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-[#0F766E] shadow-2xs' : 'text-[#5B665F] hover:text-[#24312E]'
            }`}>
            Criar Conta
          </button>
        </div>

        {/* Card */}
        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl shadow-lg overflow-hidden">
          {error && (
            <div className="mx-5 mt-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">E-mail</label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <Mail size={16} className="text-[#5B665F]" />
                  <input type="email" required placeholder="seu@email.com" value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">Senha</label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <Lock size={16} className="text-[#5B665F]" />
                  <input type="password" required placeholder="Sua senha" value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none" />
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5D56] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50">
                {isLoading ? 'Entrando...' : <>Entrar <ArrowRight size={15} /></>}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">Nome Completo *</label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <User size={16} className="text-[#5B665F]" />
                  <input type="text" required placeholder="Dra. Maria Silva" value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">E-mail *</label>
                <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                  <Mail size={16} className="text-[#5B665F]" />
                  <input type="email" required placeholder="maria@cuidarx.com.br" value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">Senha *</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <Lock size={16} className="text-[#5B665F]" />
                    <input type="password" required minLength={6} placeholder="Mín. 6 caracteres" value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">Confirmar *</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <Lock size={16} className="text-[#5B665F]" />
                    <input type="password" required minLength={6} placeholder="Repita a senha" value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">WhatsApp</label>
                  <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5">
                    <Phone size={16} className="text-[#5B665F]" />
                    <input type="tel" placeholder="(19) 90000-0000" value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-transparent border-none text-sm text-[#24312E] placeholder-[#9CA3AF] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">CRPO</label>
                  <input type="text" placeholder="CRPO/SP 00.000" value={regCrpo}
                    onChange={(e) => setRegCrpo(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-sm text-[#24312E] focus:outline-none focus:border-[#0F766E]" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#24312E] uppercase tracking-wider mb-1">Título / Especialidade</label>
                <input type="text" value={regTitle} onChange={(e) => setRegTitle(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-sm text-[#24312E] focus:outline-none focus:border-[#0F766E]" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setMode('login')}
                  className="px-4 py-2 rounded-xl border border-[#E4D8C4] text-xs font-semibold text-[#5B665F] hover:bg-[#FAF8F5] cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0B5D56] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  {isLoading ? 'Criando...' : <><Plus size={14} /> Criar Conta</>}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-[#8b8272] mt-6">
          CuidarX — Prontuario Podologico &middot; Gestao Clinica & Biosseguranca
        </p>
      </div>
    </div>
  );
};
