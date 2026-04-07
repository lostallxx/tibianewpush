# Tibia Push Trainer Roadmap

## Visao
Transformar o simulador atual em um treinador de mecanicas de PvP do Tibia, mantendo a fidelidade do push e preparando a base para multiplayer futuro.

## Fase 1 - Fundacao
- Separar regras, configuracao de treino e interface.
- Introduzir modos de treino e cenarios fixos.
- Registrar metricas de sessao: tentativas, pushes certos, melhor follow.
- Manter a mecanica atual de push como referencia.

## Fase 2 - Treino de verdade
- Adicionar objetivos por cenario.
- Salvar historico local de resultados.
- Criar repeticao instantanea do mesmo exercicio.
- Adicionar presets mais proximos de situacoes reais de PvP.
- Melhorar feedback visual e sonoro.

## Fase 3 - Conteudo
- Editor de cenario.
- Biblioteca de situacoes: open field, corredor, escada, trap, entrada de bomb.
- Modos dedicados: anti-push, mwall reaction, bomb clear, push race.

## Fase 4 - Arquitetura para multiplayer
- Isolar game state em uma engine serializavel.
- Tornar as acoes deterministicas.
- Criar log de eventos e replay.
- Preparar sincronizacao cliente/servidor.

## Fase 5 - Multiplayer
- Ghost replay.
- Desafios assincornos.
- Multiplayer em tempo real com servidor autoritativo.
