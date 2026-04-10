import { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { 
  Users, Plus, Pencil, Trash2, UserCircle, 
  AlertCircle, LogIn, Sparkles, Link2, 
  Check, Copy, ArrowRight, PartyPopper, ShieldCheck, Loader2
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ApiService } from '../../services/apiService';

export const MembersManagement = () => {
  const { members, loadMembers, addMember, updateMember, deleteMember, updateProfile } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estados para Família
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Feedback states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activatingCode, setActivatingCode] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const { user, setUser } = useFinanceStore();
  const isMobile = useIsMobile();

  useEffect(() => { loadMembers(); }, [loadMembers]);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showSuccess = (msg: string) => setNotification({ message: msg, type: 'success' });
  const showError = (msg: string) => setNotification({ message: msg, type: 'error' });

  // Fallback robusto para cópia de texto
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Tenta API moderna
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback: Textarea oculto (legado mas robusto)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Falha ao copiar:', err);
      return false;
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput) return;
    setJoining(true);
    setJoinError('');
    try {
      const response = await ApiService.joinFamily(inviteCodeInput, user?.id || '');
      setUser(response.user);
      loadMembers();
      setJoinModalOpen(false);
      setInviteCodeInput('');
      showSuccess('Bem-vindo à nova família!');
    } catch (err: any) {
      setJoinError(err.message || 'Código inválido ou erro de conexão');
      showError('Não foi possível entrar na família.');
    } finally {
      setJoining(false);
    }
  };

  const handleActivateCode = async () => {
    if (!user) return;
    setActivatingCode(true);
    try {
      await updateProfile({ initialBalance: user.initialBalance || 0 });
      showSuccess('Código ativado com sucesso!');
    } catch (err) {
      showError('Falha ao ativar código. Tente novamente.');
    } finally {
      setActivatingCode(false);
    }
  };

  const handleCopyCode = async () => {
    const code = user?.family?.inviteCode;
    if (!code || code === '---' || code.length > 20) {
      showError('Ative o código primeiro para copiar.');
      return;
    }
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(true);
      showSuccess('Código copiado!');
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      showError('Falha ao copiar código automaticamente.');
    }
  };

  const handleCopyLink = async () => {
    const code = user?.family?.inviteCode;
    if (!code || code === '---' || code.length > 20) {
      showError('Ative o código primeiro para gerar o link.');
      return;
    }
    const link = `${window.location.origin}/register?code=${code}`;
    const success = await copyToClipboard(link);
    if (success) {
      setCopiedLink(true);
      showSuccess('Link de convite copiado!');
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      showError('Falha ao copiar link automaticamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMember(editingId, nome);
      } else {
        await addMember(nome);
      }
      closeModal();
      showSuccess(editingId ? 'Membro atualizado' : 'Membro adicionado');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erro');
    }
  };

  const openEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setNome(currentName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setNome('');
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteMember(deleteTargetId);
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
      showSuccess('Membro removido');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
      
      {/* Notificação / Toast Robustas */}
      {notification && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
          background: notification.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white', padding: '1rem 1.5rem', borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '0.875rem',
          animation: 'slideUp 0.3s ease-out forwards',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {notification.type === 'success' ? <PartyPopper size={22} /> : <AlertCircle size={22} />}
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{notification.message}</span>
        </div>
      )}

      {/* CENTRAL DE CONVITE PREMIUM (ROBUSTA) */}
      <Card padding="0" style={{ border: 'none', background: 'transparent', overflow: 'hidden' }} className="animate-fade-in-delay-1">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', minHeight: '220px' }}>
          {/* Lado Esquerdo: Info e Branding */}
          <div style={{ 
            padding: '2rem', 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
                <Users size={200} />
             </div>
             
             <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                   <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '10px' }}>
                      <Sparkles size={20} />
                   </div>
                   <span style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Convidar Membros</span>
                </div>
                <h3 className="h1" style={{ fontSize: '1.75rem', color: 'white', marginBottom: '0.75rem' }}>Unificar a Família</h3>
                <p style={{ fontSize: '0.9375rem', opacity: 0.85, maxWidth: '400px', lineHeight: 1.5 }}>
                  Compartilhe suas finanças com quem você confia. Novos membros entram automaticamente no seu ciclo financeiro.
                </p>
             </div>
          </div>

          {/* Lado Direito: Ações de Cópia */}
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.25rem', background: 'var(--slate-50)' }}>
             <div style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1.5px dashed var(--brand-200)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Seu Código Digital</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  {user?.family?.inviteCode && user.family.inviteCode.length <= 10 ? (
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-900)', letterSpacing: '0.1em' }}>
                      {user.family.inviteCode}
                    </span>
                  ) : (
                    <button 
                      onClick={handleActivateCode}
                      disabled={activatingCode}
                      style={{ 
                        padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'white', 
                        color: 'var(--brand-600)', border: '2px solid var(--brand-600)', fontWeight: 800, cursor: 'pointer',
                        fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.625rem',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)', transition: 'all 0.2s',
                        opacity: activatingCode ? 0.7 : 1
                      }}
                    >
                      {activatingCode ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {activatingCode ? 'Ativando...' : 'Ativar Código'}
                    </button>
                  )}
                </div>
             </div>

             <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={handleCopyLink}
                  style={{ 
                    flex: 1, height: '48px', borderRadius: '12px', border: 'none',
                    background: copiedLink ? '#059669' : 'var(--brand-600)',
                    color: 'white', fontWeight: 800, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', gap: '0.625rem', cursor: 'pointer', transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {copiedLink ? <Check size={18} /> : <Link2 size={18} />}
                  {copiedLink ? 'Copiado!' : 'Copiar Link'}
                </button>
                <button 
                  onClick={handleCopyCode}
                  style={{ 
                    width: '48px', height: '48px', borderRadius: '12px', border: '2px solid var(--brand-200)',
                    background: copiedCode ? '#ecfdf5' : 'white',
                    color: copiedCode ? '#059669' : 'var(--brand-600)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Copiar apenas código"
                >
                  {copiedCode ? <Check size={20} /> : <Copy size={20} />}
                </button>
             </div>

             <button 
                onClick={() => setJoinModalOpen(true)}
                style={{ 
                   fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-700)', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                   background: 'none', border: 'none', cursor: 'pointer'
                }}
             >
                <LogIn size={16} /> Entrar em uma família existente <ArrowRight size={14} />
             </button>
          </div>
        </div>
      </Card>

      {/* Header da Lista */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 0.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} style={{ color: 'var(--brand-500)' }} />
            <h2 className="h2" style={{ margin: 0 }}>Membros Registrados</h2>
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
             Pessoas que os lançamentos podem ser atribuídos.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="hover-scale">
          <Plus size={18} /> <span className="mobile-hidden">Adicionar Pessoa</span>
        </Button>
      </div>

      {/* Lista de Membros */}
      {members.length === 0 ? (
        <Card className="glass" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'var(--slate-50)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.25rem',
          }}>
            <Users size={28} style={{ color: 'var(--slate-300)' }} />
          </div>
          <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Nenhum membro ativo</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', maxWidth: '280px', margin: '0.5rem auto' }}>
            Adicione os familiares para ter controle individual dos gastos.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {members.map((m) => (
            <Card key={m.id} className="glass" padding="1.5rem" hover style={{ border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
                  color: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0,
                  boxShadow: 'var(--shadow-brand)'
                }}>
                  {m.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{m.nome}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--success-600)', fontSize: '0.75rem', fontWeight: 700 }}>
                    <ShieldCheck size={14} /> Membro Ativo
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => openEdit(m.id, m.nome)}
                    style={{ padding: '0.5rem', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as any).style.color = 'var(--brand-600)'; (e.currentTarget as any).style.background = 'var(--brand-50)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as any).style.color = 'var(--text-tertiary)'; (e.currentTarget as any).style.background = 'none'; }}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => confirmDelete(m.id)}
                    style={{ padding: '0.5rem', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as any).style.color = 'var(--danger-500)'; (e.currentTarget as any).style.background = 'var(--danger-50)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as any).style.color = 'var(--text-tertiary)'; (e.currentTarget as any).style.background = 'none'; }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL: NOVO MEMBRO */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Editar Perfil' : 'Nova Pessoa na Família'}>
        <div style={{ padding: '0.5rem' }}>
           <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
              Defina o nome de exibição para identificar os lançamentos financeiros desta pessoa.
           </p>
           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <Input 
               label="Nome Completo ou Apelido" 
               placeholder="Ex: Júlio Santos" 
               value={nome} 
               onChange={(e) => setNome(e.target.value)} 
               icon={<UserCircle size={18} />} 
               autoFocus
               required 
             />
             <Button fullWidth type="submit" style={{ height: '52px', borderRadius: '14px' }}>
               {editingId ? 'Salvar Alterações' : 'Concluir Cadastro'}
             </Button>
           </form>
        </div>
      </Modal>

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      <Modal isOpen={deleteModalOpen} onClose={() => !deleting && setDeleteModalOpen(false)} title="Confirmar Remoção">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Trash2 size={32} />
          </div>
          <div>
            <h3 className="h3">Remover da família?</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              O histórico de lançamentos desta pessoa continuará existindo, mas ela não aparecerá mais nos filtros ativos.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <Button fullWidth variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Manter Pessoa
            </Button>
            <Button fullWidth onClick={handleDelete} loading={deleting} style={{ background: 'var(--danger-600)' }}>
              Sim, Remover
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: ENTRAR EM FAMÍLIA */}
      <Modal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} title="Entrar em Família Existente">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--brand-50)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <LogIn size={32} />
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
               Insira o código enviado pelo Chefe da Família. Seus dados atuais serão migrados para a conta unificada.
            </p>
          </div>

          <form onSubmit={handleJoinFamily} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Input 
              label="Código de Convite (8 dígitos)" 
              placeholder="Digite o código enviado" 
              value={inviteCodeInput} 
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())} 
              icon={<Sparkles size={18} />}
              required 
            />
            {joinError && <div style={{ color: 'var(--danger-600)', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center' }}>{joinError}</div>}
            <Button fullWidth type="submit" loading={joining} style={{ height: '52px', borderRadius: '14px' }}>
              Unificar com Família
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};
