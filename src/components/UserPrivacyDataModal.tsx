import React, { useState } from 'react';
import { AuthUser } from '../types';
import {
  exportAllUserDataJson,
  purgeAllUserDataFromPlatform,
} from '../services/goldAndPrivacyService';
import { isSeniorAdmin } from '../services/authService';
import {
  ShieldCheck,
  Download,
  Trash2,
  AlertTriangle,
  X,
  FileText,
  Lock,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

export interface UserPrivacyDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  onPurgeSuccess: () => void;
}

export const UserPrivacyDataModal: React.FC<UserPrivacyDataModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPurgeSuccess,
}) => {
  const [confirmationInput, setConfirmationInput] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  if (!isOpen || !currentUser) return null;

  const isSenior = isSeniorAdmin(currentUser.email);
  const requiredPhrase = 'EXCLUIR MEUS DADOS';
  const isMatch = confirmationInput.trim() === requiredPhrase;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExportJson = () => {
    try {
      exportAllUserDataJson(currentUser.email);
      showToast('Download do arquivo JSON com todos os seus dados iniciado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar dados.');
    }
  };

  const handleExecutePurge = () => {
    if (isSenior) {
      showToast('Contas de Administrador Sênior são blindadas contra autoexclusão direta.');
      return;
    }

    if (!isMatch) {
      showToast(`Digite exatamente "${requiredPhrase}" para confirmar.`);
      return;
    }

    const finalConfirm = window.confirm(
      `ATENÇÃO IRREVERSÍVEL:\n\nTodos os seus cães, vacinas, registros de peso, progresso de adestramento e cofre de dados associados ao e-mail ${currentUser.email} serão permanentemente excluídos do seu navegador agora.\n\nDeseja prosseguir?`
    );

    if (!finalConfirm) return;

    setIsPurging(true);
    setTimeout(() => {
      const ok = purgeAllUserDataFromPlatform(currentUser.email);
      setIsPurging(false);
      if (ok) {
        onClose();
        onPurgeSuccess();
      } else {
        showToast('Não foi possível concluir a exclusão de dados.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-60 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Conformidade LGPD • Art. 18</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentUser.email}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
              Painel de Retirada & Privacidade de Dados
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Você tem total soberania sobre as informações do seu pet e da sua conta. Seus dados permanecem estritamente locais no seu navegador.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informação do Cofre Local */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3 text-xs">
          <HardDrive className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Seus prontuários, vacinas e pesagens são gravados na partição <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.2 rounded font-mono text-[11px]">canistech_vault_{currentUser.email}</code>. Nenhum dado biométrico é compartilhado com terceiros ou corretoras.
          </p>
        </div>

        {/* OPÇÃO 1: BAIXAR CÓPIA EM JSON (PORTABILIDADE) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Portabilidade de Dados: Baixar Cópia Completa (.JSON)
              </h3>
              <p className="text-[11px] text-slate-500">
                Gera um arquivo legível por máquina contendo todos os seus cães, histórico de vacinas, pesagens, perfil e treinos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Cópia de Todos os Meus Dados (JSON)</span>
          </button>
        </div>

        {/* OPÇÃO 2: DIREITO AO ESQUECIMENTO (PURGA TOTAL) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900 dark:text-red-300">
                2. Direito ao Esquecimento: Excluir Definitivamente Minha Conta
              </h3>
              <p className="text-[11px] text-red-800/80 dark:text-red-300/80">
                Exclui permanentemente o cofre DogOS, progresso de treinos, libera a vaga Gold (se houver) e faz logout imediato.
              </p>
            </div>
          </div>

          {isSenior ? (
            <div className="p-3 bg-amber-100/70 dark:bg-amber-950/50 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Esta conta possui privilégio de Administrador Sênior e é protegida contra exclusão acidental neste painel.</span>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-semibold text-red-900 dark:text-red-300">
                Para confirmar a exclusão irreversível, digite <strong className="font-mono text-red-600 dark:text-red-400">{requiredPhrase}</strong>:
              </label>

              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Digite "${requiredPhrase}"`}
                className="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-red-900 dark:text-red-200 outline-none focus:ring-2 focus:ring-red-500"
              />

              <button
                type="button"
                disabled={!isMatch || isPurging}
                onClick={handleExecutePurge}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isMatch && !isPurging
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isPurging
                    ? 'Excluindo todos os registros...'
                    : 'Retirar Todos os Meus Dados e Excluir Minha Conta'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
