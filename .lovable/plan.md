
# Múltiplas contas por gateway com round-robin

## Objetivo
Permitir cadastrar várias contas do mesmo gateway (Asaas, Mercado Pago, PagBank, Pagar.me) e distribuir transações entre elas em round-robin, mantendo todas as configurações atuais funcionando.

## 1. Banco de dados

Nova tabela `gateway_accounts`:
- `id`, `gateway` (asaas|mercadopago|pagbank|pagarme), `label` (nome amigável: "Conta principal", "Conta 2"), `environment` (sandbox|production), `credentials` (jsonb), `active` (bool), `sort_order`, `last_used_at`, timestamps.
- Índice único parcial: `(gateway)` onde `is_primary = true` para garantir uma conta principal por gateway.
- RLS: apenas admins (SELECT/INSERT/UPDATE/DELETE).

Função RPC `pick_next_gateway_account(_gateway text)`:
- Seleciona entre contas ativas do gateway a com `last_used_at` mais antigo (round-robin justo).
- Atualiza `last_used_at = now()` na conta escolhida e devolve o registro.
- `SECURITY DEFINER` para uso em edge functions.

Migração de dados (via insert tool após migração schema):
- Para cada gateway existente, criar a primeira `gateway_account` com label "Conta principal", lendo credenciais atuais de `site_settings` (chaves `asaas_api_key`, `asaas_environment`, `mercadopago_access_token`, etc.) e empacotando em `credentials` jsonb.

## 2. Edge functions

Cada função de checkout (`asaas-checkout`, `payment-checkout` para MP/PagBank/Pagar.me) passa a:
1. Chamar `pick_next_gateway_account('<gateway>')` no início.
2. Usar credenciais do JSON retornado em vez de `Deno.env.get` ou `site_settings`.
3. Salvar o `gateway_account_id` no pedido para o webhook saber qual conta usar.

Webhooks (`asaas-webhook`, `mercadopago-webhook`, etc.) leem `orders.gateway_account_id`, buscam credenciais dessa conta para validar assinatura/consultar pagamento. Tabela `orders` ganha coluna `gateway_account_id` (uuid, nullable para histórico).

## 3. UI admin

Em `/admin/configuracoes/pagamento/:gateway` (ex: `AsaasSettings.tsx`):
- Acima do formulário, lista de contas cadastradas (cards) com: label, ambiente, status ativo/inativo, badge "Principal", botões editar/excluir/ativar.
- Botão **"+ Adicionar conta"** abre dialog (`AddGatewayAccountDialog`) com:
  - Campo label.
  - Seletor de ambiente.
  - Campos específicos do gateway (mesmos campos do form atual: api_key, webhook_secret, etc.).
  - Validação obrigatória.

A página de visão geral `/admin/configuracoes/pagamento` ganha contador de contas ativas por gateway no card.

Novo dialog separado **"Escolher banco"** acessível pelo botão "+" do grid 4-up (visualizado na imagem enviada): mostra os 4 gateways como cards, ao clicar abre o `AddGatewayAccountDialog` já filtrado para aquele gateway.

## 4. Componentes novos
- `src/components/admin/settings/payment/GatewayAccountList.tsx` — lista de contas + ações
- `src/components/admin/settings/payment/AddGatewayAccountDialog.tsx` — dialog com form dinâmico por gateway
- `src/components/admin/settings/payment/ChooseGatewayDialog.tsx` — dialog com 4 cards para escolher banco
- `src/lib/gatewayAccounts.ts` — helpers CRUD

## 5. Compatibilidade

- Configurações atuais em `site_settings` continuam intactas (não removemos nada).
- Migração cria a "Conta principal" lendo dessas chaves; após isso o checkout passa a usar `gateway_accounts` como fonte de verdade.
- Toggle de gateway ativo (`payment_gateway` em `site_settings`) continua determinando qual gateway é usado; o round-robin escolhe entre contas **dentro** desse gateway.

## Fora de escopo (pode vir depois)
- Round-robin entre gateways diferentes (já existe via fallback).
- Métricas por conta (volume, taxa de erro).
- Limites por conta (ex: parar de usar quando atingir X reais).

---

Aprova para eu começar pela migração + RPC e depois a UI?
