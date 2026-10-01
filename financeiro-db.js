// ==========================================
// MÓDULO: GESTÃO FINANCEIRA (SUPABASE)
// ==========================================

let lancamentoEmEdicaoId = null;

// Salvar ou Atualizar Lançamento (Entrada / Saída)
async function salvarLancamento(event) {
  if (event) event.preventDefault(); // Impede o recarregamento da página caso esteja dentro de um <form>

  try {
    const elTipo = document.getElementById('tipoLancamento');
    const elDescricao = document.getElementById('descricaoLancamento');
    const elValor = document.getElementById('valorLancamento');
    const elCategoria = document.getElementById('categoriaLancamento');
    const elData = document.getElementById('dataLancamento');

    if (!elDescricao || !elValor) {
      alert("Erro no formulário: Campos de descrição ou valor não foram encontrados no HTML.");
      return;
    }

    const tipo = elTipo ? elTipo.value : 'Entrada';
    const descricao = elDescricao.value.trim();
    // Trata o valor para aceitar vírgula ou ponto (ex: 1500,00 -> 1500.00)
    const valorLimpo = elValor.value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const valor = parseFloat(valorLimpo);
    const categoria = elCategoria ? elCategoria.value : 'Geral';
    const dataLancamento = elData && elData.value ? elData.value : new Date().toISOString().split('T')[0];

    if (!descricao || isNaN(valor) || valor <= 0) {
      alert("Por favor, preencha uma descrição válida e um valor maior que zero.");
      return;
    }

    const dadosLancamento = {
      tipo,
      descricao,
      valor,
      categoria,
      data_lancamento: dataLancamento
    };

    let error;

    if (lancamentoEmEdicaoId) {
      const res = await supabaseClient
        .from('financeiro')
        .update(dadosLancamento)
        .eq('id', lancamentoEmEdicaoId);
      error = res.error;
    } else {
      const res = await supabaseClient
        .from('financeiro')
        .insert([dadosLancamento]);
      error = res.error;
    }

    if (error) {
      alert("Erro ao salvar no Supabase: " + error.message);
      return;
    }

    alert(lancamentoEmEdicaoId ? "Lançamento atualizado com sucesso!" : "Lançamento registrado com sucesso!");
    
    limparFormularioFinanceiro();
    await carregarHistoricoFinanceiro();

  } catch (err) {
    console.error("Erro ao salvar lançamento:", err);
    alert("Erro interno ao salvar: " + err.message);
  }
}

// 2. Carregar Histórico e Formatar Cores/Sinais
async function carregarHistoricoFinanceiro() {
  const containerHistorico = document.getElementById('listaHistoricoFinanceiro') || document.getElementById('corpoHistoricoFinanceiro');
  if (!containerHistorico) return;

  try {
    const { data: lancamentos, error } = await supabaseClient
      .from('financeiro')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error("Erro ao carregar lançamentos:", error.message);
      return;
    }

    containerHistorico.innerHTML = '';

    let totalEntradas = 0;
    let totalSaidas = 0;

    if (!lancamentos || lancamentos.length === 0) {
      containerHistorico.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 12px; color: #888;">Nenhum lançamento registrado.</td></tr>';
      if (typeof atualizarCardsTotais === 'function') atualizarCardsTotais(0, 0, 0);
      return;
    }

    lancamentos.forEach((item, index) => {
      const valorNum = parseFloat(item.valor || 0);
      
      const tipoNormalizado = (item.tipo || '').toLowerCase();
      const ehEntrada = tipoNormalizado.includes('entrada') || tipoNormalizado === 'e' || item.tipo === 'Entrada';

      if (ehEntrada) {
        totalEntradas += valorNum;
      } else {
        totalSaidas += valorNum;
      }

      const corValor = ehEntrada ? '#28a745' : '#ff4d4d'; // Verde para Entrada / Vermelho para Saída
      const sinalValor = ehEntrada ? '+ R$ ' : '- R$ ';

      const partesData = item.data_lancamento ? item.data_lancamento.split('-') : [];
      const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : '--/--/----';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #222';

      tr.innerHTML = `
        <td style="padding: 12px; text-align: center; font-weight: bold; color: #d4af37;">#${lancamentos.length - index}</td>
        <td style="padding: 12px; text-align: center;">${dataFormatada}</td>
        <td style="padding: 12px; text-align: left; font-weight: 500;">${item.descricao || '--'}</td>
        <td style="padding: 12px; text-align: center;">
          <span style="background: #1e1e1e; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; color: #aaa; border: 1px solid #333;">
            ${item.categoria || 'Geral'}
          </span>
        </td>
        <td style="padding: 12px; text-align: right; font-weight: bold; color: ${corValor};">
          ${sinalValor}${valorNum.toFixed(2).replace('.', ',')}
        </td>
        <td style="padding: 12px; text-align: center;">
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button type="button" onclick="prepararEdicaoLancamento(${item.id})" title="Editar Lançamento" style="background: #d4af37; color: #000; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; font-size: 13px;">✏️</button>
            <button type="button" onclick="excluirLancamento(${item.id})" title="Excluir Lançamento" style="background: #ff4d4d; color: #fff; border: none; padding: 6px 8px; border-radius: 4px; cursor: pointer; font-size: 13px;">🗑️</button>
          </div>
        </td>
      `;

      containerHistorico.appendChild(tr);
    });

    if (typeof atualizarCardsTotais === 'function') {
      atualizarCardsTotais(totalEntradas, totalSaidas, totalEntradas - totalSaidas);
    }

  } catch (err) {
    console.error("Erro ao carregar histórico financeiro:", err);
  }
}

