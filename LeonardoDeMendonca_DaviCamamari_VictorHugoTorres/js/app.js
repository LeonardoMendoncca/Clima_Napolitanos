/**
 * app.js — controla a página: eventos, validação e fluxo entre api.js e ui.js.
 */

const MAX_COMPARACAO = 3;

const el = {
  formBusca: document.getElementById("form-busca"),
  campoCidade: document.getElementById("campo-cidade"),
  botaoBuscar: document.getElementById("botao-buscar"),
  avisoBusca: document.getElementById("aviso-busca"),
  resultadosBusca: document.getElementById("resultados-busca"),
  secaoPrevisao: document.getElementById("previsao"),
  agora: document.getElementById("painel-agora"),
  seteDias: document.getElementById("painel-sete-dias"),
  chuva: document.getElementById("painel-chuva"),
  ar: document.getElementById("painel-ar"),
  historico: document.getElementById("painel-historico"),
  comparacao: document.getElementById("painel-comparacao"),
};

let comparacao = []; // [{ cidade, previsao, ar }]

/* ---------- validação ---------- */

/** Devolve a mensagem de erro, ou null se a entrada é válida. */
function validarNomeCidade(texto) {
  const nome = texto.trim();
  if (nome === "") return "Digite o nome de uma cidade.";
  if (nome.length < 2) return "Digite pelo menos 2 letras.";
  if (!/\p{L}/u.test(nome)) return "O nome da cidade deve conter letras.";
  return null;
}

/* ---------- busca de cidades (endpoint 1) ---------- */

async function pesquisarCidade(nome) {
  alternarBotao(el.botaoBuscar, true, "Buscando...");
  el.avisoBusca.innerHTML = "";
  el.resultadosBusca.innerHTML = "";
  mostrarCarregando(el.avisoBusca, "Procurando cidades...");

  try {
    const cidades = await buscarCidades(nome);
    el.avisoBusca.innerHTML = "";
    if (cidades.length === 0) {
      mostrarAlerta(el.avisoBusca, "warning", `Nenhuma cidade encontrada para “${nome}”. Confira a ortografia.`);
      return;
    }
    desenharCidades(el.resultadosBusca, cidades, carregarPrevisao, adicionarNaComparacao);
  } catch (erro) {
    mostrarAlerta(el.avisoBusca, "danger", erro.message, () => pesquisarCidade(nome));
  } finally {
    alternarBotao(el.botaoBuscar, false);
  }
}

el.formBusca.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const erro = validarNomeCidade(el.campoCidade.value);
  if (erro) {
    el.campoCidade.classList.add("is-invalid");
    mostrarAlerta(el.avisoBusca, "warning", erro);
    el.resultadosBusca.innerHTML = "";
    return;
  }
  el.campoCidade.classList.remove("is-invalid");
  pesquisarCidade(el.campoCidade.value.trim());
});

el.campoCidade.addEventListener("input", () => el.campoCidade.classList.remove("is-invalid"));

/* ---------- previsão completa (endpoints 2, 3 e 4) ---------- */

/** Mesmo período da previsão, um ano antes. */
function periodoAnoPassado(datas) {
  const recuar = (iso) => {
    const [a, m, d] = iso.split("-").map(Number);
    const data = new Date(a - 1, m - 1, d);
    return [data.getFullYear(), String(data.getMonth() + 1).padStart(2, "0"), String(data.getDate()).padStart(2, "0")].join("-");
  };
  return [recuar(datas[0]), recuar(datas[datas.length - 1])];
}

async function carregarPrevisao(cidade) {
  el.secaoPrevisao.classList.remove("d-none");
  el.secaoPrevisao.scrollIntoView({ behavior: "smooth", block: "start" });
  [el.agora, el.seteDias, el.chuva, el.ar, el.historico].forEach((p) =>
    mostrarCarregando(p, "Carregando...")
  );

  let previsao;
  try {
    previsao = await buscarPrevisao(cidade);
  } catch (erro) {
    [el.agora, el.seteDias, el.chuva, el.ar, el.historico].forEach((p) => (p.innerHTML = ""));
    mostrarAlerta(el.agora, "danger", erro.message, () => carregarPrevisao(cidade));
    return;
  }

  desenharAgora(el.agora, cidade, previsao);
  desenharSeteDias(el.seteDias, previsao);
  desenharChuvaPorHora(el.chuva, previsao);

  // Qualidade do ar e histórico são independentes: se um falhar, o resto continua.
  buscarQualidadeAr(cidade)
    .then((ar) => desenharQualidadeAr(el.ar, ar))
    .catch((erro) => mostrarAlerta(el.ar, "danger", erro.message, () => carregarPrevisao(cidade)));

  const [inicio, fim] = periodoAnoPassado(previsao.daily.time);
  buscarHistorico(cidade, inicio, fim)
    .then((hist) => desenharHistorico(el.historico, previsao, hist))
    .catch((erro) => mostrarAlerta(el.historico, "danger", erro.message, () => carregarPrevisao(cidade)));
}

/* ---------- comparação ---------- */

async function adicionarNaComparacao(cidade) {
  if (comparacao.some((i) => i.cidade.id === cidade.id)) {
    mostrarAlerta(el.avisoBusca, "info", `${cidade.name} já está na comparação.`);
    return;
  }
  if (comparacao.length >= MAX_COMPARACAO) {
    mostrarAlerta(el.avisoBusca, "warning", `Máximo de ${MAX_COMPARACAO} cidades. Remova uma para adicionar outra.`);
    return;
  }

  mostrarCarregando(el.avisoBusca, `Adicionando ${cidade.name}...`);
  try {
    const [previsao, ar] = await Promise.all([
      buscarPrevisao(cidade),
      buscarQualidadeAr(cidade).catch(() => null), // ar é opcional na comparação
    ]);
    comparacao.push({ cidade, previsao, ar });
    el.avisoBusca.innerHTML = "";
    desenharComparacao(el.comparacao, comparacao, removerDaComparacao);
    document.getElementById("comparar").scrollIntoView({ behavior: "smooth" });
  } catch (erro) {
    mostrarAlerta(el.avisoBusca, "danger", erro.message, () => adicionarNaComparacao(cidade));
  }
}

function removerDaComparacao(indice) {
  comparacao.splice(indice, 1);
  desenharComparacao(el.comparacao, comparacao, removerDaComparacao);
}

desenharComparacao(el.comparacao, comparacao, removerDaComparacao);
