// ==========================================
// MÓDULO: BANCO DE DADOS & SUPABASE
// ==========================================

// 1. CREDENCIAIS DO SUPABASE (Substitua pelas suas do painel do Supabase)
const SUPABASE_URL = 'https://hhlfilsjtkmvhuaivezc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fckaKNrimsB5t8bz1p1WPA_oIU-F48r';

// 2. INICIALIZAÇÃO DO CLIENTE (Resolve o erro "supabaseClient is not defined")
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Salvar nota no Supabase
async function salvarNotaNuvem() {
  try {
    const elCliente = document.getElementById('clienteNome') || document.getElementById('cliente');
    const nomeCliente = elCliente ? elCliente.value.trim() : '';

    if (!nomeCliente) {
      alert("Por favor, preencha o nome do cliente antes de salvar.");
      return;
    }

    if (!window.itensNota || window.itensNota.length === 0) {
      alert("Adicione pelo menos um item à tabela antes de salvar a nota!");
      return;
    }

    const valorTotal = window.itensNota.reduce((acc, item) => acc + item.totalItem, 0);

    const dadosNota = {
      cliente: nomeCliente,
      data_emissao: new Date().toISOString(),
      valor_total: valorTotal,
      itens: window.itensNota
    };

    const { data, error } = await supabaseClient
      .from('notas')
      .insert([dadosNota]);

    if (error) {
      alert("Erro ao salvar no Supabase: " + error.message);
      return;
    }

    alert("Nota salva com sucesso no histórico!");
    await carregarNotasNuvem(); // Atualiza a lista na tela imediatamente

  } catch (err) {
    console.error("Erro ao salvar nota:", err);
    alert("Erro interno ao salvar nota: " + err.message);
  }
}

// 2. Carregar e renderizar o histórico com opções de Editar e Excluir
async function carregarNotasNuvem() {
  const containerHistorico = document.getElementById('listaHistoricoNotas') || document.getElementById('corpoHistorico');
  if (!containerHistorico) return;

  try {
    const { data: notas, error } = await supabaseClient
      .from('notas')
      .select('*')
      .order('id', { ascending: true }); // Ordena do mais antigo para o mais novo (1, 2, 3...)

    if (error) {
      console.error("Erro ao buscar histórico:", error.message);
      return;
    }

    containerHistorico.innerHTML = '';

    if (!notas || notas.length === 0) {
      containerHistorico.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 12px; color: #888;">Nenhuma nota salva no histórico.</td></tr>';
      return;
    }

    notas.forEach((nota, index) => {
      // Formata a data (DD/MM/AAAA)
      const dataObjeto = new Date(nota.data_emissao);
      const dataFormatada = !isNaN(dataObjeto) 
        ? dataObjeto.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : '--/--/----';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #333';

      // 5 colunas perfeitamente casadas com o cabeçalho
      tr.innerHTML = `
        <td style="padding: 10px; text-align: center; font-weight: bold; color: #d4af37;">#${index + 1}</td>
        <td style="padding: 10px; text-align: center;">${dataFormatada}</td>
        <td style="padding: 10px; text-align: left;">${nota.cliente || '--'}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">R$ ${parseFloat(nota.valor_total || 0).toFixed(2).replace('.', ',')}</td>
        <td style="padding: 10px; text-align: center;">
          <button type="button" onclick="editarNotaHistorico(${nota.id})" title="Editar Nota" style="background: #d4af37; color: #000; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 4px;">✏️</button>
          <button type="button" onclick="excluirNotaHistorico(${nota.id})" title="Excluir Nota" style="background: #ff4d4d; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 14px;">🗑️</button>
        </td>
      `;

      containerHistorico.appendChild(tr);
    });

  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
  }
}

// 3. Editar nota (Recarrega os dados para o formulário)
async function editarNotaHistorico(idNota) {
  try {
    const { data: nota, error } = await supabaseClient
      .from('notas')
      .select('*')
      .eq('id', idNota)
      .single();

    if (error || !nota) {
      alert("Erro ao buscar dados da nota para edição.");
      return;
    }

    // Preenche o formulário com o cliente
    const elCliente = document.getElementById('clienteNome') || document.getElementById('cliente');
    if (elCliente) elCliente.value = nota.cliente;

    // Restaura os itens salvos
    window.itensNota = nota.itens || [];

    // Atualiza a tabela de itens e a prévia visual
    if (typeof renderizarTabelaItens === 'function') renderizarTabelaItens();
    if (typeof atualizarPreviewNota === 'function') atualizarPreviewNota();

    alert(`Nota do cliente "${nota.cliente}" carregada para edição!`);

  } catch (err) {
    alert("Erro ao carregar nota: " + err.message);
  }
}

// 4. Excluir nota do Supabase
async function excluirNotaHistorico(idNota) {
  if (!confirm("Tem certeza de que deseja excluir esta nota do histórico?")) return;

  try {
    const { error } = await supabaseClient
      .from('notas')
      .delete()
      .eq('id', idNota);

    if (error) {
      alert("Erro ao excluir nota: " + error.message);
      return;
    }

    alert("Nota removida do histórico com sucesso!");
    await carregarNotasNuvem();

  } catch (err) {
    alert("Erro ao excluir nota: " + err.message);
  }
}

// Executa a busca do histórico assim que a página carregar
document.addEventListener('DOMContentLoaded', () => {
  carregarNotasNuvem();
});

function toggleMenu() {
  const sidebar = document.getElementById('sidebarMenu');
  const overlay = document.getElementById('menuOverlay');
  
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}