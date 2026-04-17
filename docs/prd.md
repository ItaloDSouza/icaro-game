# PRD — MVP Browser — Jogo do Ícaro (Token-Efficient / SDD Ready)

## 0. Objetivo

Criar um MVP web (browser) para validar comportamento, atenção e interação de uma criança (Ícaro, 5 anos) com estímulos visuais, movimento, rostos reais e escolhas simples, com coleta de telemetria.

Este PRD deve ser tratado como **fonte única de verdade**.

---

## 1. Contexto do Usuário

### Perfil

* 5 anos
* TEA + suspeita de TDAH
* baixa produção de fala
* boa resposta a rostos reais

### Padrões observados

* atenção periférica (olhar lateral)
* interesse em movimento contínuo (água, bolhas, drone, pistas)
* autoestimulação com objetos em movimento
* usa tela como âncora (não foco direto)
* interesse forte por água e dinâmica física

### Implicações

* movimento > conteúdo estático
* interação simples
* poucas opções por tela
* sem punição
* feedback positivo imediato
* sessões curtas

---

## 2. Objetivo do MVP

Validar:

1. O que prende mais atenção:

   * movimento
   * rostos reais
   * escolha interativa

2. Como ele interage:

   * onde clica
   * quanto tempo permanece
   * padrão de repetição

3. Se há resposta a:

   * áudio associado a rostos
   * escolhas simples (banheiro)

---

## 3. Escopo

### Incluído

* 3 telas:

  * Movimento
  * Rostos reais
  * Banheiro
* navegação simples
* telemetria local
* painel de debug
* execução via browser (desktop/tablet)

### Fora do escopo

* backend
* login
* persistência remota
* gamificação complexa
* múltiplos níveis

---

## 4. Princípios de Design

### Obrigatório

* simples
* previsível
* poucos elementos (máx 4 por tela)
* sem sobrecarga sensorial
* resposta imediata ao toque
* sem punição

### Proibido

* sons agressivos
* telas poluídas
* feedback negativo explícito
* textos longos
* tempo limite

---

## 5. Arquitetura Técnica

* Stack: React + Vite
* Estado: simples (Context ou store leve)
* Render:

  * Canvas (movimento)
  * DOM (resto)
* Áudio: HTMLAudio
* Telemetria: serviço local (JSON em memória)

---

## 6. Telemetria (Obrigatória)

### Eventos

* screen_enter
* screen_exit
* click (posição + alvo)
* choice_selected
* audio_play

### Métricas derivadas

* tempo por tela
* cliques por tela
* elemento mais clicado
* sequência de interação
* tempo até abandono

### Estrutura

```json
{
  "sessionId": "uuid",
  "events": [],
  "screens": {
    "movement": {},
    "family": {},
    "bathroom": {}
  }
}
```

---

## 7. Telas

### 7.1 Movement Screen

#### Objetivo

Prender atenção via movimento contínuo e previsível

#### Elementos

* fundo neutro
* bolhas subindo
* água oscilando

#### Interação

* clique:

  * aumenta movimento
  * gera bolha
  * toca som leve

#### Critérios de aceite

* animação contínua
* resposta < 100ms
* cliques registrados

---

### 7.2 Family Screen

#### Objetivo

Associar rosto → som

#### Elementos

* 3 fotos reais:

  * pai
  * mãe
  * Ícaro

#### Interação

* clique:

  * toca áudio ("papai", etc.)
  * destaque visual leve

#### Critérios de aceite

* áudio instantâneo
* múltiplos cliques funcionam
* eventos registrados

---

### 7.3 Bathroom Screen

#### Objetivo

Introduzir escolha correta sem frustração

#### Elementos

* vaso 🚽
* box 🚿

#### Interação

* vaso:

  * feedback positivo
* box:

  * redirecionamento suave (sem punição)

#### Critérios de aceite

* nenhuma resposta negativa
* escolha registrada

---

## 8. Navegação

* fluxo linear:
  Movement → Family → Bathroom
* botão simples "próximo"
* retorno permitido

---

## 9. Painel Debug

### Ativação

* tecla (ex: D)

### Exibir

* tempo por tela
* número de cliques
* último evento

### Função

* exportar JSON

---

## 10. Critérios Globais de Aceite

* carrega < 2s
* sem travamentos
* funciona em browser desktop
* telemetria consistente

---

## 11. Backlog Inicial

### DEV-1 — Setup projeto

### QA-1 — Validar setup

### DEV-2 — Tela Movement

### QA-2 — Validar Movement

### DEV-3 — Tela Family

### QA-3 — Validar Family

### DEV-4 — Tela Bathroom

### QA-4 — Validar Bathroom

### DEV-5 — Telemetria

### QA-5 — Validar Telemetria

### DEV-6 — Painel Debug

### QA-6 — Validar Debug

---

## 12. Regras para Agentes

### Geral

* não ler arquivos desnecessários
* usar PRD como fonte principal
* evitar respostas longas

### PO

* quebrar tarefas pequenas
* manter PRD atualizado

### Orquestrador

* garantir fluxo DEV → QA → BUG → DONE

### DEV

* implementar apenas o card
* não expandir escopo

### QA

* validar apenas critérios de aceite
* abrir BUG objetivo

---

## 13. Definition of Done

* critérios atendidos
* QA aprovado
* telemetria funcionando
* PR mergeado

---

## 14. Próximo Passo

Gerar issues no GitHub com base no backlog e iniciar DEV-1
