/**
 * ui.js — funções que desenham dados na tela e mostram avisos.
 * Não faz requisições; só recebe dados prontos.
 */

const CODIGOS_CLIMA = {
  0: ["Céu limpo", "☀️"],
  1: ["Quase limpo", "🌤️"],
  2: ["Parcialmente nublado", "⛅"],
  3: ["Nublado", "☁️"],
  45: ["Neblina", "🌫️"],
  48: ["Neblina com geada", "🌫️"],
  51: ["Garoa fraca", "🌦️"],
  53: ["Garoa", "🌦️"],
  55: ["Garoa forte", "🌦️"],
  61: ["Chuva fraca", "🌧️"],
  63: ["Chuva", "🌧️"],
  65: ["Chuva forte", "🌧️"],
  66: ["Chuva congelante", "🌧️"],
  67: ["Chuva congelante forte", "🌧️"],
  71: ["Neve fraca", "🌨️"],
  73: ["Neve", "🌨️"],
  75: ["Neve forte", "❄️"],
  77: ["Grãos de neve", "🌨️"],
  80: ["Pancadas leves", "🌦️"],
  81: ["Pancadas de chuva", "🌧️"],
  82: ["Pancadas fortes", "⛈️"],
  85: ["Pancadas de neve", "🌨️"],
  86: ["Pancadas de neve fortes", "❄️"],
  95: ["Tempestade", "⛈️"],
  96: ["Tempestade com granizo", "⛈️"],
  99: ["Tempestade com granizo forte", "⛈️"],
};

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function descreverClima(codigo) {
  const [texto, icone] = CODIGOS_CLIMA[codigo] || ["Condição desconhecida", "🌡️"];
  return { texto, icone };
}

/** Evita injetar HTML vindo da API. */
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = String(texto ?? "");
  return div.innerHTML;
}

function arredondar(valor) {
  return valor === null || valor === undefined ? "–" : Math.round(valor);
}

/** "2026-11-22" -> "dom 22/11" (sem mexer em fuso horário). */
function formatarDia(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return `${DIAS_SEMANA[data.getDay()]} ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`;
}

function nomeCompleto(cidade) {
  return [cidade.name, cidade.admin1, cidade.country].filter(Boolean).join(", ");
}

/* ---------- avisos ---------- */

/** Mostra alerta do Bootstrap dentro de um container, com botão opcional de retry. */
function mostrarAlerta(container, tipo, mensagem, aoTentarNovamente = null) {
  container.innerHTML = `
    <div class="alert alert-${tipo} d-flex flex-column flex-sm-row align-items-sm-center gap-2 mb-0" role="alert">
      <div class="flex-grow-1">${escapar(mensagem)}</div>
      ${aoTentarNovamente ? '<button type="button" class="btn btn-sm btn-outline-dark">Tentar novamente</button>' : ""}
    </div>`;
  if (aoTentarNovamente) {
    container.querySelector("button").addEventListener("click", aoTentarNovamente);
  }
}