// 3. Preparar Edição
async function prepararEdicaoLancamento(id) {
  try {
    const { data: item, error } = await supabaseClient
      .from('financeiro')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !item) {
      alert("Erro ao carregar o lançamento para edição.");
      return;
    }

    lancamentoEmEdicaoId = item.id;

    if (document.getElementById('tipoLancamento')) document.getElementById('tipoLancamento').value = item.tipo;
    if (document.getElementById('descricaoLancamento')) document.getElementById('descricaoLancamento').value = item.descricao;
    if (document.getElementById('valorLancamento')) document.getElementById('valorLancamento').value = item.valor;
    if (document.getElementById('categoriaLancamento')) document.getElementById('categoriaLancamento').value = item.categoria;
    if (document.getElementById('dataLancamento')) document.getElementById('dataLancamento').value = item.data_lancamento;

    const btnSalvar = document.getElementById('btnSalvarLancamento');
    if (btnSalvar) btnSalvar.innerText = "💾 ATUALIZAR OPERAÇÃO";

  } catch (err) {
    alert("Erro ao preparar edição: " + err.message);
  }
}

// 4. Excluir Lançamento
async function excluirLancamento(id) {
  if (!confirm("Tem certeza de que deseja excluir este lançamento?")) return;

  try {
    const { error } = await supabaseClient
      .from('financeiro')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Erro ao excluir lançamento: " + error.message);
      return;
    }

    alert("Lançamento excluído com sucesso!");
    await carregarHistoricoFinanceiro();

  } catch (err) {
    alert("Erro ao excluir: " + err.message);
  }
}

// Auxiliares
function limparFormularioFinanceiro() {
  lancamentoEmEdicaoId = null;
  if (document.getElementById('descricaoLancamento')) document.getElementById('descricaoLancamento').value = '';
  if (document.getElementById('valorLancamento')) document.getElementById('valorLancamento').value = '';
  
  const btnSalvar = document.getElementById('btnSalvarLancamento');
  if (btnSalvar) btnSalvar.innerText = "💾 REGISTRAR OPERAÇÃO";
}

function atualizarCardsTotais(entradas, saidas, saldo) {
  const elEntradas = document.getElementById('cardTotalEntradas');
  const elSaidas = document.getElementById('cardTotalSaidas');
  const elSaldo = document.getElementById('cardTotalSaldo');

  if (elEntradas) {
    elEntradas.innerText = `R$ ${entradas.toFixed(2).replace('.', ',')}`;
  }

  if (elSaidas) {
    elSaidas.innerText = `R$ ${saidas.toFixed(2).replace('.', ',')}`;
  }

  if (elSaldo) {
    elSaldo.innerText = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
    
    // Se o Lucro Líquido for negativo, destaca em vermelho; se for positivo, mantém o tom dourado do tema
    if (saldo < 0) {
      elSaldo.style.color = '#ff4d4d';
    } else {
      elSaldo.style.color = '#d4af37';
    }
  }
}