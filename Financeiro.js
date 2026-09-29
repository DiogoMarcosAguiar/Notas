// ======================================================
// CONEXÃO COM O SUPABASE - DMArtFerro
// ======================================================
const SUPABASE_URL = "sb_publishable_fckaKNrimsB5t8bz1p1WPA_oIU-F48r"; 
const SUPABASE_KEY = "sb_secret_W9CU4kOddULjlpeMUBFayQ_aPqYRyC6"; 

// Inicializa o cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Executa ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  // Preenche o campo de data com o dia atual por padrão
  document.getElementById("dataLancamento").value = new Date().toISOString().split("T")[0];
  
  // Carrega os dados do banco de dados
  carregarLancamentos();
});

// ======================================================
// BUSCAR E CARREGAR DADOS DO BANCO
// ======================================================
async function carregarLancamentos() {
  const tabelaCorpo = document.getElementById("tabelaHistorico");
  tabelaCorpo.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Carregando movimentações...</td></tr>";

  // Busca todos os lançamentos ordenados do mais recente para o mais antigo
  const { data: lancamentos, error } = await supabaseClient
    .from("financeiro")
    .select("*")
    .order("data_lancamento", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao buscar dados:", error);
    tabelaCorpo.innerHTML = "<tr><td colspan='6' style='text-align:center; color: #dc3545;'>Erro ao carregar dados do banco.</td></tr>";
    return;
  }

  renderizarTabelaEDashboard(lancamentos);
}

// ======================================================
// SALVAR NOVO LANÇAMENTO
// ======================================================
async function salvarLancamento(event) {
  event.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value;
  const dataLancamento = document.getElementById("dataLancamento").value;

  if (!descricao || !valor || valor <= 0) {
    alert("Preencha a descrição e um valor válido!");
    return;
  }

  // Insere a linha no banco do Supabase
  const { error } = await supabaseClient
    .from("financeiro")
    .insert([
      {
        tipo: tipo,
        descricao: descricao,
        valor: valor,
        categoria: categoria,
        data_lancamento: dataLancamento
      }
    ]);

  if (error) {
    console.error("Erro ao salvar:", error);
    alert("Erro ao salvar lançamento no banco de dados.");
  } else {
    // Limpa o formulário e recarrega os dados em tempo real
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    carregarLancamentos();
  }
}

// ======================================================
// DELETAR LANÇAMENTO
// ======================================================
async function deletarLancamento(id) {
  if (!confirm("Tem certeza que deseja excluir esta movimentação?")) return;

  const { error } = await supabaseClient
    .from("financeiro")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar:", error);
    alert("Erro ao excluir lançamento.");
  } else {
    carregarLancamentos();
  }
}

// ======================================================
// RENDERIZAR TABELA E CALCULAR DASHBOARD
// ======================================================
function renderizarTabelaEDashboard(lancamentos) {
  const tabelaCorpo = document.getElementById("tabelaHistorico");
  tabelaCorpo.innerHTML = "";

  let totalEntradas = 0;
  let totalSaidas = 0;

  if (!lancamentos || lancamentos.length === 0) {
    tabelaCorpo.innerHTML = "<tr><td colspan='6' style='text-align:center; color: #777;'>Nenhuma movimentação cadastrada ainda.</td></tr>";
    atualizarCards(0, 0);
    return;
  }

  lancamentos.forEach(item => {
    // Soma totais para o Dashboard
    if (item.tipo === "ENTRADA") {
      totalEntradas += parseFloat(item.valor);
    } else {
      totalSaidas += parseFloat(item.valor);
    }

    // Formata data (AAAA-MM-DD -> DD/MM/AAAA)
    const dataFormatada = item.data_lancamento.split("-").reverse().join("/");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dataFormatada}</td>
      <td class="${item.tipo === 'ENTRADA' ? 'tag-entrada' : 'tag-saida'}">${item.tipo === 'ENTRADA' ? '🟢 ENTRADA' : '🔴 SAÍDA'}</td>
      <td>${item.descricao}</td>
      <td>${item.categoria}</td>
      <td style="font-weight: bold;">R$ ${parseFloat(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      <td>
        <button onclick="deletarLancamento(${item.id})" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">🗑️</button>
      </td>
    `;
    tabelaCorpo.appendChild(tr);
  });

  atualizarCards(totalEntradas, totalSaidas);
}

// Atualiza os Cards no topo do Painel
function atualizarCards(entradas, saidas) {
  const lucro = entradas - saidas;

  document.getElementById("totalEntradas").innerText = `R$ ${entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("totalSaidas").innerText = `R$ ${saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  
  const cardLucro = document.getElementById("totalLucro");
  cardLucro.innerText = `R$ ${lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  cardLucro.style.color = lucro >= 0 ? "#d4af37" : "#dc3545"; // Fica vermelho se estiver no prejuízo
}

// Função para Alternar o Menu Retrátil
function toggleMenu() {
  const sidebar = document.getElementById("sidebarMenu");
  const overlay = document.getElementById("menuOverlay");
  
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
}