import { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Users, Plus, Pencil, Trash2, UserCircle, AlertCircle } from 'lucide-react';

export const MembersManagement = () => {
  const { members, loadMembers, addMember, updateMember, deleteMember } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');

  // Estados para o novo Modal de Confirmação
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await updateMember(editingId, nome);
      } else {
        await addMember(nome);
      }
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
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
    setError('');
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMember(deleteTargetId);
      setDeleteModalOpen(false);
      setDeleteTargetId(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Responsivo */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem' 
      }}>
        <div>
          <h2 className="h1" style={{ color: 'var(--text-primary)' }}>Família</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {members.length} membros registrados
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={18} /> <span className="mobile-hidden">Novo membro</span>
        </Button>
      </div>

      {members.length === 0 ? (
        <Card className="glass animate-fade-in-delay-1" hover={false}>
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: 'var(--radius-2xl)',
              background: 'var(--slate-50)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1.25rem',
            }}>
              <Users size={28} style={{ color: 'var(--slate-300)' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Nenhum membro cadastrado</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', maxWidth: '280px', margin: '0.5rem auto 0' }}>
              Adicione as pessoas da sua casa para saber quem está gastando mais.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {members.map((m, i) => (
            <Card key={m.id} className={`glass animate-fade-in-delay-${Math.min(i + 1, 3)}`} padding="1.25rem">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
                  color: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', flexShrink: 0,
                  boxShadow: 'var(--shadow-brand)'
                }}>
                  {m.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-primary)' }}>{m.nome}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Membro da família</p>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => openEdit(m.id, m.nome)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as any).style.color = 'var(--brand-600)'; (e.currentTarget as any).style.background = 'var(--brand-50)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as any).style.color = 'var(--text-tertiary)'; (e.currentTarget as any).style.background = 'none'; }}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => confirmDelete(m.id)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none', transition: 'all 0.2s' }}
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

      {/* Modal de Criação/Edição */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Editar membro' : 'Novo membro'}>
        {error && <div style={{ padding: '0.875rem', background: 'var(--danger-50)', color: 'var(--danger-600)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input 
            label="Nome do membro" 
            placeholder="Ex: Ana Clara" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            icon={<UserCircle size={18} />} 
            required 
          />
          <Button fullWidth type="submit" style={{ marginTop: '0.5rem', height: '48px' }}>
            {editingId ? 'Salvar Alterações' : 'Adicionar à Família'}
          </Button>
        </form>
      </Modal>

      {/* Novo Modal de Confirmação de Deleção */}
      <Modal isOpen={deleteModalOpen} onClose={() => !deleting && setDeleteModalOpen(false)} title="Confirmar exclusão">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--danger-50)', color: 'var(--danger-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Trash2 size={28} />
          </div>
          <div>
            <h3 className="h3">Remover da família?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Esta ação removerá o membro permanentemente. <br />
              <strong>Atenção:</strong> Por segurança, se houver lançamentos vinculados a esta pessoa, a exclusão será bloqueada.
            </p>
          </div>

          {deleteError && (
            <div style={{ 
              padding: '1rem', 
              background: 'var(--danger-50)', 
              color: 'var(--danger-600)', 
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600
            }}>
              <AlertCircle size={18} />
              {deleteError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button fullWidth variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleDelete} loading={deleting} style={{ background: 'var(--danger-500)' }}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
