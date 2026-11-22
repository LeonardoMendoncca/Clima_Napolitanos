# ClimaJá 🌦️

Aplicação web de clima: busca uma cidade e mostra o tempo agora, a previsão de 7 dias, a chance de chuva nas próximas 12 horas, a qualidade do ar e uma comparação com a mesma semana do ano passado. Também permite comparar até 3 cidades lado a lado.

Trabalho da disciplina **Aplicações Frontend** (Prof. Renan Costa Filgueiras) — somente HTML, CSS e JavaScript.

## Integrantes

| Nome completo | Matrícula |
|---|---|
| Leonardo De Mendonça | 202520551 |
| Davi Camamari | 202520051 |
| Victor Hugo Torres | 202511385 |

## Links

Não subimos os links nesse README, deixamos só no README enviado no portal do aluno

## Framework CSS

**Bootstrap 5.3** (via CDN) — grid (`container`, `row`, `col-*`), navbar com menu responsivo (`navbar-toggler`), cards, list-group, alerts, badges, progress, spinners e tabela. O `bootstrap.bundle.js` é usado apenas para o menu colapsável.

## APIs e endpoints

Todas da [Open-Meteo](https://open-meteo.com/) . Cada endpoint é um recurso diferente, todos com `GET`.

| # | Método | URL | Para que serve no sistema |
|---|---|---|---|
| 1 | GET | `https://geocoding-api.open-meteo.com/v1/search` | Busca cidades pelo nome e devolve coordenadas; alimenta a lista de resultados. |
| 2 | GET | `https://api.open-meteo.com/v1/forecast` | Clima atual, previsão de 7 dias e probabilidade de chuva por hora. |
| 3 | GET | `https://air-quality-api.open-meteo.com/v1/air-quality` | Índice de qualidade do ar (US AQI), PM2,5, PM10 e ozônio. |
| 4 | GET | `https://archive-api.open-meteo.com/v1/archive` | Temperaturas da mesma semana do ano passado, para comparar com a previsão. |

## Como usar

1. Digite o nome de uma cidade e clique em **Buscar**.
2. Na lista, clique em **Ver previsão** para abrir o clima completo, ou em **+ Comparar** para adicionar a cidade à comparação (máx. 3).
3. Na seção **Comparar cidades**, use o **×** do cartão para remover uma cidade.

## Tratamento de falhas

- Campo vazio, curto demais ou sem letras: aviso antes de chamar a API.
- Sem internet / API fora do ar: alerta na tela com botão **Tentar novamente**.
- Erro HTTP (400, 404, 429, 5xx): mensagem específica para cada caso.
- Busca sem resultado: aviso “Nenhuma cidade encontrada”.
- Indicador de carregamento e botão desativado durante a busca.

## Estrutura

```
index.html        página (header, nav, main, section, footer)
css/estilo.css    ajustes visuais sobre o Bootstrap
js/api.js         fetch dos 4 endpoints e tratamento de erro de rede/HTTP
js/ui.js          desenho dos dados na tela e alertas
js/app.js         eventos, validação e fluxo geral
```
