# ==========================================
# Tutor de Turma — Frontend (React + Vite)
# Build do Vite servido por nginx (SPA estático).
# ==========================================

# ---- Estágio de build ----
FROM node:22-slim AS builder
WORKDIR /app

# pnpm na versão do projeto (packageManager)
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Instala dependências primeiro (cache). O patch do wouter (patchedDependencies)
# precisa estar presente já no install.
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# Código-fonte + build
COPY . .
# URL da API Python é embutida no bundle em tempo de build (Vite).
# O navegador do usuário acessa a API — por isso aponta para o host publicado.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm exec vite build

# ---- Estágio de runtime (nginx) ----
FROM nginx:alpine AS runner
COPY --from=builder /app/dist/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
