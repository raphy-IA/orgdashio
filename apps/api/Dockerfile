# OrgDashio — API (NestJS). Image unique (build + runtime).
# Garde les outils DB (drizzle-kit, tsx) pour que les commandes du repo marchent :
#   docker compose exec api pnpm db:push
#   docker compose exec api pnpm db:restore:test
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY infra ./infra
RUN pnpm install --frozen-lockfile
# turbo respecte turbo.json ("build" -> dependsOn ["^build"]) : @orgdashio/shared
# est buildé AVANT @orgdashio/api (sinon nest build échoue : shared/dist absent).
RUN pnpm exec turbo run build --filter=@orgdashio/api
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@orgdashio/api", "start"]