function mostrarCarregando(container, texto) {
  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 text-secondary py-3" role="status">
      <div class="spinner-border spinner-border-sm" aria-hidden="true"></div>
      <span>${escapar(texto)}</span>
    </div>`;
}

/** Desativa o botão e mostra spinner enquanto a requisição roda. */
function alternarBotao(botao, ocupado, textoOcupado = "Carregando...") {
  if (!botao.dataset.textoOriginal) botao.dataset.textoOriginal = botao.innerHTML;
  botao.disabled = ocupado;
  botao.innerHTML = ocupado
    ? `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>${escapar(textoOcupado)}`
    : botao.dataset.textoOriginal;
}

/* ---------- lista de cidades encontradas ---------- */

function desenharCidades(container, cidades, aoVer, aoComparar) {
  container.innerHTML = "";
  const lista = document.createElement("div");
  lista.className = "list-group shadow-sm";

  cidades.forEach((cidade) => {
    const item = document.createElement("div");
    item.className =
      "list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2";
    item.innerHTML = `
      <div>
        <strong>${escapar(cidade.name)}</strong>
        <div class="small text-secondary">${escapar([cidade.admin1, cidade.country].filter(Boolean).join(", "))}</div>
      </div>
      <div class="btn-group btn-group-sm" role="group">
        <button type="button" class="btn btn-primary" data-acao="ver">Ver previsão</button>
        <button type="button" class="btn btn-outline-primary" data-acao="comparar">+ Comparar</button>
      </div>`;
    item.querySelector('[data-acao="ver"]').addEventListener("click", () => aoVer(cidade));
    item.querySelector('[data-acao="comparar"]').addEventListener("click", () => aoComparar(cidade));
    lista.appendChild(item);
  });
  container.appendChild(lista);
}

/* ---------- clima atual ---------- */

function desenharAgora(container, cidade, previsao) {
  const atual = previsao.current;
  const { texto, icone } = descreverClima(atual.weather_code);
  const hoje = previsao.daily;

  container.innerHTML = `
    <div class="card card-clima h-100 shadow-sm">
      <div class="card-body">
        <h3 class="h5 mb-0">${escapar(nomeCompleto(cidade))}</h3>
        <p class="text-secondary small">${atual.is_day ? "Dia" : "Noite"} · agora</p>
        <div class="d-flex align-items-center gap-3">
          <span class="icone-grande" aria-hidden="true">${icone}</span>
          <div>
            <div class="temperatura-grande">${arredondar(atual.temperature_2m)}°C</div>
            <div>${escapar(texto)}</div>
          </div>
        </div>
        <div class="row row-cols-2 g-2 mt-3 small">
          <div class="col"><span class="text-secondary">Sensação</span><br><strong>${arredondar(atual.apparent_temperature)}°C</strong></div>
          <div class="col"><span class="text-secondary">Umidade</span><br><strong>${arredondar(atual.relative_humidity_2m)}%</strong></div>
          <div class="col"><span class="text-secondary">Vento</span><br><strong>${arredondar(atual.wind_speed_10m)} km/h</strong></div>
          <div class="col"><span class="text-secondary">Chuva agora</span><br><strong>${atual.precipitation} mm</strong></div>
          <div class="col"><span class="text-secondary">Máx / mín hoje</span><br><strong>${arredondar(hoje.temperature_2m_max[0])}° / ${arredondar(hoje.temperature_2m_min[0])}°</strong></div>
          <div class="col"><span class="text-secondary">Índice UV</span><br><strong>${arredondar(hoje.uv_index_max[0])}</strong></div>
        </div>
      </div>
    </div>`;
}

/* ---------- 7 dias ---------- */

function desenharSeteDias(container, previsao) {
  const d = previsao.daily;
  const itens = d.time
    .map((dia, i) => {
      const { texto, icone } = descreverClima(d.weather_code[i]);
      return `
        <li class="list-group-item d-flex align-items-center gap-2">
          <span class="dia-semana fw-semibold">${formatarDia(dia)}</span>
          <span aria-hidden="true">${icone}</span>
          <span class="flex-grow-1 small d-none d-sm-inline">${escapar(texto)}</span>
          <span class="badge text-bg-info ms-auto">💧 ${arredondar(d.precipitation_probability_max[i])}%</span>
          <span class="text-nowrap"><strong>${arredondar(d.temperature_2m_max[i])}°</strong>
            <span class="text-secondary">${arredondar(d.temperature_2m_min[i])}°</span></span>
        </li>`;
    })
    .join("");
  container.innerHTML = `<ul class="list-group shadow-sm">${itens}</ul>`;
}

/* ---------- chuva nas próximas horas ---------- */

function desenharChuvaPorHora(container, previsao) {
  const { time, precipitation_probability: prob } = previsao.hourly;
  const horaAtual = previsao.current.time.slice(0, 13) + ":00";
  let inicio = time.findIndex((t) => t >= horaAtual);
  if (inicio < 0) inicio = 0;

  const linhas = [];
  for (let i = inicio; i < inicio + 12 && i < time.length; i++) {
    const valor = prob[i] ?? 0;
    const cor = valor >= 60 ? "bg-primary" : valor >= 30 ? "bg-info" : "bg-secondary";
    linhas.push(`
      <div class="d-flex align-items-center gap-2 mb-2">
        <span class="hora small">${time[i].slice(11, 16)}</span>
        <div class="progress flex-grow-1" role="progressbar" aria-label="Chance de chuva às ${time[i].slice(11, 16)}"
             aria-valuenow="${valor}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar ${cor}" style="width:${valor}%"></div>
        </div>
        <span class="small percentual text-end">${valor}%</span>
      </div>`);
  }
  const maximo = Math.max(...prob.slice(inicio, inicio + 12).map((v) => v ?? 0));
  const resumo =
    maximo >= 60 ? "☔ Leve guarda-chuva: chuva provável nas próximas horas."
    : maximo >= 30 ? "🌂 Há alguma chance de chuva nas próximas horas."
    : "😎 Baixa chance de chuva nas próximas 12 horas.";

  container.innerHTML = `
    <div class="card shadow-sm"><div class="card-body">
      <p class="fw-semibold mb-3">${resumo}</p>${linhas.join("")}
    </div></div>`;
}

/* ---------- qualidade do ar ---------- */

function classificarAr(indice) {
  if (indice === null || indice === undefined) return { texto: "Sem dado", classe: "secondary" };
  if (indice <= 50) return { texto: "Boa", classe: "success" };
  if (indice <= 100) return { texto: "Moderada", classe: "warning" };
  if (indice <= 150) return { texto: "Ruim para sensíveis", classe: "orange" };
  if (indice <= 200) return { texto: "Ruim", classe: "danger" };
  return { texto: "Muito ruim", classe: "dark" };
}

function desenharQualidadeAr(container, ar) {
  const atual = ar.current;
  const nivel = classificarAr(atual.us_aqi);
  container.innerHTML = `
    <div class="card shadow-sm"><div class="card-body">
      <div class="d-flex align-items-center gap-3 mb-3">
        <span class="badge fs-4 text-bg-${nivel.classe}">${arredondar(atual.us_aqi)}</span>
        <div><div class="fw-semibold">Qualidade do ar: ${nivel.texto}</div>
        <div class="small text-secondary">Índice US AQI</div></div>
      </div>
      <div class="row row-cols-3 g-2 small text-center">
        <div class="col"><span class="text-secondary">PM2,5</span><br><strong>${arredondar(atual.pm2_5)} µg/m³</strong></div>
        <div class="col"><span class="text-secondary">PM10</span><br><strong>${arredondar(atual.pm10)} µg/m³</strong></div>
        <div class="col"><span class="text-secondary">Ozônio</span><br><strong>${arredondar(atual.ozone)} µg/m³</strong></div>
      </div>
    </div></div>`;
}

/* ---------- mesma semana no ano passado ---------- */

function desenharHistorico(container, previsao, historico) {
  const prev = previsao.daily;
  const hist = historico.daily;
  const linhas = prev.time
    .map((dia, i) => {
      const maxAntes = hist.temperature_2m_max[i];
      const diferenca =
        maxAntes === null || maxAntes === undefined ? null : prev.temperature_2m_max[i] - maxAntes;
      const sinal = diferenca === null ? "–" : `${diferenca > 0 ? "+" : ""}${diferenca.toFixed(1)}°`;
      const classe = diferenca === null ? "text-secondary" : diferenca > 0 ? "text-danger" : "text-primary";
      return `
        <tr>
          <td>${formatarDia(dia)}</td>
          <td>${arredondar(prev.temperature_2m_max[i])}° / ${arredondar(prev.temperature_2m_min[i])}°</td>
          <td>${arredondar(maxAntes)}° / ${arredondar(hist.temperature_2m_min[i])}°</td>
          <td class="${classe} fw-semibold">${sinal}</td>
        </tr>`;
    })
    .join("");

  container.innerHTML = `
    <div class="card shadow-sm"><div class="card-body p-2 p-sm-3">
      <table class="table table-sm align-middle mb-0 small">
        <thead><tr><th>Dia</th><th>Previsto (máx/mín)</th><th>Ano passado</th><th>Dif. máx</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div></div>`;
}

/* ---------- comparação entre cidades ---------- */

function desenharComparacao(container, itens, aoRemover) {
  if (itens.length === 0) {
    mostrarAlerta(container, "light", "Nenhuma cidade na comparação. Busque uma cidade e clique em “+ Comparar”.");
    return;
  }

  const cartoes = itens
    .map(({ cidade, previsao, ar }, indice) => {
      const { texto, icone } = descreverClima(previsao.current.weather_code);
      const nivel = classificarAr(ar ? ar.current.us_aqi : null);
      return `
        <div class="col">
          <div class="card card-clima h-100 shadow-sm"><div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <h3 class="h6">${escapar(nomeCompleto(cidade))}</h3>
              <button type="button" class="btn-close" aria-label="Remover ${escapar(cidade.name)}" data-remover="${indice}"></button>
            </div>
            <div class="fs-1">${icone} ${arredondar(previsao.current.temperature_2m)}°C</div>
            <div class="small mb-2">${escapar(texto)}</div>
            <ul class="list-unstyled small mb-0">
              <li>Máx / mín hoje: <strong>${arredondar(previsao.daily.temperature_2m_max[0])}° / ${arredondar(previsao.daily.temperature_2m_min[0])}°</strong></li>
              <li>Chance de chuva hoje: <strong>${arredondar(previsao.daily.precipitation_probability_max[0])}%</strong></li>
              <li>Umidade: <strong>${arredondar(previsao.current.relative_humidity_2m)}%</strong></li>
              <li>Vento: <strong>${arredondar(previsao.current.wind_speed_10m)} km/h</strong></li>
              <li>Ar: <strong>${ar ? `${nivel.texto} (${arredondar(ar.current.us_aqi)})` : "indisponível"}</strong></li>
            </ul>
          </div></div>
        </div>`;
    })
    .join("");

  container.innerHTML = `<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">${cartoes}</div>`;
  container.querySelectorAll("[data-remover]").forEach((botao) =>
    botao.addEventListener("click", () => aoRemover(Number(botao.dataset.remover)))
  );
}
