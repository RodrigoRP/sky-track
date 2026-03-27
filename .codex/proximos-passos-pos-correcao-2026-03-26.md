# Pós-correções: o que fazer agora (SkyTrack)

Data: 2026-03-26

## 1) Validação das correções reportadas

Status validado no código:
- Contrato `user_id` corrigido em `alertsApi` e `pushNotifications`.
- Header usa usuário real com fallback.
- CTA `View Deal` ganhou navegação.
- Store ganhou sync backend (optimistic + chamadas API).
- Edge functions ganharam validação de ownership.

Checks locais:
- `npm test` ✅ (15/15)
- `npm run lint` ✅
- `npm run build` ✅

## 2) O que ainda pode quebrar em produção (prioridade alta)

1. Corrida de sincronização com IDs temporários
- Se usuário criar e deletar rápido antes do insert remoto confirmar, pode sobrar alerta “fantasma” no backend.
- Motivo: delete/update usam `id` local imediato; o ID real vem depois.

2. Testes ainda superficiais para navegação e sync
- `useNavDirection` segue com 1 único cenário.
- Não há testes de integração para create→sync→delete, nem fluxo de auth+store.

3. `View Deal` depende de `alertId`
- Quando notificação não tiver `alertId`, cai para `/alerts` (ok como fallback, mas ainda fraco como experiência final).

## 3) Próxima iteração recomendada (ordem)

1. Implementar camada de reconciliação offline/sync
- Criar `clientRequestId` por alerta e mapear tempId→serverId.
- Enfileirar operações pendentes (`create/update/delete`) e processar em ordem.

2. Aumentar cobertura de testes crítica
- Teste de corrida: create + delete antes de ack remoto.
- Teste de update/toggle em alerta ainda não reconciliado.
- Testes de `useNavDirection` (forward/back/same depth/deep link).

3. Fechar UX de deal
- Incluir `alertId` em todos os tipos de notificação no seed + backend.
- Definir destino único de `View Deal` (preferência: `/alert/:id`).

4. Instrumentar analytics mínimo (antes de escalar)
- Eventos: `alert_created`, `alert_sync_failed`, `deal_opened`, `notification_opened`, `booking_clicked`.

## 4) Decisão prática de hoje

Você já pode seguir para teste com usuários reais em ambiente controlado.
Mas antes de abrir mais tráfego, recomendo fechar o item de reconciliação de ID temporário (é o risco técnico mais provável de gerar inconsistência de dados).

