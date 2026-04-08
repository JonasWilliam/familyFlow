import { useState, useRef, useCallback, useEffect } from 'react';
import { useFinanceStore } from '../../store/financeStore';
import { ApiService } from '../../services/apiService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Upload, FileImage, Sparkles, Trash2, Check, AlertCircle, ArrowDownRight, ArrowUpRight
} from 'lucide-react';

interface ParsedItem {
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  selected: boolean;
}

export const ImportInvoice = () => {
  const { user, members, categories, loadMembers, loadCategories, addTransaction } = useFinanceStore();
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [categoriaId, setCategoriaId] = useState('');
  const [membroId, setMembroId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadMembers();
    loadCategories();
  }, [loadMembers, loadCategories]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError('');
    setItems([]);
    setPreviews([]);
    setSavedCount(0);

    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    const imagePromises: Promise<{ base64: string, mimeType: string }>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        setError(`O arquivo ${file.name} não é uma imagem válida.`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError(`A imagem ${file.name} é muito grande (máximo 10MB).`);
        return;
      }

      validFiles.push(file);
      
      const promise = new Promise<{ base64: string, mimeType: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          newPreviews.push(dataUrl);
          resolve({
            base64: dataUrl.split(',')[1],
            mimeType: file.type
          });
        };
        reader.readAsDataURL(file);
      });
      imagePromises.push(promise);
    }

    if (validFiles.length === 0) return;

    setLoading(true);
    try {
      const imagesData = await Promise.all(imagePromises);
      setPreviews(newPreviews);
      
      const result = await ApiService.parseInvoice(imagesData);
      setItems(result.items.map(item => ({ ...item, selected: true })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagens');
      setPreviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const toggleItem = (index: number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (!categoriaId || !membroId) {
      setError('Selecione uma categoria e um membro antes de salvar');
      return;
    }

    const selected = items.filter(i => i.selected);
    if (selected.length === 0) {
      setError('Selecione pelo menos um item para salvar');
      return;
    }

    setSaving(true);
    setError('');
    let count = 0;

    for (const item of selected) {
      try {
        await addTransaction({
          descricao: item.descricao,
          valor: item.valor,
          data: item.data,
          tipo: item.tipo as 'gasto' | 'receita',
          categoriaId,
          membroId,
          usuarioId: user?.id || '',
        });
        count++;
      } catch (err) {
        console.error('Erro ao salvar item:', err);
      }
    }

    setSavedCount(count);
    setSaving(false);
    setItems([]);
    setPreviews([]);
  };

  const totalExtracted = items.filter(i => i.selected).reduce((s, i) => s + i.valor, 0);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6875rem 0.875rem',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--border-light)',
    backgroundColor: 'var(--bg-input)',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.875rem center',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Sparkles size={14} style={{ color: 'var(--brand-500)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Powered by Gemini AI
          </span>
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Importação Inteligente</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Envie fotos de suas faturas ou cupons. A IA processa todas de uma vez e consolida os lançamentos.
        </p>
      </div>

      {/* Success message */}
      {savedCount > 0 && (
        <div className="animate-fade-in" style={{
          padding: '1rem 1.25rem',
          background: 'var(--success-50)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          color: 'var(--success-600)', fontWeight: 500, fontSize: '0.875rem',
        }}>
          <Check size={18} />
          {savedCount} lançamento(s) importado(s) com sucesso!
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="animate-fade-in" style={{
          padding: '1rem 1.25rem',
          background: 'var(--danger-50)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          color: 'var(--danger-600)', fontWeight: 500, fontSize: '0.875rem',
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Upload Area */}
      {previews.length === 0 && !loading && (
        <Card className="animate-fade-in-delay-1" hover={false}>
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              border: `2px dashed ${dragActive ? 'var(--brand-400)' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-xl)',
              background: dragActive ? 'var(--brand-50)' : 'transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--brand-50), var(--brand-100))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <Upload size={28} style={{ color: 'var(--brand-500)' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: '0.375rem' }}>
              Selecione uma ou mais imagens
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
              Arraste os arquivos aqui • Máximo 10MB por arquivo
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="animate-fade-in" hover={false}>
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', border: '3px solid var(--brand-100)',
              borderTopColor: 'var(--brand-500)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1.25rem',
            }} />
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Analisando {previews.length > 1 ? 'faturas' : 'fatura'} com IA...</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              O Gemini está consolidando os dados de todas as imagens enviadas.
            </p>
          </div>
        </Card>
      )}

      {/* Results */}
      {previews.length > 0 && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Images Grid preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Imagens enviadas ({previews.length})</h4>
              <button 
                onClick={() => { setPreviews([]); setItems([]); }}
                style={{ fontSize: '0.75rem', color: 'var(--danger-500)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                Limpar tudo
              </button>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: previews.length === 1 ? '1fr' : '1fr 1fr', 
              gap: '0.75rem' 
            }}>
              {previews.map((p, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)', aspectRatio: '3/4', background: 'var(--slate-50)' }}>
                  <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Items */}
          <Card className="animate-fade-in-delay-2" hover={false} padding="0">
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-light)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.0625rem' }}>
                  {items.length} itens consolidados
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                  Total selecionado: R$ {totalExtracted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <FileImage size={20} style={{ color: 'var(--text-tertiary)' }} />
            </div>

            {/* Item list */}
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    borderBottom: i < items.length - 1 ? '1px solid var(--border-light)' : 'none',
                    opacity: item.selected ? 1 : 0.4,
                    transition: 'opacity var(--transition-fast)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(i)}
                    style={{ accentColor: 'var(--brand-500)', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div style={{
                    width: '32px', height: '32px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: item.tipo === 'receita' ? 'var(--success-50)' : 'var(--danger-50)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.tipo === 'receita'
                      ? <ArrowUpRight size={14} style={{ color: 'var(--success-500)' }} />
                      : <ArrowDownRight size={14} style={{ color: 'var(--danger-500)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.descricao}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span style={{
                    fontWeight: 700, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums',
                    color: item.tipo === 'receita' ? 'var(--success-600)' : 'var(--danger-600)',
                  }}>
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => removeItem(i)}
                    style={{ padding: '0.25rem', cursor: 'pointer', color: 'var(--text-tertiary)', borderRadius: 'var(--radius-sm)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Save controls */}
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Categoria padrão</label>
                  <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={selectStyle}>
                    <option value="">Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} ({c.tipo === 'receita' ? 'Receita' : 'Despesa'})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Membro padrão</label>
                  <select value={membroId} onChange={(e) => setMembroId(e.target.value)} style={selectStyle}>
                    <option value="">Selecione...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button fullWidth onClick={handleSaveAll} loading={saving}>
                <Check size={16} /> Salvar {items.filter(i => i.selected).length} lançamento(s)
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
