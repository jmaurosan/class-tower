# Scripts SQL legados

Estes 54 arquivos são o histórico de tentativas de correção do banco, de
`CORRECAO_RLS_ROBUSTA_V2` a `SOLUCAO_FINAL_LOGIN_V4`, incluindo dois que
desabilitam RLS por completo.

**Não execute nada aqui.** Eles não têm ordem, não são idempotentes entre si e
vários se contradizem — foi essa acumulação que deixou a tabela `encomendas`
com 7 policies e a `salas` com 6, várias delas `USING (true)`.

O estado atual e desejado do banco está em
[`../20260831120000_hardening_seguranca.sql`](../20260831120000_hardening_seguranca.sql),
escrito a partir da leitura do banco de produção. É a única migration que deve
ser aplicada.

Os arquivos ficam versionados apenas como registro histórico — útil para
entender por que uma policy existe. Podem ser apagados quando não fizerem mais
falta.
