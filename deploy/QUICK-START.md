# Quick Start - Deployment NAS

## Passaggi Rapidi

### 1. Estrai l'archivio
```bash
tar -xf sa-ndo-ka-deployment-*.tar
cd sa-ndo-ka-deployment
```

### 2. Configura ambiente
```bash
cp .env.example .env
# Modifica .env con i tuoi valori:
# - NEXTAUTH_SECRET: genera con: openssl rand -base64 32
# - NEXTAUTH_URL: URL del tuo NAS (es. http://192.168.1.100)
```

### 3. Crea directory
```bash
mkdir -p data uploads nginx/ssl
```

### 4. Avvia
```bash
docker-compose up -d --build
```

### 5. Verifica
```bash
docker-compose logs -f app
```

## Variabili d'Ambiente Minime

```bash
NEXTAUTH_SECRET=<genera-con-openssl-rand-base64-32>
NEXTAUTH_URL=http://<IP-DEL-TUO-NAS>
DATABASE_URL=file:/app/data/sa-ndo-ka.db
```

## Note Importanti

- Il database viene creato automaticamente al primo avvio
- Gli uploads vengono salvati nella directory `uploads/`
- Per HTTPS, configura `DOMAIN` e usa il profilo `ssl` con Certbot

