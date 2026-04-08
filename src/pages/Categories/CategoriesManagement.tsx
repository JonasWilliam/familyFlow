import { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tags, Plus, Pencil, Trash2, Tag, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export const CategoriesManagement = () => {
  const { categories, loadCategories, addCategory, updateCategory, deleteCategory } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'gasto' | 'receita'>('gasto');
  const [error, setError] = useState('');
  
  // Estados para o novo Modal de Confirmação
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await updateCategory(editingId, nome, tipo);
      } else {
        await addCategory(nome, tipo);
      }
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  };

  const openEdit = (id: string, currentName: string, currentTipo: string) => {
    setEditingId(id);
    setNome(currentName);
    setTipo(currentTipo as 'gasto' | 'receita');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setNome('');
    setTipo('gasto');
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
      await deleteCategory(deleteTargetId);
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
          <h2 className="h1" style={{ color: 'var(--text-primary)' }}>Categorias</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {categories.length} categorias cadastradas
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={18} /> <span className="mobile-hidden">Nova categoria</span>
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="glass animate-fade-in-delay-1" hover={false}>
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: 'var(--radius-2xl)',
              background: 'var(--slate-50)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1.25rem',
            }}>
              <Tags size={28} style={{ color: 'var(--slate-300)' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Nenhuma categoria ainda</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', maxWidth: '280px', margin: '0.5rem auto 0' }}>
              Crie categorias como Alimentação, Transporte ou Salário para organizar seu fluxo.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {categories.map((cat, i) => (
            <Card key={cat.id} className={`glass animate-fade-in-delay-${Math.min(i + 1, 3)}`} padding="1.25rem">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius-lg)',
                  background: cat.tipo === 'receita' ? 'var(--success-50)' : 'var(--danger-50)',
                  color: cat.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)'
                }}>
                  {cat.tipo === 'receita' ? <TrendingUp size={24} strokeWidth={2.5} /> : <TrendingDown size={24} strokeWidth={2.5} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{cat.nome}</p>
                  <p style={{
                    fontSize: '0.75rem', fontWeight: 600,
                    color: cat.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)',
                    textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '2px'
                  }}>
                    {cat.tipo === 'receita' ? 'Receita' : 'Despesa'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => openEdit(cat.id, cat.nome, cat.tipo)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as any).style.color = 'var(--brand-600)'; (e.currentTarget as any).style.background = 'var(--brand-50)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as any).style.color = 'var(--text-tertiary)'; (e.currentTarget as any).style.background = 'none'; }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => confirmDelete(cat.id)}
                    style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-tertiary)', background: 'none', border: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { (e.currentTarget as any).style.color = 'var(--danger-500)'; (e.currentTarget as any).style.background = 'var(--danger-50)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as any).style.color = 'var(--text-tertiary)'; (e.currentTarget as any).style.background = 'none'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação/Edição */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingId ? 'Editar categoria' : 'Nova categoria'}>
        {error && <div style={{ padding: '0.875rem', background: 'var(--danger-50)', color: 'var(--danger-600)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input label="Nome da categoria" placeholder="Ex: Supermercado" value={nome} onChange={(e) => setNome(e.target.value)} icon={<Tag size={18} />} required />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tipo de Lançamento</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(['gasto', 'receita'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-lg)', fontWeight: 700,
                    fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
                    border: `2px solid ${tipo === t ? (t === 'receita' ? 'var(--success-500)' : 'var(--danger-500)') : 'var(--border-light)'}`,
                    background: tipo === t ? (t === 'receita' ? 'var(--success-50)' : 'var(--danger-50)') : 'white',
                    color: tipo === t ? (t === 'receita' ? 'var(--success-600)' : 'var(--danger-600)') : 'var(--text-secondary)',
                  }}
                >
                  {t === 'receita' ? 'Receita' : 'Despesa'}
                </button>
              ))}
            </div>
          </div>
          <Button fullWidth type="submit" style={{ marginTop: '0.5rem', height: '48px' }}>
            {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
          </Button>
        </form>
      </Modal>

      {/* Novo Modal de Confirmação de Deleção */}
      <Modal isOpen={deleteModalOpen} onClose={() => !deleting && setDeleteModalOpen(false)} title="Confirmar exclusão">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--danger-50)', color: 'var(--danger-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
          }}>
            <Trash2 size={28} />
          </div>
          <div>
            <h3 className="h3">Remover categoria?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
              Esta ação removerá a categoria permanentemente. <br />
              <strong>Atenção:</strong> Se houver lançamentos usando esta categoria, a exclusão será bloqueada.
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
