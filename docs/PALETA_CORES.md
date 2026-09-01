# 🎨 Guia de Cores - Class Tower Business

Este documento descreve a paleta de cores utilizada no projeto **Class Tower**, focada em um design executivo, moderno e de alta legibilidade (Dark & Light Mode).

---

## 🔝 Cor de Identidade (Primary)

A cor principal do projeto é um **Verde Petróleo (Teal)** profundo, que transmite confiança e profissionalismo.

| Cor | Hexadecimal | Variável CSS | Uso |
| :--- | :--- | :--- | :--- |
| **Primary** | `#0f756f` | `--primary` | Botões, ícones ativos, marca. |

---

## 🌑 Tema Escuro (Dark Mode)

Utilizamos tons de cinza azulado (Slate/Zinc) para criar profundidade e reduzir o cansaço visual.

| Amostra | Hexadecimal | Nome Tailwind | Uso |
| :--- | :--- | :--- | :--- |
| ⬛ | `#1d222a` | `dark:bg-[#1d222a]` | Fundo do Sidebar e Cards. |
| ⬛ | `#0f172a` | `bg-slate-900` | Fundo principal (Tema Escuro). |
| 🔘 | `#1e293b` | `border-slate-800` | Linhas de divisão e bordas. |

---

## 🚦 Cores Semânticas (Estados)

Seguimos a convenção de estados para facilitar a compreensão imediata do usuário.

| Estado | Cor Representativa | Classe Tailwind | Objetivo |
| :--- | :--- | :--- | :--- |
| **Sucesso** | Emerald (Esmeralda) | `emerald-400/500` | Sistema online, conclusões. |
| **Atenção** | Amber (Âmbar) | `amber-400/500` | Vistorias pendentes, alertas. |
| **Crítico** | Red (Vermelho) | `red-500/600` | Vencimentos urgentes, erros. |
| **Info** | Blue (Azul) | `blue-400/500` | Agendamentos, informativos. |

---

## ⌨️ Tipografia e Neutros

| Tom | Hexadecimal | Nome Tailwind | Uso |
| :--- | :--- | :--- | :--- |
| **Título** | `#0f172a` | `text-slate-900` | Títulos em Modo Claro. |
| **Corpo** | `#64748b` | `text-slate-500` | Textos de apoio e legendas. |
| **Gelo** | `#f8fafc` | `bg-slate-50` | Fundo de hover/interação. |
| **Borda** | `#e2e8f0` | `border-slate-200` | Divisores em Modo Claro. |

---

## 🚀 Como usar no CSS/Tailwind

### CSS Puro
```css
:root {
  --primary: #0f756f;
}
```

### Tailwind Config (Exemplo)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#0f756f',
      },
      backgroundColor: {
        'dark-sidebar': '#1d222a',
      }
    },
  },
}
```

---

> **Dica de Design:** O projeto utiliza gradientes sutis e efeitos de desfoque (backdrop-blur) combinados com essas cores para criar o visual premium.
