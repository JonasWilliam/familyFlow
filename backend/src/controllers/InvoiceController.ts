import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT = `Analise esta imagem de fatura, cupom fiscal, extrato ou comprovante financeiro.
Extraia TODOS os itens/lançamentos encontrados e retorne APENAS um JSON puro (sem markdown, sem backticks) no seguinte formato:

[
  {
    "descricao": "Nome do item ou descrição do lançamento",
    "valor": 29.90,
    "data": "2026-04-07",
    "tipo": "gasto"
  }
]

Regras:
- "valor" deve ser um número decimal (nunca string)
- "data" no formato YYYY-MM-DD. Se não conseguir identificar a data, use a data de hoje
- "tipo" deve ser "gasto" para despesas/compras ou "receita" para créditos/recebimentos
- "descricao" deve ser limpa e legível (sem códigos internos)
- Se for um cupom de supermercado, cada item do cupom deve ser um lançamento separado
- Retorne APENAS o array JSON, sem explicações adicionais`;

export class InvoiceController {
  public async parse(req: Request, res: Response): Promise<void> {
    const { images, imageBase64, mimeType } = req.body;

    if (!images && !imageBase64) {
      res.status(400).json({ error: 'Nenhuma imagem fornecida' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'COLE_SUA_CHAVE_AQUI' || !apiKey) {
      res.status(500).json({
        error: 'Gemini API Key não configurada. Edite o arquivo .env na raiz com sua chave gratuita.',
      });
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Preparar partes (texto + imagens)
      const parts: any[] = [PROMPT];
      const count = images?.length || (imageBase64 ? 1 : 0);
      
      console.log(`📸 Iniciando análise de ${count} imagem(ns)...`);
      const start = Date.now();

      if (images && Array.isArray(images)) {
        images.forEach((img: any, idx: number) => {
          console.log(`  -> Processando imagem ${idx + 1}/${images.length}...`);
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: img.base64,
            },
          });
        });
      } else if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: imageBase64,
          },
        });
      }

      console.log(`🤖 Enviando para o Gemini... (Isso pode levar de 30s a 3min para 10 fotos)`);
      const result = await model.generateContent(parts);
      const text = result.response.text();
      const end = Date.now();
      
      console.log(`✅ Gemini respondeu em ${((end - start)/1000).toFixed(1)}s!`);

      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const items = JSON.parse(cleanJson);

      if (!Array.isArray(items)) {
        res.status(422).json({ error: 'Não foi possível extrair lançamentos desta imagem' });
        return;
      }

      res.status(200).json({ items });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Gemini parse error:', message);
      res.status(500).json({ error: `Erro ao processar imagem: ${message}` });
    }
  }
}
