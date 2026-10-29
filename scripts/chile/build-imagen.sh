#!/bin/sh
# Construye y publica la imagen del fork chileno del frontend nuevo de Bahmni en un servidor de desarrollo, en su propia
# carpeta (~/build/bahmni-apps-frontend-chile), sin tocar lo que corre. Se corre desde el PC, en Windows PowerShell 5.1
# y desde cualquier carpeta (una sola línea; <servidor> es el alias de ~/.ssh/config, p. ej. bahmni-115):
#
#   & 'C:\Program Files\Git\bin\bash.exe' -c 'cd /c/Users/juanj/GitHub/juanjortega/bahmni-chile/bahmni-apps-frontend-chile && scp -q scripts/chile/build-imagen.sh <servidor>:build-imagen.sh && gh auth token | ssh <servidor> ''sh build-imagen.sh <commit> <etiqueta>; r=$?; rm -f build-imagen.sh; exit $r'''
#
# El script se copia y se corre como archivo para que stdin quede libre para el token.
#
# El token (read:packages para @juanjortega, write:packages para ghcr) llega por stdin. Se usa solo durante el build,
# en archivos 600 dentro de la carpeta (un .npmrc y una config de Docker propia, sin tocar el login del servidor), y se
# borra al terminar, pase lo que pase. webpack necesita ~5 GB: el build corre en un contenedor con tope de 6 GB.
set -eu
REF="$1"; TAG="$2"
IMG=ghcr.io/juanjortega/bahmni-apps-frontend-chile
D="$HOME/build/bahmni-apps-frontend-chile"
read -r TOKEN
mkdir -p "$HOME/build"
if [ ! -d "$D/.git" ]; then git clone -q --filter=blob:none https://github.com/juanjortega/bahmni-apps-frontend-chile.git "$D"; fi
cd "$D"
git fetch -q origin
git checkout -q -f "$REF"
git clean -q -fdx -e node_modules -e build.log
umask 077
trap 'rm -rf "$D/.npmrc-build" "$D/.docker-tmp"' EXIT
printf '//npm.pkg.github.com/:_authToken=%s\n' "$TOKEN" > .npmrc-build
export DOCKER_CONFIG="$D/.docker-tmp"
mkdir -p "$DOCKER_CONFIG"
printf '%s' "$TOKEN" | docker login ghcr.io -u juanjortega --password-stdin >/dev/null
unset TOKEN
echo "== install y build (contenedor node:22, tope 6 GB)"
docker run --rm --memory 6g --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -e NPM_CONFIG_USERCONFIG=/w/.npmrc-build -e NODE_OPTIONS=--max-old-space-size=5120 \
  -v "$D":/w -w /w node:22-alpine \
  sh -c 'node .yarn/releases/yarn-1.22.19.cjs install --frozen-lockfile --ignore-scripts --non-interactive >/tmp/install.log 2>&1 || { tail -30 /tmp/install.log; exit 1; }; node .yarn/releases/yarn-1.22.19.cjs nx build distro --skip-nx-cache > /w/build.log 2>&1; test -f distro/dist/index.html' || { grep -n -i -E "error|failed|killed|heap|ENOMEM" "$D/build.log" | grep -v "TS[0-9]*:" | tail -25; exit 1; }
rm -f .npmrc-build
echo "== widgets en el bundle: $(grep -rl clinical-widgets distro/dist | wc -l) archivo(s)"
echo "== imagen"
docker build -q -f docker/Dockerfile   --label org.opencontainers.image.source=https://github.com/juanjortega/bahmni-apps-frontend-chile -t "$IMG:$TAG" -t "$IMG:sha-$(git rev-parse --short=12 HEAD)" . >/dev/null
docker push -q "$IMG:$TAG"
docker push -q "$IMG:sha-$(git rev-parse --short=12 HEAD)"
docker image inspect "$IMG:$TAG" --format '{{.Id}} {{.Size}}'
