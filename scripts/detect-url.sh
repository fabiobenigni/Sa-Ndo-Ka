#!/bin/sh
# Script per rilevare automaticamente l'URL corretto per NEXTAUTH_URL

# Se NEXTAUTH_URL è già impostato e non è localhost, usalo
if [ -n "$NEXTAUTH_URL" ] && [ "$NEXTAUTH_URL" != "http://localhost" ] && [ "$NEXTAUTH_URL" != "http://localhost:3000" ] && [ "$NEXTAUTH_URL" != "http://localhost:80" ]; then
  echo "$NEXTAUTH_URL"
  exit 0
fi

# Determina la porta e il protocollo
PORT="${HTTP_PORT:-80}"
PROTOCOL="http"

# Se HTTPS_PORT è impostato e diverso da vuoto, usa HTTPS
if [ -n "$HTTPS_PORT" ] && [ "$HTTPS_PORT" != "" ] && [ "$HTTPS_PORT" != "0" ]; then
  PORT="${HTTPS_PORT}"
  PROTOCOL="https"
fi

# Se DOMAIN è impostato e non è localhost, usalo (priorità alta)
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "" ]; then
  echo "${PROTOCOL}://${DOMAIN}"
  exit 0
fi

# Prova a rilevare l'IP della macchina host
# In Docker, il gateway di default è spesso l'IP host
HOST_IP=""

# Metodo 1: Usa host.docker.internal (funziona su Docker Desktop)
if command -v getent >/dev/null 2>&1; then
  HOST_IP=$(getent hosts host.docker.internal 2>/dev/null | awk '{print $1}' | head -n1)
fi

# Metodo 2: Usa il gateway Docker (più affidabile in Docker Linux)
if [ -z "$HOST_IP" ] && command -v ip >/dev/null 2>&1; then
  # Il gateway di default è spesso l'IP della macchina host
  GATEWAY=$(ip route | grep default | awk '{print $3}' | head -n1)
  # Filtra IPv6 e IP Docker interni, preferisci IPv4
  if [ -n "$GATEWAY" ] && [ "$GATEWAY" != "172.17.0.1" ] && [ "$GATEWAY" != "127.0.0.1" ] && [ "$GATEWAY" != "::" ]; then
    # Verifica che non sia un IPv6 (contiene :)
    if echo "$GATEWAY" | grep -vq ":"; then
      HOST_IP="$GATEWAY"
    fi
  fi
fi

# Metodo 3: Usa hostname -I se disponibile (IP del container, non host)
# Questo non è ideale ma può essere utile in alcuni casi
if [ -z "$HOST_IP" ] && command -v hostname >/dev/null 2>&1; then
  CONTAINER_IP=$(hostname -I | awk '{print $1}' | head -n1)
  # Se l'IP del container non è 172.x.x.x o 127.x.x.x, potrebbe essere utile
  if [ -n "$CONTAINER_IP" ] && [ "$CONTAINER_IP" != "127.0.0.1" ]; then
    # Estrai la subnet (es. 192.168.1.x da 192.168.1.5)
    SUBNET=$(echo "$CONTAINER_IP" | cut -d'.' -f1-3)
    # Prova a usare .1 come IP host (comune nelle reti domestiche)
    HOST_IP="${SUBNET}.1"
  fi
fi

# Se abbiamo un IP valido, usalo (solo IPv4, non IPv6)
if [ -n "$HOST_IP" ] && [ "$HOST_IP" != "127.0.0.1" ] && [ "$HOST_IP" != "localhost" ] && [ "$HOST_IP" != "172.17.0.1" ]; then
  # Verifica che non sia un IPv6 (contiene :)
  if echo "$HOST_IP" | grep -vq ":"; then
    # Sempre includi la porta per evitare problemi con NextAuth
    echo "${PROTOCOL}://${HOST_IP}:${PORT}"
    exit 0
  fi
fi

# Fallback: usa localhost con la porta corretta
if [ "$PORT" = "80" ]; then
  echo "http://localhost"
else
  echo "http://localhost:${PORT}"
fi

