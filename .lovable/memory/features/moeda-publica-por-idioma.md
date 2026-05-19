---
name: Public currency by language
description: Site público troca moeda conforme idioma (pt→R$, en→US$, es→€) com taxas via exchangerate.host
type: feature
---

Hook: `usePublicCurrency()` em `src/lib/publicCurrency.ts`. Mapeamento fixo `LANG_TO_CURRENCY`: pt=BRL, en=USD, es=EUR. Taxas buscadas de `https://api.exchangerate.host/latest?base=BRL&symbols=USD,EUR` (sem chave), cacheadas em `localStorage` (`public_currency_rates_v1`) por 24h. Fallback `DEFAULT_RATES` se API falhar.

API: `{ currency, locale, symbol, isBRL, rate, convert(brl), format(brl) }`. Sempre passar valor em **BRL**.

Usado em: `Catalog`, `Index`, `CartPage`, `Checkout`, `CombosSection`, `FlashOffersWidget`, `UpsellSection`, `ProductRecommendations`. `ProductCheckout` ainda usa R$ hardcoded — atualizar se necessário.

**Importante:** cobrança real continua em BRL (gateways só BR). Checkout mostra aviso "Valores convertidos para referência. A cobrança é processada em Reais (BRL)" quando moeda != BRL.

Não confundir com `useAdminCurrency()` (switcher manual no painel admin).
