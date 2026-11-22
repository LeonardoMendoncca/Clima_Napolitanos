/**
 * api.js — camada de acesso à Open-Meteo (somente fetch, sem bibliotecas).
 * Cada função abaixo consome UM endpoint diferente.
 */

const ENDPOINTS = {
  geocodificacao: "https://geocoding-api.open-meteo.com/v1/search",
  previsao: "https://api.open-meteo.com/v1/forecast",
  qualidadeAr: "https://air-quality-api.open-meteo.com/v1/air-quality",
  historico: "https://archive-api.open-meteo.com/v1/archive",
};

/** Erro com tipo ("rede" ou "http") para a interface escolher a mensagem. */
class ApiError extends Error {
  constructor(tipo, mensagem, status = null) {
    super(mensagem);
    this.tipo = tipo;
    this.status = status;
  }
}

/** Faz o GET, trata queda de conexão e erro HTTP, e devolve o JSON. */
async function buscarJson(url, parametros) {
  let resposta;
  try {
    resposta = await fetch(`${url}?${new URLSearchParams(parametros)}`);
  } catch (erro) {
    throw new ApiError(
      "rede",
      "Não foi possível conectar ao serviço de clima. Verifique sua internet."
    );
  }

  if (!resposta.ok) {
    throw new ApiError("http", mensagemPorStatus(resposta.status), resposta.status);
  }
  return resposta.json();
}

function mensagemPorStatus(status) {
  if (status === 400) return "Os dados enviados à API são inválidos (erro 400).";
  if (status === 404) return "Recurso não encontrado na API (erro 404).";
  if (status === 429) return "Muitas consultas seguidas. Aguarde um instante (erro 429).";
  if (status >= 500) return `O serviço de clima está com problemas (erro ${status}).`;
  return `A API respondeu com erro ${status}.`;
}

/** Endpoint 1 — GET /v1/search: procura cidades pelo nome. */
async function buscarCidades(nome) {
  const dados = await buscarJson(ENDPOINTS.geocodificacao, {
    name: nome,
    count: 6,
    language: "pt",
    format: "json",
  });
  return dados.results || []; // sem resultados a API omite "results"
}

/** Endpoint 2 — GET /v1/forecast: clima atual, 7 dias e chuva por hora. */
function buscarPrevisao(cidade) {
  return buscarJson(ENDPOINTS.previsao, {
    latitude: cidade.latitude,
    longitude: cidade.longitude,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max",
    hourly: "precipitation_probability",
    forecast_days: 7,
    timezone: "auto",
  });
}

/** Endpoint 3 — GET /v1/air-quality: índice de qualidade do ar atual. */
function buscarQualidadeAr(cidade) {
  return buscarJson(ENDPOINTS.qualidadeAr, {
    latitude: cidade.latitude,
    longitude: cidade.longitude,
    current: "us_aqi,pm2_5,pm10,ozone",
    timezone: "auto",
  });
}

/** Endpoint 4 — GET /v1/archive: temperaturas e chuva de um período passado. */
function buscarHistorico(cidade, dataInicio, dataFim) {
  return buscarJson(ENDPOINTS.historico, {
    latitude: cidade.latitude,
    longitude: cidade.longitude,
    start_date: dataInicio,
    end_date: dataFim,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
  });
}
